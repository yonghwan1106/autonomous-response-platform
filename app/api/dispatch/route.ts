import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { calculateRoute } from '@/lib/kakao/geocoding'

export async function POST(request: NextRequest) {
  try {
    const { disasterId, disasterLocation } = await request.json()

    if (!disasterId || !disasterLocation) {
      return NextResponse.json(
        { error: 'Disaster ID and location are required' },
        { status: 400 }
      )
    }

    const { lat, lng } = disasterLocation

    // PostGIS를 사용하여 가장 가까운 선발대 기지 찾기
    const { data: nearestBase, error: baseError } = await supabase
      .rpc('find_nearest_base', {
        disaster_lat: lat,
        disaster_lng: lng
      })

    if (baseError || !nearestBase || nearestBase.length === 0) {
      // RPC가 없는 경우를 위한 대체 방법
      const { data: bases, error: basesError } = await supabase
        .from('response_bases')
        .select('*')
        .eq('available', true)

      if (basesError || !bases || bases.length === 0) {
        return NextResponse.json(
          { error: 'No available response base found' },
          { status: 404 }
        )
      }

      // 단순 거리 계산으로 가장 가까운 기지 찾기
      const baseWithDistance = bases.map(base => {
        const baseLng = base.location.coordinates[0]
        const baseLat = base.location.coordinates[1]
        const distance = Math.sqrt(
          Math.pow(baseLat - lat, 2) + Math.pow(baseLng - lng, 2)
        )
        return { ...base, distance }
      }).sort((a, b) => a.distance - b.distance)[0]

      // 모선 차량 배정
      const baseLocation = {
        lat: baseWithDistance.location.coordinates[1],
        lng: baseWithDistance.location.coordinates[0]
      }

      // 경로 계산 (카카오 길찾기 API - 선택사항)
      let route = null
      try {
        route = await calculateRoute(baseLocation, disasterLocation)
      } catch (err) {
        console.log('Route calculation failed, using straight line')
      }

      // 모선 차량 생성
      const { data: mothership, error: mothershipError } = await supabase
        .from('response_units')
        .insert({
          disaster_id: disasterId,
          base_id: baseWithDistance.id,
          unit_type: 'mothership',
          status: 'deployed',
          current_location: `POINT(${baseLocation.lng} ${baseLocation.lat})`,
          route: route || {
            start: baseLocation,
            end: disasterLocation,
            waypoints: [baseLocation, disasterLocation]
          }
        })
        .select()
        .single()

      if (mothershipError) {
        console.error('Error creating mothership:', mothershipError)
        return NextResponse.json(
          { error: 'Failed to dispatch mothership' },
          { status: 500 }
        )
      }

      // 드론과 로봇 생성 (모선에서 출발)
      const unitsToCreate = [
        {
          disaster_id: disasterId,
          base_id: baseWithDistance.id,
          unit_type: 'drone',
          status: 'standby',
          current_location: `POINT(${baseLocation.lng} ${baseLocation.lat})`
        },
        {
          disaster_id: disasterId,
          base_id: baseWithDistance.id,
          unit_type: 'robot',
          status: 'standby',
          current_location: `POINT(${baseLocation.lng} ${baseLocation.lat})`
        }
      ]

      const { data: units, error: unitsError } = await supabase
        .from('response_units')
        .insert(unitsToCreate)
        .select()

      if (unitsError) {
        console.error('Error creating support units:', unitsError)
      }

      return NextResponse.json({
        success: true,
        base: baseWithDistance,
        mothership,
        supportUnits: units || []
      })
    }

    return NextResponse.json({
      success: true,
      base: nearestBase[0]
    })
  } catch (error) {
    console.error('Error dispatching response units:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

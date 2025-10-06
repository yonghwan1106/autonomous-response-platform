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

      // 간단한 경로 생성 (직선 경로를 3개 포인트로 나눔)
      const route = [
        { lat: baseLocation.lat, lng: baseLocation.lng },
        {
          lat: (baseLocation.lat + disasterLocation.lat) / 2,
          lng: (baseLocation.lng + disasterLocation.lng) / 2
        },
        { lat: disasterLocation.lat, lng: disasterLocation.lng }
      ]

      // 모선 차량 생성
      const { data: mothership, error: mothershipError } = await supabase
        .from('response_units')
        .insert({
          disaster_id: disasterId,
          base_id: baseWithDistance.id,
          unit_type: 'mothership',
          status: 'deployed',
          current_location: `SRID=4326;POINT(${baseLocation.lng} ${baseLocation.lat})`,
          route: route
        })
        .select()
        .single()

      if (mothershipError) {
        console.error('❌ Error creating mothership:', mothershipError)
        console.error('Full error details:', JSON.stringify(mothershipError, null, 2))
        return NextResponse.json(
          { error: 'Failed to dispatch mothership', details: mothershipError },
          { status: 500 }
        )
      }

      console.log('✅ Mothership created:', mothership)

      // 드론 경로 (약간 다른 경로)
      const droneRoute = [
        { lat: baseLocation.lat, lng: baseLocation.lng },
        {
          lat: baseLocation.lat + (disasterLocation.lat - baseLocation.lat) * 0.3,
          lng: baseLocation.lng + (disasterLocation.lng - baseLocation.lng) * 0.4
        },
        {
          lat: baseLocation.lat + (disasterLocation.lat - baseLocation.lat) * 0.7,
          lng: baseLocation.lng + (disasterLocation.lng - baseLocation.lng) * 0.8
        },
        { lat: disasterLocation.lat, lng: disasterLocation.lng }
      ]

      // 로봇 경로 (또 다른 경로)
      const robotRoute = [
        { lat: baseLocation.lat, lng: baseLocation.lng },
        {
          lat: baseLocation.lat + (disasterLocation.lat - baseLocation.lat) * 0.5,
          lng: baseLocation.lng + (disasterLocation.lng - baseLocation.lng) * 0.3
        },
        { lat: disasterLocation.lat, lng: disasterLocation.lng }
      ]

      // 드론과 로봇 생성 (모선에서 출발) - deployed 상태로 변경
      const unitsToCreate = [
        {
          disaster_id: disasterId,
          base_id: baseWithDistance.id,
          unit_type: 'drone',
          status: 'deployed',
          current_location: `SRID=4326;POINT(${baseLocation.lng} ${baseLocation.lat})`,
          route: droneRoute
        },
        {
          disaster_id: disasterId,
          base_id: baseWithDistance.id,
          unit_type: 'robot',
          status: 'deployed',
          current_location: `SRID=4326;POINT(${baseLocation.lng} ${baseLocation.lat})`,
          route: robotRoute
        }
      ]

      const { data: units, error: unitsError } = await supabase
        .from('response_units')
        .insert(unitsToCreate)
        .select()

      if (unitsError) {
        console.error('❌ Error creating support units:', unitsError)
        console.error('Full error details:', JSON.stringify(unitsError, null, 2))
      } else {
        console.log('✅ Support units created:', units)
      }

      return NextResponse.json({
        success: true,
        base: baseWithDistance,
        mothership,
        supportUnits: units || []
      })
    }

    // RPC 성공 시에도 유닛 생성 로직 실행
    const baseData = nearestBase[0]
    console.log('🔍 Base data from RPC:', baseData)

    // RPC에서 반환된 location은 PostGIS GEOGRAPHY 타입이므로 파싱 필요
    // GEOGRAPHY는 WKB (Well-Known Binary) 형식으로 반환됨
    // 또는 이미 GeoJSON일 수도 있음 - 확인 후 적절히 처리
    let baseLocation

    if (baseData.location && typeof baseData.location === 'string') {
      // POINT(lng lat) 형식의 문자열인 경우
      const match = baseData.location.match(/POINT\(([\d.-]+)\s+([\d.-]+)\)/)
      if (match) {
        baseLocation = { lng: parseFloat(match[1]), lat: parseFloat(match[2]) }
      }
    } else if (baseData.location && baseData.location.coordinates) {
      // GeoJSON 형식인 경우
      baseLocation = {
        lng: baseData.location.coordinates[0],
        lat: baseData.location.coordinates[1]
      }
    }

    if (!baseLocation) {
      console.error('❌ Could not parse base location:', baseData.location)
      return NextResponse.json(
        { error: 'Invalid base location format' },
        { status: 500 }
      )
    }

    console.log('📍 Parsed base location:', baseLocation)

    // 모선: 실제 도로 경로 계산 (Kakao Directions API 사용)
    const destination = { lat, lng }
    let mothershipRoute = await calculateRoute(baseLocation, destination)

    // API 실패 시 폴백: 간단한 직선 경로
    if (!mothershipRoute || mothershipRoute.length === 0) {
      console.warn('⚠️ Using fallback route for mothership')
      mothershipRoute = [
        { lat: baseLocation.lat, lng: baseLocation.lng },
        {
          lat: (baseLocation.lat + lat) / 2,
          lng: (baseLocation.lng + lng) / 2
        },
        { lat, lng }
      ]
    }

    // 모선 차량 생성
    const { data: mothership, error: mothershipError } = await supabase
      .from('response_units')
      .insert({
        disaster_id: disasterId,
        base_id: baseData.id,
        unit_type: 'mothership',
        status: 'deployed',
        current_location: `SRID=4326;POINT(${baseLocation.lng} ${baseLocation.lat})`,
        route: mothershipRoute
      })
      .select()
      .single()

    if (mothershipError) {
      console.error('❌ Error creating mothership (RPC path):', mothershipError)
      console.error('Full error details:', JSON.stringify(mothershipError, null, 2))
    } else {
      console.log('✅ Mothership created (RPC path):', mothership)
    }

    // 드론 경로: 직선 비행 (공중)
    const droneRoute = [
      { lat: baseLocation.lat, lng: baseLocation.lng },
      {
        lat: baseLocation.lat + (lat - baseLocation.lat) * 0.3,
        lng: baseLocation.lng + (lng - baseLocation.lng) * 0.3
      },
      {
        lat: baseLocation.lat + (lat - baseLocation.lat) * 0.7,
        lng: baseLocation.lng + (lng - baseLocation.lng) * 0.7
      },
      { lat, lng }
    ]

    // 로봇 경로: 도로 경로 계산 (모선과 동일하게)
    let robotRoute = await calculateRoute(baseLocation, destination)

    // API 실패 시 폴백
    if (!robotRoute || robotRoute.length === 0) {
      console.warn('⚠️ Using fallback route for robot')
      robotRoute = [
        { lat: baseLocation.lat, lng: baseLocation.lng },
        {
          lat: (baseLocation.lat + lat) / 2,
          lng: (baseLocation.lng + lng) / 2
        },
        { lat, lng }
      ]
    }

    // 드론과 로봇 생성
    const unitsToCreate = [
      {
        disaster_id: disasterId,
        base_id: baseData.id,
        unit_type: 'drone',
        status: 'deployed',
        current_location: `SRID=4326;POINT(${baseLocation.lng} ${baseLocation.lat})`,
        route: droneRoute
      },
      {
        disaster_id: disasterId,
        base_id: baseData.id,
        unit_type: 'robot',
        status: 'deployed',
        current_location: `SRID=4326;POINT(${baseLocation.lng} ${baseLocation.lat})`,
        route: robotRoute
      }
    ]

    const { data: supportUnits, error: unitsError } = await supabase
      .from('response_units')
      .insert(unitsToCreate)
      .select()

    if (unitsError) {
      console.error('❌ Error creating support units (RPC path):', unitsError)
      console.error('Full error details:', JSON.stringify(unitsError, null, 2))
    } else {
      console.log('✅ Support units created (RPC path):', supportUnits)
    }

    return NextResponse.json({
      success: true,
      base: baseData,
      mothership,
      supportUnits: supportUnits || []
    })
  } catch (error) {
    console.error('Error dispatching response units:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

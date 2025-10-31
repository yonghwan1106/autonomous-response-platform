import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { unitId } = await request.json()

    if (!unitId) {
      console.error('❌ No unitId provided')
      return NextResponse.json(
        { error: 'Unit ID is required' },
        { status: 400 }
      )
    }

    console.log('🔄 Updating position for unit:', unitId)

    // 유닛 정보 가져오기 (RPC 사용하여 GeoJSON 형식으로)
    const { data: units, error: unitError } = await supabase
      .rpc('get_active_units')

    if (unitError || !units) {
      console.error('❌ Failed to fetch units:', unitError)
      return NextResponse.json(
        { error: 'Failed to fetch units' },
        { status: 500 }
      )
    }

    const unit = units.find((u: any) => u.id === unitId)

    if (!unit) {
      console.error('❌ Unit not found:', unitId)
      return NextResponse.json(
        { error: 'Unit not found' },
        { status: 404 }
      )
    }

    // deployed 상태가 아니면 업데이트하지 않음
    if (unit.status !== 'deployed' && unit.status !== 'en_route') {
      return NextResponse.json({
        success: false,
        message: 'Unit is not in transit'
      })
    }

    // 경로가 없으면 업데이트하지 않음
    if (!unit.route || unit.route.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No route data'
      })
    }

    // 현재 위치 파싱 (GeoJSON 형식)
    const currentLocation = unit.current_location

    if (!currentLocation || !currentLocation.coordinates || currentLocation.coordinates.length !== 2) {
      console.error('❌ Invalid current location:', currentLocation)
      return NextResponse.json(
        { error: 'Invalid current location', currentLocation },
        { status: 400 }
      )
    }

    const [currentLng, currentLat] = currentLocation.coordinates

    // 경로에서 다음 목표 지점 찾기
    const route = unit.route as Array<{ lat: number; lng: number }>
    const destination = route[route.length - 1]

    // 목적지 도착 확인 (50m 이내)
    const distanceToDestination = calculateDistance(
      currentLat,
      currentLng,
      destination.lat,
      destination.lng
    )

    if (distanceToDestination < 0.0005) {
      // 약 50m
      // 도착 상태로 변경
      const { error: updateError } = await supabase
        .from('response_units')
        .update({
          status: 'arrived',
          updated_at: new Date().toISOString()
        })
        .eq('id', unitId)

      if (updateError) {
        console.error('Failed to update unit status:', updateError)
      }

      return NextResponse.json({
        success: true,
        status: 'arrived',
        position: { lat: destination.lat, lng: destination.lng }
      })
    }

    // 경로상에서 다음 목표 지점 찾기
    let nextWaypoint = route[0]
    for (let i = 0; i < route.length; i++) {
      const waypoint = route[i]
      const distanceToWaypoint = calculateDistance(
        currentLat,
        currentLng,
        waypoint.lat,
        waypoint.lng
      )

      // 현재 위치에서 50m 이상 떨어진 첫 번째 waypoint를 목표로
      if (distanceToWaypoint > 0.0005) {
        nextWaypoint = waypoint
        break
      }
    }

    // 다음 위치 계산 (현재 위치에서 목표 지점 방향으로 이동)
    const speed = unit.unit_type === 'drone' ? 0.002 : 0.0015 // 드론이 더 빠름
    const direction = {
      lat: nextWaypoint.lat - currentLat,
      lng: nextWaypoint.lng - currentLng
    }

    // 정규화
    const distance = Math.sqrt(direction.lat ** 2 + direction.lng ** 2)
    const normalized = {
      lat: direction.lat / distance,
      lng: direction.lng / distance
    }

    // 새 위치
    const newLat = currentLat + normalized.lat * speed
    const newLng = currentLng + normalized.lng * speed

    // 위치 업데이트
    const { error: updateError } = await supabase
      .from('response_units')
      .update({
        current_location: `SRID=4326;POINT(${newLng} ${newLat})`,
        status: 'en_route',
        updated_at: new Date().toISOString()
      })
      .eq('id', unitId)

    if (updateError) {
      console.error('Failed to update position:', updateError)
      return NextResponse.json(
        { error: 'Failed to update position' },
        { status: 500 }
      )
    }

    // ETA 계산 (남은 거리 / 속도)
    const remainingDistance = calculateDistance(
      newLat,
      newLng,
      destination.lat,
      destination.lng
    )
    const eta = Math.round((remainingDistance / speed) * 5) // 5초 간격이므로

    return NextResponse.json({
      success: true,
      position: { lat: newLat, lng: newLng },
      status: 'en_route',
      eta: `${Math.floor(eta / 60)}분 ${eta % 60}초`
    })
  } catch (error) {
    console.error('Error updating unit position:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 두 지점 간의 거리 계산 (Haversine formula)
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // 지구 반경 (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c // km 단위
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { type } = await request.json()

    if (type === 'route') {
      // 테스트용 경로 데이터 생성
      const { data: units } = await supabase
        .from('response_units')
        .select('id, unit_type, current_location')
        .in('status', ['deployed', 'active'])
        .limit(10)

      if (!units || units.length === 0) {
        return NextResponse.json({
          error: 'No active units found',
          message: '먼저 재난을 신고하여 선발대를 출동시켜주세요.'
        }, { status: 404 })
      }

      let updatedCount = 0

      for (const unit of units) {
        // RPC 함수로 GeoJSON 형식 데이터 가져오기
        const { data: geoUnits } = await supabase.rpc('get_active_units')

        const geoUnit = geoUnits?.find((u: any) => u.id === unit.id)

        if (!geoUnit?.current_location?.coordinates) {
          console.log(`Unit ${unit.id} has no location`)
          continue
        }

        const [lng, lat] = geoUnit.current_location.coordinates

        // 테스트 경로 생성 (현재 위치 기준 랜덤 경로)
        const route = [
          { lat, lng },
          { lat: lat + Math.random() * 0.002, lng: lng + Math.random() * 0.002 },
          { lat: lat + Math.random() * 0.004, lng: lng + Math.random() * 0.003 },
          { lat: lat + Math.random() * 0.006, lng: lng + Math.random() * 0.004 },
          { lat: lat + Math.random() * 0.008, lng: lng + Math.random() * 0.005 }
        ]

        const { error } = await supabase
          .from('response_units')
          .update({ route })
          .eq('id', unit.id)

        if (!error) {
          updatedCount++
          console.log(`Route created for unit ${unit.id} (${unit.unit_type})`)
        }
      }

      return NextResponse.json({
        success: true,
        message: `${updatedCount}개 유닛의 경로를 생성했습니다.`
      })
    }

    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  } catch (error: any) {
    console.error('Error creating test data:', error)
    return NextResponse.json({
      error: error.message,
      message: '테스트 데이터 생성 실패'
    }, { status: 500 })
  }
}

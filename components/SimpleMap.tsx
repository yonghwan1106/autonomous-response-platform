'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Disaster {
  id: string
  disaster_type: string
  address: string
  location: { coordinates: [number, number] } | null
}

export default function SimpleMap() {
  const [disasters, setDisasters] = useState<Disaster[]>([])

  useEffect(() => {
    loadDisasters()

    const channel = supabase
      .channel('disasters-simple')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'disasters' },
        () => loadDisasters()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadDisasters = async () => {
    const { data, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('status', 'active')

    if (!error && data) {
      setDisasters(data)
    }
  }

  return (
    <div className="relative w-full h-[600px] bg-gradient-to-br from-blue-100 to-green-100 rounded-lg flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-700 mb-2">🗺️ 통합 관제 지도</h3>
        <p className="text-sm text-gray-600">
          카카오맵 API 로드 중... 플랫폼 설정을 확인하세요.
        </p>
      </div>

      {disasters.length > 0 && (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-md">
          <h4 className="font-semibold mb-4 text-lg">📍 활성 재난 위치</h4>
          <div className="space-y-3">
            {disasters.map((disaster) => (
              <div key={disaster.id} className="border-l-4 border-red-500 pl-3 py-2 bg-red-50">
                <p className="font-medium text-sm">{disaster.disaster_type}</p>
                <p className="text-xs text-gray-600">{disaster.address}</p>
                {disaster.location && (
                  <p className="text-xs text-gray-500 mt-1">
                    좌표: {disaster.location.coordinates[1].toFixed(4)}, {disaster.location.coordinates[0].toFixed(4)}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="absolute bottom-4 right-4 bg-white p-3 rounded-lg shadow text-xs">
        <p className="font-semibold mb-1">📌 설정 필요:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-600">
          <li>카카오 개발자 콘솔 접속</li>
          <li>플랫폼 &gt; Web 플랫폼 등록</li>
          <li>http://localhost:3003 추가</li>
        </ol>
      </div>
    </div>
  )
}

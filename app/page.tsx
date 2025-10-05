'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import ControlMap from '@/components/ControlMap'
import DisasterReportForm from '@/components/DisasterReportForm'
import AIBriefing from '@/components/AIBriefing'

export default function Home() {
  const [activeDisasters, setActiveDisasters] = useState<any[]>([])

  // DB에서 활성 재난 데이터 로드 (RPC 함수 사용)
  const loadActiveDisasters = async () => {
    const { data, error } = await supabase.rpc('get_active_disasters')

    if (!error && data) {
      console.log('Loaded active disasters:', data)
      setActiveDisasters(data)
    } else if (error) {
      console.error('Error loading disasters:', error)
    }
  }

  // 초기 데이터 로드 및 Realtime 구독
  useEffect(() => {
    loadActiveDisasters()

    // Supabase Realtime 구독
    const channel = supabase
      .channel('active-disasters-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'disasters' },
        (payload) => {
          console.log('Disaster change detected:', payload)
          loadActiveDisasters()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDisasterSuccess = async (disaster: any) => {
    // Realtime 구독이 자동으로 업데이트하므로 수동 업데이트 불필요
    // 선발대 자동 출동
    if (disaster.location) {
      const [lng, lat] = disaster.location.coordinates
      await fetch('/api/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disasterId: disaster.id,
          disasterLocation: { lat, lng }
        })
      })
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-emergency-red text-white py-4 px-6 rounded-lg shadow-lg mb-6">
          <h1 className="text-3xl font-bold">자율주행 선발대 관제 플랫폼</h1>
          <p className="text-sm mt-2">골든타임 확보를 위한 실시간 재난 관제 시스템</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 관제 지도 영역 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">통합 관제 지도</h2>
            <ControlMap />
          </div>

          {/* 우측: 재난 정보 및 AI 브리핑 */}
          <div className="space-y-6">
            {/* 신규 재난 접수 */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">신규 재난 접수</h2>
              <DisasterReportForm onSuccess={handleDisasterSuccess} />
            </div>

            {/* AI 브리핑 */}
            <AIBriefing />

            {/* 활성 재난 현황 */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h2 className="text-xl font-semibold mb-4">활성 재난 현황</h2>
              <div className="space-y-2">
                {activeDisasters.length === 0 ? (
                  <p className="text-sm text-gray-500">현재 활성 재난이 없습니다.</p>
                ) : (
                  activeDisasters.map((disaster) => (
                    <div key={disaster.id} className="border-l-4 border-emergency-red pl-3 py-2">
                      <p className="font-semibold text-sm">{disaster.disaster_type}</p>
                      <p className="text-xs text-gray-600">{disaster.address}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(disaster.created_at).toLocaleTimeString('ko-KR')}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

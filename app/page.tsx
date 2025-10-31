'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import ControlMap from '@/components/ControlMap'
import DisasterReportForm from '@/components/DisasterReportForm'
import AIBriefing from '@/components/AIBriefing'

export default function Home() {
  const [activeDisasters, setActiveDisasters] = useState<any[]>([])

  // DB에서 활성 재난 데이터 로드 (RPC 함수 사용)
  const loadActiveDisasters = async () => {
    const { data, error } = await supabase.rpc('get_active_disasters')

    if (error) {
      console.error('Error loading disasters:', error)
      setActiveDisasters([])
    } else {
      console.log('Loaded active disasters:', data)
      setActiveDisasters(data || [])
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
    if (disaster.location?.coordinates && Array.isArray(disaster.location.coordinates)) {
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">자율주행 선발대 관제 플랫폼</h1>
              <p className="text-sm mt-2">골든타임 확보를 위한 실시간 재난 관제 시스템</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="bg-white text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold shadow-lg ring-2 ring-white"
              >
                관제 화면
              </Link>
              <Link
                href="/guide"
                className="bg-white/80 text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition"
              >
                사용 가이드
              </Link>
              <Link
                href="/about"
                className="bg-white/80 text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-white transition"
              >
                프로젝트 소개
              </Link>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 좌측: 관제 지도 영역 */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-4">
            <h2 className="text-xl font-semibold mb-4">통합 관제 지도</h2>
            <ControlMap />

            {/* 범례 - 지도 아래 */}
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <h3 className="font-bold mb-3 text-sm text-gray-800">범례</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-2">마커</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-red-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs">재난 발생지</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-blue-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs">모선 차량</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-yellow-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs">정찰 드론 (클릭→열화상)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 bg-green-500 rounded-full flex-shrink-0"></div>
                      <span className="text-xs">지상 로봇</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-xs text-gray-600 mb-2">이동 경로</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-1.5 bg-blue-500 rounded flex-shrink-0"></div>
                      <span className="text-xs">모선 경로</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-1.5 bg-yellow-500 rounded flex-shrink-0"></div>
                      <span className="text-xs">드론 경로</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-1.5 bg-green-500 rounded flex-shrink-0"></div>
                      <span className="text-xs">로봇 경로</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 p-3 bg-blue-50 border-l-4 border-blue-400 rounded">
              <p className="text-sm text-blue-800">
                💡 본 시스템은 프로토타입 단계로, 지도 마커 및 경로 표시 기능이 지속적으로 개선되고 있습니다.
              </p>
            </div>
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

'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import ControlMap from '@/components/ControlMap'
import DisasterReportForm from '@/components/DisasterReportForm'
import AIBriefing from '@/components/AIBriefing'
import SensorDataDashboard from '@/components/SensorDataDashboard'
import DisasterTabs from '@/components/DisasterTabs'
import CommunicationPanel from '@/components/CommunicationPanel'

type RightPanelTab = 'report' | 'sensors' | 'communication' | 'briefing'

export default function Home() {
  const [activeDisasters, setActiveDisasters] = useState<any[]>([])
  const [selectedDisasterId, setSelectedDisasterId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<RightPanelTab>('report')

  // DB에서 활성 재난 데이터 로드 (RPC 함수 사용)
  const loadActiveDisasters = async () => {
    const { data, error } = await supabase.rpc('get_active_disasters')

    if (error) {
      console.error('Error loading disasters:', error)
      setActiveDisasters([])
    } else {
      setActiveDisasters(data || [])
      // 첫 번째 재난을 자동 선택
      if (data && data.length > 0 && !selectedDisasterId) {
        setSelectedDisasterId(data[0].id)
      }
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
        () => {
          loadActiveDisasters()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const handleDisasterSuccess = useCallback(async (disaster: any) => {
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
  }, [])

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-4">
        <header className="bg-emergency-red text-white py-4 px-4 md:px-6 rounded-lg shadow-lg mb-4 md:mb-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl md:text-3xl font-bold">자율주행 선발대 관제 플랫폼</h1>
              <p className="text-xs md:text-sm mt-1 md:mt-2">골든타임 확보를 위한 실시간 재난 관제 시스템</p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <Link
                href="/"
                className="bg-white text-emergency-red px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold shadow-lg ring-2 ring-white"
              >
                관제
              </Link>
              <Link
                href="/guide"
                className="bg-white/80 text-emergency-red px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-white transition"
              >
                가이드
              </Link>
              <Link
                href="/about"
                className="bg-white/80 text-emergency-red px-3 md:px-4 py-1.5 md:py-2 rounded-lg text-xs md:text-sm font-semibold hover:bg-white transition"
              >
                소개
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

          {/* 우측: 탭 기반 패널 */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {/* 탭 헤더 */}
            <div className="flex border-b border-gray-200 bg-gray-50 overflow-x-auto">
              <button
                onClick={() => setActiveTab('report')}
                className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'report'
                    ? 'bg-white text-emergency-red border-b-2 border-emergency-red'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                재난접수
              </button>
              <button
                onClick={() => setActiveTab('sensors')}
                className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'sensors'
                    ? 'bg-white text-emergency-red border-b-2 border-emergency-red'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                센서
              </button>
              <button
                onClick={() => setActiveTab('communication')}
                className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'communication'
                    ? 'bg-white text-emergency-red border-b-2 border-emergency-red'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                통신
              </button>
              <button
                onClick={() => setActiveTab('briefing')}
                className={`flex-1 px-2 md:px-4 py-2 md:py-3 text-xs md:text-sm font-semibold transition-colors whitespace-nowrap ${
                  activeTab === 'briefing'
                    ? 'bg-white text-emergency-red border-b-2 border-emergency-red'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                AI브리핑
              </button>
            </div>

            {/* 탭 컨텐츠 */}
            <div className="p-4">
              {activeTab === 'report' && (
                <div className="space-y-6">
                  <div>
                    <h2 className="text-xl font-semibold mb-4">신규 재난 접수</h2>
                    <DisasterReportForm onSuccess={handleDisasterSuccess} />
                  </div>

                  <div className="border-t pt-6">
                    <DisasterTabs
                      disasters={activeDisasters}
                      selectedId={selectedDisasterId}
                      onSelect={(id) => setSelectedDisasterId(id)}
                    />
                  </div>
                </div>
              )}

              {activeTab === 'sensors' && (
                <SensorDataDashboard disasterId={selectedDisasterId} />
              )}

              {activeTab === 'communication' && (
                <CommunicationPanel disasterId={selectedDisasterId} />
              )}

              {activeTab === 'briefing' && (
                <AIBriefing />
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

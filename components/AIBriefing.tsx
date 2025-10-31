'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Briefing {
  id: string
  disaster_id: string
  briefing_text: string
  briefing_type: string
  created_at: string
}

// 간단한 마크다운 렌더링 함수
function renderMarkdown(text: string): string {
  return text
    .replace(/### (.+?)(\n|$)/g, '<h3 class="font-bold text-base mt-2 mb-1">$1</h3>') // ### 헤더
    .replace(/## (.+?)(\n|$)/g, '<h2 class="font-bold text-lg mt-3 mb-2">$1</h2>') // ## 헤더
    .replace(/# (.+?)(\n|$)/g, '<h1 class="font-bold text-xl mt-3 mb-2">$1</h1>') // # 헤더
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>') // **bold** -> <strong>bold</strong>
    .replace(/\*(.+?)\*/g, '<em>$1</em>') // *italic* -> <em>italic</em>
    .replace(/\n/g, '<br/>') // 줄바꿈
}

export default function AIBriefing() {
  const [briefings, setBriefings] = useState<Briefing[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadBriefings()

    // Realtime 구독
    const channel = supabase
      .channel('briefings-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ai_briefings' },
        () => {
          console.log('Briefing updated')
          loadBriefings()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  const loadBriefings = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('ai_briefings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      console.error('Error loading briefings:', error)
      setBriefings([])
    } else {
      setBriefings(data || [])
    }
    setLoading(false)
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">AI 상황 브리핑</h2>
      <div className="bg-gray-50 rounded p-3 h-[200px] overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emergency-red"></div>
          </div>
        ) : briefings.length === 0 ? (
          <p className="text-sm text-gray-600">실시간 AI 브리핑이 표시됩니다...</p>
        ) : (
          <div className="space-y-3">
            {briefings.map((briefing) => (
              <div
                key={briefing.id}
                className={`bg-white p-3 rounded border-l-4 ${
                  briefing.briefing_type === 'situation' ? 'border-blue-500' : 'border-green-500'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <span className={`inline-block px-2 py-1 text-xs rounded ${
                    briefing.briefing_type === 'situation'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {briefing.briefing_type === 'situation' ? '상황 브리핑' : '작전 계획'}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(briefing.created_at).toLocaleTimeString('ko-KR')}
                  </span>
                </div>
                <div
                  className="text-sm text-gray-800"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(briefing.briefing_text) }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

'use client'

import { useState, useEffect, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Message {
  id: string
  disaster_id: string
  sender_type: string
  sender_id: string
  message: string
  message_type: string
  created_at: string
}

export default function CommunicationPanel({ disasterId }: { disasterId: string | null }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [sending, setSending] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!disasterId) {
      setMessages([])
      return
    }

    loadMessages()

    // Realtime 구독
    const channel = supabase
      .channel('messages-channel')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `disaster_id=eq.${disasterId}`
        },
        (payload) => {
          console.log('New message:', payload)
          setMessages((prev) => [...prev, payload.new as Message])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [disasterId])

  // 메시지 추가 시 자동 스크롤
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadMessages = async () => {
    if (!disasterId) return

    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('disaster_id', disasterId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('메시지 로드 실패:', error)
      return
    }

    setMessages(data || [])
  }

  const sendMessage = async () => {
    if (!disasterId || !newMessage.trim()) return

    setSending(true)

    const { error } = await supabase.from('messages').insert({
      disaster_id: disasterId,
      sender_type: 'control',
      sender_id: 'control-center',
      message: newMessage.trim(),
      message_type: 'text'
    })

    if (error) {
      console.error('메시지 전송 실패:', error)
      alert('메시지 전송에 실패했습니다.')
    } else {
      setNewMessage('')
    }

    setSending(false)
  }

  const sendAlert = async (alertType: string) => {
    if (!disasterId) return

    const alertMessages: Record<string, string> = {
      caution: '⚠️ 주의: 위험 요소 감지. 안전 확인 바람.',
      retreat: '🚨 긴급: 즉시 철수 명령. 위험 수준 상승.',
      backup: '🆘 백업 요청: 추가 지원이 필요합니다.'
    }

    const { error } = await supabase.from('messages').insert({
      disaster_id: disasterId,
      sender_type: 'control',
      sender_id: 'control-center',
      message: alertMessages[alertType],
      message_type: 'alert'
    })

    if (error) {
      console.error('알림 전송 실패:', error)
    }
  }

  if (!disasterId) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">관제센터 ↔ 현장 유닛</h2>
        <p className="text-sm text-gray-500">재난을 선택하면 통신 패널이 활성화됩니다.</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px]">
      <h2 className="text-xl font-semibold mb-4">관제센터 ↔ 현장 유닛</h2>

      {/* 빠른 알림 버튼 */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => sendAlert('caution')}
          className="flex-1 px-3 py-2 bg-yellow-500 text-white text-xs font-bold rounded hover:bg-yellow-600 transition"
        >
          ⚠️ 주의
        </button>
        <button
          onClick={() => sendAlert('retreat')}
          className="flex-1 px-3 py-2 bg-red-500 text-white text-xs font-bold rounded hover:bg-red-600 transition"
        >
          🚨 철수
        </button>
        <button
          onClick={() => sendAlert('backup')}
          className="flex-1 px-3 py-2 bg-blue-500 text-white text-xs font-bold rounded hover:bg-blue-600 transition"
        >
          🆘 지원
        </button>
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded p-3 mb-4 space-y-2">
        {messages.length === 0 ? (
          <p className="text-sm text-gray-500 text-center">메시지가 없습니다.</p>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_type === 'control' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  msg.sender_type === 'control'
                    ? msg.message_type === 'alert'
                      ? 'bg-red-600 text-white'
                      : 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-300'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-semibold">
                    {msg.sender_type === 'control' ? '관제센터' : msg.sender_id}
                  </span>
                  <span className="text-xs opacity-70">
                    {new Date(msg.created_at).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 메시지 입력 */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !sending && sendMessage()}
          placeholder="메시지 입력..."
          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          disabled={sending}
        />
        <button
          onClick={sendMessage}
          disabled={sending || !newMessage.trim()}
          className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {sending ? '전송 중...' : '전송'}
        </button>
      </div>
    </div>
  )
}

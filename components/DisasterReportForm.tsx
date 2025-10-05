'use client'

import { useState } from 'react'

interface DisasterReportFormProps {
  onSuccess?: (disaster: any) => void
}

export default function DisasterReportForm({ onSuccess }: DisasterReportFormProps) {
  const [reportText, setReportText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!reportText.trim()) {
      setError('신고 내용을 입력해주세요.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/disasters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reportText }),
      })

      const data = await response.json()

      if (!response.ok) {
        // 서버에서 상세 에러 메시지를 전달받음
        const errorMessage = data.details
          ? `${data.error}: ${data.details}`
          : data.error || '재난 접수에 실패했습니다.'

        console.error('API Error:', data)
        throw new Error(errorMessage)
      }

      if (data.success) {
        setReportText('')
        onSuccess?.(data.disaster)
      } else {
        throw new Error(data.error || '재난 접수에 실패했습니다.')
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.'
      console.error('Disaster report error:', errorMessage)
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={reportText}
        onChange={(e) => setReportText(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 text-sm focus:ring-2 focus:ring-emergency-red focus:border-transparent"
        rows={4}
        placeholder="예시: 서울시 강남구 테헤란로 123 빌딩 3층에서 연기가 나고 사람이 갇혀있어요!"
        disabled={loading}
      />

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-emergency-red text-white py-2.5 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed font-medium transition-colors"
      >
        {loading ? (
          <span className="flex items-center justify-center">
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            처리 중...
          </span>
        ) : (
          '재난 접수'
        )}
      </button>
    </form>
  )
}

'use client'

import { useEffect } from 'react'
import Building3DViewer from './Building3DViewer'

interface Building3DModalProps {
  isOpen: boolean
  onClose: () => void
  disaster: {
    id: string
    description: string
    floor: number | null
    address: string
  } | null
}

export default function Building3DModal({ isOpen, onClose, disaster }: Building3DModalProps) {
  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEsc)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      window.removeEventListener('keydown', handleEsc)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen || !disaster) return null

  // 기본값 설정: 층수 정보가 없으면 5층으로 가정
  const totalFloors = disaster.floor ? Math.max(disaster.floor + 5, 10) : 10
  const disasterFloor = disaster.floor

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-lg shadow-2xl w-11/12 h-5/6 max-w-6xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-emergency-red to-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">🏢 3D 건물 시각화</h2>
            <p className="text-sm mt-1 opacity-90">{disaster.address}</p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition font-semibold"
          >
            ✕ 닫기
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(100%-80px)]">
          <Building3DViewer
            floors={totalFloors}
            disasterFloor={disasterFloor}
            buildingName={disaster.description}
          />
        </div>

        {/* Footer Info */}
        <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-lg">
          <div className="text-xs space-y-1">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded opacity-70"></div>
              <span>일반 층</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span className="font-bold">재난 발생 층</span>
            </div>
          </div>
        </div>

        {/* 프로토타입 알림 */}
        <div className="absolute bottom-4 right-4 bg-blue-50 border-l-4 border-blue-400 rounded px-3 py-2 shadow-lg max-w-xs">
          <p className="text-xs text-blue-800">
            💡 <strong>프로토타입:</strong> 실제 건물 도면 데이터 연동 시 정확한 내부 구조 표시 가능
          </p>
        </div>
      </div>
    </div>
  )
}

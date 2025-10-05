'use client'

import { useState } from 'react'

interface ThermalVideoModalProps {
  isOpen: boolean
  onClose: () => void
  unitId: string
  unitType: string
}

export default function ThermalVideoModal({
  isOpen,
  onClose,
  unitId,
  unitType
}: ThermalVideoModalProps) {
  const [detections, setDetections] = useState([
    { id: 1, type: 'trapped_person', position: { x: 45, y: 30 }, temp: 36.5 },
    { id: 2, type: 'fire', position: { x: 70, y: 50 }, temp: 450 },
  ])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">
            {unitType === 'drone' ? '드론 열화상 영상' : '센서 데이터'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* 열화상 영상 영역 (시뮬레이션) */}
        <div className="relative bg-gradient-to-br from-purple-900 via-red-800 to-yellow-600 rounded-lg aspect-video mb-4">
          {/* 가상 열화상 이미지 */}
          <div className="absolute inset-0 flex items-center justify-center text-white opacity-30">
            <p className="text-sm">열화상 영상 시뮬레이션</p>
          </div>

          {/* 감지된 객체 표시 */}
          {detections.map((detection) => (
            <div
              key={detection.id}
              className="absolute"
              style={{
                left: `${detection.position.x}%`,
                top: `${detection.position.y}%`,
                transform: 'translate(-50%, -50%)'
              }}
            >
              <div className={`
                w-16 h-16 rounded-full border-4 animate-pulse
                ${detection.type === 'trapped_person'
                  ? 'border-green-400 bg-green-400 bg-opacity-30'
                  : 'border-red-400 bg-red-400 bg-opacity-30'}
              `}>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {detection.type === 'trapped_person' ? '요구조자' : '화점'}
                  <br />
                  {detection.temp}°C
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 감지 정보 */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold mb-3">감지된 객체</h3>
          <div className="space-y-2">
            {detections.map((detection) => (
              <div
                key={detection.id}
                className="flex items-center justify-between bg-white p-3 rounded border"
              >
                <div className="flex items-center gap-3">
                  <div className={`
                    w-3 h-3 rounded-full
                    ${detection.type === 'trapped_person' ? 'bg-green-500' : 'bg-red-500'}
                  `} />
                  <div>
                    <p className="font-medium text-sm">
                      {detection.type === 'trapped_person' ? '요구조자 발견' : '화점 감지'}
                    </p>
                    <p className="text-xs text-gray-500">
                      위치: ({detection.position.x}%, {detection.position.y}%)
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{detection.temp}°C</p>
                  <p className="text-xs text-gray-500">
                    {detection.type === 'trapped_person' ? '정상 체온' : '고온 감지'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="mt-4 flex gap-2">
          <button className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
            위치 지도에 표시
          </button>
          <button className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700">
            보고서 생성
          </button>
        </div>
      </div>
    </div>
  )
}

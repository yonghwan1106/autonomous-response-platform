'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'

interface ThermalVideoModalProps {
  isOpen: boolean
  onClose: () => void
  unitId: string
  unitType: string
}

interface Detection {
  id: number
  type: 'trapped_person' | 'fire'
  position: { x: number; y: number }
  temp: number
  confidence: number
}

export default function ThermalVideoModal({
  isOpen,
  onClose,
  unitId,
  unitType
}: ThermalVideoModalProps) {
  const [detections, setDetections] = useState<Detection[]>([
    { id: 1, type: 'trapped_person', position: { x: 45, y: 30 }, temp: 36.5, confidence: 0.92 },
    { id: 2, type: 'fire', position: { x: 70, y: 50 }, temp: 450, confidence: 0.88 },
  ])
  const [isRecording, setIsRecording] = useState(true)
  const [recordingTime, setRecordingTime] = useState(0)

  // 녹화 시간 시뮬레이션
  useEffect(() => {
    if (!isOpen || !isRecording) return

    const interval = setInterval(() => {
      setRecordingTime(prev => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [isOpen, isRecording])

  // 감지 시뮬레이션 (5초마다 새로운 감지)
  useEffect(() => {
    if (!isOpen) return

    const interval = setInterval(() => {
      const randomDetection: Detection = {
        id: Date.now(),
        type: Math.random() > 0.5 ? 'fire' : 'trapped_person',
        position: {
          x: Math.random() * 80 + 10,
          y: Math.random() * 60 + 20
        },
        temp: Math.random() > 0.5 ? Math.random() * 100 + 350 : Math.random() * 5 + 35,
        confidence: Math.random() * 0.2 + 0.8
      }
      setDetections(prev => [...prev, randomDetection])
    }, 5000)

    return () => clearInterval(interval)
  }, [isOpen])

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
        <div className="relative bg-gradient-to-br from-purple-900 via-red-800 to-yellow-600 rounded-lg aspect-video mb-4 overflow-hidden">
          {/* 실시간 스트리밍 인디케이터 */}
          <div className="absolute top-2 left-2 flex items-center gap-2 z-10">
            <div className={`w-3 h-3 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-gray-500'}`}></div>
            <span className="text-white text-xs font-semibold bg-black bg-opacity-50 px-2 py-1 rounded">
              {isRecording ? 'LIVE' : 'PAUSED'} • {Math.floor(recordingTime / 60)}:{(recordingTime % 60).toString().padStart(2, '0')}
            </span>
          </div>

          {/* 온도 스케일 */}
          <div className="absolute top-2 right-2 bg-black bg-opacity-50 rounded px-2 py-1 text-white text-xs z-10">
            <div className="text-center mb-1">온도 (°C)</div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-yellow-300">500+</span>
              <span className="text-orange-400">300</span>
              <span className="text-red-500">100</span>
              <span className="text-blue-300">0</span>
            </div>
          </div>

          {/* 가상 열화상 이미지 */}
          <div className="absolute inset-0 flex items-center justify-center text-white opacity-20">
            <p className="text-sm">실시간 열화상 영상</p>
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
                <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 whitespace-nowrap bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                  {detection.type === 'trapped_person' ? '구조대상자' : '화점'}
                  <br />
                  {detection.temp.toFixed(1)}°C • {(detection.confidence * 100).toFixed(0)}%
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
                      {detection.type === 'trapped_person' ? '구조대상자 발견' : '화점 감지'}
                    </p>
                    <p className="text-xs text-gray-500">
                      위치: ({detection.position.x.toFixed(0)}%, {detection.position.y.toFixed(0)}%) • 신뢰도: {(detection.confidence * 100).toFixed(0)}%
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-sm">{detection.temp.toFixed(1)}°C</p>
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
          <button
            onClick={async () => {
              // 구조대상자 위치를 hazard_overlays에 저장
              const trappedPersonDetections = detections.filter(d => d.type === 'trapped_person')

              for (const detection of trappedPersonDetections) {
                await supabase.from('hazard_overlays').insert({
                  disaster_id: unitId, // 실제로는 disaster_id를 받아와야 함
                  hazard_type: 'trapped_person',
                  severity: 'high',
                  description: `AI 열화상 감지 (신뢰도: ${(detection.confidence * 100).toFixed(0)}%)`
                })
              }

              alert(`${trappedPersonDetections.length}개의 위치를 지도에 표시했습니다.`)
            }}
            className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          >
            위치 지도에 표시 ({detections.filter(d => d.type === 'trapped_person').length})
          </button>
          <button
            onClick={() => setIsRecording(!isRecording)}
            className="flex-1 bg-gray-600 text-white py-2 rounded hover:bg-gray-700 transition"
          >
            {isRecording ? '녹화 일시정지' : '녹화 재개'}
          </button>
        </div>
      </div>
    </div>
  )
}

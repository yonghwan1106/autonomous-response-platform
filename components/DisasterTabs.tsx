'use client'

import { useState } from 'react'

interface Disaster {
  id: string
  disaster_type: string
  address: string
  created_at: string
  status: string
  trapped_people?: boolean
}

interface DisasterTabsProps {
  disasters: Disaster[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export default function DisasterTabs({ disasters, selectedId, onSelect }: DisasterTabsProps) {
  if (disasters.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-xl font-semibold mb-4">활성 재난 현황</h2>
        <p className="text-sm text-gray-500">현재 활성 재난이 없습니다.</p>
      </div>
    )
  }

  // 재난 유형에 따른 아이콘 및 색상
  const getDisasterStyle = (type: string) => {
    const types: Record<string, { icon: string; color: string; bgColor: string }> = {
      '화재': { icon: '🔥', color: 'text-red-700', bgColor: 'bg-red-100' },
      '구조': { icon: '🆘', color: 'text-blue-700', bgColor: 'bg-blue-100' },
      '응급의료': { icon: '🚑', color: 'text-green-700', bgColor: 'bg-green-100' },
      '가스누출': { icon: '☠️', color: 'text-yellow-700', bgColor: 'bg-yellow-100' },
    }
    return types[type] || { icon: '⚠️', color: 'text-gray-700', bgColor: 'bg-gray-100' }
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h2 className="text-xl font-semibold mb-4">활성 재난 현황 ({disasters.length})</h2>

      <div className="space-y-2 max-h-[400px] overflow-y-auto">
        {disasters.map((disaster) => {
          const style = getDisasterStyle(disaster.disaster_type)
          const isSelected = disaster.id === selectedId
          const timeAgo = getTimeAgo(disaster.created_at)

          return (
            <button
              key={disaster.id}
              onClick={() => onSelect(disaster.id)}
              className={`
                w-full text-left p-4 rounded-lg border-2 transition-all
                ${
                  isSelected
                    ? 'border-emergency-red bg-red-50 shadow-md scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:shadow'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className={`text-2xl ${style.bgColor} p-2 rounded-lg`}>
                    {style.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-bold text-sm ${style.color}`}>
                        {disaster.disaster_type}
                      </h3>
                      {disaster.trapped_people && (
                        <span className="px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded">
                          구조대상자
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600 truncate">{disaster.address}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-500">{timeAgo}</span>
                      <span
                        className={`px-2 py-0.5 text-xs font-semibold rounded ${
                          disaster.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {disaster.status === 'active' ? '진행 중' : '종료'}
                      </span>
                    </div>
                  </div>
                </div>

                {isSelected && (
                  <div className="ml-2">
                    <div className="w-3 h-3 bg-emergency-red rounded-full animate-pulse"></div>
                  </div>
                )}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

// 시간 경과 계산
function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000) // 초 단위

  if (diff < 60) return `${diff}초 전`
  if (diff < 3600) return `${Math.floor(diff / 60)}분 전`
  if (diff < 86400) return `${Math.floor(diff / 3600)}시간 전`
  return `${Math.floor(diff / 86400)}일 전`
}

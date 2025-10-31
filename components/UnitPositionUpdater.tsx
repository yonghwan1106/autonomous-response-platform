'use client'

import { useEffect, useRef } from 'react'

interface UnitPositionUpdaterProps {
  units: Array<{ id: string; status: string }>
  onUpdate?: () => void
}

export default function UnitPositionUpdater({ units, onUpdate }: UnitPositionUpdaterProps) {
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // 이동 중인 유닛만 필터링
    const movingUnits = units.filter(
      (unit) => unit.status === 'deployed' || unit.status === 'en_route'
    )

    if (movingUnits.length === 0) {
      // 이동 중인 유닛이 없으면 인터벌 정리
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      return
    }

    // 5초마다 모든 이동 중인 유닛의 위치 업데이트
    intervalRef.current = setInterval(async () => {
      for (const unit of movingUnits) {
        try {
          const response = await fetch('/api/units/update-position', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ unitId: unit.id })
          })

          if (response.ok) {
            const data = await response.json()
            if (data.success) {
              console.log(`Unit ${unit.id} updated:`, data.status, data.position)

              // 부모 컴포넌트에 업데이트 알림
              if (onUpdate) {
                onUpdate()
              }
            }
          }
        } catch (error) {
          console.error(`Failed to update unit ${unit.id}:`, error)
        }
      }
    }, 5000) // 5초마다

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [units, onUpdate])

  // UI를 렌더링하지 않음 (백그라운드 작업만)
  return null
}

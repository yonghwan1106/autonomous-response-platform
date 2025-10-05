'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import ThermalVideoModal from './ThermalVideoModal'

declare global {
  interface Window {
    kakao: any
  }
}

interface Disaster {
  id: string
  location: {
    type?: string
    coordinates: [number, number]
  } | null
  disaster_type: string
  address: string
}

interface ResponseUnit {
  id: string
  unit_type: string
  current_location: {
    type?: string
    coordinates: [number, number]
  } | null
  status: string
}

interface HazardOverlay {
  id: string
  disaster_id: string
  hazard_type: string
  location: {
    type?: string
    coordinates: [number, number]
  } | null
  severity: string
  description: string | null
}

export default function ControlMap() {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markersRef = useRef<Map<string, any>>(new Map())
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [units, setUnits] = useState<ResponseUnit[]>([])
  const [hazards, setHazards] = useState<HazardOverlay[]>([])
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; type: string } | null>(null)

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const loadKakaoMap = () => {
      console.log('카카오맵 로드 시작')
      console.log('API 키:', process.env.NEXT_PUBLIC_KAKAO_APP_KEY)

      if (!window.kakao || !window.kakao.maps) {
        // 카카오맵 스크립트 로드
        const script = document.createElement('script')
        const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '5dbdb21a182d8d1276ec1b4320137d86'
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false`
        script.type = 'text/javascript'
        script.async = false

        console.log('스크립트 URL:', script.src)

        script.onload = () => {
          console.log('스크립트 로드 성공')
          if (window.kakao && window.kakao.maps) {
            window.kakao.maps.load(() => {
              console.log('카카오맵 초기화 성공')
              initMap()
            })
          }
        }
        script.onerror = (error) => {
          console.error('카카오맵 스크립트 로드 실패:', error)
          console.error('스크립트 URL:', script.src)
        }
        document.head.appendChild(script)
      } else {
        console.log('카카오맵 이미 로드됨')
        window.kakao.maps.load(() => {
          initMap()
        })
      }
    }

    const initMap = () => {
      if (!mapRef.current) return

      const options = {
        center: new window.kakao.maps.LatLng(37.5665, 126.9780), // 서울시청
        level: 6
      }

      const map = new window.kakao.maps.Map(mapRef.current, options)
      mapInstance.current = map
    }

    loadKakaoMap()
  }, [])

  // 재난 데이터 실시간 구독
  useEffect(() => {
    // 초기 데이터 로드
    loadDisasters()

    // Realtime 구독
    const channel = supabase
      .channel('disasters-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'disasters' },
        (payload) => {
          console.log('Disaster change:', payload)
          loadDisasters()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 선발대 유닛 데이터 실시간 구독
  useEffect(() => {
    loadUnits()

    const channel = supabase
      .channel('units-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'response_units' },
        (payload) => {
          console.log('Unit change:', payload)
          loadUnits()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 위험 요소 오버레이 데이터 실시간 구독
  useEffect(() => {
    loadHazards()

    const channel = supabase
      .channel('hazards-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'hazard_overlays' },
        (payload) => {
          console.log('Hazard change:', payload)
          loadHazards()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  // 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    // 재난 마커 추가
    disasters.forEach(disaster => {
      console.log('Processing disaster:', disaster.id, 'location:', disaster.location)

      if (!disaster.location) {
        console.warn('Disaster has no location:', disaster.id)
        return
      }

      // GeoJSON 형식 확인
      let lng, lat
      if (disaster.location.coordinates) {
        [lng, lat] = disaster.location.coordinates
      } else if (disaster.location.type === 'Point' && disaster.location.coordinates) {
        [lng, lat] = disaster.location.coordinates
      } else {
        console.warn('Unknown location format:', disaster.location)
        return
      }

      const position = new window.kakao.maps.LatLng(lat, lng)
      console.log('Creating marker at:', lat, lng)

      const marker = new window.kakao.maps.Marker({
        position,
        map: mapInstance.current,
        title: disaster.disaster_type || '재난'
      })

      // 커스텀 마커 아이콘 (재난)
      const imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
      const imageSize = new window.kakao.maps.Size(40, 42)
      const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize)
      marker.setImage(markerImage)

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${disaster.disaster_type}<br/>${disaster.address}</div>`
      })

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapInstance.current, marker)
      })

      markersRef.current.set(`disaster-${disaster.id}`, marker)
    })

    // 선발대 유닛 마커 추가
    units.forEach(unit => {
      if (!unit.current_location?.coordinates) return

      const [lng, lat] = unit.current_location.coordinates
      const position = new window.kakao.maps.LatLng(lat, lng)

      const marker = new window.kakao.maps.Marker({
        position,
        map: mapInstance.current,
        title: unit.unit_type
      })

      // 유닛 타입별 아이콘
      let imageSrc = ''
      if (unit.unit_type === 'mothership') {
        imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png'
      } else if (unit.unit_type === 'drone') {
        imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
      } else if (unit.unit_type === 'robot') {
        imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_number_blue.png'
      }

      if (imageSrc) {
        const imageSize = new window.kakao.maps.Size(36, 37)
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize)
        marker.setImage(markerImage)
      }

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;">${unit.unit_type} - ${unit.status}</div>`
      })

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapInstance.current, marker)
        // 드론 클릭 시 열화상 영상 모달 표시
        if (unit.unit_type === 'drone') {
          setSelectedUnit({ id: unit.id, type: unit.unit_type })
        }
      })

      markersRef.current.set(`unit-${unit.id}`, marker)
    })

    // 위험 요소 오버레이 마커 추가
    hazards.forEach(hazard => {
      if (!hazard.location?.coordinates) return

      const [lng, lat] = hazard.location.coordinates
      const position = new window.kakao.maps.LatLng(lat, lng)

      const marker = new window.kakao.maps.Marker({
        position,
        map: mapInstance.current,
        title: hazard.hazard_type
      })

      // 위험 요소 타입별 아이콘 및 색상
      let imageSrc = ''
      let markerColor = 'orange'

      if (hazard.hazard_type === 'fire') {
        imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
        markerColor = 'red'
      } else if (hazard.hazard_type === 'trapped_person') {
        imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png'
        markerColor = 'green'
      } else if (hazard.hazard_type === 'gas_leak' || hazard.hazard_type === 'collapse') {
        imageSrc = 'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/marker_red.png'
        markerColor = 'yellow'
      }

      if (imageSrc) {
        const imageSize = new window.kakao.maps.Size(36, 37)
        const markerImage = new window.kakao.maps.MarkerImage(imageSrc, imageSize)
        marker.setImage(markerImage)
      }

      const severityText = {
        low: '낮음',
        medium: '중간',
        high: '높음',
        critical: '매우 위험'
      }[hazard.severity] || hazard.severity

      const hazardTypeText = {
        fire: '화재',
        trapped_person: '요구조자',
        gas_leak: '가스 누출',
        collapse: '붕괴 위험'
      }[hazard.hazard_type] || hazard.hazard_type

      const infowindow = new window.kakao.maps.InfoWindow({
        content: `<div style="padding:5px;font-size:12px;"><strong>${hazardTypeText}</strong><br/>위험도: ${severityText}<br/>${hazard.description || ''}</div>`
      })

      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(mapInstance.current, marker)
      })

      markersRef.current.set(`hazard-${hazard.id}`, marker)
    })
  }, [disasters, units, hazards])

  const loadDisasters = async () => {
    const { data, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('status', 'active')

    if (!error && data) {
      console.log('Loaded disasters:', data)
      setDisasters(data || [])
    } else if (error) {
      console.error('Error loading disasters:', error)
      setDisasters([])
    }
  }

  const loadUnits = async () => {
    const { data, error } = await supabase
      .from('response_units')
      .select('*')
      .in('status', ['deployed', 'active'])

    if (!error && data) {
      console.log('Loaded units:', data)
      setUnits(data || [])
    } else if (error) {
      console.error('Error loading units:', error)
      setUnits([])
    }
  }

  const loadHazards = async () => {
    const { data, error } = await supabase
      .from('hazard_overlays')
      .select('*')
      .order('created_at', { ascending: false })

    if (!error && data) {
      console.log('Loaded hazards:', data)
      setHazards(data || [])
    } else if (error) {
      console.error('Error loading hazards:', error)
      setHazards([])
    }
  }

  return (
    <div className="relative">
      <div ref={mapRef} className="w-full h-[600px] rounded-lg" />

      {/* 범례 */}
      <div className="absolute top-4 right-4 bg-white p-3 rounded-lg shadow-lg text-xs">
        <h3 className="font-semibold mb-2">범례</h3>
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span>재난 발생지</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span>모선 차량</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span>정찰 드론 (클릭하여 열화상 보기)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span>지상 로봇</span>
          </div>
        </div>
      </div>

      {/* 열화상 영상 모달 */}
      <ThermalVideoModal
        isOpen={selectedUnit !== null}
        onClose={() => setSelectedUnit(null)}
        unitId={selectedUnit?.id || ''}
        unitType={selectedUnit?.type || ''}
      />
    </div>
  )
}

'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import ThermalVideoModal from './ThermalVideoModal'
import UnitPositionUpdater from './UnitPositionUpdater'

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
  route?: Array<{ lat: number; lng: number }>
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
  const polylinesRef = useRef<Map<string, any>>(new Map())
  const clustererRef = useRef<any>(null)
  const [disasters, setDisasters] = useState<Disaster[]>([])
  const [units, setUnits] = useState<ResponseUnit[]>([])
  const [hazards, setHazards] = useState<HazardOverlay[]>([])
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; type: string } | null>(null)
  const [clusteringEnabled, setClusteringEnabled] = useState(true)

  // 지도 초기화
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return

    const loadKakaoMap = () => {
      console.log('카카오맵 로드 시작')
      console.log('API 키:', process.env.NEXT_PUBLIC_KAKAO_APP_KEY)

      if (!window.kakao || !window.kakao.maps) {
        // 카카오맵 스크립트 로드 (clusterer 라이브러리 포함)
        const script = document.createElement('script')
        const appKey = process.env.NEXT_PUBLIC_KAKAO_APP_KEY || '5dbdb21a182d8d1276ec1b4320137d86'
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${appKey}&autoload=false&libraries=clusterer`
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

  // 마커 및 경로 업데이트
  useEffect(() => {
    if (!mapInstance.current || !window.kakao) return

    // 기존 클러스터러 제거
    if (clustererRef.current) {
      clustererRef.current.clear()
    }

    // 기존 마커 제거
    markersRef.current.forEach(marker => marker.setMap(null))
    markersRef.current.clear()

    // 기존 경로 제거
    polylinesRef.current.forEach(polyline => polyline.setMap(null))
    polylinesRef.current.clear()

    // 모든 마커를 배열에 모음
    const allMarkers: any[] = []

    // 가장 최근 재난 위치로 지도 이동 (첫 번째 재난)
    if (disasters.length > 0) {
      const latestDisaster = disasters[0]
      console.log('최근 재난:', latestDisaster)

      if (latestDisaster.location && Array.isArray(latestDisaster.location.coordinates) && latestDisaster.location.coordinates.length === 2) {
        const [lng, lat] = latestDisaster.location.coordinates
        const moveLatLng = new window.kakao.maps.LatLng(lat, lng)
        mapInstance.current.setCenter(moveLatLng)
        mapInstance.current.setLevel(5) // 적절한 줌 레벨
        console.log('지도 이동:', lat, lng)
      } else {
        console.warn('최근 재난에 유효한 location이 없습니다:', latestDisaster)
      }
    }

    // 재난 마커 추가
    disasters.forEach(disaster => {
      console.log('Processing disaster:', disaster.id, 'location:', disaster.location)

      if (!disaster.location || !disaster.location.coordinates) {
        console.warn('Disaster has no location:', disaster.id, disaster)
        return
      }

      // GeoJSON 형식에서 좌표 추출
      const [lng, lat] = disaster.location.coordinates

      const position = new window.kakao.maps.LatLng(lat, lng)
      console.log('Creating marker at:', lat, lng)

      const marker = new window.kakao.maps.Marker({
        position,
        map: null, // 클러스터링을 위해 나중에 추가
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
      allMarkers.push(marker)
    })

    // 선발대 유닛 마커 및 경로 추가
    units.forEach(unit => {
      console.log('🚁 Processing unit:', unit.unit_type, unit.id)

      if (!unit.current_location?.coordinates) {
        console.log('❌ No coordinates for unit:', unit.id)
        return
      }

      const [lng, lat] = unit.current_location.coordinates
      console.log(`📍 Unit ${unit.unit_type} position:`, { lat, lng })

      const position = new window.kakao.maps.LatLng(lat, lng)

      const marker = new window.kakao.maps.Marker({
        position,
        map: null, // 클러스터링을 위해 나중에 추가
        title: unit.unit_type
      })

      console.log(`✅ Marker created for ${unit.unit_type}:`, marker)

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
      allMarkers.push(marker)

      // 경로 표시 (route 데이터가 있는 경우)
      if (unit.route && Array.isArray(unit.route) && unit.route.length > 0) {
        const path = unit.route.map((point: any) => {
          return new window.kakao.maps.LatLng(point.lat, point.lng)
        })

        // 유닛 타입별 경로 색상
        let strokeColor = '#0066FF'
        if (unit.unit_type === 'drone') strokeColor = '#FFB800'
        else if (unit.unit_type === 'robot') strokeColor = '#00C73C'

        const polyline = new window.kakao.maps.Polyline({
          path: path,
          strokeWeight: 4,
          strokeColor: strokeColor,
          strokeOpacity: 0.7,
          strokeStyle: 'solid'
        })

        polyline.setMap(mapInstance.current)
        polylinesRef.current.set(`route-${unit.id}`, polyline)
      }
    })

    // 위험 요소 오버레이 마커 추가
    hazards.forEach(hazard => {
      if (!hazard.location?.coordinates) return

      const [lng, lat] = hazard.location.coordinates
      const position = new window.kakao.maps.LatLng(lat, lng)

      const marker = new window.kakao.maps.Marker({
        position,
        map: null, // 클러스터링을 위해 나중에 추가
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
      allMarkers.push(marker)
    })

    // 클러스터링 적용 또는 개별 마커 표시
    if (clusteringEnabled && allMarkers.length > 10 && window.kakao.maps.MarkerClusterer) {
      // 마커가 10개 이상일 때 클러스터링 사용
      console.log(`🎯 Clustering enabled for ${allMarkers.length} markers`)

      clustererRef.current = new window.kakao.maps.MarkerClusterer({
        map: mapInstance.current,
        markers: allMarkers,
        gridSize: 60, // 클러스터 그리드 크기
        averageCenter: true, // 클러스터 중심을 마커들의 평균 위치로
        minLevel: 5, // 클러스터 최소 표시 레벨
        disableClickZoom: false, // 클러스터 클릭 시 줌 가능
        calculator: [10, 30, 50], // 클러스터 크기별 스타일
        styles: [
          {
            width: '40px',
            height: '40px',
            background: 'rgba(239, 68, 68, 0.8)',
            borderRadius: '50%',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '40px'
          },
          {
            width: '50px',
            height: '50px',
            background: 'rgba(239, 68, 68, 0.9)',
            borderRadius: '50%',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '50px'
          },
          {
            width: '60px',
            height: '60px',
            background: 'rgba(220, 38, 38, 1)',
            borderRadius: '50%',
            color: '#fff',
            textAlign: 'center',
            fontWeight: 'bold',
            lineHeight: '60px'
          }
        ]
      })
    } else {
      // 마커가 적거나 클러스터링 비활성화 시 개별 마커 표시
      console.log(`📍 Displaying ${allMarkers.length} individual markers`)
      allMarkers.forEach(marker => {
        marker.setMap(mapInstance.current)
      })
    }
  }, [disasters, units, hazards, clusteringEnabled])

  const loadDisasters = async () => {
    // RPC 함수를 사용하여 location을 GeoJSON 형식으로 가져오기
    const { data, error } = await supabase.rpc('get_active_disasters')

    if (error) {
      console.error('Error loading disasters:', error)
      setDisasters([])
    } else {
      console.log('Loaded disasters with GeoJSON location:', data)
      setDisasters(data || [])
    }
  }

  const loadUnits = async () => {
    // RPC 함수를 사용하여 current_location을 GeoJSON 형식으로 가져오기
    const { data, error } = await supabase.rpc('get_active_units')

    if (error) {
      console.error('❌ Error loading units:', error)
      setUnits([])
    } else {
      console.log('✅ Loaded units:', data)
      console.log('📊 Units count:', data?.length || 0)
      if (data && data.length > 0) {
        console.log('🚗 First unit sample:', data[0])
      }
      setUnits(data || [])
    }
  }

  const loadHazards = async () => {
    // RPC 함수를 사용하여 location을 GeoJSON 형식으로 가져오기
    const { data, error } = await supabase.rpc('get_hazard_overlays')

    if (error) {
      console.error('Error loading hazards:', error)
      setHazards([])
    } else {
      console.log('Loaded hazards with GeoJSON location:', data)
      setHazards(data || [])
    }
  }

  return (
    <>
      <div className="relative">
        <div ref={mapRef} className="w-full h-[600px] rounded-lg" />

        {/* 클러스터링 토글 버튼 */}
        <button
          onClick={() => setClusteringEnabled(!clusteringEnabled)}
          className={`absolute top-4 right-4 px-4 py-2 rounded-lg shadow-lg font-semibold text-sm transition-all ${
            clusteringEnabled
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-white text-gray-700 hover:bg-gray-100 border-2 border-gray-300'
          }`}
          title={clusteringEnabled ? '클러스터링 활성화됨' : '클러스터링 비활성화됨'}
        >
          {clusteringEnabled ? '🎯 클러스터링 ON' : '📍 클러스터링 OFF'}
        </button>
      </div>

      {/* 유닛 위치 자동 업데이트 */}
      <UnitPositionUpdater
        units={units}
        onUpdate={() => {
          loadUnits() // 위치 업데이트 후 유닛 데이터 다시 로드
        }}
      />

      {/* 열화상 영상 모달 */}
      <ThermalVideoModal
        isOpen={selectedUnit !== null}
        onClose={() => setSelectedUnit(null)}
        unitId={selectedUnit?.id || ''}
        unitType={selectedUnit?.type || ''}
      />
    </>
  )
}

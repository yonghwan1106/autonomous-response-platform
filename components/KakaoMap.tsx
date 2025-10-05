'use client'

import { useEffect, useRef } from 'react'

declare global {
  interface Window {
    kakao: any
  }
}

interface KakaoMapProps {
  center?: {
    lat: number
    lng: number
  }
  level?: number
  className?: string
}

export default function KakaoMap({
  center = { lat: 37.5665, lng: 126.9780 }, // 서울시청 기본 좌표
  level = 6,
  className = ''
}: KakaoMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)

  useEffect(() => {
    const loadKakaoMap = () => {
      if (!window.kakao || !window.kakao.maps) {
        // Kakao Maps SDK가 로드되지 않은 경우
        const script = document.createElement('script')
        script.src = `//dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.NEXT_PUBLIC_KAKAO_APP_KEY}&autoload=false`
        script.async = true
        script.onload = () => {
          window.kakao.maps.load(() => {
            initMap()
          })
        }
        document.head.appendChild(script)
      } else {
        initMap()
      }
    }

    const initMap = () => {
      if (!mapRef.current || mapInstance.current) return

      const options = {
        center: new window.kakao.maps.LatLng(center.lat, center.lng),
        level: level
      }

      const map = new window.kakao.maps.Map(mapRef.current, options)
      mapInstance.current = map
    }

    loadKakaoMap()
  }, [center.lat, center.lng, level])

  return <div ref={mapRef} className={className} />
}

export function useKakaoMap() {
  const addMarker = (map: any, position: { lat: number; lng: number }, content?: string) => {
    if (!window.kakao || !map) return

    const markerPosition = new window.kakao.maps.LatLng(position.lat, position.lng)
    const marker = new window.kakao.maps.Marker({
      position: markerPosition
    })

    marker.setMap(map)

    if (content) {
      const infowindow = new window.kakao.maps.InfoWindow({
        content: content
      })
      window.kakao.maps.event.addListener(marker, 'click', () => {
        infowindow.open(map, marker)
      })
    }

    return marker
  }

  return { addMarker }
}

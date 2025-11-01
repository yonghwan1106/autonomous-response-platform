/**
 * 카카오 로컬 API를 사용한 주소-좌표 변환
 */

interface GeocodingResult {
  lat: number
  lng: number
  address?: string
}

export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  try {
    // REST API 키 사용 (서버 사이드용) - KAKAO_REST_API_KEY가 없으면 NEXT_PUBLIC_KAKAO_APP_KEY 사용
    const apiKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_APP_KEY

    if (!apiKey) {
      console.error('Kakao API key is not configured. Set KAKAO_REST_API_KEY or NEXT_PUBLIC_KAKAO_APP_KEY in environment variables.')
      return null
    }

    const response = await fetch(
      `https://dapi.kakao.com/v2/local/search/address.json?query=${encodeURIComponent(address)}`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kakao geocoding API error:', response.status, errorText)
      return null
    }

    const data = await response.json()

    if (data.documents && data.documents.length > 0) {
      const result = data.documents[0]
      return {
        lat: parseFloat(result.y),
        lng: parseFloat(result.x),
        address: result.address_name || address
      }
    }

    console.warn('No geocoding results found for address:', address)
    return null
  } catch (error) {
    console.error('Geocoding error:', error)
    return null
  }
}

/**
 * 네이버 클라우드 Directions 5 API를 사용한 경로 계산
 * 실제 도로 경로를 반환 (모선, 로봇용)
 */
export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<{ lat: number; lng: number }[] | null> {
  try {
    const apiKeyId = process.env.NCP_CLIENT_ID
    const apiKey = process.env.NCP_CLIENT_SECRET

    if (!apiKeyId || !apiKey) {
      console.error('🔑 Naver Cloud Platform API keys are not configured')
      console.error('Please set NCP_CLIENT_ID and NCP_CLIENT_SECRET in environment variables')
      return null
    }

    console.log('🛣️ Calculating route from', origin, 'to', destination)

    // 네이버 Directions 5 API: start와 goal은 경도,위도 순서
    const startParam = `${origin.lng},${origin.lat}`
    const goalParam = `${destination.lng},${destination.lat}`

    const response = await fetch(
      `https://maps.apigw.ntruss.com/map-direction-15/v1/driving?start=${startParam}&goal=${goalParam}&option=traoptimal`,
      {
        headers: {
          'X-NCP-APIGW-API-KEY-ID': apiKeyId,
          'X-NCP-APIGW-API-KEY': apiKey
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Naver Directions API error:', response.status, errorText)
      console.warn('⚠️ Falling back to simple route calculation')
      return null
    }

    const data = await response.json()
    console.log('✅ Route API response code:', data.code)

    // 응답 코드 확인
    if (data.code !== 0) {
      console.error('❌ Route calculation failed:', data.message)
      return null
    }

    // 응답에서 경로 좌표 추출
    if (data.route && data.route.traoptimal && data.route.traoptimal.length > 0) {
      const routeData = data.route.traoptimal[0]
      const path = routeData.path || []

      const waypoints: { lat: number; lng: number }[] = []

      // path는 [[경도, 위도], [경도, 위도], ...] 형식
      path.forEach((point: number[]) => {
        if (point.length >= 2) {
          waypoints.push({
            lng: point[0],
            lat: point[1]
          })
        }
      })

      console.log(`📍 Extracted ${waypoints.length} waypoints from route`)
      console.log(`📏 Total distance: ${routeData.summary?.distance}m, Duration: ${routeData.summary?.duration}ms`)
      return waypoints.length > 0 ? waypoints : null
    }

    return null
  } catch (error) {
    console.error('❌ Route calculation error:', error)
    return null
  }
}

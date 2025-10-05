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
 * 카카오 길찾기 API를 사용한 경로 계산
 */
export async function calculateRoute(
  origin: { lat: number; lng: number },
  destination: { lat: number; lng: number }
): Promise<any> {
  try {
    const apiKey = process.env.KAKAO_REST_API_KEY || process.env.NEXT_PUBLIC_KAKAO_APP_KEY

    if (!apiKey) {
      console.error('Kakao API key is not configured')
      return null
    }

    const response = await fetch(
      `https://apis-navi.kakaomobility.com/v1/directions?origin=${origin.lng},${origin.lat}&destination=${destination.lng},${destination.lat}&priority=RECOMMEND`,
      {
        headers: {
          Authorization: `KakaoAK ${apiKey}`
        }
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Kakao directions API error:', response.status, errorText)
      return null
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Route calculation error:', error)
    return null
  }
}

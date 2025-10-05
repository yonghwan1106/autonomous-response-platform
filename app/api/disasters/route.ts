import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/kakao/geocoding'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

interface DisasterRecord {
  id: string
  created_at: string
  report_text: string
  address: string
  disaster_type: string
  floor: number | null
  trapped_people: boolean
  location: any
  status: string
  metadata: any
}

export async function POST(request: NextRequest) {
  try {
    const { reportText } = await request.json()

    if (!reportText) {
      return NextResponse.json(
        { error: 'Report text is required' },
        { status: 400 }
      )
    }

    // API 키 확인
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ANTHROPIC_API_KEY is not set')
      return NextResponse.json(
        { error: 'Server configuration error: Missing ANTHROPIC_API_KEY' },
        { status: 500 }
      )
    }

    console.log('Starting disaster report analysis...')

    // Claude API를 사용하여 신고 내용 분석
    let message
    try {
      message = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [
          {
            role: 'user',
            content: `다음은 119 재난 신고 내용입니다. 이 텍스트를 분석하여 JSON 형식으로 구조화된 정보를 추출해주세요.

신고 내용: "${reportText}"

다음 형식의 JSON만 반환하세요:
{
  "address": "도로명 또는 지번 주소 (예: 서울특별시 강남구 테헤란로 123, 경기도 용인시 수지구 성복동 123)",
  "disaster_type": "재난 유형 (화재, 구조, 응급의료 등)",
  "floor": 층수 (숫자만, 없으면 null),
  "trapped_people": 사람이 갇혀있는지 여부 (true/false),
  "description": "간단한 상황 설명"
}

주소 추출 시 중요사항:
- 시/도 + 시/군/구 + 읍/면/동을 포함한 정확한 주소를 작성하세요
- 아파트/빌딩명만 있으면 앞에 시/도/구/동을 추가하세요
- 예: "용인 수지구 성복동 엘지빌리지" → "경기도 용인시 수지구 성복동"
- 예: "강남 테헤란로 빌딩" → "서울특별시 강남구 테헤란로"

JSON만 반환하고 다른 설명은 추가하지 마세요.`
          }
        ]
      })
    } catch (anthropicError: any) {
      console.error('Claude API error:', anthropicError)
      return NextResponse.json(
        {
          error: 'Claude API error',
          details: anthropicError.message,
          statusCode: anthropicError.status
        },
        { status: 500 }
      )
    }

    console.log('Claude analysis complete')

    // Claude 응답에서 JSON 추출
    let responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    console.log('Claude response:', responseText)

    // Claude가 ```json 코드 블록으로 감싼 경우 제거
    responseText = responseText.trim()
    if (responseText.startsWith('```json')) {
      responseText = responseText.replace(/^```json\s*\n/, '').replace(/\n```$/, '')
    } else if (responseText.startsWith('```')) {
      responseText = responseText.replace(/^```\s*\n/, '').replace(/\n```$/, '')
    }
    responseText = responseText.trim()

    console.log('Cleaned response:', responseText)

    let analysisResult
    try {
      analysisResult = JSON.parse(responseText)
    } catch (parseError: any) {
      console.error('JSON parse error:', parseError, 'Response:', responseText)
      return NextResponse.json(
        { error: 'Failed to parse Claude response', details: responseText },
        { status: 500 }
      )
    }

    // 주소를 좌표로 변환
    let geoResult = null
    if (analysisResult.address) {
      console.log('🗺️ Geocoding 시작:', analysisResult.address)
      geoResult = await geocodeAddress(analysisResult.address)
      if (geoResult) {
        console.log('✅ Geocoding 성공:', {
          address: analysisResult.address,
          lng: geoResult.lng,
          lat: geoResult.lat
        })
      } else {
        console.error('❌ Geocoding 실패:', {
          address: analysisResult.address,
          message: 'Kakao API가 주소를 찾지 못했습니다. 더 정확한 주소가 필요합니다.'
        })
      }
    } else {
      console.warn('⚠️ 주소 정보가 없습니다:', analysisResult)
    }

    // Supabase에 재난 정보 저장 (RPC 함수 사용)
    console.log('Saving to Supabase...')
    const { data, error } = await supabase
      .rpc('insert_disaster', {
        p_report_text: reportText,
        p_address: analysisResult.address,
        p_disaster_type: analysisResult.disaster_type,
        p_floor: analysisResult.floor,
        p_trapped_people: analysisResult.trapped_people || false,
        p_lng: geoResult?.lng || null,
        p_lat: geoResult?.lat || null,
        p_metadata: {
          description: analysisResult.description,
          analysis: analysisResult
        }
      })
      .single<DisasterRecord>()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save disaster data', details: error.message },
        { status: 500 }
      )
    }

    if (!data) {
      console.error('No data returned from insert_disaster')
      return NextResponse.json(
        { error: 'Failed to save disaster data', details: 'No data returned' },
        { status: 500 }
      )
    }

    console.log('Disaster saved successfully:', data.id)

    // AI 브리핑 생성
    try {
      const briefingMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 512,
        messages: [
          {
            role: 'user',
            content: `다음 재난 상황에 대한 간결한 브리핑을 작성해주세요:

재난 유형: ${analysisResult.disaster_type}
위치: ${analysisResult.address}
층수: ${analysisResult.floor || '정보 없음'}
구조대상자: ${analysisResult.trapped_people ? '있음' : '없음'}
상황: ${analysisResult.description}

브리핑 형식:
- 3-5개의 짧은 문장
- 핵심 정보 위주
- 즉각적인 조치사항 포함
- 관제사가 빠르게 파악할 수 있도록 작성`
          }
        ]
      })

      const briefingText = briefingMessage.content[0].type === 'text'
        ? briefingMessage.content[0].text
        : '브리핑 생성 실패'

      await supabase
        .from('ai_briefings')
        .insert({
          disaster_id: data.id,
          briefing_text: briefingText,
          briefing_type: 'situation'
        })

      console.log('AI briefing created')
    } catch (briefingError) {
      console.error('Failed to create AI briefing:', briefingError)
      // 브리핑 실패해도 재난 접수는 성공으로 처리
    }

    // AI 작전 계획 생성
    try {
      const operationPlanMessage = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [
          {
            role: 'user',
            content: `다음 재난 상황에 대한 구조 작전 계획을 수립해주세요:

**재난 정보:**
- 유형: ${analysisResult.disaster_type}
- 위치: ${analysisResult.address}
- 층수: ${analysisResult.floor || '정보 없음'}
- 구조대상자: ${analysisResult.trapped_people ? '있음 (긴급)' : '없음'}
- 상황: ${analysisResult.description}

**작전 계획 작성 지침:**
1. **우선 조치사항** (3개 이내)
2. **추천 진입 경로** (가장 안전한 경로)
3. **위험 요소 및 대응** (예상되는 위험과 대처법)
4. **필요 장비** (필수 장비 목록)
5. **구조 순서** (단계별 작전 수행 순서)

간결하고 실행 가능한 계획을 작성하세요. 각 항목은 2-3개의 짧은 문장으로 작성하세요.`
          }
        ]
      })

      const operationPlanText = operationPlanMessage.content[0].type === 'text'
        ? operationPlanMessage.content[0].text
        : '작전 계획 생성 실패'

      await supabase
        .from('ai_briefings')
        .insert({
          disaster_id: data.id,
          briefing_text: operationPlanText,
          briefing_type: 'operation_plan'
        })

      console.log('AI operation plan created')
    } catch (operationPlanError) {
      console.error('Failed to create AI operation plan:', operationPlanError)
      // 작전 계획 실패해도 재난 접수는 성공으로 처리
    }

    return NextResponse.json({
      success: true,
      disaster: data,
      analysis: analysisResult
    })
  } catch (error: any) {
    console.error('Error processing disaster report:', error)
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabase
      .from('disasters')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch disasters' },
        { status: 500 }
      )
    }

    return NextResponse.json({ disasters: data })
  } catch (error) {
    console.error('Error fetching disasters:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/kakao/geocoding'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const { reportText } = await request.json()

    if (!reportText) {
      return NextResponse.json(
        { error: 'Report text is required' },
        { status: 400 }
      )
    }

    // Claude API를 사용하여 신고 내용 분석
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: `다음은 119 재난 신고 내용입니다. 이 텍스트를 분석하여 JSON 형식으로 구조화된 정보를 추출해주세요.

신고 내용: "${reportText}"

다음 형식의 JSON만 반환하세요:
{
  "address": "주소 (예: 서울시 강남구 테헤란로 123)",
  "disaster_type": "재난 유형 (화재, 구조, 응급의료 등)",
  "floor": 층수 (숫자만, 없으면 null),
  "trapped_people": 사람이 갇혀있는지 여부 (true/false),
  "description": "간단한 상황 설명"
}

JSON만 반환하고 다른 설명은 추가하지 마세요.`
        }
      ]
    })

    // Claude 응답에서 JSON 추출
    const responseText = message.content[0].type === 'text' ? message.content[0].text : '{}'
    const analysisResult = JSON.parse(responseText)

    // 주소를 좌표로 변환
    let location = null
    if (analysisResult.address) {
      const geoResult = await geocodeAddress(analysisResult.address)
      if (geoResult) {
        location = `POINT(${geoResult.lng} ${geoResult.lat})`
      }
    }

    // Supabase에 재난 정보 저장
    const { data, error } = await supabase
      .from('disasters')
      .insert({
        report_text: reportText,
        address: analysisResult.address,
        disaster_type: analysisResult.disaster_type,
        floor: analysisResult.floor,
        trapped_people: analysisResult.trapped_people || false,
        location: location,
        metadata: {
          description: analysisResult.description,
          analysis: analysisResult
        }
      })
      .select()
      .single()

    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json(
        { error: 'Failed to save disaster data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      disaster: data,
      analysis: analysisResult
    })
  } catch (error) {
    console.error('Error processing disaster report:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
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

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export async function POST(request: NextRequest) {
  try {
    const { disasterId, hazardType, location, area, severity, description } = await request.json()

    if (!disasterId || !hazardType) {
      return NextResponse.json(
        { error: 'Disaster ID and hazard type are required' },
        { status: 400 }
      )
    }

    let locationGeometry = null
    if (location && location.lat && location.lng) {
      locationGeometry = `POINT(${location.lng} ${location.lat})`
    }

    let areaGeometry = null
    if (area && Array.isArray(area) && area.length > 0) {
      // 폴리곤 형식: [[lng, lat], [lng, lat], ...]
      const coords = area.map((point: { lng: number; lat: number }) =>
        `${point.lng} ${point.lat}`
      ).join(',')
      areaGeometry = `POLYGON((${coords}))`
    }

    const { data, error } = await supabase
      .from('hazard_overlays')
      .insert({
        disaster_id: disasterId,
        hazard_type: hazardType,
        location: locationGeometry,
        area: areaGeometry,
        severity: severity || 'medium',
        description: description || null
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating hazard overlay:', error)
      return NextResponse.json(
        { error: 'Failed to create hazard overlay' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      hazard: data
    })
  } catch (error) {
    console.error('Error processing hazard overlay:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const disasterId = searchParams.get('disasterId')

    let query = supabase.from('hazard_overlays').select('*')

    if (disasterId) {
      query = query.eq('disaster_id', disasterId)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch hazard overlays' },
        { status: 500 }
      )
    }

    return NextResponse.json({ hazards: data })
  } catch (error) {
    console.error('Error fetching hazard overlays:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

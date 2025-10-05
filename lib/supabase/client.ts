import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 데이터베이스 타입 정의
export interface Disaster {
  id: string
  created_at: string
  report_text: string
  address: string | null
  disaster_type: string | null
  floor: number | null
  trapped_people: boolean
  location: {
    type: 'Point'
    coordinates: [number, number] // [longitude, latitude]
  } | null
  status: string
  metadata: Record<string, any> | null
}

export interface ResponseBase {
  id: string
  name: string
  location: {
    type: 'Point'
    coordinates: [number, number]
  }
  available: boolean
}

export interface ResponseUnit {
  id: string
  disaster_id: string | null
  base_id: string | null
  unit_type: 'mothership' | 'drone' | 'robot'
  status: 'standby' | 'deployed' | 'active' | 'returning'
  current_location: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  route: any
  created_at: string
  updated_at: string
}

export interface SensorData {
  id: string
  unit_id: string
  disaster_id: string
  data_type: 'thermal' | 'lidar' | 'gas' | 'smoke'
  location: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  data: Record<string, any>
  confidence: number | null
  created_at: string
}

export interface HazardOverlay {
  id: string
  disaster_id: string
  hazard_type: 'fire' | 'collapse' | 'gas_leak' | 'trapped_person'
  location: {
    type: 'Point'
    coordinates: [number, number]
  } | null
  area: any
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string | null
  created_at: string
}

export interface AIBriefing {
  id: string
  disaster_id: string
  briefing_text: string
  briefing_type: 'situation' | 'action_plan'
  created_at: string
}

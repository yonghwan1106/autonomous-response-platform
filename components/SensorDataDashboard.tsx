'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface SensorData {
  id: string
  unit_id: string
  disaster_id: string
  data_type: string
  data: any
  confidence: number
  created_at: string
}

export default function SensorDataDashboard({ disasterId }: { disasterId: string | null }) {
  const [thermalData, setThermalData] = useState<any[]>([])
  const [gasData, setGasData] = useState<any[]>([])
  const [latestData, setLatestData] = useState<{
    temperature?: number
    co?: number
    ch4?: number
    h2s?: number
  }>({})
  const [riskScore, setRiskScore] = useState<number>(0)

  // 위험도 계산 함수 (0-100)
  const calculateRiskScore = (temp?: number, co?: number, ch4?: number, h2s?: number): number => {
    let score = 0

    // 온도 위험도 (40점 만점)
    if (temp) {
      if (temp > 500) score += 40
      else if (temp > 400) score += 30
      else if (temp > 300) score += 20
      else if (temp > 200) score += 10
    }

    // CO 위험도 (25점 만점)
    if (co) {
      if (co > 150) score += 25
      else if (co > 100) score += 18
      else if (co > 50) score += 10
    }

    // CH4 위험도 (20점 만점)
    if (ch4) {
      if (ch4 > 100) score += 20
      else if (ch4 > 70) score += 15
      else if (ch4 > 40) score += 8
    }

    // H2S 위험도 (15점 만점)
    if (h2s) {
      if (h2s > 20) score += 15
      else if (h2s > 15) score += 10
      else if (h2s > 10) score += 5
    }

    return Math.min(score, 100)
  }

  // 위험도 레벨 및 색상 결정
  const getRiskLevel = (score: number): { level: string; color: string; bgColor: string; textColor: string } => {
    if (score >= 80) return { level: '매우 위험', color: 'bg-red-600', bgColor: 'bg-red-50', textColor: 'text-red-800' }
    if (score >= 60) return { level: '위험', color: 'bg-orange-500', bgColor: 'bg-orange-50', textColor: 'text-orange-800' }
    if (score >= 40) return { level: '경고', color: 'bg-yellow-500', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800' }
    if (score >= 20) return { level: '주의', color: 'bg-blue-500', bgColor: 'bg-blue-50', textColor: 'text-blue-800' }
    return { level: '안전', color: 'bg-green-500', bgColor: 'bg-green-50', textColor: 'text-green-800' }
  }

  useEffect(() => {
    if (!disasterId) {
      // disasterId가 없으면 데이터 초기화
      setThermalData([])
      setGasData([])
      setLatestData({})
      return
    }

    // 센서 데이터 로드
    loadSensorData()

    // 즉시 첫 센서 데이터 생성
    simulateSensorData()

    // 센서 데이터 시뮬레이션 (5초마다)
    const interval = setInterval(() => {
      simulateSensorData()
    }, 5000)

    // Realtime 구독
    const channel = supabase
      .channel('sensor-data-channel')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'sensor_data' },
        () => {
          loadSensorData()
        }
      )
      .subscribe()

    return () => {
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [disasterId])

  const loadSensorData = async () => {
    if (!disasterId) return

    const { data, error } = await supabase
      .from('sensor_data')
      .select('*')
      .eq('disaster_id', disasterId)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error('센서 데이터 로드 실패:', error)
      return
    }

    // 데이터 분류
    const thermal: any[] = []
    const gas: any[] = []

    data.forEach((item: SensorData) => {
      const timestamp = new Date(item.created_at).toLocaleTimeString('ko-KR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      })

      if (item.data_type === 'thermal') {
        thermal.push({
          time: timestamp,
          temperature: item.data.temperature || 0,
          hotSpots: item.data.hotSpots || 0
        })
      } else if (item.data_type === 'gas') {
        gas.push({
          time: timestamp,
          CO: item.data.co || 0,
          CH4: item.data.ch4 || 0,
          H2S: item.data.h2s || 0
        })
      }
    })

    setThermalData(thermal.reverse().slice(-10))
    setGasData(gas.reverse().slice(-10))

    // 최신 데이터 업데이트
    let newData = { ...latestData }
    if (thermal.length > 0) {
      newData.temperature = thermal[thermal.length - 1].temperature
    }
    if (gas.length > 0) {
      const latest = gas[gas.length - 1]
      newData.co = latest.CO
      newData.ch4 = latest.CH4
      newData.h2s = latest.H2S
    }
    setLatestData(newData)

    // 위험도 점수 업데이트
    const score = calculateRiskScore(newData.temperature, newData.co, newData.ch4, newData.h2s)
    setRiskScore(score)
  }

  const simulateSensorData = async () => {
    if (!disasterId) return

    // 열화상 센서 데이터 시뮬레이션
    const thermalData = {
      temperature: Math.round(200 + Math.random() * 300), // 200-500°C
      hotSpots: Math.floor(Math.random() * 5) + 1
    }

    const { error: thermalError } = await supabase.from('sensor_data').insert({
      disaster_id: disasterId,
      unit_id: null, // 시뮬레이션 데이터는 unit_id null
      data_type: 'thermal',
      data: thermalData,
      confidence: 0.85 + Math.random() * 0.1
    })

    if (thermalError) {
      console.error('❌ Failed to insert thermal data:', thermalError)
    }

    // 가스 센서 데이터 시뮬레이션
    const gasData = {
      co: Math.round(50 + Math.random() * 100), // 50-150 ppm
      ch4: Math.round(20 + Math.random() * 80), // 20-100 ppm
      h2s: Math.round(5 + Math.random() * 15) // 5-20 ppm
    }

    const { error: gasError } = await supabase.from('sensor_data').insert({
      disaster_id: disasterId,
      unit_id: null, // 시뮬레이션 데이터는 unit_id null
      data_type: 'gas',
      data: gasData,
      confidence: 0.9 + Math.random() * 0.05
    })

    if (gasError) {
      console.error('❌ Failed to insert gas data:', gasError)
    }
  }

  if (!disasterId) {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">실시간 센서 데이터</h2>
        <p className="text-sm text-gray-500">재난을 선택하면 센서 데이터가 표시됩니다.</p>
      </div>
    )
  }

  const riskLevel = getRiskLevel(riskScore)

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">실시간 센서 데이터</h2>

      {/* 위험도 분석 */}
      <div className={`${riskLevel.bgColor} border-2 ${riskLevel.color.replace('bg-', 'border-')} rounded-lg p-4`}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-bold text-gray-800">🔍 AI 위험도 분석</h3>
          <span className={`px-3 py-1 ${riskLevel.color} text-white text-xs font-bold rounded-full`}>
            {riskLevel.level}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-gray-600">위험도 점수</span>
              <span className={`text-lg font-bold ${riskLevel.textColor}`}>{riskScore}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full ${riskLevel.color} transition-all duration-500`}
                style={{ width: `${riskScore}%` }}
              ></div>
            </div>
          </div>
        </div>
        <div className="mt-3 text-xs text-gray-700">
          <div className="grid grid-cols-2 gap-2">
            <div>온도: <span className="font-semibold">{latestData.temperature ? `${latestData.temperature}°C` : 'N/A'}</span></div>
            <div>CO: <span className="font-semibold">{latestData.co ? `${latestData.co}ppm` : 'N/A'}</span></div>
            <div>CH4: <span className="font-semibold">{latestData.ch4 ? `${latestData.ch4}ppm` : 'N/A'}</span></div>
            <div>H2S: <span className="font-semibold">{latestData.h2s ? `${latestData.h2s}ppm` : 'N/A'}</span></div>
          </div>
        </div>
      </div>

      {/* 현재 수치 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-red-50 to-orange-100 p-4 rounded-lg border-2 border-red-200">
          <div className="text-xs text-red-600 font-semibold mb-1">🔥 열화상</div>
          <div className="text-3xl font-bold text-red-700">
            {latestData.temperature || '--'}°C
          </div>
          <div className="text-xs text-red-500 mt-1">드론 센서</div>
        </div>

        <div className="bg-gradient-to-br from-yellow-50 to-amber-100 p-4 rounded-lg border-2 border-yellow-200">
          <div className="text-xs text-yellow-600 font-semibold mb-1">💨 CO 농도</div>
          <div className="text-3xl font-bold text-yellow-700">
            {latestData.co || '--'}<span className="text-lg">ppm</span>
          </div>
          <div className="text-xs text-yellow-500 mt-1">로봇 센서</div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 p-4 rounded-lg border-2 border-blue-200">
          <div className="text-xs text-blue-600 font-semibold mb-1">🌫️ CH4 농도</div>
          <div className="text-3xl font-bold text-blue-700">
            {latestData.ch4 || '--'}<span className="text-lg">ppm</span>
          </div>
          <div className="text-xs text-blue-500 mt-1">로봇 센서</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-indigo-100 p-4 rounded-lg border-2 border-purple-200">
          <div className="text-xs text-purple-600 font-semibold mb-1">☠️ H2S 농도</div>
          <div className="text-3xl font-bold text-purple-700">
            {latestData.h2s || '--'}<span className="text-lg">ppm</span>
          </div>
          <div className="text-xs text-purple-500 mt-1">로봇 센서</div>
        </div>
      </div>

      {/* 열화상 온도 그래프 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-700">열화상 온도 추이</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={thermalData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" style={{ fontSize: '10px' }} />
            <YAxis style={{ fontSize: '10px' }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Line
              type="monotone"
              dataKey="temperature"
              stroke="#ef4444"
              strokeWidth={2}
              name="온도 (°C)"
              dot={{ fill: '#ef4444' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 가스 농도 그래프 */}
      <div>
        <h3 className="text-sm font-semibold mb-2 text-gray-700">가스 농도 추이</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={gasData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" style={{ fontSize: '10px' }} />
            <YAxis style={{ fontSize: '10px' }} />
            <Tooltip />
            <Legend wrapperStyle={{ fontSize: '12px' }} />
            <Bar dataKey="CO" fill="#eab308" name="CO (ppm)" />
            <Bar dataKey="CH4" fill="#3b82f6" name="CH4 (ppm)" />
            <Bar dataKey="H2S" fill="#a855f7" name="H2S (ppm)" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 위험 수준 경고 */}
      {(latestData.co && latestData.co > 100) || (latestData.temperature && latestData.temperature > 400) ? (
        <div className="bg-red-100 border-l-4 border-red-500 p-4 rounded">
          <div className="flex items-center">
            <span className="text-2xl mr-3">⚠️</span>
            <div>
              <p className="font-bold text-red-800">위험 수준 감지!</p>
              <p className="text-sm text-red-600">
                {latestData.temperature && latestData.temperature > 400 && '고온 경보 - '}
                {latestData.co && latestData.co > 100 && 'CO 농도 위험 - '}
                즉시 조치 필요
              </p>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

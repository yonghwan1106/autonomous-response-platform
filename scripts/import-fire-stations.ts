/**
 * 전국 소방서 데이터를 Supabase에 일괄 등록하는 스크립트
 * 실행: npx tsx scripts/import-fire-stations.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// .env.local 파일 직접 파싱
const envPath = path.join(process.cwd(), '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')
const envVars: Record<string, string> = {}

envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    envVars[match[1].trim()] = match[2].trim()
  }
})

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl)
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '(설정됨)' : '(없음)')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function importFireStations() {
  console.log('🚒 전국 소방서 데이터 일괄 등록 시작...')

  // CSV 파일 읽기
  const csvPath = path.join(process.cwd(), 'data', 'fire_stations.csv')
  const csvContent = fs.readFileSync(csvPath, 'utf-8')

  const lines = csvContent.split('\n').filter(line => line.trim())
  const headers = lines[0].split(',')

  console.log(`📄 CSV 파일 로드 완료: ${lines.length - 1}개 소방서`)

  // 기존 데이터 삭제 (선택사항)
  const { error: deleteError } = await supabase
    .from('response_bases')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // 모든 행 삭제

  if (deleteError) {
    console.warn('⚠️ 기존 데이터 삭제 실패 (무시하고 계속):', deleteError.message)
  } else {
    console.log('✅ 기존 소방서 데이터 삭제 완료')
  }

  let successCount = 0
  let errorCount = 0

  // CSV 데이터 파싱 및 삽입
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const [name, address, lng, lat] = line.split(',')

    try {
      // PostGIS GEOGRAPHY 포인트로 삽입
      const { error } = await supabase
        .from('response_bases')
        .insert({
          name: name.trim(),
          location: `SRID=4326;POINT(${parseFloat(lng)} ${parseFloat(lat)})`,
          available: true
        })

      if (error) {
        console.error(`❌ 삽입 실패 [${name}]:`, error.message)
        errorCount++
      } else {
        console.log(`✅ 등록 완료: ${name}`)
        successCount++
      }
    } catch (err) {
      console.error(`❌ 예외 발생 [${name}]:`, err)
      errorCount++
    }
  }

  console.log('\n📊 등록 결과:')
  console.log(`  ✅ 성공: ${successCount}개`)
  console.log(`  ❌ 실패: ${errorCount}개`)
  console.log('\n🎉 소방서 데이터 일괄 등록 완료!')
}

importFireStations().catch(console.error)

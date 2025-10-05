# Supabase 설정 가이드

## 1. Supabase 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 새 프로젝트를 생성합니다.
2. 프로젝트 이름, 데이터베이스 비밀번호, 지역을 설정합니다.

## 2. PostGIS Extension 활성화

Supabase 대시보드에서:
1. SQL Editor로 이동
2. 다음 SQL 실행:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

## 3. 데이터베이스 스키마 적용

`schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행합니다.

## 4. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가합니다:

```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

프로젝트 URL과 anon key는 Supabase 대시보드의 Settings > API에서 확인할 수 있습니다.

## 5. Realtime 기능 활성화

Supabase 대시보드에서:
1. Database > Replication으로 이동
2. 다음 테이블의 Realtime을 활성화:
   - disasters
   - response_units
   - sensor_data
   - hazard_overlays
   - ai_briefings

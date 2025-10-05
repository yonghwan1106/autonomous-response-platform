# 상세 설정 가이드

## 📝 목차

1. [Supabase 설정](#1-supabase-설정)
2. [카카오 개발자 설정](#2-카카오-개발자-설정)
3. [Anthropic API 설정](#3-anthropic-api-설정)
4. [로컬 개발 환경 설정](#4-로컬-개발-환경-설정)
5. [Vercel 배포 설정](#5-vercel-배포-설정)
6. [문제 해결](#6-문제-해결)

---

## 1. Supabase 설정

### 1.1 새 프로젝트 생성

1. [Supabase](https://supabase.com)에 로그인
2. "New Project" 클릭
3. 다음 정보 입력:
   - **Name**: `autonomous-response-platform`
   - **Database Password**: 안전한 비밀번호 설정 (저장 필수)
   - **Region**: `Northeast Asia (Seoul)` 선택 (한국 서비스의 경우)
4. "Create new project" 클릭

### 1.2 PostGIS Extension 활성화

1. Supabase Dashboard > SQL Editor로 이동
2. 다음 SQL 실행:

```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

3. "RUN" 버튼 클릭

### 1.3 데이터베이스 스키마 생성

1. 프로젝트 루트의 `lib/supabase/schema.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기
4. "RUN" 버튼 클릭

### 1.4 데이터베이스 함수 생성

1. 프로젝트 루트의 `lib/supabase/functions.sql` 파일 열기
2. 전체 내용 복사
3. Supabase SQL Editor에 붙여넣기
4. "RUN" 버튼 클릭

### 1.5 Realtime 기능 활성화

1. Supabase Dashboard > Database > Replication으로 이동
2. 다음 테이블의 "REALTIME" 토글 활성화:
   - ✅ `disasters`
   - ✅ `response_units`
   - ✅ `sensor_data`
   - ✅ `hazard_overlays`
   - ✅ `ai_briefings`

### 1.6 API 키 확인

1. Supabase Dashboard > Settings > API로 이동
2. 다음 정보 복사:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...`

---

## 2. 카카오 개발자 설정

### 2.1 애플리케이션 등록

1. [Kakao Developers](https://developers.kakao.com)에 로그인
2. "내 애플리케이션" > "애플리케이션 추가하기" 클릭
3. 앱 정보 입력:
   - **앱 이름**: `자율주행 선발대 관제 플랫폼`
   - **사업자명**: 개인 또는 회사명

### 2.2 플랫폼 설정

1. 생성된 앱 클릭
2. "플랫폼" > "Web 플랫폼 등록" 클릭
3. **사이트 도메인** 입력:
   - 로컬 개발: `http://localhost:3000`
   - Vercel 배포: `https://your-app.vercel.app`

### 2.3 API 키 확인

1. "요약 정보" 탭으로 이동
2. 다음 두 키를 복사:
   - **JavaScript 키**: 브라우저에서 카카오맵 SDK 사용
   - **REST API 키**: 서버에서 지오코딩/길찾기 API 호출 (지오코딩에 필요)

### 2.4 카카오맵 API 활성화

1. "제품 설정" > "지도" 클릭
2. "활성화 설정"에서 "사용" 선택
3. 저장

---

## 3. Anthropic API 설정

### 3.1 API 키 발급

1. [Anthropic Console](https://console.anthropic.com)에 로그인
2. "API Keys" 메뉴로 이동
3. "Create Key" 클릭
4. 키 이름 입력: `autonomous-response-platform`
5. 생성된 API 키 복사 (한 번만 표시됨 - 안전하게 보관)

### 3.2 사용량 확인

1. "Usage" 탭에서 API 호출 및 비용 모니터링
2. 프로토타입의 경우 소량의 크레딧으로 충분

---

## 4. 로컬 개발 환경 설정

### 4.1 환경 변수 파일 생성

프로젝트 루트에 `.env.local` 파일 생성:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...

# Kakao Map (JavaScript 키 - 브라우저에서 지도 표시용)
NEXT_PUBLIC_KAKAO_APP_KEY=your_javascript_key_here

# Kakao REST API (서버에서 지오코딩용 - JavaScript 키와 동일할 수 있음)
KAKAO_REST_API_KEY=your_rest_api_key_here

# Claude API
ANTHROPIC_API_KEY=sk-ant-...
```

**참고**: 카카오 개발자 콘솔에서 JavaScript 키와 REST API 키가 동일한 경우가 많습니다. 두 환경 변수에 같은 값을 넣어도 됩니다.

### 4.2 의존성 설치

```bash
npm install
```

### 4.3 개발 서버 실행

```bash
npm run dev
```

브라우저에서 http://localhost:3000 접속

---

## 5. Vercel 배포 설정

### 5.1 GitHub 저장소 연결

1. 프로젝트를 GitHub에 Push
2. [Vercel](https://vercel.com)에 로그인
3. "New Project" 클릭
4. GitHub 저장소 선택

### 5.2 환경 변수 설정

1. Vercel 프로젝트 > Settings > Environment Variables로 이동
2. 다음 환경 변수 추가:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `NEXT_PUBLIC_KAKAO_APP_KEY` | Kakao JavaScript Key |
| `KAKAO_REST_API_KEY` | Kakao REST API Key (JavaScript 키와 동일 가능) |
| `ANTHROPIC_API_KEY` | Anthropic API Key |

3. "Save" 클릭

**중요**: `KAKAO_REST_API_KEY`를 설정하지 않으면 재난 접수 시 지오코딩이 실패할 수 있습니다.

### 5.3 배포

1. "Deploy" 버튼 클릭
2. 빌드 완료 후 배포 URL 확인
3. 카카오 개발자 콘솔에서 배포 URL을 플랫폼에 추가

---

## 6. 문제 해결

### 6.1 지도가 표시되지 않음

**증상**: 카카오맵 영역이 회색으로 표시

**해결방법**:
1. 카카오 개발자 콘솔에서 JavaScript 키 확인
2. `.env.local`의 `NEXT_PUBLIC_KAKAO_APP_KEY` 값 확인
3. 카카오 개발자 콘솔에서 현재 도메인이 플랫폼에 등록되어 있는지 확인
4. 브라우저 콘솔에서 에러 메시지 확인

### 6.2 Supabase 연결 오류

**증상**: `Failed to fetch disasters` 또는 데이터 로드 실패

**해결방법**:
1. Supabase Dashboard > Settings > API에서 Project URL과 anon key 재확인
2. `.env.local` 파일의 변수명 확인 (`NEXT_PUBLIC_` 접두사 필수)
3. Supabase RLS 정책이 올바르게 설정되어 있는지 확인
4. 개발 서버 재시작 (`npm run dev`)

### 6.3 Claude API 오류

**증상**: 재난 접수 시 `Internal server error`

**해결방법**:
1. Anthropic Console에서 API 키 유효성 확인
2. API 키 잔액 확인
3. `.env.local`의 `ANTHROPIC_API_KEY` 값 확인
4. 서버 로그에서 상세 에러 메시지 확인

### 6.4 Realtime 업데이트가 작동하지 않음

**증상**: 재난 접수 후 지도가 자동으로 업데이트되지 않음

**해결방법**:
1. Supabase Dashboard > Database > Replication에서 해당 테이블의 Realtime이 활성화되어 있는지 확인
2. 브라우저 콘솔에서 WebSocket 연결 상태 확인
3. 페이지 새로고침 후 재시도

### 6.5 PostGIS 함수 오류

**증상**: 선발대 출동 시 `find_nearest_base` 함수 오류

**해결방법**:
1. Supabase SQL Editor에서 PostGIS extension 설치 확인:
```sql
SELECT * FROM pg_extension WHERE extname = 'postgis';
```
2. `lib/supabase/functions.sql` 파일을 다시 실행
3. 샘플 기지 데이터가 삽입되어 있는지 확인:
```sql
SELECT * FROM response_bases;
```

---

## 추가 리소스

- [Next.js 문서](https://nextjs.org/docs)
- [Supabase 문서](https://supabase.com/docs)
- [카카오맵 API 가이드](https://apis.map.kakao.com/web/guide/)
- [Anthropic API 문서](https://docs.anthropic.com/)
- [Vercel 배포 가이드](https://vercel.com/docs)

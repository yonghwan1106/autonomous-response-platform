# 자율주행 선발대 관제 플랫폼

골든타임 확보를 위한 자율주행 선발대 관제 및 정보공유 플랫폼 프로토타입

## 📋 프로젝트 개요

이 프로젝트는 재난 현장에서 자율주행 선발대(모선 차량, 드론, 로봇)가 수집한 실시간 데이터를 효과적으로 시각화하고, AI 기반 분석을 통해 119 종합상황실 관제사와 현장 구조대원에게 실행 가능한 정보를 제공하는 웹 기반 통합 관제 플랫폼입니다.

### 주요 기능

#### ✅ 구현 완료
- **F-01: 재난 발생 시뮬레이션** - Claude AI를 활용한 신고 내용 자동 분석 및 구조화
- **F-02: 선발대 자동 출동** - PostGIS 기반 최근접 기지 탐색 및 자동 배정
- **F-03: 통합 관제 지도** - 카카오맵 기반 실시간 위치 추적 및 Supabase Realtime 연동
- **F-04: 드론 열화상 영상** - 요구조자 및 화점 감지 시뮬레이션
- **F-06: 데이터 오버레이** - 위험 요소(화재, 붕괴, 가스누출) 지도 표시

#### 🔄 향후 추가 예정
- **F-05: 3D 공간 스캔** - LiDAR 포인트 클라우드 시각화 (deck.gl/three.js)
- **F-07: AI 상황 요약** - Claude API 기반 실시간 브리핑
- **F-08: AI 작전 계획** - 수집 데이터 기반 구조 작전 초안 생성
- **F-09: 이동형 대시보드** - 태블릿 최적화 반응형 UI

## 🛠 기술 스택

### Frontend
- **Next.js 15** (React 19, App Router)
- **TypeScript**
- **Tailwind CSS**

### Backend & Database
- **Supabase** (PostgreSQL + PostGIS + Realtime)
- **Row Level Security (RLS)**

### APIs
- **카카오맵 API** - 지도 시각화 및 주소 검색
- **네이버 클라우드 플랫폼 Directions 5 API** - 실시간 경로 탐색
- **Claude Sonnet API** - AI 기반 자연어 처리 및 분석

### Deployment
- **Vercel** - CI/CD 및 호스팅

## 🚀 시작하기

### 1. 사전 요구사항

- Node.js 18+
- npm 또는 yarn
- Supabase 계정
- Kakao Developers 계정 (지도 표시용)
- Naver Cloud Platform 계정 (경로 탐색용)
- Anthropic API 키

### 2. 프로젝트 클론 및 의존성 설치

```bash
git clone <repository-url>
cd autonomous-response-platform
npm install
```

### 3. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Kakao Map (for map display and geocoding)
NEXT_PUBLIC_KAKAO_APP_KEY=your_kakao_javascript_key
KAKAO_REST_API_KEY=your_kakao_rest_api_key

# Naver Cloud Platform (for route calculation - Directions 5 API)
NCP_CLIENT_ID=your_ncp_client_id
NCP_CLIENT_SECRET=your_ncp_client_secret

# Claude API
ANTHROPIC_API_KEY=your_anthropic_api_key
```

#### API 키 발급 방법

**카카오맵 API**
1. [Kakao Developers](https://developers.kakao.com/) 접속
2. 애플리케이션 생성
3. JavaScript 키 복사 → `NEXT_PUBLIC_KAKAO_APP_KEY`
4. REST API 키 복사 → `KAKAO_REST_API_KEY`

**네이버 클라우드 플랫폼 API**
1. [NAVER CLOUD PLATFORM](https://www.ncloud.com/) 접속
2. 콘솔 > AI·Application > AI·NAVER API > Application 등록
3. Maps > Directions 선택
4. Client ID 복사 → `NCP_CLIENT_ID`
5. Client Secret 복사 → `NCP_CLIENT_SECRET`

### 4. Supabase 설정

#### 4.1 PostGIS Extension 활성화
Supabase SQL Editor에서 실행:
```sql
CREATE EXTENSION IF NOT EXISTS postgis;
```

#### 4.2 데이터베이스 스키마 생성
`lib/supabase/schema.sql` 파일의 내용을 Supabase SQL Editor에서 실행

#### 4.3 함수 생성
`lib/supabase/functions.sql` 파일의 내용을 Supabase SQL Editor에서 실행

#### 4.4 Realtime 활성화
Supabase Dashboard > Database > Replication에서 다음 테이블의 Realtime 활성화:
- `disasters`
- `response_units`
- `sensor_data`
- `hazard_overlays`
- `ai_briefings`

### 5. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속

## 📖 사용 가이드

### 재난 신고 접수

1. 우측 패널의 "신규 재난 접수" 영역에 신고 내용 입력
   - 예시: `"서울시 강남구 테헤란로 123 빌딩 3층에서 연기가 나고 사람이 갇혀있어요!"`
2. "재난 접수" 버튼 클릭
3. Claude AI가 자동으로 신고 내용 분석 및 구조화
4. 카카오맵에 재난 위치 마커 표시
5. 가장 가까운 선발대 기지에서 자동 출동

### 지도 인터랙션

- **재난 마커(빨간색)** - 클릭 시 재난 유형 및 주소 표시
- **선발대 유닛 마커** - 클릭 시 유닛 타입 및 상태 표시
- **드론 마커(노란색)** - 클릭 시 열화상 영상 모달 표시
- **위험 요소 마커** - 클릭 시 위험 유형 및 위험도 표시

## 📁 프로젝트 구조

```
autonomous-response-platform/
├── app/
│   ├── api/
│   │   ├── disasters/       # 재난 접수 API
│   │   ├── dispatch/         # 선발대 출동 API
│   │   └── hazards/          # 위험 요소 API
│   ├── layout.tsx
│   └── page.tsx              # 메인 대시보드
├── components/
│   ├── ControlMap.tsx        # 통합 관제 지도
│   ├── DisasterReportForm.tsx # 재난 신고 폼
│   ├── KakaoMap.tsx          # 카카오맵 래퍼
│   └── ThermalVideoModal.tsx # 열화상 영상 모달
├── lib/
│   ├── supabase/
│   │   ├── client.ts         # Supabase 클라이언트
│   │   ├── schema.sql        # DB 스키마
│   │   └── functions.sql     # DB 함수
│   └── kakao/
│       └── geocoding.ts      # 지오코딩 유틸리티
└── public/
```

## 🔐 보안

- 모든 API 통신은 HTTPS 암호화
- Supabase Row Level Security (RLS) 적용
- API 키는 환경 변수로 안전하게 관리
- Vercel 대시보드에서 환경 변수 관리

## 🎯 향후 계획

1. **실제 하드웨어 연동** - ROS 브릿지를 통한 자율주행 유닛 연동
2. **AR 지원** - AR 글래스를 통한 현장 구조대원 정보 제공
3. **예측 분석** - 화재 확산, 건물 붕괴 위험 예측 ML 모델
4. **공공 데이터 통합** - 건축물대장, 지하 매설물 지도 연동

## 📄 라이선스

이 프로젝트는 프로토타입이며, 상업적 사용을 위해서는 별도의 라이선스가 필요합니다.

## 🤝 기여

프로토타입 프로젝트로 현재 외부 기여를 받지 않습니다.

## 📞 문의

프로젝트 관련 문의사항은 이슈를 통해 남겨주세요.

---

**골든타임 확보, 생명을 구하는 기술**

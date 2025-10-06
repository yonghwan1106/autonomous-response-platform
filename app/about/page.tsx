'use client'

import Link from 'next/link'

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <header className="bg-emergency-red text-white py-6 px-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">프로젝트 소개</h1>
              <p className="text-sm opacity-90">골든타임 확보를 위한 자율주행 선발대 시스템</p>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/"
                className="bg-white text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
              >
                관제 화면
              </Link>
              <Link
                href="/guide"
                className="bg-white text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
              >
                사용 가이드
              </Link>
              <span className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-default">
                프로젝트 소개
              </span>
            </div>
          </div>
        </header>

        {/* 프로젝트 개요 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">
            골든타임 확보를 위한 자율주행 선발대
          </h2>
          <p className="text-xl text-gray-600 mb-6">
            재난 대응 패러다임의 전환
          </p>

          <div className="grid md:grid-cols-2 gap-6 mb-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-3">🎯 핵심 개념</h3>
              <p className="text-gray-700">
                재난 발생 시, 인간 구조대보다 먼저 현장에 출동하는
                <strong className="text-blue-600"> &apos;자율주행 선발대(Autonomous First Responder)&apos;</strong>를
                도입하여 골든타임을 확보하고 구조 활동의 패러다임을 전환하는 새로운 공공 안전 서비스
              </p>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-800 mb-3">⚙️ 작동 방식</h3>
              <p className="text-gray-700">
                119 신고 접수와 동시에 자율주행 차량과 드론으로 구성된 선발대가 자동 출동하여,
                인간 구조대가 도착하기 전 현장의 핵심 정보를 실시간으로 수집 및 전송
              </p>
            </div>
          </div>

          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold text-purple-800 mb-3">🎯 궁극적 목표</h3>
            <p className="text-gray-700">
              자율주행 기술을 통해 <strong>&apos;정보의 공백&apos;</strong> 상태로 현장에 진입해야 했던
              구조대원의 위험을 줄이고, 데이터에 기반한 정밀 구조 작전을 가능하게 하여
              <strong className="text-purple-600"> 국민의 생명과 안전 보호</strong>
            </p>
          </div>
        </section>

        {/* 현황 및 문제점 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">현황 및 문제점</h2>

          <div className="space-y-6">
            <div className="border-l-4 border-red-500 pl-6 py-4 bg-red-50">
              <h3 className="text-xl font-bold text-red-800 mb-3">
                1. 골든타임 확보 실패 및 국민 생명 위협
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>재난 현장에서 초기 5~8분으로 정의되는 &apos;골든타임&apos;은 생존율과 직결</li>
                <li>소방차의 골든타임 내 현장 도착률은 약 <strong>60% 수준</strong>에 머물러 있음</li>
                <li>교통 체증, 출동 준비 시간 등으로 인한 지연이 생명을 위협</li>
              </ul>
            </div>

            <div className="border-l-4 border-orange-500 pl-6 py-4 bg-orange-50">
              <h3 className="text-xl font-bold text-orange-800 mb-3">
                2. 정보 부재로 인한 구조대원의 위험 노출
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>구조대원은 화재 규모, 내부 구조, 요구조자 위치 등 핵심 정보 없이 출동</li>
                <li><strong>&apos;정보의 안개&apos;</strong> 속에서 위험한 임무 시작</li>
                <li>소방 활동 중 발생하는 순직 및 공상자 수가 매년 지속적으로 발생</li>
              </ul>
            </div>

            <div className="border-l-4 border-yellow-500 pl-6 py-4 bg-yellow-50">
              <h3 className="text-xl font-bold text-yellow-800 mb-3">
                3. 아날로그 방식에 머무른 초기 대응 체계
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>신고 접수 후 인간 대원이 출동하여 현장 상황을 &apos;눈으로&apos; 파악하는 전통적 방식</li>
                <li>자율주행, 드론, AI 등 4차 산업혁명 기술을 재난 대응 초기 단계에 미활용</li>
                <li>&apos;과학적 재난관리체계&apos; 구축 목표 달성에 걸림돌</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 시스템 구성 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">시스템 구성</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-blue-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">🚗</div>
              <h3 className="text-xl font-bold text-blue-800 mb-3">모선 차량</h3>
              <p className="text-gray-700 mb-4">
                자율주행 &apos;모선(Mothership)&apos; 차량에 정찰 드론, 통신 중계 드론, 소형 지상 탐사 로봇 탑재
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>C-ITS 연동 최적 경로 이동</li>
                <li>긴급차량 우선 신호</li>
                <li>3D 공간 데이터 수집</li>
              </ul>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">🚁</div>
              <h3 className="text-xl font-bold text-yellow-800 mb-3">정찰 드론</h3>
              <p className="text-gray-700 mb-4">
                열화상 카메라 탑재 드론으로 고공에서 현장 상황 실시간 분석
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>요구조자 위치 파악</li>
                <li>화재 확산 방향 감지</li>
                <li>건물 붕괴 위험 분석</li>
              </ul>
            </div>

            <div className="bg-green-50 p-6 rounded-lg">
              <div className="text-4xl mb-4">🤖</div>
              <h3 className="text-xl font-bold text-green-800 mb-3">지상 로봇</h3>
              <p className="text-gray-700 mb-4">
                소형 탐사 로봇으로 건물 내부 진입 및 상세 정보 수집
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>내부 구조 파악</li>
                <li>가스 농도 측정</li>
                <li>통신망 중계</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 주요 기능 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">주요 기능</h2>

          <div className="grid md:grid-cols-2 gap-6">
            <div className="border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-blue-800 mb-4 flex items-center gap-2">
                <span>📍</span> 실시간 경로 추적
              </h3>
              <p className="text-gray-700 mb-3">
                선발대 유닛의 실시간 이동 경로를 지도에 색상별로 시각화
              </p>
              <div className="flex gap-2 text-sm">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded">모선: 파란색</span>
                <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded">드론: 노란색</span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded">로봇: 초록색</span>
              </div>
            </div>

            <div className="border-2 border-red-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-red-800 mb-4 flex items-center gap-2">
                <span>🔥</span> 열화상 영상 스트리밍
              </h3>
              <p className="text-gray-700 mb-3">
                드론의 열화상 카메라로 요구조자 위치 및 화점 실시간 감지
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>AI 객체 감지 (신뢰도 표시)</li>
                <li>실시간 온도 측정</li>
                <li>감지 위치 지도 표시</li>
              </ul>
            </div>

            <div className="border-2 border-green-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-green-800 mb-4 flex items-center gap-2">
                <span>🤖</span> AI 작전 계획 생성
              </h3>
              <p className="text-gray-700 mb-3">
                Claude AI가 재난 상황을 분석하여 자동으로 구조 작전 계획 수립
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>우선 조치사항</li>
                <li>추천 진입 경로</li>
                <li>위험 요소 및 대응</li>
                <li>필요 장비 및 구조 순서</li>
              </ul>
            </div>

            <div className="border-2 border-purple-200 rounded-lg p-6">
              <h3 className="text-xl font-bold text-purple-800 mb-4 flex items-center gap-2">
                <span>📊</span> 통합 관제 대시보드
              </h3>
              <p className="text-gray-700 mb-3">
                모든 정보를 하나의 화면에서 실시간으로 모니터링
              </p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>재난 발생 현황</li>
                <li>선발대 위치 추적</li>
                <li>AI 상황 브리핑</li>
                <li>위험 요소 오버레이</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 기대 효과 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">기대 효과</h2>

          <div className="space-y-6">
            <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-blue-800 mb-3">
                💙 국민 생존율 극대화 (사회적 효과)
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>실질적 골든타임 연장을 통한 생존율 획기적 향상</li>
                <li>첨단 기술 활용한 과학적 재난 대응으로 국민 신뢰도 향상</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-green-800 mb-3">
                💚 구조대원 안전 확보 (정책적 효과)
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>현장 진입 전 위험 요소 사전 파악으로 구조대원 안전 향상</li>
                <li>순직 및 공상 사고 감소에 기여</li>
                <li>&apos;제5차 국가안전관리기본계획&apos; 등 정부 정책 직접 구현</li>
              </ul>
            </div>

            <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
              <h3 className="text-xl font-bold text-purple-800 mb-3">
                💜 비용 절감 및 신산업 창출 (경제적 효과)
              </h3>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>초기 대응 실패로 인한 대형 재난 확산 방지로 사회적 비용 절감</li>
                <li>자율주행 재난 대응 로봇 및 플랫폼 개발로 신산업 육성</li>
                <li>국내 관련 산업 기술 경쟁력 향상 및 수출 시장 개척</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 기술 스택 */}
        <section className="bg-white rounded-lg shadow-md p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">기술 스택</h2>

          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-3">Frontend</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Next.js 15</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">React 19</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">TypeScript</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Tailwind CSS</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-3">Backend & Database</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Supabase</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">PostgreSQL</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">PostGIS</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Realtime</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-700 mb-3">AI & Maps</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Claude Sonnet 4</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Kakao Map API</span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-sm">Geocoding API</span>
              </div>
            </div>
          </div>
        </section>

        {/* 공모전 정보 */}
        <section className="bg-gradient-to-r from-emergency-red to-red-600 text-white rounded-lg shadow-md p-8 mb-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">자율주행 일상 서비스 아이디어 국민제안 공모전</h2>
            <p className="text-lg mb-6">출품작</p>
            <div className="flex justify-center gap-4">
              <Link
                href="/"
                className="bg-white text-emergency-red px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition"
              >
                관제 플랫폼 체험하기
              </Link>
              <a
                href="/docs/proposal.md"
                target="_blank"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-lg font-bold hover:bg-white hover:text-emergency-red transition"
              >
                제안서 보기
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-600 py-8">
          <p className="text-sm">
            © 2025 자율주행 선발대 관제 플랫폼. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            🤖 Powered by Claude Sonnet 4 | 🗺️ Kakao Map API | 🗄️ Supabase + PostGIS
          </p>
        </footer>
      </div>
    </main>
  )
}

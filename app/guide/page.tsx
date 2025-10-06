'use client'

export default function GuidePage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* 헤더 */}
        <header className="bg-emergency-red text-white py-6 px-8 rounded-lg shadow-lg mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">사용 가이드</h1>
              <p className="text-red-100">자율주행 선발대 관제 플랫폼 사용법</p>
            </div>
            <div className="flex items-center gap-3">
              <a
                href="/"
                className="bg-white text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
              >
                관제 화면
              </a>
              <a
                href="/guide"
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg text-sm font-semibold cursor-default"
              >
                사용 가이드
              </a>
              <a
                href="/about"
                className="bg-white text-emergency-red px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition"
              >
                프로젝트 소개
              </a>
            </div>
          </div>
        </header>

        {/* 목차 */}
        <nav className="bg-white p-6 rounded-lg shadow-md mb-8">
          <h2 className="text-xl font-bold mb-4 text-gray-800">목차</h2>
          <ul className="space-y-2 text-blue-600">
            <li><a href="#overview" className="hover:underline">1. 프로젝트 개요</a></li>
            <li><a href="#features" className="hover:underline">2. 주요 기능</a></li>
            <li><a href="#disaster-report" className="hover:underline">3. 재난 신고하기</a></li>
            <li><a href="#monitoring" className="hover:underline">4. 실시간 모니터링</a></li>
            <li><a href="#ai-briefing" className="hover:underline">5. AI 상황 브리핑</a></li>
            <li><a href="#tech-stack" className="hover:underline">6. 기술 스택</a></li>
          </ul>
        </nav>

        {/* 1. 프로젝트 개요 */}
        <section id="overview" className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">1. 프로젝트 개요</h2>
          <p className="text-gray-700 mb-4 leading-relaxed">
            <strong>자율주행 선발대 관제 플랫폼</strong>은 재난 현장에 자율주행 모선(mothership), 드론(drone), 로봇(robot)을
            자동으로 출동시켜 실시간으로 관제하는 웹 기반 시스템입니다.
          </p>
          <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
            <p className="text-blue-900">
              <strong>핵심 가치:</strong> AI와 자율주행 기술을 활용하여 재난 대응 골든타임을 단축하고,
              119 구조대와 소방관에게 실시간 현장 정보를 제공합니다.
            </p>
          </div>
        </section>

        {/* 2. 주요 기능 */}
        <section id="features" className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">2. 주요 기능</h2>
          <div className="grid gap-4">
            <div className="border-l-4 border-red-500 pl-4 py-2">
              <h3 className="font-bold text-lg mb-2">🚨 자연어 재난 신고</h3>
              <p className="text-gray-700">
                사용자가 일상 언어로 재난을 신고하면 Claude AI가 자동으로 분석하여 주소, 재난 유형, 층수, 인명 피해 등을 추출합니다.
              </p>
            </div>

            <div className="border-l-4 border-blue-500 pl-4 py-2">
              <h3 className="font-bold text-lg mb-2">🚗 자동 출동 시스템</h3>
              <p className="text-gray-700">
                PostGIS 기반 공간 데이터베이스를 활용하여 재난 현장에서 가장 가까운 소방서를 찾고,
                모선/드론/로봇을 자동으로 출동시킵니다.
              </p>
            </div>

            <div className="border-l-4 border-yellow-500 pl-4 py-2">
              <h3 className="font-bold text-lg mb-2">🗺️ 실시간 경로 시각화</h3>
              <p className="text-gray-700">
                • <strong>모선/로봇:</strong> Kakao 길찾기 API로 실제 도로 경로 표시<br />
                • <strong>드론:</strong> 직선 비행 경로 표시
              </p>
            </div>

            <div className="border-l-4 border-green-500 pl-4 py-2">
              <h3 className="font-bold text-lg mb-2">📡 Realtime 업데이트</h3>
              <p className="text-gray-700">
                Supabase Realtime을 통해 모든 관제 담당자에게 실시간으로 재난/유닛 상태가 동기화됩니다.
              </p>
            </div>

            <div className="border-l-4 border-purple-500 pl-4 py-2">
              <h3 className="font-bold text-lg mb-2">🤖 AI 상황 브리핑</h3>
              <p className="text-gray-700">
                Claude AI가 재난 상황을 분석하여 우선 조치사항, 필요 장비, 위험 요소 등을 브리핑합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 3. 재난 신고하기 */}
        <section id="disaster-report" className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">3. 재난 신고하기</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">📝 신고 방법</h3>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>메인 화면 왼쪽 상단 &ldquo;재난 내용 입력&rdquo; 텍스트 영역 클릭</li>
                <li>자연어로 재난 상황 입력 (아래 예시 참고)</li>
                <li>&ldquo;신고하기&rdquo; 버튼 클릭</li>
                <li>AI가 분석 완료 후 자동으로 선발대 출동</li>
              </ol>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-lg mb-2">✅ 신고 예시</h3>
              <div className="space-y-2">
                <div className="bg-white p-3 rounded border">
                  <code className="text-sm">서울시 강남구 테헤란로 123 빌딩 5층에서 화재가 발생했어요. 연기가 많이 나고 사람들이 갇혀있습니다!</code>
                </div>
                <div className="bg-white p-3 rounded border">
                  <code className="text-sm">경기도 성남시 분당구 정자동 아파트 15층에서 불이 났어요. 베란다에 사람들이 갇혀있습니다!</code>
                </div>
                <div className="bg-white p-3 rounded border">
                  <code className="text-sm">인천 부평구 공장 지하 1층에서 가스 냄새가 심하게 나요. 직원들 대피 중입니다.</code>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg border-l-4 border-yellow-500">
              <p className="text-yellow-900">
                <strong>💡 Tip:</strong> 주소, 층수, 재난 유형, 인명 피해 여부를 포함하면 AI가 더 정확하게 분석합니다.
              </p>
            </div>
          </div>
        </section>

        {/* 4. 실시간 모니터링 */}
        <section id="monitoring" className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">4. 실시간 모니터링</h2>

          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">🗺️ 지도 화면</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><span className="inline-block w-4 h-4 bg-red-500 rounded-full mr-2"></span> 재난 발생지 (빨간 원)</li>
                <li><span className="inline-block w-4 h-4 bg-blue-500 rounded-full mr-2"></span> 모선 차량 마커</li>
                <li><span className="inline-block w-4 h-4 bg-yellow-500 rounded-full mr-2"></span> 드론 마커</li>
                <li><span className="inline-block w-4 h-4 bg-green-500 rounded-full mr-2"></span> 로봇 마커</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">📊 이동 경로</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-700">
                <li><span className="inline-block w-12 h-1 bg-blue-500 mr-2"></span> <strong>모선 경로:</strong> 실제 도로를 따라 이동</li>
                <li><span className="inline-block w-12 h-1 bg-yellow-500 mr-2"></span> <strong>드론 경로:</strong> 직선 비행 (공중)</li>
                <li><span className="inline-block w-12 h-1 bg-green-500 mr-2"></span> <strong>로봇 경로:</strong> 실제 도로를 따라 이동</li>
              </ul>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-blue-900">
                <strong>🔄 실시간 업데이트:</strong> 새로운 재난이 신고되거나 유닛이 이동하면
                모든 관제 화면에 자동으로 반영됩니다.
              </p>
            </div>
          </div>
        </section>

        {/* 5. AI 상황 브리핑 */}
        <section id="ai-briefing" className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">5. AI 상황 브리핑</h2>

          <div className="space-y-4">
            <p className="text-gray-700">
              재난 신고가 접수되면 Claude AI가 자동으로 상황을 분석하여 브리핑을 생성합니다:
            </p>

            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 브리핑 항목</h3>
              <ul className="list-disc list-inside space-y-1 text-gray-700">
                <li>재난 유형 및 위험도 평가</li>
                <li>우선 조치사항 (1차, 2차, 3차)</li>
                <li>필요 장비 및 인력</li>
                <li>주의사항 및 위험 요소</li>
                <li>예상 작전 시간</li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-2">📍 확인 방법</h3>
              <p className="text-gray-700">
                메인 화면 오른쪽 하단 &ldquo;AI 상황 브리핑&rdquo; 섹션에서 실시간으로 확인할 수 있습니다.
              </p>
            </div>
          </div>
        </section>

        {/* 6. 기술 스택 */}
        <section id="tech-stack" className="bg-white p-8 rounded-lg shadow-md mb-8">
          <h2 className="text-2xl font-bold mb-4 text-gray-800">6. 기술 스택</h2>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">🖥️ Frontend</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Next.js 15 (App Router)</li>
                <li>• React 19</li>
                <li>• TypeScript</li>
                <li>• Tailwind CSS</li>
                <li>• Kakao Maps SDK</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">🗄️ Backend</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Supabase (PostgreSQL)</li>
                <li>• PostGIS (공간 데이터)</li>
                <li>• Supabase Realtime</li>
                <li>• Next.js API Routes</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">🤖 AI & APIs</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Claude Sonnet 4 API</li>
                <li>• Kakao Geocoding API</li>
                <li>• Kakao Directions API</li>
              </ul>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-bold mb-2">📊 Data</h3>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• 수도권 소방서 88곳</li>
                <li>• PostGIS 공간 쿼리</li>
                <li>• GeoJSON 형식</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="text-center text-gray-500 text-sm mt-12 pb-8">
          <p>자율주행 선발대 관제 플랫폼 © 2025</p>
          <p className="mt-2">긴급 상황 시 실제 119에 신고하세요</p>
        </footer>
      </div>
    </div>
  )
}

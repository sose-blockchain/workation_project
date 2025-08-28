import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* 헤더 */}
      <header className="p-6 flex justify-between items-center">
        <div className="text-sm text-gray-700">
          프로젝트 정보 · 스토어 
        </div>
        <div className="flex items-center space-x-4">
          <button className="p-2 rounded-full hover:bg-gray-100">
            <svg className="w-6 h-6 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM6,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM12,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM16,6c0,1.1 0.9,2 2,2s2,-0.9 2,-2 -0.9,-2 -2,-2 -2,0.9 -2,2zM12,8c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,14c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2zM18,20c1.1,0 2,-0.9 2,-2s-0.9,-2 -2,-2 -2,0.9 -2,2 0.9,2 2,2z"/>
            </svg>
          </button>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700">
            로그인
          </button>
        </div>
      </header>

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col justify-center items-center px-4">
        <div className="text-center mb-8 max-w-2xl">
          <div className="mb-8">
            <svg className="w-20 h-20 mx-auto mb-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,0 2,12C2,16.42 4.87,20.17 8.84,21.5C9.34,21.58 9.5,21.27 9.5,21C9.5,20.77 9.5,20.14 9.5,19.31C6.73,19.91 6.14,17.97 6.14,17.97C5.68,16.81 5.03,16.5 5.03,16.5C4.12,15.88 5.1,15.9 5.1,15.9C6.1,15.97 6.63,16.93 6.63,16.93C7.5,18.45 8.97,18 9.54,17.76C9.63,17.11 9.89,16.67 10.17,16.42C7.95,16.17 5.62,15.31 5.62,11.5C5.62,10.39 6,9.5 6.65,8.79C6.55,8.54 6.2,7.5 6.75,6.15C6.75,6.15 7.59,5.88 9.5,7.17C10.29,6.95 11.15,6.84 12,6.84C12.85,6.84 13.71,6.95 14.5,7.17C16.41,5.88 17.25,6.15 17.25,6.15C17.8,7.5 17.45,8.54 17.35,8.79C18,9.5 18.38,10.39 18.38,11.5C18.38,15.32 16.04,16.16 13.81,16.41C14.17,16.72 14.5,17.33 14.5,18.26C14.5,19.6 14.5,20.68 14.5,21C14.5,21.27 14.66,21.59 15.17,21.5C19.14,20.16 22,16.42 22,12A10,10 0 0,0 12,2Z"/>
            </svg>
          </div>
          <h1 className="text-6xl font-normal text-gray-900 mb-6">
            <span className="text-blue-600">프로젝트</span> 리서치
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            블록체인 프로젝트의 종합적인 정보를 AI로 자동 수집하는 플랫폼
          </p>
        </div>

        {/* Google 스타일 기능 버튼들 */}
        <div className="flex flex-wrap justify-center gap-4 mb-8">
          <Link 
            href="/research"
            className="bg-gray-50 border border-gray-300 rounded-md px-6 py-3 text-sm text-gray-700 hover:shadow-md hover:border-gray-400 transition-all duration-200"
          >
            프로젝트 리서치
          </Link>
          <Link 
            href="/sns"
            className="bg-gray-50 border border-gray-300 rounded-md px-6 py-3 text-sm text-gray-700 hover:shadow-md hover:border-gray-400 transition-all duration-200"
          >
            SNS 분석
          </Link>
          <button className="bg-gray-50 border border-gray-300 rounded-md px-6 py-3 text-sm text-gray-700 hover:shadow-md hover:border-gray-400 transition-all duration-200">
            AI 요약
          </button>
        </div>

        {/* 검색 제안 */}
        <div className="text-center text-sm text-gray-600 mb-8">
          <p>다른 지역의 Workation도 사용해 보세요: 
            <a href="#" className="text-blue-600 hover:underline ml-1">English</a>
          </p>
        </div>
      </div>

      {/* 하단 설명 섹션 */}
      <div className="bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-blue-600 text-2xl mb-3">🔍</div>
              <h3 className="font-medium text-gray-900 mb-2">프로젝트 리서치</h3>
              <p className="text-sm text-gray-600">
                AI가 자동으로 프로젝트 정보를 수집하고 분석합니다
              </p>
            </div>
            <div className="text-center">
              <div className="text-green-600 text-2xl mb-3">📱</div>
              <h3 className="font-medium text-gray-900 mb-2">SNS 분석</h3>
              <p className="text-sm text-gray-600">
                팀원들의 소셜미디어 활동도를 측정합니다
              </p>
            </div>
            <div className="text-center">
              <div className="text-purple-600 text-2xl mb-3">📊</div>
              <h3 className="font-medium text-gray-900 mb-2">종합 보고서</h3>
              <p className="text-sm text-gray-600">
                모든 데이터를 종합한 인사이트를 제공합니다
              </p>
            </div>
          </div>
        </div>
      </div>

    </main>
  )
}

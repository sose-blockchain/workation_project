import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            프로젝트 리서치 AI Agent
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            블록체인 프로젝트에 대한 종합적인 리서치를 AI를 통해 자동화하는 플랫폼
          </p>
        </div>

        {/* 기능 카드들 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-blue-600 text-3xl mb-4">📄</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              프로젝트 리서치
            </h3>
            <p className="text-gray-600 mb-4">
              프로젝트 정보를 입력하고 AI가 자동으로 분석하여 인사이트를 제공합니다.
            </p>
            <Link 
              href="/research"
              className="inline-block bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              시작하기
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-green-600 text-3xl mb-4">📱</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              SNS 리서치
            </h3>
            <p className="text-gray-600 mb-4">
              프로젝트와 팀원의 SNS 활동을 분석하여 영향도와 참여도를 측정합니다.
            </p>
            <Link 
              href="/sns"
              className="inline-block bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors"
            >
              시작하기
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="text-purple-600 text-3xl mb-4">📝</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              노션 연동
            </h3>
            <p className="text-gray-600 mb-4">
              리서치 결과를 자동으로 노션에 정리하여 체계적인 문서를 생성합니다.
            </p>
            <Link 
              href="/notion"
              className="inline-block bg-purple-600 text-white px-4 py-2 rounded-md hover:bg-purple-700 transition-colors"
            >
              시작하기
            </Link>
          </div>
        </div>

        {/* 기술 스택 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            기술 스택
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl mb-2">⚛️</div>
              <p className="font-medium">React + Next.js</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🗄️</div>
              <p className="font-medium">Supabase</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🤖</div>
              <p className="font-medium">Gemini AI</p>
            </div>
            <div className="text-center">
              <div className="text-2xl mb-2">🚀</div>
              <p className="font-medium">Vercel</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

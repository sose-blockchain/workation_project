'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types/project'
import { 
  calculateUrlQualityScore, 
  generateSearchImprovementSuggestions,
  RECOMMENDED_DATA_SOURCES,
  calculateSourceReliability
} from '@/lib/searchEnhancements'

interface SearchImprovementsProps {
  projects: Project[]
}

export default function SearchImprovements({ projects }: SearchImprovementsProps) {
  const [analysis, setAnalysis] = useState<any>(null)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (projects.length > 0) {
      analyzeProjects()
    }
  }, [projects])

  const analyzeProjects = () => {
    const totalProjects = projects.length
    let totalQualityScore = 0
    let projectsWithIssues = 0
    const allSuggestions: any[] = []

    projects.forEach(project => {
      const urls = {
        homepage_url: project.homepage_url,
        whitepaper_url: project.whitepaper_url,
        docs_url: project.docs_url,
        blog_url: project.blog_url,
        project_twitter_url: project.project_twitter_url,
        team_twitter_urls: project.team_twitter_urls
      }

      const qualityScore = calculateUrlQualityScore(urls)
      totalQualityScore += qualityScore.score
      
      if (qualityScore.score < 70) {
        projectsWithIssues++
      }

      const projectSuggestions = generateSearchImprovementSuggestions({
        name: project.name,
        description: project.description,
        urls
      })

      allSuggestions.push(...projectSuggestions)
    })

    const avgQualityScore = totalProjects > 0 ? Math.round(totalQualityScore / totalProjects) : 0
    
    setAnalysis({
      totalProjects,
      avgQualityScore,
      projectsWithIssues,
      suggestions: allSuggestions,
      qualityGrade: getQualityGrade(avgQualityScore)
    })
  }

  const getQualityGrade = (score: number): { grade: string, color: string, description: string } => {
    if (score >= 80) {
      return { grade: 'A', color: 'green', description: '우수' }
    } else if (score >= 60) {
      return { grade: 'B', color: 'blue', description: '양호' }
    } else if (score >= 40) {
      return { grade: 'C', color: 'yellow', description: '보통' }
    } else {
      return { grade: 'D', color: 'red', description: '개선 필요' }
    }
  }

  if (!analysis) return null

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* 헤더 */}
      <div 
        className="p-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-medium text-gray-900">검색 품질 분석</h3>
              <p className="text-sm text-gray-600">
                평균 점수: {analysis.avgQualityScore}/100 ({analysis.qualityGrade.description})
              </p>
            </div>
          </div>
          <div className="flex items-center">
            <div className={`w-12 h-8 rounded-full flex items-center justify-center text-white font-bold mr-2 ${
              analysis.qualityGrade.color === 'green' ? 'bg-green-500' :
              analysis.qualityGrade.color === 'blue' ? 'bg-blue-500' :
              analysis.qualityGrade.color === 'yellow' ? 'bg-yellow-500' : 'bg-red-500'
            }`}>
              {analysis.qualityGrade.grade}
            </div>
            <svg 
              className={`w-5 h-5 text-gray-400 transform transition-transform ${isOpen ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* 세부 내용 */}
      {isOpen && (
        <div className="p-4 space-y-6">
          {/* 통계 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analysis.totalProjects}</div>
              <div className="text-sm text-blue-700">총 프로젝트</div>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analysis.totalProjects - analysis.projectsWithIssues}</div>
              <div className="text-sm text-green-700">양호한 프로젝트</div>
            </div>
            <div className="bg-red-50 p-3 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{analysis.projectsWithIssues}</div>
              <div className="text-sm text-red-700">개선 필요</div>
            </div>
          </div>

          {/* 개선 제안 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">🚀 검색 기능 개선 제안</h4>
            <div className="space-y-3">
              {/* 우선순위별 제안 */}
              {['high', 'medium', 'low'].map(priority => {
                const prioritySuggestions = analysis.suggestions.filter((s: any) => s.priority === priority)
                if (prioritySuggestions.length === 0) return null

                return (
                  <div key={priority}>
                    <div className={`text-sm font-medium mb-2 ${
                      priority === 'high' ? 'text-red-600' : 
                      priority === 'medium' ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      {priority === 'high' ? '🔴 높음' : priority === 'medium' ? '🟡 보통' : '🟢 낮음'} 우선순위
                    </div>
                    <div className="space-y-2 ml-4">
                      {prioritySuggestions.slice(0, 3).map((suggestion: any, index: number) => (
                        <div key={index} className="border-l-2 border-gray-200 pl-3">
                          <div className="font-medium text-gray-900 text-sm">{suggestion.suggestion}</div>
                          <div className="text-xs text-gray-600 mt-1">{suggestion.implementation}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* 권장 데이터 소스 */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">📊 권장 데이터 소스</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(RECOMMENDED_DATA_SOURCES).map(([category, sources]) => (
                <div key={category} className="border border-gray-200 rounded-lg p-3">
                  <h5 className="font-medium text-gray-800 mb-2 capitalize">{category}</h5>
                  <ul className="space-y-1">
                    {sources.map((source, index) => (
                      <li key={index} className="text-sm text-gray-600 flex items-center">
                        <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-2"></span>
                        {source}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* 자동화 제안 */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">🤖 자동화 개선 방안</h4>
            <div className="space-y-2 text-sm text-gray-700">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✅</span>
                <div>
                  <div className="font-medium">정기적 URL 상태 확인</div>
                  <div className="text-xs text-gray-600">매주 자동으로 모든 URL의 접근성 확인</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-blue-500 mr-2">🔄</span>
                <div>
                  <div className="font-medium">다중 소스 데이터 통합</div>
                  <div className="text-xs text-gray-600">여러 플랫폼에서 프로젝트 정보 자동 수집 및 비교</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-purple-500 mr-2">🎯</span>
                <div>
                  <div className="font-medium">AI 기반 정보 검증</div>
                  <div className="text-xs text-gray-600">수집된 정보의 일관성과 신뢰도 자동 분석</div>
                </div>
              </div>
              <div className="flex items-start">
                <span className="text-orange-500 mr-2">📱</span>
                <div>
                  <div className="font-medium">실시간 알림 시스템</div>
                  <div className="text-xs text-gray-600">프로젝트 정보 변경이나 문제 발생 시 즉시 알림</div>
                </div>
              </div>
            </div>
          </div>

          {/* 구체적인 구현 방법 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-2">⚙️ 구현 방법</h4>
            <div className="space-y-3 text-sm">
              <div>
                <div className="font-medium text-gray-800">1. URL 검증 API 구축</div>
                <div className="text-gray-600 ml-4">- 서버사이드에서 주기적으로 URL 상태 확인</div>
                <div className="text-gray-600 ml-4">- 응답 시간, 상태 코드, 리다이렉트 추적</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">2. 데이터 소스 통합</div>
                <div className="text-gray-600 ml-4">- CoinGecko, GitHub API를 통한 정보 교차 검증</div>
                <div className="text-gray-600 ml-4">- 소셜미디어 API로 최신 활동 모니터링</div>
              </div>
              <div>
                <div className="font-medium text-gray-800">3. 품질 점수 시스템</div>
                <div className="text-gray-600 ml-4">- URL 신뢰도, 최신성, 완성도 기반 점수 산정</div>
                <div className="text-gray-600 ml-4">- 프로젝트별 품질 등급 자동 부여</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

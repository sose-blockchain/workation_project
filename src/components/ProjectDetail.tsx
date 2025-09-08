'use client'

import { useState, useEffect } from 'react'
import { Project, UpdateProjectRequest } from '@/types/project'
import { Investment } from '@/types/investment'
import { aiUrlValidator, ProjectUrlAnalysis } from '@/lib/aiUrlValidator'
import PremiumInvestmentNotice from './PremiumInvestmentNotice'
import TwitterInfo from './TwitterInfo'
import TeamMembersInfo from './TeamMembersInfo'


interface ProjectDetailProps {
  project: Project
  onUpdate: (data: UpdateProjectRequest) => Promise<void>
  onDelete: (id: string) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export default function ProjectDetail({ 
  project, 
  onUpdate, 
  onDelete, 
  onClose, 
  isLoading = false 
}: ProjectDetailProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<UpdateProjectRequest>({
    id: project.id,
    name: project.name,
    token_symbol: project.token_symbol || '',
    description: project.description || '',
    keyword1: project.keyword1 || '',
    keyword2: project.keyword2 || '',
    keyword3: project.keyword3 || '',
    homepage_url: project.homepage_url || '',
    whitepaper_url: project.whitepaper_url || '',
    docs_url: project.docs_url || '',
    blog_url: project.blog_url || '',
    github_url: project.github_url || '',
    project_twitter_url: project.project_twitter_url || '',
    team_twitter_urls: project.team_twitter_urls || []
  })

  const [aiAnalysis, setAiAnalysis] = useState<ProjectUrlAnalysis | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showAiAnalysis, setShowAiAnalysis] = useState(false)



  // AI URL 분석 실행
  const handleAiAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const analysis = await aiUrlValidator.analyzeProjectUrls(project)
      setAiAnalysis(analysis)
      setShowAiAnalysis(true)
    } catch (error) {
      console.error('AI 분석 중 오류:', error)
      alert('AI 분석 중 오류가 발생했습니다.')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleTeamTwitterChange = (index: number, value: string) => {
    const newTeamTwitterUrls = [...(formData.team_twitter_urls || [])]
    newTeamTwitterUrls[index] = value
    setFormData(prev => ({
      ...prev,
      team_twitter_urls: newTeamTwitterUrls
    }))
  }

  const addTeamTwitter = () => {
    setFormData(prev => ({
      ...prev,
      team_twitter_urls: [...(prev.team_twitter_urls || []), '']
    }))
  }

  const removeTeamTwitter = (index: number) => {
    const newTeamTwitterUrls = formData.team_twitter_urls?.filter((_, i) => i !== index) || []
    setFormData(prev => ({
      ...prev,
      team_twitter_urls: newTeamTwitterUrls
    }))
  }



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await onUpdate(formData)
    setIsEditing(false)
  }

  const handleDelete = async () => {
    if (confirm('정말로 이 프로젝트를 삭제하시겠습니까?')) {
      await onDelete(project.id)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isEditing ? '프로젝트 수정' : project.name}
            </h2>
            <div className="flex gap-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    수정
                  </button>

                  <button
                    onClick={handleAiAnalysis}
                    disabled={isAnalyzing}
                    className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isAnalyzing ? 'AI 분석 중...' : 'AI URL 분석'}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    삭제
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                닫기
              </button>
            </div>
          </div>



          {/* AI URL 분석 결과 표시 */}
          {showAiAnalysis && aiAnalysis && (
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h3 className="text-lg font-medium text-purple-900 mb-3">🤖 AI URL 연관성 분석 결과</h3>
              
              {/* 전체 요약 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{aiAnalysis.overallScore}%</div>
                  <div className="text-sm text-gray-600">전체 품질 점수</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{aiAnalysis.validUrls}</div>
                  <div className="text-sm text-gray-600">관련성 높음</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{aiAnalysis.outdatedUrls}</div>
                  <div className="text-sm text-gray-600">업데이트 필요</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{aiAnalysis.irrelevantUrls}</div>
                  <div className="text-sm text-gray-600">부적절한 URL</div>
                </div>
              </div>

              {/* 우선순위 액션 */}
              {aiAnalysis.priorityActions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-purple-900 mb-2">🚨 우선순위 액션</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.priorityActions.map((action, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 전체 개선 제안 */}
              {aiAnalysis.generalSuggestions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-purple-900 mb-2">💡 개선 제안</h4>
                  <ul className="space-y-1">
                    {aiAnalysis.generalSuggestions.map((suggestion, index) => (
                      <li key={index} className="flex items-center space-x-2">
                        <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                        <span className="text-sm text-gray-700">{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 개별 URL 분석 결과 */}
              <div className="space-y-3">
                <h4 className="font-medium text-purple-900">📋 개별 URL 분석</h4>
                {aiAnalysis.urlResults.map((result, index) => (
                  <div key={index} className={`p-3 rounded-lg border ${
                    result.relevanceScore >= 70 ? 'bg-green-50 border-green-200' :
                    result.relevanceScore >= 40 ? 'bg-yellow-50 border-yellow-200' :
                    'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex justify-between items-start mb-2">
                      <div className="break-all text-sm font-medium text-gray-900">
                        {result.url}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        result.relevanceScore >= 70 ? 'bg-green-100 text-green-800' :
                        result.relevanceScore >= 40 ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {result.relevanceScore}%
                      </div>
                    </div>
                    
                    <div className="text-sm text-gray-600 mb-2">
                      {result.contentSummary}
                    </div>

                    {result.issues.length > 0 && (
                      <div className="mb-2">
                        <div className="text-xs font-medium text-red-700 mb-1">문제점:</div>
                        <ul className="text-xs text-red-600 space-y-1">
                          {result.issues.map((issue, issueIndex) => (
                            <li key={issueIndex}>• {issue}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {result.suggestions.length > 0 && (
                      <div>
                        <div className="text-xs font-medium text-blue-700 mb-1">개선 제안:</div>
                        <ul className="text-xs text-blue-600 space-y-1">
                          {result.suggestions.map((suggestion, suggestionIndex) => (
                            <li key={suggestionIndex}>• {suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isEditing ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    프로젝트명 *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    토큰 심볼
                  </label>
                  <input
                    type="text"
                    name="token_symbol"
                    value={formData.token_symbol}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 설명
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주요 키워드 1
                  </label>
                  <input
                    type="text"
                    name="keyword1"
                    value={formData.keyword1}
                    onChange={handleChange}
                    placeholder="예: Layer1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주요 키워드 2
                  </label>
                  <input
                    type="text"
                    name="keyword2"
                    value={formData.keyword2}
                    onChange={handleChange}
                    placeholder="예: DeFi"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    주요 키워드 3
                  </label>
                  <input
                    type="text"
                    name="keyword3"
                    value={formData.keyword3}
                    onChange={handleChange}
                    placeholder="예: NFT"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    홈페이지 URL
                  </label>
                  <input
                    type="url"
                    name="homepage_url"
                    value={formData.homepage_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    백서 URL
                  </label>
                  <input
                    type="url"
                    name="whitepaper_url"
                    value={formData.whitepaper_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    문서 URL
                  </label>
                  <input
                    type="url"
                    name="docs_url"
                    value={formData.docs_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    블로그 URL
                  </label>
                  <input
                    type="url"
                    name="blog_url"
                    value={formData.blog_url}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub URL
                </label>
                <input
                  type="url"
                  name="github_url"
                  value={formData.github_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  프로젝트 트위터 URL
                </label>
                <input
                  type="url"
                  name="project_twitter_url"
                  value={formData.project_twitter_url}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주요 팀원 트위터 URL
                </label>
                {formData.team_twitter_urls?.map((url, index) => (
                  <div key={index} className="flex space-x-2 mb-2">
                    <input
                      type="url"
                      value={url}
                      onChange={(e) => handleTeamTwitterChange(index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      placeholder="팀원 트위터 URL"
                    />
                    <button
                      type="button"
                      onClick={() => removeTeamTwitter(index)}
                      className="px-3 py-2 text-sm text-red-600 border border-red-300 rounded-md hover:bg-red-50 transition-colors"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTeamTwitter}
                  className="px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  팀원 트위터 추가
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? '저장 중...' : '저장'}
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-500">프로젝트명</h3>
                  <p className="text-lg text-gray-900">{project.name}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500">토큰 심볼</h3>
                  <p className="text-lg text-gray-900">
                    {project.token_symbol ? (
                      project.token_symbol
                    ) : (
                      <span className="text-orange-600 bg-orange-50 px-2 py-1 rounded text-sm font-medium">
                        Pre-TGE
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">프로젝트 설명</h3>
                  <p className="text-gray-900">{project.description}</p>
                </div>
              )}

              {(project.keyword1 || project.keyword2 || project.keyword3) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">주요 키워드</h3>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {project.keyword1 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {project.keyword1}
                      </span>
                    )}
                    {project.keyword2 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {project.keyword2}
                      </span>
                    )}
                    {project.keyword3 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        {project.keyword3}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.homepage_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">홈페이지</h3>
                    <a href={project.homepage_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {project.homepage_url}
                    </a>
                  </div>
                )}
                {project.whitepaper_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">백서</h3>
                    <a href={project.whitepaper_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {project.whitepaper_url}
                    </a>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {project.docs_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">문서</h3>
                    <a href={project.docs_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {project.docs_url}
                    </a>
                  </div>
                )}
                {project.blog_url && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">블로그</h3>
                    <a href={project.blog_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {project.blog_url}
                    </a>
                  </div>
                )}
              </div>

              {project.github_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">GitHub</h3>
                  <a href={project.github_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {project.github_url}
                  </a>
                </div>
              )}

              {project.project_twitter_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">프로젝트 트위터</h3>
                  <a href={project.project_twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {project.project_twitter_url}
                  </a>
                </div>
              )}

              {/* 트위터 정보 섹션 */}
              <div className="pt-4 border-t">
                <TwitterInfo 
                  projectId={project.id}
                  twitterUrl={project.detected_twitter_url}
                />
              </div>

              {/* 팀원 정보 섹션 */}
              <div className="pt-4 border-t">
                <TeamMembersInfo 
                  projectId={project.id}
                  projectName={project.name}
                />
              </div>

{/* AI로 가져온 팀원 정보는 부정확하므로 제거 */}

              {/* 투자 정보 섹션 */}
              <div className="pt-4 border-t">
                <PremiumInvestmentNotice projectId={project.id} />
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500">
                  생성일: {new Date(project.created_at).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-500">
                  수정일: {new Date(project.updated_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

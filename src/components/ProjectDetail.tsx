'use client'

import { useState, useEffect } from 'react'
import { Project, UpdateProjectRequest } from '@/types/project'
import { validateProjectUrls, isDeprecatedUrl } from '@/lib/urlValidator'

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
    homepage_url: project.homepage_url || '',
    whitepaper_url: project.whitepaper_url || '',
    docs_url: project.docs_url || '',
    blog_url: project.blog_url || '',
    project_twitter_url: project.project_twitter_url || '',
    team_twitter_urls: project.team_twitter_urls || []
  })
  const [urlValidation, setUrlValidation] = useState<any>(null)
  const [showValidation, setShowValidation] = useState(false)

  // URL 검증 실행
  useEffect(() => {
    const validateUrls = async () => {
      const validation = await validateProjectUrls({
        homepage_url: project.homepage_url || undefined,
        whitepaper_url: project.whitepaper_url || undefined,
        docs_url: project.docs_url || undefined,
        blog_url: project.blog_url || undefined,
        project_twitter_url: project.project_twitter_url || undefined,
        team_twitter_urls: project.team_twitter_urls || undefined
      })
      setUrlValidation(validation)
    }
    
    validateUrls()
  }, [project])

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
            <div className="flex space-x-2">
              {!isEditing && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => setShowValidation(!showValidation)}
                    className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                  >
                    URL 검증
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isLoading}
                    className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 disabled:opacity-50"
                  >
                    삭제
                  </button>
                </>
              )}
              <button
                onClick={onClose}
                className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                닫기
              </button>
            </div>
          </div>

          {/* URL 검증 결과 표시 */}
          {showValidation && urlValidation && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900 mb-3">URL 검증 결과</h3>
              
              {/* 전체 요약 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="text-center p-3 bg-white rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">{urlValidation.report.totalUrls}</div>
                  <div className="text-sm text-gray-600">전체 URL</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{urlValidation.report.validUrls}</div>
                  <div className="text-sm text-gray-600">유효한 URL</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{urlValidation.report.deprecatedUrls}</div>
                  <div className="text-sm text-gray-600">오래된 URL</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{urlValidation.report.inaccessibleUrls}</div>
                  <div className="text-sm text-gray-600">접근 불가</div>
                </div>
              </div>

              {/* 개선 제안 */}
              {urlValidation.report.suggestions.length > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">개선 제안</h4>
                  <ul className="space-y-1">
                    {urlValidation.report.suggestions.map((suggestion: string, index: number) => (
                      <li key={index} className="text-sm text-gray-600 flex items-start">
                        <span className="text-yellow-500 mr-2">⚠️</span>
                        {suggestion}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* 오래된 URL 목록 */}
              {urlValidation.report.deprecatedUrls > 0 && (
                <div className="mb-4">
                  <h4 className="font-medium text-gray-900 mb-2">오래된 URL</h4>
                  <div className="space-y-2">
                    {Object.entries(urlValidation.deprecated).map(([key, url]) => {
                      if (!url) return null
                      const deprecationInfo = typeof url === 'string' ? isDeprecatedUrl(url) : null
                      return (
                        <div key={key} className="p-2 bg-yellow-50 rounded text-sm">
                          <div className="font-medium text-yellow-800">{key.replace('_', ' ').toUpperCase()}</div>
                          <div className="text-yellow-700 break-all">{Array.isArray(url) ? url.join(', ') : String(url)}</div>
                          {deprecationInfo && (
                            <div className="text-yellow-600 text-xs mt-1">{deprecationInfo.reason}</div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="팀원 트위터 URL"
                    />
                    <button
                      type="button"
                      onClick={() => removeTeamTwitter(index)}
                      className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
                    >
                      삭제
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={addTeamTwitter}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700"
                >
                  팀원 트위터 추가
                </button>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
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
                {project.token_symbol && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">토큰 심볼</h3>
                    <p className="text-lg text-gray-900">{project.token_symbol}</p>
                  </div>
                )}
              </div>

              {project.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">프로젝트 설명</h3>
                  <p className="text-gray-900">{project.description}</p>
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

              {project.project_twitter_url && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">프로젝트 트위터</h3>
                  <a href={project.project_twitter_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    {project.project_twitter_url}
                  </a>
                </div>
              )}

              {project.team_twitter_urls && project.team_twitter_urls.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">주요 팀원 트위터</h3>
                  <div className="space-y-1">
                    {project.team_twitter_urls.map((url, index) => (
                      <a key={index} href={url} target="_blank" rel="noopener noreferrer" className="block text-blue-600 hover:underline">
                        {url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

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

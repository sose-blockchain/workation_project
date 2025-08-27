'use client'

import { useState } from 'react'
import { CreateProjectRequest } from '@/types/project'

interface ProjectFormProps {
  onSubmit: (data: CreateProjectRequest) => Promise<void>
  isLoading?: boolean
}

export default function ProjectForm({ onSubmit, isLoading = false }: ProjectFormProps) {
  const [formData, setFormData] = useState<CreateProjectRequest>({
    name: '',
    description: '',
    token_name: '',
    token_symbol: '',
    homepage_url: '',
    whitepaper_url: '',
    docs_url: '',
    blog_url: ''
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.name.trim()) {
      alert('프로젝트명은 필수입니다.')
      return
    }
    await onSubmit(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl mx-auto">
      <div className="bg-white shadow-md rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">프로젝트 정보 입력</h2>
        
        {/* 필수 필드 */}
        <div className="mb-6">
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
            프로젝트명 (영문) *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="예: Ethereum"
          />
        </div>

        {/* 선택 필드들 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label htmlFor="token_name" className="block text-sm font-medium text-gray-700 mb-2">
              토큰명
            </label>
            <input
              type="text"
              id="token_name"
              name="token_name"
              value={formData.token_name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: Ether"
            />
          </div>
          
          <div>
            <label htmlFor="token_symbol" className="block text-sm font-medium text-gray-700 mb-2">
              토큰 심볼
            </label>
            <input
              type="text"
              id="token_symbol"
              name="token_symbol"
              value={formData.token_symbol}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="예: ETH"
            />
          </div>
        </div>

        <div className="mb-6">
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            프로젝트 설명
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="프로젝트에 대한 간단한 설명을 입력하세요"
          />
        </div>

        {/* URL 필드들 */}
        <div className="space-y-4 mb-6">
          <div>
            <label htmlFor="homepage_url" className="block text-sm font-medium text-gray-700 mb-2">
              홈페이지 URL
            </label>
            <input
              type="url"
              id="homepage_url"
              name="homepage_url"
              value={formData.homepage_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com"
            />
          </div>

          <div>
            <label htmlFor="whitepaper_url" className="block text-sm font-medium text-gray-700 mb-2">
              백서 URL
            </label>
            <input
              type="url"
              id="whitepaper_url"
              name="whitepaper_url"
              value={formData.whitepaper_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://example.com/whitepaper.pdf"
            />
          </div>

          <div>
            <label htmlFor="docs_url" className="block text-sm font-medium text-gray-700 mb-2">
              문서 URL
            </label>
            <input
              type="url"
              id="docs_url"
              name="docs_url"
              value={formData.docs_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://docs.example.com"
            />
          </div>

          <div>
            <label htmlFor="blog_url" className="block text-sm font-medium text-gray-700 mb-2">
              블로그 URL
            </label>
            <input
              type="url"
              id="blog_url"
              name="blog_url"
              value={formData.blog_url}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="https://blog.example.com"
            />
          </div>
        </div>

        {/* 제출 버튼 */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? '저장 중...' : '저장'}
          </button>
        </div>
      </div>
    </form>
  )
}

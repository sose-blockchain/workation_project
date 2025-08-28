'use client'

import { useState } from 'react'
import { CreateProjectRequest } from '@/types/project'

interface ProjectSearchProps {
  onSearch: (projectName: string) => Promise<void>
  isLoading?: boolean
}

export default function ProjectSearch({ onSearch, isLoading = false }: ProjectSearchProps) {
  const [searchTerm, setSearchTerm] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchTerm.trim()) {
      alert('프로젝트명을 입력해주세요.')
      return
    }
    await onSearch(searchTerm.trim())
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          프로젝트 리서치
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          프로젝트명을 입력하면 AI가 자동으로 정보를 수집합니다
        </p>
      </div>

      {/* Google 스타일 검색창 - 확대된 버전 */}
      <div className="bg-white rounded-full shadow-xl border border-gray-200 p-4 mb-8 w-full max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="flex-1 px-6">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="프로젝트명을 입력하세요 (예: Ethereum, Bitcoin, Solana)"
              className="w-full text-xl text-gray-900 bg-transparent border-none outline-none placeholder-gray-500 py-2"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-10 py-4 rounded-full font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                검색 중...
              </div>
            ) : (
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                AI 리서치 시작
              </div>
            )}
          </button>
        </form>
      </div>


    </div>
  )
}

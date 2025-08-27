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

      {/* Google 스타일 검색창 */}
      <div className="bg-white rounded-full shadow-lg border border-gray-200 p-2 mb-8">
        <form onSubmit={handleSubmit} className="flex items-center">
          <div className="flex-1 px-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="프로젝트명을 입력하세요 (예: Ethereum, Bitcoin, Solana)"
              className="w-full text-lg text-gray-900 bg-transparent border-none outline-none placeholder-gray-500"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !searchTerm.trim()}
            className="bg-blue-600 text-white px-8 py-3 rounded-full hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                검색 중...
              </div>
            ) : (
              'AI 리서치 시작'
            )}
          </button>
        </form>
      </div>

      {/* 검색 힌트 */}
      <div className="text-center text-sm text-gray-500">
        <p>인기 프로젝트: Ethereum, Bitcoin, Solana, Cardano, Polkadot</p>
      </div>
    </div>
  )
}

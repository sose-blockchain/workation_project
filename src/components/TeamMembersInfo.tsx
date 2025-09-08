'use client'

import { useState, useEffect } from 'react'
import { twitterService } from '@/lib/twitterService'
import { TwitterTeamMemberDetail, TwitterTeamOverview } from '@/types/twitter'

interface TeamMembersInfoProps {
  projectId: string
  projectName: string
}

export default function TeamMembersInfo({ projectId, projectName }: TeamMembersInfoProps) {
  const [teamMembers, setTeamMembers] = useState<TwitterTeamMemberDetail[]>([])
  const [teamOverview, setTeamOverview] = useState<TwitterTeamOverview | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // 데이터베이스 스키마가 적용되면 활성화
    // loadTeamInfo()
  }, [projectId])

  const loadTeamInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      const [members, overview] = await Promise.all([
        twitterService.getTeamMembers(projectId),
        twitterService.getTeamOverview(projectId)
      ])
      
      setTeamMembers(members)
      setTeamOverview(overview)
    } catch (err) {
      console.error('팀원 정보 로드 오류:', err)
      setError('팀원 정보를 불러오는데 실패했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toString()
  }

  const getConfidenceColor = (score: number): string => {
    if (score >= 0.7) return 'text-green-600 bg-green-50'
    if (score >= 0.4) return 'text-yellow-600 bg-yellow-50'
    return 'text-red-600 bg-red-50'
  }

  const getConfidenceText = (score: number): string => {
    if (score >= 0.7) return '높음'
    if (score >= 0.4) return '보통'
    return '낮음'
  }

  if (isLoading) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-sm text-gray-600">팀원 정보 로딩 중...</span>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 border border-red-200 rounded-lg bg-red-50">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-sm text-red-600">{error}</span>
        </div>
      </div>
    )
  }

  // 데이터베이스 스키마가 적용될 때까지 임시로 안내 메시지 표시
  return (
    <div className="p-4 border border-blue-200 rounded-lg bg-blue-50">
      <div className="flex items-center space-x-2">
        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <div className="text-sm text-blue-600 font-medium">팀원 정보 기능 준비 중</div>
          <div className="text-xs text-blue-500 mt-1">
            RapidAPI 제휴 계정 수집 기능이 구현되었습니다. 데이터베이스 스키마 적용 후 활성화됩니다.
          </div>
        </div>
      </div>
    </div>
  )

  /* 데이터베이스 스키마 적용 후 활성화할 코드 - 현재는 주석 처리됨 */

}

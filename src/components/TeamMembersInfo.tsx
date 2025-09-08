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
    loadTeamInfo()
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

  if (teamMembers.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span className="text-sm text-gray-600">팀원 정보가 없습니다.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 팀 개요 */}
      {teamOverview && (
        <div className="p-4 border border-gray-200 rounded-lg bg-blue-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">팀 개요</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-600">총 팀원</div>
              <div className="font-semibold text-gray-900">{teamOverview.total_team_members}명</div>
            </div>
            <div>
              <div className="text-gray-600">인증된 팀원</div>
              <div className="font-semibold text-gray-900">{teamOverview.verified_team_members}명</div>
            </div>
            <div>
              <div className="text-gray-600">제휴사</div>
              <div className="font-semibold text-gray-900">{teamOverview.affiliate_members}명</div>
            </div>
            <div>
              <div className="text-gray-600">평균 팔로워</div>
              <div className="font-semibold text-gray-900">{formatNumber(Math.round(teamOverview.avg_team_followers))}</div>
            </div>
          </div>
        </div>
      )}

      {/* 팀원 목록 */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">팀원 목록</h3>
        <div className="space-y-3">
          {teamMembers.map((member) => (
            <div key={member.id} className="flex items-center space-x-3 p-3 border border-gray-100 rounded-lg hover:bg-gray-50">
              {/* 프로필 이미지 */}
              <div className="flex-shrink-0">
                {member.profile_image_url ? (
                  <img
                    src={member.profile_image_url}
                    alt={member.name}
                    className="w-10 h-10 rounded-full"
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <svg className="w-5 h-5 text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>

              {/* 팀원 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {member.name}
                  </h4>
                  {member.verified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <p className="text-sm text-gray-600">@{member.screen_name}</p>
                {member.description && (
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">{member.description}</p>
                )}
              </div>

              {/* 통계 정보 */}
              <div className="flex-shrink-0 text-right">
                <div className="text-sm font-medium text-gray-900">
                  {formatNumber(member.followers_count)} 팔로워
                </div>
                <div className="text-xs text-gray-500">
                  {formatNumber(member.statuses_count)} 트윗
                </div>
                <div className={`text-xs px-2 py-1 rounded-full mt-1 ${getConfidenceColor(member.confidence_score)}`}>
                  {getConfidenceText(member.confidence_score)}
                </div>
              </div>

              {/* 관계 타입 */}
              <div className="flex-shrink-0">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  member.relationship_type === 'affiliate' 
                    ? 'bg-purple-100 text-purple-800'
                    : member.relationship_type === 'both'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {member.relationship_type === 'affiliate' ? '제휴사' : 
                   member.relationship_type === 'both' ? '팔로잉+제휴' : '팔로잉'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

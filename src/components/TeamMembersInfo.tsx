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
  const [showAllMembers, setShowAllMembers] = useState(false)

  useEffect(() => {
    loadTeamInfo()
  }, [projectId])

  const loadTeamInfo = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      console.log(`🔍 팀원 정보 로드 시작: project_id=${projectId}, projectName=${projectName}`)
      
      const [members, overview] = await Promise.all([
        twitterService.getTeamMembers(projectId),
        twitterService.getTeamOverview(projectId)
      ])
      
      console.log(`📊 팀원 정보 로드 결과:`, {
        members: members.length,
        overview: overview,
        sampleMembers: members.slice(0, 2)
      })
      
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

  // 데이터가 없으면 안내 메시지 표시
  if (!teamOverview || teamMembers.length === 0) {
    return (
      <div className="p-4 border border-gray-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 10a3 3 0 100-6 3 3 0 000 6zm11 11v-3a8 8 0 00-9-8 8 8 0 00-9 8v3h18z" />
          </svg>
          <div>
            <div className="text-sm text-gray-600 font-medium">팀원 정보 없음</div>
            <div className="text-xs text-gray-500 mt-1">
              아직 수집된 팀원 정보가 없습니다. 프로젝트를 다시 저장하여 최신 정보를 수집해보세요.
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* 팀원 개요 */}
      <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.196-2.121M9 10a3 3 0 100-6 3 3 0 000 6zm11 11v-3a8 8 0 00-9-8 8 8 0 00-9 8v3h18z" />
          </svg>
          팀원 개요
        </h3>
        
        <div className="grid grid-cols-2 gap-6 text-sm">
          <div>
            <div className="text-gray-500">총 제휴 계정</div>
            <div className="font-semibold text-purple-600">{teamOverview.affiliate_members}명</div>
          </div>
          <div>
            <div className="text-gray-500">평균 팔로워</div>
            <div className="font-semibold text-gray-700">{formatNumber(Math.round(teamOverview.avg_team_followers || 0))}</div>
          </div>
        </div>
      </div>

      {/* 팀원 목록 */}
      <div className="p-4 border border-gray-200 rounded-lg">
        <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          팀원 목록 ({teamMembers.length}명)
        </h3>
        
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {(showAllMembers ? teamMembers : teamMembers.slice(0, 10)).map((member) => (
            <div key={member.id} className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg border border-gray-100">
              {/* 프로필 이미지 */}
              <div className="flex-shrink-0">
                {member.profile_image_url ? (
                  <img 
                    src={member.profile_image_url} 
                    alt={member.name}
                    className="w-10 h-10 rounded-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/40x40/e2e8f0/64748b?text=${member.name.charAt(0)}`;
                    }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                    <span className="text-gray-600 font-semibold text-sm">
                      {member.name.charAt(0)}
                    </span>
                  </div>
                )}
              </div>

              {/* 팀원 정보 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {member.name}
                  </h4>
                  {member.verified && (
                    <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  )}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getConfidenceColor(member.confidence_score)}`}>
                    {getConfidenceText(member.confidence_score)}
                  </span>
                </div>
                
                <div className="text-xs text-gray-500 mt-1">
                  @{member.screen_name} • {formatNumber(member.followers_count)} 팔로워
                </div>
                
                {member.description && (
                  <div className="text-xs text-gray-600 mt-1 truncate">
                    {member.description}
                  </div>
                )}
              </div>

              {/* 관계 타입 */}
              <div className="flex-shrink-0">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  member.relationship_type === 'affiliate' 
                    ? 'bg-purple-100 text-purple-700'
                    : member.relationship_type === 'following'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-green-100 text-green-700'
                }`}>
                  {member.relationship_type === 'affiliate' ? '제휴' : 
                   member.relationship_type === 'following' ? '팔로잉' : '둘다'}
                </span>
              </div>
            </div>
          ))}
          
          {teamMembers.length > 10 && !showAllMembers && (
            <div className="text-center py-2">
              <button 
                onClick={() => setShowAllMembers(true)}
                className="text-xs text-blue-600 hover:text-blue-800 hover:underline transition-colors duration-200 px-3 py-2 rounded-md hover:bg-blue-50"
              >
                +{teamMembers.length - 10}명 더 보기
              </button>
            </div>
          )}
          
          {showAllMembers && teamMembers.length > 10 && (
            <div className="text-center py-2">
              <button 
                onClick={() => setShowAllMembers(false)}
                className="text-xs text-gray-600 hover:text-gray-800 hover:underline transition-colors duration-200 px-3 py-2 rounded-md hover:bg-gray-50"
              >
                접기
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )

}

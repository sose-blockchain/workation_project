'use client'

import React, { useState, useEffect } from 'react'
import { TwitterAccount, TwitterTimeline } from '@/types/twitter'
import { twitterService, TwitterService } from '@/lib/twitterService'

interface TwitterInfoProps {
  projectId: string
  twitterUrl?: string
}

export default function TwitterInfo({ projectId, twitterUrl }: TwitterInfoProps) {
  const [account, setAccount] = useState<TwitterAccount | null>(null)
  const [timeline, setTimeline] = useState<TwitterTimeline[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    loadTwitterData()
  }, [projectId])

  const loadTwitterData = async () => {
    setLoading(true)
    setError(null)

    try {
      // 기존 트위터 계정 정보 조회
      const existingAccount = await twitterService.getTwitterAccountByProjectId(projectId)
      
      if (existingAccount) {
        setAccount(existingAccount)
        // 타임라인도 함께 로드
        const timelineData = await twitterService.getTwitterTimeline(existingAccount.id, 10)
        setTimeline(timelineData)
      } else if (twitterUrl) {
        // 트위터 URL이 제공된 경우 새로 수집
        await fetchTwitterDataFromUrl()
      }
    } catch (err) {
      console.error('트위터 데이터 로드 실패:', err)
      setError('트위터 데이터를 불러오는데 실패했습니다.')
    } finally {
      setLoading(false)
    }
  }

  const fetchTwitterDataFromUrl = async () => {
    if (!twitterUrl) return

    const handle = TwitterService.extractTwitterHandle(twitterUrl)
    if (!handle) {
      setError('유효하지 않은 트위터 URL입니다.')
      return
    }

    try {
      const result = await twitterService.createOrUpdateTwitterAccount({
        project_id: projectId,
        screen_name: handle,
        fetch_timeline: true
      })

      if (result.found && result.account) {
        setAccount(result.account)
        setTimeline(result.timeline)
      } else {
        setError(result.error || '트위터 계정을 찾을 수 없습니다.')
      }
    } catch (err) {
      console.error('트위터 데이터 수집 실패:', err)
      setError('트위터 데이터를 수집하는데 실패했습니다.')
    }
  }

  const handleRefresh = async () => {
    if (!account) return

    setRefreshing(true)
    try {
      const result = await twitterService.createOrUpdateTwitterAccount({
        project_id: projectId,
        screen_name: account.screen_name,
        fetch_timeline: true
      })

      if (result.found && result.account) {
        setAccount(result.account)
        setTimeline(result.timeline)
        setError(null)
      } else {
        setError(result.error || '트위터 데이터 새로고침에 실패했습니다.')
      }
    } catch (err) {
      console.error('트위터 데이터 새로고침 실패:', err)
      setError('데이터 새로고침에 실패했습니다.')
    } finally {
      setRefreshing(false)
    }
  }

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M'
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K'
    }
    return num.toLocaleString()
  }

  const formatJoinDate = (dateString: string): string => {
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long'
      })
    } catch {
      return dateString
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          프로젝트 트위터
        </h4>
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="animate-pulse">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-300 rounded w-1/3"></div>
                <div className="h-3 bg-gray-300 rounded w-1/2"></div>
              </div>
            </div>
            <div className="mt-4 space-y-2">
              <div className="h-3 bg-gray-300 rounded"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4"></div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-gray-900 flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          프로젝트 트위터
        </h4>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <svg className="w-5 h-5 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        </div>
      </div>
    )
  }

  if (!account) {
    return null
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 flex items-center justify-between">
        <div className="flex items-center">
          <svg className="w-5 h-5 mr-2 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
          </svg>
          프로젝트 트위터
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="text-xs text-gray-500 hover:text-gray-700 disabled:opacity-50 flex items-center"
        >
          <svg className={`w-4 h-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {refreshing ? '새로고침 중...' : '새로고침'}
        </button>
      </h4>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        {/* 프로필 헤더 */}
        <div className="flex items-start space-x-4 mb-4">
          <div className="relative">
            <img
              src={account.profile_image_url?.replace('_normal', '_400x400') || account.profile_image_url}
              alt={`${account.name} 프로필`}
              className="w-16 h-16 rounded-full"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = account.profile_image_url || '/default-avatar.png';
              }}
            />
            {account.verified && (
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            )}
          </div>
          
          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <h5 className="text-xl font-bold text-gray-900">{account.name}</h5>
              {account.verified && (
                <span className="text-blue-500 text-xs bg-blue-50 px-2 py-1 rounded-full">인증됨</span>
              )}
            </div>
            <p className="text-gray-600">@{account.screen_name}</p>
            
            {/* 활동도 점수 */}
            <div className="mt-2 flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-500">활동도 점수:</span>
                <span className={`text-sm font-semibold px-2 py-1 rounded-full ${
                  account.activity_score >= 80 ? 'bg-green-100 text-green-800' :
                  account.activity_score >= 60 ? 'bg-yellow-100 text-yellow-800' :
                  account.activity_score >= 40 ? 'bg-orange-100 text-orange-800' :
                  'bg-red-100 text-red-800'
                }`}>
                  {account.activity_score}/100
                </span>
              </div>
              <div className="text-xs text-gray-500">
                마지막 업데이트: {new Date(account.last_updated).toLocaleDateString('ko-KR')}
              </div>
            </div>
          </div>
        </div>

        {/* 자기소개 */}
        {account.description && (
          <div className="mb-4">
            <p className="text-gray-700 text-sm leading-relaxed">{account.description}</p>
          </div>
        )}

        {/* 위치 및 웹사이트 */}
        {(account.location || account.url) && (
          <div className="flex flex-wrap items-center gap-4 mb-4 text-sm text-gray-600">
            {account.location && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {account.location}
              </div>
            )}
            {account.url && (
              <div className="flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  {account.url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
          </div>
        )}

        {/* 통계 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{formatNumber(account.followers_count)}</div>
            <div className="text-sm text-gray-600">팔로워</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{formatNumber(account.friends_count)}</div>
            <div className="text-sm text-gray-600">팔로잉</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{formatNumber(account.statuses_count)}</div>
            <div className="text-sm text-gray-600">트윗</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-gray-900">{formatNumber(account.favourites_count)}</div>
            <div className="text-sm text-gray-600">좋아요</div>
          </div>
        </div>

        {/* 가입일 */}
        <div className="flex items-center text-sm text-gray-600 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {formatJoinDate(account.created_at)}에 가입
        </div>

        {/* 최근 트윗 */}
        {timeline.length > 0 && (
          <div className="border-t pt-4">
            <h6 className="text-sm font-semibold text-gray-900 mb-3">최근 트윗 ({timeline.length}개)</h6>
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {timeline.slice(0, 5).map((tweet) => (
                <div key={tweet.id} className="bg-gray-50 rounded p-3">
                  <p className="text-sm text-gray-800 leading-relaxed">{tweet.text}</p>
                  <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
                    <span>{new Date(tweet.created_at).toLocaleDateString('ko-KR')}</span>
                    <div className="flex items-center space-x-3">
                      <span>🔄 {tweet.retweet_count}</span>
                      <span>❤️ {tweet.favorite_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 트위터로 이동 버튼 */}
        <div className="mt-4 pt-4 border-t">
          <a
            href={`https://twitter.com/${account.screen_name}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-lg hover:bg-blue-600 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 24 24">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
            트위터에서 보기
          </a>
        </div>
      </div>
    </div>
  )
}
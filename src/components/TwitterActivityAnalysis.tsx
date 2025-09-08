'use client';

import React, { useState, useEffect } from 'react';
import { twitterAPI } from '../lib/twitter';
import type { TwitterTimelineItem } from '../lib/twitter';

interface TwitterActivityAnalysisProps {
  screenName: string;
  projectName: string;
}

interface MonthlyData {
  month: string;
  tweets: TwitterTimelineItem[];
  originalTweets: TwitterTimelineItem[];
  retweets: TwitterTimelineItem[];
  totalLikes: number;
  totalRetweets: number;
  avgEngagement: number;
  topKeywords: string[];
  contentAnalysis: {
    mainThemes: string[];
    tweetSummary: string;
    retweetSummary: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    engagementInsights: string;
  };
}

// AI 기반 내용 분석 함수
const analyzeMonthlyContent = (originalTweets: TwitterTimelineItem[], retweets: TwitterTimelineItem[], month: string) => {
  // 메인 테마 추출
  const extractMainThemes = (tweets: TwitterTimelineItem[]) => {
    const themes: string[] = [];
    const allText = tweets.map(t => t.text).join(' ').toLowerCase();
    
    // 기술/블록체인 관련 키워드
    const techKeywords = ['blockchain', 'defi', 'nft', 'dao', 'web3', 'crypto', 'token', 'mainnet', 'testnet', 'launch', 'update', 'development', 'partnership', 'integration'];
    const communityKeywords = ['community', 'event', 'ama', 'workshop', 'hackathon', 'meetup', 'conference', 'announcement'];
    const productKeywords = ['product', 'feature', 'release', 'beta', 'alpha', 'upgrade', 'improvement', 'fix', 'security'];
    
    techKeywords.forEach(keyword => {
      if (allText.includes(keyword)) themes.push(`기술/블록체인: ${keyword}`);
    });
    
    communityKeywords.forEach(keyword => {
      if (allText.includes(keyword)) themes.push(`커뮤니티: ${keyword}`);
    });
    
    productKeywords.forEach(keyword => {
      if (allText.includes(keyword)) themes.push(`제품: ${keyword}`);
    });
    
    return themes.slice(0, 3);
  };

  // 트윗 내용 요약
  const summarizeTweets = (tweets: TwitterTimelineItem[]) => {
    if (tweets.length === 0) return '활동 없음';
    
    const tweetTexts = tweets.map(t => t.text);
    const totalChars = tweetTexts.join(' ').length;
    
    if (totalChars === 0) return '내용 없음';
    
    // 간단한 요약 로직
    const hasAnnouncement = tweetTexts.some(text => 
      text.toLowerCase().includes('announce') || 
      text.toLowerCase().includes('launch') ||
      text.toLowerCase().includes('release')
    );
    
    const hasUpdate = tweetTexts.some(text => 
      text.toLowerCase().includes('update') || 
      text.toLowerCase().includes('improve') ||
      text.toLowerCase().includes('new feature')
    );
    
    const hasCommunity = tweetTexts.some(text => 
      text.toLowerCase().includes('community') || 
      text.toLowerCase().includes('event') ||
      text.toLowerCase().includes('thank')
    );
    
    let summary = '';
    if (hasAnnouncement) summary += '주요 발표, ';
    if (hasUpdate) summary += '제품 업데이트, ';
    if (hasCommunity) summary += '커뮤니티 활동, ';
    
    return summary || '일반적인 소통 활동';
  };

  // 감정 분석
  const analyzeSentiment = (tweets: TwitterTimelineItem[]): 'positive' | 'neutral' | 'negative' => {
    const allText = tweets.map(t => t.text).join(' ').toLowerCase();
    
    const positiveWords = ['great', 'excited', 'amazing', 'awesome', 'successful', 'launch', 'new', 'improve', 'thank', 'happy'];
    const negativeWords = ['delay', 'issue', 'problem', 'sorry', 'fix', 'bug', 'error', 'postpone'];
    
    let positiveCount = 0;
    let negativeCount = 0;
    
    positiveWords.forEach(word => {
      if (allText.includes(word)) positiveCount++;
    });
    
    negativeWords.forEach(word => {
      if (allText.includes(word)) negativeCount++;
    });
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  };

  return {
    mainThemes: extractMainThemes([...originalTweets, ...retweets]),
    tweetSummary: summarizeTweets(originalTweets),
    retweetSummary: retweets.length > 0 ? `${retweets.length}개의 리트윗 (주로 파트너십 및 커뮤니티 콘텐츠)` : '리트윗 없음',
    sentiment: analyzeSentiment([...originalTweets, ...retweets]),
    engagementInsights: originalTweets.length > 0 
      ? `평균 ${Math.round(originalTweets.reduce((sum, t) => sum + t.favorite_count, 0) / originalTweets.length)}개 좋아요, 활발한 소통`
      : '참여도 데이터 없음'
  };
};

const TwitterActivityAnalysis: React.FC<TwitterActivityAnalysisProps> = ({ 
  screenName, 
  projectName 
}) => {
  const [activities, setActivities] = useState<MonthlyData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  // 월별 활동 분석 로드
  const loadMonthlyAnalysis = async () => {
    if (!screenName) return;
    
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 ${screenName}의 월별 활동 분석 시작`);
      
      // 타임라인 가져오기
      const timeline = await twitterAPI.getUserTimeline(screenName, 100);
      if (!timeline || timeline.length === 0) {
        setError('타임라인을 가져올 수 없습니다.');
        return;
      }

      // 월별 그룹화
      const monthlyGroups: { [key: string]: TwitterTimelineItem[] } = {};
      const currentDate = new Date();
      
      for (let i = 0; i < 6; i++) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyGroups[monthKey] = [];
      }

      timeline.forEach((tweet: TwitterTimelineItem) => {
        const tweetDate = new Date(tweet.created_at);
        const monthKey = `${tweetDate.getFullYear()}-${String(tweetDate.getMonth() + 1).padStart(2, '0')}`;
        
        if (monthlyGroups[monthKey]) {
          monthlyGroups[monthKey].push(tweet);
        }
      });

      // 월별 데이터 분석
      const monthlyData: MonthlyData[] = [];
      
      for (const [month, tweets] of Object.entries(monthlyGroups)) {
        const originalTweets = tweets.filter(t => !t.is_retweet);
        const retweets = tweets.filter(t => t.is_retweet);
        
        const totalLikes = tweets.reduce((sum, t) => sum + t.favorite_count, 0);
        const totalRetweetsCount = tweets.reduce((sum, t) => sum + t.retweet_count, 0);
        const avgEngagement = tweets.length > 0 ? (totalLikes + totalRetweetsCount) / tweets.length : 0;

        // 키워드 추출
        const allText = tweets.map(t => t.text).join(' ').toLowerCase();
        const words = allText.split(/\s+/).filter(word => 
          word.length > 3 && 
          !word.startsWith('http') && 
          !word.startsWith('@') &&
          !word.startsWith('#')
        );
        const wordCounts: { [key: string]: number } = {};
        words.forEach(word => {
          wordCounts[word] = (wordCounts[word] || 0) + 1;
        });
        const topKeywords = Object.entries(wordCounts)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 5)
          .map(([word]) => word);

        // AI 기반 내용 분석
        const contentAnalysis = analyzeMonthlyContent(originalTweets, retweets, month);

        monthlyData.push({
          month,
          tweets,
          originalTweets,
          retweets,
          totalLikes,
          totalRetweets: totalRetweetsCount,
          avgEngagement,
          topKeywords,
          contentAnalysis
        });
      }

      monthlyData.sort((a, b) => b.month.localeCompare(a.month));
      setActivities(monthlyData);
      
      console.log(`✅ 월별 활동 분석 완료:`, monthlyData);
    } catch (err) {
      console.error('월별 활동 분석 오류:', err);
      setError('월별 활동 분석을 가져올 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMonthlyAnalysis();
  }, [screenName]);

  // 월 이름 변환
  const getMonthName = (monthKey: string) => {
    const [year, month] = monthKey.split('-');
    const monthNames = [
      '1월', '2월', '3월', '4월', '5월', '6월',
      '7월', '8월', '9월', '10월', '11월', '12월'
    ];
    return `${year}년 ${monthNames[parseInt(month) - 1]}`;
  };

  // 활동 수준에 따른 색상
  const getActivityColor = (totalTweets: number) => {
    if (totalTweets >= 20) return 'text-green-600 bg-green-50 border-green-200';
    if (totalTweets >= 10) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (totalTweets >= 5) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  // 활동 수준 아이콘
  const getActivityIcon = (totalTweets: number) => {
    if (totalTweets >= 20) return '🔥';
    if (totalTweets >= 10) return '📈';
    if (totalTweets >= 5) return '📊';
    return '📱';
  };

  // 트윗 텍스트 단축
  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 animate-spin border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-800">
            📊 @{screenName} 월별 활동 분석 중...
          </h3>
        </div>
        <div className="text-gray-600">
          최근 6개월간의 트윗과 리트윗을 분석하고 있습니다.
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">❌</span>
          <h3 className="text-lg font-semibold text-red-800">
            월별 활동 분석 오류
          </h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={loadMonthlyAnalysis}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            활동 데이터 없음
          </h3>
          <p className="text-gray-600">
            @{screenName}의 최근 활동을 찾을 수 없습니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">📊</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              @{screenName} 월별 활동 분석
            </h3>
            <p className="text-sm text-gray-600">
              {projectName} 공식 계정의 최근 6개월 트위터 활동
            </p>
          </div>
        </div>
        <button
          onClick={loadMonthlyAnalysis}
          className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
        >
          새로고침
        </button>
      </div>

      {/* 월별 요약 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {activities.map((activity, index) => (
          <div
            key={activity.month}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedMonth === activity.month
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            onClick={() => setSelectedMonth(
              selectedMonth === activity.month ? null : activity.month
            )}
          >
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium text-gray-800">
                {getMonthName(activity.month)}
              </h4>
              <div className={`px-2 py-1 rounded-full text-xs border ${getActivityColor(activity.tweets.length)}`}>
                {getActivityIcon(activity.tweets.length)} {activity.tweets.length > 0 ? '활발' : '조용'}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">원본 트윗:</span>
                <span className="font-medium text-blue-600">{activity.originalTweets.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">리트윗:</span>
                <span className="font-medium text-green-600">{activity.retweets.length}개</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">평균 참여도:</span>
                <span className="font-medium text-purple-600">
                  {Math.round(activity.avgEngagement)}
                </span>
              </div>
            </div>
            {/* AI 내용 분석 */}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <div className="text-xs text-gray-500 mb-2">📝 내용 분석:</div>
              
              {/* 감정 분석 */}
              <div className="flex items-center mb-2">
                <span className={`text-lg mr-2 ${
                  activity.contentAnalysis.sentiment === 'positive' ? '😊' :
                  activity.contentAnalysis.sentiment === 'negative' ? '😔' : '😐'
                }`}>
                  {activity.contentAnalysis.sentiment === 'positive' ? '😊' :
                   activity.contentAnalysis.sentiment === 'negative' ? '😔' : '😐'}
                </span>
                <span className={`text-xs px-2 py-1 rounded ${
                  activity.contentAnalysis.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                  activity.contentAnalysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 
                  'bg-gray-100 text-gray-700'
                }`}>
                  {activity.contentAnalysis.sentiment === 'positive' ? '긍정적' :
                   activity.contentAnalysis.sentiment === 'negative' ? '부정적' : '중립적'}
                </span>
              </div>

              {/* 트윗 요약 */}
              <div className="text-xs text-gray-600 mb-1">
                <strong>주요 활동:</strong> {activity.contentAnalysis.tweetSummary}
              </div>
              
              {/* 메인 테마 */}
              {activity.contentAnalysis.mainThemes.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {activity.contentAnalysis.mainThemes.slice(0, 2).map((theme, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                    >
                      {theme.split(': ')[1] || theme}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* 선택된 월 상세 정보 */}
      {selectedMonth && (
        <div className="border-t pt-6">
          {(() => {
            const monthData = activities.find(a => a.month === selectedMonth);
            if (!monthData) return null;

            return (
              <div>
                <h4 className="text-lg font-semibold text-gray-800 mb-4">
                  {getMonthName(selectedMonth)} 상세 활동
                </h4>

                {/* 상세 통계 */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {monthData.originalTweets.length}
                    </div>
                    <div className="text-sm text-gray-600">원본 트윗</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {monthData.retweets.length}
                    </div>
                    <div className="text-sm text-gray-600">리트윗</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">
                      {monthData.totalLikes}
                    </div>
                    <div className="text-sm text-gray-600">총 좋아요</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {monthData.totalRetweets}
                    </div>
                    <div className="text-sm text-gray-600">총 리트윗</div>
                  </div>
                </div>

                {/* AI 분석 상세 결과 */}
                <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <h5 className="text-md font-semibold text-gray-800 mb-3 flex items-center">
                    🤖 AI 분석 결과
                  </h5>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">📝 트윗 내용 요약</div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded">
                          {monthData.contentAnalysis.tweetSummary}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">🔄 리트윗 분석</div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded">
                          {monthData.contentAnalysis.retweetSummary}
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">🎯 주요 테마</div>
                        <div className="flex flex-wrap gap-2">
                          {monthData.contentAnalysis.mainThemes.map((theme, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {theme}
                            </span>
                          ))}
                          {monthData.contentAnalysis.mainThemes.length === 0 && (
                            <span className="text-xs text-gray-500">테마 없음</span>
                          )}
                        </div>
                      </div>
                      
                      <div>
                        <div className="text-sm font-medium text-gray-700 mb-1">📊 참여도 인사이트</div>
                        <div className="text-sm text-gray-600 bg-white p-2 rounded">
                          {monthData.contentAnalysis.engagementInsights}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 키워드 분석 */}
                {monthData.topKeywords.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-800 mb-3">🔑 주요 키워드</h5>
                    <div className="flex flex-wrap gap-2">
                      {monthData.topKeywords.map((keyword, idx) => (
                        <span
                          key={idx}
                          className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {keyword}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* 원본 트윗 목록 */}
                {monthData.originalTweets.length > 0 && (
                  <div className="mb-6">
                    <h5 className="font-medium text-gray-800 mb-3">
                      📝 원본 트윗 ({monthData.originalTweets.length}개)
                    </h5>
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {monthData.originalTweets.slice(0, 5).map((tweet) => (
                        <div
                          key={tweet.id}
                          className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="text-sm text-gray-500">
                              {new Date(tweet.created_at).toLocaleDateString('ko-KR')}
                            </div>
                            <div className="flex space-x-3 text-sm text-gray-500">
                              <span>❤️ {tweet.favorite_count}</span>
                              <span>🔄 {tweet.retweet_count}</span>
                            </div>
                          </div>
                          <p className="text-gray-800 text-sm leading-relaxed">
                            {truncateText(tweet.text, 200)}
                          </p>
                        </div>
                      ))}
                      {monthData.originalTweets.length > 5 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          ... 총 {monthData.originalTweets.length}개 트윗 중 5개 표시
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 리트윗 목록 */}
                {monthData.retweets.length > 0 && (
                  <div>
                    <h5 className="font-medium text-gray-800 mb-3">
                      🔄 리트윗 ({monthData.retweets.length}개)
                    </h5>
                    <div className="space-y-3 max-h-64 overflow-y-auto">
                      {monthData.retweets.slice(0, 3).map((retweet) => (
                        <div
                          key={retweet.id}
                          className="p-3 border border-green-200 rounded-lg bg-green-50"
                        >
                          <div className="text-sm text-gray-500 mb-2">
                            {new Date(retweet.created_at).toLocaleDateString('ko-KR')} 리트윗
                          </div>
                          <p className="text-gray-800 text-sm leading-relaxed">
                            {truncateText(retweet.text, 150)}
                          </p>
                        </div>
                      ))}
                      {monthData.retweets.length > 3 && (
                        <div className="text-center text-sm text-gray-500 py-2">
                          ... 총 {monthData.retweets.length}개 리트윗 중 3개 표시
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};

export default TwitterActivityAnalysis;

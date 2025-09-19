'use client';

import React, { useState, useEffect } from 'react';

interface TwitterDataAnalysisProps {
  projectId: string;
  projectName: string;
  screenName?: string; // 옵셔널: 직접 screenName 제공 가능
}

// 기존 인터페이스는 제거됨 (AI 주별 분석만 사용)

// 새로운 고도화된 인터페이스들
interface WeeklyAnalysisData {
  week_start: string;
  week_end: string;
  week_label: string;
  analysis: {
    main_topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
    activity_level: 'high' | 'medium' | 'low';
    engagement_quality: 'excellent' | 'good' | 'average' | 'poor';
    key_events: string[];
    community_insights: string;
    recommendations: string[];
  };
  tweet_highlights: Array<{
    text: string;
    engagement: number;
    reason: string;
  }>;
  raw_stats: {
    total_tweets: number;
    avg_engagement: number;
    original_tweets: number;
    retweets: number;
    replies: number;
  };
}

interface WeeklyTwitterAnalysis {
  success: boolean;
  project_id: string;
  account_info: {
    screen_name: string;
    name: string;
    followers_count: number;
    verified: boolean;
    activity_score: number;
    last_updated: string;
  };
  analysis_summary: {
    total_weeks: number;
    total_tweets_analyzed: number;
    avg_weekly_tweets: number;
    dominant_sentiment: string;
  };
  weekly_analysis: WeeklyAnalysisData[];
  trends: {
    most_active_week: WeeklyAnalysisData;
    best_engagement_week: WeeklyAnalysisData;
    common_topics: string[];
    sentiment_trend: Array<{week: string, sentiment: string}>;
    activity_trend: Array<{week: string, level: string, tweet_count: number}>;
  };
  generated_at: string;
}

const TwitterDataAnalysis: React.FC<TwitterDataAnalysisProps> = ({ 
  projectId, 
  projectName 
}) => {
  // 기존 상태는 제거됨 (AI 주별 분석만 사용)
  
  // AI 주별 분석 상태
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyTwitterAnalysis | null>(null);
  
  // 공통 상태
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataPeriod, setDataPeriod] = useState(8); // 기본 8주
  const [selectedWeek, setSelectedWeek] = useState<number | null>(null);

  // 새로운 고도화된 주별 분석 로드
  const loadWeeklyAnalysis = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 프로젝트 ${projectName}의 주별 트위터 분석 시작 (${dataPeriod}주)`);
      
      // 1. 주별 원시 데이터 가져오기
      const dataResponse = await fetch(`/api/twitter-analysis/${projectId}?weeks=${dataPeriod}`);
      if (!dataResponse.ok) {
        if (dataResponse.status === 404) {
          throw new Error('이 프로젝트에는 연결된 트위터 계정이 없습니다.');
        }
        throw new Error(`데이터 API 오류: ${dataResponse.status}`);
      }

      const weeklyData = await dataResponse.json();
      console.log(`📈 ${weeklyData.total_stats.total_tweets}개 트윗 데이터 로드 완료`);
      
      // 2. AI 주별 분석 수행
      console.log('🤖 AI 주별 분석 시작...');
      const aiResponse = await fetch(`/api/twitter-analysis/${projectId}/ai-weekly`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          weekly_data: weeklyData.weekly_data,
          account_info: weeklyData.account_info
        })
      });

      if (!aiResponse.ok) {
        throw new Error(`AI 분석 API 오류: ${aiResponse.status}`);
      }

      const aiAnalysisResult = await aiResponse.json();
      setWeeklyAnalysis(aiAnalysisResult);
      
      console.log(`✅ ${aiAnalysisResult.analysis_summary.total_weeks}주 AI 분석 완료`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ 주별 분석 로드 실패:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // 불필요한 기존 함수들 제거됨

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    loadWeeklyAnalysis();
  }, [projectId, dataPeriod]);

  // 기간 변경 핸들러
  const handlePeriodChange = (period: number) => {
    setDataPeriod(period);
    setSelectedWeek(null);
  };

  // 수동 새로고침
  const handleRefresh = async () => {
    await loadWeeklyAnalysis();
  };

  // 주별 선택 핸들러
  const handleWeekSelect = (weekIndex: number) => {
    setSelectedWeek(selectedWeek === weekIndex ? null : weekIndex);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 animate-spin border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-800">
            🤖 AI 주별 분석 중...
          </h3>
        </div>
        <div className="text-gray-600">
          저장된 트위터 데이터를 주별로 AI 분석하고 있습니다. 잠시만 기다려주세요.
        </div>
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-blue-700">
            💡 주별 분석은 각 주의 트윗 내용을 AI가 심층 분석하여 테마, 감정, 주요 이벤트를 정리합니다.
          </div>
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
            AI 분석 오류
          </h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!weeklyAnalysis) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            트위터 데이터 없음
          </h3>
          <p className="text-gray-600">
            이 프로젝트에는 연결된 트위터 계정이 없거나 데이터가 수집되지 않았습니다.
          </p>
        </div>
      </div>
    );
  }

  // 메인 AI 주별 분석 렌더링
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      {/* 헤더 */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">🤖</span>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                AI 주별 트위터 분석
              </h3>
              <p className="text-sm text-gray-600">
                @{weeklyAnalysis.account_info.screen_name} | {weeklyAnalysis.analysis_summary.total_weeks}주간 심층 분석
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {/* 기간 선택 */}
            <select
              value={dataPeriod}
              onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
              className="px-3 py-1 text-sm border border-gray-300 rounded-lg text-gray-700"
            >
              <option value={4}>최근 4주</option>
              <option value={8}>최근 8주</option>
              <option value={12}>최근 12주</option>
              <option value={16}>최근 16주</option>
            </select>
            
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
            >
              새로고침
            </button>
          </div>
        </div>

          {/* 전체 요약 통계 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {weeklyAnalysis.account_info.followers_count.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">팔로워</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {weeklyAnalysis.analysis_summary.total_tweets_analyzed}
              </div>
              <div className="text-sm text-gray-600">분석된 트윗</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {weeklyAnalysis.analysis_summary.avg_weekly_tweets}
              </div>
              <div className="text-sm text-gray-600">주평균 트윗</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {weeklyAnalysis.account_info.activity_score}
              </div>
              <div className="text-sm text-gray-600">활동도 점수</div>
            </div>
            <div className="text-center p-3 bg-pink-50 rounded-lg">
              <div className={`text-lg font-bold ${
                weeklyAnalysis.analysis_summary.dominant_sentiment === 'positive' ? 'text-green-600' :
                weeklyAnalysis.analysis_summary.dominant_sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {weeklyAnalysis.analysis_summary.dominant_sentiment === 'positive' ? '😊 긍정' :
                 weeklyAnalysis.analysis_summary.dominant_sentiment === 'negative' ? '😔 부정' : '😐 중립'}
              </div>
              <div className="text-sm text-gray-600">전체 감정</div>
            </div>
          </div>
        </div>

        {/* 인기 트윗 요약 */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">🔥 인기 트윗 하이라이트</h4>
          <div className="space-y-3">
            {weeklyAnalysis.weekly_analysis
              .flatMap(week => week.tweet_highlights.map(highlight => ({
                ...highlight,
                week_label: week.week_label,
                sentiment: week.analysis.sentiment
              })))
              .filter((highlight, index, array) => {
                // 텍스트 기준으로 중복 제거 (첫 번째 항목만 유지)
                return array.findIndex(item => item.text.trim() === highlight.text.trim()) === index;
              })
              .sort((a, b) => b.engagement - a.engagement)
              .slice(0, 5)
              .map((highlight, idx) => (
                <div key={idx} className="p-4 bg-gray-50 rounded-lg border-l-4 border-blue-500">
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm text-gray-500">
                      {highlight.week_label} · {highlight.engagement}회 참여
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                      highlight.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                      highlight.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                    }`}>
                      {highlight.sentiment === 'positive' ? '😊' :
                       highlight.sentiment === 'negative' ? '😔' : '😐'}
                    </div>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed">
                    "{highlight.text}"
                  </p>
                  <div className="text-xs text-blue-600 mt-1">
                    {highlight.reason}
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* 주별 분석 결과 */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4">📅 주별 상세 분석</h4>
          <div className="space-y-4">
            {[...weeklyAnalysis.weekly_analysis].reverse().map((week, index) => {
              const originalIndex = weeklyAnalysis.weekly_analysis.length - 1 - index;
              return (
              <div
                key={originalIndex}
                className={`border rounded-lg transition-all duration-200 ${
                  selectedWeek === originalIndex 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* 주별 헤더 */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => handleWeekSelect(originalIndex)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-lg font-semibold text-gray-800">
                        {week.week_label}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(week.week_start).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})} - {new Date(week.week_end).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-4">
                      {/* 감정 */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        week.analysis.sentiment === 'positive' ? 'bg-green-100 text-green-700' :
                        week.analysis.sentiment === 'negative' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {week.analysis.sentiment === 'positive' ? '😊' :
                         week.analysis.sentiment === 'negative' ? '😔' : '😐'}
                      </div>

                      {/* 활동도 */}
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        week.analysis.activity_level === 'high' ? 'bg-green-100 text-green-700' :
                        week.analysis.activity_level === 'medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {week.analysis.activity_level === 'high' ? '🔥 높음' :
                         week.analysis.activity_level === 'medium' ? '📈 보통' : '📉 낮음'}
                      </div>

                      {/* 트윗 수 */}
                      <div className="text-sm text-gray-600">
                        {week.raw_stats.total_tweets}개 트윗
                      </div>

                      {/* 확장 아이콘 */}
                      <div className={`transform transition-transform ${selectedWeek === originalIndex ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주별 상세 내용 (확장됨) */}
                {selectedWeek === originalIndex && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="pt-4 space-y-6">
                      {/* 주요 화제 */}
                      <div>
                        <h6 className="font-medium text-gray-700 mb-2">🎯 주요 화제</h6>
                        <div className="flex flex-wrap gap-1">
                          {week.analysis.main_topics.map((topic, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* 주요 이벤트 - 전폭 표시 */}
                      <div>
                        <h6 className="font-medium text-gray-700 mb-3">📋 주요 이벤트 (최대 5개)</h6>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          {week.analysis.key_events.slice(0, 5).map((event, idx) => (
                            <div key={idx} className="p-3 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                              <div className="flex items-start">
                                <div className="flex-shrink-0 w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                  <span className="text-blue-600 text-xs font-bold">{idx + 1}</span>
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm text-gray-800 leading-relaxed">{event}</p>
                                  <div className="text-xs text-gray-500 mt-1">
                                    {new Date(week.week_start).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})} - {new Date(week.week_end).toLocaleDateString('ko-KR', {month: 'short', day: 'numeric'})}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 하이라이트 트윗 */}
                      {week.tweet_highlights.length > 0 && (
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">⭐ 주요 트윗</h6>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {week.tweet_highlights.slice(0, 4).map((highlight, idx) => (
                              <div key={idx} className="p-3 bg-gray-50 rounded-lg text-sm">
                                <div className="text-gray-800 mb-1 leading-relaxed">
                                  "{highlight.text}"
                                </div>
                                <div className="text-xs text-gray-500">
                                  {highlight.engagement}회 참여 · {highlight.reason}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )})}
          </div>
        </div>

        {/* 데이터 소스 정보 */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg text-xs text-gray-500">
          <div className="flex justify-between">
            <span>마지막 업데이트: {new Date(weeklyAnalysis.account_info.last_updated).toLocaleString('ko-KR')}</span>
            <span>AI 분석 완료: {new Date(weeklyAnalysis.generated_at).toLocaleString('ko-KR')}</span>
          </div>
        </div>
      </div>
    );

};

export default TwitterDataAnalysis;

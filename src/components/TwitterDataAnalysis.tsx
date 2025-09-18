'use client';

import React, { useState, useEffect } from 'react';

interface TwitterDataAnalysisProps {
  projectId: string;
  projectName: string;
  screenName?: string; // 옵셔널: 직접 screenName 제공 가능
}

// 기존 인터페이스는 하위 호환성을 위해 유지
interface TwitterProjectData {
  account: {
    screen_name: string;
    name: string;
    followers_count: number;
    verified: boolean;
    activity_score: number;
    last_updated: string;
  };
  tweets: {
    total_count: number;
    avg_engagement: number;
    recent_tweets: Array<{
      id: string;
      text: string;
      created_at: string;
      retweet_count: number;
      favorite_count: number;
      is_retweet: boolean;
    }>;
  };
  data_period_days: number;
}

interface AIAnalysisResult {
  overall_sentiment: 'positive' | 'neutral' | 'negative';
  activity_level: 'high' | 'medium' | 'low';
  main_themes: string[];
  engagement_insights: string;
  growth_prediction: string;
  recommendations: string[];
}

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
  // 기존 상태 (하위 호환성)
  const [twitterData, setTwitterData] = useState<TwitterProjectData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  
  // 새로운 고도화된 상태
  const [weeklyAnalysis, setWeeklyAnalysis] = useState<WeeklyTwitterAnalysis | null>(null);
  const [analysisMode, setAnalysisMode] = useState<'simple' | 'weekly'>('weekly' as const);
  
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

  // 기존 단순 분석 로드 (하위 호환성)
  const loadTwitterData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 프로젝트 ${projectName}의 트위터 데이터 분석 시작 (${dataPeriod}일)`);
      
      const response = await fetch(`/api/twitter-scheduler/project/${projectId}?days=${dataPeriod * 7}`);
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('이 프로젝트에는 연결된 트위터 계정이 없습니다.');
        }
        throw new Error(`API 오류: ${response.status}`);
      }

      const result = await response.json();
      setTwitterData(result);
      
      // AI 분석 실행
      if (result.tweets.total_count > 0) {
        await performAIAnalysis(result);
      }
      
      console.log(`✅ ${result.account.screen_name} 데이터 로드 완료: ${result.tweets.total_count}개 트윗`);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      console.error('❌ 트위터 데이터 로드 실패:', errorMessage);
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // AI 분석 수행
  const performAIAnalysis = async (data: TwitterProjectData) => {
    try {
      console.log('🤖 AI 기반 트위터 분석 시작...');
      
      // 간단한 AI 분석 로직 (실제로는 더 정교한 분석 가능)
      const analysis = analyzeTwitterData(data);
      setAiAnalysis(analysis);
      
      console.log('✅ AI 분석 완료:', analysis);
      
    } catch (error) {
      console.error('❌ AI 분석 실패:', error);
    }
  };

  // 로컬 AI 분석 함수
  const analyzeTwitterData = (data: TwitterProjectData): AIAnalysisResult => {
    const tweets = data.tweets.recent_tweets;
    const account = data.account;
    
    // 1. 감정 분석
    const positiveWords = ['great', 'excited', 'amazing', 'awesome', 'successful', 'launch', 'new', 'improve'];
    const negativeWords = ['delay', 'issue', 'problem', 'sorry', 'fix', 'bug', 'postpone'];
    
    let positiveScore = 0;
    let negativeScore = 0;
    
    tweets.forEach(tweet => {
      const text = tweet.text.toLowerCase();
      positiveWords.forEach(word => {
        if (text.includes(word)) positiveScore++;
      });
      negativeWords.forEach(word => {
        if (text.includes(word)) negativeScore++;
      });
    });
    
    const sentiment: AIAnalysisResult['overall_sentiment'] = 
      positiveScore > negativeScore ? 'positive' :
      negativeScore > positiveScore ? 'negative' : 'neutral';

    // 2. 활동 수준 분석
    const tweetsPerDay = data.tweets.total_count / data.data_period_days;
    const activity_level: AIAnalysisResult['activity_level'] = 
      tweetsPerDay >= 2 ? 'high' :
      tweetsPerDay >= 0.5 ? 'medium' : 'low';

    // 3. 주요 테마 추출
    const themeKeywords = {
      'Technology': ['blockchain', 'defi', 'nft', 'web3', 'smart contract', 'dapp'],
      'Community': ['community', 'event', 'ama', 'workshop', 'meetup'],
      'Product': ['product', 'feature', 'release', 'update', 'launch'],
      'Partnership': ['partnership', 'collaboration', 'integrate', 'join'],
      'Marketing': ['announcement', 'news', 'campaign', 'promotion']
    };
    
    const main_themes: string[] = [];
    const allText = tweets.map(t => t.text).join(' ').toLowerCase();
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => allText.includes(keyword))) {
        main_themes.push(theme);
      }
    });

    // 4. 참여도 인사이트
    const engagement_insights = data.tweets.avg_engagement > 50 
      ? `높은 참여도 (평균 ${data.tweets.avg_engagement}회)`
      : data.tweets.avg_engagement > 20
      ? `보통 참여도 (평균 ${data.tweets.avg_engagement}회)`
      : `낮은 참여도 (평균 ${data.tweets.avg_engagement}회)`;

    // 5. 성장 예측
    const growth_prediction = account.activity_score > 70
      ? '높은 활동도를 바탕으로 지속적인 성장 예상'
      : account.activity_score > 40
      ? '안정적인 성장 가능성 있음'
      : '활동도 증가 필요';

    // 6. 권장사항
    const recommendations: string[] = [];
    
    if (tweetsPerDay < 1) {
      recommendations.push('더 자주 포스팅하여 커뮤니티와의 소통 증대');
    }
    if (data.tweets.avg_engagement < 30) {
      recommendations.push('트윗 콘텐츠 품질 개선으로 참여도 향상');
    }
    if (main_themes.length < 2) {
      recommendations.push('다양한 주제로 콘텐츠 다변화');
    }
    if (!account.verified) {
      recommendations.push('계정 인증을 통한 신뢰도 증대');
    }
    
    return {
      overall_sentiment: sentiment,
      activity_level,
      main_themes,
      engagement_insights,
      growth_prediction,
      recommendations
    };
  };

  // 컴포넌트 마운트 시 데이터 로드
  useEffect(() => {
    if (analysisMode === 'weekly') {
      loadWeeklyAnalysis();
    } else {
      loadTwitterData();
    }
  }, [projectId, dataPeriod, analysisMode]);

  // 분석 모드 변경 핸들러
  const handleModeChange = (mode: 'simple' | 'weekly') => {
    setAnalysisMode(mode);
    setSelectedWeek(null);
    setWeeklyAnalysis(null);
    setTwitterData(null);
    setAiAnalysis(null);
    setError(null);
  };

  // 모드 토글 헬퍼
  const toggleAnalysisMode = () => {
    const newMode: 'simple' | 'weekly' = analysisMode === 'weekly' ? 'simple' : 'weekly';
    handleModeChange(newMode);
  };

  // 기간 변경 핸들러
  const handlePeriodChange = (period: number) => {
    setDataPeriod(period);
    setSelectedWeek(null);
  };

  // 수동 새로고침
  const handleRefresh = async () => {
    if (analysisMode === 'weekly') {
      await loadWeeklyAnalysis();
    } else {
      await loadTwitterData();
    }
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
            {analysisMode === 'weekly' ? '🤖 AI 주별 분석 중...' : '📊 트위터 데이터 분석 중...'}
          </h3>
        </div>
        <div className="text-gray-600">
          {analysisMode === 'weekly' 
            ? '저장된 트위터 데이터를 주별로 AI 분석하고 있습니다. 잠시만 기다려주세요.'
            : '저장된 트위터 데이터를 AI로 분석하고 있습니다.'
          }
        </div>
        {analysisMode === 'weekly' && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700">
              💡 주별 분석은 각 주의 트윗 내용을 AI가 심층 분석하여 테마, 감정, 주요 이벤트를 정리합니다.
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">❌</span>
          <h3 className="text-lg font-semibold text-red-800">
            데이터 분석 오류
          </h3>
        </div>
        <p className="text-red-600 mb-4">{error}</p>
        <div className="flex space-x-3">
          <button
            onClick={handleRefresh}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            다시 시도
          </button>
          <button
            onClick={toggleAnalysisMode}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            {analysisMode === 'weekly' ? '단순 분석으로 전환' : '주별 분석으로 전환'}
          </button>
        </div>
      </div>
    );
  }

  if (analysisMode === 'weekly' && !weeklyAnalysis) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            트위터 데이터 없음
          </h3>
          <p className="text-gray-600 mb-4">
            이 프로젝트에는 연결된 트위터 계정이 없거나 데이터가 수집되지 않았습니다.
          </p>
          <button
            onClick={() => handleModeChange('simple')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            단순 분석으로 전환
          </button>
        </div>
      </div>
    );
  }

  if (analysisMode === 'simple' && !twitterData) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="text-center">
          <span className="text-4xl mb-4 block">📭</span>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            트위터 데이터 없음
          </h3>
          <p className="text-gray-600 mb-4">
            이 프로젝트에는 연결된 트위터 계정이 없거나 데이터가 수집되지 않았습니다.
          </p>
          <button
            onClick={() => handleModeChange('weekly')}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            주별 분석으로 전환
          </button>
        </div>
      </div>
    );
  }

  // 주별 분석 렌더링
  if (analysisMode === 'weekly' && weeklyAnalysis) {
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
              {/* 분석 모드 토글 */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => handleModeChange('weekly')}
                  className={`px-3 py-1 text-sm rounded-md transition-colors ${
                    analysisMode === 'weekly' 
                      ? 'bg-white text-blue-600 shadow-sm' 
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  주별 분석
                </button>
                <button
                  onClick={() => handleModeChange('simple')}
                  className={
                    (analysisMode as string) === 'simple' 
                      ? 'px-3 py-1 text-sm rounded-md transition-colors bg-white text-blue-600 shadow-sm'
                      : 'px-3 py-1 text-sm rounded-md transition-colors text-gray-600 hover:text-gray-800'
                  }
                >
                  단순 분석
                </button>
              </div>
              
              {/* 기간 선택 */}
              <select
                value={dataPeriod}
                onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
                className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
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

        {/* 주요 트렌드 요약 */}
        <div className="p-6 border-b border-gray-200">
          <h4 className="font-semibold text-gray-800 mb-4">📈 주요 트렌드</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 공통 주제 */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">🎯 주요 화제</h5>
              <div className="flex flex-wrap gap-2">
                {weeklyAnalysis.trends.common_topics.slice(0, 5).map((topic, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>

            {/* 최고 성과 주 */}
            <div>
              <h5 className="font-medium text-gray-700 mb-2">🏆 최고 활동 주</h5>
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="font-medium text-green-800">
                  {weeklyAnalysis.trends.most_active_week.week_label}
                </div>
                <div className="text-sm text-green-600">
                  {weeklyAnalysis.trends.most_active_week.raw_stats.total_tweets}개 트윗
                  · 평균 {weeklyAnalysis.trends.most_active_week.raw_stats.avg_engagement}회 참여
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 주별 분석 결과 */}
        <div className="p-6">
          <h4 className="font-semibold text-gray-800 mb-4">📅 주별 상세 분석</h4>
          <div className="space-y-4">
            {weeklyAnalysis.weekly_analysis.map((week, index) => (
              <div
                key={index}
                className={`border rounded-lg transition-all duration-200 ${
                  selectedWeek === index 
                    ? 'border-blue-300 bg-blue-50' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                {/* 주별 헤더 */}
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => handleWeekSelect(index)}
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
                      <div className={`transform transition-transform ${selectedWeek === index ? 'rotate-180' : ''}`}>
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 주별 상세 내용 (확장됨) */}
                {selectedWeek === index && (
                  <div className="px-4 pb-4 border-t border-gray-200">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                      {/* 왼쪽: 분석 결과 */}
                      <div className="space-y-4">
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

                        {/* 주요 이벤트 */}
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">📋 주요 이벤트</h6>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {week.analysis.key_events.map((event, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-blue-500 mr-2 mt-1">•</span>
                                <span>{event}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* 커뮤니티 인사이트 */}
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">👥 커뮤니티 반응</h6>
                          <p className="text-sm text-gray-600 italic">
                            "{week.analysis.community_insights}"
                          </p>
                        </div>
                      </div>

                      {/* 오른쪽: 하이라이트 트윗 & 통계 */}
                      <div className="space-y-4">
                        {/* 통계 */}
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">📊 이 주의 통계</h6>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium">{week.raw_stats.original_tweets}</div>
                              <div className="text-gray-600">오리지널 트윗</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium">{week.raw_stats.retweets}</div>
                              <div className="text-gray-600">리트윗</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium">{week.raw_stats.replies}</div>
                              <div className="text-gray-600">답글</div>
                            </div>
                            <div className="p-2 bg-gray-50 rounded">
                              <div className="font-medium">{week.raw_stats.avg_engagement}</div>
                              <div className="text-gray-600">평균 참여도</div>
                            </div>
                          </div>
                        </div>

                        {/* 하이라이트 트윗 */}
                        {week.tweet_highlights.length > 0 && (
                          <div>
                            <h6 className="font-medium text-gray-700 mb-2">⭐ 주요 트윗</h6>
                            <div className="space-y-2">
                              {week.tweet_highlights.slice(0, 2).map((highlight, idx) => (
                                <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                                  <div className="text-gray-800 mb-1">
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

                        {/* AI 권장사항 */}
                        <div>
                          <h6 className="font-medium text-gray-700 mb-2">🎯 AI 권장사항</h6>
                          <ul className="text-sm text-gray-600 space-y-1">
                            {week.analysis.recommendations.slice(0, 2).map((rec, idx) => (
                              <li key={idx} className="flex items-start">
                                <span className="text-green-500 mr-2 mt-1">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
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
  }

  // 기존 단순 분석 렌더링 (하위 호환성)
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              AI 트위터 데이터 분석 (단순 모드)
            </h3>
            <p className="text-sm text-gray-600">
              @{twitterData?.account.screen_name} | 저장된 데이터 기반 분석
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* 분석 모드 토글 */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => handleModeChange('weekly')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                analysisMode === 'weekly' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              주별 분석
            </button>
            <button
              onClick={() => handleModeChange('simple')}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${
                analysisMode === 'simple' 
                  ? 'bg-white text-blue-600 shadow-sm' 
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              단순 분석
            </button>
          </div>
          
          {/* 기간 선택 */}
          <select
            value={dataPeriod}
            onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
          >
            <option value={1}>최근 1주</option>
            <option value={4}>최근 4주</option>
            <option value={8}>최근 8주</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 업그레이드 권장 안내 */}
      <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex items-center space-x-3">
          <span className="text-yellow-600">⚠️</span>
          <div className="flex-1">
            <h4 className="font-medium text-yellow-800">더 정확한 분석을 위해 주별 분석을 추천합니다</h4>
            <p className="text-sm text-yellow-700 mt-1">
              주별 분석은 각 주의 트윗 내용을 AI가 심층 분석하여 테마, 감정, 주요 이벤트를 정리해줍니다.
            </p>
          </div>
          <button
            onClick={() => handleModeChange('weekly')}
            className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
          >
            주별 분석으로 전환
          </button>
        </div>
      </div>

      {/* 계정 개요 */}
      {twitterData && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {twitterData.account.followers_count.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">팔로워</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {twitterData.tweets.total_count}
            </div>
            <div className="text-sm text-gray-600">분석된 트윗</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">
              {twitterData.account.activity_score}
            </div>
            <div className="text-sm text-gray-600">활동도 점수</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-orange-600">
              {twitterData.tweets.avg_engagement}
            </div>
            <div className="text-sm text-gray-600">평균 참여도</div>
          </div>
        </div>
      )}

      {/* AI 분석 결과 */}
      {aiAnalysis && (
        <div className="space-y-6">
          {/* 전체 분석 요약 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">📊 전체 감정</h4>
              <div className={`text-lg font-semibold ${
                aiAnalysis.overall_sentiment === 'positive' ? 'text-green-600' :
                aiAnalysis.overall_sentiment === 'negative' ? 'text-red-600' : 'text-gray-600'
              }`}>
                {aiAnalysis.overall_sentiment === 'positive' ? '😊 긍정적' :
                 aiAnalysis.overall_sentiment === 'negative' ? '😔 부정적' : '😐 중립적'}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">⚡ 활동 수준</h4>
              <div className={`text-lg font-semibold ${
                aiAnalysis.activity_level === 'high' ? 'text-green-600' :
                aiAnalysis.activity_level === 'medium' ? 'text-yellow-600' : 'text-red-600'
              }`}>
                {aiAnalysis.activity_level === 'high' ? '🔥 높음' :
                 aiAnalysis.activity_level === 'medium' ? '📈 보통' : '📉 낮음'}
              </div>
            </div>
            
            <div className="p-4 border rounded-lg">
              <h4 className="font-medium text-gray-800 mb-2">📈 성장 전망</h4>
              <div className="text-sm text-gray-600">
                {aiAnalysis.growth_prediction}
              </div>
            </div>
          </div>

          {/* 주요 테마 */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">🎯 주요 활동 테마</h4>
            <div className="flex flex-wrap gap-2">
              {aiAnalysis.main_themes.map((theme, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                >
                  {theme}
                </span>
              ))}
              {aiAnalysis.main_themes.length === 0 && (
                <span className="text-sm text-gray-500">분석된 주요 테마 없음</span>
              )}
            </div>
          </div>

          {/* 참여도 인사이트 */}
          <div>
            <h4 className="font-medium text-gray-800 mb-2">💬 참여도 분석</h4>
            <p className="text-gray-600">{aiAnalysis.engagement_insights}</p>
          </div>

          {/* AI 권장사항 */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">🎯 AI 권장사항</h4>
            <div className="space-y-2">
              {aiAnalysis.recommendations.map((rec, idx) => (
                <div key={idx} className="flex items-start space-x-2">
                  <span className="text-blue-500 mt-1">•</span>
                  <span className="text-sm text-gray-600">{rec}</span>
                </div>
              ))}
              {aiAnalysis.recommendations.length === 0 && (
                <p className="text-sm text-gray-500">현재 권장사항 없음 - 좋은 상태입니다!</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 최근 트윗 샘플 */}
      {twitterData && twitterData.tweets.recent_tweets.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <h4 className="font-medium text-gray-800 mb-4">📝 최근 트윗 (샘플)</h4>
          <div className="space-y-3 max-h-64 overflow-y-auto">
            {twitterData.tweets.recent_tweets.slice(0, 3).map((tweet) => (
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
                    {tweet.is_retweet && <span className="text-green-600">RT</span>}
                  </div>
                </div>
                <p className="text-gray-800 text-sm leading-relaxed">
                  {tweet.text.substring(0, 200)}
                  {tweet.text.length > 200 && '...'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 데이터 소스 정보 */}
      {twitterData && (
        <div className="mt-6 pt-4 border-t text-xs text-gray-500">
          <div className="flex justify-between">
            <span>마지막 업데이트: {new Date(twitterData.account.last_updated).toLocaleString('ko-KR')}</span>
            <span>분석 기간: {twitterData.data_period_days}일</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwitterDataAnalysis;

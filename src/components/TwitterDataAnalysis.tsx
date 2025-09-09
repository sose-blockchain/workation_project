'use client';

import React, { useState, useEffect } from 'react';

interface TwitterDataAnalysisProps {
  projectId: string;
  projectName: string;
  screenName?: string; // 옵셔널: 직접 screenName 제공 가능
}

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

const TwitterDataAnalysis: React.FC<TwitterDataAnalysisProps> = ({ 
  projectId, 
  projectName 
}) => {
  const [twitterData, setTwitterData] = useState<TwitterProjectData | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dataPeriod, setDataPeriod] = useState(30);

  // 트위터 데이터 로드
  const loadTwitterData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log(`📊 프로젝트 ${projectName}의 트위터 데이터 분석 시작 (${dataPeriod}일)`);
      
      const response = await fetch(`/api/twitter-scheduler/project/${projectId}?days=${dataPeriod}`);
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
    loadTwitterData();
  }, [projectId, dataPeriod]);

  // 기간 변경 핸들러
  const handlePeriodChange = (days: number) => {
    setDataPeriod(days);
  };

  // 수동 새로고침
  const handleRefresh = async () => {
    await loadTwitterData();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-6 h-6 animate-spin border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-800">
            📊 트위터 데이터 분석 중...
          </h3>
        </div>
        <div className="text-gray-600">
          저장된 트위터 데이터를 AI로 분석하고 있습니다.
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
            데이터 분석 오류
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

  if (!twitterData) {
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

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <span className="text-2xl">🤖</span>
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              AI 트위터 데이터 분석
            </h3>
            <p className="text-sm text-gray-600">
              @{twitterData.account.screen_name} | 저장된 데이터 기반 분석
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* 기간 선택 */}
          <select
            value={dataPeriod}
            onChange={(e) => handlePeriodChange(parseInt(e.target.value))}
            className="px-3 py-1 text-sm border border-gray-300 rounded-lg"
          >
            <option value={7}>최근 7일</option>
            <option value={30}>최근 30일</option>
            <option value={90}>최근 90일</option>
          </select>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            새로고침
          </button>
        </div>
      </div>

      {/* 계정 개요 */}
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
      {twitterData.tweets.recent_tweets.length > 0 && (
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
      <div className="mt-6 pt-4 border-t text-xs text-gray-500">
        <div className="flex justify-between">
          <span>마지막 업데이트: {new Date(twitterData.account.last_updated).toLocaleString('ko-KR')}</span>
          <span>분석 기간: {twitterData.data_period_days}일</span>
        </div>
      </div>
    </div>
  );
};

export default TwitterDataAnalysis;

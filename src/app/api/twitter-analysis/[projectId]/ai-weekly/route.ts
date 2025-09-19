import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { supabase } from '@/lib/supabase';

interface WeeklyAIAnalysis {
  week_start: string;
  week_end: string;
  week_label: string; // "1주차", "2주차" 등
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
    reason: string; // 왜 하이라이트인지
  }>;
  raw_stats: {
    total_tweets: number;
    avg_engagement: number;
    original_tweets: number;
    retweets: number;
    replies: number;
  };
}

/**
 * AI 기반 주별 트위터 데이터 심층 분석 API
 * Google Gemini를 활용하여 각 주별로 트윗 내용을 분석하고 인사이트 제공
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const startTime = Date.now();
  let logData = {
    project_id: params.projectId,
    analysis_type: 'weekly' as const,
    weeks_requested: 0,
    tweets_analyzed: 0,
    api_calls_made: 0,
    processing_time_seconds: 0,
    cache_hit: false,
    success: false,
    error_message: null as string | null
  };

  try {
    const projectId = params.projectId;
    const { weekly_data, account_info } = await request.json();
    
    logData.weeks_requested = weekly_data?.length || 0;
    logData.tweets_analyzed = weekly_data?.reduce((sum: number, week: any) => sum + week.tweets.length, 0) || 0;

    console.log(`🤖 프로젝트 ${projectId}의 AI 주별 분석 시작 (${logData.weeks_requested}주, ${logData.tweets_analyzed}개 트윗)`);

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // 1. 캐시된 분석 결과 확인
    const analysisStartDate = weekly_data[0]?.week_start;
    const analysisEndDate = weekly_data[weekly_data.length - 1]?.week_end;
    
    if (analysisStartDate && analysisEndDate) {
      console.log('📦 캐시된 분석 결과 확인 중...');
      
      const { data: cachedAnalysis, error: cacheError } = await supabase
        .from('twitter_trend_analysis')
        .select('*')
        .eq('project_id', projectId)
        .eq('analysis_start_date', analysisStartDate.split('T')[0])
        .eq('analysis_end_date', analysisEndDate.split('T')[0])
        .single();

      if (!cacheError && cachedAnalysis) {
        console.log('✅ 캐시된 분석 결과 발견! DB에서 로드');
        logData.cache_hit = true;
        logData.success = true;
        logData.processing_time_seconds = (Date.now() - startTime) / 1000;
        
        // 로그 기록
        await logAnalysisRequest(logData);
        
        return NextResponse.json({
          success: true,
          cached: true,
          ...cachedAnalysis.trends_result,
          generated_at: cachedAnalysis.created_at
        });
      }
    }

    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('Gemini API key is not configured');
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const aiAnalysisResults: WeeklyAIAnalysis[] = [];
    let totalApiCalls = 0;

    // 각 주별로 AI 분석 수행
    for (let weekIndex = 0; weekIndex < weekly_data.length; weekIndex++) {
      const weekData = weekly_data[weekIndex];
      const weekLabel = `${weekIndex + 1}주차`;
      
      console.log(`📅 ${weekLabel} 분석 중... (${weekData.tweets.length}개 트윗)`);

      if (weekData.tweets.length === 0) {
        // 트윗이 없는 주는 기본 분석 결과 생성
        aiAnalysisResults.push({
          week_start: weekData.week_start,
          week_end: weekData.week_end,
          week_label: weekLabel,
          analysis: {
            main_topics: [],
            sentiment: 'neutral',
            activity_level: 'low',
            engagement_quality: 'poor',
            key_events: ['이 주에는 트윗 활동이 없었습니다'],
            community_insights: '커뮤니티와의 소통이 부재한 주간입니다.',
            recommendations: [
              '정기적인 소통으로 커뮤니티 참여 증대',
              '프로젝트 업데이트 공유 고려'
            ]
          },
          tweet_highlights: [],
          raw_stats: weekData.stats
        });
        continue;
      }

      // AI 분석을 위한 프롬프트 생성
      const tweetsText = weekData.tweets
        .map((tweet: any) => `"${tweet.text}" (좋아요: ${tweet.favorite_count}, 리트윗: ${tweet.retweet_count})`)
        .join('\n');

      const prompt = `
다음은 블록체인/암호화폐 프로젝트 "${account_info.screen_name}"의 ${weekLabel} 트위터 활동 데이터입니다.

계정 정보:
- 계정명: @${account_info.screen_name}
- 팔로워: ${account_info.followers_count.toLocaleString()}명
- 인증 여부: ${account_info.verified ? '✓ 인증됨' : '미인증'}

이 주의 트윗들:
${tweetsText}

위 데이터를 분석하여 다음 형식의 JSON으로 응답해주세요:

{
  "main_topics": ["이 주의 주요 화제 3개"],
  "sentiment": "positive/neutral/negative 중 하나",
  "activity_level": "high/medium/low 중 하나",
  "engagement_quality": "excellent/good/average/poor 중 하나",
  "key_events": ["이 주에 일어난 주요 이벤트나 발표 4-5개"],
  "community_insights": "커뮤니티 반응과 참여도에 대한 한 줄 요약",
  "recommendations": ["다음 주를 위한 구체적인 제안 2-3개"]
}

분석 기준:
- main_topics: 트윗에서 자주 언급된 키워드나 주제
- sentiment: 전반적인 톤과 감정
- activity_level: 트윗 빈도와 다양성
- engagement_quality: 좋아요/리트윗 비율
- key_events: 특별한 발표, 업데이트, 이벤트
- community_insights: 팔로워들의 반응 패턴
- recommendations: 실용적이고 구체적인 조언

JSON만 반환하고 다른 텍스트는 포함하지 마세요.
`;

      try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const analysisText = response.text();
        
        // JSON 파싱
        let analysis;
        try {
          // JSON만 추출 (```json ``` 제거)
          const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
          const jsonString = jsonMatch ? jsonMatch[0] : analysisText;
          analysis = JSON.parse(jsonString);
        } catch (parseError) {
          console.warn(`${weekLabel} JSON 파싱 실패, 기본값 사용:`, parseError);
          analysis = {
            main_topics: ['분석 실패'],
            sentiment: 'neutral' as const,
            activity_level: 'medium' as const,
            engagement_quality: 'average' as const,
            key_events: ['AI 분석 중 오류 발생'],
            community_insights: '이 주의 데이터를 분석할 수 없습니다.',
            recommendations: ['데이터 품질 개선 필요']
          };
        }

        // 트윗 하이라이트 선별 (참여도 높은 순)
        const highlights = weekData.tweets
          .map((tweet: any) => ({
            text: tweet.text.length > 100 ? tweet.text.substring(0, 100) + '...' : tweet.text,
            engagement: tweet.favorite_count + tweet.retweet_count,
            reason: tweet.favorite_count + tweet.retweet_count > 10 ? '높은 참여도' : '대표 트윗'
          }))
          .sort((a: any, b: any) => b.engagement - a.engagement)
          .slice(0, 3);

        aiAnalysisResults.push({
          week_start: weekData.week_start,
          week_end: weekData.week_end,
          week_label: weekLabel,
          analysis,
          tweet_highlights: highlights,
          raw_stats: weekData.stats
        });

        console.log(`✅ ${weekLabel} AI 분석 완료`);

        // API 호출 카운트 증가
        totalApiCalls++;
        
        // Rate limiting 방지를 위한 딜레이
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (aiError) {
        console.error(`❌ ${weekLabel} AI 분석 실패:`, aiError);
        
        // AI 분석 실패 시 기본 분석 결과
        aiAnalysisResults.push({
          week_start: weekData.week_start,
          week_end: weekData.week_end,
          week_label: weekLabel,
          analysis: {
            main_topics: ['AI 분석 실패'],
            sentiment: 'neutral',
            activity_level: weekData.stats.total_tweets >= 5 ? 'high' : weekData.stats.total_tweets >= 2 ? 'medium' : 'low',
            engagement_quality: weekData.stats.avg_engagement >= 20 ? 'good' : 'average',
            key_events: [`${weekData.stats.total_tweets}개의 트윗 활동`],
            community_insights: 'AI 분석을 사용할 수 없어 기본 통계만 제공됩니다.',
            recommendations: ['AI 분석 재시도 권장']
          },
          tweet_highlights: weekData.tweets.slice(0, 2).map((tweet: any) => ({
            text: tweet.text.substring(0, 100),
            engagement: tweet.favorite_count + tweet.retweet_count,
            reason: '샘플 트윗'
          })),
          raw_stats: weekData.stats
        });
      }
    }

    // 전체 트렌드 분석
    const overallTrends = {
      most_active_week: aiAnalysisResults.reduce((prev, current) => 
        current.raw_stats.total_tweets > prev.raw_stats.total_tweets ? current : prev
      ),
      best_engagement_week: aiAnalysisResults.reduce((prev, current) => 
        current.raw_stats.avg_engagement > prev.raw_stats.avg_engagement ? current : prev
      ),
      common_topics: getCommonTopics(aiAnalysisResults),
      sentiment_trend: aiAnalysisResults.map(week => ({
        week: week.week_label,
        sentiment: week.analysis.sentiment
      })),
      activity_trend: aiAnalysisResults.map(week => ({
        week: week.week_label,
        level: week.analysis.activity_level,
        tweet_count: week.raw_stats.total_tweets
      }))
    };

    console.log(`✅ 전체 AI 분석 완료: ${aiAnalysisResults.length}주`);

    // 로그 데이터 업데이트
    logData.api_calls_made = totalApiCalls;
    logData.processing_time_seconds = (Date.now() - startTime) / 1000;
    logData.success = true;

    // 결과 객체 생성
    const analysisResult = {
      success: true,
      project_id: projectId,
      account_info,
      analysis_summary: {
        total_weeks: aiAnalysisResults.length,
        total_tweets_analyzed: aiAnalysisResults.reduce((sum, week) => sum + week.raw_stats.total_tweets, 0),
        avg_weekly_tweets: Math.round(aiAnalysisResults.reduce((sum, week) => sum + week.raw_stats.total_tweets, 0) / aiAnalysisResults.length),
        dominant_sentiment: getMostCommonSentiment(aiAnalysisResults)
      },
      weekly_analysis: aiAnalysisResults,
      trends: overallTrends,
      generated_at: new Date().toISOString()
    };

    // 2. 분석 결과를 DB에 캐시로 저장
    try {
      if (analysisStartDate && analysisEndDate) {
        await saveAnalysisResultsToCache(projectId, account_info, analysisResult, aiAnalysisResults);
        console.log('💾 분석 결과 캐시 저장 완료');
      }
    } catch (cacheError) {
      console.warn('⚠️ 캐시 저장 실패 (분석은 정상 완료):', cacheError);
    }

    // 3. 로그 기록
    await logAnalysisRequest(logData);

    return NextResponse.json(analysisResult);

  } catch (error) {
    // 오류 로그 기록
    logData.error_message = error instanceof Error ? error.message : 'Unknown error';
    logData.processing_time_seconds = (Date.now() - startTime) / 1000;
    await logAnalysisRequest(logData);

    console.error('💥 AI 주별 분석 오류:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// 캐싱 및 로그 헬퍼 함수들
async function saveAnalysisResultsToCache(
  projectId: string,
  accountInfo: any,
  analysisResult: any,
  weeklyResults: WeeklyAIAnalysis[]
) {
  if (!supabase) return;

  const analysisStartDate = analysisResult.weekly_analysis[0]?.week_start.split('T')[0];
  const analysisEndDate = analysisResult.weekly_analysis[analysisResult.weekly_analysis.length - 1]?.week_end.split('T')[0];

  try {
    // 1. 주별 분석 결과 저장
    const weeklyInserts = weeklyResults.map((week, index) => ({
      project_id: projectId,
      twitter_account_id: accountInfo.id || null,
      week_start: week.week_start.split('T')[0],
      week_end: week.week_end.split('T')[0],
      week_number: index + 1,
      analysis_period_weeks: weeklyResults.length,
      analysis_result: week.analysis,
      sentiment: week.analysis.sentiment,
      activity_level: week.analysis.activity_level,
      engagement_quality: week.analysis.engagement_quality,
      main_topics: week.analysis.main_topics,
      total_tweets: week.raw_stats.total_tweets,
      avg_engagement: week.raw_stats.avg_engagement,
      ai_model_version: 'gemini-1.5-flash',
      processing_time_seconds: 0 // 개별 주 처리 시간은 별도 추적 필요
    }));

    await supabase
      .from('twitter_weekly_analysis')
      .upsert(weeklyInserts, { 
        onConflict: 'project_id,week_start,week_end,analysis_period_weeks'
      });

    // 2. 전체 트렌드 분석 결과 저장
    await supabase
      .from('twitter_trend_analysis')
      .upsert({
        project_id: projectId,
        twitter_account_id: accountInfo.id || null,
        analysis_start_date: analysisStartDate,
        analysis_end_date: analysisEndDate,
        total_weeks: weeklyResults.length,
        trends_result: analysisResult,
        total_tweets_analyzed: analysisResult.analysis_summary.total_tweets_analyzed,
        avg_weekly_tweets: analysisResult.analysis_summary.avg_weekly_tweets,
        dominant_sentiment: analysisResult.analysis_summary.dominant_sentiment,
        common_topics: analysisResult.trends.common_topics,
        most_active_week_start: analysisResult.trends.most_active_week.week_start.split('T')[0],
        best_engagement_week_start: analysisResult.trends.best_engagement_week.week_start.split('T')[0]
      }, {
        onConflict: 'project_id,analysis_start_date,analysis_end_date'
      });

  } catch (error) {
    console.error('캐시 저장 실패:', error);
    throw error;
  }
}

async function logAnalysisRequest(logData: any) {
  if (!supabase) return;

  try {
    await supabase
      .from('twitter_ai_analysis_logs')
      .insert(logData);
  } catch (error) {
    console.error('분석 로그 기록 실패:', error);
  }
}

// 헬퍼 함수들
function getCommonTopics(weeklyResults: WeeklyAIAnalysis[]): string[] {
  const topicCount = new Map<string, number>();
  
  weeklyResults.forEach(week => {
    week.analysis.main_topics.forEach(topic => {
      topicCount.set(topic, (topicCount.get(topic) || 0) + 1);
    });
  });

  return Array.from(topicCount.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([topic]) => topic);
}

function getMostCommonSentiment(weeklyResults: WeeklyAIAnalysis[]): string {
  const sentimentCount = { positive: 0, neutral: 0, negative: 0 };
  
  weeklyResults.forEach(week => {
    sentimentCount[week.analysis.sentiment]++;
  });

  return Object.entries(sentimentCount)
    .sort((a, b) => b[1] - a[1])[0][0];
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

interface WeeklyTwitterData {
  week_start: string;
  week_end: string;
  tweets: Array<{
    id: string;
    text: string;
    created_at: string;
    retweet_count: number;
    favorite_count: number;
    is_retweet: boolean;
    is_reply: boolean;
  }>;
  stats: {
    total_tweets: number;
    avg_engagement: number;
    original_tweets: number;
    retweets: number;
    replies: number;
  };
}

/**
 * 고도화된 Twitter 데이터 분석 API
 * 실제 Supabase twitter_timeline 데이터를 기반으로 주별 분석 제공
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { searchParams } = new URL(request.url);
    const weeks = parseInt(searchParams.get('weeks') || '8'); // 기본 8주
    const projectId = params.projectId;

    console.log(`📊 프로젝트 ${projectId}의 ${weeks}주간 트위터 데이터 분석 시작`);

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // 1. 해당 프로젝트의 Twitter 계정 정보 조회
    const { data: twitterAccount, error: accountError } = await supabase
      .from('twitter_accounts')
      .select('*')
      .eq('project_id', projectId)
      .single();

    if (accountError || !twitterAccount) {
      return NextResponse.json(
        { error: '연결된 Twitter 계정을 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    console.log(`🔍 Twitter 계정 발견: @${twitterAccount.screen_name}`);

    // 2. 지정된 주 수만큼의 트윗 데이터 조회
    const weeksAgo = new Date();
    weeksAgo.setDate(weeksAgo.getDate() - (weeks * 7));

    const { data: allTweets, error: tweetsError } = await supabase
      .from('twitter_timeline')
      .select('*')
      .eq('twitter_account_id', twitterAccount.id)
      .gte('created_at', weeksAgo.toISOString())
      .order('created_at', { ascending: false });

    if (tweetsError) {
      console.error('트윗 데이터 조회 실패:', tweetsError);
      return NextResponse.json(
        { error: '트윗 데이터를 가져올 수 없습니다.' },
        { status: 500 }
      );
    }

    const tweets = allTweets || [];
    console.log(`📝 ${tweets.length}개의 트윗 데이터 조회 완료`);

    // 3. 주별로 트윗 데이터 그룹화
    const weeklyData: WeeklyTwitterData[] = [];
    
    for (let weekIndex = 0; weekIndex < weeks; weekIndex++) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - ((weekIndex + 1) * 7));
      weekStart.setHours(0, 0, 0, 0);
      
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekEnd.getDate() + 6);
      weekEnd.setHours(23, 59, 59, 999);

      // 해당 주의 트윗들 필터링
      const weekTweets = tweets.filter(tweet => {
        const tweetDate = new Date(tweet.created_at);
        return tweetDate >= weekStart && tweetDate <= weekEnd;
      });

      // 통계 계산
      const totalTweets = weekTweets.length;
      const originalTweets = weekTweets.filter(t => !t.is_retweet && !t.is_reply).length;
      const retweets = weekTweets.filter(t => t.is_retweet).length;
      const replies = weekTweets.filter(t => t.is_reply).length;
      
      const totalEngagement = weekTweets.reduce((sum, tweet) => 
        sum + (tweet.retweet_count || 0) + (tweet.favorite_count || 0), 0);
      const avgEngagement = totalTweets > 0 ? Math.round(totalEngagement / totalTweets) : 0;

      weeklyData.push({
        week_start: weekStart.toISOString(),
        week_end: weekEnd.toISOString(),
        tweets: weekTweets.map(tweet => ({
          id: tweet.tweet_id,
          text: tweet.text || '',
          created_at: tweet.created_at,
          retweet_count: tweet.retweet_count || 0,
          favorite_count: tweet.favorite_count || 0,
          is_retweet: tweet.is_retweet || false,
          is_reply: tweet.is_reply || false
        })),
        stats: {
          total_tweets: totalTweets,
          avg_engagement: avgEngagement,
          original_tweets: originalTweets,
          retweets: retweets,
          replies: replies
        }
      });
    }

    // 4. 전체 통계 계산
    const totalStats = {
      total_tweets: tweets.length,
      total_weeks: weeks,
      avg_tweets_per_week: Math.round(tweets.length / weeks),
      account_info: {
        screen_name: twitterAccount.screen_name,
        name: twitterAccount.name,
        followers_count: twitterAccount.followers_count || 0,
        verified: twitterAccount.verified || false,
        activity_score: twitterAccount.activity_score || 0,
        last_updated: twitterAccount.last_updated
      }
    };

    console.log(`✅ ${weeks}주간 분석 완료: 총 ${tweets.length}개 트윗`);

    return NextResponse.json({
      success: true,
      project_id: projectId,
      analysis_period: {
        weeks: weeks,
        start_date: weeksAgo.toISOString(),
        end_date: new Date().toISOString()
      },
      account_info: totalStats.account_info,
      total_stats: totalStats,
      weekly_data: weeklyData.reverse(), // 오래된 주부터 표시
      generated_at: new Date().toISOString()
    });

  } catch (error) {
    console.error('💥 Twitter 분석 API 오류:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        success: false 
      },
      { status: 500 }
    );
  }
}

// 프로젝트별 트위터 데이터 조회 API
import { NextRequest, NextResponse } from 'next/server';
import { SchedulerHelpers } from '@/lib/twitterScheduler';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const projectId = params.id;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');

    console.log(`📊 프로젝트 ${projectId}의 트위터 데이터 조회 (최근 ${days}일)`);

    const data = await SchedulerHelpers.getProjectData(projectId, days);

    if (!data) {
      return NextResponse.json(
        { error: 'Project not found or no Twitter account linked' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      project_id: projectId,
      data_period_days: days,
      account: {
        screen_name: data.account_info.screen_name,
        name: data.account_info.name,
        followers_count: data.account_info.followers_count,
        verified: data.account_info.verified,
        activity_score: data.account_info.activity_score,
        last_updated: data.account_info.last_updated
      },
      tweets: {
        total_count: data.stats.total_tweets,
        avg_engagement: data.stats.avg_engagement,
        recent_tweets: data.recent_tweets.slice(0, 10).map(tweet => ({
          id: tweet.tweet_id,
          text: tweet.text.substring(0, 200),
          created_at: tweet.created_at,
          retweet_count: tweet.retweet_count,
          favorite_count: tweet.favorite_count,
          is_retweet: tweet.is_retweet
        }))
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error(`❌ 프로젝트 ${params.id} 트위터 데이터 조회 실패:`, error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        project_id: params.id
      },
      { status: 500 }
    );
  }
}

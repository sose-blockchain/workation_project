// 트위터 데이터 정기 수집 API
import { NextRequest, NextResponse } from 'next/server';
import { twitterScheduler, SchedulerHelpers } from '@/lib/twitterScheduler';

/**
 * 트위터 데이터 수집 실행
 * GET /api/twitter-scheduler - 현재 상태 조회
 * POST /api/twitter-scheduler - 수집 실행
 */

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    if (action === 'status') {
      // 현재 상태 조회
      const accountCount = await SchedulerHelpers.getAccountCount();
      
      // API 사용량 추정 (간단한 계산)
      const dailyUsage = accountCount * 2; // 계정당 2회 호출
      const currentDay = new Date().getDate();
      const totalUsage = dailyUsage * currentDay;
      const monthlyLimit = 1000; // RapidAPI Basic
      
      return NextResponse.json({
        status: 'ready',
        total_accounts: accountCount,
        last_run: 'N/A', // 향후 구현
        next_run: 'Manual trigger only',
        api_version: '1.0',
        api_usage: {
          total_calls: totalUsage,
          remaining_calls: Math.max(0, monthlyLimit - totalUsage),
          monthly_limit: monthlyLimit,
          daily_average: dailyUsage
        }
      });
    }

    // 기본 응답
    return NextResponse.json({
      message: 'Twitter Scheduler API',
      endpoints: {
        'GET /api/twitter-scheduler?action=status': '현재 상태 조회',
        'POST /api/twitter-scheduler': '데이터 수집 실행',
        'GET /api/twitter-scheduler/project/[id]': '프로젝트별 데이터 조회'
      }
    });

  } catch (error) {
    console.error('Twitter Scheduler GET 오류:', error);
    return NextResponse.json(
      { error: 'Failed to get scheduler status' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('🚀 트위터 데이터 수집 API 호출됨');
    
    // 수집 실행
    const result = await SchedulerHelpers.collectAll();
    
    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: result,
      message: `${result.total_accounts}개 계정 중 ${result.successful}개 성공, ${result.failed}개 실패`
    });

  } catch (error) {
    console.error('💥 트위터 데이터 수집 API 오류:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

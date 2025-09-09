// 자동 스케줄링용 Cron API 엔드포인트
import { NextRequest, NextResponse } from 'next/server';
import { twitterScheduler, SchedulerHelpers } from '@/lib/twitterScheduler';

/**
 * Vercel Cron Jobs에서 호출되는 자동 스케줄링 엔드포인트
 * 매일 오전 9시에 실행됨 (UTC 기준 0시 = 한국시간 9시)
 */

export async function GET(request: NextRequest) {
  try {
    console.log('🕘 자동 스케줄링 시작 - 오전 9시 정기 수집');
    
    // 현재 시간 로깅
    const now = new Date();
    const kstTime = new Date(now.getTime() + (9 * 60 * 60 * 1000)); // UTC+9
    console.log(`📅 실행 시간: ${kstTime.toLocaleString('ko-KR')}`);
    
    // 1. API 사용량 확인
    const apiUsage = await twitterScheduler.getCurrentAPIUsage();
    console.log(`📊 현재 API 사용량: ${apiUsage.total_calls}/${apiUsage.remaining_calls + apiUsage.total_calls}`);
    
    // 2. 일일 제한 확인 (30회/일)
    const dailyLimit = 30;
    if (apiUsage.total_calls >= (dailyLimit * now.getDate())) {
      console.log('⚠️ 일일 API 제한 도달, 수집 건너뛰기');
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'Daily API limit reached',
        timestamp: kstTime.toISOString(),
        api_usage: apiUsage
      });
    }
    
    // 3. 등록된 계정 수 확인
    const accountCount = await SchedulerHelpers.getAccountCount();
    if (accountCount === 0) {
      console.log('ℹ️ 등록된 계정이 없음');
      return NextResponse.json({
        success: true,
        skipped: true,
        reason: 'No accounts registered',
        timestamp: kstTime.toISOString()
      });
    }
    
    console.log(`🎯 수집 대상: ${accountCount}개 계정`);
    
    // 4. 데이터 수집 실행
    const result = await SchedulerHelpers.collectAll();
    
    // 5. 성공 로깅
    console.log(`✅ 자동 수집 완료: ${result.successful}/${result.total_accounts} 성공, ${result.failed}개 실패, ${result.skipped}개 건너뛰기`);
    
    // 6. 결과 반환
    return NextResponse.json({
      success: true,
      automated: true,
      execution_time: kstTime.toISOString(),
      summary: {
        total_accounts: result.total_accounts,
        successful: result.successful,
        failed: result.failed,
        skipped: result.skipped,
        api_calls_used: result.api_calls_used
      },
      api_usage: apiUsage,
      next_scheduled: '내일 오전 9시',
      message: `자동 수집 완료: ${result.successful}개 계정 성공, ${result.failed}개 실패, ${result.skipped}개 건너뛰기`
    });

  } catch (error) {
    console.error('💥 자동 스케줄링 오류:', error);
    
    // 오류 발생 시에도 적절한 응답 반환
    return NextResponse.json({
      success: false,
      automated: true,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
      message: '자동 수집 중 오류 발생'
    }, { status: 500 });
  }
}

// POST 메서드도 지원 (Vercel Cron에서 사용할 수 있음)
export async function POST(request: NextRequest) {
  return GET(request);
}

import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { twitterAPI } from '@/lib/twitter';
import { twitterService } from '@/lib/twitterService';

// 모든 트위터 계정 조회
export async function GET(request: NextRequest) {
  try {
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase client is not initialized' },
        { status: 500 }
      );
    }

    // 트위터 계정 조회
    const { data: accounts, error } = await supabase
      .from('twitter_accounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`트위터 계정 조회 실패: ${error.message}`);
    }

    // 각 계정의 상세 통계 계산
    const accountsWithStats = await Promise.all(
      (accounts || []).map(async (account) => {
        try {
          // 트윗 수 조회
          const { count: tweetCount } = await supabase!
            .from('twitter_timeline')
            .select('*', { count: 'exact', head: true })
            .eq('account_id', account.id);

          // 첫 번째와 마지막 트윗 날짜 조회
          const { data: firstTweet } = await supabase!
            .from('twitter_timeline')
            .select('created_at')
            .eq('account_id', account.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .single();

          const { data: lastTweet } = await supabase!
            .from('twitter_timeline')
            .select('created_at')
            .eq('account_id', account.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          return {
            ...account,
            stats: {
              total_tweets: tweetCount || 0,
              first_tweet_date: firstTweet?.created_at || null,
              last_tweet_date: lastTweet?.created_at || null,
              days_tracked: firstTweet ? 
                Math.ceil((new Date().getTime() - new Date(firstTweet.created_at).getTime()) / (1000 * 60 * 60 * 24)) : 0
            }
          };
        } catch (error) {
          console.error(`계정 ${account.screen_name} 통계 조회 실패:`, error);
          return {
            ...account,
            stats: {
              total_tweets: 0,
              first_tweet_date: null,
              last_tweet_date: null,
              days_tracked: 0
            }
          };
        }
      })
    );

    return NextResponse.json({
      success: true,
      accounts: accountsWithStats,
      total: accountsWithStats.length
    });

  } catch (error) {
    console.error('트위터 계정 조회 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 새 트위터 계정 추가
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { screen_name, project_id, project_name } = body;

    if (!screen_name) {
      return NextResponse.json(
        { error: 'screen_name이 필요합니다' },
        { status: 400 }
      );
    }

    // 트위터 URL에서 스크린 네임 추출
    const cleanScreenName = screen_name
      .replace(/^https?:\/\/(www\.)?twitter\.com\//, '')
      .replace(/^@/, '')
      .split('/')[0]
      .split('?')[0];

    console.log(`🔍 트위터 계정 추가 시작: ${cleanScreenName}`);

    // 1. 중복 체크
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data: existingAccount } = await supabase
      .from('twitter_accounts')
      .select('id, screen_name')
      .eq('screen_name', cleanScreenName)
      .single();

    if (existingAccount) {
      return NextResponse.json({
        success: false,
        error: `계정 @${cleanScreenName}은 이미 등록되어 있습니다`,
        existing_account: existingAccount
      }, { status: 409 });
    }

    // 2. 트위터 API로 계정 정보 확인
    let userInfo;
    try {
      userInfo = await twitterAPI.getUserInfo(cleanScreenName);
      if (!userInfo) {
        throw new Error('사용자 정보를 찾을 수 없습니다');
      }
      console.log(`✅ 트위터 계정 확인: ${userInfo.name} (@${userInfo.screen_name})`);
    } catch (error) {
      console.error(`❌ 트위터 계정 조회 실패: ${cleanScreenName}`, error);
      return NextResponse.json({
        success: false,
        error: `트위터 계정 @${cleanScreenName}을 찾을 수 없습니다. 계정명을 확인해주세요.`,
        details: error instanceof Error ? error.message : '알 수 없는 오류'
      }, { status: 404 });
    }

    // 3. DB에 계정 정보 저장
    const accountData = {
      screen_name: userInfo.screen_name || cleanScreenName,
      user_id: String(userInfo.id || Date.now()),
      name: userInfo.name || cleanScreenName,
      description: userInfo.description || '',
      followers_count: userInfo.followers_count || 0,
      following_count: userInfo.friends_count || 0,
      tweet_count: userInfo.statuses_count || 0,
      profile_image_url: userInfo.profile_image_url || '',
      verified: userInfo.verified || false,
      created_at_twitter: userInfo.created_at || new Date().toISOString(),
      project_id: project_id || null,
      activity_score: Math.min(100, Math.max(0, 
        ((userInfo.followers_count || 0) > 1000 ? 30 : (userInfo.followers_count || 0) / 1000 * 30) +
        ((userInfo.statuses_count || 0) > 1000 ? 40 : (userInfo.statuses_count || 0) / 1000 * 40) +
        (userInfo.verified ? 30 : 0)
      ))
    };

    const { data: newAccount, error: insertError } = await supabase
      .from('twitter_accounts')
      .insert([accountData])
      .select()
      .single();

    if (insertError) {
      throw new Error(`계정 저장 실패: ${insertError.message}`);
    }

    // 4. 초기 타임라인 수집
    console.log(`📊 초기 타임라인 수집 시작: ${cleanScreenName}`);
    let timelineResult = null;
    let timelineTweetCount = 0;
    
    try {
      timelineResult = await twitterService.createOrUpdateTwitterAccount(
        cleanScreenName
      );
      
      // 실제 수집된 트윗 수 확인
      if (newAccount?.id) {
        const { count } = await supabase
          .from('twitter_timeline')
          .select('*', { count: 'exact', head: true })
          .eq('account_id', newAccount.id);
        timelineTweetCount = count || 0;
      }
      
      console.log(`✅ 초기 타임라인 수집 완료: ${timelineTweetCount}개 트윗`);
    } catch (timelineError) {
      console.warn(`⚠️ 초기 타임라인 수집 실패 (계정은 등록됨):`, timelineError);
    }

    return NextResponse.json({
      success: true,
      message: `트위터 계정 @${cleanScreenName} 등록 완료`,
      account: newAccount,
      timeline_result: timelineResult,
      stats: {
        total_tweets: timelineTweetCount,
        first_tweet_date: timelineTweetCount > 0 ? new Date().toISOString() : null,
        last_tweet_date: timelineTweetCount > 0 ? new Date().toISOString() : null,
        days_tracked: 0
      }
    });

  } catch (error) {
    console.error('트위터 계정 추가 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}

// 트위터 계정 삭제
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = searchParams.get('id');

    if (!accountId) {
      return NextResponse.json(
        { error: '계정 ID가 필요합니다' },
        { status: 400 }
      );
    }

    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    // 1. 관련된 타임라인 데이터도 함께 삭제
    const { error: timelineError } = await supabase
      .from('twitter_timeline')
      .delete()
      .eq('account_id', accountId);

    if (timelineError) {
      console.warn('타임라인 데이터 삭제 중 오류:', timelineError);
    }

    // 2. 계정 삭제
    const { error: accountError } = await supabase
      .from('twitter_accounts')
      .delete()
      .eq('id', accountId);

    if (accountError) {
      throw new Error(`계정 삭제 실패: ${accountError.message}`);
    }

    return NextResponse.json({
      success: true,
      message: '트위터 계정이 삭제되었습니다'
    });

  } catch (error) {
    console.error('트위터 계정 삭제 오류:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다' },
      { status: 500 }
    );
  }
}
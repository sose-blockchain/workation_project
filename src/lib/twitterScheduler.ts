// 트위터 데이터 정기 수집 스케줄러
import { supabase } from './supabase';
import { twitterAPI } from './twitter';
import { twitterService } from './twitterService';

export interface ScheduledCollection {
  id: string;
  project_id: string;
  screen_name: string;
  last_collection: string;
  next_collection: string;
  collection_interval_hours: number;
  is_active: boolean;
  error_count: number;
  last_error?: string;
  priority: number; // 우선순위 (1=높음, 5=낮음)
  api_calls_used: number; // 월 사용량 추적
}

export interface APIUsageStats {
  month: string; // YYYY-MM
  total_calls: number;
  remaining_calls: number;
  daily_average: number;
  projected_monthly_usage: number;
  last_reset: string;
}

export interface CollectionResult {
  success: boolean;
  tweets_collected: number;
  new_tweets: number;
  updated_followers: number;
  error?: string;
  timestamp: string;
}

class TwitterScheduler {
  
  // API 사용량 추적
  private readonly MONTHLY_LIMIT = 1000; // RapidAPI Basic 플랜 제한
  private readonly DAILY_SAFETY_LIMIT = 30; // 일일 안전 제한 (월 1000회 / 30일)
  
  /**
   * 현재 월 API 사용량 확인
   */
  async getCurrentAPIUsage(): Promise<APIUsageStats> {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    
    // 실제로는 DB에서 사용량을 추적해야 하지만, 
    // 현재는 간단한 계산으로 추정
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    
    // 임시로 사용량 추정 (실제로는 DB에서 조회)
    const estimatedDailyUsage = await this.getEstimatedDailyUsage();
    const totalCalls = estimatedDailyUsage * dayOfMonth;
    const remainingCalls = Math.max(0, this.MONTHLY_LIMIT - totalCalls);
    const projectedUsage = estimatedDailyUsage * daysInMonth;
    
    return {
      month: currentMonth,
      total_calls: totalCalls,
      remaining_calls: remainingCalls,
      daily_average: estimatedDailyUsage,
      projected_monthly_usage: projectedUsage,
      last_reset: `${currentMonth}-01`
    };
  }

  /**
   * 일일 예상 사용량 계산
   */
  private async getEstimatedDailyUsage(): Promise<number> {
    // 활성 계정 수 조회
    const accountCount = await this.getActiveAccountCount();
    
    // 계정당 3회 API 호출 (사용자 정보 + 타임라인 + 제휴사)
    // 하지만 스마트 스케줄링으로 실제로는 더 적게 사용
    const callsPerAccount = 2; // 최적화된 호출 수 (제휴사 정보는 선택적)
    
    return accountCount * callsPerAccount;
  }

  /**
   * 활성 계정 수 조회
   */
  private async getActiveAccountCount(): Promise<number> {
    try {
      if (!supabase) return 0;
      
      const { count, error } = await supabase
        .from('twitter_accounts')
        .select('*', { count: 'exact', head: true });
      
      return error ? 0 : (count || 0);
    } catch {
      return 0;
    }
  }

  /**
   * 스마트 스케줄링: API 제한에 맞춰 우선순위가 높은 계정만 수집
   */
  async collectAllTwitterData(): Promise<{
    total_accounts: number;
    successful: number;
    failed: number;
    skipped: number;
    api_calls_used: number;
    remaining_calls: number;
    results: Array<{account: string, result: CollectionResult}>
  }> {
    try {
      console.log('🚀 스마트 트위터 데이터 수집 시작');
      
      // 1. 현재 API 사용량 확인
      const apiUsage = await this.getCurrentAPIUsage();
      console.log(`📊 API 사용량: ${apiUsage.total_calls}/${this.MONTHLY_LIMIT} (${apiUsage.remaining_calls}회 남음)`);
      
      // 2. 활성 트위터 계정 목록 조회 (우선순위 순으로 정렬)
      const activeAccounts = await this.getActiveTwitterAccountsWithPriority();
      
      if (activeAccounts.length === 0) {
        console.log('📭 수집할 활성 트위터 계정이 없습니다');
        return { 
          total_accounts: 0, 
          successful: 0, 
          failed: 0, 
          skipped: 0,
          api_calls_used: 0,
          remaining_calls: apiUsage.remaining_calls,
          results: [] 
        };
      }

      // 3. 오늘 사용 가능한 API 호출 수 계산
      const availableCalls = Math.min(apiUsage.remaining_calls, this.DAILY_SAFETY_LIMIT);
      const maxAccountsToday = Math.floor(availableCalls / 2); // 계정당 2회 호출
      
      console.log(`📊 총 ${activeAccounts.length}개 계정 중 ${maxAccountsToday}개 계정만 수집 (API 제한)`);
      
      const results: Array<{account: string, result: CollectionResult}> = [];
      let successful = 0;
      let failed = 0;
      let skipped = 0;
      let apiCallsUsed = 0;

      // 4. 우선순위가 높은 계정부터 제한된 수만큼 수집
      const accountsToProcess = activeAccounts.slice(0, maxAccountsToday);
      const accountsToSkip = activeAccounts.slice(maxAccountsToday);
      
      // 건너뛸 계정들 로그
      if (accountsToSkip.length > 0) {
        console.log(`⏭️ API 제한으로 ${accountsToSkip.length}개 계정 스킵: ${accountsToSkip.map(a => a.screen_name).join(', ')}`);
        skipped = accountsToSkip.length;
      }

      // 5. 선택된 계정들만 수집
      for (const account of accountsToProcess) {
        try {
          console.log(`\n🔍 ${account.screen_name} 계정 데이터 수집 시작...`);
          
          const result = await this.collectTwitterAccountData(account);
          results.push({ account: account.screen_name, result });
          
          // API 호출 수 추적
          apiCallsUsed += 2; // 사용자 정보 + 타임라인
          
          if (result.success) {
            successful++;
            console.log(`✅ ${account.screen_name}: ${result.new_tweets}개 새 트윗 수집 (API 사용: +2)`);
          } else {
            failed++;
            console.error(`❌ ${account.screen_name}: ${result.error}`);
          }

          // Rate Limit 방지를 위한 지연 (계정간 1초 대기)
          await new Promise(resolve => setTimeout(resolve, 1000));
          
        } catch (error) {
          failed++;
          apiCallsUsed += 1; // 실패해도 최소 1회는 호출했을 가능성
          const errorResult: CollectionResult = {
            success: false,
            tweets_collected: 0,
            new_tweets: 0,
            updated_followers: 0,
            error: error instanceof Error ? error.message : String(error),
            timestamp: new Date().toISOString()
          };
          results.push({ account: account.screen_name, result: errorResult });
          console.error(`💥 ${account.screen_name} 수집 중 예외 발생:`, error);
        }
      }

      const finalUsage = await this.getCurrentAPIUsage();
      const summary = {
        total_accounts: activeAccounts.length,
        successful,
        failed,
        skipped,
        api_calls_used: apiCallsUsed,
        remaining_calls: finalUsage.remaining_calls,
        results
      };

      console.log('\n📋 스마트 트위터 데이터 수집 완료:', {
        total: summary.total_accounts,
        processed: accountsToProcess.length,
        success: successful,
        failed: failed,
        skipped: skipped,
        api_calls_used: apiCallsUsed,
        remaining_calls: finalUsage.remaining_calls,
        new_tweets_total: results.reduce((sum, r) => sum + r.result.new_tweets, 0)
      });

      // 수집 통계를 DB에 저장
      await this.logCollectionSummary(summary);

      return summary;

    } catch (error) {
      console.error('💥 전체 트위터 데이터 수집 중 오류:', error);
      throw error;
    }
  }

  /**
   * 특정 트위터 계정의 데이터 수집
   */
  async collectTwitterAccountData(account: {
    id: string;
    project_id: string;
    screen_name: string;
    last_updated: string;
  }): Promise<CollectionResult> {
    const startTime = new Date().toISOString();
    
    try {
      // 1. 사용자 정보 업데이트 (팔로워 수 등)
      const userInfo = await twitterAPI.getUserInfo(account.screen_name);
      if (!userInfo) {
        return {
          success: false,
          tweets_collected: 0,
          new_tweets: 0,
          updated_followers: 0,
          error: '사용자 정보를 가져올 수 없습니다',
          timestamp: startTime
        };
      }

      // 2. 최근 타임라인 가져오기
      const timeline = await twitterAPI.getUserTimeline(account.screen_name, 50);
      
      // 3. 새로운 트윗만 필터링 (이미 DB에 있는 트윗 제외)
      const newTweets = await this.filterNewTweets(account.id, timeline);
      
      // 4. 새 트윗을 DB에 저장
      let savedTweets = 0;
      if (newTweets.length > 0) {
        savedTweets = await this.saveNewTweets(account.id, newTweets);
      }

      // 5. 계정 정보 업데이트 (팔로워 수, 활동도 점수 등)
      await this.updateAccountStats(account.id, userInfo, timeline);

      // 6. 수집 통계 업데이트
      await this.updateCollectionStats(account.id, true);

      return {
        success: true,
        tweets_collected: timeline.length,
        new_tweets: savedTweets,
        updated_followers: userInfo.followers_count,
        timestamp: startTime
      };

    } catch (error) {
      // 실패 시 통계 업데이트
      await this.updateCollectionStats(account.id, false, error instanceof Error ? error.message : String(error));
      
      return {
        success: false,
        tweets_collected: 0,
        new_tweets: 0,
        updated_followers: 0,
        error: error instanceof Error ? error.message : String(error),
        timestamp: startTime
      };
    }
  }

  /**
   * 우선순위 기반 활성 트위터 계정 목록 조회
   */
  private async getActiveTwitterAccountsWithPriority(): Promise<Array<{
    id: string;
    project_id: string;
    screen_name: string;
    last_updated: string;
    followers_count: number;
    activity_score: number;
    priority: number;
  }>> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    const { data, error } = await supabase
      .from('twitter_accounts')
      .select('id, project_id, screen_name, last_updated, followers_count, activity_score')
      .order('last_updated', { ascending: true }); // 오래된 것부터 우선

    if (error) {
      throw new Error(`활성 트위터 계정 조회 실패: ${error.message}`);
    }

    if (!data) return [];

    // 우선순위 계산 및 정렬
    const accountsWithPriority = data.map(account => ({
      ...account,
      priority: this.calculateAccountPriority(account)
    }));

    // 우선순위 순으로 정렬 (1=높음, 5=낮음)
    accountsWithPriority.sort((a, b) => a.priority - b.priority);

    console.log(`📊 계정 우선순위 분석:`, accountsWithPriority.map(a => 
      `${a.screen_name}(우선순위: ${a.priority}, 팔로워: ${a.followers_count}, 점수: ${a.activity_score})`
    ));

    return accountsWithPriority;
  }

  /**
   * 계정 우선순위 계산 (1=높음, 5=낮음)
   */
  private calculateAccountPriority(account: {
    followers_count: number;
    activity_score: number;
    last_updated: string;
  }): number {
    let priority = 3; // 기본 우선순위
    
    // 팔로워 수 기반 조정
    if (account.followers_count > 100000) priority -= 1; // 인플루언서급
    else if (account.followers_count > 10000) priority -= 0.5; // 중간급
    else if (account.followers_count < 1000) priority += 0.5; // 소규모
    
    // 활동도 점수 기반 조정
    if (account.activity_score > 80) priority -= 1; // 매우 활발
    else if (account.activity_score > 60) priority -= 0.5; // 활발
    else if (account.activity_score < 30) priority += 1; // 비활성
    
    // 마지막 업데이트 시간 기반 조정
    const daysSinceUpdate = (Date.now() - new Date(account.last_updated).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceUpdate > 7) priority -= 1; // 오래된 데이터 우선 업데이트
    else if (daysSinceUpdate < 1) priority += 1; // 최근 업데이트는 나중에
    
    // 1-5 범위로 제한
    return Math.max(1, Math.min(5, Math.round(priority)));
  }

  /**
   * 기존 활성 트위터 계정 목록 조회 (하위 호환성)
   */
  private async getActiveTwitterAccounts(): Promise<Array<{
    id: string;
    project_id: string;
    screen_name: string;
    last_updated: string;
  }>> {
    const accounts = await this.getActiveTwitterAccountsWithPriority();
    return accounts.map(({ priority, followers_count, activity_score, ...account }) => account);
  }

  /**
   * 새로운 트윗만 필터링 (중복 제거)
   */
  private async filterNewTweets(accountId: string, tweets: any[]): Promise<any[]> {
    if (!supabase || tweets.length === 0) {
      return tweets;
    }

    try {
      // 기존 트윗 ID 목록 조회
      const tweetIds = tweets.map(t => t.id);
      const { data: existingTweets, error } = await supabase
        .from('twitter_timeline')
        .select('tweet_id')
        .eq('twitter_account_id', accountId)
        .in('tweet_id', tweetIds);

      if (error) {
        console.warn('기존 트윗 조회 실패, 모든 트윗을 새로운 것으로 처리:', error);
        return tweets;
      }

      const existingIds = new Set(existingTweets?.map(t => t.tweet_id) || []);
      const newTweets = tweets.filter(tweet => !existingIds.has(tweet.id));
      
      console.log(`📊 트윗 필터링: 전체 ${tweets.length}개 → 새로운 트윗 ${newTweets.length}개`);
      return newTweets;

    } catch (error) {
      console.warn('트윗 필터링 중 오류, 모든 트윗을 새로운 것으로 처리:', error);
      return tweets;
    }
  }

  /**
   * 새 트윗을 DB에 저장
   */
  private async saveNewTweets(accountId: string, tweets: any[]): Promise<number> {
    if (!supabase || tweets.length === 0) {
      return 0;
    }

    try {
      const timelineData = tweets.map(tweet => ({
        twitter_account_id: accountId,
        tweet_id: tweet.id,
        text: tweet.text || '',
        created_at: tweet.created_at,
        retweet_count: tweet.retweet_count || 0,
        favorite_count: tweet.favorite_count || 0,
        reply_count: 0, // API에서 제공되지 않을 수 있음
        is_retweet: tweet.is_retweet || false,
        is_reply: tweet.text?.startsWith('@') || false,
        language: 'ko' // 기본값
      }));

      const { data, error } = await supabase
        .from('twitter_timeline')
        .insert(timelineData)
        .select();

      if (error) {
        throw new Error(`트윗 저장 실패: ${error.message}`);
      }

      console.log(`💾 새 트윗 ${data?.length || 0}개 저장 완료`);
      return data?.length || 0;

    } catch (error) {
      console.error('트윗 저장 중 오류:', error);
      return 0;
    }
  }

  /**
   * 계정 통계 업데이트 (팔로워 수, 활동도 점수 등)
   */
  private async updateAccountStats(accountId: string, userInfo: any, timeline: any[]): Promise<void> {
    if (!supabase) return;

    try {
      // 활동도 점수 계산
      const activityScore = this.calculateActivityScore(userInfo, timeline);

      const { error } = await supabase
        .from('twitter_accounts')
        .update({
          followers_count: userInfo.followers_count || 0,
          friends_count: userInfo.friends_count || 0,
          statuses_count: userInfo.statuses_count || 0,
          favourites_count: userInfo.favourites_count || 0,
          verified: userInfo.verified || false,
          activity_score: activityScore,
          last_updated: new Date().toISOString()
        })
        .eq('id', accountId);

      if (error) {
        console.error('계정 통계 업데이트 실패:', error);
      }

    } catch (error) {
      console.error('계정 통계 업데이트 중 오류:', error);
    }
  }

  /**
   * 활동도 점수 계산
   */
  private calculateActivityScore(userInfo: any, timeline: any[]): number {
    // 기본 지표들
    const followerScore = Math.min(userInfo.followers_count / 10000, 1) * 30; // 최대 30점
    const verifiedBonus = userInfo.verified ? 10 : 0; // 인증 배지 10점
    const recentActivityScore = timeline.length > 0 ? Math.min(timeline.length / 10, 1) * 20 : 0; // 최대 20점
    
    // 참여도 점수
    const avgEngagement = timeline.length > 0 
      ? timeline.reduce((sum, tweet) => sum + (tweet.retweet_count || 0) + (tweet.favorite_count || 0), 0) / timeline.length
      : 0;
    const engagementScore = Math.min(avgEngagement / 100, 1) * 30; // 최대 30점
    
    // 프로필 완성도
    const profileScore = [
      userInfo.description?.length > 0,
      userInfo.location,
      userInfo.url,
      userInfo.profile_banner_url
    ].filter(Boolean).length * 2.5; // 최대 10점

    return Math.round(followerScore + verifiedBonus + recentActivityScore + engagementScore + profileScore);
  }

  /**
   * 수집 통계 업데이트
   */
  private async updateCollectionStats(accountId: string, success: boolean, error?: string): Promise<void> {
    // 향후 수집 통계 테이블이 생기면 여기에 구현
    console.log(`📊 수집 통계: 계정 ${accountId}, 성공: ${success}${error ? `, 오류: ${error}` : ''}`);
  }

  /**
   * 수집 요약 로그 저장
   */
  private async logCollectionSummary(summary: any): Promise<void> {
    // 향후 수집 로그 테이블이 생기면 여기에 구현
    console.log('📋 수집 요약 저장:', summary);
  }

  /**
   * 특정 프로젝트의 최근 수집 결과 조회
   */
  async getProjectTwitterData(projectId: string, days: number = 30): Promise<{
    account_info: any;
    recent_tweets: any[];
    stats: {
      total_tweets: number;
      avg_engagement: number;
      growth_rate: number;
    }
  } | null> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      // 1. 계정 정보 조회
      const { data: account, error: accountError } = await supabase
        .from('twitter_accounts')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (accountError || !account) {
        return null;
      }

      // 2. 최근 트윗 조회
      const { data: tweets, error: tweetsError } = await supabase
        .from('twitter_timeline')
        .select('*')
        .eq('twitter_account_id', account.id)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .order('created_at', { ascending: false });

      if (tweetsError) {
        console.error('최근 트윗 조회 실패:', tweetsError);
        return { account_info: account, recent_tweets: [], stats: { total_tweets: 0, avg_engagement: 0, growth_rate: 0 } };
      }

      // 3. 통계 계산
      const totalTweets = tweets?.length || 0;
      const avgEngagement = totalTweets > 0 
        ? tweets.reduce((sum, tweet) => sum + (tweet.retweet_count || 0) + (tweet.favorite_count || 0), 0) / totalTweets
        : 0;

      return {
        account_info: account,
        recent_tweets: tweets || [],
        stats: {
          total_tweets: totalTweets,
          avg_engagement: Math.round(avgEngagement),
          growth_rate: 0 // 향후 구현
        }
      };

    } catch (error) {
      console.error('프로젝트 트위터 데이터 조회 실패:', error);
      throw error;
    }
  }
}

// 싱글톤 인스턴스
export const twitterScheduler = new TwitterScheduler();

// Next.js API 라우트에서 사용할 수 있는 헬퍼 함수들
export const SchedulerHelpers = {
  /**
   * 모든 계정 데이터 수집 (API 라우트용)
   */
  async collectAll() {
    return twitterScheduler.collectAllTwitterData();
  },

  /**
   * 특정 프로젝트 데이터 조회 (컴포넌트용)
   */
  async getProjectData(projectId: string, days: number = 30) {
    return twitterScheduler.getProjectTwitterData(projectId, days);
  },

  /**
   * 수집 가능한 계정 수 확인
   */
  async getAccountCount() {
    try {
      if (!supabase) return 0;
      
      const { count, error } = await supabase
        .from('twitter_accounts')
        .select('*', { count: 'exact', head: true });
      
      return error ? 0 : (count || 0);
    } catch {
      return 0;
    }
  }
};

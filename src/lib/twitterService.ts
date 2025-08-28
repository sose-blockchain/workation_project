// 트위터 데이터 CRUD 서비스
import { supabase } from './supabase';
import { twitterAPI, TwitterUserInfo, TwitterTimelineItem, calculateTwitterActivityScore } from './twitter';
import { 
  TwitterAccount, 
  TwitterTimeline, 
  CreateTwitterAccountRequest, 
  UpdateTwitterAccountRequest,
  TwitterSearchResult,
  TwitterProjectOverview
} from '@/types/twitter';

export class TwitterService {
  
  /**
   * 프로젝트의 트위터 계정 정보 조회
   */
  async getTwitterAccountByProjectId(projectId: string): Promise<TwitterAccount | null> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('twitter_accounts')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // No rows found
          return null;
        }
        throw error;
      }

      return data as TwitterAccount;
    } catch (error) {
      console.error('트위터 계정 조회 오류:', error);
      return null;
    }
  }

  /**
   * 트위터 핸들로 계정 정보 조회
   */
  async getTwitterAccountByScreenName(screenName: string): Promise<TwitterAccount | null> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('twitter_accounts')
        .select('*')
        .eq('screen_name', screenName.toLowerCase())
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as TwitterAccount;
    } catch (error) {
      console.error('트위터 계정 조회 오류 (핸들):', error);
      return null;
    }
  }

  /**
   * 트위터 계정의 타임라인 조회
   */
  async getTwitterTimeline(twitterAccountId: string, limit: number = 10): Promise<TwitterTimeline[]> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('twitter_timeline')
        .select('*')
        .eq('twitter_account_id', twitterAccountId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;

      return data as TwitterTimeline[];
    } catch (error) {
      console.error('트위터 타임라인 조회 오류:', error);
      return [];
    }
  }

  /**
   * 새로운 트위터 계정 정보 생성 또는 업데이트
   */
  async createOrUpdateTwitterAccount(request: CreateTwitterAccountRequest): Promise<TwitterSearchResult> {
    try {
      // Twitter API에서 데이터 가져오기
      const [userInfo, timeline] = await Promise.all([
        twitterAPI.getUserInfo(request.screen_name),
        request.fetch_timeline ? twitterAPI.getUserTimeline(request.screen_name, 20) : Promise.resolve([])
      ]);

      if (!userInfo) {
        return {
          account: null,
          timeline: [],
          error: `'@${request.screen_name}' 사용자를 찾을 수 없습니다.`,
          found: false
        };
      }

      // 활동도 점수 계산
      const activityScore = calculateTwitterActivityScore(userInfo, timeline);

      // 기존 계정 확인
      const existingAccount = await this.getTwitterAccountByProjectId(request.project_id);

      const accountData = {
        project_id: request.project_id,
        twitter_id: userInfo.id,
        screen_name: userInfo.screen_name.toLowerCase(),
        name: userInfo.name,
        description: userInfo.description || null,
        profile_image_url: userInfo.profile_image_url,
        profile_banner_url: userInfo.profile_banner_url || null,
        followers_count: userInfo.followers_count,
        friends_count: userInfo.friends_count,
        statuses_count: userInfo.statuses_count,
        favourites_count: userInfo.favourites_count,
        verified: userInfo.verified,
        location: userInfo.location || null,
        url: userInfo.url || null,
        created_at: userInfo.created_at,
        last_updated: new Date().toISOString(),
        data_source: 'twitter_api',
        activity_score: activityScore
      };

      let savedAccount: TwitterAccount;

      if (existingAccount) {
        // 기존 계정 업데이트
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
        const { data, error } = await supabase
          .from('twitter_accounts')
          .update(accountData)
          .eq('id', existingAccount.id)
          .select()
          .single();

        if (error) throw error;
        savedAccount = data as TwitterAccount;
      } else {
        // 새 계정 생성
        if (!supabase) {
          throw new Error('Supabase client is not initialized');
        }
        const { data, error } = await supabase
          .from('twitter_accounts')
          .insert(accountData)
          .select()
          .single();

        if (error) throw error;
        savedAccount = data as TwitterAccount;
      }

      // 타임라인 저장 (요청된 경우)
      let savedTimeline: TwitterTimeline[] = [];
      if (request.fetch_timeline && timeline.length > 0) {
        savedTimeline = await this.saveTwitterTimeline(savedAccount.id, timeline);
      }

      console.log(`✅ 트위터 계정 저장 완료: @${userInfo.screen_name} (활동도: ${activityScore}/100)`);

      return {
        account: savedAccount,
        timeline: savedTimeline,
        found: true
      };

    } catch (error) {
      console.error('트위터 계정 생성/업데이트 오류:', error);
      return {
        account: null,
        timeline: [],
        error: '트위터 데이터를 저장하는데 실패했습니다.',
        found: false
      };
    }
  }

  /**
   * 트위터 타임라인 저장
   */
  async saveTwitterTimeline(twitterAccountId: string, timeline: TwitterTimelineItem[]): Promise<TwitterTimeline[]> {
    try {
      if (!supabase) {
        throw new Error('Supabase client is not initialized');
      }

      // 기존 타임라인 삭제 (최신 데이터로 교체)
      await supabase
        .from('twitter_timeline')
        .delete()
        .eq('twitter_account_id', twitterAccountId);

      // 새 타임라인 데이터 준비
      const timelineData = timeline.map(tweet => ({
        twitter_account_id: twitterAccountId,
        tweet_id: tweet.id,
        text: tweet.text,
        created_at: tweet.created_at,
        retweet_count: tweet.retweet_count,
        favorite_count: tweet.favorite_count,
        reply_count: 0, // API에서 제공되지 않을 수 있음
        is_retweet: tweet.text.startsWith('RT @'),
        is_reply: tweet.text.startsWith('@'),
        language: 'ko' // 기본값, 추후 감지 로직 추가 가능
      }));

      // 타임라인 저장
      const { data, error } = await supabase
        .from('twitter_timeline')
        .insert(timelineData)
        .select();

      if (error) throw error;

      console.log(`✅ 트위터 타임라인 저장 완료: ${timeline.length}개 트윗`);
      return data as TwitterTimeline[];

    } catch (error) {
      console.error('트위터 타임라인 저장 오류:', error);
      return [];
    }
  }

  /**
   * 트위터 계정 정보 수동 업데이트
   */
  async updateTwitterAccount(id: string, updates: UpdateTwitterAccountRequest): Promise<TwitterAccount | null> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('twitter_accounts')
        .update({
          ...updates,
          last_updated: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      console.log(`✅ 트위터 계정 업데이트 완료: ${id}`);
      return data as TwitterAccount;

    } catch (error) {
      console.error('트위터 계정 업데이트 오류:', error);
      return null;
    }
  }

  /**
   * 트위터 계정 삭제
   */
  async deleteTwitterAccount(id: string): Promise<boolean> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return false;
    }

    try {
      const { error } = await supabase
        .from('twitter_accounts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      console.log(`✅ 트위터 계정 삭제 완료: ${id}`);
      return true;

    } catch (error) {
      console.error('트위터 계정 삭제 오류:', error);
      return false;
    }
  }

  /**
   * 프로젝트별 트위터 개요 조회
   */
  async getTwitterProjectOverview(): Promise<TwitterProjectOverview[]> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('twitter_project_overview')
        .select('*');

      if (error) throw error;

      return data as TwitterProjectOverview[];

    } catch (error) {
      console.error('트위터 프로젝트 개요 조회 오류:', error);
      return [];
    }
  }

  /**
   * 모든 트위터 계정의 데이터 새로고침
   */
  async refreshAllTwitterAccounts(): Promise<{success: number, failed: number}> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return { success: 0, failed: 0 };
    }

    try {
      const { data: accounts, error } = await supabase
        .from('twitter_accounts')
        .select('id, project_id, screen_name');

      if (error) throw error;

      let success = 0;
      let failed = 0;

      for (const account of accounts) {
        try {
          await this.createOrUpdateTwitterAccount({
            project_id: account.project_id,
            screen_name: account.screen_name,
            fetch_timeline: true
          });
          success++;
        } catch (err) {
          console.error(`트위터 계정 새로고침 실패 (${account.screen_name}):`, err);
          failed++;
        }
      }

      console.log(`✅ 트위터 데이터 새로고침 완료: 성공 ${success}개, 실패 ${failed}개`);
      return { success, failed };

    } catch (error) {
      console.error('전체 트위터 계정 새로고침 오류:', error);
      return { success: 0, failed: 0 };
    }
  }

  /**
   * 트위터 URL에서 핸들 추출
   */
  static extractTwitterHandle(url: string): string | null {
    const patterns = [
      /(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)/,
      /@([a-zA-Z0-9_]+)/,
      /^([a-zA-Z0-9_]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1].toLowerCase().trim();
      }
    }

    return null;
  }

  /**
   * 트위터 계정 존재 여부 확인
   */
  async checkTwitterAccountExists(projectId: string): Promise<boolean> {
    try {
      const account = await this.getTwitterAccountByProjectId(projectId);
      return account !== null;
    } catch (error) {
      console.error('트위터 계정 존재 확인 오류:', error);
      return false;
    }
  }
}

// 싱글톤 인스턴스
export const twitterService = new TwitterService();

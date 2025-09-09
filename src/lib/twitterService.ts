// 트위터 데이터 CRUD 서비스
import { supabase } from './supabase';
import { twitterAPI, TwitterUserInfo, TwitterTimelineItem, calculateTwitterActivityScore } from './twitter';
import { 
  TwitterAccount, 
  TwitterTimeline, 
  CreateTwitterAccountRequest, 
  UpdateTwitterAccountRequest,
  TwitterSearchResult,
  TwitterProjectOverview,
  TwitterTeamMember,
  TwitterTeamMembersResult,
  TwitterTeamOverview,
  TwitterTeamMemberDetail
} from '@/types/twitter';
import { AppErrorHandler, SupabaseError } from '@/types/error';

export class TwitterService {
  
  /**
   * Supabase 오류 처리 헬퍼 함수
   */
  private handleSupabaseError(error: any, context: string): SupabaseError {
    const supabaseError = AppErrorHandler.createSupabaseError(error, context);
    AppErrorHandler.logError(supabaseError);
    return supabaseError;
  }

  /**
   * 프로젝트의 트위터 계정 정보 조회
   */
  async getTwitterAccountByProjectId(projectId: string): Promise<TwitterAccount | null> {
    if (!supabase) {
      console.error('❌ Supabase 클라이언트가 초기화되지 않음');
      return null;
    }

    try {
      console.log(`🔍 Twitter 계정 조회 시작: project_id=${projectId}`);
      
      // 먼저 마침표 없이 조회 시도 (존재 여부 확인)
      const { data: accounts, error: listError } = await supabase
        .from('twitter_accounts')
        .select('*')
        .eq('project_id', projectId);

      if (listError) {
        this.handleSupabaseError(listError, `Twitter 계정 조회 (project_id: ${projectId})`);
        return null;
      }

      if (!accounts || accounts.length === 0) {
        console.log(`📭 Twitter 계정 없음: project_id=${projectId}`);
        return null;
      }

      if (accounts.length > 1) {
        console.warn(`⚠️ 여러 Twitter 계정 발견: project_id=${projectId}, count=${accounts.length}`);
      }

      const account = accounts[0];
      console.log(`✅ Twitter 계정 발견: @${account.screen_name} (${account.followers_count} 팔로워)`);
      return account as TwitterAccount;
      
    } catch (error: any) {
      console.error('❌ Twitter 계정 조회 실패:', {
        error: error.message || error,
        project_id: projectId,
        timestamp: new Date().toISOString()
      });
      return null;
    }
  }

  /**
   * 트위터 핸들로 계정 정보 조회
   */
  async getTwitterAccountByScreenName(screenName: string): Promise<TwitterAccount | null> {
    if (!supabase) {
      console.error('❌ Supabase 클라이언트가 초기화되지 않음');
      return null;
    }

    try {
      console.log(`🔍 Twitter 계정 조회 (핸들): @${screenName}`);
      
      const { data: accounts, error } = await supabase
        .from('twitter_accounts')
        .select('*')
        .eq('screen_name', screenName.toLowerCase());

      if (error) {
        this.handleSupabaseError(error, `Twitter 계정 조회 (핸들: @${screenName})`);
        return null;
      }

      if (!accounts || accounts.length === 0) {
        console.log(`📭 Twitter 계정 없음 (핸들): @${screenName}`);
        return null;
      }

      const account = accounts[0];
      console.log(`✅ Twitter 계정 발견 (핸들): @${account.screen_name}`);
      return account as TwitterAccount;
      
    } catch (error: any) {
      console.error('❌ Twitter 계정 조회 실패 (핸들):', {
        error: error.message || error,
        screen_name: screenName
      });
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
      // Twitter API에서 데이터 가져오기 (원본 케이스 유지)
      const originalScreenName = request.screen_name;
      console.log(`🔍 트위터 API 호출 시작: @${originalScreenName} (원본 케이스 유지)`);
      
      const [userInfo, timeline] = await Promise.all([
        twitterAPI.getUserInfo(originalScreenName),
        request.fetch_timeline ? twitterAPI.getUserTimeline(originalScreenName, 20) : Promise.resolve([])
      ]);

      if (!userInfo) {
        const error = AppErrorHandler.createError('twitter_user_not_found', `@${request.screen_name} 사용자 조회`);
        return {
          account: null,
          timeline: [],
          error: error.message,
          errorCode: error.code,
          userMessage: AppErrorHandler.getUserMessage(error),
          found: false
        };
      }

      // 활동도 점수 계산
      const activityScore = calculateTwitterActivityScore(userInfo, timeline);

      // 기존 계정 확인
      const existingAccount = await this.getTwitterAccountByProjectId(request.project_id);

      // 필수 필드 검증
      if (!userInfo.id || !userInfo.screen_name || !userInfo.name) {
        console.error('❌ 필수 Twitter 데이터가 누락됨:', {
          id: userInfo.id,
          screen_name: userInfo.screen_name,
          name: userInfo.name
        });
        const error = AppErrorHandler.createError('invalid_input', '트위터 계정 데이터 검증', `ID: ${userInfo.id || 'null'}`);
        return {
          account: null,
          timeline: [],
          error: error.message,
          errorCode: error.code,
          userMessage: AppErrorHandler.getUserMessage(error),
          found: false
        };
      }

      const accountData = {
        project_id: request.project_id,
        twitter_id: userInfo.id,
        screen_name: (userInfo.screen_name || '').toLowerCase(),
        name: userInfo.name,
        description: userInfo.description || null,
        profile_image_url: userInfo.profile_image_url || null,
        profile_banner_url: userInfo.profile_banner_url || null,
        followers_count: userInfo.followers_count || 0,
        friends_count: userInfo.friends_count || 0,
        statuses_count: userInfo.statuses_count || 0,
        favourites_count: userInfo.favourites_count || 0,
        verified: userInfo.verified || false,
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

    } catch (error: any) {
      const appError = AppErrorHandler.createError('unknown_error', '트위터 계정 생성/업데이트', error.message);
      AppErrorHandler.logError(appError);
      return {
        account: null,
        timeline: [],
        error: appError.message,
        errorCode: appError.code,
        userMessage: AppErrorHandler.getUserMessage(appError),
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
   * 트위터 URL에서 핸들 추출 (대소문자 보존)
   */
  static extractTwitterHandle(url: string): string | null {
    if (!url || typeof url !== 'string') {
      return null;
    }

    console.log(`🔍 트위터 핸들 추출 시도: "${url}"`);

    const patterns = [
      // 완전한 Twitter/X URL
      /(?:https?:\/\/)?(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]+)(?:\/.*)?$/,
      // @ 포함 핸들
      /@([a-zA-Z0-9_]+)/,
      // 순수 핸들명
      /^([a-zA-Z0-9_]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        // 대소문자 보존 (API 호출용)
        const originalHandle = match[1].trim();
        console.log(`✅ 추출된 핸들: ${originalHandle} (대소문자 보존)`);
        return originalHandle;
      }
    }

    console.log(`❌ 유효한 트위터 핸들을 추출할 수 없음: "${url}"`);
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

  /**
   * 프로젝트의 팀원 정보 수집 및 저장
   */
  async collectAndSaveTeamMembers(projectId: string, twitterAccountId: string, screenName: string): Promise<TwitterTeamMembersResult> {
    try {
      console.log(`🔍 팀원 정보 수집 시작: project_id=${projectId}, @${screenName}`);
      
      // 1. Twitter API에서 팀원 정보 수집
      const teamData = await twitterAPI.getTeamMembers(screenName);
      
      if (teamData.combined.length === 0) {
        console.log(`📭 팀원 정보 없음: @${screenName}`);
        return {
          following: [],
          affiliates: [],
          combined: [],
          saved_members: [],
          success: true
        };
      }

      // 2. 수집된 팀원 정보를 데이터베이스에 저장
      const savedMembers = await this.saveTeamMembers(projectId, twitterAccountId, teamData);
      
      console.log(`✅ 팀원 정보 수집 완료: ${savedMembers.length}명 저장`);

      return {
        following: teamData.following,
        affiliates: teamData.affiliates,
        combined: teamData.combined,
        saved_members: savedMembers,
        success: true
      };

    } catch (error: any) {
      console.error('❌ 팀원 정보 수집 오류:', error);
      return {
        following: [],
        affiliates: [],
        combined: [],
        saved_members: [],
        error: error.message,
        success: false
      };
    }
  }

  /**
   * 팀원 정보를 데이터베이스에 저장
   */
  private async saveTeamMembers(
    projectId: string, 
    twitterAccountId: string, 
    teamData: { following: TwitterUserInfo[]; affiliates: TwitterUserInfo[]; combined: TwitterUserInfo[] }
  ): Promise<TwitterTeamMember[]> {
    if (!supabase) {
      throw new Error('Supabase client is not initialized');
    }

    try {
      // 기존 팀원 정보 삭제 (최신 데이터로 교체)
      await supabase
        .from('twitter_team_members')
        .delete()
        .eq('project_id', projectId);

      const savedMembers: TwitterTeamMember[] = [];

      // 제휴사 목록만 저장 (팔로잉은 사용하지 않음)
      for (const user of teamData.affiliates) {
        const memberData = {
          project_id: projectId,
          twitter_account_id: twitterAccountId,
          twitter_id: user.id,
          screen_name: user.screen_name,
          name: user.name,
          description: user.description || null,
          profile_image_url: user.profile_image_url || null,
          followers_count: user.followers_count,
          friends_count: user.friends_count,
          statuses_count: user.statuses_count,
          favourites_count: user.favourites_count,
          verified: user.verified,
          location: user.location || null,
          url: user.url || null,
          created_at: user.created_at,
          relationship_type: 'affiliate' as const,
          is_team_member: this.isLikelyTeamMember(user),
          confidence_score: this.calculateTeamMemberConfidence(user, 'affiliate'),
          last_updated: new Date().toISOString(),
          data_source: 'twitter_api'
        };

        const { data, error } = await supabase
          .from('twitter_team_members')
          .insert(memberData)
          .select()
          .single();

        if (error) {
          console.error(`제휴사 저장 오류 (${user.screen_name}):`, error);
          continue;
        }

        savedMembers.push(data as TwitterTeamMember);
      }

      return savedMembers;

    } catch (error) {
      console.error('팀원 정보 저장 오류:', error);
      throw error;
    }
  }

  /**
   * 사용자가 팀원일 가능성 판단
   */
  private isLikelyTeamMember(user: TwitterUserInfo): boolean {
    // 간단한 휴리스틱으로 팀원 가능성 판단
    const indicators = [
      user.verified, // 인증된 계정
      user.followers_count > 1000, // 팔로워가 많은 계정
      user.description?.toLowerCase().includes('founder') || 
      user.description?.toLowerCase().includes('ceo') ||
      user.description?.toLowerCase().includes('cto') ||
      user.description?.toLowerCase().includes('developer') ||
      user.description?.toLowerCase().includes('engineer'),
      user.statuses_count > 100 // 활발한 트윗 활동
    ];

    const score = indicators.filter(Boolean).length;
    return score >= 2; // 2개 이상의 지표가 있으면 팀원으로 판단
  }

  /**
   * 팀원 확신도 계산 (0.0-1.0)
   */
  private calculateTeamMemberConfidence(user: TwitterUserInfo, relationshipType: string): number {
    let confidence = 0.0;

    // 인증된 계정
    if (user.verified) confidence += 0.3;

    // 팔로워 수 (로그 스케일)
    if (user.followers_count > 10000) confidence += 0.2;
    else if (user.followers_count > 1000) confidence += 0.1;

    // 설명에 직책 키워드 포함
    const description = user.description?.toLowerCase() || '';
    const roleKeywords = ['founder', 'ceo', 'cto', 'developer', 'engineer', 'co-founder'];
    if (roleKeywords.some(keyword => description.includes(keyword))) {
      confidence += 0.2;
    }

    // 활발한 활동
    if (user.statuses_count > 500) confidence += 0.1;
    else if (user.statuses_count > 100) confidence += 0.05;

    // 관계 타입별 가중치
    if (relationshipType === 'affiliate') confidence += 0.1;
    else if (relationshipType === 'both') confidence += 0.15;

    return Math.min(confidence, 1.0);
  }

  /**
   * 팀원 정보 수집 (별칭 메서드)
   */
  async collectTeamMembers(screenName: string): Promise<TwitterTeamMembersResult> {
    try {
      console.log(`👥 팀원 정보 수집 시작: @${screenName}`);
      
      // 트위터 API로 팀원 정보 조회
      const teamData = await twitterAPI.getTeamMembers(screenName);
      
      if (!teamData || teamData.combined.length === 0) {
        return {
          success: false,
          error: '팀원 정보를 찾을 수 없습니다',
          following: [],
          affiliates: [],
          combined: [],
          saved_members: []
        };
      }

      return {
        success: true,
        following: teamData.following,
        affiliates: teamData.affiliates,
        combined: teamData.combined,
        saved_members: [] // 실제 저장된 팀원들 (간단화를 위해 빈 배열)
      };
    } catch (error) {
      console.error(`❌ 팀원 정보 수집 실패: @${screenName}`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : '알 수 없는 오류',
        following: [],
        affiliates: [],
        combined: [],
        saved_members: []
      };
    }
  }

  /**
   * 프로젝트의 팀원 목록 조회
   */
  async getTeamMembers(projectId: string): Promise<TwitterTeamMemberDetail[]> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('twitter_team_members_detail')
        .select('*')
        .eq('project_id', projectId)
        .order('followers_count', { ascending: false });

      if (error) {
        console.error('팀원 목록 조회 오류:', error);
        return [];
      }

      return data as TwitterTeamMemberDetail[];
    } catch (error) {
      console.error('팀원 목록 조회 오류:', error);
      return [];
    }
  }

  /**
   * 팀원 개요 정보 조회
   */
  async getTeamOverview(projectId: string): Promise<TwitterTeamOverview | null> {
    if (!supabase) {
      console.error('Supabase client is not initialized');
      return null;
    }

    try {
      const { data, error } = await supabase
        .from('twitter_team_overview')
        .select('*')
        .eq('project_id', projectId)
        .single();

      if (error) {
        console.error('팀원 개요 조회 오류:', error);
        return null;
      }

      return data as TwitterTeamOverview;
    } catch (error) {
      console.error('팀원 개요 조회 오류:', error);
      return null;
    }
  }
}

// 싱글톤 인스턴스
export const twitterService = new TwitterService();

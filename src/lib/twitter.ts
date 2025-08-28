// Twitter API 클라이언트
export interface TwitterUserInfo {
  id: string;
  name: string;
  screen_name: string;
  description: string;
  profile_image_url: string;
  followers_count: number;
  friends_count: number;
  statuses_count: number;
  favourites_count: number;
  created_at: string;
  verified: boolean;
  location?: string;
  url?: string;
  profile_banner_url?: string;
}

export interface TwitterTimelineItem {
  id: string;
  text: string;
  created_at: string;
  retweet_count: number;
  favorite_count: number;
  user: TwitterUserInfo;
}

class TwitterAPI {
  private apiKey: string;
  private apiHost: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_TWITTER_API_KEY || '';
    this.apiHost = process.env.NEXT_PUBLIC_TWITTER_API_HOST || 'twitter-api45.p.rapidapi.com';
  }

  private async makeRequest(endpoint: string): Promise<any> {
    try {
      const response = await fetch(`https://${this.apiHost}${endpoint}`, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': this.apiKey,
          'x-rapidapi-host': this.apiHost,
        },
      });

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error(`Twitter API Rate Limit: 너무 많은 요청입니다. 잠시 후 다시 시도해주세요.`);
        }
        throw new Error(`Twitter API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Twitter API Error:', error);
      throw error;
    }
  }

  /**
   * 사용자 정보 조회
   */
  async getUserInfo(screenname: string): Promise<TwitterUserInfo | null> {
    try {
      // 대소문자 구분 로그 추가
      console.log(`🔍 Twitter API 호출 시작: @${screenname}`);
      
      // 가이드에 따른 정확한 엔드포인트 사용
      console.log(`🔗 Twitter API 엔드포인트 호출: /screenname.php?screenname=${screenname}`);
      
      const data = await this.makeRequest(`/screenname.php?screenname=${screenname}`);
      
      // 응답 데이터 상세 디버깅
      console.log('🔍 Twitter API 전체 응답 데이터:', {
        hasData: !!data,
        dataType: typeof data,
        keys: data ? Object.keys(data) : [],
        fullResponse: data, // 전체 응답 확인
        sampleData: data ? {
          id: data.id || data.id_str,
          name: data.name,
          screen_name: data.screen_name,
          followers_count: data.followers_count,
          description: data.description,
          profile_image_url: data.profile_image_url_https || data.profile_image_url,
          created_at: data.created_at,
          verified: data.verified
        } : null
      });
      
      if (!data || data.error || data.errors) {
        console.log(`❌ Twitter: 사용자 '${screenname}'을 찾을 수 없습니다.`, data?.error || data?.errors);
        return null;
      }

      // API 응답에서 필수 필드 확인 (다양한 ID 필드 시도)
      if (!data.id && !data.id_str && !data.user_id && !data.twitter_id) {
        console.warn('⚠️ Twitter API 응답에서 ID 필드를 찾을 수 없음, 임시 ID 생성:', Object.keys(data));
        // ID가 없어도 계속 진행 (다른 데이터가 유효하면)
      }

      // 응답 데이터 매핑 (다양한 필드명 시도)
      const mappedData = {
        id: String(
          data.id_str || data.id || data.user_id || data.twitter_id || `temp_${Date.now()}`
        ),
        name: data.name || data.display_name || data.full_name || 'Unknown User',
        screen_name: data.screen_name || data.username || data.handle || screenname,
        description: data.description || data.bio || data.about || '',
        profile_image_url: 
          data.profile_image_url_https || 
          data.profile_image_url || 
          data.avatar_url || 
          data.profile_pic || 
          data.image_url || '',
        followers_count: Number(
          data.followers_count || 
          data.follower_count || 
          data.followers || 
          0
        ),
        friends_count: Number(
          data.friends_count || 
          data.following_count || 
          data.following || 
          0
        ),
        statuses_count: Number(
          data.statuses_count || 
          data.tweet_count || 
          data.tweets || 
          0
        ),
        favourites_count: Number(
          data.favourites_count || 
          data.likes_count || 
          data.likes || 
          0
        ),
        created_at: data.created_at || data.join_date || data.registered || new Date().toISOString(),
        verified: Boolean(data.verified || data.is_verified || data.blue_verified),
        location: data.location || data.geo_location || null,
        url: data.url || data.website || data.external_url || null,
        profile_banner_url: data.profile_banner_url || data.banner_url || data.cover_image || null
      };

      console.log(`✅ Twitter: ${mappedData.name} (@${mappedData.screen_name}) 정보 매핑 완료`);
      console.log('📊 매핑된 데이터:', {
        name: mappedData.name,
        screen_name: mappedData.screen_name,
        followers: mappedData.followers_count,
        following: mappedData.friends_count,
        verified: mappedData.verified,
        description_length: mappedData.description.length,
        has_profile_image: !!mappedData.profile_image_url,
        created_at: mappedData.created_at
      });

      return mappedData;
    } catch (error) {
      console.error(`❌ Twitter API 오류 (${screenname}):`, error);
      return null;
    }
  }

  /**
   * 사용자 타임라인 조회
   */
  async getUserTimeline(screenname: string, count: number = 10): Promise<TwitterTimelineItem[]> {
    try {
      // 가이드에 따른 정확한 엔드포인트 사용
      console.log(`🔍 Twitter Timeline API 호출: /timeline.php?screenname=${screenname}`);
      
      const data = await this.makeRequest(`/timeline.php?screenname=${screenname}`);
      
      console.log('🔍 Twitter Timeline API 응답:', {
        hasData: !!data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        firstItem: Array.isArray(data) && data.length > 0 ? Object.keys(data[0]) : null
      });
      
      if (!data) {
        console.log(`❌ Twitter: '${screenname}'의 타임라인을 가져올 수 없습니다.`);
        return [];
      }

      // 응답이 배열이 아닌 경우 처리
      let tweets = Array.isArray(data) ? data : (data.data || []);
      
      if (!Array.isArray(tweets)) {
        console.log(`⚠️ Twitter: 타임라인 응답이 예상된 형식이 아닙니다.`, typeof tweets);
        return [];
      }

      console.log(`✅ Twitter: ${screenname}의 타임라인 ${tweets.length}개 트윗 가져옴`);

      return tweets.slice(0, count).map((tweet: any) => ({
        id: String(tweet.id_str || tweet.id || `tweet_${Date.now()}_${Math.random()}`),
        text: tweet.full_text || tweet.text || '',
        created_at: tweet.created_at || new Date().toISOString(),
        retweet_count: Number(tweet.retweet_count) || 0,
        favorite_count: Number(tweet.favorite_count) || 0,
        user: {
          id: String(tweet.user?.id_str || tweet.user?.id || ''),
          name: tweet.user?.name || 'Unknown',
          screen_name: tweet.user?.screen_name || screenname,
          description: tweet.user?.description || '',
          profile_image_url: tweet.user?.profile_image_url_https || tweet.user?.profile_image_url || '',
          followers_count: Number(tweet.user?.followers_count) || 0,
          friends_count: Number(tweet.user?.friends_count) || 0,
          statuses_count: Number(tweet.user?.statuses_count) || 0,
          favourites_count: Number(tweet.user?.favourites_count) || 0,
          created_at: tweet.user?.created_at || new Date().toISOString(),
          verified: Boolean(tweet.user?.verified)
        }
      })).filter(tweet => tweet.id && tweet.text); // 유효한 트윗만 필터링
    } catch (error) {
      console.error(`❌ Twitter Timeline API 오류 (${screenname}):`, error);
      return [];
    }
  }

  /**
   * 팔로워 목록 조회
   */
  async getFollowers(screenname: string): Promise<TwitterUserInfo[]> {
    try {
      const data = await this.makeRequest(`/followers.php?screenname=${screenname}&blue_verified=0`);
      
      if (!data || !Array.isArray(data)) {
        return [];
      }

      return data.map((user: any) => ({
        id: user.id_str || user.id,
        name: user.name,
        screen_name: user.screen_name,
        description: user.description || '',
        profile_image_url: user.profile_image_url_https || user.profile_image_url,
        followers_count: user.followers_count || 0,
        friends_count: user.friends_count || 0,
        statuses_count: user.statuses_count || 0,
        favourites_count: user.favourites_count || 0,
        created_at: user.created_at,
        verified: user.verified || false,
        location: user.location,
        url: user.url
      }));
    } catch (error) {
      console.error(`Twitter Followers API 오류 (${screenname}):`, error);
      return [];
    }
  }

  /**
   * 트위터 핸들에서 @ 제거 및 정규화
   */
  static normalizeTwitterHandle(handle: string): string {
    return handle.replace(/^@/, '').toLowerCase().trim();
  }

  /**
   * 가입일 포맷팅
   */
  static formatJoinDate(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long'
      });
    } catch {
      return dateString;
    }
  }

  /**
   * 숫자 포맷팅 (K, M 단위)
   */
  static formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }
}

// 싱글톤 인스턴스
export const twitterAPI = new TwitterAPI();

// @SuiNetwork 테스트 전용 함수
export async function testSuiNetworkAPI(): Promise<void> {
  console.log('🧪 @SuiNetwork API 테스트 시작...');
  
  try {
    const result = await twitterAPI.getUserInfo('SuiNetwork');
    console.log('🎯 @SuiNetwork 테스트 결과:', {
      success: !!result,
      name: result?.name,
      screen_name: result?.screen_name,
      followers_count: result?.followers_count,
      friends_count: result?.friends_count,
      verified: result?.verified,
      description_preview: result?.description?.substring(0, 100),
      profile_image: !!result?.profile_image_url,
      created_at: result?.created_at
    });
    
    if (result) {
      console.log('✅ @SuiNetwork 데이터 수집 성공!');
      console.log('📋 전체 데이터:', result);
    } else {
      console.log('❌ @SuiNetwork 데이터 수집 실패');
    }
  } catch (error) {
    console.error('💥 @SuiNetwork API 테스트 오류:', error);
  }
}

// 브라우저에서 직접 테스트할 수 있도록 전역 함수로 노출
if (typeof window !== 'undefined') {
  (window as any).testSuiNetworkAPI = testSuiNetworkAPI;
}

// 트위터 핸들 추출 함수 (대소문자 보존)
export function extractTwitterHandle(url: string): string | null {
  // 다양한 트위터 URL 패턴 매칭
  const patterns = [
    /twitter\.com\/([a-zA-Z0-9_]+)/,
    /x\.com\/([a-zA-Z0-9_]+)/,
    /@([a-zA-Z0-9_]+)/,
    /^([a-zA-Z0-9_]+)$/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      // 대소문자 보존하여 반환 (API 호출 시 정확한 케이스 필요)
      return match[1].trim();
    }
  }

  return null;
}

// Twitter 활동도 점수 계산
export function calculateTwitterActivityScore(userInfo: TwitterUserInfo, timeline: TwitterTimelineItem[]): number {
  const accountAge = (Date.now() - new Date(userInfo.created_at).getTime()) / (1000 * 60 * 60 * 24); // 일수
  
  // 기본 지표
  const followerScore = Math.min(userInfo.followers_count / 10000, 1) * 30; // 최대 30점
  const tweetFrequency = (userInfo.statuses_count / accountAge) * 365; // 연간 트윗 수
  const activityScore = Math.min(tweetFrequency / 365, 1) * 20; // 최대 20점
  
  // 최근 활동도
  const recentActivity = timeline.length > 0 ? 20 : 0; // 최대 20점
  
  // 상호작용 점수
  const avgEngagement = timeline.length > 0 
    ? timeline.reduce((sum, tweet) => sum + tweet.retweet_count + tweet.favorite_count, 0) / timeline.length
    : 0;
  const engagementScore = Math.min(avgEngagement / 100, 1) * 20; // 최대 20점
  
  // 프로필 완성도
  const profileScore = [
    userInfo.description.length > 0,
    userInfo.location,
    userInfo.url,
    userInfo.profile_banner_url
  ].filter(Boolean).length * 2.5; // 최대 10점
  
  return Math.round(followerScore + activityScore + recentActivity + engagementScore + profileScore);
}

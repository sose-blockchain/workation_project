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
      console.log(`🔍 Twitter API 호출: /screenname.php?screenname=${screenname} (케이스 유지)`);
      
      // 문서에 따른 올바른 엔드포인트 사용 (케이스 그대로 전달)
      const data = await this.makeRequest(`/screenname.php?screenname=${screenname}`);
      
      // 응답 데이터 디버깅
      console.log('🔍 Twitter API 응답 데이터:', {
        hasData: !!data,
        keys: data ? Object.keys(data) : [],
        sampleData: data ? {
          id: data.id || data.id_str,
          name: data.name,
          screen_name: data.screen_name,
          followers_count: data.followers_count
        } : null
      });
      
      if (!data || data.error || data.errors) {
        console.log(`❌ Twitter: 사용자 '${screenname}'을 찾을 수 없습니다.`, data?.error || data?.errors);
        return null;
      }

      // API 응답에서 필수 필드 확인
      if (!data.id && !data.id_str) {
        console.error('❌ Twitter API 응답에서 ID가 누락됨:', data);
        return null;
      }

      console.log(`✅ Twitter: ${data.name || 'Unknown'} (@${data.screen_name || screenname}) 정보 가져옴`);

      return {
        id: String(data.id_str || data.id || `temp_${Date.now()}`),
        name: data.name || 'Unknown User',
        screen_name: data.screen_name || screenname,
        description: data.description || '',
        profile_image_url: data.profile_image_url_https || data.profile_image_url || '',
        followers_count: Number(data.followers_count) || 0,
        friends_count: Number(data.friends_count) || 0,
        statuses_count: Number(data.statuses_count) || 0,
        favourites_count: Number(data.favourites_count) || 0,
        created_at: data.created_at || new Date().toISOString(),
        verified: Boolean(data.verified),
        location: data.location || null,
        url: data.url || null,
        profile_banner_url: data.profile_banner_url || null
      };
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
      // 대소문자 구분 로그 추가
      console.log(`🔍 Twitter Timeline API 호출: /timeline.php?screenname=${screenname} (케이스 유지)`);
      
      // 문서에 따른 올바른 엔드포인트 사용 (케이스 그대로 전달)
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

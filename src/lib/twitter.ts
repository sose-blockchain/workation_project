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
  is_retweet?: boolean;
  retweeted_status?: TwitterTimelineItem;
}

export interface TwitterTweetDetail {
  id: string;
  text: string;
  created_at: string;
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  user: TwitterUserInfo;
  is_retweet: boolean;
  retweeted_status?: TwitterTweetDetail;
  media?: Array<{
    type: string;
    url: string;
  }>;
}

export interface TwitterThreadItem {
  id: string;
  text: string;
  created_at: string;
  user: TwitterUserInfo;
  reply_to?: string;
}

export interface MonthlyTwitterActivity {
  month: string; // YYYY-MM 형식
  tweets: TwitterTweetDetail[];
  retweets: TwitterTweetDetail[];
  total_tweets: number;
  total_retweets: number;
  engagement_summary: {
    total_likes: number;
    total_retweets: number;
    avg_engagement: number;
  };
  content_analysis: {
    top_keywords: string[];
    main_topics: string[];
    sentiment: 'positive' | 'neutral' | 'negative';
  };
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

      // JSON 파싱을 안전하게 처리
      const text = await response.text();
      if (!text || text.trim() === '') {
        console.warn('⚠️ Twitter API 응답이 비어있습니다.');
        return { hasData: false, error: 'Empty response' };
      }

      try {
        const data = JSON.parse(text);
        return data;
      } catch (parseError) {
        console.error('❌ Twitter API JSON 파싱 오류:', parseError);
        console.log('📄 응답 내용:', text.substring(0, 200) + '...');
        return { hasData: false, error: 'Invalid JSON response' };
      }
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

      // 계정 정지 상태 확인
      if (data.status === 'suspended') {
        console.log(`⚠️ Twitter: 계정 '${screenname}'이 정지되었습니다.`);
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
            data.id_str || data.id || data.user_id || data.twitter_id || data.rest_id || `temp_${Date.now()}`
          ),
          name: data.name || data.display_name || data.full_name || 'Unknown User',
          screen_name: data.screen_name || data.username || data.handle || data.profile || screenname,
          description: data.description || data.bio || data.about || data.desc || '',
          profile_image_url:
            data.profile_image_url_https ||
            data.profile_image_url ||
            data.avatar_url ||
            data.profile_pic ||
            data.image_url ||
            data.avatar || '',
          followers_count: Number(
            data.followers_count ||
            data.follower_count ||
            data.followers ||
            data.sub_count ||
            0
          ),
          friends_count: Number(
            data.friends_count ||
            data.following_count ||
            data.following ||
            data.friends ||
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
      console.log(`🔍 Twitter Timeline API 호출: /timeline.php?screenname=${screenname}&count=${count}`);
      
      const data = await this.makeRequest(`/timeline.php?screenname=${screenname}&count=${count}`);
      
      console.log('🔍 Twitter Timeline API 응답:', {
        hasData: !!data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        dataType: typeof data,
        keys: data && typeof data === 'object' ? Object.keys(data) : null,
        firstItem: Array.isArray(data) && data.length > 0 ? {
          hasText: !!data[0].text,
          hasCreatedAt: !!data[0].created_at,
          keys: Object.keys(data[0])
        } : null
      });
      
      // API 오류 또는 빈 응답 처리
      if (!data || data.error || data.hasData === false) {
        console.log(`❌ Twitter: '${screenname}'의 타임라인을 가져올 수 없습니다.`, data?.error);
        return [];
      }

      // 응답이 배열이 아닌 경우 처리 - 더 많은 필드 확인
      let tweets: any[] = [];
      
      if (Array.isArray(data)) {
        tweets = data;
      } else if (data && typeof data === 'object') {
        // 다양한 가능한 배열 필드 확인
        tweets = data.data || data.timeline || data.tweets || data.results || data.items || [];
        
        if (!Array.isArray(tweets)) {
          console.warn(`⚠️ Twitter: 타임라인 응답에서 배열을 찾을 수 없습니다.`, {
            availableKeys: Object.keys(data),
            tweetsType: typeof tweets
          });
          return [];
        }
      } else {
        console.log(`⚠️ Twitter: 타임라인 응답이 예상된 형식이 아닙니다.`, typeof data);
        return [];
      }

      console.log(`✅ Twitter: ${screenname}의 타임라인 ${tweets.length}개 트윗 가져옴`);

      // 트윗을 생성 시간순으로 정렬 (최신순)
      const sortedTweets = tweets.sort((a: any, b: any) => {
        const dateA = new Date(a.created_at || 0).getTime();
        const dateB = new Date(b.created_at || 0).getTime();
        return dateB - dateA; // 최신순
      });

      return sortedTweets.slice(0, count).map((tweet: any) => {
        // 트윗 데이터 매핑 개선
        const tweetText = tweet.full_text || tweet.text || tweet.display_text || '';
        const tweetId = String(tweet.id_str || tweet.id || `tweet_${Date.now()}_${Math.random()}`);
        
        // 참여도 데이터 개선
        const likes = Number(tweet.favorite_count || tweet.likes || tweet.favourites_count) || 0;
        const retweets = Number(tweet.retweet_count || tweet.retweets) || 0;
        const replies = Number(tweet.reply_count || tweet.replies) || 0;
        
        // 리트윗 여부 판단 개선
        const isRetweet = Boolean(
          tweet.retweeted_status || 
          tweet.is_retweet || 
          tweetText.startsWith('RT @') ||
          tweet.retweeted
        );

        console.log(`📊 트윗 매핑: ${tweetId.substring(0, 8)}... - 좋아요: ${likes}, 리트윗: ${retweets}, 답글: ${replies}`);

        return {
          id: tweetId,
          text: tweetText,
          created_at: tweet.created_at || new Date().toISOString(),
          retweet_count: retweets,
          favorite_count: likes,
          is_retweet: isRetweet,
          // 원본 트윗 정보 (리트윗인 경우)
          retweeted_status: tweet.retweeted_status ? {
            id: String(tweet.retweeted_status.id_str || tweet.retweeted_status.id || ''),
            text: tweet.retweeted_status.full_text || tweet.retweeted_status.text || '',
            created_at: tweet.retweeted_status.created_at || new Date().toISOString(),
            retweet_count: Number(tweet.retweeted_status.retweet_count) || 0,
            favorite_count: Number(tweet.retweeted_status.favorite_count) || 0,
            is_retweet: false,
            user: {
              id: String(tweet.retweeted_status.user?.id_str || tweet.retweeted_status.user?.id || ''),
              name: tweet.retweeted_status.user?.name || '',
              screen_name: tweet.retweeted_status.user?.screen_name || '',
              description: tweet.retweeted_status.user?.description || '',
              profile_image_url: tweet.retweeted_status.user?.profile_image_url_https || tweet.retweeted_status.user?.profile_image_url || '',
              followers_count: Number(tweet.retweeted_status.user?.followers_count) || 0,
              friends_count: Number(tweet.retweeted_status.user?.friends_count) || 0,
              statuses_count: Number(tweet.retweeted_status.user?.statuses_count) || 0,
              favourites_count: Number(tweet.retweeted_status.user?.favourites_count) || 0,
              created_at: tweet.retweeted_status.user?.created_at || new Date().toISOString(),
              verified: Boolean(tweet.retweeted_status.user?.verified)
            }
          } : undefined,
          user: {
            id: String(tweet.user?.id_str || tweet.user?.id || tweet.author?.rest_id || ''),
            name: tweet.user?.name || tweet.author?.name || 'Unknown',
            screen_name: tweet.user?.screen_name || tweet.author?.screen_name || screenname,
            description: tweet.user?.description || '',
            profile_image_url: tweet.user?.profile_image_url_https || tweet.user?.profile_image_url || tweet.author?.image || '',
            followers_count: Number(tweet.user?.followers_count || tweet.author?.sub_count) || 0,
            friends_count: Number(tweet.user?.friends_count) || 0,
            statuses_count: Number(tweet.user?.statuses_count) || 0,
            favourites_count: Number(tweet.user?.favourites_count) || 0,
            created_at: tweet.user?.created_at || new Date().toISOString(),
            verified: Boolean(tweet.user?.verified || tweet.author?.blue_verified)
          }
        };
      }).filter(tweet => tweet.id && tweet.text); // 유효한 트윗만 필터링
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
   * 팔로잉 목록 조회 (팀원들이 서로 팔로우하는 경우)
   */
  async getFollowing(screenname: string): Promise<TwitterUserInfo[]> {
    try {
      console.log(`🔍 Twitter Following API 호출: /following.php?screenname=${screenname}`);
      
      const data = await this.makeRequest(`/following.php?screenname=${screenname}`);
      
      console.log('🔍 Twitter Following API 응답:', {
        hasData: !!data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0
      });
      
      if (!data || !Array.isArray(data)) {
        console.log(`❌ Twitter: '${screenname}'의 팔로잉 목록을 가져올 수 없습니다.`);
        return [];
      }

      console.log(`✅ Twitter: ${screenname}의 팔로잉 ${data.length}명 가져옴`);

      return data.map((user: any) => ({
        id: String(user.id_str || user.id || `user_${Date.now()}_${Math.random()}`),
        name: user.name || 'Unknown User',
        screen_name: user.screen_name || user.username || '',
        description: user.description || '',
        profile_image_url: user.profile_image_url_https || user.profile_image_url || '',
        followers_count: Number(user.followers_count) || 0,
        friends_count: Number(user.friends_count) || 0,
        statuses_count: Number(user.statuses_count) || 0,
        favourites_count: Number(user.favourites_count) || 0,
        created_at: user.created_at || new Date().toISOString(),
        verified: Boolean(user.verified),
        location: user.location || null,
        url: user.url || null
      })).filter(user => user.screen_name); // 유효한 사용자만 필터링
    } catch (error) {
      console.error(`❌ Twitter Following API 오류 (${screenname}):`, error);
      return [];
    }
  }

  /**
   * 제휴사/관련 계정 정보 조회 (팀원 정보 포함 가능)
   */
  async getAffiliates(screenname: string): Promise<TwitterUserInfo[]> {
    try {
      console.log(`🔍 Twitter Affiliates API 호출: /affilates.php?screenname=${screenname}`);
      
      const data = await this.makeRequest(`/affilates.php?screenname=${screenname}`);
      
      console.log('🔍 Twitter Affiliates API 응답:', {
        hasData: !!data,
        isArray: Array.isArray(data),
        length: Array.isArray(data) ? data.length : 0,
        dataType: typeof data,
        keys: data ? Object.keys(data) : [],
        sampleData: data
      });
      
      // 응답 구조 분석 및 처리
      let affiliates = [];
      
      if (Array.isArray(data)) {
        affiliates = data;
      } else if (data && typeof data === 'object') {
        // 객체 형태의 응답인 경우, 다양한 키를 확인
        if (data.users && Array.isArray(data.users)) {
          affiliates = data.users;
        } else if (data.data && Array.isArray(data.data)) {
          affiliates = data.data;
        } else if (data.affiliates && Array.isArray(data.affiliates)) {
          affiliates = data.affiliates;
        } else {
          // 객체의 값들 중 배열인 것을 찾기
          for (const key in data) {
            if (Array.isArray(data[key]) && data[key].length > 0) {
              console.log(`🔍 발견된 배열 키: ${key}, 길이: ${data[key].length}`);
              affiliates = data[key];
              break;
            }
          }
        }
      }
      
      if (affiliates.length === 0) {
        console.log(`📭 Twitter: '${screenname}'의 제휴사 정보 없음 (빈 응답 또는 구조 불일치)`);
        return [];
      }

      console.log(`✅ Twitter: ${screenname}의 제휴사 ${affiliates.length}개 가져옴`);

      return affiliates.map((user: any) => ({
        id: String(user.id_str || user.id || `affiliate_${Date.now()}_${Math.random()}`),
        name: user.name || 'Unknown User',
        screen_name: user.screen_name || user.username || '',
        description: user.description || '',
        profile_image_url: user.profile_image_url_https || user.profile_image_url || '',
        followers_count: Number(user.followers_count) || 0,
        friends_count: Number(user.friends_count) || 0,
        statuses_count: Number(user.statuses_count) || 0,
        favourites_count: Number(user.favourites_count) || 0,
        created_at: user.created_at || new Date().toISOString(),
        verified: Boolean(user.verified),
        location: user.location || null,
        url: user.url || null
      })).filter((user: any) => user.screen_name); // 유효한 사용자만 필터링
    } catch (error) {
      console.error(`❌ Twitter Affiliates API 오류 (${screenname}):`, error);
      return [];
    }
  }

  /**
   * 팀원 정보 수집 (제휴 계정만)
   */
  async getTeamMembers(screenname: string): Promise<{
    following: TwitterUserInfo[];
    affiliates: TwitterUserInfo[];
    combined: TwitterUserInfo[];
  }> {
    try {
      console.log(`🔍 팀원 정보 수집 시작: @${screenname} (제휴 계정만)`);
      
      // 제휴사 정보만 수집 (팔로잉은 너무 많고 부정확함)
      const affiliates = await this.getAffiliates(screenname);

      console.log(`✅ 팀원 정보 수집 완료: 제휴사 ${affiliates.length}개`);

      return {
        following: [], // 팔로잉 정보는 사용하지 않음
        affiliates,
        combined: affiliates // 제휴사만 사용
      };
    } catch (error) {
      console.error(`❌ 팀원 정보 수집 오류 (${screenname}):`, error);
      return {
        following: [],
        affiliates: [],
        combined: []
      };
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
  (window as any).testTeamMembersAPI = async (screenName: string) => {
    console.log(`🧪 팀원 정보 API 테스트 시작: @${screenName}`);
    
    try {
      const result = await twitterAPI.getTeamMembers(screenName);
      console.log('🎯 팀원 정보 테스트 결과:', {
        success: true,
        following: result.following.length,
        affiliates: result.affiliates.length,
        combined: result.combined.length,
        sample_following: result.following.slice(0, 3).map(u => ({
          name: u.name,
          screen_name: u.screen_name,
          followers_count: u.followers_count,
          verified: u.verified
        })),
        sample_affiliates: result.affiliates.slice(0, 3).map(u => ({
          name: u.name,
          screen_name: u.screen_name,
          followers_count: u.followers_count,
          verified: u.verified
        }))
      });
      
      if (result.combined.length > 0) {
        console.log('✅ 팀원 정보 수집 성공!');
        console.log('📋 전체 데이터:', result);
      } else {
        console.log('📭 팀원 정보 없음');
      }
    } catch (error) {
      console.error('💥 팀원 정보 API 테스트 오류:', error);
    }
  };

  // Affiliates API 직접 테스트
  (window as any).testAffiliatesAPI = async (screenName: string) => {
    console.log(`🧪 Affiliates API 직접 테스트: @${screenName}`);
    
    try {
      const result = await twitterAPI.getAffiliates(screenName);
      console.log('🎯 Affiliates API 결과:', {
        success: true,
        count: result.length,
        data: result
      });
    } catch (error) {
      console.error('💥 Affiliates API 테스트 오류:', error);
    }
  };

  // 다양한 계정으로 Affiliates 테스트
  (window as any).testVariousAffiliates = async () => {
    const testAccounts = ['x', 'twitter', 'elonmusk', 'berachain', 'solana', 'ethereum'];
    
    console.log('🧪 다양한 계정으로 Affiliates API 테스트 시작');
    
    for (const account of testAccounts) {
      console.log(`\n--- 테스트 계정: @${account} ---`);
      try {
        const result = await twitterAPI.getAffiliates(account);
        console.log(`✅ @${account}: ${result.length}개 제휴사 발견`);
        if (result.length > 0) {
          console.log('📋 샘플 데이터:', result.slice(0, 2));
        }
      } catch (error) {
        console.error(`❌ @${account}: 오류 발생`, error);
      }
      
      // API 호출 간격 (Rate Limit 방지)
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('🏁 다양한 계정 테스트 완료');
  };

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

// 브라우저 테스트 함수들
if (typeof window !== 'undefined') {
  // Timeline 테스트 함수
  (window as any).testTimelineAPI = async (screenName: string) => {
    console.log(`🧪 Timeline API 테스트: ${screenName}`);
    try {
      const timeline = await twitterAPI.getUserTimeline(screenName, 20);
      
      console.log('✅ Timeline 테스트 결과:', {
        totalTweets: timeline.length,
        sampleTweets: timeline.slice(0, 3).map(tweet => ({
          id: tweet.id,
          text: tweet.text.substring(0, 100) + '...',
          created_at: tweet.created_at,
          retweet_count: tweet.retweet_count,
          favorite_count: tweet.favorite_count,
          is_retweet: tweet.is_retweet
        }))
      });
      
      return timeline;
    } catch (error) {
      console.error('❌ Timeline 테스트 실패:', error);
      return null;
    }
  };

  // 월별 활동 분석 테스트
  (window as any).testMonthlyAnalysis = async (screenName: string) => {
    console.log(`📊 월별 활동 분석 테스트: ${screenName}`);
    try {
      const timeline = await twitterAPI.getUserTimeline(screenName, 50);
      
      if (timeline.length === 0) {
        console.log('❌ 타임라인이 비어있습니다.');
        return null;
      }

      // 월별 그룹화
      const monthlyGroups: { [key: string]: typeof timeline } = {};
      
      timeline.forEach(tweet => {
        const date = new Date(tweet.created_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        
        if (!monthlyGroups[monthKey]) {
          monthlyGroups[monthKey] = [];
        }
        monthlyGroups[monthKey].push(tweet);
      });

      const monthlyStats = Object.entries(monthlyGroups).map(([month, tweets]) => ({
        month,
        totalTweets: tweets.length,
        originalTweets: tweets.filter(t => !t.is_retweet).length,
        retweets: tweets.filter(t => t.is_retweet).length,
        totalLikes: tweets.reduce((sum, t) => sum + t.favorite_count, 0),
        totalRetweets: tweets.reduce((sum, t) => sum + t.retweet_count, 0)
      }));

      console.log('✅ 월별 분석 결과:', monthlyStats);
      return monthlyStats;
    } catch (error) {
      console.error('❌ 월별 분석 테스트 실패:', error);
      return null;
    }
  };

  console.log('🐦 Twitter API 테스트 함수 추가:');
  console.log('- testTimelineAPI("screenName") : 타임라인 API 테스트');
  console.log('- testMonthlyAnalysis("screenName") : 월별 활동 분석 테스트');
}

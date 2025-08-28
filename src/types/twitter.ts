// 트위터 관련 타입 정의

// 데이터베이스 트위터 계정 테이블 타입
export interface TwitterAccount {
  id: string;
  project_id: string;
  
  // Twitter API 기본 정보
  twitter_id: string;
  screen_name: string;
  name: string;
  description?: string;
  
  // 프로필 이미지
  profile_image_url?: string;
  profile_banner_url?: string;
  
  // 통계 정보
  followers_count: number;
  friends_count: number;
  statuses_count: number;
  favourites_count: number;
  
  // 계정 정보
  verified: boolean;
  location?: string;
  url?: string;
  created_at: string; // 트위터 가입일
  
  // 메타데이터
  last_updated: string;
  data_source: string;
  activity_score: number;
  
  // DB 메타데이터
  created_at_db: string;
  updated_at: string;
}

// 트위터 타임라인 타입
export interface TwitterTimeline {
  id: string;
  twitter_account_id: string;
  
  // 트윗 정보
  tweet_id: string;
  text: string;
  created_at: string;
  
  // 상호작용 정보
  retweet_count: number;
  favorite_count: number;
  reply_count: number;
  
  // 메타데이터
  is_retweet: boolean;
  is_reply: boolean;
  language?: string;
  
  // DB 메타데이터
  created_at_db: string;
  updated_at: string;
}

// 팔로워 분석 타입
export interface TwitterFollowersAnalysis {
  id: string;
  twitter_account_id: string;
  
  analysis_date: string;
  total_followers: number;
  verified_followers: number;
  crypto_related_followers: number;
  
  followers_growth_7d: number;
  followers_growth_30d: number;
  
  created_at: string;
}

// 프로젝트-트위터 통합 뷰 타입
export interface TwitterProjectOverview {
  project_id: string;
  project_name: string;
  token_symbol?: string;
  screen_name?: string;
  twitter_name?: string;
  followers_count?: number;
  friends_count?: number;
  verified?: boolean;
  activity_score?: number;
  last_updated?: string;
  recent_tweets_count: number;
}

// Twitter API 응답 타입 (외부 API)
export interface TwitterAPIUserResponse {
  id: string;
  id_str: string;
  name: string;
  screen_name: string;
  description: string;
  profile_image_url: string;
  profile_image_url_https: string;
  profile_banner_url?: string;
  followers_count: number;
  friends_count: number;
  statuses_count: number;
  favourites_count: number;
  created_at: string;
  verified: boolean;
  location?: string;
  url?: string;
}

export interface TwitterAPITimelineResponse {
  id: string;
  id_str: string;
  text: string;
  full_text: string;
  created_at: string;
  retweet_count: number;
  favorite_count: number;
  reply_count?: number;
  user: TwitterAPIUserResponse;
}

// 트위터 계정 생성/수정 요청 타입
export interface CreateTwitterAccountRequest {
  project_id: string;
  screen_name: string;
  fetch_timeline?: boolean; // 타임라인도 함께 가져올지 여부
}

export interface UpdateTwitterAccountRequest {
  id: string;
  twitter_id?: string;
  screen_name?: string;
  name?: string;
  description?: string;
  profile_image_url?: string;
  profile_banner_url?: string;
  followers_count?: number;
  friends_count?: number;
  statuses_count?: number;
  favourites_count?: number;
  verified?: boolean;
  location?: string;
  url?: string;
  created_at?: string;
  activity_score?: number;
}

// 트위터 검색 결과 타입
export interface TwitterSearchResult {
  account: TwitterAccount | null;
  timeline: TwitterTimeline[];
  error?: string;
  found: boolean;
}

// 활동도 점수 계산을 위한 메트릭 타입
export interface TwitterActivityMetrics {
  account_age_days: number;
  tweets_per_day: number;
  engagement_rate: number;
  recent_activity: boolean;
  profile_completeness: number;
  verified_bonus: number;
}

// 트위터 URL 추출 결과 타입
export interface TwitterUrlResult {
  url: string;
  screen_name: string | null;
  platform: 'twitter' | 'x' | null;
  valid: boolean;
}

// 트위터 통계 요약 타입
export interface TwitterStatsSummary {
  total_followers: number;
  total_following: number;
  total_tweets: number;
  activity_score: number;
  engagement_metrics: {
    avg_retweets: number;
    avg_likes: number;
    total_interactions: number;
  };
  growth_metrics?: {
    followers_growth_7d: number;
    followers_growth_30d: number;
  };
}

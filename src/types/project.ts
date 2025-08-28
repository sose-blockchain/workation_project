export interface Project {
  id: string;
  name: string;
  token_symbol?: string;
  description?: string;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  homepage_url?: string;
  whitepaper_url?: string;
  docs_url?: string;
  blog_url?: string;
  github_url?: string;
  project_twitter_url?: string;
  team_twitter_urls?: string[];
  detected_twitter_url?: string; // AI 검색에서 발견된 트위터 URL (첫 번째)
  detected_twitter_urls?: string[]; // AI 검색에서 발견된 모든 트위터 URL들
  ai_summary?: string;
  ai_keywords?: string[];
  // 마켓 데이터
  market_cap_rank?: number;
  current_price_usd?: number;
  market_cap_usd?: number;
  // 투자 데이터 (JSON 형태로 저장)
  investment_rounds?: any[];
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  token_symbol?: string;
  description?: string;
  keyword1?: string;
  keyword2?: string;
  keyword3?: string;
  homepage_url?: string;
  whitepaper_url?: string;
  docs_url?: string;
  blog_url?: string;
  github_url?: string;
  project_twitter_url?: string;
  team_twitter_urls?: string[];
  detected_twitter_url?: string; // AI 검색에서 발견된 트위터 URL (첫 번째)
  detected_twitter_urls?: string[]; // AI 검색에서 발견된 모든 트위터 URL들
  // 마켓 데이터
  market_cap_rank?: number;
  current_price_usd?: number;
  market_cap_usd?: number;
  // 투자 데이터
  investment_rounds?: any[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}


export interface Project {
  id: string;
  name: string;
  token_symbol?: string;
  description?: string;
  homepage_url?: string;
  whitepaper_url?: string;
  docs_url?: string;
  blog_url?: string;
  project_twitter_url?: string;
  team_twitter_urls?: string[];
  ai_summary?: string;
  ai_keywords?: string[];
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  token_symbol?: string;
  description?: string;
  homepage_url?: string;
  whitepaper_url?: string;
  docs_url?: string;
  blog_url?: string;
  project_twitter_url?: string;
  team_twitter_urls?: string[];
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}


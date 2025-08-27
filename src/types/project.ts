export interface Project {
  id: string;
  name: string;
  description?: string;
  token_name?: string;
  token_symbol?: string;
  homepage_url?: string;
  whitepaper_url?: string;
  docs_url?: string;
  blog_url?: string;
  ai_summary?: string;
  ai_keywords?: string[];
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  token_name?: string;
  token_symbol?: string;
  homepage_url?: string;
  whitepaper_url?: string;
  docs_url?: string;
  blog_url?: string;
}

export interface UpdateProjectRequest extends Partial<CreateProjectRequest> {
  id: string;
}

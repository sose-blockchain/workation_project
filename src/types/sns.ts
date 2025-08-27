export interface SnsAccount {
  id: string;
  project_id: string;
  platform: 'twitter' | 'linkedin' | 'github';
  account_handle: string;
  account_name?: string;
  account_url?: string;
  follower_count: number;
  following_count: number;
  post_count: number;
  ai_engagement_score?: number;
  last_updated_at: string;
  created_at: string;
}

export interface CreateSnsAccountRequest {
  project_id: string;
  platform: 'twitter' | 'linkedin' | 'github';
  account_handle: string;
  account_name?: string;
  account_url?: string;
}

export interface UpdateSnsAccountRequest extends Partial<CreateSnsAccountRequest> {
  id: string;
}

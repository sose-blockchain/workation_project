import { createClient } from '@supabase/supabase-js'

// 안전한 Supabase 클라이언트 생성 함수
const createSupabaseClient = () => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    return null
  }
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase environment variables are not set')
    return null
  }
  
  try {
    return createClient(supabaseUrl, supabaseAnonKey)
  } catch (error) {
    console.error('Failed to create Supabase client:', error)
    return null
  }
}

// Supabase 클라이언트 인스턴스
export const supabase = createSupabaseClient()

// Database types
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: {
          id: string
          name: string
          token_symbol: string | null
          description: string | null
          keyword1: string | null
          keyword2: string | null
          keyword3: string | null
          homepage_url: string | null
          whitepaper_url: string | null
          docs_url: string | null
          blog_url: string | null
          github_url: string | null
          project_twitter_url: string | null
          team_twitter_urls: string[] | null
          ai_summary: string | null
          ai_keywords: string[] | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          token_symbol?: string | null
          description?: string | null
          keyword1?: string | null
          keyword2?: string | null
          keyword3?: string | null
          homepage_url?: string | null
          whitepaper_url?: string | null
          docs_url?: string | null
          blog_url?: string | null
          github_url?: string | null
          project_twitter_url?: string | null
          team_twitter_urls?: string[] | null
          ai_summary?: string | null
          ai_keywords?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          token_symbol?: string | null
          description?: string | null
          keyword1?: string | null
          keyword2?: string | null
          keyword3?: string | null
          homepage_url?: string | null
          whitepaper_url?: string | null
          docs_url?: string | null
          blog_url?: string | null
          github_url?: string | null
          project_twitter_url?: string | null
          team_twitter_urls?: string[] | null
          ai_summary?: string | null
          ai_keywords?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      sns_accounts: {
        Row: {
          id: string
          project_id: string
          platform: string
          account_handle: string
          account_name: string | null
          account_url: string | null
          follower_count: number
          following_count: number
          post_count: number
          ai_engagement_score: number | null
          last_updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          platform: string
          account_handle: string
          account_name?: string | null
          account_url?: string | null
          follower_count?: number
          following_count?: number
          post_count?: number
          ai_engagement_score?: number | null
          last_updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          platform?: string
          account_handle?: string
          account_name?: string | null
          account_url?: string | null
          follower_count?: number
          following_count?: number
          post_count?: number
          ai_engagement_score?: number | null
          last_updated_at?: string
          created_at?: string
        }
      }
    }
  }
}

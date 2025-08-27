import { createClient } from '@supabase/supabase-js'

// 클라이언트 사이드에서만 Supabase 클라이언트 생성
let supabase: any = null

const createSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
    
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey)
    }
  }
  return null
}

// 클라이언트 사이드에서만 초기화
if (typeof window !== 'undefined') {
  supabase = createSupabaseClient()
}

export { supabase }

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
          homepage_url: string | null
          whitepaper_url: string | null
          docs_url: string | null
          blog_url: string | null
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
          homepage_url?: string | null
          whitepaper_url?: string | null
          docs_url?: string | null
          blog_url?: string | null
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
          homepage_url?: string | null
          whitepaper_url?: string | null
          docs_url?: string | null
          blog_url?: string | null
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

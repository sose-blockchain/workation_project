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
          market_cap_rank: number | null
          current_price_usd: number | null
          market_cap_usd: number | null
          investment_rounds: any[] | null
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
          market_cap_rank?: number | null
          current_price_usd?: number | null
          market_cap_usd?: number | null
          investment_rounds?: any[] | null
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
          market_cap_rank?: number | null
          current_price_usd?: number | null
          market_cap_usd?: number | null
          investment_rounds?: any[] | null
          ai_summary?: string | null
          ai_keywords?: string[] | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      market_data: {
        Row: {
          id: string
          project_id: string
          market_cap_rank: number | null
          current_price_usd: number | null
          market_cap_usd: number | null
          volume_24h_usd: number | null
          price_change_24h: number | null
          price_change_7d: number | null
          price_change_30d: number | null
          circulating_supply: number | null
          total_supply: number | null
          max_supply: number | null
          fully_diluted_valuation: number | null
          market_cap_dominance: number | null
          data_source: string
          last_updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          project_id: string
          market_cap_rank?: number | null
          current_price_usd?: number | null
          market_cap_usd?: number | null
          volume_24h_usd?: number | null
          price_change_24h?: number | null
          price_change_7d?: number | null
          price_change_30d?: number | null
          circulating_supply?: number | null
          total_supply?: number | null
          max_supply?: number | null
          fully_diluted_valuation?: number | null
          market_cap_dominance?: number | null
          data_source: string
          last_updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          market_cap_rank?: number | null
          current_price_usd?: number | null
          market_cap_usd?: number | null
          volume_24h_usd?: number | null
          price_change_24h?: number | null
          price_change_7d?: number | null
          price_change_30d?: number | null
          circulating_supply?: number | null
          total_supply?: number | null
          max_supply?: number | null
          fully_diluted_valuation?: number | null
          market_cap_dominance?: number | null
          data_source?: string
          last_updated_at?: string
          created_at?: string
        }
      }
      investments: {
        Row: {
          id: string
          project_id: string
          round_type: string
          round_name: string | null
          date: string
          amount_usd: number
          valuation_pre_money_usd: number | null
          valuation_post_money_usd: number | null
          lead_investor: string | null
          investors: string[]
          investor_count: number | null
          announcement_url: string | null
          notes: string | null
          data_source: string | null
          source_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          project_id: string
          round_type: string
          round_name?: string | null
          date: string
          amount_usd: number
          valuation_pre_money_usd?: number | null
          valuation_post_money_usd?: number | null
          lead_investor?: string | null
          investors: string[]
          investor_count?: number | null
          announcement_url?: string | null
          notes?: string | null
          data_source?: string | null
          source_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          project_id?: string
          round_type?: string
          round_name?: string | null
          date?: string
          amount_usd?: number
          valuation_pre_money_usd?: number | null
          valuation_post_money_usd?: number | null
          lead_investor?: string | null
          investors?: string[]
          investor_count?: number | null
          announcement_url?: string | null
          notes?: string | null
          data_source?: string | null
          source_url?: string | null
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

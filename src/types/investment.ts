export interface Investment {
  id: string
  project_id: string
  round_type: string // Seed, Series A, Series B, Private Sale, Public Sale, Strategic
  round_name?: string // Series A Round, Strategic Investment 등
  date: string // YYYY-MM-DD
  amount_usd: number
  valuation_pre_money_usd?: number
  valuation_post_money_usd?: number
  lead_investor?: string
  investors: string[] // 주요 투자자 배열
  investor_count?: number
  announcement_url?: string
  notes?: string
  data_source?: string // cryptorank, crunchbase, manual
  source_url?: string
  created_at: string
  updated_at: string
}

export interface CreateInvestmentRequest {
  project_id: string
  round_type: string
  round_name?: string
  date: string
  amount_usd: number
  valuation_pre_money_usd?: number
  valuation_post_money_usd?: number
  lead_investor?: string
  investors: string[]
  investor_count?: number
  announcement_url?: string
  notes?: string
  data_source?: string
  source_url?: string
}

export interface UpdateInvestmentRequest extends Partial<CreateInvestmentRequest> {
  id: string
}

export interface MarketData {
  market_cap_rank?: number
  current_price_usd?: number
  market_cap_usd?: number
  price_change_24h?: number
  volume_24h_usd?: number
  last_updated?: string
}

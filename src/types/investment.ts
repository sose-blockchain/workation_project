export interface Investment {
  id: string
  project_id: string
  round_type: string // Seed, Series A, Private Sale, etc.
  date: string // YYYY-MM-DD
  amount_usd: number
  investors: string[] // 주요 투자자 리스트
  lead_investor?: string
  valuation_usd?: number
  notes?: string
  created_at: string
  updated_at: string
}

export interface CreateInvestmentRequest {
  project_id: string
  round_type: string
  date: string
  amount_usd: number
  investors: string[]
  lead_investor?: string
  valuation_usd?: number
  notes?: string
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

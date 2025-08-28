-- ========================================
-- 🗄️ Workation Project 정규화된 데이터베이스 마이그레이션
-- Supabase SQL Editor에서 실행 - 기존 컬럼 충돌 해결 버전
-- ========================================

-- 1️⃣ projects 테이블에 새 키워드 컬럼만 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword1 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword2 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword3 text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url text;

-- 2️⃣ market_data 테이블 생성 (기존 컬럼과 충돌 방지)
CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  market_cap_rank INTEGER,
  current_price_usd DECIMAL(20,8),
  market_cap_usd BIGINT,
  volume_24h_usd BIGINT,
  price_change_24h DECIMAL(10,4),
  price_change_7d DECIMAL(10,4),
  price_change_30d DECIMAL(10,4),
  circulating_supply BIGINT,
  total_supply BIGINT,
  max_supply BIGINT,
  fully_diluted_valuation BIGINT,
  market_cap_dominance DECIMAL(5,2),
  data_source VARCHAR(50) NOT NULL DEFAULT 'manual',
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(project_id, data_source)
);

-- 3️⃣ 기존 마켓 데이터를 새 테이블로 이관 (컬럼이 존재하는 경우에만)
DO $$
BEGIN
  -- market_cap_rank 컬럼이 존재하는지 확인
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'projects' AND column_name = 'market_cap_rank'
  ) THEN
    -- 기존 데이터를 market_data 테이블로 이관
    INSERT INTO market_data (project_id, market_cap_rank, current_price_usd, market_cap_usd, data_source)
    SELECT 
      id, 
      market_cap_rank, 
      current_price_usd, 
      market_cap_usd,
      'migrated'
    FROM projects 
    WHERE market_cap_rank IS NOT NULL 
       OR current_price_usd IS NOT NULL 
       OR market_cap_usd IS NOT NULL
    ON CONFLICT (project_id, data_source) DO NOTHING;
    
    -- 기존 컬럼들 삭제
    ALTER TABLE projects DROP COLUMN IF EXISTS market_cap_rank;
    ALTER TABLE projects DROP COLUMN IF EXISTS current_price_usd;
    ALTER TABLE projects DROP COLUMN IF EXISTS market_cap_usd;
    ALTER TABLE projects DROP COLUMN IF EXISTS investment_rounds;
  END IF;
END $$;

-- 4️⃣ investments 테이블 생성
CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  round_type VARCHAR(50) NOT NULL,
  round_name VARCHAR(100),
  date DATE NOT NULL,
  amount_usd BIGINT NOT NULL,
  valuation_pre_money_usd BIGINT,
  valuation_post_money_usd BIGINT,
  lead_investor VARCHAR(255),
  investors TEXT[] NOT NULL,
  investor_count INTEGER,
  announcement_url TEXT,
  notes TEXT,
  data_source VARCHAR(50) DEFAULT 'manual',
  source_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5️⃣ sns_accounts 테이블 개선
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS subscriber_count INTEGER DEFAULT 0;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS last_post_date DATE;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS posts_last_30d INTEGER DEFAULT 0;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2);
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS ai_activity_level VARCHAR(20);
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT true;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- 6️⃣ 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_market_data_project_id ON market_data(project_id);
CREATE INDEX IF NOT EXISTS idx_market_data_rank ON market_data(market_cap_rank);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data(data_source);
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date);
CREATE INDEX IF NOT EXISTS idx_investments_round_type ON investments(round_type);

-- 7️⃣ RLS 정책 설정
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all operations on market_data" ON market_data;
CREATE POLICY "Allow all operations on market_data" ON market_data FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all operations on investments" ON investments;
CREATE POLICY "Allow all operations on investments" ON investments FOR ALL USING (true) WITH CHECK (true);

-- 8️⃣ 통합 뷰 생성
CREATE OR REPLACE VIEW project_overview AS
SELECT 
  p.*,
  md.market_cap_rank,
  md.current_price_usd,
  md.market_cap_usd,
  md.price_change_24h,
  md.data_source as market_data_source,
  md.last_updated_at as market_updated_at,
  
  -- 투자 정보 (최신 라운드)
  i_latest.round_type as latest_round_type,
  i_latest.amount_usd as latest_investment_usd,
  i_latest.date as latest_investment_date,
  
  -- 총 투자 금액
  i_total.total_investment_usd,
  i_total.investment_count
  
FROM projects p
LEFT JOIN market_data md ON p.id = md.project_id 
  AND md.data_source = 'coinmarketcap' -- 기본 소스
LEFT JOIN LATERAL (
  SELECT *
  FROM investments 
  WHERE project_id = p.id 
  ORDER BY date DESC 
  LIMIT 1
) i_latest ON true
LEFT JOIN (
  SELECT 
    project_id,
    SUM(amount_usd) as total_investment_usd,
    COUNT(*) as investment_count
  FROM investments 
  GROUP BY project_id
) i_total ON p.id = i_total.project_id;

-- 완료 메시지
SELECT 
  '✅ 정규화된 데이터베이스 마이그레이션이 완료되었습니다!' as message,
  '📊 기존 마켓 데이터가 새로운 market_data 테이블로 이관되었습니다.' as details;

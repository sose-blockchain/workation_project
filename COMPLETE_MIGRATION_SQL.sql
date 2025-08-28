-- ========================================
-- 🗄️ Workation Project 정규화된 데이터베이스 스키마
-- 실행 순서: 아래 코드를 순서대로 Supabase SQL Editor에서 실행
-- ========================================

-- ========================================
-- 1️⃣ 기존 projects 테이블에 키워드 컬럼 추가
-- ========================================

-- 개별 키워드 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword1 text DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword2 text DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword3 text DEFAULT NULL;

-- GitHub URL 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url text DEFAULT NULL;

-- 컬럼 설명 추가
COMMENT ON COLUMN projects.keyword1 IS '주요 키워드 1 (Layer1/Layer2/DApp)';
COMMENT ON COLUMN projects.keyword2 IS '주요 키워드 2 (세부 디테일)'; 
COMMENT ON COLUMN projects.keyword3 IS '주요 키워드 3 (특별한 기술/차별점)';
COMMENT ON COLUMN projects.github_url IS 'GitHub 저장소 URL';

-- 제약 조건 추가
ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS keyword1_length CHECK (length(keyword1) <= 50 OR keyword1 IS NULL);

ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS keyword2_length CHECK (length(keyword2) <= 50 OR keyword2 IS NULL);

ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS keyword3_length CHECK (length(keyword3) <= 50 OR keyword3 IS NULL);

-- GitHub URL 형식 검증
ALTER TABLE projects 
ADD CONSTRAINT IF NOT EXISTS github_url_format 
CHECK (github_url IS NULL OR github_url ~* '^https?://github\.com/.+');

-- ========================================
-- 2️⃣ 마켓 데이터 전용 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 기본 마켓 정보
  market_cap_rank INTEGER,
  current_price_usd DECIMAL(20,8),
  market_cap_usd BIGINT,
  
  -- 거래량 및 변동률
  volume_24h_usd BIGINT,
  price_change_24h DECIMAL(10,4), -- 24시간 가격 변동률 (%)
  price_change_7d DECIMAL(10,4),  -- 7일 가격 변동률 (%)
  price_change_30d DECIMAL(10,4), -- 30일 가격 변동률 (%)
  
  -- 공급량 정보
  circulating_supply BIGINT,
  total_supply BIGINT,
  max_supply BIGINT,
  
  -- 기타 지표
  fully_diluted_valuation BIGINT,
  market_cap_dominance DECIMAL(5,2), -- 시장 점유율 (%)
  
  -- 데이터 소스 및 타임스탬프
  data_source VARCHAR(50) NOT NULL, -- 'coinmarketcap', 'coingecko', 'cryptorank'
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 프로젝트별 최신 데이터 제약
  UNIQUE(project_id, data_source)
);

-- 마켓 데이터 인덱스
CREATE INDEX IF NOT EXISTS idx_market_data_project_id ON market_data(project_id);
CREATE INDEX IF NOT EXISTS idx_market_data_rank ON market_data(market_cap_rank);
CREATE INDEX IF NOT EXISTS idx_market_data_source ON market_data(data_source);
CREATE INDEX IF NOT EXISTS idx_market_data_updated ON market_data(last_updated_at);

-- 마켓 데이터 테이블 설명
COMMENT ON TABLE market_data IS '프로젝트 마켓/가격 데이터 (CoinMarketCap, CoinGecko, CryptoRank)';
COMMENT ON COLUMN market_data.data_source IS '데이터 소스 (coinmarketcap, coingecko, cryptorank)';
COMMENT ON COLUMN market_data.market_cap_rank IS '시가총액 순위';
COMMENT ON COLUMN market_data.current_price_usd IS '현재 가격 USD';
COMMENT ON COLUMN market_data.market_cap_usd IS '시가총액 USD';
COMMENT ON COLUMN market_data.volume_24h_usd IS '24시간 거래량 USD';

-- ========================================
-- 3️⃣ 투자 데이터 전용 테이블 생성
-- ========================================

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 투자 라운드 기본 정보
  round_type VARCHAR(50) NOT NULL, -- 'Seed', 'Series A', 'Series B', 'Private Sale', 'Public Sale', 'Strategic'
  round_name VARCHAR(100), -- 'Series A Round', 'Strategic Investment' 등
  date DATE NOT NULL,
  
  -- 투자 금액 정보
  amount_usd BIGINT NOT NULL,
  valuation_pre_money_usd BIGINT,
  valuation_post_money_usd BIGINT,
  
  -- 투자자 정보
  lead_investor VARCHAR(255),
  investors TEXT[] NOT NULL, -- 주요 투자자 배열
  investor_count INTEGER,
  
  -- 추가 정보
  announcement_url TEXT,
  notes TEXT,
  
  -- 데이터 소스
  data_source VARCHAR(50), -- 'cryptorank', 'crunchbase', 'manual'
  source_url TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 투자 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_investments_project_id ON investments(project_id);
CREATE INDEX IF NOT EXISTS idx_investments_date ON investments(date);
CREATE INDEX IF NOT EXISTS idx_investments_round_type ON investments(round_type);
CREATE INDEX IF NOT EXISTS idx_investments_amount ON investments(amount_usd);

-- 투자 테이블 설명
COMMENT ON TABLE investments IS '프로젝트 투자 라운드 정보';
COMMENT ON COLUMN investments.round_type IS '투자 라운드 유형 (Seed, Series A, Private Sale 등)';
COMMENT ON COLUMN investments.amount_usd IS '투자 금액 USD';
COMMENT ON COLUMN investments.investors IS '주요 투자자 배열';
COMMENT ON COLUMN investments.data_source IS '데이터 소스 (cryptorank, crunchbase, manual)';

-- ========================================
-- 4️⃣ SNS 계정 테이블 개선
-- ========================================

-- 새로운 컬럼 추가
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS subscriber_count INTEGER DEFAULT 0;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS last_post_date DATE;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS posts_last_30d INTEGER DEFAULT 0;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS engagement_rate DECIMAL(5,2);
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS ai_activity_level VARCHAR(20);
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS is_official BOOLEAN DEFAULT true;
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';

-- SNS 계정 인덱스
CREATE INDEX IF NOT EXISTS idx_sns_accounts_project_id ON sns_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_sns_accounts_platform ON sns_accounts(platform);
CREATE INDEX IF NOT EXISTS idx_sns_accounts_official ON sns_accounts(is_official);

-- SNS 계정 테이블 설명
COMMENT ON COLUMN sns_accounts.subscriber_count IS '구독자 수 (채널/그룹용)';
COMMENT ON COLUMN sns_accounts.last_post_date IS '마지막 포스트 날짜';
COMMENT ON COLUMN sns_accounts.posts_last_30d IS '최근 30일 포스트 수';
COMMENT ON COLUMN sns_accounts.engagement_rate IS '참여율 (%)';
COMMENT ON COLUMN sns_accounts.ai_activity_level IS 'AI 분석 활동 수준 (high, medium, low, inactive)';
COMMENT ON COLUMN sns_accounts.is_verified IS '인증된 계정 여부';
COMMENT ON COLUMN sns_accounts.is_official IS '공식 계정 여부';
COMMENT ON COLUMN sns_accounts.status IS '계정 상태 (active, inactive, suspended)';

-- ========================================
-- 5️⃣ RLS (Row Level Security) 정책 설정
-- ========================================

-- market_data 테이블 RLS 활성화
ALTER TABLE market_data ENABLE ROW LEVEL SECURITY;

-- market_data 정책 생성
DROP POLICY IF EXISTS "Allow all operations on market_data" ON market_data;
CREATE POLICY "Allow all operations on market_data" ON market_data
  FOR ALL USING (true) WITH CHECK (true);

-- investments 테이블 RLS 활성화
ALTER TABLE investments ENABLE ROW LEVEL SECURITY;

-- investments 정책 생성
DROP POLICY IF EXISTS "Allow all operations on investments" ON investments;
CREATE POLICY "Allow all operations on investments" ON investments
  FOR ALL USING (true) WITH CHECK (true);

-- ========================================
-- 6️⃣ 유용한 뷰 생성 (선택사항)
-- ========================================

-- 프로젝트 전체 정보 뷰
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

-- 뷰 설명
COMMENT ON VIEW project_overview IS '프로젝트 전체 정보 통합 뷰 (마켓 데이터 + 최신 투자 정보 포함)';

-- ========================================
-- 7️⃣ 데이터 검증 및 확인
-- ========================================

-- 테이블 목록 확인
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'market_data', 'investments', 'sns_accounts')
ORDER BY tablename;

-- 컬럼 정보 확인
SELECT 
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name IN ('projects', 'market_data', 'investments', 'sns_accounts')
ORDER BY table_name, ordinal_position;

-- 인덱스 확인
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('projects', 'market_data', 'investments', 'sns_accounts')
ORDER BY tablename, indexname;

-- ========================================
-- ✅ 마이그레이션 완료!
-- ========================================

-- 성공 메시지
SELECT 
  '🎉 정규화된 데이터베이스 스키마 마이그레이션이 성공적으로 완료되었습니다!' as message,
  '📊 4개의 전문화된 테이블이 준비되었습니다: projects, market_data, investments, sns_accounts' as details;

-- CoinGecko API 통합을 위한 projects 테이블 스키마 업데이트
-- 실행 일시: 2025년 1월
-- 목적: CoinGecko API 공식 마이그레이션에 따른 새 필드 추가

-- 1. 새로운 컬럼들 추가
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS current_price DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS market_cap BIGINT,
ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL(10,4);

-- 2. 컬럼 코멘트 추가 (문서화)
COMMENT ON COLUMN projects.current_price IS 'CoinGecko API에서 가져온 현재 가격 (USD)';
COMMENT ON COLUMN projects.market_cap IS 'CoinGecko API에서 가져온 시가총액 (USD)';
COMMENT ON COLUMN projects.price_change_24h IS 'CoinGecko API에서 가져온 24시간 가격 변동률 (%)';

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_projects_current_price ON projects(current_price) WHERE current_price IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_market_cap ON projects(market_cap) WHERE market_cap IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_projects_price_change_24h ON projects(price_change_24h) WHERE price_change_24h IS NOT NULL;

-- 4. 데이터 검증 제약 조건 추가
ALTER TABLE projects 
ADD CONSTRAINT check_current_price_positive CHECK (current_price IS NULL OR current_price >= 0),
ADD CONSTRAINT check_market_cap_positive CHECK (market_cap IS NULL OR market_cap >= 0),
ADD CONSTRAINT check_price_change_reasonable CHECK (price_change_24h IS NULL OR price_change_24h BETWEEN -100 AND 1000);

-- 5. RLS (Row Level Security) 정책 업데이트 (기존 정책 상속)
-- 새로운 컬럼들은 기존 RLS 정책을 자동으로 상속받습니다.

-- 6. 업데이트 확인 쿼리
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('current_price', 'market_cap', 'price_change_24h')
ORDER BY ordinal_position;

-- 7. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO projects (name, token_symbol, current_price, market_cap, price_change_24h)
-- VALUES ('Test Project', 'TEST', 1.23, 1000000, 5.67)
-- ON CONFLICT (name) DO NOTHING;

-- 8. 성능 통계 업데이트
ANALYZE projects;

-- 완료 메시지
SELECT 'CoinGecko 스키마 업데이트 완료! 새로운 컬럼: current_price, market_cap, price_change_24h' AS status;

-- CoinGecko API 통합을 위한 projects 테이블 스키마 업데이트 (안전 버전)
-- 실행 일시: 2025년 1월
-- 목적: CoinGecko API 공식 마이그레이션에 따른 새 필드 추가
-- 특징: 기존 제약 조건 및 인덱스를 안전하게 처리

-- 1. 기존 제약 조건 제거 (존재하는 경우)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_current_price_positive;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_market_cap_positive;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_price_change_reasonable;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS check_market_cap_rank_positive;

-- 2. 기존 인덱스 제거 (존재하는 경우)
DROP INDEX IF EXISTS idx_projects_current_price;
DROP INDEX IF EXISTS idx_projects_market_cap;
DROP INDEX IF EXISTS idx_projects_price_change_24h;
DROP INDEX IF EXISTS idx_projects_market_cap_rank;

-- 3. 새로운 컬럼들 추가 (존재하지 않는 경우만)
ALTER TABLE projects 
ADD COLUMN IF NOT EXISTS market_cap_rank INTEGER,
ADD COLUMN IF NOT EXISTS current_price DECIMAL(20,8),
ADD COLUMN IF NOT EXISTS market_cap BIGINT,
ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL(10,4);

-- 4. 컬럼 코멘트 추가/업데이트
COMMENT ON COLUMN projects.market_cap_rank IS 'CoinGecko API에서 가져온 시가총액 순위';
COMMENT ON COLUMN projects.current_price IS 'CoinGecko API에서 가져온 현재 가격 (USD)';
COMMENT ON COLUMN projects.market_cap IS 'CoinGecko API에서 가져온 시가총액 (USD)';
COMMENT ON COLUMN projects.price_change_24h IS 'CoinGecko API에서 가져온 24시간 가격 변동률 (%)';

-- 5. 인덱스 재생성
CREATE INDEX idx_projects_market_cap_rank ON projects(market_cap_rank) WHERE market_cap_rank IS NOT NULL;
CREATE INDEX idx_projects_current_price ON projects(current_price) WHERE current_price IS NOT NULL;
CREATE INDEX idx_projects_market_cap ON projects(market_cap) WHERE market_cap IS NOT NULL;
CREATE INDEX idx_projects_price_change_24h ON projects(price_change_24h) WHERE price_change_24h IS NOT NULL;

-- 6. 제약 조건 재생성
ALTER TABLE projects 
ADD CONSTRAINT check_market_cap_rank_positive CHECK (market_cap_rank IS NULL OR market_cap_rank > 0),
ADD CONSTRAINT check_current_price_positive CHECK (current_price IS NULL OR current_price >= 0),
ADD CONSTRAINT check_market_cap_positive CHECK (market_cap IS NULL OR market_cap >= 0),
ADD CONSTRAINT check_price_change_reasonable CHECK (price_change_24h IS NULL OR price_change_24h BETWEEN -100 AND 1000);

-- 7. 성능 통계 업데이트
ANALYZE projects;

-- 8. 업데이트 확인 쿼리
SELECT 
    'CoinGecko 스키마 안전 업데이트 완료!' AS status,
    COUNT(*) AS new_columns_count
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('market_cap_rank', 'current_price', 'market_cap', 'price_change_24h');

-- 9. 각 컬럼 상세 정보 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    character_maximum_length,
    numeric_precision,
    numeric_scale
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('market_cap_rank', 'current_price', 'market_cap', 'price_change_24h')
ORDER BY ordinal_position;

-- 10. 제약 조건 확인 (PostgreSQL 12+ 호환)
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
  AND (conname LIKE 'check_%_positive' OR conname LIKE 'check_%_reasonable');

-- 11. 인덱스 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects' 
  AND indexname LIKE 'idx_projects_%';

-- 완료 메시지
SELECT 'CoinGecko 스키마 안전 업데이트가 성공적으로 완료되었습니다!' AS final_status;

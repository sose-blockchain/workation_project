-- CoinGecko 스키마 업데이트 - 간단한 버전
-- PostgreSQL 모든 버전 호환
-- 오류 발생 시 무시하고 계속 진행

-- 1. 기존 제약 조건 제거 (오류 무시)
DO $$ 
BEGIN
    -- check_current_price_positive 제거
    BEGIN
        ALTER TABLE projects DROP CONSTRAINT check_current_price_positive;
        RAISE NOTICE 'check_current_price_positive 제약 조건 제거됨';
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE 'check_current_price_positive 제약 조건이 존재하지 않음';
    END;

    -- check_market_cap_positive 제거
    BEGIN
        ALTER TABLE projects DROP CONSTRAINT check_market_cap_positive;
        RAISE NOTICE 'check_market_cap_positive 제약 조건 제거됨';
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE 'check_market_cap_positive 제약 조건이 존재하지 않음';
    END;

    -- check_price_change_reasonable 제거
    BEGIN
        ALTER TABLE projects DROP CONSTRAINT check_price_change_reasonable;
        RAISE NOTICE 'check_price_change_reasonable 제약 조건 제거됨';
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE 'check_price_change_reasonable 제약 조건이 존재하지 않음';
    END;

    -- check_market_cap_rank_positive 제거
    BEGIN
        ALTER TABLE projects DROP CONSTRAINT check_market_cap_rank_positive;
        RAISE NOTICE 'check_market_cap_rank_positive 제약 조건 제거됨';
    EXCEPTION WHEN undefined_object THEN
        RAISE NOTICE 'check_market_cap_rank_positive 제약 조건이 존재하지 않음';
    END;
END $$;

-- 2. 기존 인덱스 제거 (EXISTS 체크 없이 안전하게)
DROP INDEX IF EXISTS idx_projects_current_price;
DROP INDEX IF EXISTS idx_projects_market_cap;
DROP INDEX IF EXISTS idx_projects_price_change_24h;
DROP INDEX IF EXISTS idx_projects_market_cap_rank;

-- 3. 새로운 컬럼 추가 (이미 존재하면 무시)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS market_cap_rank INTEGER;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS current_price DECIMAL(20,8);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS market_cap BIGINT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS price_change_24h DECIMAL(10,4);

-- 4. 컬럼 코멘트 추가
COMMENT ON COLUMN projects.market_cap_rank IS 'CoinGecko API에서 가져온 시가총액 순위';
COMMENT ON COLUMN projects.current_price IS 'CoinGecko API에서 가져온 현재 가격 (USD)';
COMMENT ON COLUMN projects.market_cap IS 'CoinGecko API에서 가져온 시가총액 (USD)';
COMMENT ON COLUMN projects.price_change_24h IS 'CoinGecko API에서 가져온 24시간 가격 변동률 (%)';

-- 5. 인덱스 생성
CREATE INDEX idx_projects_market_cap_rank ON projects(market_cap_rank) WHERE market_cap_rank IS NOT NULL;
CREATE INDEX idx_projects_current_price ON projects(current_price) WHERE current_price IS NOT NULL;
CREATE INDEX idx_projects_market_cap ON projects(market_cap) WHERE market_cap IS NOT NULL;
CREATE INDEX idx_projects_price_change_24h ON projects(price_change_24h) WHERE price_change_24h IS NOT NULL;

-- 6. 제약 조건 생성
ALTER TABLE projects ADD CONSTRAINT check_market_cap_rank_positive 
    CHECK (market_cap_rank IS NULL OR market_cap_rank > 0);

ALTER TABLE projects ADD CONSTRAINT check_current_price_positive 
    CHECK (current_price IS NULL OR current_price >= 0);

ALTER TABLE projects ADD CONSTRAINT check_market_cap_positive 
    CHECK (market_cap IS NULL OR market_cap >= 0);

ALTER TABLE projects ADD CONSTRAINT check_price_change_reasonable 
    CHECK (price_change_24h IS NULL OR price_change_24h BETWEEN -100 AND 1000);

-- 7. 통계 업데이트
ANALYZE projects;

-- 8. 결과 확인
SELECT 
    'CoinGecko 스키마 업데이트 완료!' AS status,
    COUNT(*) AS new_columns_added
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('market_cap_rank', 'current_price', 'market_cap', 'price_change_24h');

-- 9. 추가된 컬럼 상세 정보
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('market_cap_rank', 'current_price', 'market_cap', 'price_change_24h')
ORDER BY column_name;

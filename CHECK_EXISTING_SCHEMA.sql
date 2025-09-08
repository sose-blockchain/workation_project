-- 기존 projects 테이블 스키마 확인 쿼리
-- 목적: CoinGecko 관련 컬럼과 제약 조건이 이미 존재하는지 확인

-- 1. 현재 projects 테이블의 모든 컬럼 확인
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
ORDER BY ordinal_position;

-- 2. CoinGecko 관련 컬럼만 확인
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'projects' 
  AND column_name IN ('market_cap_rank', 'current_price', 'market_cap', 'price_change_24h');

-- 3. 기존 제약 조건 확인 (PostgreSQL 12+ 호환)
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass;

-- 4. 기존 인덱스 확인
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects';

-- 5. CoinGecko 관련 제약 조건만 확인
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint 
WHERE conrelid = 'projects'::regclass 
  AND (conname LIKE '%price%' OR conname LIKE '%market%');

-- 결과 해석:
-- - 컬럼이 이미 존재하면: ADD COLUMN IF NOT EXISTS 사용
-- - 제약 조건이 이미 존재하면: DROP 후 재생성 필요
-- - 인덱스가 이미 존재하면: DROP 후 재생성 필요

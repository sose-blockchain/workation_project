-- 🚨 즉시 실행 - Twitter 계정 관리 오류 해결 SQL
-- 이 SQL은 모든 누락된 컬럼을 안전하게 추가합니다

-- 1. 누락된 created_at_twitter 컬럼 추가 (핵심 문제 해결)
ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS created_at_twitter TIMESTAMP;

-- 2. 스케줄러 관련 컬럼들 추가
ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3;

ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS api_calls_used INTEGER DEFAULT 0;

ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS collection_interval_hours INTEGER DEFAULT 24;

ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0;

ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS last_error TEXT;

ALTER TABLE twitter_accounts 
ADD COLUMN IF NOT EXISTS next_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- 3. API 사용량 추적 테이블 생성
CREATE TABLE IF NOT EXISTS twitter_api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month VARCHAR(7) NOT NULL,
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    accounts_processed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month)
);

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_priority 
ON twitter_accounts(priority, is_active);

CREATE INDEX IF NOT EXISTS idx_twitter_accounts_next_collection 
ON twitter_accounts(next_collection) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_twitter_api_usage_month 
ON twitter_api_usage(month DESC);

-- 5. 기존 계정들 우선순위 업데이트
UPDATE twitter_accounts 
SET priority = CASE 
    WHEN followers_count > 100000 THEN 1
    WHEN followers_count > 10000 THEN 2  
    WHEN followers_count > 1000 THEN 3
    ELSE 4
END
WHERE priority = 3 OR priority IS NULL;

-- 6. RLS 정책 (선택적)
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "twitter_api_usage_select_policy" ON twitter_api_usage;
CREATE POLICY "twitter_api_usage_select_policy" 
ON twitter_api_usage FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "twitter_api_usage_insert_policy" ON twitter_api_usage;
CREATE POLICY "twitter_api_usage_insert_policy" 
ON twitter_api_usage FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "twitter_api_usage_update_policy" ON twitter_api_usage;
CREATE POLICY "twitter_api_usage_update_policy" 
ON twitter_api_usage FOR UPDATE 
USING (true);

-- 완료 메시지
SELECT '🎉 Twitter 계정 관리 오류 해결 완료!' as result;

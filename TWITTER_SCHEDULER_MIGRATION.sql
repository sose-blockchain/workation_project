-- Twitter 스케줄러 시스템 마이그레이션
-- 실행 날짜: 2025-01-28
-- 버전: 2.0.0 (스케줄러 통합 업데이트)

-- 기존 twitter_accounts 테이블에 스케줄러 관련 컬럼 추가
DO $$ 
BEGIN
    -- priority 컬럼 추가 (우선순위: 1=높음, 5=낮음)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN priority INTEGER DEFAULT 3;
        
        COMMENT ON COLUMN twitter_accounts.priority IS '우선순위 (1=높음, 5=낮음)';
    END IF;

    -- api_calls_used 컬럼 추가 (월 사용량 추적)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'api_calls_used'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN api_calls_used INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN twitter_accounts.api_calls_used IS '현재 월 API 호출 횟수';
    END IF;

    -- collection_interval_hours 컬럼 추가 (수집 간격)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'collection_interval_hours'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN collection_interval_hours INTEGER DEFAULT 24;
        
        COMMENT ON COLUMN twitter_accounts.collection_interval_hours IS '데이터 수집 간격 (시간)';
    END IF;

    -- is_active 컬럼 추가 (활성화 상태)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        
        COMMENT ON COLUMN twitter_accounts.is_active IS '스케줄러 활성화 상태';
    END IF;

    -- error_count 컬럼 추가 (오류 횟수)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'error_count'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN error_count INTEGER DEFAULT 0;
        
        COMMENT ON COLUMN twitter_accounts.error_count IS '연속 오류 발생 횟수';
    END IF;

    -- last_error 컬럼 추가 (마지막 오류 메시지)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'last_error'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN last_error TEXT;
        
        COMMENT ON COLUMN twitter_accounts.last_error IS '마지막 오류 메시지';
    END IF;

    -- next_collection 컬럼 추가 (다음 수집 예정 시간)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'next_collection'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN next_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        
        COMMENT ON COLUMN twitter_accounts.next_collection IS '다음 데이터 수집 예정 시간';
    END IF;

    RAISE NOTICE 'Twitter 스케줄러 마이그레이션 완료';
END $$;

-- 기존 계정들의 우선순위 초기 계산
UPDATE twitter_accounts 
SET priority = CASE 
    WHEN followers_count > 100000 THEN 1  -- 인플루언서급
    WHEN followers_count > 10000 THEN 2   -- 중간급
    WHEN followers_count > 1000 THEN 3    -- 일반
    ELSE 4                                -- 소규모
END
WHERE priority = 3; -- 기본값만 업데이트

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_priority 
ON twitter_accounts(priority, is_active);

CREATE INDEX IF NOT EXISTS idx_twitter_accounts_next_collection 
ON twitter_accounts(next_collection) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_twitter_accounts_project_active 
ON twitter_accounts(project_id, is_active);

-- API 사용량 추적을 위한 새 테이블 (선택적)
CREATE TABLE IF NOT EXISTS twitter_api_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month VARCHAR(7) NOT NULL, -- YYYY-MM 형식
    total_calls INTEGER DEFAULT 0,
    successful_calls INTEGER DEFAULT 0,
    failed_calls INTEGER DEFAULT 0,
    accounts_processed INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(month)
);

-- API 사용량 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_twitter_api_usage_month 
ON twitter_api_usage(month DESC);

-- 트리거 생성: twitter_accounts 업데이트 시 updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_twitter_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_twitter_accounts_updated_at ON twitter_accounts;
CREATE TRIGGER trigger_twitter_accounts_updated_at
    BEFORE UPDATE ON twitter_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_accounts_updated_at();

-- 트리거 생성: API 사용량 업데이트
CREATE OR REPLACE FUNCTION update_twitter_api_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trigger_twitter_api_usage_updated_at ON twitter_api_usage;
CREATE TRIGGER trigger_twitter_api_usage_updated_at
    BEFORE UPDATE ON twitter_api_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_api_usage_updated_at();

-- Row Level Security (RLS) 정책 추가
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "모든 사용자가 API 사용량 조회 가능" 
ON twitter_api_usage FOR SELECT 
USING (true);

CREATE POLICY "모든 사용자가 API 사용량 삽입 가능" 
ON twitter_api_usage FOR INSERT 
WITH CHECK (true);

CREATE POLICY "모든 사용자가 API 사용량 업데이트 가능" 
ON twitter_api_usage FOR UPDATE 
USING (true);

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Twitter 스케줄러 마이그레이션 완료!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '추가된 컬럼들:';
    RAISE NOTICE '- priority: 우선순위 (1=높음, 5=낮음)';
    RAISE NOTICE '- api_calls_used: 월 API 사용량';
    RAISE NOTICE '- collection_interval_hours: 수집 간격';
    RAISE NOTICE '- is_active: 활성화 상태';
    RAISE NOTICE '- error_count: 오류 횟수';
    RAISE NOTICE '- last_error: 마지막 오류';
    RAISE NOTICE '- next_collection: 다음 수집 시간';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '새 테이블: twitter_api_usage (사용량 추적)';
    RAISE NOTICE '===========================================';
END $$;

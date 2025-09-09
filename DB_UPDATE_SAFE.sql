-- Twitter 스케줄러 시스템 - 안전한 업데이트 SQL
-- 이미 마이그레이션이 실행된 경우에도 안전하게 실행 가능
-- 실행 날짜: 2025-01-28

-- 기존 twitter_accounts 테이블에 스케줄러 관련 컬럼 추가 (중복 실행 방지)
DO $$ 
BEGIN
    RAISE NOTICE '🔄 Twitter 스케줄러 안전 업데이트 시작...';

    -- priority 컬럼 추가 (우선순위: 1=높음, 5=낮음)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'priority'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN priority INTEGER DEFAULT 3;
        RAISE NOTICE '✅ priority 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ priority 컬럼 이미 존재함';
    END IF;

    -- api_calls_used 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'api_calls_used'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN api_calls_used INTEGER DEFAULT 0;
        RAISE NOTICE '✅ api_calls_used 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ api_calls_used 컬럼 이미 존재함';
    END IF;

    -- collection_interval_hours 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'collection_interval_hours'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN collection_interval_hours INTEGER DEFAULT 24;
        RAISE NOTICE '✅ collection_interval_hours 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ collection_interval_hours 컬럼 이미 존재함';
    END IF;

    -- is_active 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
        RAISE NOTICE '✅ is_active 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ is_active 컬럼 이미 존재함';
    END IF;

    -- error_count 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'error_count'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN error_count INTEGER DEFAULT 0;
        RAISE NOTICE '✅ error_count 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ error_count 컬럼 이미 존재함';
    END IF;

    -- last_error 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'last_error'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN last_error TEXT;
        RAISE NOTICE '✅ last_error 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ last_error 컬럼 이미 존재함';
    END IF;

    -- next_collection 컬럼 추가
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'next_collection'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN next_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        RAISE NOTICE '✅ next_collection 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ next_collection 컬럼 이미 존재함';
    END IF;

    -- created_at_twitter 컬럼 추가 (누락된 필수 컬럼)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'twitter_accounts' 
        AND column_name = 'created_at_twitter'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD COLUMN created_at_twitter TIMESTAMP;
        RAISE NOTICE '✅ created_at_twitter 컬럼 추가됨';
    ELSE
        RAISE NOTICE '⏭️ created_at_twitter 컬럼 이미 존재함';
    END IF;

END $$;

-- API 사용량 추적 테이블 생성 (중복 실행 방지)
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

-- 인덱스 추가 (이미 존재하면 무시됨)
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_priority 
ON twitter_accounts(priority, is_active);

CREATE INDEX IF NOT EXISTS idx_twitter_accounts_next_collection 
ON twitter_accounts(next_collection) 
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_twitter_accounts_project_active 
ON twitter_accounts(project_id, is_active);

CREATE INDEX IF NOT EXISTS idx_twitter_api_usage_month 
ON twitter_api_usage(month DESC);

-- 기존 계정들의 우선순위 계산 (priority가 기본값인 경우만)
UPDATE twitter_accounts 
SET priority = CASE 
    WHEN followers_count > 100000 THEN 1  -- 인플루언서급
    WHEN followers_count > 10000 THEN 2   -- 중간급
    WHEN followers_count > 1000 THEN 3    -- 일반
    ELSE 4                                -- 소규모
END
WHERE priority = 3; -- 기본값만 업데이트

-- RLS 활성화 (이미 활성화되어 있어도 에러 없음)
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- 정책들 안전하게 재생성
DO $$
BEGIN
    -- SELECT 정책
    BEGIN
        DROP POLICY IF EXISTS "모든 사용자가 API 사용량 조회 가능" ON twitter_api_usage;
        CREATE POLICY "모든 사용자가 API 사용량 조회 가능" 
        ON twitter_api_usage FOR SELECT 
        USING (true);
        RAISE NOTICE '✅ SELECT 정책 생성됨';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ SELECT 정책 생성 중 오류 (무시됨): %', SQLERRM;
    END;

    -- INSERT 정책
    BEGIN
        DROP POLICY IF EXISTS "모든 사용자가 API 사용량 삽입 가능" ON twitter_api_usage;
        CREATE POLICY "모든 사용자가 API 사용량 삽입 가능" 
        ON twitter_api_usage FOR INSERT 
        WITH CHECK (true);
        RAISE NOTICE '✅ INSERT 정책 생성됨';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ INSERT 정책 생성 중 오류 (무시됨): %', SQLERRM;
    END;

    -- UPDATE 정책
    BEGIN
        DROP POLICY IF EXISTS "모든 사용자가 API 사용량 업데이트 가능" ON twitter_api_usage;
        CREATE POLICY "모든 사용자가 API 사용량 업데이트 가능" 
        ON twitter_api_usage FOR UPDATE 
        USING (true);
        RAISE NOTICE '✅ UPDATE 정책 생성됨';
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '⚠️ UPDATE 정책 생성 중 오류 (무시됨): %', SQLERRM;
    END;
END $$;

-- 트리거 함수들 생성 (이미 있으면 교체됨)
CREATE OR REPLACE FUNCTION update_twitter_accounts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_twitter_api_usage_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거들 생성 (이미 있으면 교체됨)
DROP TRIGGER IF EXISTS trigger_twitter_accounts_updated_at ON twitter_accounts;
CREATE TRIGGER trigger_twitter_accounts_updated_at
    BEFORE UPDATE ON twitter_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_accounts_updated_at();

DROP TRIGGER IF EXISTS trigger_twitter_api_usage_updated_at ON twitter_api_usage;
CREATE TRIGGER trigger_twitter_api_usage_updated_at
    BEFORE UPDATE ON twitter_api_usage
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_api_usage_updated_at();

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE '🎉 Twitter 스케줄러 안전 업데이트 완료!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '모든 필요한 컬럼과 테이블이 준비되었습니다.';
    RAISE NOTICE '중복 실행되어도 안전하게 처리됩니다.';
    RAISE NOTICE '===========================================';
END $$;

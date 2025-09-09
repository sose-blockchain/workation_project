-- 🚨 트위터 계정 추가 오류 즉시 해결 SQL
-- Supabase SQL Editor에서 바로 실행하세요

-- 1. 필수 컬럼들 추가
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS following_count INTEGER DEFAULT 0;
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS tweet_count INTEGER DEFAULT 0;
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS created_at_twitter TIMESTAMP;

-- 2. 스케줄러 컬럼들 추가
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS priority INTEGER DEFAULT 3;
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS api_calls_used INTEGER DEFAULT 0;
ALTER TABLE twitter_accounts ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- 완료 메시지
SELECT '✅ 트위터 계정 관리 오류 해결 완료!' as result;

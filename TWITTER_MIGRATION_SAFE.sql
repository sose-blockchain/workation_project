-- ========================================
-- 🐦 트위터 기능 추가 - 안전한 마이그레이션 (중복 실행 방지)
-- 실행 날짜: 2025-01-28
-- ========================================

-- 📋 기존 정책 삭제 (필요시)
-- DROP POLICY IF EXISTS "Anyone can read twitter_accounts" ON twitter_accounts;
-- DROP POLICY IF EXISTS "Anyone can read twitter_timeline" ON twitter_timeline;

-- 1️⃣ projects 테이블에 detected_twitter_url 컬럼 추가
ALTER TABLE projects ADD COLUMN IF NOT EXISTS detected_twitter_url text;

-- 2️⃣ 트위터 계정 정보 테이블 생성
CREATE TABLE IF NOT EXISTS twitter_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL,
    
    -- Twitter API에서 가져온 기본 정보
    twitter_id VARCHAR(50) NOT NULL,
    screen_name VARCHAR(50) NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    
    -- 프로필 이미지 및 배너
    profile_image_url TEXT,
    profile_banner_url TEXT,
    
    -- 통계 정보
    followers_count INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0,
    statuses_count INTEGER DEFAULT 0,
    favourites_count INTEGER DEFAULT 0,
    
    -- 계정 정보
    verified BOOLEAN DEFAULT FALSE,
    location TEXT,
    url TEXT,
    created_at TIMESTAMP,
    
    -- 메타데이터
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'twitter_api',
    activity_score INTEGER DEFAULT 0,
    
    created_at_db TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2-1️⃣ twitter_accounts 외래키 제약조건 (존재하지 않을 때만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'twitter_accounts_project_id_fkey'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD CONSTRAINT twitter_accounts_project_id_fkey 
        FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'twitter_accounts_project_id_key'
    ) THEN
        ALTER TABLE twitter_accounts 
        ADD CONSTRAINT twitter_accounts_project_id_key 
        UNIQUE (project_id);
    END IF;
END $$;

-- 3️⃣ 트위터 타임라인 테이블 생성
CREATE TABLE IF NOT EXISTS twitter_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twitter_account_id UUID NOT NULL,
    
    -- 트윗 정보
    tweet_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL,
    
    -- 상호작용 정보
    retweet_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- 메타데이터
    is_retweet BOOLEAN DEFAULT FALSE,
    is_reply BOOLEAN DEFAULT FALSE,
    language VARCHAR(10),
    
    created_at_db TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3-1️⃣ twitter_timeline 제약조건 (존재하지 않을 때만)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'twitter_timeline_twitter_account_id_fkey'
    ) THEN
        ALTER TABLE twitter_timeline 
        ADD CONSTRAINT twitter_timeline_twitter_account_id_fkey 
        FOREIGN KEY (twitter_account_id) REFERENCES twitter_accounts(id) ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'twitter_timeline_tweet_id_key'
    ) THEN
        ALTER TABLE twitter_timeline 
        ADD CONSTRAINT twitter_timeline_tweet_id_key 
        UNIQUE (tweet_id);
    END IF;
END $$;

-- 4️⃣ 인덱스 생성 (존재하지 않을 때만)
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_project_id ON twitter_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_screen_name ON twitter_accounts(screen_name);
CREATE INDEX IF NOT EXISTS idx_twitter_timeline_account_id ON twitter_timeline(twitter_account_id);
CREATE INDEX IF NOT EXISTS idx_twitter_timeline_created_at ON twitter_timeline(created_at DESC);

-- 5️⃣ RLS 설정
ALTER TABLE twitter_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_timeline ENABLE ROW LEVEL SECURITY;

-- 6️⃣ 기존 정책 삭제 후 재생성
DROP POLICY IF EXISTS "Anyone can read twitter_accounts" ON twitter_accounts;
DROP POLICY IF EXISTS "Anyone can read twitter_timeline" ON twitter_timeline;
DROP POLICY IF EXISTS "Authenticated users can insert twitter_accounts" ON twitter_accounts;
DROP POLICY IF EXISTS "Authenticated users can update twitter_accounts" ON twitter_accounts;
DROP POLICY IF EXISTS "Authenticated users can delete twitter_accounts" ON twitter_accounts;
DROP POLICY IF EXISTS "Authenticated users can insert twitter_timeline" ON twitter_timeline;
DROP POLICY IF EXISTS "Authenticated users can update twitter_timeline" ON twitter_timeline;
DROP POLICY IF EXISTS "Authenticated users can delete twitter_timeline" ON twitter_timeline;

-- 새 정책 생성
CREATE POLICY "Anyone can read twitter_accounts" ON twitter_accounts FOR SELECT USING (true);
CREATE POLICY "Anyone can read twitter_timeline" ON twitter_timeline FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert twitter_accounts" ON twitter_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update twitter_accounts" ON twitter_accounts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete twitter_accounts" ON twitter_accounts FOR DELETE USING (true);
CREATE POLICY "Authenticated users can insert twitter_timeline" ON twitter_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update twitter_timeline" ON twitter_timeline FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete twitter_timeline" ON twitter_timeline FOR DELETE USING (true);

-- 7️⃣ 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_twitter_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_twitter_timeline_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8️⃣ 기존 트리거 삭제 후 재생성
DROP TRIGGER IF EXISTS update_twitter_accounts_timestamp ON twitter_accounts;
DROP TRIGGER IF EXISTS update_twitter_timeline_timestamp ON twitter_timeline;

CREATE TRIGGER update_twitter_accounts_timestamp
    BEFORE UPDATE ON twitter_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_account_timestamp();

CREATE TRIGGER update_twitter_timeline_timestamp
    BEFORE UPDATE ON twitter_timeline
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_timeline_timestamp();

-- 9️⃣ 프로젝트-트위터 통합 뷰 생성
CREATE OR REPLACE VIEW twitter_project_overview AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.token_symbol,
    ta.screen_name,
    ta.name as twitter_name,
    ta.followers_count,
    ta.friends_count,
    ta.verified,
    ta.activity_score,
    ta.last_updated,
    COUNT(tt.id) as recent_tweets_count
FROM projects p
LEFT JOIN twitter_accounts ta ON p.id = ta.project_id
LEFT JOIN twitter_timeline tt ON ta.id = tt.twitter_account_id 
    AND tt.created_at > CURRENT_TIMESTAMP - INTERVAL '7 days'
GROUP BY p.id, p.name, p.token_symbol, ta.screen_name, ta.name, 
         ta.followers_count, ta.friends_count, ta.verified, ta.activity_score, ta.last_updated
ORDER BY ta.followers_count DESC NULLS LAST;

-- 🔟 마이그레이션 완료 확인
DO $$
BEGIN
    RAISE NOTICE '✅ 트위터 기능 마이그레이션이 성공적으로 완료되었습니다!';
    RAISE NOTICE '   📱 projects.detected_twitter_url 컬럼 추가됨';
    RAISE NOTICE '   🐦 twitter_accounts 테이블 생성됨';
    RAISE NOTICE '   📝 twitter_timeline 테이블 생성됨';
    RAISE NOTICE '   🔒 RLS 정책 설정됨';
    RAISE NOTICE '   📊 twitter_project_overview 뷰 생성됨';
    RAISE NOTICE '   ⚡ 모든 인덱스 및 트리거 활성화됨';
    RAISE NOTICE '';
    RAISE NOTICE '🚀 이제 프로젝트를 검색하면 자동으로 트위터 정보가 수집됩니다!';
END $$;

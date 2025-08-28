-- 트위터 정보 테이블 생성 스크립트
-- 실행 날짜: 2025-01-28

-- 1. 트위터 계정 정보 테이블
CREATE TABLE IF NOT EXISTS twitter_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- Twitter API에서 가져온 기본 정보
    twitter_id VARCHAR(50) NOT NULL, -- Twitter 사용자 ID
    screen_name VARCHAR(50) NOT NULL, -- @handle
    name TEXT NOT NULL, -- 표시명
    description TEXT, -- 자기소개
    
    -- 프로필 이미지 및 배너
    profile_image_url TEXT,
    profile_banner_url TEXT,
    
    -- 통계 정보
    followers_count INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0, -- 팔로잉 수
    statuses_count INTEGER DEFAULT 0, -- 트윗 수
    favourites_count INTEGER DEFAULT 0, -- 좋아요 수
    
    -- 계정 정보
    verified BOOLEAN DEFAULT FALSE,
    location TEXT,
    url TEXT,
    created_at TIMESTAMP, -- 트위터 가입일
    
    -- 메타데이터
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'twitter_api',
    activity_score INTEGER DEFAULT 0, -- 활동도 점수 (0-100)
    
    -- 제약조건
    UNIQUE(project_id), -- 프로젝트당 하나의 트위터 계정
    
    created_at_db TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 트위터 타임라인 테이블 (최근 트윗 저장)
CREATE TABLE IF NOT EXISTS twitter_timeline (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twitter_account_id UUID NOT NULL REFERENCES twitter_accounts(id) ON DELETE CASCADE,
    
    -- 트윗 정보
    tweet_id VARCHAR(50) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL, -- 트윗 작성일
    
    -- 상호작용 정보
    retweet_count INTEGER DEFAULT 0,
    favorite_count INTEGER DEFAULT 0,
    reply_count INTEGER DEFAULT 0,
    
    -- 메타데이터
    is_retweet BOOLEAN DEFAULT FALSE,
    is_reply BOOLEAN DEFAULT FALSE,
    language VARCHAR(10),
    
    -- 제약조건
    UNIQUE(tweet_id),
    
    created_at_db TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 트위터 팔로워 분석 테이블 (선택적)
CREATE TABLE IF NOT EXISTS twitter_followers_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    twitter_account_id UUID NOT NULL REFERENCES twitter_accounts(id) ON DELETE CASCADE,
    
    -- 분석 데이터
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_followers INTEGER DEFAULT 0,
    verified_followers INTEGER DEFAULT 0,
    crypto_related_followers INTEGER DEFAULT 0,
    
    -- 팔로워 성장률
    followers_growth_7d INTEGER DEFAULT 0, -- 7일간 증가수
    followers_growth_30d INTEGER DEFAULT 0, -- 30일간 증가수
    
    -- 제약조건
    UNIQUE(twitter_account_id, analysis_date),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_project_id ON twitter_accounts(project_id);
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_screen_name ON twitter_accounts(screen_name);
CREATE INDEX IF NOT EXISTS idx_twitter_timeline_account_id ON twitter_timeline(twitter_account_id);
CREATE INDEX IF NOT EXISTS idx_twitter_timeline_created_at ON twitter_timeline(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_twitter_followers_analysis_account_id ON twitter_followers_analysis(twitter_account_id);

-- 5. RLS (Row Level Security) 설정
ALTER TABLE twitter_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_timeline ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_followers_analysis ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can read twitter_accounts" ON twitter_accounts FOR SELECT USING (true);
CREATE POLICY "Anyone can read twitter_timeline" ON twitter_timeline FOR SELECT USING (true);
CREATE POLICY "Anyone can read twitter_followers_analysis" ON twitter_followers_analysis FOR SELECT USING (true);

-- 쓰기 정책 (인증된 사용자만 수정 가능)
CREATE POLICY "Authenticated users can insert twitter_accounts" ON twitter_accounts FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update twitter_accounts" ON twitter_accounts FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete twitter_accounts" ON twitter_accounts FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert twitter_timeline" ON twitter_timeline FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update twitter_timeline" ON twitter_timeline FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete twitter_timeline" ON twitter_timeline FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert twitter_followers_analysis" ON twitter_followers_analysis FOR INSERT WITH CHECK (true);

-- 6. 업데이트 트리거 함수
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

-- 7. 트리거 생성
CREATE TRIGGER update_twitter_accounts_timestamp
    BEFORE UPDATE ON twitter_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_account_timestamp();

CREATE TRIGGER update_twitter_timeline_timestamp
    BEFORE UPDATE ON twitter_timeline
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_timeline_timestamp();

-- 8. 샘플 뷰 (조인된 데이터)
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

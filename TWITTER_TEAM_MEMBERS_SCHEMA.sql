-- 트위터 팀원 정보 테이블 생성 스크립트
-- 실행 날짜: 2025-01-28

-- 1. 트위터 팀원 정보 테이블
CREATE TABLE IF NOT EXISTS twitter_team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    twitter_account_id UUID NOT NULL REFERENCES twitter_accounts(id) ON DELETE CASCADE,
    
    -- 팀원 기본 정보
    twitter_id VARCHAR(50) NOT NULL, -- Twitter 사용자 ID
    screen_name VARCHAR(50) NOT NULL, -- @handle
    name TEXT NOT NULL, -- 표시명
    description TEXT, -- 자기소개
    
    -- 프로필 이미지
    profile_image_url TEXT,
    
    -- 통계 정보
    followers_count INTEGER DEFAULT 0,
    friends_count INTEGER DEFAULT 0,
    statuses_count INTEGER DEFAULT 0,
    favourites_count INTEGER DEFAULT 0,
    
    -- 계정 정보
    verified BOOLEAN DEFAULT FALSE,
    location TEXT,
    url TEXT,
    created_at TIMESTAMP, -- 트위터 가입일
    
    -- 팀원 관계 정보
    relationship_type VARCHAR(50) NOT NULL, -- 'following', 'affiliate', 'both'
    is_team_member BOOLEAN DEFAULT TRUE, -- 실제 팀원 여부 (AI 판단)
    confidence_score DECIMAL(3,2) DEFAULT 0.0, -- 팀원 확신도 (0.0-1.0)
    
    -- 메타데이터
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_source VARCHAR(50) DEFAULT 'twitter_api',
    
    -- 제약조건
    UNIQUE(project_id, twitter_id), -- 프로젝트당 동일한 트위터 ID는 하나만
    
    created_at_db TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 팀원 활동 분석 테이블
CREATE TABLE IF NOT EXISTS twitter_team_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_member_id UUID NOT NULL REFERENCES twitter_team_members(id) ON DELETE CASCADE,
    
    -- 활동 분석 데이터
    analysis_date DATE NOT NULL DEFAULT CURRENT_DATE,
    posts_last_7d INTEGER DEFAULT 0, -- 최근 7일 포스트 수
    posts_last_30d INTEGER DEFAULT 0, -- 최근 30일 포스트 수
    avg_engagement_rate DECIMAL(5,2) DEFAULT 0.0, -- 평균 참여율
    mentions_project_count INTEGER DEFAULT 0, -- 프로젝트 언급 횟수
    
    -- 성장 지표
    followers_growth_7d INTEGER DEFAULT 0, -- 7일간 팔로워 증가
    followers_growth_30d INTEGER DEFAULT 0, -- 30일간 팔로워 증가
    
    -- 제약조건
    UNIQUE(team_member_id, analysis_date),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_twitter_team_members_project_id ON twitter_team_members(project_id);
CREATE INDEX IF NOT EXISTS idx_twitter_team_members_twitter_account_id ON twitter_team_members(twitter_account_id);
CREATE INDEX IF NOT EXISTS idx_twitter_team_members_screen_name ON twitter_team_members(screen_name);
CREATE INDEX IF NOT EXISTS idx_twitter_team_members_relationship_type ON twitter_team_members(relationship_type);
CREATE INDEX IF NOT EXISTS idx_twitter_team_members_is_team_member ON twitter_team_members(is_team_member);
CREATE INDEX IF NOT EXISTS idx_twitter_team_activity_member_id ON twitter_team_activity(team_member_id);
CREATE INDEX IF NOT EXISTS idx_twitter_team_activity_analysis_date ON twitter_team_activity(analysis_date DESC);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE twitter_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_team_activity ENABLE ROW LEVEL SECURITY;

-- 읽기 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Anyone can read twitter_team_members" ON twitter_team_members FOR SELECT USING (true);
CREATE POLICY "Anyone can read twitter_team_activity" ON twitter_team_activity FOR SELECT USING (true);

-- 쓰기 정책 (인증된 사용자만 수정 가능)
CREATE POLICY "Authenticated users can insert twitter_team_members" ON twitter_team_members FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update twitter_team_members" ON twitter_team_members FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete twitter_team_members" ON twitter_team_members FOR DELETE USING (true);

CREATE POLICY "Authenticated users can insert twitter_team_activity" ON twitter_team_activity FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update twitter_team_activity" ON twitter_team_activity FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete twitter_team_activity" ON twitter_team_activity FOR DELETE USING (true);

-- 5. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_twitter_team_members_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. 트리거 생성
CREATE TRIGGER update_twitter_team_members_timestamp
    BEFORE UPDATE ON twitter_team_members
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_team_members_timestamp();

-- 7. 팀원 개요 뷰 (프로젝트별 팀원 정보 통합)
CREATE OR REPLACE VIEW twitter_team_overview AS
SELECT 
    p.id as project_id,
    p.name as project_name,
    p.token_symbol,
    ta.screen_name as main_twitter_handle,
    ta.name as main_twitter_name,
    ta.followers_count as main_followers_count,
    COUNT(tm.id) as total_team_members,
    COUNT(CASE WHEN tm.verified = true THEN 1 END) as verified_team_members,
    COUNT(CASE WHEN tm.relationship_type = 'affiliate' THEN 1 END) as affiliate_members,
    COUNT(CASE WHEN tm.relationship_type = 'following' THEN 1 END) as following_members,
    AVG(tm.followers_count) as avg_team_followers,
    MAX(tm.last_updated) as last_team_update
FROM projects p
LEFT JOIN twitter_accounts ta ON p.id = ta.project_id
LEFT JOIN twitter_team_members tm ON p.id = tm.project_id
GROUP BY p.id, p.name, p.token_symbol, ta.screen_name, ta.name, ta.followers_count
ORDER BY ta.followers_count DESC NULLS LAST;

-- 8. 팀원 상세 정보 뷰
CREATE OR REPLACE VIEW twitter_team_members_detail AS
SELECT 
    tm.*,
    p.name as project_name,
    p.token_symbol,
    ta.screen_name as main_twitter_handle,
    ta.name as main_twitter_name,
    ta_activity.posts_last_7d,
    ta_activity.posts_last_30d,
    ta_activity.avg_engagement_rate,
    ta_activity.followers_growth_7d,
    ta_activity.followers_growth_30d
FROM twitter_team_members tm
JOIN projects p ON tm.project_id = p.id
LEFT JOIN twitter_accounts ta ON tm.twitter_account_id = ta.id
LEFT JOIN twitter_team_activity ta_activity ON tm.id = ta_activity.team_member_id 
    AND ta_activity.analysis_date = CURRENT_DATE
ORDER BY tm.followers_count DESC;

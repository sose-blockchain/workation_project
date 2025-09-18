-- Twitter 주별 AI 분석 결과 저장 및 캐싱 시스템
-- 실행 날짜: 2025-01-28
-- 목적: AI 분석 결과를 저장하여 중복 계산 방지 및 성능 향상

-- 1. 주별 AI 분석 결과 저장 테이블
CREATE TABLE IF NOT EXISTS twitter_weekly_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    twitter_account_id UUID NOT NULL REFERENCES twitter_accounts(id) ON DELETE CASCADE,
    
    -- 분석 기간 정보
    week_start DATE NOT NULL,
    week_end DATE NOT NULL,
    week_number INTEGER NOT NULL, -- 1주차, 2주차 등
    analysis_period_weeks INTEGER NOT NULL, -- 전체 분석 기간 (4주, 8주 등)
    
    -- AI 분석 결과 (JSON 형태로 저장)
    analysis_result JSONB NOT NULL, -- 전체 AI 분석 결과
    
    -- 주요 지표들 (빠른 조회를 위해 별도 컬럼)
    sentiment VARCHAR(20) NOT NULL, -- positive, neutral, negative
    activity_level VARCHAR(20) NOT NULL, -- high, medium, low
    engagement_quality VARCHAR(20) NOT NULL, -- excellent, good, average, poor
    main_topics TEXT[], -- 주요 화제 배열
    total_tweets INTEGER DEFAULT 0,
    avg_engagement DECIMAL(10,2) DEFAULT 0,
    
    -- 생성 정보
    ai_model_version VARCHAR(50) DEFAULT 'gemini-1.5-flash',
    processing_time_seconds DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약: 프로젝트별 주별 분석은 하나만
    UNIQUE(project_id, week_start, week_end, analysis_period_weeks)
);

-- 2. 전체 트렌드 분석 결과 저장 테이블
CREATE TABLE IF NOT EXISTS twitter_trend_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    twitter_account_id UUID NOT NULL REFERENCES twitter_accounts(id) ON DELETE CASCADE,
    
    -- 분석 기간
    analysis_start_date DATE NOT NULL,
    analysis_end_date DATE NOT NULL,
    total_weeks INTEGER NOT NULL,
    
    -- 전체 트렌드 결과 (JSON)
    trends_result JSONB NOT NULL,
    
    -- 주요 통계 (빠른 조회용)
    total_tweets_analyzed INTEGER DEFAULT 0,
    avg_weekly_tweets DECIMAL(5,2) DEFAULT 0,
    dominant_sentiment VARCHAR(20),
    common_topics TEXT[],
    most_active_week_start DATE,
    best_engagement_week_start DATE,
    
    -- 생성 정보
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 유니크 제약: 프로젝트별 기간별 트렌드 분석은 하나만
    UNIQUE(project_id, analysis_start_date, analysis_end_date)
);

-- 3. AI 분석 요청 로그 테이블 (API 사용량 추적)
CREATE TABLE IF NOT EXISTS twitter_ai_analysis_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    
    -- 요청 정보
    analysis_type VARCHAR(50) NOT NULL, -- 'weekly', 'trend', 'simple'
    request_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 분석 범위
    weeks_requested INTEGER,
    tweets_analyzed INTEGER DEFAULT 0,
    
    -- 성능 정보
    api_calls_made INTEGER DEFAULT 0,
    processing_time_seconds DECIMAL(6,2),
    cache_hit BOOLEAN DEFAULT FALSE,
    
    -- 결과 정보
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- AI 서비스 정보
    ai_provider VARCHAR(50) DEFAULT 'google-gemini',
    ai_model VARCHAR(50) DEFAULT 'gemini-1.5-flash',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)

-- twitter_weekly_analysis 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_twitter_weekly_analysis_project 
ON twitter_weekly_analysis(project_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_weekly_analysis_account 
ON twitter_weekly_analysis(twitter_account_id, week_start DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_weekly_analysis_period 
ON twitter_weekly_analysis(analysis_period_weeks, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_weekly_analysis_sentiment 
ON twitter_weekly_analysis(sentiment, activity_level);

-- GIN 인덱스 (JSONB 검색용)
CREATE INDEX IF NOT EXISTS idx_twitter_weekly_analysis_result_gin 
ON twitter_weekly_analysis USING GIN (analysis_result);

CREATE INDEX IF NOT EXISTS idx_twitter_weekly_analysis_topics_gin 
ON twitter_weekly_analysis USING GIN (main_topics);

-- twitter_trend_analysis 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_twitter_trend_analysis_project 
ON twitter_trend_analysis(project_id, analysis_start_date DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_trend_analysis_period 
ON twitter_trend_analysis(total_weeks, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_trend_analysis_result_gin 
ON twitter_trend_analysis USING GIN (trends_result);

-- twitter_ai_analysis_logs 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_twitter_ai_logs_project_date 
ON twitter_ai_analysis_logs(project_id, request_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_ai_logs_type_success 
ON twitter_ai_analysis_logs(analysis_type, success, request_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_twitter_ai_logs_performance 
ON twitter_ai_analysis_logs(processing_time_seconds, api_calls_made);

-- Row Level Security (RLS) 설정
ALTER TABLE twitter_weekly_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_trend_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE twitter_ai_analysis_logs ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성
CREATE POLICY "모든 사용자가 주별 분석 조회 가능" 
ON twitter_weekly_analysis FOR SELECT 
USING (true);

CREATE POLICY "모든 사용자가 주별 분석 삽입 가능" 
ON twitter_weekly_analysis FOR INSERT 
WITH CHECK (true);

CREATE POLICY "모든 사용자가 주별 분석 업데이트 가능" 
ON twitter_weekly_analysis FOR UPDATE 
USING (true);

CREATE POLICY "모든 사용자가 트렌드 분석 조회 가능" 
ON twitter_trend_analysis FOR SELECT 
USING (true);

CREATE POLICY "모든 사용자가 트렌드 분석 삽입 가능" 
ON twitter_trend_analysis FOR INSERT 
WITH CHECK (true);

CREATE POLICY "모든 사용자가 트렌드 분석 업데이트 가능" 
ON twitter_trend_analysis FOR UPDATE 
USING (true);

CREATE POLICY "모든 사용자가 AI 로그 조회 가능" 
ON twitter_ai_analysis_logs FOR SELECT 
USING (true);

CREATE POLICY "모든 사용자가 AI 로그 삽입 가능" 
ON twitter_ai_analysis_logs FOR INSERT 
WITH CHECK (true);

-- 트리거 생성: updated_at 자동 갱신
CREATE OR REPLACE FUNCTION update_twitter_weekly_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE OR REPLACE FUNCTION update_twitter_trend_analysis_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 연결
DROP TRIGGER IF EXISTS trigger_twitter_weekly_analysis_updated_at ON twitter_weekly_analysis;
CREATE TRIGGER trigger_twitter_weekly_analysis_updated_at
    BEFORE UPDATE ON twitter_weekly_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_weekly_analysis_updated_at();

DROP TRIGGER IF EXISTS trigger_twitter_trend_analysis_updated_at ON twitter_trend_analysis;
CREATE TRIGGER trigger_twitter_trend_analysis_updated_at
    BEFORE UPDATE ON twitter_trend_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_twitter_trend_analysis_updated_at();

-- 자동 정리 함수 (성능 유지를 위해 오래된 로그 정리)
CREATE OR REPLACE FUNCTION cleanup_old_ai_analysis_logs()
RETURNS void AS $$
BEGIN
    -- 6개월 이상 된 로그 삭제
    DELETE FROM twitter_ai_analysis_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- 1년 이상 된 분석 결과 삭제 (선택적)
    -- DELETE FROM twitter_weekly_analysis 
    -- WHERE created_at < NOW() - INTERVAL '1 year';
END;
$$ LANGUAGE plpgsql;

-- 유용한 뷰 생성

-- 1. 최근 주별 분석 요약 뷰
CREATE OR REPLACE VIEW recent_weekly_analysis_summary AS
SELECT 
    p.name as project_name,
    ta.screen_name,
    wa.week_start,
    wa.week_end,
    wa.week_number,
    wa.sentiment,
    wa.activity_level,
    wa.engagement_quality,
    wa.total_tweets,
    wa.avg_engagement,
    wa.main_topics,
    wa.created_at
FROM twitter_weekly_analysis wa
JOIN projects p ON wa.project_id = p.id
JOIN twitter_accounts ta ON wa.twitter_account_id = ta.id
WHERE wa.created_at >= NOW() - INTERVAL '30 days'
ORDER BY wa.created_at DESC, wa.week_start DESC;

-- 2. AI 분석 성능 통계 뷰
CREATE OR REPLACE VIEW ai_analysis_performance_stats AS
SELECT 
    analysis_type,
    DATE_TRUNC('day', request_timestamp) as analysis_date,
    COUNT(*) as total_requests,
    COUNT(*) FILTER (WHERE success = true) as successful_requests,
    COUNT(*) FILTER (WHERE cache_hit = true) as cache_hits,
    AVG(processing_time_seconds) as avg_processing_time,
    SUM(api_calls_made) as total_api_calls,
    AVG(tweets_analyzed) as avg_tweets_analyzed
FROM twitter_ai_analysis_logs
WHERE request_timestamp >= NOW() - INTERVAL '30 days'
GROUP BY analysis_type, DATE_TRUNC('day', request_timestamp)
ORDER BY analysis_date DESC;

-- 3. 프로젝트별 분석 현황 뷰
CREATE OR REPLACE VIEW project_analysis_status AS
WITH topic_unnested AS (
    SELECT 
        p.id as project_id,
        p.name as project_name,
        ta.screen_name,
        ta.followers_count,
        wa.id as analysis_id,
        wa.created_at,
        wa.avg_engagement,
        wa.sentiment,
        unnest(wa.main_topics) as topic
    FROM projects p
    LEFT JOIN twitter_accounts ta ON p.id = ta.project_id
    LEFT JOIN twitter_weekly_analysis wa ON ta.id = wa.twitter_account_id
)
SELECT 
    project_id,
    project_name,
    screen_name,
    followers_count,
    COUNT(DISTINCT analysis_id) as total_weekly_analyses,
    MAX(created_at) as last_analysis_date,
    AVG(avg_engagement) as overall_avg_engagement,
    MODE() WITHIN GROUP (ORDER BY sentiment) as dominant_sentiment,
    ARRAY_AGG(DISTINCT topic) FILTER (WHERE topic IS NOT NULL) as all_topics
FROM topic_unnested
GROUP BY project_id, project_name, screen_name, followers_count
ORDER BY last_analysis_date DESC NULLS LAST;

-- 완료 메시지
DO $$
BEGIN
    RAISE NOTICE '===========================================';
    RAISE NOTICE 'Twitter 주별 AI 분석 시스템 설치 완료!';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '새로운 테이블들:';
    RAISE NOTICE '- twitter_weekly_analysis: 주별 AI 분석 결과';
    RAISE NOTICE '- twitter_trend_analysis: 전체 트렌드 분석';
    RAISE NOTICE '- twitter_ai_analysis_logs: AI 분석 로그';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '새로운 뷰들:';
    RAISE NOTICE '- recent_weekly_analysis_summary';
    RAISE NOTICE '- ai_analysis_performance_stats';
    RAISE NOTICE '- project_analysis_status';
    RAISE NOTICE '===========================================';
    RAISE NOTICE '캐싱 시스템: AI 분석 결과 자동 저장';
    RAISE NOTICE '성능 최적화: GIN 인덱스, 트리거, 자동 정리';
    RAISE NOTICE '===========================================';
END $$;

# 🗄️ 정규화된 데이터베이스 스키마

## 📋 테이블 구조 개요

### 1. **projects** - 프로젝트 기본 정보
### 2. **investments** - 투자 라운드 정보
### 3. **sns_accounts** - SNS 계정 정보

> **주의**: market_data 테이블은 제거되었습니다. 마켓 데이터 기능을 사용하지 않습니다.

---

## 🔄 새로운 스키마 (정규화)

### 1️⃣ **projects 테이블** - 프로젝트 기본 정보
```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  token_symbol VARCHAR(20),
  description TEXT,
  
  -- 키워드 분류
  keyword1 VARCHAR(50), -- Layer1/Layer2/DApp
  keyword2 VARCHAR(50), -- 세부 디테일 (DeFi, GameFi, Infrastructure)
  keyword3 VARCHAR(50), -- 특별한 기술/차별점
  
  -- URL 정보
  homepage_url TEXT,
  whitepaper_url TEXT,
  docs_url TEXT,
  blog_url TEXT,
  github_url TEXT,
  project_twitter_url TEXT,
  team_twitter_urls TEXT[],
  
  -- AI 분석 결과
  ai_summary TEXT,
  ai_keywords TEXT[],
  
  -- 메타데이터
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 2️⃣ **investments 테이블** - 투자 라운드 정보
```sql
CREATE TABLE investments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 투자 라운드 기본 정보
  round_type VARCHAR(50) NOT NULL, -- 'Seed', 'Series A', 'Series B', 'Private Sale', 'Public Sale', 'Strategic'
  round_name VARCHAR(100), -- 'Series A Round', 'Strategic Investment' 등
  date DATE NOT NULL,
  
  -- 투자 금액 정보
  amount_usd BIGINT NOT NULL,
  valuation_pre_money_usd BIGINT,
  valuation_post_money_usd BIGINT,
  
  -- 투자자 정보
  lead_investor VARCHAR(255),
  investors TEXT[] NOT NULL, -- 주요 투자자 배열
  investor_count INTEGER,
  
  -- 추가 정보
  announcement_url TEXT,
  notes TEXT,
  
  -- 데이터 소스
  data_source VARCHAR(50), -- 'cryptorank', 'crunchbase', 'manual'
  source_url TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 3️⃣ **sns_accounts 테이블** - SNS 계정 정보 (기존 개선)
```sql
CREATE TABLE sns_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 계정 정보
  platform VARCHAR(50) NOT NULL, -- 'twitter', 'linkedin', 'github', 'discord', 'telegram'
  account_handle VARCHAR(255) NOT NULL,
  account_name VARCHAR(255),
  account_url TEXT NOT NULL,
  
  -- 메트릭 정보
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  post_count INTEGER DEFAULT 0,
  subscriber_count INTEGER DEFAULT 0, -- 채널/그룹용
  
  -- 활동성 지표
  last_post_date DATE,
  posts_last_30d INTEGER DEFAULT 0,
  engagement_rate DECIMAL(5,2), -- 참여율 (%)
  
  -- AI 분석 결과
  ai_engagement_score DECIMAL(3,2),
  ai_activity_level VARCHAR(20), -- 'high', 'medium', 'low', 'inactive'
  
  -- 검증 상태
  is_verified BOOLEAN DEFAULT false,
  is_official BOOLEAN DEFAULT true,
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
  
  -- 타임스탬프
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 프로젝트별 플랫폼 유니크 제약
  UNIQUE(project_id, platform, account_handle)
);
```

---

## 🔗 관계형 구조의 장점

### 1. **데이터 무결성**
- 각 도메인별 전문화된 테이블
- 외래키 제약으로 데이터 일관성 보장
- 중복 데이터 최소화

### 2. **확장성**
- 새로운 투자 라운드 쉽게 추가
- 마켓 데이터 히스토리 관리 가능
- SNS 플랫폼 확장 용이

### 3. **성능**
- 각 테이블별 독립적 인덱싱
- 필요한 데이터만 조회 가능
- 효율적인 쿼리 실행

### 4. **유지보수성**
- 도메인별 로직 분리
- 개별 테이블 스키마 변경 용이
- 백업/복구 전략 세분화

---

## 📊 인덱스 설계

```sql
-- projects 테이블 인덱스
CREATE INDEX idx_projects_name ON projects(name);
CREATE INDEX idx_projects_token_symbol ON projects(token_symbol);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_keyword1 ON projects(keyword1);



-- investments 테이블 인덱스
CREATE INDEX idx_investments_project_id ON investments(project_id);
CREATE INDEX idx_investments_date ON investments(date);
CREATE INDEX idx_investments_round_type ON investments(round_type);
CREATE INDEX idx_investments_amount ON investments(amount_usd);

-- sns_accounts 테이블 인덱스
CREATE INDEX idx_sns_accounts_project_id ON sns_accounts(project_id);
CREATE INDEX idx_sns_accounts_platform ON sns_accounts(platform);
CREATE INDEX idx_sns_accounts_handle ON sns_accounts(account_handle);
CREATE INDEX idx_sns_accounts_official ON sns_accounts(is_official);
```

---

## 🔄 마이그레이션 전략

### 단계별 접근
1. **market_data 테이블 제거** (더 이상 사용하지 않음)
2. **investments 테이블 유지** (투자 정보는 계속 사용)
3. **애플리케이스 코드에서 마켓 데이터 참조 제거**

### 마켓 데이터 테이블 제거
```sql
-- market_data 테이블 삭제
DROP TABLE IF EXISTS market_data;
```

이렇게 정규화된 구조가 어떠신가요? 각 도메인이 명확하게 분리되어 관리하기 훨씬 수월할 것 같습니다.

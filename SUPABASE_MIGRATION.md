# 🗄️ Supabase 데이터베이스 마이그레이션 가이드

## 📋 변경사항 개요

### 🔄 정규화된 테이블 구조로 변경
1. **`projects`** - 프로젝트 기본 정보 (기존 + 키워드)
2. **`market_data`** - 마켓/가격 정보 (신규 테이블)
3. **`investments`** - 투자 라운드 정보 (신규 테이블)
4. **`sns_accounts`** - SNS 계정 정보 (기존 개선)

### 새로 추가된 필드들
1. **`keyword1`** - 주요 키워드 1 (Layer1/Layer2/DApp 분류)
2. **`keyword2`** - 주요 키워드 2 (세부 디테일)
3. **`keyword3`** - 주요 키워드 3 (특별한 기술/차별점)
4. **`github_url`** - GitHub 저장소 URL

## 🔄 마이그레이션 SQL

Supabase SQL Editor에서 다음 명령어들을 순서대로 실행하세요:

### 1. 키워드 컬럼들 추가
```sql
-- 주요 키워드 1 추가
ALTER TABLE projects 
ADD COLUMN keyword1 text DEFAULT NULL;

-- 주요 키워드 2 추가
ALTER TABLE projects 
ADD COLUMN keyword2 text DEFAULT NULL;

-- 주요 키워드 3 추가
ALTER TABLE projects 
ADD COLUMN keyword3 text DEFAULT NULL;

-- 컬럼에 설명 추가
COMMENT ON COLUMN projects.keyword1 IS '주요 키워드 1';
COMMENT ON COLUMN projects.keyword2 IS '주요 키워드 2'; 
COMMENT ON COLUMN projects.keyword3 IS '주요 키워드 3';
```

### 2. github_url 컬럼 추가
```sql
ALTER TABLE projects 
ADD COLUMN github_url text DEFAULT NULL;

-- 컬럼에 설명 추가
COMMENT ON COLUMN projects.github_url IS 'GitHub 저장소 URL';
```

### 3. 마켓 데이터 전용 테이블 생성
```sql
CREATE TABLE market_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  
  -- 기본 마켓 정보
  market_cap_rank INTEGER,
  current_price_usd DECIMAL(20,8),
  market_cap_usd BIGINT,
  
  -- 거래량 및 변동률
  volume_24h_usd BIGINT,
  price_change_24h DECIMAL(10,4), -- 24시간 가격 변동률 (%)
  price_change_7d DECIMAL(10,4),  -- 7일 가격 변동률 (%)
  price_change_30d DECIMAL(10,4), -- 30일 가격 변동률 (%)
  
  -- 공급량 정보
  circulating_supply BIGINT,
  total_supply BIGINT,
  max_supply BIGINT,
  
  -- 기타 지표
  fully_diluted_valuation BIGINT,
  market_cap_dominance DECIMAL(5,2), -- 시장 점유율 (%)
  
  -- 데이터 소스 및 타임스탬프
  data_source VARCHAR(50) NOT NULL, -- 'coinmarketcap', 'coingecko', 'cryptorank'
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 프로젝트별 최신 데이터 제약
  UNIQUE(project_id, data_source)
);

-- 마켓 데이터 인덱스
CREATE INDEX idx_market_data_project_id ON market_data(project_id);
CREATE INDEX idx_market_data_rank ON market_data(market_cap_rank);
CREATE INDEX idx_market_data_source ON market_data(data_source);
CREATE INDEX idx_market_data_updated ON market_data(last_updated_at);
```

### 4. 투자 데이터 전용 테이블 생성
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

-- 투자 테이블 인덱스
CREATE INDEX idx_investments_project_id ON investments(project_id);
CREATE INDEX idx_investments_date ON investments(date);
CREATE INDEX idx_investments_round_type ON investments(round_type);
CREATE INDEX idx_investments_amount ON investments(amount_usd);
```

### 5. SNS 계정 테이블 개선
```sql
-- 기존 sns_accounts 테이블 업데이트
ALTER TABLE sns_accounts ADD COLUMN subscriber_count INTEGER DEFAULT 0;
ALTER TABLE sns_accounts ADD COLUMN last_post_date DATE;
ALTER TABLE sns_accounts ADD COLUMN posts_last_30d INTEGER DEFAULT 0;
ALTER TABLE sns_accounts ADD COLUMN engagement_rate DECIMAL(5,2);
ALTER TABLE sns_accounts ADD COLUMN ai_activity_level VARCHAR(20);
ALTER TABLE sns_accounts ADD COLUMN is_verified BOOLEAN DEFAULT false;
ALTER TABLE sns_accounts ADD COLUMN is_official BOOLEAN DEFAULT true;
ALTER TABLE sns_accounts ADD COLUMN status VARCHAR(20) DEFAULT 'active';

-- SNS 계정 인덱스
CREATE INDEX idx_sns_accounts_project_id ON sns_accounts(project_id);
CREATE INDEX idx_sns_accounts_platform ON sns_accounts(platform);
CREATE INDEX idx_sns_accounts_official ON sns_accounts(is_official);
```

### 3. 변경사항 확인
```sql
-- 테이블 구조 확인
\d projects;

-- 또는
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;
```

## 🔍 업데이트된 테이블 스키마

```sql
CREATE TABLE projects (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  token_symbol text,
  description text,
  keyword1 text, -- 🆕 Layer1/Layer2/DApp 분류
  keyword2 text, -- 🆕 세부 디테일
  keyword3 text, -- 🆕 특별한 기술/차별점
  homepage_url text,
  whitepaper_url text,
  docs_url text,
  blog_url text,
  github_url text, -- 🆕 GitHub 저장소 URL
  project_twitter_url text,
  team_twitter_urls text[],
  -- 마켓 데이터
  market_cap_rank integer, -- 🆕 시가총액 순위
  current_price_usd decimal(20,8), -- 🆕 현재 가격 USD
  market_cap_usd bigint, -- 🆕 시가총액 USD
  -- 투자 데이터
  investment_rounds jsonb, -- 🆕 투자 라운드 정보
  ai_summary text,
  ai_keywords text[],
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);
```

## 🔐 Row Level Security (RLS) 정책

기존 RLS 정책들은 그대로 유지되며, 새로운 컬럼들도 자동으로 적용됩니다.

### 현재 정책 확인
```sql
-- RLS 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'projects';
```

## 📊 데이터 검증

마이그레이션 후 다음 쿼리로 데이터 무결성을 확인하세요:

### 1. 새 필드 확인
```sql
-- 새로운 필드들이 null로 초기화되었는지 확인
SELECT 
  id,
  name,
  keyword1,
  keyword2,
  keyword3,
  github_url,
  created_at
FROM projects
ORDER BY created_at DESC
LIMIT 10;
```

### 2. 키워드 제약 조건 (선택사항)
```sql
-- 키워드 길이 제한 추가 (각 키워드는 50자 이내)
ALTER TABLE projects 
ADD CONSTRAINT keyword1_length CHECK (length(keyword1) <= 50 OR keyword1 IS NULL);

ALTER TABLE projects 
ADD CONSTRAINT keyword2_length CHECK (length(keyword2) <= 50 OR keyword2 IS NULL);

ALTER TABLE projects 
ADD CONSTRAINT keyword3_length CHECK (length(keyword3) <= 50 OR keyword3 IS NULL);
```

### 3. URL 형식 검증 (선택사항)
```sql
-- GitHub URL 형식 검증 제약 추가
ALTER TABLE projects 
ADD CONSTRAINT github_url_format 
CHECK (github_url IS NULL OR github_url ~* '^https?://github\.com/.+');
```

## 🔄 롤백 방법

문제가 발생한 경우 다음 명령어로 롤백할 수 있습니다:

```sql
-- 제약 조건 제거 (추가했다면)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS keyword1_length;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS keyword2_length;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS keyword3_length;
ALTER TABLE projects DROP CONSTRAINT IF EXISTS github_url_format;

-- 컬럼 제거
ALTER TABLE projects DROP COLUMN IF EXISTS github_url;
ALTER TABLE projects DROP COLUMN IF EXISTS keyword3;
ALTER TABLE projects DROP COLUMN IF EXISTS keyword2;
ALTER TABLE projects DROP COLUMN IF EXISTS keyword1;
```

## 🧪 테스트 데이터

마이그레이션 후 다음 테스트 데이터로 기능을 확인해보세요:

```sql
-- 테스트 프로젝트 추가
INSERT INTO projects (
  name, 
  token_symbol, 
  description,
  keyword1,
  keyword2,
  keyword3,
  homepage_url,
  github_url,
  status
) VALUES (
  'ethereum',
  'ETH',
  '이더리움은 스마트 컨트랙트 기능을 갖춘 분산 블록체인 플랫폼입니다.',
  'Layer1',
  'Smart Contract',
  'DeFi',
  'https://ethereum.org',
  'https://github.com/ethereum/go-ethereum',
  'active'
);
```

## ✅ 완료 체크리스트

마이그레이션 완료 후 확인사항:

- [ ] `keyword1`, `keyword2`, `keyword3` 컬럼이 추가되었는지 확인
- [ ] `github_url` 컬럼이 추가되었는지 확인
- [ ] 기존 데이터가 손실되지 않았는지 확인
- [ ] 새로운 프로젝트 생성이 정상적으로 작동하는지 테스트
- [ ] 주요 키워드 UI가 올바르게 표시되는지 확인 (3개 개별 필드)
- [ ] GitHub URL 필드가 폼에서 작동하는지 확인
- [ ] 사이드바에서 키워드로 검색이 작동하는지 확인

## 🚨 주의사항

1. **백업**: 마이그레이션 전에 반드시 데이터베이스 백업을 생성하세요
2. **다운타임**: 이 마이그레이션은 온라인으로 수행 가능하지만, 피크 시간을 피하는 것을 권장합니다
3. **애플리케이션**: 마이그레이션과 함께 애플리케이션 코드도 함께 배포해야 합니다

---

**마이그레이션 완료 후**: 애플리케이션에서 새로운 필드들이 정상적으로 작동하는지 확인하고, 사용자에게 주요 키워드 3개와 GitHub URL 기능을 안내하세요.

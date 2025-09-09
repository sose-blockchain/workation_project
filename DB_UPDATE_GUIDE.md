# 🗃️ Supabase 데이터베이스 업데이트 가이드

## 📋 개요

Twitter 스케줄러 시스템을 위한 새로운 컬럼들을 기존 `twitter_accounts` 테이블에 추가해야 합니다.

## ⚠️ **중요: 반드시 실행 필요**

새로운 Twitter 계정 관리 및 스케줄러 기능을 사용하려면 **반드시** 아래 SQL을 Supabase에서 실행해야 합니다.

---

## 🚀 **실행 방법**

### **1. Supabase 대시보드 접속**
1. [Supabase Dashboard](https://app.supabase.com) 접속
2. 프로젝트 선택
3. 좌측 메뉴에서 **"SQL Editor"** 클릭

### **2. 마이그레이션 SQL 실행**

⚠️ **정책 오류가 발생한 경우**: `DB_UPDATE_SAFE.sql` 파일의 **안전한 SQL**을 사용하세요.

아래 **전체 SQL 코드**를 복사해서 SQL Editor에 붙여넣고 **"RUN"** 버튼 클릭:

```sql
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

-- Row Level Security (RLS) 정책 추가 (중복 실행 방지)
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 후 재생성 (안전한 방법)
DROP POLICY IF EXISTS "모든 사용자가 API 사용량 조회 가능" ON twitter_api_usage;
CREATE POLICY "모든 사용자가 API 사용량 조회 가능" 
ON twitter_api_usage FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "모든 사용자가 API 사용량 삽입 가능" ON twitter_api_usage;
CREATE POLICY "모든 사용자가 API 사용량 삽입 가능" 
ON twitter_api_usage FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "모든 사용자가 API 사용량 업데이트 가능" ON twitter_api_usage;
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
```

### **3. 실행 확인**
SQL 실행 후 아래와 같은 메시지들이 나타나면 성공:

```
NOTICE: Twitter 스케줄러 마이그레이션 완료
NOTICE: ===========================================
NOTICE: Twitter 스케줄러 마이그레이션 완료!
NOTICE: ===========================================
NOTICE: 추가된 컬럼들:
NOTICE: - priority: 우선순위 (1=높음, 5=낮음)
NOTICE: - api_calls_used: 월 API 사용량
NOTICE: - collection_interval_hours: 수집 간격
NOTICE: - is_active: 활성화 상태
NOTICE: - error_count: 오류 횟수
NOTICE: - last_error: 마지막 오류
NOTICE: - next_collection: 다음 수집 시간
NOTICE: ===========================================
NOTICE: 새 테이블: twitter_api_usage (사용량 추적)
NOTICE: ===========================================
```

---

## 📊 **추가된 기능들**

### **1. 새로운 컬럼들 (`twitter_accounts` 테이블)**

| 컬럼명 | 타입 | 기본값 | 설명 |
|--------|------|---------|------|
| `priority` | INTEGER | 3 | 우선순위 (1=높음, 5=낮음) |
| `api_calls_used` | INTEGER | 0 | 현재 월 API 호출 횟수 |
| `collection_interval_hours` | INTEGER | 24 | 데이터 수집 간격 (시간) |
| `is_active` | BOOLEAN | TRUE | 스케줄러 활성화 상태 |
| `error_count` | INTEGER | 0 | 연속 오류 발생 횟수 |
| `last_error` | TEXT | NULL | 마지막 오류 메시지 |
| `next_collection` | TIMESTAMP | 현재시간 | 다음 데이터 수집 예정 시간 |

### **2. 새로운 테이블 (`twitter_api_usage`)**

월별 API 사용량을 추적하는 테이블:

| 컬럼명 | 타입 | 설명 |
|--------|------|------|
| `id` | UUID | 고유 식별자 |
| `month` | VARCHAR(7) | 년월 (YYYY-MM) |
| `total_calls` | INTEGER | 총 API 호출 수 |
| `successful_calls` | INTEGER | 성공한 호출 수 |
| `failed_calls` | INTEGER | 실패한 호출 수 |
| `accounts_processed` | INTEGER | 처리된 계정 수 |

### **3. 성능 최적화**

- **인덱스 추가**: 우선순위, 활성 상태, 다음 수집 시간 기반
- **자동 트리거**: `updated_at` 필드 자동 갱신
- **RLS 정책**: API 사용량 테이블 보안 설정

---

## ✅ **완료 후 확인사항**

### **1. 테이블 구조 확인**
Supabase Table Editor에서 `twitter_accounts` 테이블 확인:
- 새로운 7개 컬럼이 추가되었는지 확인
- 기존 데이터가 손실되지 않았는지 확인

### **2. 새 테이블 확인**
`twitter_api_usage` 테이블이 생성되었는지 확인

### **3. 애플리케이션 테스트**
1. `/admin` 페이지 접속
2. "👥 계정 관리" 탭에서 계정 추가 테스트
3. "🔄 스케줄러 관리" 탭에서 스케줄러 실행 테스트

---

## ❌ **문제 해결**

### **오류 1: "policy already exists"**
- **원인**: 이미 마이그레이션이 실행되어 정책이 존재함
- **해결**: 아래 **안전한 SQL** 사용 (`DB_UPDATE_SAFE.sql` 파일 내용)

### **오류 2: "relation does not exist"**
- **원인**: `twitter_accounts` 테이블이 존재하지 않음
- **해결**: 먼저 `TWITTER_SCHEMA.sql` 실행 후 본 마이그레이션 실행

### **오류 3: "column already exists"**
- **원인**: 이미 마이그레이션이 실행됨
- **해결**: 정상 상황임. 스크립트가 중복 실행을 방지함

### **오류 4: 환경변수 문제**
- **원인**: Supabase 환경변수가 설정되지 않음
- **해결**: `.env.local` 파일 확인 및 Vercel 환경변수 설정 확인

---

## 🛡️ **안전한 업데이트 SQL** (오류 발생 시 사용)

정책 관련 오류가 발생한 경우 아래 SQL을 사용하세요:

```sql
-- Twitter 스케줄러 시스템 - 안전한 업데이트 SQL
-- 이미 마이그레이션이 실행된 경우에도 안전하게 실행 가능

-- 컬럼 추가 (중복 실행 방지)
DO $$ 
BEGIN
    -- 각 컬럼 존재 여부 확인 후 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'priority') THEN
        ALTER TABLE twitter_accounts ADD COLUMN priority INTEGER DEFAULT 3;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'api_calls_used') THEN
        ALTER TABLE twitter_accounts ADD COLUMN api_calls_used INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'collection_interval_hours') THEN
        ALTER TABLE twitter_accounts ADD COLUMN collection_interval_hours INTEGER DEFAULT 24;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'is_active') THEN
        ALTER TABLE twitter_accounts ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'error_count') THEN
        ALTER TABLE twitter_accounts ADD COLUMN error_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'last_error') THEN
        ALTER TABLE twitter_accounts ADD COLUMN last_error TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'next_collection') THEN
        ALTER TABLE twitter_accounts ADD COLUMN next_collection TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
    
    -- 누락된 created_at_twitter 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'twitter_accounts' AND column_name = 'created_at_twitter') THEN
        ALTER TABLE twitter_accounts ADD COLUMN created_at_twitter TIMESTAMP;
    END IF;
    
    RAISE NOTICE '✅ 모든 컬럼 추가 완료 (created_at_twitter 포함)';
END $$;

-- API 사용량 테이블 생성
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

-- 인덱스 생성 (중복 무시)
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_priority ON twitter_accounts(priority, is_active);
CREATE INDEX IF NOT EXISTS idx_twitter_accounts_next_collection ON twitter_accounts(next_collection) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_twitter_api_usage_month ON twitter_api_usage(month DESC);

-- RLS 정책 안전하게 생성
ALTER TABLE twitter_api_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "모든 사용자가 API 사용량 조회 가능" ON twitter_api_usage;
CREATE POLICY "모든 사용자가 API 사용량 조회 가능" ON twitter_api_usage FOR SELECT USING (true);

DROP POLICY IF EXISTS "모든 사용자가 API 사용량 삽입 가능" ON twitter_api_usage;
CREATE POLICY "모든 사용자가 API 사용량 삽입 가능" ON twitter_api_usage FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "모든 사용자가 API 사용량 업데이트 가능" ON twitter_api_usage;
CREATE POLICY "모든 사용자가 API 사용량 업데이트 가능" ON twitter_api_usage FOR UPDATE USING (true);

-- 완료 메시지
SELECT '✅ 안전한 마이그레이션 완료!' as result;
```

---

## 🎯 **마이그레이션 완료 후 새로운 기능들**

✅ **스마트 우선순위 시스템**: 팔로워 수 기반 자동 우선순위 계산  
✅ **API 사용량 모니터링**: 실시간 사용량 추적 및 경고  
✅ **스케줄러 대시보드**: 관리자 친화적 UI  
✅ **계정 관리**: 수동 추가/삭제/모니터링  
✅ **자동 오류 처리**: 오류 로깅 및 복구 시스템

---

**업데이트 완료일**: 2025-01-28  
**필수 실행**: ⚠️ **반드시 위 SQL을 실행해야 새 기능 사용 가능**

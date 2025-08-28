# 🗄️ Supabase 데이터베이스 마이그레이션 가이드

## 📋 변경사항 개요

### 새로 추가된 필드들
1. **`keyword1`** - 주요 키워드 1
2. **`keyword2`** - 주요 키워드 2  
3. **`keyword3`** - 주요 키워드 3
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
  keyword1 text, -- 🆕 새로 추가
  keyword2 text, -- 🆕 새로 추가
  keyword3 text, -- 🆕 새로 추가
  homepage_url text,
  whitepaper_url text,
  docs_url text,
  blog_url text,
  github_url text, -- 🆕 새로 추가
  project_twitter_url text,
  team_twitter_urls text[],
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

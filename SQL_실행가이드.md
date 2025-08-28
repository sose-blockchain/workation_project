# 🗄️ Supabase SQL Editor 실행 가이드

## 📋 실행 순서

### 1️⃣ **Supabase 대시보드 접속**
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 해당 프로젝트 선택
3. 왼쪽 메뉴에서 `SQL Editor` 클릭

### 2️⃣ **SQL 파일 업로드 (권장)**
1. `COMPLETE_MIGRATION_SQL.sql` 파일을 다운로드
2. SQL Editor에서 `+` 버튼 클릭
3. `Upload SQL file` 선택
4. 파일 업로드 후 `Run` 클릭

### 3️⃣ **직접 복사-붙여넣기 (대안)**
1. `COMPLETE_MIGRATION_SQL.sql` 파일 내용 전체 복사
2. SQL Editor에 붙여넣기
3. `Run` 또는 `Ctrl+Enter` 실행

---

## ⚠️ 주의사항

### **기존 데이터 백업**
```sql
-- 기존 projects 테이블 백업 (선택사항)
CREATE TABLE projects_backup AS SELECT * FROM projects;
```

### **실행 전 확인사항**
- ✅ 현재 `projects` 테이블 존재 여부 확인
- ✅ `sns_accounts` 테이블 존재 여부 확인  
- ✅ RLS 정책 기존 설정 확인

### **단계별 실행 (문제 발생 시)**
SQL 실행 중 오류가 발생하면 아래 순서로 단계별 실행:

#### **1단계: projects 테이블 수정**
```sql
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword1 text DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword2 text DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS keyword3 text DEFAULT NULL;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS github_url text DEFAULT NULL;
```

#### **2단계: market_data 테이블 생성**
```sql
CREATE TABLE IF NOT EXISTS market_data (
  -- 테이블 정의 (COMPLETE_MIGRATION_SQL.sql 참조)
);
```

#### **3단계: investments 테이블 생성**
```sql
CREATE TABLE IF NOT EXISTS investments (
  -- 테이블 정의 (COMPLETE_MIGRATION_SQL.sql 참조)
);
```

#### **4단계: sns_accounts 테이블 수정**
```sql
ALTER TABLE sns_accounts ADD COLUMN IF NOT EXISTS subscriber_count INTEGER DEFAULT 0;
-- 기타 컬럼들...
```

---

## 🔍 실행 결과 확인

### **테이블 생성 확인**
```sql
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('projects', 'market_data', 'investments', 'sns_accounts');
```

### **컬럼 추가 확인**  
```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'projects' 
AND column_name IN ('keyword1', 'keyword2', 'keyword3', 'github_url');
```

### **외래키 관계 확인**
```sql
SELECT 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name 
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name IN ('market_data', 'investments', 'sns_accounts');
```

---

## ✅ 성공 메시지

실행이 완료되면 다음과 같은 메시지가 표시됩니다:

```
🎉 정규화된 데이터베이스 스키마 마이그레이션이 성공적으로 완료되었습니다!
📊 4개의 전문화된 테이블이 준비되었습니다: projects, market_data, investments, sns_accounts
```

---

## 🚨 문제 해결

### **권한 오류 발생 시**
```sql
-- 테이블 소유자 확인
SELECT tablename, tableowner FROM pg_tables WHERE schemaname = 'public';

-- 권한 부여 (필요시)
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_role;
```

### **기존 제약조건 충돌 시**
```sql
-- 기존 제약조건 확인
SELECT constraint_name, constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'projects';

-- 충돌하는 제약조건 삭제 (필요시)
ALTER TABLE projects DROP CONSTRAINT IF EXISTS constraint_name;
```

### **중복 인덱스 오류 시**
```sql
-- 기존 인덱스 확인
SELECT indexname FROM pg_indexes WHERE tablename = 'projects';

-- 중복 인덱스 삭제 (필요시)  
DROP INDEX IF EXISTS index_name;
```

---

## 📞 지원

마이그레이션 과정에서 문제가 발생하면:
1. 오류 메시지 전체 복사
2. 실행한 SQL 단계 명시
3. 기존 테이블 구조 확인 후 문의

정규화된 데이터베이스로 업그레이드하여 더 나은 성능과 확장성을 경험하세요! 🚀

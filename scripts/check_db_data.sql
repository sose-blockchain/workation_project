-- 데이터베이스 중복 데이터 확인 스크립트

-- 1. 전체 프로젝트 개수 및 현황
SELECT 
  COUNT(*) as total_projects,
  COUNT(DISTINCT name) as unique_names,
  COUNT(*) - COUNT(DISTINCT name) as duplicates
FROM projects;

-- 2. 중복된 프로젝트 이름 찾기
SELECT 
  LOWER(name) as project_name,
  COUNT(*) as count,
  STRING_AGG(name, ', ') as variations,
  STRING_AGG(id::text, ', ') as project_ids
FROM projects 
GROUP BY LOWER(name) 
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 3. 최근 생성된 프로젝트 목록 (상위 10개)
SELECT 
  name,
  token_symbol,
  created_at,
  id
FROM projects 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Bitcoin 관련 프로젝트 찾기
SELECT 
  name,
  token_symbol,
  created_at,
  id,
  description
FROM projects 
WHERE LOWER(name) LIKE '%bitcoin%' 
   OR LOWER(token_symbol) LIKE '%btc%'
ORDER BY created_at DESC;

-- 5. Sui 관련 프로젝트 찾기
SELECT 
  name,
  token_symbol,
  created_at,
  id,
  description
FROM projects 
WHERE LOWER(name) LIKE '%sui%'
ORDER BY created_at DESC;

-- 6. 가장 오래된 프로젝트별로 하나씩만 남기고 중복 제거할 ID 목록
WITH ranked_projects AS (
  SELECT 
    id,
    name,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY LOWER(name) 
      ORDER BY created_at ASC
    ) as rn
  FROM projects
)
SELECT 
  'DELETE FROM projects WHERE id = ''' || id || ''';' as delete_statement
FROM ranked_projects 
WHERE rn > 1
ORDER BY name, created_at;

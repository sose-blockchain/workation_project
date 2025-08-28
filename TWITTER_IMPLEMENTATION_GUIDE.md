# 트위터 정보 통합 구현 가이드

## 📋 개요

프로젝트 검색 시 AI가 트위터 정보를 자동으로 발견하고 수집하여 프로젝트 상세 페이지에 표시하는 기능이 구현되었습니다.

## 🏗️ 아키텍처

### 1. 데이터베이스 구조
- **twitter_accounts**: 프로젝트별 트위터 계정 정보
- **twitter_timeline**: 트위터 계정의 최근 트윗
- **twitter_followers_analysis**: 팔로워 분석 데이터 (선택적)

### 2. 컴포넌트 구조
```
src/
├── types/twitter.ts           # 트위터 관련 타입 정의
├── lib/
│   ├── twitter.ts            # Twitter API 클라이언트
│   ├── twitterService.ts     # 트위터 데이터 CRUD 서비스
│   └── enhancedProjectSearch.ts  # AI 검색에 트위터 통합
└── components/
    └── TwitterInfo.tsx       # 트위터 정보 표시 컴포넌트
```

## 🚀 설치 및 설정

### 1. 데이터베이스 스키마 적용

Supabase SQL 에디터에서 `TWITTER_SCHEMA.sql` 파일을 실행:

```sql
-- 1. 트위터 계정 정보 테이블
CREATE TABLE IF NOT EXISTS twitter_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    -- ... (전체 스키마는 TWITTER_SCHEMA.sql 참조)
);

-- 2. 트위터 타임라인 테이블
CREATE TABLE IF NOT EXISTS twitter_timeline (
    -- ... (전체 스키마는 TWITTER_SCHEMA.sql 참조)
);

-- 3. 인덱스, RLS, 트리거 등 적용
```

### 2. 환경 변수 확인

`.env.local` 파일에 Twitter API 키가 설정되어 있는지 확인:

```env
# Twitter API Keys (RapidAPI)
NEXT_PUBLIC_TWITTER_API_KEY=your_rapidapi_key_here
NEXT_PUBLIC_TWITTER_API_HOST=twitter-api45.p.rapidapi.com
```

## 🔄 작동 방식

### 1. 프로젝트 검색 시 자동 트위터 발견
```typescript
// AI 검색 결과에서 트위터 URL 자동 추출
const twitterUrls = [
  aiResult.project.twitter,
  aiResult.project.social_links?.twitter,
  // ... 다양한 패턴으로 트위터 URL 탐지
].filter(Boolean);
```

### 2. 트위터 정보 자동 수집
```typescript
// 프로젝트 저장 후 트위터 정보 자동 수집
const twitterResult = await twitterService.createOrUpdateTwitterAccount({
  project_id: newProject.id,
  screen_name: handle,
  fetch_timeline: true
});
```

### 3. 프로젝트 상세 페이지에서 표시
```tsx
{/* 트위터 정보 섹션 */}
<div className="pt-4 border-t">
  <TwitterInfo 
    projectId={project.id}
    twitterUrl={project.detected_twitter_url}
  />
</div>
```

## 📊 표시되는 정보

### 트위터 계정 정보
- 프로필 이미지 및 이름
- 트위터 핸들 (@username)
- 자기소개 텍스트
- 팔로워/팔로잉/트윗 수
- 가입일
- 인증 배지 여부
- 활동도 점수 (0-100)

### 최근 활동
- 최근 트윗 5개 표시
- 트윗별 리트윗/좋아요 수
- 트윗 작성일

## 🎯 주요 기능

### 1. 자동 트위터 발견
- AI 검색 결과에서 트위터 URL 패턴 탐지
- 다양한 소셜 링크 필드에서 트위터 정보 추출

### 2. 실시간 데이터 수집
- Twitter API를 통한 실시간 계정 정보 수집
- 타임라인 정보 자동 저장

### 3. 활동도 점수 계산
- 팔로워 수, 트윗 빈도, 상호작용 등을 종합한 점수
- 0-100 점수로 계정 활성도 평가

### 4. 데이터 새로고침
- 수동 새로고침 버튼으로 최신 정보 업데이트
- 캐시된 데이터와 실시간 데이터 동기화

## 🔧 사용법

### 1. 프로젝트 검색
1. 메인 페이지에서 프로젝트명 입력
2. AI가 자동으로 트위터 정보 발견 시 수집
3. "트위터: @handle 정보 수집 완료" 메시지 확인

### 2. 트위터 정보 확인
1. 프로젝트 클릭하여 상세 페이지 열기
2. "프로젝트 트위터" 섹션에서 정보 확인
3. "새로고침" 버튼으로 최신 정보 업데이트

### 3. 수동 트위터 추가
트위터 정보가 자동으로 발견되지 않은 경우:
1. 프로젝트 편집 모드에서 트위터 URL 추가
2. 저장 후 트위터 정보 자동 수집

## 🚨 오류 처리

### 1. API 키 오류
```
Error: Twitter API Key is not set
```
→ `.env.local`에 `NEXT_PUBLIC_TWITTER_API_KEY` 확인

### 2. 계정을 찾을 수 없음
```
'@username' 사용자를 찾을 수 없습니다.
```
→ 트위터 핸들 또는 계정 상태 확인

### 3. 데이터베이스 오류
```
relation "twitter_accounts" does not exist
```
→ `TWITTER_SCHEMA.sql` 스크립트 실행 필요

## 📈 향후 개선 사항

### 1. 고급 분석
- 팔로워 증감 추적
- 키워드 기반 트윗 분석
- 영향력 지수 계산

### 2. 알림 기능
- 새 트윗 알림
- 팔로워 수 변화 알림
- 중요 트윗 하이라이트

### 3. 데이터 시각화
- 팔로워 증감 차트
- 트윗 활동 그래프
- 상호작용 트렌드

## 🔍 디버깅

### 1. 로그 확인
브라우저 개발자 도구 콘솔에서 확인:
```
🐦 트위터 계정 자동 수집 시작: @handle
✅ 트위터 계정 자동 수집 성공: @handle
```

### 2. 데이터베이스 확인
Supabase 테이블에서 데이터 저장 상태 확인:
```sql
SELECT * FROM twitter_accounts WHERE project_id = 'project-uuid';
SELECT * FROM twitter_timeline WHERE twitter_account_id = 'account-uuid';
```

### 3. API 연결 테스트
`TWITTER_API_GUIDE.md`의 테스트 코드로 API 연결 확인

---

**구현 완료일**: 2025-01-28  
**작성자**: AI Assistant  
**버전**: 1.0

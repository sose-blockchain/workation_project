# 트위터 정보 통합 구현 가이드

## 📋 개요

프로젝트 검색 시 AI가 트위터 정보를 자동으로 발견하고 수집하여 프로젝트 상세 페이지에 표시하는 기능이 구현되었습니다.

**🎯 2025년 1월 최신 업데이트**: 
- ✅ 스마트 Twitter 스케줄러 시스템 구축 완료
- ✅ 관리자 대시보드 및 계정 관리 시스템 완성 
- ✅ RapidAPI Basic 플랜 최적화 (월 1,000회 제한 대응)
- ✅ DB 기반 데이터 분석 시스템 구축

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
│   ├── twitterScheduler.ts   # 🆕 스마트 스케줄러 시스템
│   └── enhancedProjectSearch.ts  # AI 검색에 트위터 통합
├── app/
│   ├── admin/page.tsx        # 🆕 관리자 대시보드
│   └── api/
│       ├── twitter-accounts/ # 🆕 계정 관리 API
│       └── twitter-scheduler/ # 🆕 스케줄러 API
└── components/
    ├── TwitterInfo.tsx       # 트위터 정보 표시 컴포넌트
    ├── TwitterAccountManager.tsx    # 🆕 계정 관리 UI
    ├── TwitterDataAnalysis.tsx      # 🆕 DB 기반 데이터 분석
    └── TwitterSchedulerDashboard.tsx # 🆕 스케줄러 대시보드
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

## 🆕 **스마트 Twitter 스케줄러 시스템 (2025.01.28 업데이트)**

### 📋 개요
RapidAPI Basic 플랜의 월 1,000회 제한을 효율적으로 관리하면서 지속적인 Twitter 데이터 수집을 가능하게 하는 시스템입니다.

### 🚀 주요 기능

#### 1. Twitter 계정 관리 (`/admin`)
- **수동 계정 추가**: URL 또는 @handle 입력으로 간편 등록
- **실시간 모니터링**: 팔로워 수, 수집된 트윗 수, 추적 기간
- **계정별 상세 정보**: 활동도 점수, 마지막 업데이트 시간
- **일괄 관리**: 여러 계정 한번에 모니터링

#### 2. 스마트 스케줄러
```typescript
// 우선순위 기반 자동 선별
const priority = calculateAccountPriority({
  followers_count: 100000,    // 팔로워 수 (높을수록 우선)
  activity_score: 85,         // 활동도 (높을수록 우선)  
  last_updated: "2025-01-20"  // 오래될수록 우선
});
```

#### 3. API 사용량 최적화
- **일일 안전 제한**: 30회 (월 1,000회 ÷ 30일)
- **계정당 최적화**: 2회 호출 (사용자 정보 + 타임라인)
- **실시간 모니터링**: 사용량 80%, 90% 경고 시스템
- **자동 제어**: 제한 도달 시 우선순위 낮은 계정 스킵

### 🎯 핵심 컴포넌트

#### 관리자 대시보드 (`/admin`)
```bash
📊 스케줄러 관리 탭:
- API 사용량 실시간 모니터링
- 수동 스케줄러 실행
- 수집 결과 및 통계

👥 계정 관리 탭:
- 새 계정 추가 폼
- 등록된 계정 목록 및 상태
- 계정별 상세 통계
- 계정 삭제 기능
```

#### 데이터 분석 시스템
```bash
🧠 AI 기반 분석:
- 감정 분석 (긍정/부정/중립)
- 활동 수준 평가
- 주요 테마 추출
- 성장 예측 및 트렌드
```

### 📱 사용 방법

#### 1. 초기 설정
```bash
1. 메인 페이지 → "⚙️ 관리자" 클릭
2. "👥 계정 관리" 탭 선택
3. Twitter 계정 URL 또는 @handle 입력
4. "계정 추가" 버튼 클릭 → 자동 수집 시작
```

#### 2. 정기 운영
```bash
1. "🔄 스케줄러 관리" 탭 이동
2. "지금 실행하기" 버튼 클릭
3. API 사용량 확인 (권장: 주 2-3회)
4. 80% 초과 시 실행 빈도 조절
```

#### 3. 데이터 확인
```bash
1. 각 프로젝트 상세 페이지 방문
2. "AI 기반 트위터 데이터 분석" 섹션 확인
3. 감정 분석, 활동도, 성장 예측 리뷰
```

### 🔧 기술 아키텍처

#### 핵심 파일 구조
```typescript
src/
├── lib/
│   └── twitterScheduler.ts        # 스케줄러 코어 로직
├── app/
│   ├── admin/page.tsx             # 관리자 대시보드
│   └── api/
│       ├── twitter-accounts/      # 계정 관리 API
│       └── twitter-scheduler/     # 스케줄러 API
└── components/
    ├── TwitterAccountManager.tsx   # 계정 관리 UI
    ├── TwitterSchedulerDashboard.tsx # 스케줄러 대시보드
    └── TwitterDataAnalysis.tsx    # 데이터 분석 UI
```

#### 데이터 흐름
```
관리자 계정 등록 → 스케줄러 실행 → 우선순위 계산 → 
API 호출 → DB 저장 → AI 분석 → 프로젝트 페이지 표시
```

### 📊 성능 최적화

#### RapidAPI Basic 플랜 효율성
```bash
✅ 현재 최적화 수준:
- 계정 15개 기준: 월 900회 사용 (90% 효율)
- 일일 제한 준수: 30회 안전 운영
- 스마트 우선순위: 중요 계정 우선 수집
- 자동 조절: 제한 도달 시 스킵 기능
```

#### 확장 가능성
```bash
🚀 Pro 플랜 업그레이드 시:
- 월 100,000회 → 현재의 100배 확장
- 자동 스케줄링 구현 가능
- 계정 500개+ 관리 가능
- 모든 기능 제한 없이 활용
```

### ⚠️ 운영 가이드

#### 권장 사항
- **일일 실행**: 계정 15개 이하 시 매일 가능
- **격일 실행**: 계정 20개 이상 시 권장
- **주간 실행**: 계정 30개 이상 시 필수

#### 주의 사항
- API 사용량 80% 초과 시 실행 빈도 감소
- 90% 초과 시 Pro 플랜 업그레이드 고려
- 월말 사용량 리셋 후 정상 운영 재개

---

**최종 업데이트**: 2025-01-28  
**구현 완료**: 스마트 스케줄러 시스템, 관리자 대시보드, API 최적화  
**버전**: 2.0 (스케줄러 통합)

# 🚀 Workation Project 개발 인수인계 문서

## 📋 프로젝트 개요

**프로젝트명**: Workation Project  
**기술 스택**: Next.js 14, React 18, TypeScript, Tailwind CSS, Supabase PostgreSQL  
**배포 환경**: Vercel  
**개발 기간**: 2025년 1월  
**주요 기능**: 암호화폐 프로젝트 정보 검색, Twitter 활동 분석, 투자 정보 관리

---

## 🏗️ 아키텍처 및 기술 구조

### Frontend
- **Framework**: Next.js 14 (App Router)
- **언어**: TypeScript (Strict Mode)
- **스타일링**: Tailwind CSS
- **상태 관리**: React Hooks (useState, useEffect)
- **빌드 도구**: Next.js 내장 Webpack

### Backend & Database
- **주 데이터베이스**: Supabase PostgreSQL
- **인증**: Supabase Auth (현재 미사용)
- **API 라우트**: Next.js API Routes
- **외부 API**: 
  - CoinGecko 공식 API (암호화폐 데이터)
  - RapidAPI Twitter API (소셜 미디어 데이터)

### 배포 및 인프라
- **배포 플랫폼**: Vercel
- **도메인**: Vercel 제공 도메인
- **환경 변수**: Vercel Environment Variables
- **CI/CD**: GitHub → Vercel 자동 배포

---

## 📂 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   └── team-members/           # Twitter 팀원 정보 API
│   ├── globals.css                 # 전역 스타일
│   ├── layout.tsx                  # 루트 레이아웃
│   └── page.tsx                    # 메인 페이지
├── components/
│   ├── InvestmentManager.tsx       # 투자 정보 관리
│   ├── PremiumInvestmentNotice.tsx # 프리미엄 안내
│   ├── ProjectDetail.tsx           # 프로젝트 상세 정보
│   ├── ProjectSearch.tsx           # 프로젝트 검색
│   ├── ProjectSidebar.tsx          # 사이드바
│   ├── TelegramCommunityInfo.tsx   # 텔레그램 분석 (개발 중단)
│   ├── TeamMembersInfo.tsx         # 팀원 정보 표시
│   └── TwitterActivityAnalysis.tsx # AI 기반 Twitter 분석
├── lib/
│   ├── coingecko.ts               # CoinGecko API 클라이언트
│   ├── enhancedProjectSearch.ts   # 통합 검색 로직
│   ├── gemini.ts                  # Google Gemini AI
│   ├── supabase.ts                # Supabase 클라이언트
│   ├── twitter.ts                 # Twitter API 클라이언트
│   └── twitterService.ts          # Twitter 데이터 서비스
└── types/
    ├── error.ts                   # 에러 타입 정의
    ├── investment.ts              # 투자 타입
    ├── project.ts                 # 프로젝트 타입
    └── twitter.ts                 # Twitter 타입
```

---

## 🔧 주요 개발 작업 내역

### 1. CoinGecko API 마이그레이션 (RapidAPI → 공식 API)

**작업 일시**: 2025년 1월 최종  
**작업 목적**: 불안정한 RapidAPI에서 안정적인 공식 API로 전환

#### 변경된 파일:
- `src/lib/coingecko.ts` - 완전 재작성
- `src/components/PremiumInvestmentNotice.tsx` - 가격 정보 업데이트
- `src/components/InvestmentManager.tsx` - 브랜딩 변경

#### 주요 변경사항:

**이전 (RapidAPI 방식)**:
```typescript
// 헤더
headers: {
  'X-RapidAPI-Key': this.apiKey,
  'X-RapidAPI-Host': this.apiHost,
}

// 엔드포인트
'/api/v3/coins/markets'
```

**이후 (공식 API 방식)**:
```typescript
// 헤더
headers: {
  'x-cg-demo-api-key': this.apiKey,     // Demo API
  'x-cg-pro-api-key': this.apiKey,      // Pro API
}

// 엔드포인트
'/coins/markets'  // baseUrl에 이미 /api/v3 포함
```

#### 환경변수 변경:

**제거된 변수**:
- `NEXT_PUBLIC_COINGECKO_API_HOST`
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST_COINGECKO`

**새로 추가된 변수**:
```env
NEXT_PUBLIC_COINGECKO_API_KEY=your_demo_api_key
NEXT_PUBLIC_COINGECKO_PRO_API_KEY=your_pro_api_key  # 선택사항
```

#### API 구조 개선:

**새로운 메서드들**:
```typescript
class CoinGeckoAPI {
  // 마켓 데이터 직접 조회 (안정성 향상)
  async getCoinsMarketData(options): Promise<CoinGeckoProject[]>
  
  // 마켓 데이터에서 프로젝트 검색 (속도 향상)
  async searchProjectByMarketData(projectName): Promise<CoinGeckoProject | null>
  
  // 이중화된 프로젝트 정보 조회
  async getProjectInfo(projectName): Promise<CoinGeckoProject | null>
}
```

### 2. Twitter 활동 분석 AI 기능 개발

**작업 일시**: 2025년 1월 최종  
**작업 목적**: 단순 통계에서 의미있는 AI 분석으로 고도화

#### 새로 생성된 파일:
- `src/components/TwitterActivityAnalysis.tsx` (606줄)

#### 주요 기능:

**1. Timeline 파싱 개선**:
```typescript
// 트윗 시간순 정렬
const sortedTweets = tweets.sort((a, b) => {
  const dateA = new Date(a.created_at || 0).getTime();
  const dateB = new Date(b.created_at || 0).getTime();
  return dateB - dateA; // 최신순
});

// 개선된 참여도 매핑
const likes = Number(tweet.favorite_count || tweet.likes || tweet.favourites_count) || 0;
const retweets = Number(tweet.retweet_count || tweet.retweets) || 0;
const replies = Number(tweet.reply_count || tweet.replies) || 0;
```

**2. AI 기반 내용 분석**:
```typescript
// 테마 자동 추출
const techKeywords = ['blockchain', 'defi', 'nft', 'dao', 'web3'...];
const communityKeywords = ['community', 'event', 'ama', 'workshop'...];
const productKeywords = ['product', 'feature', 'release', 'beta'...];

// 감정 분석
const analyzeSentiment = (tweets): 'positive' | 'neutral' | 'negative' => {
  const positiveWords = ['great', 'excited', 'amazing'...];
  const negativeWords = ['delay', 'issue', 'problem'...];
  // 키워드 빈도 기반 감정 판단
}

// 내용 요약
const summarizeTweets = (tweets) => {
  const hasAnnouncement = tweets.some(text => 
    text.includes('announce') || text.includes('launch')
  );
  // 패턴 기반 활동 분류
}
```

**3. UI 개선사항**:
- 월별 카드에 감정 이모지 표시 (😊😐😔)
- AI 분석 결과 상세 페이지
- 테마별 색상 코딩
- 실시간 참여도 표시

#### Twitter API 파싱 개선:

**이전 문제점**:
- 트윗 순서 뒤죽박죽
- 좋아요/리트윗 수 누락
- 리트윗 감지 부정확

**해결 방법**:
```typescript
// 리트윗 감지 로직 개선
const isRetweet = Boolean(
  tweet.retweeted_status || 
  tweet.is_retweet || 
  tweetText.startsWith('RT @') ||
  tweet.retweeted
);

// retweeted_status 완전한 매핑
retweeted_status: tweet.retweeted_status ? {
  id: String(tweet.retweeted_status.id_str || tweet.retweeted_status.id || ''),
  text: tweet.retweeted_status.full_text || tweet.retweeted_status.text || '',
  created_at: tweet.retweeted_status.created_at || new Date().toISOString(),
  retweet_count: Number(tweet.retweeted_status.retweet_count) || 0,
  favorite_count: Number(tweet.retweeted_status.favorite_count) || 0,
  // ... 완전한 user 정보 매핑
} : undefined
```

### 3. Twitter 팀원 정보 시스템 구축

**작업 일시**: 2025년 1월 중순  
**작업 목적**: AI 추정 정보를 실제 API 데이터로 대체

#### 새로 생성된 파일들:
- `src/components/TeamMembersInfo.tsx`
- `src/app/api/team-members/route.ts`
- `src/lib/twitterService.ts`
- `TWITTER_TEAM_MEMBERS_SCHEMA.sql`

#### 데이터베이스 스키마:

```sql
-- 팀원 정보 테이블
CREATE TABLE twitter_team_members (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  twitter_user_id VARCHAR(50) NOT NULL,
  screen_name VARCHAR(100) NOT NULL,
  name VARCHAR(200),
  followers_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  tweets_count INTEGER DEFAULT 0,
  verified BOOLEAN DEFAULT false,
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 팀원 활동 추적 테이블
CREATE TABLE twitter_team_activity (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_member_id UUID REFERENCES twitter_team_members(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL,
  tweets_count INTEGER DEFAULT 0,
  mentions_count INTEGER DEFAULT 0,
  engagement_score DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 팀원 개요 뷰
CREATE VIEW twitter_team_overview AS
SELECT 
  tm.project_id,
  COUNT(*) as total_members,
  AVG(tm.followers_count) as avg_followers,
  SUM(ta.tweets_count) as total_tweets_today,
  AVG(ta.engagement_score) as avg_engagement
FROM twitter_team_members tm
LEFT JOIN twitter_team_activity ta ON tm.id = ta.team_member_id 
  AND ta.activity_date = CURRENT_DATE
GROUP BY tm.project_id;
```

#### RapidAPI Twitter 연동:

**사용 중인 엔드포인트**:
```typescript
// 팀원 목록 조회
GET /affilates.php?screenname=${screenName}

// 사용자 정보 조회  
GET /screenname.php?screenname=${screenName}

// 타임라인 조회
GET /timeline.php?screenname=${screenName}&count=${count}
```

**주요 문제점 및 해결책**:

1. **Affiliates API 불안정성**:
```typescript
// 다양한 응답 구조 대응
let affiliates = [];
if (Array.isArray(data)) {
  affiliates = data;
} else if (data && typeof data === 'object') {
  affiliates = data.users || data.data || data.affiliates || [];
}
```

2. **브라우저 디버깅 도구 추가**:
```typescript
// 개발자 도구에서 실시간 테스트 가능
(window as any).testAffiliatesAPI = async () => { /* ... */ }
(window as any).testTimelineAPI = async (screenName) => { /* ... */ }
(window as any).testMonthlyAnalysis = async (screenName) => { /* ... */ }
```

### 4. 텔레그램 커뮤니티 분석 (개발 중단)

**작업 일시**: 2025년 1월 중순  
**작업 목적**: MCP를 통한 텔레그램 데이터 분석  
**중단 사유**: 브라우저 환경에서 MCP 접근 불가, 복잡성 대비 효용성 낮음

#### 시도했던 접근 방법:

1. **MCP 직접 연결** (실패)
```json
// .cursor/mcp.json
{
  "mcpServers": {
    "telegram-supabase": {
      "command": "mcp-server-supabase",
      "args": ["TELEGRAM_SUPABASE_URL", "TELEGRAM_SUPABASE_ANON_KEY"]
    }
  }
}
```

2. **Next.js API Route 우회** (구현했으나 사용 안함)
```typescript
// src/app/api/telegram-analysis/route.ts
export async function POST(request: Request) {
  // 서버 사이드에서 Supabase 직접 연결
  const { projectKeywords } = await request.json();
  // SQL 쿼리 실행 및 분석 반환
}
```

#### 결론:
- 복잡성 대비 사용자 가치 낮음
- Twitter 분석만으로도 충분한 인사이트 제공
- 향후 필요시 서버 사이드 구현으로 재개 가능

---

## 🔐 환경변수 구성

### 현재 필요한 환경변수:

```env
# Twitter API (RapidAPI)
NEXT_PUBLIC_TWITTER_API_KEY=cb36cde707msh4ccb3ae744a2128p1407b5jsn3297ae66c2ef
NEXT_PUBLIC_TWITTER_API_HOST=twitter-api45.p.rapidapi.com

# CoinGecko API (공식)
NEXT_PUBLIC_COINGECKO_API_KEY=your_demo_api_key
NEXT_PUBLIC_COINGECKO_PRO_API_KEY=your_pro_api_key  # 선택사항

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Google Gemini AI
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
```

### Vercel 환경변수 설정:

**Environment**: Production, Preview, Development 모두 설정  
**중요사항**: 모든 변수가 `NEXT_PUBLIC_` 접두사 필요 (클라이언트 사이드 접근)

---

## 🚨 알려진 이슈 및 해결 방법

### 1. Twitter Affiliates API 불안정성

**증상**: 특정 계정의 affiliates 정보 조회 실패
```
❌ Twitter: 'solana'의 제휴사 정보를 가져올 수 없습니다.
❌ Twitter: 'gensynai'의 제휴사 정보 없음 (빈 응답 또는 구조 불일치)
```

**원인**: RapidAPI의 응답 구조가 계정별로 상이

**해결 방법**:
```typescript
// 강건한 파싱 로직 적용
const parseAffiliatesResponse = (data: any): any[] => {
  if (Array.isArray(data)) return data;
  if (data?.users && Array.isArray(data.users)) return data.users;
  if (data?.data && Array.isArray(data.data)) return data.data;
  if (data?.affiliates && Array.isArray(data.affiliates)) return data.affiliates;
  return [];
};
```

**모니터링**: 브라우저 콘솔에서 `testAffiliatesAPI()` 실행으로 실시간 확인 가능

### 2. CoinGecko Rate Limiting

**증상**: 과도한 API 호출로 인한 429 에러

**해결 방법**:
1. Demo API 키 사용시 분당 요청 제한 준수
2. Pro API 키 업그레이드 ($129/월)
3. 캐싱 로직 추가 검토

### 3. Twitter Timeline 파싱 이슈

**증상**: 일부 트윗의 좋아요/리트윗 수가 0으로 표시

**해결 방법**:
```typescript
// 다중 필드 체크
const likes = Number(
  tweet.favorite_count || 
  tweet.likes || 
  tweet.favourites_count
) || 0;
```

**디버깅**: 콘솔에서 각 트윗별 매핑 로그 확인 가능

---

## 🧪 테스트 및 디버깅

### 브라우저 개발자 도구 함수들:

```javascript
// CoinGecko API 테스트
testCoinGeckoMarketData()                    // 상위 10개 코인 조회
testCoinGeckoSearch("bitcoin")               // 특정 코인 검색
testMultipleProjects()                       // 여러 프로젝트 일괄 테스트

// Twitter API 테스트  
testTimelineAPI("berachain")                 // 타임라인 조회 테스트
testMonthlyAnalysis("berachain")             // 월별 분석 테스트
testAffiliatesAPI()                          // 제휴사 API 테스트
checkProjectTeamMembers("project-id")        // 팀원 데이터 확인
```

### 로그 모니터링:

**성공적인 응답 예시**:
```
🦎 CoinGecko 공식 API 호출: /coins/markets
✅ CoinGecko 마켓 데이터 100개 조회 완료
📊 트윗 매핑: 16713700... - 좋아요: 156, 리트윗: 23, 답글: 12
✅ Twitter: berachain의 타임라인 15개 트윗 가져옴
```

**오류 상황 예시**:
```
❌ CoinGecko API Error: 429 - Rate limit exceeded
⚠️ Twitter: 타임라인 응답에서 배열을 찾을 수 없습니다.
❌ Twitter Timeline API 오류 (screenname): Network error
```

### SQL 데이터 검증:

```sql
-- 팀원 데이터 확인
SELECT p.name, COUNT(tm.*) as team_count, AVG(tm.followers_count) as avg_followers
FROM projects p
LEFT JOIN twitter_team_members tm ON p.id = tm.project_id
GROUP BY p.id, p.name
ORDER BY team_count DESC;

-- 최근 활동 확인
SELECT tm.screen_name, ta.activity_date, ta.tweets_count, ta.engagement_score
FROM twitter_team_members tm
JOIN twitter_team_activity ta ON tm.id = ta.team_member_id
WHERE ta.activity_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ta.activity_date DESC;
```

---

## 🔄 CI/CD 및 배포

### 자동 배포 프로세스:

1. **로컬 개발**:
```bash
npm run dev          # 개발 서버 실행
npm run build        # 프로덕션 빌드 테스트
npm run lint         # 코드 품질 검사
```

2. **Git 커밋**:
```bash
git add .
git commit -m "feat: 새로운 기능 추가"
git push origin main
```

3. **Vercel 자동 배포**:
- GitHub main 브랜치 푸시시 자동 트리거
- 빌드 성공시 프로덕션 배포
- 환경변수 자동 적용

### 배포 체크리스트:

- [ ] `npm run build` 로컬 성공 확인
- [ ] TypeScript 오류 없음
- [ ] 환경변수 Vercel에 모두 설정
- [ ] API 키 유효성 확인
- [ ] 브라우저 테스트 함수로 기능 검증

---

## 📈 성능 및 최적화

### 현재 번들 크기:
```
Route (app)                              Size     First Load JS
┌ ○ /                                    81 kB    168 kB
├ ○ /_not-found                          873 B    88 kB  
└ ƒ /api/team-members                    0 B      0 B
```

### 최적화 포인트:

1. **코드 스플리팅**: TwitterActivityAnalysis 컴포넌트 동적 import
2. **API 캐싱**: CoinGecko 응답 로컬 스토리지 캐시
3. **이미지 최적화**: Next.js Image 컴포넌트 활용
4. **번들 분석**: `npm run analyze` 추가 고려

---

## 🔮 향후 개발 방향

### 단기 개선사항:

1. **Twitter 분석 고도화**:
   - GPT/Claude API 연동으로 더 정교한 내용 분석
   - 감정 분석 정확도 향상
   - 영향력 있는 트윗 자동 식별

2. **성능 최적화**:
   - React Query 도입으로 서버 상태 관리
   - Virtualized 리스트로 대용량 데이터 처리
   - 이미지 레이지 로딩

3. **사용자 경험 개선**:
   - 다크 모드 지원
   - 모바일 반응형 개선
   - 로딩 상태 최적화

### 중기 개발 계획:

1. **텔레그램 분석 재개**:
   - 서버 사이드 구현으로 MCP 제약 극복
   - 실시간 커뮤니티 감정 지수
   - 토큰 가격과 커뮤니티 활동 상관관계 분석

2. **투자 정보 고도화**:
   - CoinGecko Pro API 완전 활용
   - 실시간 펀딩 라운드 추적
   - 투자자 네트워크 시각화

3. **AI 기능 확장**:
   - 프로젝트 성공 가능성 예측 모델
   - 포트폴리오 최적화 제안
   - 시장 트렌드 예측

---

## 🔧 개발 환경 설정

### 필수 소프트웨어:
- Node.js 18.17+
- npm 9.0+
- Git 2.30+
- VS Code (권장)

### VS Code 확장:
- TypeScript Importer
- Tailwind CSS IntelliSense
- ES7+ React/Redux/React-Native snippets
- Prettier - Code formatter

### 로컬 개발 시작:

```bash
# 저장소 클론
git clone https://github.com/sose-blockchain/workation_project.git
cd workation_project

# 의존성 설치
npm install

# 환경변수 설정
cp .env.example .env.local
# .env.local 파일에 실제 API 키 입력

# 개발 서버 실행
npm run dev
```

### 디버깅 설정:

**VS Code launch.json**:
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Next.js: debug server-side",
      "type": "node-terminal",
      "request": "launch",
      "command": "npm run dev"
    }
  ]
}
```

---

## 📞 연락처 및 지원

### 기술 문의:
- **프로젝트 관리자**: [GitHub Issues](https://github.com/sose-blockchain/workation_project/issues)
- **API 관련**: 각 API 제공업체 문서 참조
- **긴급 이슈**: 슬랙 #dev-emergency 채널

### 외부 서비스 문서:
- [CoinGecko API 문서](https://docs.coingecko.com/v3.0.1/reference/introduction)
- [RapidAPI Twitter 문서](https://rapidapi.com/hub)
- [Supabase 문서](https://supabase.com/docs)
- [Vercel 배포 가이드](https://vercel.com/docs)

---

## 📋 체크리스트

### 인수인계 완료 확인:

- [ ] 로컬 환경 정상 실행 확인
- [ ] 모든 API 키 및 환경변수 이관
- [ ] 데이터베이스 스키마 이해
- [ ] 주요 기능 테스트 수행
- [ ] 브라우저 디버깅 도구 활용법 숙지
- [ ] 배포 프로세스 이해
- [ ] 알려진 이슈 및 해결 방법 숙지
- [ ] 향후 개발 계획 논의

---

**문서 작성일**: 2025년 1월  
**마지막 업데이트**: 배포 시점  
**문서 버전**: 1.0  
**작성자**: 개발팀

> ⚠️ **중요**: 이 문서는 실제 API 키와 민감한 정보를 포함하지 않습니다. 실제 배포 시에는 별도의 보안 문서를 참조하세요.

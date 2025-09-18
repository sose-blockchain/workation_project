# React 웹사이트 프로젝트

## 📋 프로젝트 개요

이 프로젝트는 **프로젝트 리서치 AI Agent** 서비스입니다. React 기반의 웹사이트로, 블록체인 및 웹3 프로젝트에 대한 종합적인 리서치를 AI를 통해 자동화하는 플랫폼입니다. Windows PowerShell 환경에서 개발되며, Vercel을 통해 배포됩니다.

### 🎯 서비스 목적
- 블록체인 프로젝트의 종합적인 리서치 자동화
- AI 기반 프로젝트 분석 및 인사이트 제공
- SNS 데이터 분석을 통한 프로젝트 영향도 측정
- 노션 연동을 통한 체계적인 리서치 문서 생성

### ✨ 최신 기능들 (v2.1.0 - 2025.01.28)
- **🧠 AI 주별 트위터 분석**: Google Gemini를 활용한 주별 심층 트윗 분석
  - 각 주별 주요 화제 및 트렌드 자동 추출
  - 감정 분석 및 커뮤니티 반응 인사이트
  - 주요 이벤트 및 발표 타임라인 정리
  - AI 기반 개선 권장사항 제공
- **📊 스마트 캐싱 시스템**: 분석 결과 자동 저장으로 성능 최적화
- **🎯 인터랙티브 UI**: 확장 가능한 주별 카드 및 트렌드 시각화
- **⚡ 실시간 분석**: Supabase 실제 트윗 데이터 기반 분석
- **📈 트렌드 추적**: 최고 활동 주, 참여도 분석, 공통 화제 추출

### 🔧 기존 기능들 (v2.0.0)
- **🤖 스마트 Twitter 스케줄러**: RapidAPI 제한 최적화로 효율적 데이터 수집
- **⚙️ 관리자 대시보드**: Twitter 계정 관리 및 실시간 모니터링 
- **📊 API 사용량 최적화**: 월 1,000회 제한 내 우선순위 기반 스마트 관리
- **💼 완전 자동화**: 계정 등록 → 스케줄링 → 분석 → 표시 전 과정 자동화

### 🔧 기존 기능들 (v1.1.0)
- **Google 스타일 UI**: 깔끔하고 직관적인 인터페이스
- **접고 펼 수 있는 사이드바**: 프로젝트 관리를 위한 모달 사이드바
- **고급 URL 검증**: 오래된 링크 자동 감지 및 신뢰도 분석
- **검색 품질 분석**: AI 기반 프로젝트 정보 품질 평가
- **실시간 개선 제안**: 데이터 품질 향상을 위한 구체적 가이드

## 🚀 기술 스택

### Frontend
- **React**: 18.2.0
- **TypeScript**: 5.0.0
- **Next.js**: 14.0.0
- **Tailwind CSS**: 3.3.0

### Backend & Database
- **Supabase**: 2.0.0
  - PostgreSQL 데이터베이스
  - 실시간 데이터 동기화
  - 인증 서비스

### AI 서비스
- **Google Gemini API**: v1.0.0
  - 프로젝트 리서치 분석
  - SNS 데이터 인사이트 생성
  - 텍스트 생성 및 분석

### 외부 API 연동
- **Twitter API (RapidAPI)**: 프로젝트 및 팀원 SNS 데이터 수집
- **CoinGecko API**: 암호화폐 시장 데이터 및 프로젝트 정보
- **CryptoRank API**: 투자 라운드 및 펀딩 정보  
- **Notion API**: 리서치 결과 문서 자동 생성

### 배포 & 버전 관리
- **Vercel**: 자동 배포
- **GitHub**: 소스 코드 관리
- **Git**: 2.40.0

## 📋 서비스 기획안

### 🎯 프로젝트 리서치 AI Agent

#### 📄 서브 페이지 1: 프로젝트 리서치

##### 정보 입력 기능
- **프로젝트 정보 입력 폼**
  - 프로젝트명(영문) - **필수**
  - 프로젝트 홈페이지 URL - 선택
  - 프로젝트 백서 URL 또는 PDF 파일 업로드 - 선택
  - 프로젝트 docs URL - 선택
  - 프로젝트 블로그 URL - 선택
- **저장 버튼**: 입력된 데이터를 Supabase DB에 저장

##### 리서치 시작 기능
- **AI 분석 버튼**: Supabase DB에 저장된 데이터를 기반으로 AI 분석 수행
- **분석 결과**:
  - 프로젝트명(영문)
  - 프로젝트 토큰명(없으면 미정)
  - 한줄 설명
  - 주요 팀원 경력
  - 기술 설명

#### 📱 서브 페이지 2: 프로젝트 SNS 리서치

##### 정보 입력 기능
- **프로젝트 X(Twitter) 정보 입력**
  - 프로젝트 트위터 URL - 선택
  - 팀원 트위터 URL (+버튼으로 추가 가능) - 선택
- **저장 버튼**: SNS 데이터를 Supabase DB에 저장

##### SNS 리서치 시작 기능
- **Twitter API 연동**: 해당 계정의 팔로워, 트윗 정보 수집
- **AI 인사이트 생성**: 수집된 SNS 데이터를 기반으로 프로젝트 및 팀원에 대한 AI 분석 제공

#### 📝 서브 페이지 3: 노션 정리

##### 노션 연동 기능
- **프로젝트명 입력**: 리서치할 프로젝트명 입력
- **자동 문서 생성**: DB에서 해당 프로젝트의 리서치 내용을 가져와서 노션에 페이지 자동 생성

### 🔄 데이터 플로우

```
1. 프로젝트 정보 입력 → Supabase DB 저장
2. AI 리서치 실행 → Gemini API 분석 → DB 업데이트
3. SNS 정보 입력 → Twitter API 데이터 수집 → DB 저장
4. AI SNS 분석 → 인사이트 생성 → DB 업데이트
5. 노션 연동 → 리서치 결과 문서 자동 생성
```

### 📊 데이터베이스 스키마 (Supabase)

#### 프로젝트 테이블
```sql
projects (
  id: uuid PRIMARY KEY,
  name: text NOT NULL,
  homepage_url: text,
  whitepaper_url: text,
  docs_url: text,
  blog_url: text,
  token_name: text,
  description: text,
  team_info: jsonb,
  tech_description: text,
  created_at: timestamp,
  updated_at: timestamp
)
```

#### 트위터 계정 관리
```sql
twitter_accounts (
  id: uuid PRIMARY KEY,
  project_id: uuid REFERENCES projects(id),
  screen_name: text NOT NULL,
  name: text,
  followers_count: integer,
  activity_score: integer,
  priority: integer DEFAULT 3,
  api_calls_used: integer DEFAULT 0,
  is_active: boolean DEFAULT true,
  last_updated: timestamp,
  created_at: timestamp
)
```

#### 트윗 데이터
```sql
twitter_timeline (
  id: uuid PRIMARY KEY,
  twitter_account_id: uuid REFERENCES twitter_accounts(id),
  tweet_id: text NOT NULL,
  text: text,
  created_at: timestamp,
  retweet_count: integer,
  favorite_count: integer,
  is_retweet: boolean,
  is_reply: boolean
)
```

#### AI 주별 분석 (NEW v2.1.0)
```sql
twitter_weekly_analysis (
  id: uuid PRIMARY KEY,
  project_id: uuid REFERENCES projects(id),
  week_start: date,
  week_end: date,
  analysis_result: jsonb,
  sentiment: varchar(20),
  activity_level: varchar(20),
  main_topics: text[],
  total_tweets: integer,
  avg_engagement: decimal,
  created_at: timestamp
)
```

#### 트렌드 분석 캐시 (NEW v2.1.0)
```sql
twitter_trend_analysis (
  id: uuid PRIMARY KEY,
  project_id: uuid REFERENCES projects(id),
  analysis_start_date: date,
  analysis_end_date: date,
  trends_result: jsonb,
  common_topics: text[],
  dominant_sentiment: varchar(20),
  created_at: timestamp
)
```

## 🛠️ 개발 환경 설정

### 필수 요구사항
- Node.js: 18.0.0 이상
- npm: 9.0.0 이상
- Git: 2.40.0 이상

### 설치 및 실행

1. **저장소 클론**
```powershell
git clone [repository-url]
cd [project-name]
```

2. **의존성 설치**
```powershell
npm install
```

3. **환경 변수 설정**
```powershell
# .env.local 파일 생성
cp .env.example .env.local
```

4. **개발 서버 실행**
```powershell
npm run dev
```

5. **빌드**
```powershell
npm run build
```

## 🔧 환경 변수

`.env.local` 파일에 다음 환경 변수들을 설정하세요:

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Gemini AI (필수) - 2.5-flash 모델 사용
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here

# Twitter API (RapidAPI 기반 - SNS 기능용)
NEXT_PUBLIC_TWITTER_API_KEY=your_twitter_api_key_here
NEXT_PUBLIC_TWITTER_API_HOST=twitter-api45.p.rapidapi.com

# CryptoRank API (시장 데이터용)
NEXT_PUBLIC_CRYPTORANK_API_KEY=your_cryptorank_api_key_here
# 대체 키 (서버사이드용)
CRYPTORANK_API_KEY=your_cryptorank_api_key_here

# 개발 환경
NODE_ENV=development
```

### 🔑 API 키 발급 방법

#### Supabase 설정
1. [Supabase](https://supabase.com) 계정 생성
2. 새 프로젝트 생성
3. Settings > API에서 URL과 anon key 복사

#### Gemini AI 설정
1. [Google AI Studio](https://makersuite.google.com/app/apikey) 접속
2. API 키 생성 (gemini-2.5-flash 모델 지원 확인)
3. 생성된 키를 환경 변수에 설정

#### Twitter API (RapidAPI) 설정
1. [RapidAPI](https://rapidapi.com) 계정 생성
2. "Twitter API v1.1" 구독
3. API 키 복사하여 환경 변수에 설정

#### CryptoRank API 설정
1. [CryptoRank](https://cryptorank.io/api) 계정 생성
2. API 키 발급 (limit 파라미터 100, 500, 1000 지원)
3. 생성된 키를 환경 변수에 설정

## 📦 프로젝트 구조

```
├── src/
│   ├── app/           # Next.js App Router
│   │   ├── page.tsx   # 메인 페이지
│   │   ├── research/  # 프로젝트 리서치 페이지
│   │   ├── sns/       # SNS 리서치 페이지
│   │   └── notion/    # 노션 연동 페이지
│   ├── components/    # React 컴포넌트
│   │   ├── forms/     # 폼 컴포넌트
│   │   ├── ui/        # UI 컴포넌트
│   │   └── layout/    # 레이아웃 컴포넌트
│   ├── lib/           # 유틸리티 함수
│   │   ├── supabase.ts # Supabase 클라이언트
│   │   ├── gemini.ts  # Gemini API 클라이언트
│   │   ├── twitter.ts # Twitter API 클라이언트
│   │   └── notion.ts  # Notion API 클라이언트
│   ├── types/         # TypeScript 타입 정의
│   └── styles/        # CSS 스타일
├── public/            # 정적 파일
├── .env.example       # 환경 변수 예시
├── package.json       # 프로젝트 의존성
├── tailwind.config.js # Tailwind 설정
├── next.config.js     # Next.js 설정
└── tsconfig.json      # TypeScript 설정
```

## 🚀 배포

### Vercel 자동 배포

1. **GitHub 저장소 연결**
   - Vercel 대시보드에서 새 프로젝트 생성
   - GitHub 저장소 선택
   - 환경 변수 설정

2. **자동 배포 설정**
   - GitHub에 push하면 자동으로 Vercel에 배포
   - 브랜치별 배포 환경 설정 가능

### 수동 배포
```powershell
npm run build
vercel --prod
```

## 🔍 오류 처리

프로젝트에서 발생하는 오류는 `ERROR.md` 파일에 기록됩니다. 오류 해결을 위해 해당 파일을 참조하세요.

## 📝 개발 가이드라인

### 코드 스타일
- TypeScript 사용 필수
- ESLint 및 Prettier 설정 준수
- 컴포넌트별 파일 분리

### 커밋 메시지
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 스타일 변경
refactor: 코드 리팩토링
test: 테스트 추가
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 🤝 기여하기

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

## 📞 연락처

프로젝트 관련 문의사항이 있으시면 이슈를 생성해주세요.

---

**참고**: 오류 발생 시 `ERROR.md` 파일을 먼저 확인하세요.

# React 웹사이트 프로젝트

## 📋 프로젝트 개요

이 프로젝트는 React 기반의 웹사이트 서비스입니다. Windows PowerShell 환경에서 개발되며, Vercel을 통해 배포됩니다.

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
  - AI 챗봇 기능
  - 텍스트 생성 및 분석

### 배포 & 버전 관리
- **Vercel**: 자동 배포
- **GitHub**: 소스 코드 관리
- **Git**: 2.40.0

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
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Gemini API
GEMINI_API_KEY=your_gemini_api_key

# Vercel
VERCEL_URL=your_vercel_url
```

## 📦 프로젝트 구조

```
├── src/
│   ├── components/     # React 컴포넌트
│   ├── pages/         # Next.js 페이지
│   ├── lib/           # 유틸리티 함수
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

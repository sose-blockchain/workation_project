# 오류 기록 (ERROR.md)

이 파일은 프로젝트 개발 및 배포 과정에서 발생하는 오류들과 해결 방법을 기록합니다.

## 📝 오류 기록 형식

```
## [날짜] - [오류 유형]
### 오류 내용
- 오류 메시지
- 발생 상황
- 영향 범위

### 해결 방법
- 단계별 해결 과정
- 참고 자료

### 예방 방법
- 향후 동일한 오류 방지 방법
```

---

## 🔍 오류 분류

### 🚨 심각한 오류 (Critical)
- 애플리케이션 실행 불가
- 데이터 손실 위험
- 보안 취약점

### ⚠️ 주요 오류 (Major)
- 기능 동작 불가
- 성능 저하
- 사용자 경험 저해

### ℹ️ 경미한 오류 (Minor)
- UI/UX 문제
- 경고 메시지
- 코드 스타일 이슈

---

## 📋 오류 목록

## 2025-01-27 - Vercel 배포 오류 (Critical)

### 오류 내용
- 오류 메시지: `sh: line 1: react-scripts: command not found`
- 발생 상황: Vercel에서 첫 번째 배포 시도 중
- 영향 범위: 프로젝트 배포 실패

### 해결 방법
1. React 프로젝트 초기화 필요
2. package.json 파일 생성
3. 필요한 의존성 설치
4. 빌드 스크립트 설정

### 예방 방법
- 프로젝트 초기화 전에 package.json 확인
- React 프로젝트 구조 완성 후 배포

---

## 2025-01-27 - Vercel Next.js 설정 오류 (Major)

### 오류 내용
- 오류 메시지: `No Output Directory named "build" found after the Build completed`
- 발생 상황: Vercel에서 Next.js 14 프로젝트 배포 중
- 영향 범위: 프로젝트 배포 실패

### 해결 방법
1. next.config.js에서 deprecated된 `appDir` 설정 제거
2. Vercel 프로젝트 설정에서 Output Directory를 `.next`로 변경
3. Build Command를 `npm run build`로 설정

### 예방 방법
- Next.js 버전에 맞는 설정 파일 사용
- Vercel 프로젝트 설정에서 올바른 출력 디렉토리 지정

---

## 2025-01-27 - Vercel Supabase 환경 변수 오류 (Critical)

### 오류 내용
- 오류 메시지: `supabaseUrl is required.`
- 발생 상황: Vercel 빌드 중 정적 페이지 생성 시
- 영향 범위: 프로젝트 배포 실패

### 해결 방법
1. Vercel 대시보드에서 환경 변수 확인
2. NEXT_PUBLIC_SUPABASE_URL과 NEXT_PUBLIC_SUPABASE_ANON_KEY 설정
3. 빌드 시 환경 변수 접근 방식 수정

### 예방 방법
- 환경 변수 설정 후 배포 전 로컬 테스트
- Vercel 환경 변수 설정 확인

---

## 2025-01-27 - 로컬 개발 환경 Supabase 오류 (Major)

### 오류 내용
- 오류 메시지: `supabaseUrl is required.`
- 발생 상황: 로컬 개발 서버 실행 중
- 영향 범위: 프로젝트 리서치 기능 사용 불가

### 해결 방법
1. .env.local 파일에서 환경 변수 확인
2. Supabase 클라이언트 초기화 방식 개선
3. 서버 사이드 렌더링 문제 해결

### 예방 방법
- 환경 변수 설정 후 개발 서버 재시작
- 클라이언트 사이드에서만 Supabase 사용

---

## 2025-01-27 - Vercel TypeScript 컴파일 오류 (Major)

### 오류 내용
- 오류 메시지: `'token_name' does not exist in type 'CreateProjectRequest'`
- 발생 상황: Vercel 빌드 중 TypeScript 컴파일 시
- 영향 범위: 프로젝트 배포 실패

### 해결 방법
1. ProjectForm.tsx 컴포넌트 삭제 (더 이상 사용하지 않음)
2. Supabase 데이터베이스 타입 업데이트
3. 새로운 스키마에 맞게 타입 정의 수정

### 예방 방법
- 스키마 변경 시 관련 컴포넌트 일괄 업데이트
- TypeScript 타입 체크 정기적 실행

---

## 2025-01-27 - Gemini API 모델명 오류 (Critical)

### 오류 내용
- 오류 메시지: `models/gemini-pro is not found for API version v1`
- 발생 상황: AI 프로젝트 검색 기능 사용 중
- 영향 범위: AI 자동 정보 수집 기능 실패

### 해결 방법
1. Gemini API 모델명을 'gemini-1.5-flash'로 변경
2. 안전한 클라이언트 초기화 로직 구현
3. JSON 파싱 오류 처리 개선
4. AI 실패 시 기본 정보 반환 로직 추가

### 예방 방법
- API 문서 정기적 확인
- 에러 처리 및 폴백 로직 구현
- 환경 변수 유효성 검사 추가

---

## 2025-01-27 - 기타 클라이언트 오류 (Minor)

### 오류 내용
- favicon.ico 404 오류
- 브라우저 확장 프로그램 충돌 (ethereum 객체)
- 클라이언트/서버 사이드 렌더링 불일치

### 해결 방법
1. favicon.ico 파일 추가
2. 안전한 클라이언트 사이드 초기화
3. 브라우저 확장 프로그램 충돌 방지

### 예방 방법
- 기본 파비콘 제공
- 클라이언트 사이드 전용 로직 분리

---

## 🛠️ 일반적인 오류 해결 방법

### Node.js 관련
- `npm install` 실패: `npm cache clean --force`
- 모듈을 찾을 수 없음: `node_modules` 삭제 후 재설치

### Next.js 관련
- 빌드 실패: `.next` 폴더 삭제 후 재빌드
- 환경 변수 문제: `.env.local` 파일 확인

### Supabase 관련
- 연결 실패: API 키 및 URL 확인
- 권한 오류: RLS(Row Level Security) 설정 확인

### Vercel 배포 관련
- 배포 실패: 빌드 로그 확인
- 환경 변수 누락: Vercel 대시보드에서 설정 확인

---

## 📞 오류 보고

새로운 오류를 발견하거나 해결 방법을 제안하고 싶으시면:
1. 이 파일에 오류를 기록
2. GitHub 이슈 생성
3. 팀원들과 공유

## 2025-01-27 - 투자 정보 UI/UX 문제 (Minor)

### 오류 내용
- 투자 정보 섹션에서 일부 텍스트가 흰색으로 표시되어 가독성 저하
- 투자 정보 출처 표시 누락
- 사용자가 데이터의 신뢰성을 확인하기 어려움

### 해결 방법
1. InvestmentManager.tsx에서 텍스트 색상 명시적 지정
   - 라운드 타입: `text-gray-900` 클래스 추가
   - 리드 투자자: `text-gray-900` 클래스로 강조
   - 투자자 목록: `text-gray-900` 클래스로 강조
2. 출처 정보 표시 추가
   - `data_source` 필드 기반 출처 표시
   - `source_url` 있을 경우 링크 제공
   - 신뢰성 향상을 위한 투명성 확보

### 예방 방법
- 브랜드 디자인 가이드라인 수립
- 색상 팔레트 및 텍스트 스타일 표준화
- 모든 데이터에 출처 정보 의무화
- UI 컴포넌트 리뷰 프로세스 도입

---

## 2025-01-27 - 마켓 데이터 기능 제거 (Major)

### 오류 내용
- 마켓 데이터 기능이 제대로 작동하지 않음
- 외부 API 연동 불안정성
- 사용자 요청에 따른 기능 제거 필요

### 해결 방법
1. MarketDataManager.tsx 컴포넌트 삭제
2. research/page.tsx에서 마켓 데이터 저장 로직 제거
3. 데이터베이스 스키마에서 market_data 테이블 제거
4. NORMALIZED_DB_SCHEMA.md 업데이트

### 예방 방법
- 외부 API 의존성 최소화
- 핵심 기능과 부가 기능 명확히 구분
- 사용자 피드백 기반 기능 우선순위 조정

---

**마지막 업데이트**: 2025-01-27
**기록된 오류 수**: 9개

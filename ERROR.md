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

---

**마지막 업데이트**: [날짜]
**기록된 오류 수**: 0개

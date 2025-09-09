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

---

## 2025-01-28 - CryptoRank API 연동 및 제한 사항 (Major)

### 오류 내용
- CryptoRank API의 `/currencies/{id}/funding-rounds` 엔드포인트에서 403 Forbidden 오류
- 상세 투자 라운드 정보는 프리미엄 구독 필요
- AI 기반 투자 정보의 정확성 문제

### 해결 방법
1. CryptoRank API를 기본 프로젝트 정보(이름, 심볼)만으로 제한
2. 투자 정보 섹션을 프리미엄 서비스 안내로 교체
3. `PremiumInvestmentNotice.tsx` 컴포넌트 신규 생성
4. `InvestmentManager.tsx`에서 프리미엄 안내 UI로 전환

### 예방 방법
- API 사용 전 문서를 통한 제한사항 사전 확인
- 프리미엄 기능과 무료 기능 명확히 구분
- 사용자에게 투명한 정보 제공

---

## 2025-01-28 - Vercel 무료 플랜 배포 제한 (Critical)

### 오류 내용
- 오류 메시지: "Deployment rate limited — retry in 47 minutes"
- 발생 상황: 빈번한 코드 수정 및 배포로 인한 시간당 배포 횟수 초과
- 영향 범위: 실시간 배포 업데이트 불가

### 해결 방법
1. 로컬 개발 서버 활용으로 실시간 테스트 진행
2. 배포 제한 시간 대기 (47분)
3. 강제 재배포를 위한 더미 커밋 생성
4. 개발 프로세스 개선 (로컬 → 스테이징 → 프로덕션)

### 예방 방법
- 로컬 테스트 완료 후 배포
- 배포 빈도 조절 및 배치 배포 고려
- Vercel Pro 플랜 업그레이드 검토

---

## 2025-01-28 - 프리미엄 서비스 안내 UI 캐싱 문제 (Minor)

### 오류 내용
- 새로운 `PremiumInvestmentNotice` 컴포넌트가 배포 후 표시되지 않음
- 브라우저 및 서버 캐싱으로 인한 업데이트 지연
- 사용자가 변경사항을 즉시 확인할 수 없음

### 해결 방법
1. 컴포넌트에 동적 `key` prop 추가 (`Date.now()` 활용)
2. 강제 렌더링을 위한 타임스탬프 기반 캐시 무효화
3. 컴포넌트 버전 태그 추가 ("Updated 2025.1.28 v2")
4. 로컬 개발 환경에서 사전 검증

### 예방 방법
- 중요한 UI 변경 시 캐시 무효화 전략 적용
- 버전 관리 시스템을 통한 컴포넌트 추적
- 배포 후 브라우저 하드 새로고침 안내

---

## 2025-01-28 - 팀원 정보 수집 기능 구현 중 발생한 오류들 (Major)

### 오류 내용

#### 1. Vercel 배포 오류 - TeamMembersInfo 컴포넌트 null 체크 문제
- 오류 메시지: `'teamOverview' is possibly 'null'. ./src/components/TeamMembersInfo.tsx:129:61`
- 발생 상황: TypeScript 컴파일 중 null 안전성 검사 실패
- 영향 범위: 배포 실패

#### 2. RapidAPI Twitter Affiliates API 응답 구조 문제
- 오류 메시지: `❌ Twitter: 'solana'의 제휴사 정보를 가져올 수 없습니다.`
- 응답 구조: `{hasData: true, isArray: false, length: 0}`
- 발생 상황: `/affilates.php` 엔드포인트에서 예상과 다른 응답 구조
- 영향 범위: 팀원 정보 수집 기능 실패

#### 3. TypeScript any 타입 오류
- 오류 메시지: `Parameter 'user' implicitly has an 'any' type.`
- 발생 상황: filter 함수에서 타입 지정 누락
- 영향 범위: 린트 오류

### 해결 방법

#### 1. TeamMembersInfo 컴포넌트 null 체크 수정
1. 데이터베이스 스키마가 적용되기 전까지 컴포넌트를 임시 비활성화
2. null 체크가 필요한 코드 부분을 주석 처리
3. 안내 메시지만 표시하도록 수정

#### 2. RapidAPI Affiliates 응답 구조 개선
1. 응답 데이터 구조 분석 로직 추가:
   - `Array.isArray(data)` 확인
   - 객체인 경우 `data.users`, `data.data`, `data.affiliates` 키 확인
   - 객체의 모든 값 중 배열인 것 탐색
2. 상세한 디버깅 로그 추가
3. 다양한 응답 형식에 대응하는 파싱 로직 구현

#### 3. TypeScript 타입 오류 수정
1. filter 함수에서 `(user: any)` 타입 명시적 지정
2. 린트 오류 해결

### 예방 방법

#### 1. 컴포넌트 개발 시
- TypeScript strict 모드에서 null 체크 필수
- 데이터베이스 스키마 변경 시 관련 컴포넌트 동시 업데이트
- 임시 비활성화 시 명확한 주석과 활성화 조건 명시

#### 2. 외부 API 연동 시
- API 응답 구조 사전 테스트 및 문서화
- 다양한 응답 형식에 대응하는 방어적 프로그래밍
- 실패 시 graceful degradation 적용

#### 3. TypeScript 관리
- 정기적인 린트 체크 실행
- any 타입 사용 최소화
- 타입 안전성 검증 자동화

---

## 2025-01-28 - RapidAPI Twitter API 제한사항 및 개선 방안 (Major)

### 현재 상황
- Solana, Berachain 등 주요 프로젝트에서 제휴사 정보 수집 실패
- API 응답은 성공하지만 배열 형태가 아닌 다른 구조로 반환
- 팔로잉 정보도 마찬가지로 빈 응답 반환

### 분석된 문제점
1. **API 응답 구조 불일치**: 문서화된 구조와 실제 응답이 다름
2. **계정별 차이**: 일부 계정은 제휴사 정보를 제공하지 않을 수 있음
3. **API 제한**: 무료 플랜의 기능 제한 가능성

### 향후 개선 방안
1. **대안 API 탐색**: 다른 Twitter API 서비스 검토
2. **Manual 입력 옵션**: 사용자가 직접 팀원 정보를 입력할 수 있는 기능
3. **웹 스크래핑**: Twitter 웹페이지에서 공개된 정보 수집 (단, 이용약관 확인 필요)
4. **AI 분석 개선**: 프로젝트 웹사이트나 문서에서 팀원 정보 추출

---

## 2025-01-28 - Twitter Timeline API 제한사항 (Major)

### 제한사항 내용
- **API 제한**: RapidAPI Twitter API는 한 번에 최대 20-50개 트윗만 반환
- **Historical Data 제한**: 6개월 과거 데이터 수집 불가, 대부분 최근 1-2주 데이터만 제공
- **Pagination 미지원**: 더 많은 트윗을 가져오는 페이지네이션 기능 없음
- **Date Range 필터링 없음**: 특정 기간을 지정하여 트윗을 가져오는 기능 없음

### 현재 상황
- 현재 구현된 기능은 최대 100개 트윗 요청하지만 실제로는 20개 내외만 반환
- 6개월 분량의 트윗 수집은 현재 API로는 불가능
- 월별 분석 기능은 제한된 데이터로만 작동

### 대안 및 해결방안

#### 1. API 업그레이드 옵션
```typescript
// Twitter API v2 (공식) - 월 $100+
// 더 많은 Historical Data 접근 가능
// Academic Research Access - 무료이지만 승인 필요
```

#### 2. 현실적인 해결책
```typescript
// 현재 API로 할 수 있는 최선의 방법
async getUserTimelineExtended(screenname: string, maxRequests: number = 5) {
  const allTweets: TwitterTimelineItem[] = [];
  
  for (let i = 0; i < maxRequests; i++) {
    // Rate limiting 준수를 위한 지연
    if (i > 0) await new Promise(resolve => setTimeout(resolve, 2000));
    
    const tweets = await this.getUserTimeline(screenname, 50);
    if (tweets.length === 0) break;
    
    allTweets.push(...tweets);
    
    // 중복 제거 로직 필요
    const uniqueTweets = this.removeDuplicateTweets(allTweets);
    if (uniqueTweets.length === allTweets.length) break; // 더 이상 새로운 트윗 없음
  }
  
  return allTweets;
}
```

#### 3. 데이터 수집 전략 개선
- **점진적 수집**: 정기적으로 (일주일마다) 데이터 수집하여 누적
- **중요 트윗 우선**: 높은 참여도를 가진 트윗 우선 저장
- **실시간 모니터링**: 새로운 트윗이 올라올 때마다 즉시 수집

### 권장 조치
1. **현재 제한사항 사용자에게 명시**: UI에서 "최근 20개 트윗" 등으로 명확히 표시
2. **점진적 데이터 수집 시스템 구축**: 정기적으로 새 트윗 수집하여 DB에 누적
3. **Twitter API v2 마이그레이션 검토**: 향후 더 나은 데이터 접근을 위한 계획 수립

### 예방 방법
- API 제한사항을 사전에 충분히 조사하고 문서화
- 대체 API 옵션을 미리 조사 및 준비
- 사용자에게 현재 제한사항을 투명하게 안내

---

## ✅ **해결 완료된 주요 이슈 (2025.01.28 업데이트)**

### 16. Twitter Timeline API 제한사항 해결 (Major → Resolved)

**문제**: RapidAPI Basic 플랜의 월 1,000회 제한으로 인한 지속적인 데이터 수집 어려움

**해결책**: 
- ✅ **스마트 스케줄러 시스템 구축**: 우선순위 기반 자동 선별
- ✅ **관리자 대시보드 완성**: 계정 관리 및 사용량 모니터링
- ✅ **API 사용량 최적화**: 일일 30회 안전 제한, 계정당 2회 호출
- ✅ **DB 기반 분석 시스템**: 누적 데이터로 정확한 AI 분석

**기술적 개선사항**:
```typescript
// 스마트 우선순위 계산
const priority = calculateAccountPriority({
  followers_count,  // 팔로워 수 가중치
  activity_score,   // 활동도 가중치  
  last_updated     // 업데이트 시점 가중치
});

// API 사용량 실시간 모니터링
const usage = await getCurrentAPIUsage();
const availableToday = Math.min(usage.remaining_calls, DAILY_LIMIT);
```

**결과**: 
- 월 1,000회 제한 내에서 15개 계정 효율적 관리
- 90% 사용률로 최적화된 데이터 수집
- 관리자 친화적 대시보드로 운영 편의성 극대화

### 17. TypeScript 타입 오류 일괄 해결 (Minor → Resolved)

**문제**: 
- `string | null` → `string` 타입 불일치
- TwitterService 메서드 누락 
- JSX 구문 오류

**해결책**:
- ✅ Null 체크 및 타입 가드 추가
- ✅ `collectTeamMembers` 메서드 구현
- ✅ JSX 구조 완전 재정리
- ✅ 모든 린터 오류 제거

**개선된 코드 예시**:
```typescript
// Before (오류 발생)
const handle = TwitterService.extractTwitterHandle(url);
const result = await service.createAccount({ screen_name: handle });

// After (안전한 코드)
const handle = TwitterService.extractTwitterHandle(url);
if (!handle) {
  console.warn(`⚠️ 유효하지 않은 URL: ${url}`);
  continue;
}
const result = await service.createAccount({ screen_name: handle });
```

---

**마지막 업데이트**: 2025-01-28  
**기록된 오류 수**: 17개 (2개 주요 이슈 해결 완료)  
**시스템 상태**: ✅ 모든 린터 오류 없음, 안정적 운영 가능

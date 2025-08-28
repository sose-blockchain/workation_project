# 🔑 CryptoRank API 설정 가이드

## 1. API 키 발급

### 단계별 진행

1. **CryptoRank 계정 생성**
   - https://cryptorank.io 접속
   - 회원가입 진행

2. **API 키 발급**
   - 로그인 후 대시보드 접속
   - API 섹션으로 이동
   - "Create New API Key" 클릭
   - API 키 이름 설정 (예: "Workation Project")
   - 권한 설정 (Read-only 권한이면 충분)

3. **환경 변수 설정**
   ```bash
   # .env.local 파일에 추가
   NEXT_PUBLIC_CRYPTORANK_API_KEY=your_api_key_here
   ```

## 2. API 사용량 확인

- **무료 플랜**: 월 1,000회 요청
- **유료 플랜**: 더 많은 요청 가능
- 현재 사용량은 대시보드에서 확인 가능

## 3. 테스트 방법

API 키가 올바르게 설정되었는지 확인:

```bash
# 개발 서버 실행
npm run dev

# 브라우저에서 테스트
http://localhost:3001/api/funding-rounds?project=ethereum
```

## 4. 주의사항

- API 키는 절대 공개 저장소에 커밋하지 마세요
- `.env.local` 파일은 `.gitignore`에 포함되어 있습니다
- API 호출 제한을 초과하지 않도록 주의하세요

## 5. 오류 처리

API 키가 없거나 잘못된 경우:
- CryptoRank API 호출이 실패해도 Gemini AI 데이터로 폴백됩니다
- 오류 메시지가 콘솔에 출력됩니다
- 사용자에게는 정상적인 서비스가 제공됩니다

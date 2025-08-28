# 🎨 브랜드 디자인 가이드라인

> 일관성 있는 사용자 경험을 위한 디자인 시스템 및 스타일 가이드

---

## 📋 목차

1. [색상 팔레트](#-색상-팔레트)
2. [타이포그래피](#-타이포그래피)
3. [컴포넌트 스타일](#-컴포넌트-스타일)
4. [레이아웃 규칙](#-레이아웃-규칙)
5. [아이콘 사용법](#-아이콘-사용법)
6. [상태 표시](#-상태-표시)
7. [접근성 고려사항](#-접근성-고려사항)

---

## 🎨 색상 팔레트

### 메인 컬러
```css
/* Primary Colors */
--primary-50: #eff6ff;   /* 매우 연한 파랑 */
--primary-100: #dbeafe;  /* 연한 파랑 */
--primary-500: #3b82f6;  /* 기본 파랑 */
--primary-600: #2563eb;  /* 진한 파랑 */
--primary-700: #1d4ed8;  /* 매우 진한 파랑 */
```

### 그레이 스케일
```css
/* Gray Scale - 텍스트 및 배경용 */
--gray-50: #f9fafb;      /* 매우 연한 회색 배경 */
--gray-100: #f3f4f6;     /* 연한 회색 배경 */
--gray-200: #e5e7eb;     /* 경계선 */
--gray-300: #d1d5db;     /* 비활성 경계선 */
--gray-400: #9ca3af;     /* 플레이스홀더 텍스트 */
--gray-500: #6b7280;     /* 보조 텍스트 */
--gray-600: #4b5563;     /* 일반 텍스트 */
--gray-900: #111827;     /* 메인 텍스트 */
```

### 의미 컬러
```css
/* Success - 성공, 투자 금액 등 */
--green-50: #f0fdf4;
--green-600: #16a34a;
--green-800: #166534;

/* Error - 오류, 삭제 등 */
--red-50: #fef2f2;
--red-600: #dc2626;
--red-800: #991b1b;

/* Warning - 경고 */
--yellow-50: #fefce8;
--yellow-600: #ca8a04;
--yellow-800: #92400e;
```

---

## ✍️ 타이포그래피

### 폰트 스택
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
```

### 텍스트 크기 및 용도

#### 제목 (Headings)
```css
/* H1 - 페이지 타이틀 */
.text-3xl { font-size: 1.875rem; font-weight: 700; color: #111827; }

/* H2 - 섹션 제목 */
.text-xl { font-size: 1.25rem; font-weight: 600; color: #111827; }

/* H3 - 서브섹션 제목 */
.text-lg { font-size: 1.125rem; font-weight: 600; color: #111827; }
```

#### 본문 텍스트
```css
/* 기본 본문 */
.text-base { font-size: 1rem; color: #4b5563; }

/* 보조 정보 */
.text-sm { font-size: 0.875rem; color: #6b7280; }

/* 캡션, 메타 정보 */
.text-xs { font-size: 0.75rem; color: #9ca3af; }
```

#### 중요 정보 강조
```css
/* 투자 금액, 가격 등 */
.text-green-600 { color: #16a34a; font-weight: 600; }

/* 강조 텍스트 */
.text-gray-900 { color: #111827; font-weight: 500; }
```

---

## 🧩 컴포넌트 스타일

### 버튼
```css
/* Primary Button */
.btn-primary {
  background-color: #3b82f6;
  color: white;
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  border: none;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover {
  background-color: #2563eb;
  transform: translateY(-1px);
}

/* Secondary Button */
.btn-secondary {
  background-color: white;
  color: #4b5563;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
}

.btn-secondary:hover {
  background-color: #f9fafb;
  border-color: #9ca3af;
}

/* Danger Button */
.btn-danger {
  background-color: white;
  color: #dc2626;
  padding: 0.25rem 0.5rem;
  border: 1px solid #fecaca;
  border-radius: 0.375rem;
  font-size: 0.75rem;
}

.btn-danger:hover {
  background-color: #fef2f2;
}
```

### 카드
```css
.card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #9ca3af;
}

/* Project Card */
.project-card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 0.75rem;
  transition: all 0.2s;
}

.project-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-color: #9ca3af;
  transform: translateY(-2px);
}
```

### 입력 필드
```css
.input-field {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background-color: white;
  color: #111827;
  font-size: 0.875rem;
}

.input-field:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.input-field::placeholder {
  color: #9ca3af;
}
```

---

## 📐 레이아웃 규칙

### 간격 (Spacing)
```css
/* 마진/패딩 기준 */
--space-1: 0.25rem;  /* 4px */
--space-2: 0.5rem;   /* 8px */
--space-3: 0.75rem;  /* 12px */
--space-4: 1rem;     /* 16px */
--space-6: 1.5rem;   /* 24px */
--space-8: 2rem;     /* 32px */
```

### 컨테이너
```css
/* 최대 너비 컨테이너 */
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

/* 카드 컨테이너 */
.card-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1rem;
}
```

### 그리드 시스템
```css
/* 2열 그리드 */
.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

/* 반응형 그리드 */
.grid-responsive {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.75rem;
}

@media (min-width: 640px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}
```

---

## 🎯 아이콘 사용법

### 아이콘 크기
```css
/* 작은 아이콘 (버튼 내부) */
.icon-sm { width: 1rem; height: 1rem; }

/* 일반 아이콘 */
.icon-md { width: 1.25rem; height: 1.25rem; }

/* 큰 아이콘 (헤더) */
.icon-lg { width: 1.5rem; height: 1.5rem; }
```

### 아이콘 컬러
```css
/* 기본 아이콘 */
.icon-default { color: #6b7280; }

/* 액티브 아이콘 */
.icon-active { color: #3b82f6; }

/* 성공 아이콘 */
.icon-success { color: #16a34a; }

/* 위험 아이콘 */
.icon-danger { color: #dc2626; }
```

---

## 📊 상태 표시

### 로딩 상태
```css
.loading {
  color: #6b7280;
  text-align: center;
  padding: 2rem;
  font-size: 0.875rem;
}

.loading::after {
  content: "...";
  animation: dots 1.5s infinite;
}

@keyframes dots {
  0%, 20% { content: "."; }
  40% { content: ".."; }
  60%, 100% { content: "..."; }
}
```

### 성공/오류 메시지
```css
/* 성공 메시지 */
.message-success {
  background-color: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1rem 0;
}

/* 오류 메시지 */
.message-error {
  background-color: #fef2f2;
  color: #991b1b;
  border: 1px solid #fecaca;
  padding: 1rem;
  border-radius: 0.375rem;
  margin: 1rem 0;
}
```

### 데이터 출처 표시
```css
.data-source {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

.data-source a {
  color: #3b82f6;
  text-decoration: underline;
  margin-left: 0.25rem;
}

.data-source a:hover {
  color: #1d4ed8;
}
```

---

## ♿ 접근성 고려사항

### 색상 대비
- 모든 텍스트는 배경과 최소 4.5:1의 대비율 유지
- 중요한 정보는 색상 외에 아이콘이나 텍스트로도 구분

### 키보드 내비게이션
```css
/* 포커스 스타일 */
.focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
}

/* 링크 포커스 */
a:focus-visible {
  outline: 2px solid #3b82f6;
  outline-offset: 2px;
  border-radius: 0.25rem;
}
```

### 스크린 리더 지원
```html
<!-- 시각적으로 숨기되 스크린 리더에서는 읽힘 -->
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}
```

---

## 📱 반응형 디자인

### 브레이크포인트
```css
/* Mobile First */
@media (min-width: 640px) { /* sm */ }
@media (min-width: 768px) { /* md */ }
@media (min-width: 1024px) { /* lg */ }
@media (min-width: 1280px) { /* xl */ }
```

### 반응형 텍스트
```css
.responsive-title {
  font-size: 1.5rem;
}

@media (min-width: 768px) {
  .responsive-title {
    font-size: 2rem;
  }
}
```

---

## 🔧 구현 가이드라인

### CSS 클래스 네이밍
- `snake-case` 사용
- 의미를 명확히 표현
- 컴포넌트명-상태-크기 순서로 작명

### 코드 예시
```tsx
// 좋은 예시
<div className="investment-card bg-white border border-gray-200 p-4 rounded-lg">
  <h3 className="text-lg font-semibold text-gray-900">Series A</h3>
  <p className="text-2xl font-bold text-green-600">$10.0M</p>
  <p className="text-sm text-gray-500">2024-01-15</p>
  <div className="data-source">
    출처: cryptorank
    <a href="#" className="text-blue-500 hover:text-blue-700">링크</a>
  </div>
</div>
```

---

## 📄 체크리스트

새로운 컴포넌트를 만들 때 확인할 사항:

- [ ] 색상이 브랜드 가이드를 따르는가?
- [ ] 텍스트 크기와 가중치가 적절한가?
- [ ] 출처 정보가 표시되는가?
- [ ] 호버 상태가 정의되어 있는가?
- [ ] 반응형 디자인이 적용되어 있는가?
- [ ] 접근성 고려사항이 반영되어 있는가?
- [ ] 일관된 간격이 사용되고 있는가?

---

**마지막 업데이트**: 2025-01-27  
**버전**: 1.0.0

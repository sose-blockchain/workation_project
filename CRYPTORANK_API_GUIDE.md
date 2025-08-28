# 🚀 CryptoRank API 투자 라운드 데이터 연동 가이드

> CryptoRank API를 통해 실시간 투자 라운드 데이터를 가져오는 방법

---

## 📋 목차

1. [CryptoRank API 개요](#-cryptorank-api-개요)
2. [API 설정](#-api-설정)
3. [투자 라운드 데이터 엔드포인트](#-투자-라운드-데이터-엔드포인트)
4. [구현 방법](#-구현-방법)
5. [데이터 구조](#-데이터-구조)
6. [예제 코드](#-예제-코드)

---

## 🔍 CryptoRank API 개요

CryptoRank는 블록체인 프로젝트의 투자 라운드, 시장 데이터, 토큰 정보를 제공하는 API 서비스입니다.

### 주요 기능
- **투자 라운드 데이터**: Seed, Series A/B/C, ICO, IDO 등
- **시장 데이터**: 시가총액, 가격 정보, 거래량
- **프로젝트 정보**: 기본 정보, 소셜 미디어, 팀 정보

### API 문서
- **공식 문서**: https://api.cryptorank.io/v2/docs
- **베이스 URL**: `https://api.cryptorank.io/v2`

---

## 🔑 API 설정

### 1. API 키 발급
```bash
# CryptoRank 계정 생성 후 API 키 발급
# 대시보드 > API 섹션에서 새로운 키 생성
```

### 2. 환경 변수 설정
```env
# .env.local
NEXT_PUBLIC_CRYPTORANK_API_KEY=your_api_key_here
CRYPTORANK_API_URL=https://api.cryptorank.io/v2
```

---

## 📊 투자 라운드 데이터 엔드포인트

### 주요 엔드포인트

#### 1. 투자 라운드 목록
```
GET /v2/funding-rounds
```

**쿼리 파라미터:**
- `limit`: 결과 수 제한 (기본값: 100, 최대: 1000)
- `offset`: 페이지네이션 오프셋
- `projects`: 특정 프로젝트 ID 필터링
- `round_type`: 라운드 타입 필터 (seed, series-a, ico, etc.)
- `date_from`: 시작 날짜 (YYYY-MM-DD)
- `date_to`: 종료 날짜 (YYYY-MM-DD)

#### 2. 특정 프로젝트의 투자 라운드
```
GET /v2/projects/{project_id}/funding-rounds
```

#### 3. 프로젝트 검색
```
GET /v2/projects/search?query={project_name}
```

---

## 🛠 구현 방법

### 1. CryptoRank API 클라이언트 생성

```typescript
// src/lib/cryptorank.ts
class CryptoRankAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CRYPTORANK_API_KEY || '';
    this.baseUrl = 'https://api.cryptorank.io/v2';
  }

  private async request(endpoint: string, params?: Record<string, any>) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`CryptoRank API Error: ${response.status}`);
    }

    return response.json();
  }

  // 투자 라운드 검색
  async getFundingRounds(filters?: {
    limit?: number;
    offset?: number;
    projects?: string[];
    roundType?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    return this.request('/funding-rounds', filters);
  }

  // 프로젝트 검색
  async searchProjects(query: string) {
    return this.request('/projects/search', { query });
  }

  // 특정 프로젝트의 투자 라운드
  async getProjectFundingRounds(projectId: string) {
    return this.request(`/projects/${projectId}/funding-rounds`);
  }
}

export const cryptoRankAPI = new CryptoRankAPI();
```

### 2. Next.js API 라우트 생성

```typescript
// src/app/api/funding-rounds/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cryptoRankAPI } from '@/lib/cryptorank';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const projectName = searchParams.get('project');
    
    if (projectName) {
      // 1. 프로젝트 검색
      const searchResults = await cryptoRankAPI.searchProjects(projectName);
      
      if (searchResults.data.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 });
      }
      
      const project = searchResults.data[0];
      
      // 2. 해당 프로젝트의 투자 라운드 가져오기
      const fundingRounds = await cryptoRankAPI.getProjectFundingRounds(project.id);
      
      return NextResponse.json({
        project,
        fundingRounds: fundingRounds.data
      });
    } else {
      // 전체 투자 라운드 목록
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');
      
      const fundingRounds = await cryptoRankAPI.getFundingRounds({
        limit,
        offset
      });
      
      return NextResponse.json(fundingRounds);
    }
  } catch (error) {
    console.error('CryptoRank API Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch funding rounds' },
      { status: 500 }
    );
  }
}
```

---

## 📋 데이터 구조

### 투자 라운드 응답 예시

```json
{
  "data": [
    {
      "id": "123",
      "project": {
        "id": "456",
        "name": "Example Protocol",
        "symbol": "EXP",
        "logo": "https://...",
        "website": "https://example.com"
      },
      "round": {
        "type": "series-a",
        "name": "Series A",
        "announcement_date": "2024-01-15",
        "amount": {
          "value": 50000000,
          "currency": "USD"
        },
        "valuation": {
          "pre_money": 200000000,
          "post_money": 250000000,
          "currency": "USD"
        }
      },
      "investors": [
        {
          "name": "Example Ventures",
          "type": "lead",
          "logo": "https://..."
        },
        {
          "name": "Crypto Fund",
          "type": "participant",
          "logo": "https://..."
        }
      ],
      "sources": [
        {
          "name": "TechCrunch",
          "url": "https://techcrunch.com/...",
          "date": "2024-01-15"
        }
      ]
    }
  ],
  "meta": {
    "total": 1500,
    "limit": 100,
    "offset": 0
  }
}
```

---

## 🔧 기존 시스템과의 통합

### 1. Gemini AI와 CryptoRank 데이터 결합

```typescript
// src/lib/enhancedGemini.ts
import { searchProjectInfo } from './gemini';
import { cryptoRankAPI } from './cryptorank';

export async function getEnhancedProjectInfo(projectName: string) {
  try {
    // 1. Gemini AI로 기본 정보 수집
    const aiResult = await searchProjectInfo(projectName);
    
    // 2. CryptoRank에서 투자 라운드 데이터 보강
    try {
      const cryptoRankData = await fetch(`/api/funding-rounds?project=${projectName}`);
      
      if (cryptoRankData.ok) {
        const { fundingRounds } = await cryptoRankData.json();
        
        // CryptoRank 데이터로 투자 라운드 보강
        const enhancedRounds = fundingRounds.map((round: any) => ({
          round_type: round.round.type,
          round_name: round.round.name,
          date: round.round.announcement_date,
          amount_usd: round.round.amount.value,
          valuation_pre_money_usd: round.round.valuation?.pre_money,
          valuation_post_money_usd: round.round.valuation?.post_money,
          lead_investor: round.investors.find((inv: any) => inv.type === 'lead')?.name,
          investors: round.investors.map((inv: any) => inv.name),
          data_source: 'cryptorank.io',
          source_url: round.sources[0]?.url
        }));
        
        // AI 결과와 CryptoRank 데이터 결합
        return {
          ...aiResult,
          investment_rounds: enhancedRounds.length > 0 ? enhancedRounds : aiResult.investment_rounds
        };
      }
    } catch (cryptoRankError) {
      console.warn('CryptoRank API 호출 실패, AI 데이터만 사용:', cryptoRankError);
    }
    
    return aiResult;
  } catch (error) {
    console.error('Enhanced project info error:', error);
    throw error;
  }
}
```

### 2. 프론트엔드에서 사용

```typescript
// src/app/research/page.tsx에서 수정
import { getEnhancedProjectInfo } from '@/lib/enhancedGemini';

const handleSearch = async (projectName: string) => {
  // 기존 searchProjectInfo 대신 getEnhancedProjectInfo 사용
  const aiResult = await getEnhancedProjectInfo(projectName);
  
  // 나머지 로직은 동일
  // ...
};
```

---

## 📊 장점과 고려사항

### 장점
- **실시간 데이터**: 최신 투자 라운드 정보
- **정확성**: 신뢰할 수 있는 출처의 데이터
- **풍부한 정보**: 투자자, 밸류에이션, 출처 링크 제공

### 고려사항
- **API 비용**: 요청 수에 따른 비용 발생 가능
- **Rate Limiting**: API 호출 제한 준수 필요
- **오류 처리**: API 장애 시 Gemini AI 데이터로 폴백

---

**구현 우선순위:**
1. CryptoRank API 클라이언트 생성
2. Next.js API 라우트 구현
3. 기존 Gemini 시스템과 통합
4. 오류 처리 및 폴백 로직 추가

이렇게 구현하면 더욱 정확하고 실시간성 있는 투자 라운드 데이터를 제공할 수 있습니다!

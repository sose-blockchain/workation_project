interface CryptoRankProject {
  id: string;
  name: string;
  symbol?: string;
  logo?: string;
  website?: string;
}

interface CryptoRankInvestor {
  name: string;
  type: 'lead' | 'participant';
  logo?: string;
}

interface CryptoRankSource {
  name: string;
  url: string;
  date: string;
}

interface CryptoRankRound {
  type: string;
  name: string;
  announcement_date: string;
  amount: {
    value: number;
    currency: string;
  };
  valuation?: {
    pre_money?: number;
    post_money?: number;
    currency: string;
  };
}

interface CryptoRankFundingRound {
  id: string;
  project: CryptoRankProject;
  round: CryptoRankRound;
  investors: CryptoRankInvestor[];
  sources: CryptoRankSource[];
}

interface CryptoRankResponse<T> {
  data: T;
  meta?: {
    total: number;
    limit: number;
    offset: number;
  };
}

class CryptoRankAPI {
  private apiKey: string;
  private baseUrl: string;

  constructor() {
    this.apiKey = process.env.NEXT_PUBLIC_CRYPTORANK_API_KEY || '';
    this.baseUrl = 'https://api.cryptorank.io/v2';
  }

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<CryptoRankResponse<T>> {
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
      throw new Error(`CryptoRank API Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
  }

  // 프로젝트 검색
  async searchProjects(query: string): Promise<CryptoRankResponse<CryptoRankProject[]>> {
    return this.request<CryptoRankProject[]>('/projects/search', { query });
  }

  // 특정 프로젝트의 투자 라운드
  async getProjectFundingRounds(projectId: string): Promise<CryptoRankResponse<CryptoRankFundingRound[]>> {
    return this.request<CryptoRankFundingRound[]>(`/projects/${projectId}/funding-rounds`);
  }

  // 투자 라운드 검색 (프로젝트명으로)
  async getFundingRoundsByProjectName(projectName: string): Promise<CryptoRankFundingRound[]> {
    try {
      // 1. 프로젝트 검색
      const searchResults = await this.searchProjects(projectName);
      
      if (!searchResults.data || searchResults.data.length === 0) {
        console.warn(`CryptoRank: 프로젝트 '${projectName}'을 찾을 수 없습니다.`);
        return [];
      }

      // 2. 가장 유사한 프로젝트 선택 (첫 번째 결과)
      const project = searchResults.data[0];
      
      // 3. 해당 프로젝트의 투자 라운드 가져오기
      const fundingRounds = await this.getProjectFundingRounds(project.id);
      
      return fundingRounds.data || [];
    } catch (error) {
      console.error(`CryptoRank API 오류 (${projectName}):`, error);
      return [];
    }
  }

  // CryptoRank 데이터를 우리 데이터베이스 형식으로 변환
  convertToInvestmentData(fundingRounds: CryptoRankFundingRound[]): any[] {
    return fundingRounds.map(round => ({
      round_type: this.normalizeRoundType(round.round.type),
      round_name: round.round.name,
      date: round.round.announcement_date,
      amount_usd: round.round.amount.value,
      valuation_pre_money_usd: round.round.valuation?.pre_money || null,
      valuation_post_money_usd: round.round.valuation?.post_money || null,
      lead_investor: round.investors.find(inv => inv.type === 'lead')?.name || null,
      investors: round.investors.map(inv => inv.name),
      investor_count: round.investors.length,
      data_source: 'cryptorank.io',
      source_url: round.sources[0]?.url || null,
      announcement_url: round.sources[0]?.url || null,
      notes: `CryptoRank에서 자동 수집된 데이터`
    }));
  }

  // 라운드 타입 정규화
  private normalizeRoundType(type: string): string {
    const typeMap: Record<string, string> = {
      'seed': 'Seed',
      'pre-seed': 'Pre-Seed',
      'series-a': 'Series A',
      'series-b': 'Series B',
      'series-c': 'Series C',
      'private-sale': 'Private Sale',
      'public-sale': 'Public Sale',
      'ico': 'ICO',
      'ido': 'IDO',
      'strategic': 'Strategic',
      'bridge': 'Bridge'
    };

    return typeMap[type.toLowerCase()] || type;
  }
}

export const cryptoRankAPI = new CryptoRankAPI();
export type { CryptoRankFundingRound, CryptoRankProject };

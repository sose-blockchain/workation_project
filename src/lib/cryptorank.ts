interface CryptoRankProject {
  id: string;
  name: string;
  symbol?: string;
  rank?: number;
  type?: string;
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
    
    // API 키 검증
    if (!this.apiKey) {
      console.warn('⚠️ NEXT_PUBLIC_CRYPTORANK_API_KEY가 설정되지 않았습니다.');
    } else {
      console.log('✅ CryptoRank API 키가 설정되었습니다.');
    }
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
        'X-API-KEY': this.apiKey,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CryptoRank API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // 프로젝트 검색
  async searchProjects(query: string): Promise<CryptoRankResponse<CryptoRankProject[]>> {
    return this.request<CryptoRankProject[]>('/currencies', { query, limit: 10 });
  }

  // 프로젝트 기본 정보 가져오기 (이름, 심볼만)
  async getProjectInfo(projectName: string): Promise<CryptoRankProject | null> {
    try {
      const searchResults = await this.searchProjects(projectName);
      
      if (!searchResults.data || searchResults.data.length === 0) {
        console.log(`CryptoRank: 프로젝트 '${projectName}'을 찾을 수 없습니다.`);
        return null;
      }

      const project = searchResults.data[0];
      
      console.log(`CryptoRank: ${project.name} (${project.symbol}) 정보 가져옴`);
      
      return {
        id: project.id,
        name: project.name,
        symbol: project.symbol,
        rank: project.rank,
        type: project.type
      };
    } catch (error) {
      console.error(`CryptoRank API 오류 (${projectName}):`, error);
      return null;
    }
  }
}

export const cryptoRankAPI = new CryptoRankAPI();
export type { CryptoRankProject };

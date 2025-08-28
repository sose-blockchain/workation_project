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
    
    if (!this.apiKey) {
      console.warn('⚠️ NEXT_PUBLIC_CRYPTORANK_API_KEY가 설정되지 않았습니다.');
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
    return this.request<CryptoRankProject[]>('/currencies', { query, limit: 100 });
  }

  // 프로젝트 기본 정보 가져오기 (이름, 심볼만)
  async getProjectInfo(projectName: string): Promise<CryptoRankProject | null> {
    try {
      const searchResults = await this.searchProjects(projectName);
      
      console.log(`🔍 CryptoRank 검색 결과 (${projectName}):`, {
        totalResults: searchResults.data?.length || 0,
        firstFew: searchResults.data?.slice(0, 3).map(p => ({ name: p.name, symbol: p.symbol })) || []
      });
      
      if (!searchResults.data || searchResults.data.length === 0) {
        console.log(`CryptoRank: 프로젝트 '${projectName}'을 찾을 수 없습니다.`);
        return null;
      }

      // 더 정확한 매칭을 위해 여러 조건으로 검색
      let project = null;
      const query = projectName.toLowerCase();
      
      // 1. 정확한 이름 일치 찾기
      project = searchResults.data.find(p => 
        p.name.toLowerCase() === query
      );
      
      if (!project) {
        // 2. 심볼 정확 일치 찾기  
        project = searchResults.data.find(p => 
          p.symbol && p.symbol.toLowerCase() === query
        );
      }
      
      if (!project) {
        // 3. 이름이 쿼리로 시작하는 것 찾기
        project = searchResults.data.find(p => 
          p.name.toLowerCase().startsWith(query)
        );
      }
      
      if (!project) {
        // 4. 이름에 쿼리가 포함된 것 찾기 (단, Bitcoin, Ethereum 등 제외)
        const excludedProjects = ['bitcoin', 'ethereum', 'tether', 'binance coin', 'cardano'];
        project = searchResults.data.find(p => 
          p.name.toLowerCase().includes(query) && 
          !excludedProjects.includes(p.name.toLowerCase())
        );
      }
      
      // 5. 마지막 수단으로 첫 번째 결과 사용 (단, 명백히 다른 프로젝트는 제외)
      if (!project) {
        const firstResult = searchResults.data[0];
        const similarity = this.calculateSimilarity(query, firstResult.name.toLowerCase());
        
        if (similarity < 0.3) { // 유사도가 30% 미만이면 무시
          console.log(`❌ CryptoRank: '${projectName}' 검색 결과가 부정확함 (${firstResult.name}, 유사도: ${Math.round(similarity * 100)}%)`);
          return null;
        }
        project = firstResult;
      }
      
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

  // Levenshtein 거리 기반 유사도 계산
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) return 1.0;
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }
}

export const cryptoRankAPI = new CryptoRankAPI();
export type { CryptoRankProject };

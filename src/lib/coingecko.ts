interface CoinGeckoProject {
  id: string;
  name: string;
  symbol?: string;
  market_cap_rank?: number;
  image?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  price_change_percentage_24h?: number;
}

interface CoinGeckoSearchResult {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number;
    thumb: string;
    large: string;
  }>;
}

interface CoinGeckoResponse<T> {
  data?: T;
  coins?: T;
}

class CoinGeckoAPI {
  private apiKey: string;
  private apiHost: string;
  private baseUrl: string;

  constructor() {
    // Twitter API와 동일한 RapidAPI 키 사용
    this.apiKey = process.env.NEXT_PUBLIC_TWITTER_API_KEY || '';
    this.apiHost = process.env.NEXT_PUBLIC_COINGECKO_API_HOST || 'coingecko-api-without-rate-limit.p.rapidapi.com';
    this.baseUrl = `https://${this.apiHost}`;
    
    if (!this.apiKey) {
      console.warn('⚠️ NEXT_PUBLIC_TWITTER_API_KEY가 설정되지 않았습니다. (CoinGecko API 키로 사용)');
    }
    if (!process.env.NEXT_PUBLIC_COINGECKO_API_HOST) {
      console.warn('⚠️ NEXT_PUBLIC_COINGECKO_API_HOST가 설정되지 않았습니다. 기본값 사용: coingecko-api-without-rate-limit.p.rapidapi.com');
    }
  }

  private async request<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, value.toString());
        }
      });
    }

    console.log(`🦎 CoinGecko API 호출: ${endpoint}`, params || {});

    const response = await fetch(url.toString(), {
      headers: {
        'X-RapidAPI-Key': this.apiKey,
        'X-RapidAPI-Host': this.apiHost,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`CoinGecko API Error: ${response.status} - ${errorText}`);
    }

    return response.json();
  }

  // 프로젝트 검색 (search endpoint 사용)
  async searchProjects(query: string): Promise<CoinGeckoSearchResult> {
    return this.request<CoinGeckoSearchResult>('/api/v3/search', { query });
  }

  // 특정 코인 정보 가져오기
  async getCoinById(coinId: string): Promise<CoinGeckoProject | null> {
    try {
      const coinData = await this.request<CoinGeckoProject>(`/api/v3/coins/${coinId}`, {
        localization: false,
        tickers: false,
        market_data: true,
        community_data: false,
        developer_data: false,
        sparkline: false
      });
      
      return coinData;
    } catch (error) {
      console.error(`CoinGecko: 코인 정보 가져오기 실패 (${coinId}):`, error);
      return null;
    }
  }

  // 코인 목록으로 기본 정보 가져오기 (더 빠름)
  async getCoinsMarkets(coinIds: string[]): Promise<CoinGeckoProject[]> {
    try {
      const markets = await this.request<CoinGeckoProject[]>('/api/v3/coins/markets', {
        vs_currency: 'usd',
        ids: coinIds.join(','),
        order: 'market_cap_desc',
        per_page: 10,
        page: 1,
        sparkline: false,
        price_change_percentage: '24h'
      });
      
      return markets || [];
    } catch (error) {
      console.error('CoinGecko: 코인 마켓 데이터 가져오기 실패:', error);
      return [];
    }
  }

  // 프로젝트 기본 정보 가져오기 (이름, 심볼, 순위)
  async getProjectInfo(projectName: string): Promise<CoinGeckoProject | null> {
    try {
      const searchResults = await this.searchProjects(projectName);
      
      console.log(`🔍 CoinGecko 검색 결과 (${projectName}):`, {
        totalResults: searchResults.coins?.length || 0,
        firstFew: searchResults.coins?.slice(0, 3).map(c => ({ 
          name: c.name, 
          symbol: c.symbol,
          rank: c.market_cap_rank 
        })) || []
      });
      
      if (!searchResults.coins || searchResults.coins.length === 0) {
        console.log(`CoinGecko: 프로젝트 '${projectName}'을 찾을 수 없습니다.`);
        return null;
      }

      // 더 정확한 매칭을 위해 여러 조건으로 검색
      let project = null;
      const query = projectName.toLowerCase();
      
      // 1. 정확한 이름 일치 찾기
      project = searchResults.coins.find(c => 
        c.name.toLowerCase() === query
      );
      
      if (!project) {
        // 2. 심볼 정확 일치 찾기  
        project = searchResults.coins.find(c => 
          c.symbol && c.symbol.toLowerCase() === query
        );
      }
      
      if (!project) {
        // 3. 이름이 쿼리로 시작하는 것 찾기
        project = searchResults.coins.find(c => 
          c.name.toLowerCase().startsWith(query)
        );
      }
      
      if (!project) {
        // 4. 이름에 쿼리가 포함된 것 찾기 (유사도 검증)
        const candidates = searchResults.coins.filter(c => 
          c.name.toLowerCase().includes(query)
        );
        
        // 포함된 후보들 중에서 가장 유사한 것 선택 (마켓캡 순위도 고려)
        if (candidates.length > 0) {
          project = candidates.reduce((best, current) => {
            const bestSim = this.calculateSimilarity(query, best.name.toLowerCase());
            const currentSim = this.calculateSimilarity(query, current.name.toLowerCase());
            
            // 유사도가 같다면 마켓캡 순위가 높은 것 선택
            if (Math.abs(currentSim - bestSim) < 0.1) {
              return (current.market_cap_rank || 999999) < (best.market_cap_rank || 999999) ? current : best;
            }
            return currentSim > bestSim ? current : best;
          });
        }
      }
      
      // 5. 마지막 수단으로 첫 번째 결과 사용 (유사도 검증)
      if (!project) {
        const firstResult = searchResults.coins[0];
        const similarity = this.calculateSimilarity(query, firstResult.name.toLowerCase());
        
        // 유사도가 30% 미만이면 무시
        if (similarity < 0.3) {
          console.log(`❌ CoinGecko: '${projectName}' 검색 결과가 부정확함 (${firstResult.name}, 유사도: ${Math.round(similarity * 100)}%)`);
          return null;
        }
        project = firstResult;
      }
      
      console.log(`✅ CoinGecko: ${project.name} (${project.symbol?.toUpperCase()}) 정보 가져옴 - 순위: ${project.market_cap_rank || 'N/A'}`);
      
      // 추가 시장 데이터 가져오기 (선택적)
      let enhancedProject: CoinGeckoProject = {
        id: project.id,
        name: project.name,
        symbol: project.symbol?.toUpperCase(),
        market_cap_rank: project.market_cap_rank,
        image: project.large
      };

      // 시장 데이터가 필요한 경우 추가 호출
      try {
        const marketData = await this.getCoinsMarkets([project.id]);
        if (marketData.length > 0) {
          const market = marketData[0];
          enhancedProject = {
            ...enhancedProject,
            current_price: market.current_price,
            market_cap: market.market_cap,
            total_volume: market.total_volume,
            price_change_percentage_24h: market.price_change_percentage_24h
          };
        }
      } catch (marketError) {
        console.warn('CoinGecko: 시장 데이터 가져오기 실패 (기본 정보는 유지):', marketError);
      }
      
      return enhancedProject;
    } catch (error) {
      console.error(`CoinGecko API 오류 (${projectName}):`, error);
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

export const coinGeckoAPI = new CoinGeckoAPI();
export type { CoinGeckoProject };

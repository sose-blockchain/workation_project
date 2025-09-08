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

  // 마켓 데이터 가져오기 (개선된 방법)
  async getCoinsMarketData(options: {
    vs_currency?: string;
    ids?: string;
    category?: string;
    order?: string;
    per_page?: number;
    page?: number;
    sparkline?: boolean;
    price_change_percentage?: string;
    locale?: string;
    precision?: number;
  } = {}): Promise<CoinGeckoProject[]> {
    try {
      console.log(`🦎 CoinGecko 마켓 데이터 API 호출`);
      
      const params = {
        vs_currency: options.vs_currency || 'usd',
        order: options.order || 'market_cap_desc',
        per_page: options.per_page || 100,
        page: options.page || 1,
        sparkline: options.sparkline || false,
        price_change_percentage: options.price_change_percentage || '24h',
        locale: options.locale || 'en',
        precision: options.precision || 2,
        ...options
      };

      const markets = await this.request<CoinGeckoProject[]>('/api/v3/coins/markets', params);
      
      console.log(`✅ CoinGecko 마켓 데이터 ${markets?.length || 0}개 조회 완료`);
      return markets || [];
    } catch (error) {
      console.error('CoinGecko 마켓 데이터 가져오기 실패:', error);
      return [];
    }
  }

  // 프로젝트 이름으로 마켓 데이터 검색
  async searchProjectByMarketData(projectName: string): Promise<CoinGeckoProject | null> {
    try {
      console.log(`🔍 마켓 데이터에서 "${projectName}" 검색 시작`);
      
      // 첫 번째 페이지에서 검색 (상위 100개)
      let allCoins = await this.getCoinsMarketData({ per_page: 100, page: 1 });
      
      if (allCoins.length === 0) {
        console.log('❌ 마켓 데이터를 가져올 수 없습니다.');
        return null;
      }

      const query = projectName.toLowerCase();
      
      // 정확한 매칭 시도
      let project = allCoins.find(coin => 
        coin.name?.toLowerCase() === query ||
        coin.symbol?.toLowerCase() === query ||
        coin.id?.toLowerCase() === query
      );

      if (!project) {
        // 부분 매칭 시도
        project = allCoins.find(coin => 
          coin.name?.toLowerCase().includes(query) ||
          coin.symbol?.toLowerCase().includes(query) ||
          coin.id?.toLowerCase().includes(query)
        );
      }

      if (!project && allCoins.length === 100) {
        // 두 번째 페이지도 검색
        console.log('🔍 두 번째 페이지에서 계속 검색...');
        const secondPage = await this.getCoinsMarketData({ per_page: 100, page: 2 });
        allCoins = [...allCoins, ...secondPage];
        
        project = allCoins.find(coin => 
          coin.name?.toLowerCase().includes(query) ||
          coin.symbol?.toLowerCase().includes(query) ||
          coin.id?.toLowerCase().includes(query)
        );
      }

      if (project) {
        console.log(`✅ 마켓 데이터에서 발견: ${project.name} (${project.symbol}) - 순위: ${project.market_cap_rank}`);
        console.log(`💰 현재 가격: $${project.current_price}, 24h 변동: ${project.price_change_percentage_24h?.toFixed(2)}%`);
        return project;
      } else {
        console.log(`❌ 마켓 데이터에서 "${projectName}"을 찾을 수 없습니다.`);
        return null;
      }
    } catch (error) {
      console.error(`마켓 데이터 검색 오류 (${projectName}):`, error);
      return null;
    }
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

  // 프로젝트 기본 정보 가져오기 (마켓 데이터 우선 사용)
  async getProjectInfo(projectName: string): Promise<CoinGeckoProject | null> {
    try {
      console.log(`🔍 CoinGecko 프로젝트 정보 검색: ${projectName}`);
      
      // 먼저 마켓 데이터에서 검색 시도 (더 안정적)
      let project = await this.searchProjectByMarketData(projectName);
      
      if (project) {
        console.log(`✅ 마켓 데이터로 프로젝트 발견: ${project.name}`);
        return project;
      }

      // 마켓 데이터에서 찾지 못하면 검색 API 시도
      console.log(`🔍 마켓 데이터에서 찾지 못함. 검색 API 시도...`);
      
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
          console.log(`❌ CoinGecko: 프로젝트 '${projectName}'을 찾을 수 없습니다.`);
          return null;
        }

        // 검색 결과에서 가장 적합한 프로젝트 선택
        const query = projectName.toLowerCase();
        let searchProject = null;
        
        // 1. 정확한 이름 일치 찾기
        searchProject = searchResults.coins.find(c => 
          c.name.toLowerCase() === query
        );
        
        if (!searchProject) {
          // 2. 심볼 정확 일치 찾기  
          searchProject = searchResults.coins.find(c => 
            c.symbol && c.symbol.toLowerCase() === query
          );
        }
        
        if (!searchProject) {
          // 3. 이름이 쿼리로 시작하는 것 찾기
          searchProject = searchResults.coins.find(c => 
            c.name.toLowerCase().startsWith(query)
          );
        }
        
        if (!searchProject) {
          // 4. 이름에 쿼리가 포함된 것 찾기 (유사도 검증)
          const candidates = searchResults.coins.filter(c => 
            c.name.toLowerCase().includes(query)
          );
          
          if (candidates.length > 0) {
            searchProject = candidates.reduce((best, current) => {
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
        if (!searchProject) {
          const firstResult = searchResults.coins[0];
          const similarity = this.calculateSimilarity(query, firstResult.name.toLowerCase());
          
          // 유사도가 30% 미만이면 무시
          if (similarity < 0.3) {
            console.log(`❌ CoinGecko: '${projectName}' 검색 결과가 부정확함 (${firstResult.name}, 유사도: ${Math.round(similarity * 100)}%)`);
            return null;
          }
          searchProject = firstResult;
        }

        if (searchProject) {
          console.log(`✅ 검색 API로 발견: ${searchProject.name} (${searchProject.symbol?.toUpperCase()}) - 순위: ${searchProject.market_cap_rank || 'N/A'}`);
          
          // 검색 결과를 마켓 데이터 형식으로 변환
          const enhancedProject: CoinGeckoProject = {
            id: searchProject.id,
            name: searchProject.name,
            symbol: searchProject.symbol?.toUpperCase(),
            market_cap_rank: searchProject.market_cap_rank,
            image: searchProject.large
          };

          // 추가 시장 데이터 가져오기 시도
          try {
            const marketData = await this.getCoinsMarkets([searchProject.id]);
            if (marketData.length > 0) {
              const market = marketData[0];
              return {
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
        }
      } catch (searchError) {
        console.warn(`CoinGecko 검색 API 오류: ${searchError}`);
      }

      console.log(`❌ CoinGecko: '${projectName}'을 찾을 수 없습니다.`);
      return null;
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



// 브라우저 테스트 함수들
if (typeof window !== 'undefined') {
  // CoinGecko 마켓 데이터 테스트
  (window as any).testCoinGeckoMarketData = async () => {
    console.log('🧪 CoinGecko 마켓 데이터 테스트 시작...');
    
    try {
      const marketData = await coinGeckoAPI.getCoinsMarketData({ 
        per_page: 10,
        page: 1
      });
      
      console.log('✅ 마켓 데이터 테스트 성공:', {
        totalCoins: marketData.length,
        topCoins: marketData.slice(0, 5).map(coin => ({
          name: coin.name,
          symbol: coin.symbol,
          price: coin.current_price,
          rank: coin.market_cap_rank,
          change_24h: coin.price_change_percentage_24h
        }))
      });
      
      return marketData;
    } catch (error) {
      console.error('❌ 마켓 데이터 테스트 실패:', error);
      return null;
    }
  };

  // 특정 프로젝트 검색 테스트
  (window as any).testCoinGeckoSearch = async (projectName: string) => {
    console.log(`🔍 CoinGecko 프로젝트 검색 테스트: ${projectName}`);
    
    try {
      const result = await coinGeckoAPI.getProjectInfo(projectName);
      
      if (result) {
        console.log('✅ 프로젝트 검색 성공:', {
          name: result.name,
          symbol: result.symbol,
          rank: result.market_cap_rank,
          price: result.current_price,
          marketCap: result.market_cap,
          change24h: result.price_change_percentage_24h
        });
      } else {
        console.log(`❌ 프로젝트 "${projectName}"을 찾을 수 없습니다.`);
      }
      
      return result;
    } catch (error) {
      console.error('❌ 프로젝트 검색 테스트 실패:', error);
      return null;
    }
  };

  // 여러 프로젝트 테스트
  (window as any).testMultipleProjects = async () => {
    console.log('🧪 여러 프로젝트 검색 테스트 시작...');
    
    const testProjects = ['bitcoin', 'ethereum', 'berachain', 'solana', 'sui'];
    
    for (const project of testProjects) {
      console.log(`\n🔍 테스트: ${project}`);
      try {
        const result = await coinGeckoAPI.searchProjectByMarketData(project);
        if (result) {
          console.log(`✅ ${project}: ${result.name} ($${result.current_price})`);
        } else {
          console.log(`❌ ${project}: 찾을 수 없음`);
        }
      } catch (error) {
        console.error(`💥 ${project}: 오류 -`, error);
      }
      
      // API 제한을 위한 지연
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('🏁 여러 프로젝트 테스트 완료');
  };

  console.log('🦎 CoinGecko 테스트 함수 준비 완료:');
  console.log('- testCoinGeckoMarketData() : 마켓 데이터 상위 10개 조회');
  console.log('- testCoinGeckoSearch("프로젝트명") : 특정 프로젝트 검색');
  console.log('- testMultipleProjects() : 여러 프로젝트 일괄 테스트');
}

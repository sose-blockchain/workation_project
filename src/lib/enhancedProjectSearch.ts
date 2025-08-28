import { searchProjectInfo } from './gemini';

interface EnhancedProjectResult {
  project: any;
  investment_rounds: any[] | null;
  data_sources: {
    basic_info: string;
    investment_data: string;
  };
}

// Gemini AI와 CryptoRank API를 결합한 향상된 프로젝트 검색
export async function getEnhancedProjectInfo(projectName: string): Promise<EnhancedProjectResult> {
  try {
    console.log(`Enhanced search started for: ${projectName}`);

    // 1. Gemini AI로 기본 프로젝트 정보 수집 (투자 라운드 제외)
    const aiResult = await searchProjectInfo(projectName);
    console.log('Gemini AI result received');

    // 2. CryptoRank API에서 투자 라운드 데이터 가져오기
    let cryptoRankRounds: any[] = [];
    let investmentDataSource = 'AI 분석';

    try {
      console.log(`Fetching investment data from CryptoRank for: ${projectName}`);
      
      const response = await fetch(`/api/funding-rounds?project=${encodeURIComponent(projectName)}`);
      
      if (response.ok) {
        const cryptoRankData = await response.json();
        
        if (cryptoRankData.fundingRounds && cryptoRankData.fundingRounds.length > 0) {
          cryptoRankRounds = cryptoRankData.fundingRounds;
          investmentDataSource = 'cryptorank.io';
          console.log(`Found ${cryptoRankRounds.length} funding rounds from CryptoRank`);
        } else {
          console.log('No funding rounds found in CryptoRank');
        }
      } else {
        console.warn('CryptoRank API response not ok:', response.status);
      }
    } catch (cryptoRankError) {
      console.warn('CryptoRank API 호출 실패:', cryptoRankError);
    }

    // 3. 최종 결과 구성
    const finalInvestmentRounds = cryptoRankRounds.length > 0 
      ? cryptoRankRounds 
      : aiResult.investment_rounds;

    const result: EnhancedProjectResult = {
      project: aiResult.project,
      investment_rounds: finalInvestmentRounds,
      data_sources: {
        basic_info: 'Gemini AI',
        investment_data: cryptoRankRounds.length > 0 ? 'cryptorank.io' : 'AI 분석'
      }
    };

    console.log(`Enhanced search completed. Investment data source: ${result.data_sources.investment_data}`);
    return result;

  } catch (error) {
    console.error('Enhanced project search error:', error);
    
    // 오류 발생 시 Gemini AI 결과만 반환
    const aiResult = await searchProjectInfo(projectName);
    return {
      project: aiResult.project,
      investment_rounds: aiResult.investment_rounds,
      data_sources: {
        basic_info: 'Gemini AI',
        investment_data: 'AI 분석 (CryptoRank API 오류)'
      }
    };
  }
}

// 프로젝트명 정규화 (CryptoRank 검색 정확도 향상)
export function normalizeProjectName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
    // 일반적인 토큰 접미사 제거
    .replace(/\s*(token|coin|protocol|finance|network|chain)$/i, '')
    .trim();
}

// 여러 프로젝트 일괄 검색
export async function batchEnhancedProjectSearch(projectNames: string[]): Promise<EnhancedProjectResult[]> {
  const results = await Promise.all(
    projectNames.map(name => getEnhancedProjectInfo(name))
  );
  
  return results;
}

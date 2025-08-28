import { searchProjectInfo } from './gemini';
import { cryptoRankAPI } from './cryptorank';

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

    // 1. CryptoRank API에서 기본 정보 (이름, 심볼) 가져오기
    let cryptoRankProject = null;
    try {
      cryptoRankProject = await cryptoRankAPI.getProjectInfo(projectName);
    } catch (cryptoRankError) {
      console.warn('CryptoRank API 호출 실패:', cryptoRankError);
    }

    // 2. Gemini AI로 전체 프로젝트 정보 수집 (투자 라운드 포함)
    const aiResult = await searchProjectInfo(projectName);
    console.log('Gemini AI result received');

    // 3. CryptoRank에서 가져온 정보로 AI 결과 보완
    let finalProject = aiResult.project;
    let basicInfoSource = 'Gemini AI';

    if (cryptoRankProject) {
      // CryptoRank에서 가져온 정확한 정보로 업데이트
      finalProject = {
        ...aiResult.project,
        name: cryptoRankProject.name, // CryptoRank의 정확한 프로젝트명 사용
        token_symbol: cryptoRankProject.symbol, // CryptoRank의 정확한 심볼 사용
      };
      basicInfoSource = 'CryptoRank API + Gemini AI';
      console.log(`CryptoRank에서 정확한 프로젝트 정보 보완: ${cryptoRankProject.name} (${cryptoRankProject.symbol})`);
    }

    const result: EnhancedProjectResult = {
      project: finalProject,
      investment_rounds: aiResult.investment_rounds, // 투자 라운드는 항상 AI에서
      data_sources: {
        basic_info: basicInfoSource,
        investment_data: 'AI 분석' // 투자 데이터는 항상 AI 분석
      }
    };

    console.log(`Enhanced search completed. Basic info: ${result.data_sources.basic_info}, Investment data: ${result.data_sources.investment_data}`);
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
        investment_data: 'AI 분석'
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

import { searchProjectInfo } from './gemini';
import { cryptoRankAPI } from './cryptorank';
import { twitterService, TwitterService } from './twitterService';

interface EnhancedProjectResult {
  project: any;
  investment_rounds: any[] | null;
  twitter_account_id?: string | null;
  data_sources: {
    basic_info: string;
    investment_data: string;
    twitter_data?: string;
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
      console.log('✅ CryptoRank API 호출 성공');
    } catch (cryptoRankError) {
      console.warn('⚠️ CryptoRank API 호출 실패 (계속 진행):', cryptoRankError);
      // CryptoRank 실패해도 계속 진행
    }

    // 2. Gemini AI로 기본 프로젝트 정보 수집 (투자 라운드 제외)
    const aiResult = await searchProjectInfo(projectName);
    console.log('🤖 Gemini AI 응답:', {
      name: aiResult.project.name,
      token_symbol: aiResult.project.token_symbol,
      description: aiResult.project.description?.substring(0, 100) + '...'
    });

    // 3. CryptoRank에서 가져온 정보로 AI 결과 보완 (정확한 매칭 확인)
    let finalProject: any = { ...aiResult.project };
    let basicInfoSource = 'Gemini AI';

    if (cryptoRankProject) {
      console.log('🔍 CryptoRank vs AI 프로젝트 비교:', {
        input: projectName,
        cryptorank: cryptoRankProject.name,
        ai: aiResult.project.name
      });

      // 검색어와 CryptoRank 결과가 유사한지 확인
      const searchSimilarity = calculateSimilarity(
        projectName.toLowerCase(),
        cryptoRankProject.name.toLowerCase()
      );
      
      console.log(`📊 유사도 검사: ${searchSimilarity}%`);

      // 유사도가 70% 이상일 때만 CryptoRank 정보 사용
      if (searchSimilarity >= 70) {
        finalProject = {
          ...aiResult.project,
          name: cryptoRankProject.name,
          token_symbol: cryptoRankProject.symbol,
        };
        basicInfoSource = 'CryptoRank API + Gemini AI';
        console.log(`✅ CryptoRank 정보 적용: ${cryptoRankProject.name} (${cryptoRankProject.symbol})`);
      } else {
        console.log(`❌ CryptoRank 정보 무시 (유사도 낮음): ${cryptoRankProject.name}`);
      }
    }

    // 4. 트위터 정보 수집 (AI 검색 결과에서 트위터 URL 추출)
    let twitterAccountId = null;
    let twitterDataSource = null;
    
    try {
      // AI 검색 결과에서 트위터 URL 찾기
      const potentialTwitterUrls = [
        aiResult.project.project_twitter_url,
        ...(aiResult.project.team_twitter_urls || [])
      ].filter(Boolean);

      console.log('🔍 AI에서 발견된 잠재적 트위터 URL들:', potentialTwitterUrls);

      // 첫 번째로 유효한 트위터 URL 찾기
      const twitterUrls = potentialTwitterUrls.filter((url: string) => {
        if (!url || typeof url !== 'string') return false;
        
        // 트위터/X 도메인 포함 여부 확인
        const isTwitterUrl = url.includes('twitter.com') || url.includes('x.com') || url.startsWith('@');
        
        if (isTwitterUrl) {
          console.log(`✅ 유효한 트위터 URL 발견: ${url}`);
          return true;
        }
        
        return false;
      });

      if (twitterUrls.length > 0) {
        const twitterUrl = twitterUrls[0]; // 첫 번째 트위터 URL 사용
        const handle = TwitterService.extractTwitterHandle(twitterUrl);
        
        if (handle) {
          console.log(`트위터 계정 발견: @${handle}`);
          // 프로젝트가 저장된 후에 트위터 정보를 수집하기 위해 URL만 저장
          finalProject.detected_twitter_url = twitterUrl;
          twitterDataSource = 'AI 검색 결과에서 추출';
        }
      }
    } catch (twitterError) {
      console.warn('트위터 정보 추출 중 오류:', twitterError);
    }

    const result: EnhancedProjectResult = {
      project: finalProject,
      investment_rounds: null, // 투자 라운드 데이터 수집 비활성화
      twitter_account_id: twitterAccountId,
      data_sources: {
        basic_info: basicInfoSource,
        investment_data: '프리미엄 서비스 예정', // 투자 데이터는 프리미엄 서비스
        twitter_data: twitterDataSource || undefined
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
      investment_rounds: null, // 투자 라운드 데이터 수집 비활성화
      data_sources: {
        basic_info: 'Gemini AI',
        investment_data: '프리미엄 서비스 예정'
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

// 문자열 유사도 계산 (레벤슈타인 거리 기반)
function calculateSimilarity(str1: string, str2: string): number {
  const matrix: number[][] = [];
  
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
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }
  
  const maxLength = Math.max(str1.length, str2.length);
  const distance = matrix[str2.length][str1.length];
  return Math.round(((maxLength - distance) / maxLength) * 100);
}

// 여러 프로젝트 일괄 검색
export async function batchEnhancedProjectSearch(projectNames: string[]): Promise<EnhancedProjectResult[]> {
  const results = await Promise.all(
    projectNames.map(name => getEnhancedProjectInfo(name))
  );
  
  return results;
}

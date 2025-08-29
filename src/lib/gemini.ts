import { GoogleGenerativeAI } from '@google/generative-ai'

// 안전한 Gemini 클라이언트 생성 함수
const createGeminiClient = () => {
  // 클라이언트 사이드에서만 실행
  if (typeof window === 'undefined') {
    return null
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  if (!apiKey) {
    console.warn('Gemini API key is not set')
    return null
  }
  
  try {
    return new GoogleGenerativeAI(apiKey)
  } catch (error) {
    console.error('Failed to create Gemini client:', error)
    return null
  }
}

// Gemini 클라이언트 인스턴스
export const genAI = createGeminiClient()

// 프로젝트 정보 검색 함수
export async function searchProjectInfo(projectName: string) {
  if (!genAI) {
    throw new Error('Gemini API is not initialized')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })

  const prompt = `
블록체인 프로젝트 "${projectName}"에 대한 정보를 정확히 수집해서 JSON으로 응답해주세요.

🚨 핵심 규칙:
1. "${projectName}" 프로젝트에 대해서만 정보 제공 (다른 프로젝트 절대 금지)
2. 모르는 정보는 null로 설정
3. JSON 형식만 응답 (다른 텍스트 없이)

응답 형식:
{
  "name": "${projectName}",
  "token_symbol": "토큰 심볼 (${projectName} 전용, 미상장이면 null)",
  "description": "프로젝트 설명 (한글 2-3문장)",
  "keyword1": "Layer1 또는 Layer2 또는 DApp 중 하나",
  "keyword2": "세부 영역 (DeFi, GameFi, Infrastructure, NFT, Bridge 등)",
  "keyword3": "고유 특징 (Zero-Knowledge, Cross-Chain, Proof-of-Stake 등)",
  "homepage_url": "공식 홈페이지 URL",
  "whitepaper_url": "백서 URL",
  "docs_url": "문서 URL",
  "blog_url": "블로그 URL",
  "github_url": "GitHub URL",
  "project_twitter_url": "공식 트위터 URL (https://twitter.com/... 또는 https://x.com/... 형태)",
  "team_twitter_urls": ["팀원 트위터 URL 배열"],
  "market_data": null
}

실제 예시 - Berachain 검색:
{
  "name": "Berachain",
  "token_symbol": "BERA",
  "description": "Berachain은 Cosmos SDK와 Polaris EVM을 기반으로 하는 EVM 호환 Layer1 블록체인입니다. Proof-of-Liquidity 합의 메커니즘을 사용하여 유동성 공급자에게 인센티브를 제공합니다.",
  "keyword1": "Layer1",
  "keyword2": "DeFi",
  "keyword3": "Proof-of-Liquidity",
  "homepage_url": "https://berachain.com",
  "whitepaper_url": "https://docs.berachain.com/whitepaper",
  "docs_url": "https://docs.berachain.com",
  "blog_url": "https://blog.berachain.com",
  "github_url": "https://github.com/berachain",
  "project_twitter_url": "https://twitter.com/berachain",
  "team_twitter_urls": ["https://twitter.com/dev_bear", "https://twitter.com/0xhoneyjar"],
  "market_data": null
}

이제 "${projectName}"에 대해 같은 형식으로 정확한 정보를 제공해주세요:
`

  try {
    const aiResponse = await model.generateContent(prompt)
    const response = await aiResponse.response
    let text = response.text().trim()
    
    // JSON 블록에서 JSON만 추출
    if (text.includes('```json')) {
      text = text.replace(/```json\s*/, '').replace(/```\s*$/, '')
    }
    if (text.includes('```')) {
      text = text.replace(/```\s*/, '').replace(/```\s*$/, '')
    }
    
    // JSON 파싱
    const projectInfo = JSON.parse(text)
    
    // AI 응답 검증: 검색어와 응답이 일치하는지 확인
    if (projectInfo.name && projectInfo.name.toLowerCase() !== projectName.toLowerCase()) {
      console.warn(`⚠️ AI 응답 불일치 감지:`, {
        requested: projectName,
        received: projectInfo.name,
        fixing: '검색어로 수정'
      });
      // 검색어로 강제 수정
      projectInfo.name = projectName.toLowerCase().trim();
    }
    
    // 잘못된 토큰 심볼 검증 (Bitcoin/BTC 방지)
    if (projectInfo.token_symbol) {
      const commonWrongSymbols = ['btc', 'eth', 'usdt', 'usdc', 'bnb'];
      if (commonWrongSymbols.includes(projectInfo.token_symbol.toLowerCase()) && 
          !projectName.toLowerCase().includes(projectInfo.token_symbol.toLowerCase())) {
        console.warn(`⚠️ 잘못된 토큰 심볼 감지: ${projectInfo.token_symbol} (검색어: ${projectName})`);
        projectInfo.token_symbol = null; // 잘못된 심볼 제거
      }
    }
    
    // 프로젝트명 정규화 (영문 소문자)
    const normalizedName = projectInfo.name 
      ? projectInfo.name.toLowerCase().trim()
      : projectName.toLowerCase().trim()
    
    // AI 응답을 정규화된 스키마로 분리
    const result = {
      // projects 테이블용 기본 정보
      project: {
        name: normalizedName,
        token_symbol: projectInfo.token_symbol || null,
        description: projectInfo.description || null,
        keyword1: projectInfo.keyword1 || null,
        keyword2: projectInfo.keyword2 || null,
        keyword3: projectInfo.keyword3 || null,
        homepage_url: projectInfo.homepage_url || null,
        whitepaper_url: projectInfo.whitepaper_url || null,
        docs_url: projectInfo.docs_url || null,
        blog_url: projectInfo.blog_url || null,
        github_url: projectInfo.github_url || null,
        project_twitter_url: projectInfo.project_twitter_url || null,
        team_twitter_urls: projectInfo.team_twitter_urls || null
      },
      // market_data 테이블용 데이터
      market_data: projectInfo.market_data || null,
      // investments 테이블용 데이터
      investment_rounds: projectInfo.investment_rounds || null
    }
    
    return result
  } catch (error) {
    console.error('Error searching project info:', error)
    
    // API 키 오류 특별 처리
    if (error instanceof Error && error.message.includes('API key not valid')) {
      console.error('🚨 Gemini API 키가 유효하지 않습니다. 환경변수를 확인해주세요.')
    }
    
    // 기본 프로젝트 정보 반환 (AI 실패 시)
    const fallbackName = projectName.toLowerCase().trim()
    return {
      project: {
        name: fallbackName,
        token_symbol: null,
        description: `${projectName} 프로젝트에 대한 정보를 자동으로 수집할 수 없었습니다. Gemini API 연결에 문제가 있습니다. 수동으로 정보를 입력해주세요.`,
        keyword1: "DApp", // 기본값
        keyword2: "Infrastructure", // 기본값
        keyword3: "Blockchain", // 기본값
        homepage_url: null,
        whitepaper_url: null,
        docs_url: null,
        blog_url: null,
        github_url: null,
        project_twitter_url: null,
        team_twitter_urls: null
      },
      market_data: null,
      investment_rounds: null
    }
  }
}

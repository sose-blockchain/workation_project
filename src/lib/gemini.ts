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
다음 블록체인 프로젝트에 대한 정보를 정확한 JSON 형태로만 제공해주세요: "${projectName}"

⚠️ 중요: 반드시 "${projectName}" 프로젝트에 대해서만 정보를 제공하세요. 다른 프로젝트(Bitcoin, Ethereum 등)의 정보를 제공하지 마세요.

다음 형식으로 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "name": "검색한 프로젝트명과 정확히 일치하는 영문 이름 (${projectName}와 관련된 프로젝트만)",
  "token_symbol": "해당 프로젝트의 정확한 토큰 심볼 (${projectName} 프로젝트 전용 심볼. 다른 프로젝트 심볼 사용 금지)",
  "description": "프로젝트에 대한 한글 설명 (2-3문장으로 자세히)",
  "keyword1": "Layer1, Layer2, DApp 중 정확히 하나만 선택 (프로젝트의 기본 분류)",
  "keyword2": "keyword1과 다른 세부 영역 (예: DeFi, GameFi, Infrastructure, NFT, Bridge, DEX 등)",
  "keyword3": "keyword1, keyword2와 중복되지 않는 고유 기술 특징 (예: Zero-Knowledge, Cross-Chain, AI-Powered 등)",
  "homepage_url": "공식 홈페이지 URL",
  "whitepaper_url": "백서 URL",
  "docs_url": "문서 URL", 
  "blog_url": "블로그 URL",
  "github_url": "GitHub 저장소 URL (공식 organization 또는 main repository)",
  "project_twitter_url": "프로젝트 공식 트위터 URL (완전한 URL 형태: https://twitter.com/handle 또는 https://x.com/handle)",
  "team_twitter_urls": ["현재 활동 중인 주요 팀원 트위터 URL 배열 (완전한 URL 형태로, 존재하지 않는 계정 제외)"],
  "market_data": {
    "market_cap_rank": "시가총액 순위 (숫자, coinmarketcap 기준)",
    "current_price_usd": "현재 가격 USD (숫자)",
    "market_cap_usd": "시가총액 USD (숫자)",
    "volume_24h_usd": "24시간 거래량 USD (숫자)",
    "price_change_24h": "24시간 가격 변동률 % (숫자)",
    "price_change_7d": "7일 가격 변동률 % (숫자)",
    "price_change_30d": "30일 가격 변동률 % (숫자)",
    "data_source": "데이터 소스 (coinmarketcap, coingecko, cryptorank 중 하나)"
  },
  "investment_rounds": [
    {
      "round_type": "투자 라운드 타입 (예: Seed, Series A, Private Sale, Strategic)",
      "round_name": "라운드 이름 (예: Series A Round)",
      "date": "투자 날짜 (YYYY-MM-DD 형식)",
      "amount_usd": "투자 금액 USD (숫자)",
      "valuation_pre_money_usd": "Pre-money 밸류에이션 USD (숫자)",
      "valuation_post_money_usd": "Post-money 밸류에이션 USD (숫자)",
      "lead_investor": "리드 투자자",
      "investors": ["주요 투자자 리스트"],
      "data_source": "실제 데이터 출처 (cryptorank.io, crunchbase.com, coindesk.com, cointelegraph.com 등 실제 웹사이트명)",
      "source_url": "해당 투자 정보를 확인할 수 있는 실제 URL"
    }
  ],
  "market_cap_rank": "시가총액 순위 (숫자, coinmarketcap 기준)",
  "current_price_usd": "현재 가격 USD (숫자)",
  "market_cap_usd": "시가총액 USD (숫자)",
  "investment_rounds": [
    {
      "round_type": "투자 라운드 타입 (예: Seed, Series A, Private Sale)",
      "date": "투자 날짜 (YYYY-MM-DD 형식)",
      "amount_usd": "투자 금액 USD (숫자)",
      "investors": ["주요 투자자 리스트"]
    }
  ]
}

🚨 중요 주의사항:
- 반드시 "${projectName}" 프로젝트에 대해서만 정보를 제공하세요
- name은 "${projectName}"와 관련된 프로젝트명만 입력 (다른 프로젝트명 절대 금지)
- token_symbol은 "${projectName}" 프로젝트의 토큰만 입력 (BTC, ETH 등 다른 토큰 심볼 사용 금지)
- name과 token_symbol은 coinmarketcap, coingecko, cryptorank에서 확인된 정확한 정보
- token_symbol은 실제로 거래소에서 거래되는 토큰만 입력 (Pre-TGE나 미상장 토큰은 null로 설정)
- keyword1은 반드시 Layer1, Layer2, DApp 중 정확히 하나만 선택
- keyword2는 keyword1과 중복되지 않는 구체적인 영역 (DeFi, GameFi, NFT 등)
- keyword3는 keyword1, keyword2와 완전히 다른 고유한 기술적 특징
- 각 키워드는 서로 중복되지 않아야 함
- market_data는 최신 가격/시장 정보 (coinmarketcap, coingecko, cryptorank)
- investment_rounds는 Cryptorank, Crunchbase, CoinDesk, CoinTelegraph 등에서 확인된 모든 투자 라운드
- data_source는 반드시 실제 웹사이트명 (예: cryptorank.io, crunchbase.com)
- source_url은 해당 투자 정보를 확인할 수 있는 실제 링크
- 찾을 수 없는 정보는 null로 설정
- 반드시 유효한 JSON 형태로만 응답
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
    
    // 기본 프로젝트 정보 반환 (AI 실패 시)
    return {
      project: {
        name: projectName.toLowerCase().trim(),
        token_symbol: null,
        description: `${projectName} 프로젝트에 대한 정보를 자동으로 수집할 수 없었습니다. 수동으로 정보를 입력해주세요.`,
        keyword1: null,
        keyword2: null,
        keyword3: null,
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

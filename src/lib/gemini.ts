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
다음 블록체인 프로젝트에 대한 정보를 정확한 JSON 형태로만 제공해주세요: ${projectName}

다음 형식으로 응답해주세요 (다른 텍스트 없이 JSON만):
{
  "name": "프로젝트명을 영문 소문자로 (예: ethereum, bitcoin, solana)",
  "token_symbol": "토큰 심볼 (예: ETH, BTC)",
  "description": "프로젝트에 대한 한글 설명 (2-3문장으로 자세히)",
  "keyword1": "주요 키워드 1 (예: Layer1)",
  "keyword2": "주요 키워드 2 (예: Smart Contract)",
  "keyword3": "주요 키워드 3 (예: DeFi)",
  "homepage_url": "공식 홈페이지 URL",
  "whitepaper_url": "백서 URL",
  "docs_url": "문서 URL", 
  "blog_url": "블로그 URL",
  "github_url": "GitHub 저장소 URL (공식 organization 또는 main repository)",
  "project_twitter_url": "프로젝트 공식 트위터 URL",
  "team_twitter_urls": ["현재 활동 중인 주요 팀원 트위터 URL 배열 (존재하지 않는 계정 제외)"]
}

주의사항:
- name은 반드시 영문 소문자로 작성
- description은 한글로 자세하게 작성  
- keyword1, keyword2, keyword3는 영문으로 작성 (예: Layer1, DeFi, NFT)
- team_twitter_urls는 실제 존재하고 활동 중인 계정만 포함
- 찾을 수 없는 정보는 null로 설정
- 반드시 유효한 JSON 형태로만 응답
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
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
    
    // 프로젝트명 정규화 (영문 소문자)
    const normalizedName = projectInfo.name 
      ? projectInfo.name.toLowerCase().trim()
      : projectName.toLowerCase().trim()
    
    // 기본값 설정
    return {
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
    }
  } catch (error) {
    console.error('Error searching project info:', error)
    
    // 기본 프로젝트 정보 반환 (AI 실패 시)
    return {
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
    }
  }
}

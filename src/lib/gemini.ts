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
  "name": "${projectName}",
  "token_symbol": "토큰 심볼 (예: ETH, BTC)",
  "description": "프로젝트에 대한 간단한 설명",
  "homepage_url": "공식 홈페이지 URL",
  "whitepaper_url": "백서 URL",
  "docs_url": "문서 URL",
  "blog_url": "블로그 URL",
  "project_twitter_url": "프로젝트 공식 트위터 URL",
  "team_twitter_urls": ["주요 팀원 트위터 URL 배열"]
}

찾을 수 없는 정보는 null로 설정해주세요. 반드시 유효한 JSON 형태로만 응답하세요.
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
    
    // 기본값 설정
    return {
      name: projectInfo.name || projectName,
      token_symbol: projectInfo.token_symbol || null,
      description: projectInfo.description || null,
      homepage_url: projectInfo.homepage_url || null,
      whitepaper_url: projectInfo.whitepaper_url || null,
      docs_url: projectInfo.docs_url || null,
      blog_url: projectInfo.blog_url || null,
      project_twitter_url: projectInfo.project_twitter_url || null,
      team_twitter_urls: projectInfo.team_twitter_urls || null
    }
  } catch (error) {
    console.error('Error searching project info:', error)
    
    // 기본 프로젝트 정보 반환 (AI 실패 시)
    return {
      name: projectName,
      token_symbol: null,
      description: `${projectName} 프로젝트에 대한 정보를 자동으로 수집할 수 없었습니다. 수동으로 정보를 입력해주세요.`,
      homepage_url: null,
      whitepaper_url: null,
      docs_url: null,
      blog_url: null,
      project_twitter_url: null,
      team_twitter_urls: null
    }
  }
}

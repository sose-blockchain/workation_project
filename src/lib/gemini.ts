import { GoogleGenerativeAI } from '@google/generative-ai'

// 클라이언트 사이드에서만 Gemini 클라이언트 생성
let genAI: any = null

if (typeof window !== 'undefined') {
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || ''
  
  if (apiKey) {
    genAI = new GoogleGenerativeAI(apiKey)
  }
}

export { genAI }

// 프로젝트 정보 검색 함수
export async function searchProjectInfo(projectName: string) {
  if (!genAI) {
    throw new Error('Gemini API is not initialized')
  }

  const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

  const prompt = `
다음 블록체인 프로젝트에 대한 정보를 JSON 형태로 제공해주세요: ${projectName}

다음 형식으로 응답해주세요:
{
  "name": "프로젝트명",
  "token_symbol": "토큰 심볼 (예: ETH, BTC)",
  "description": "프로젝트에 대한 간단한 설명",
  "homepage_url": "공식 홈페이지 URL",
  "whitepaper_url": "백서 URL (있는 경우)",
  "docs_url": "문서 URL (있는 경우)",
  "blog_url": "블로그 URL (있는 경우)",
  "project_twitter_url": "프로젝트 공식 트위터 URL (있는 경우)",
  "team_twitter_urls": ["주요 팀원 트위터 URL 배열"]
}

찾을 수 없는 정보는 null로 설정해주세요. JSON만 응답해주세요.
`

  try {
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()
    
    // JSON 파싱
    const projectInfo = JSON.parse(text)
    return projectInfo
  } catch (error) {
    console.error('Error searching project info:', error)
    throw new Error('프로젝트 정보 검색 중 오류가 발생했습니다.')
  }
}

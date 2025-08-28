import { GoogleGenerativeAI } from '@google/generative-ai'

export interface UrlAnalysisResult {
  url: string
  isRelevant: boolean
  relevanceScore: number // 0-100
  issues: string[]
  suggestions: string[]
  contentSummary: string
  lastChecked: string
}

export interface ProjectUrlAnalysis {
  projectName: string
  overallScore: number
  totalUrls: number
  validUrls: number
  outdatedUrls: number
  irrelevantUrls: number
  urlResults: UrlAnalysisResult[]
  generalSuggestions: string[]
  priorityActions: string[]
}

export class AIUrlValidator {
  private genAI: GoogleGenerativeAI | null = null

  constructor() {
    // 생성자에서는 초기화하지 않음 (지연 초기화)
  }

  private ensureInitialized() {
    if (!this.genAI) {
      if (typeof window === 'undefined') {
        console.warn('AIUrlValidator can only be used on the client side')
        return false
      }
      const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY
      if (!apiKey) {
        console.error('NEXT_PUBLIC_GEMINI_API_KEY is not set in environment variables')
        return false
      }
      try {
        this.genAI = new GoogleGenerativeAI(apiKey)
        console.log('✅ Gemini AI initialized successfully')
        return true
      } catch (error) {
        console.error('Failed to initialize Gemini AI:', error)
        return false
      }
    }
    return true
  }

  /**
   * URL의 콘텐츠를 가져와서 분석
   */
  private async fetchUrlContent(url: string): Promise<string> {
    try {
      // 실제 운영에서는 서버사이드에서 실행해야 하지만, 
      // 데모용으로 간단한 메타데이터 추출 시뮬레이션
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      if (data.status === 'success') {
        const { title, description, image } = data.data
        return `Title: ${title}\nDescription: ${description}\nImage: ${image?.url || 'No image'}`
      }
      
      return 'Content could not be fetched'
    } catch (error) {
      console.error('Error fetching URL content:', error)
      return 'Error fetching content'
    }
  }

  /**
   * 단일 URL 분석
   */
  async analyzeUrl(url: string, projectName: string, urlType: string): Promise<UrlAnalysisResult> {
    try {
      if (!this.ensureInitialized()) {
        throw new Error('Gemini AI 초기화 실패')
      }
      
      // URL 콘텐츠 가져오기
      const content = await this.fetchUrlContent(url)
      
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const prompt = `
다음 URL이 "${projectName}" 블록체인 프로젝트의 ${urlType}로 적절한지 분석해주세요.

URL: ${url}
프로젝트: ${projectName}
URL 유형: ${urlType}
콘텐츠: ${content}

다음 JSON 형식으로 응답해주세요:
{
  "isRelevant": true/false,
  "relevanceScore": 0-100,
  "issues": ["문제점 1", "문제점 2"],
  "suggestions": ["개선 제안 1", "개선 제안 2"],
  "contentSummary": "URL 콘텐츠 요약"
}

분석 기준:
1. URL이 실제로 해당 프로젝트와 관련이 있는가?
2. 콘텐츠가 최신인가? (오래된 정보인지 확인)
3. URL이 올바른 유형인가? (홈페이지, 문서, GitHub 등)
4. 접근 가능한가?
5. 공식적인 소스인가?

한글로 분석 결과를 제공하고, 구체적인 개선 방안을 제시해주세요.
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      // JSON 파싱
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error('Invalid AI response format')
      }

      const analysisData = JSON.parse(jsonMatch[0])

      return {
        url,
        isRelevant: analysisData.isRelevant,
        relevanceScore: analysisData.relevanceScore,
        issues: analysisData.issues || [],
        suggestions: analysisData.suggestions || [],
        contentSummary: analysisData.contentSummary || '',
        lastChecked: new Date().toISOString()
      }
    } catch (error) {
      console.error('Error analyzing URL:', error)
      return {
        url,
        isRelevant: false,
        relevanceScore: 0,
        issues: ['분석 중 오류가 발생했습니다'],
        suggestions: ['URL을 수동으로 확인해주세요'],
        contentSummary: '분석 실패',
        lastChecked: new Date().toISOString()
      }
    }
  }

  /**
   * 프로젝트의 모든 URL 분석
   */
  async analyzeProjectUrls(project: any): Promise<ProjectUrlAnalysis> {
    const urls = [
      { url: project.homepage_url, type: '홈페이지' },
      { url: project.whitepaper_url, type: '백서' },
      { url: project.docs_url, type: '문서' },
      { url: project.blog_url, type: '블로그' },
      { url: project.github_url, type: 'GitHub' },
      { url: project.project_twitter_url, type: '프로젝트 트위터' }
    ].filter(item => item.url) // null/undefined URL 제거

    // 팀 트위터 URL들 추가
    if (project.team_twitter_urls && Array.isArray(project.team_twitter_urls)) {
      project.team_twitter_urls.forEach((url: string, index: number) => {
        urls.push({ url, type: `팀원 트위터 ${index + 1}` })
      })
    }

    const urlResults: UrlAnalysisResult[] = []
    
    // 각 URL 분석 (병렬 처리)
    const analysisPromises = urls.map(({ url, type }) => 
      this.analyzeUrl(url, project.name, type)
    )
    
    const results = await Promise.all(analysisPromises)
    urlResults.push(...results)

    // 전체 분석 결과 계산
    const totalUrls = urlResults.length
    const validUrls = urlResults.filter(r => r.isRelevant && r.relevanceScore >= 70).length
    const outdatedUrls = urlResults.filter(r => 
      r.issues.some(issue => 
        issue.includes('오래된') || issue.includes('최신') || issue.includes('업데이트')
      )
    ).length
    const irrelevantUrls = urlResults.filter(r => !r.isRelevant).length

    const overallScore = totalUrls > 0 
      ? Math.round(urlResults.reduce((sum, r) => sum + r.relevanceScore, 0) / totalUrls)
      : 0

    // 전체 개선 제안 생성
    const generalSuggestions = await this.generateGeneralSuggestions(project, urlResults)
    const priorityActions = await this.generatePriorityActions(urlResults)

    return {
      projectName: project.name,
      overallScore,
      totalUrls,
      validUrls,
      outdatedUrls,
      irrelevantUrls,
      urlResults,
      generalSuggestions,
      priorityActions
    }
  }

  /**
   * 전체 개선 제안 생성
   */
  private async generateGeneralSuggestions(project: any, urlResults: UrlAnalysisResult[]): Promise<string[]> {
    try {
      if (!this.ensureInitialized()) {
        return ['Gemini AI 초기화 실패로 분석할 수 없습니다']
      }
      const model = this.genAI!.getGenerativeModel({ model: 'gemini-2.5-flash' })

      const prompt = `
"${project.name}" 프로젝트의 URL 분석 결과를 바탕으로 전체적인 개선 제안을 해주세요.

분석 결과:
${urlResults.map(r => `
- ${r.url}: 연관성 ${r.relevanceScore}%
  문제점: ${r.issues.join(', ')}
  제안: ${r.suggestions.join(', ')}
`).join('')}

다음 형식으로 3-5개의 전체적인 개선 제안을 해주세요:
["제안 1", "제안 2", "제안 3"]

한글로 구체적이고 실행 가능한 제안을 해주세요.
`

      const result = await model.generateContent(prompt)
      const response = await result.response
      const text = response.text()

      const jsonMatch = text.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }

      return ['URL 품질 개선이 필요합니다', ' 최신 정보로 업데이트해주세요']
    } catch (error) {
      console.error('Error generating suggestions:', error)
      return ['전체적인 URL 검토가 필요합니다']
    }
  }

  /**
   * 우선순위 액션 생성
   */
  private async generatePriorityActions(urlResults: UrlAnalysisResult[]): Promise<string[]> {
    const criticalIssues = urlResults.filter(r => r.relevanceScore < 50 || !r.isRelevant)
    const outdatedIssues = urlResults.filter(r => 
      r.issues.some(issue => issue.includes('오래된') || issue.includes('최신'))
    )

    const actions: string[] = []

    if (criticalIssues.length > 0) {
      actions.push(`${criticalIssues.length}개의 부적절한 URL을 교체하거나 제거하세요`)
    }

    if (outdatedIssues.length > 0) {
      actions.push(`${outdatedIssues.length}개의 오래된 URL을 최신 정보로 업데이트하세요`)
    }

    const missingUrls = urlResults.filter(r => r.relevanceScore === 0)
    if (missingUrls.length > 0) {
      actions.push('누락된 공식 URL들을 추가하세요')
    }

    return actions.slice(0, 3) // 최대 3개의 우선순위 액션
  }
}

// 지연 초기화로 변경 - 실제 사용할 때만 인스턴스 생성
let aiUrlValidatorInstance: AIUrlValidator | null = null

export const getAIUrlValidator = (): AIUrlValidator => {
  if (!aiUrlValidatorInstance) {
    aiUrlValidatorInstance = new AIUrlValidator()
  }
  return aiUrlValidatorInstance
}

// 하위 호환성을 위한 기본 export
export const aiUrlValidator = getAIUrlValidator()

// URL 검증 및 필터링 유틸리티

/**
 * URL이 유효한지 검사
 */
export function isValidUrl(url: string): boolean {
  if (!url || typeof url !== 'string') return false
  
  try {
    const urlObj = new URL(url)
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * URL이 접근 가능한지 확인 (HEAD 요청)
 */
export async function isUrlAccessible(url: string): Promise<{
  accessible: boolean
  status?: number
  error?: string
}> {
  if (!isValidUrl(url)) {
    return { accessible: false, error: 'Invalid URL format' }
  }

  try {
    // CORS 문제로 인해 클라이언트에서는 직접 확인이 어려움
    // 실제 환경에서는 서버 사이드 API를 통해 확인하는 것이 좋음
    const response = await fetch(url, { 
      method: 'HEAD',
      mode: 'no-cors' // CORS 문제 회피
    })
    
    return { 
      accessible: true, 
      status: response.status 
    }
  } catch (error) {
    return { 
      accessible: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * 알려진 오래된/죽은 도메인 목록
 */
const DEPRECATED_DOMAINS = [
  'bitcointalk.org/index.php?topic=', // 오래된 포럼 링크
  'github.com/ethereum/wiki/wiki/', // 오래된 위키 링크
  'blog.ethereum.org/2014/', // 매우 오래된 블로그 포스트
  'blog.ethereum.org/2015/',
  'medium.com/@', // 일반적인 개인 미디엄 (프로젝트 공식이 아닐 가능성)
  'bitcointalk.org',
  'slack.com', // 많은 프로젝트들이 슬랙에서 디스코드로 이전
  't.me/', // 텔레그램 링크는 종종 변경됨
]

/**
 * 의심스러운 패턴 (개인 계정, 오래된 형식 등)
 */
const SUSPICIOUS_PATTERNS = [
  /\/users\/\w+/, // GitHub 개인 사용자 페이지
  /\/u\/\w+/, // Reddit 개인 사용자
  /\/author\/\w+/, // 블로그 개인 저자 페이지
  /\d{4}\/\d{2}\/\d{2}/, // 날짜 패턴 (오래된 포스트일 가능성)
  /\/20(1[0-9]|20)\// // 2010-2020년 경로 (오래된 컨텐츠)
]

/**
 * URL이 오래되었거나 신뢰할 수 없는지 검사
 */
export function isDeprecatedUrl(url: string): {
  isDeprecated: boolean
  reason?: string
  confidence: 'low' | 'medium' | 'high'
} {
  if (!isValidUrl(url)) {
    return { isDeprecated: true, reason: 'Invalid URL', confidence: 'high' }
  }

  const lowerUrl = url.toLowerCase()

  // 알려진 오래된 도메인 확인
  for (const domain of DEPRECATED_DOMAINS) {
    if (lowerUrl.includes(domain)) {
      return { 
        isDeprecated: true, 
        reason: `Deprecated domain: ${domain}`, 
        confidence: 'high' 
      }
    }
  }

  // 의심스러운 패턴 확인
  for (const pattern of SUSPICIOUS_PATTERNS) {
    if (pattern.test(url)) {
      return { 
        isDeprecated: true, 
        reason: `Suspicious pattern detected`, 
        confidence: 'medium' 
      }
    }
  }

  // URL에서 연도 추출하여 오래된 컨텐츠 감지
  const yearMatch = url.match(/\/20(\d{2})\//g)
  if (yearMatch) {
    const years = yearMatch.map(match => parseInt(match.substring(3, 5)) + 2000)
    const oldestYear = Math.min(...years)
    const currentYear = new Date().getFullYear()
    
    if (currentYear - oldestYear > 5) {
      return { 
        isDeprecated: true, 
        reason: `Content from ${oldestYear} (${currentYear - oldestYear} years old)`, 
        confidence: 'medium' 
      }
    }
  }

  return { isDeprecated: false, confidence: 'low' }
}

/**
 * 프로젝트 URL들을 검증하고 필터링
 */
export async function validateProjectUrls(urls: {
  homepage_url?: string
  whitepaper_url?: string
  docs_url?: string
  blog_url?: string
  github_url?: string
  project_twitter_url?: string
  team_twitter_urls?: string[]
}): Promise<{
  valid: typeof urls
  deprecated: typeof urls
  inaccessible: typeof urls
  report: {
    totalUrls: number
    validUrls: number
    deprecatedUrls: number
    inaccessibleUrls: number
    suggestions: string[]
  }
}> {
  const valid: typeof urls = {}
  const deprecated: typeof urls = {}
  const inaccessible: typeof urls = {}
  const suggestions: string[] = []
  
  let totalUrls = 0
  let validUrls = 0
  let deprecatedUrls = 0
  let inaccessibleUrls = 0

  // 단일 URL 검증 함수
  const validateUrl = async (url: string | undefined, type: string) => {
    if (!url) return { category: 'valid', url }
    
    totalUrls++
    
    // 기본 유효성 검사
    if (!isValidUrl(url)) {
      inaccessibleUrls++
      suggestions.push(`${type}: Invalid URL format`)
      return { category: 'inaccessible', url }
    }
    
    // 오래된 URL 검사
    const deprecationCheck = isDeprecatedUrl(url)
    if (deprecationCheck.isDeprecated) {
      deprecatedUrls++
      suggestions.push(`${type}: ${deprecationCheck.reason} (confidence: ${deprecationCheck.confidence})`)
      return { category: 'deprecated', url }
    }
    
    // 접근성 검사 (실제 프로덕션에서는 서버 사이드에서 수행)
    // const accessibilityCheck = await isUrlAccessible(url)
    // if (!accessibilityCheck.accessible) {
    //   inaccessibleUrls++
    //   suggestions.push(`${type}: ${accessibilityCheck.error}`)
    //   return { category: 'inaccessible', url }
    // }
    
    validUrls++
    return { category: 'valid', url }
  }

  // 각 URL 유형별 검증
  const results = await Promise.all([
    validateUrl(urls.homepage_url, 'Homepage'),
    validateUrl(urls.whitepaper_url, 'Whitepaper'),
    validateUrl(urls.docs_url, 'Documentation'),
    validateUrl(urls.blog_url, 'Blog'),
    validateUrl(urls.github_url, 'GitHub'),
    validateUrl(urls.project_twitter_url, 'Project Twitter'),
    ...(urls.team_twitter_urls || []).map((url, index) => 
      validateUrl(url, `Team Twitter ${index + 1}`)
    )
  ])

  // 결과 분류
  const urlTypes = ['homepage_url', 'whitepaper_url', 'docs_url', 'blog_url', 'github_url', 'project_twitter_url']
  
  results.slice(0, 6).forEach((result, index) => {
    const key = urlTypes[index] as keyof typeof urls
    if (result.category === 'valid') {
      valid[key] = result.url as any
    } else if (result.category === 'deprecated') {
      deprecated[key] = result.url as any
    } else {
      inaccessible[key] = result.url as any
    }
  })

  // 팀 트위터 URL 처리
  if (urls.team_twitter_urls) {
    const teamResults = results.slice(6)
    valid.team_twitter_urls = []
    deprecated.team_twitter_urls = []
    inaccessible.team_twitter_urls = []
    
    teamResults.forEach(result => {
      if (result.url) {
        if (result.category === 'valid') {
          valid.team_twitter_urls!.push(result.url)
        } else if (result.category === 'deprecated') {
          deprecated.team_twitter_urls!.push(result.url)
        } else {
          inaccessible.team_twitter_urls!.push(result.url)
        }
      }
    })
  }

  // 개선 제안 추가
  if (deprecatedUrls > 0) {
    suggestions.push('Consider updating deprecated URLs to current official sources')
  }
  if (inaccessibleUrls > 0) {
    suggestions.push('Remove or replace inaccessible URLs')
  }
  if (validUrls / totalUrls < 0.5) {
    suggestions.push('Consider adding more official project URLs for better validation')
  }

  return {
    valid,
    deprecated,
    inaccessible,
    report: {
      totalUrls,
      validUrls,
      deprecatedUrls,
      inaccessibleUrls,
      suggestions
    }
  }
}

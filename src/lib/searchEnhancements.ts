// 검색 기능 개선을 위한 유틸리티 함수들

/**
 * 프로젝트 검색 개선 방안
 */

// 1. URL 품질 점수 계산
export function calculateUrlQualityScore(urls: {
  homepage_url?: string
  whitepaper_url?: string
  docs_url?: string
  blog_url?: string
  project_twitter_url?: string
  team_twitter_urls?: string[]
}): {
  score: number
  details: {
    official: number
    documentation: number
    social: number
    freshness: number
  }
  suggestions: string[]
} {
  let officialScore = 0
  let docScore = 0
  let socialScore = 0
  let freshnessScore = 0
  const suggestions: string[] = []

  // 공식 사이트 점수 (30점)
  if (urls.homepage_url) {
    officialScore += 20
    // 도메인 품질 확인
    if (urls.homepage_url.includes('.org') || urls.homepage_url.includes('.com')) {
      officialScore += 10
    }
  } else {
    suggestions.push('공식 홈페이지 URL 추가 권장')
  }

  // 문서 점수 (30점)
  if (urls.docs_url) docScore += 15
  if (urls.whitepaper_url) docScore += 15
  if (!urls.docs_url && !urls.whitepaper_url) {
    suggestions.push('프로젝트 문서 또는 백서 URL 추가 권장')
  }

  // 소셜 미디어 점수 (25점)
  if (urls.project_twitter_url) socialScore += 15
  if (urls.team_twitter_urls && urls.team_twitter_urls.length > 0) {
    socialScore += Math.min(10, urls.team_twitter_urls.length * 2)
  }
  if (!urls.project_twitter_url) {
    suggestions.push('프로젝트 공식 트위터 계정 추가 권장')
  }

  // 최신성 점수 (15점) - URL에서 최근성 판단
  const currentYear = new Date().getFullYear()
  const allUrls = [
    urls.homepage_url,
    urls.docs_url,
    urls.blog_url,
    urls.project_twitter_url,
    ...(urls.team_twitter_urls || [])
  ].filter(Boolean) as string[]

  let recentUrls = 0
  allUrls.forEach(url => {
    // 최근 3년 이내의 콘텐츠로 보이는 URL
    const hasRecentYear = new RegExp(`/(${currentYear}|${currentYear-1}|${currentYear-2})/`).test(url)
    if (hasRecentYear || !url.match(/\/20\d{2}\//)) {
      recentUrls++
    }
  })

  if (allUrls.length > 0) {
    freshnessScore = Math.round((recentUrls / allUrls.length) * 15)
  }

  if (freshnessScore < 10) {
    suggestions.push('일부 URL이 오래된 것으로 보입니다. 최신 링크로 업데이트 고려')
  }

  const totalScore = officialScore + docScore + socialScore + freshnessScore

  return {
    score: totalScore,
    details: {
      official: officialScore,
      documentation: docScore,
      social: socialScore,
      freshness: freshnessScore
    },
    suggestions
  }
}

// 2. 검색 키워드 최적화 제안
export function generateSearchKeywords(projectName: string, description?: string): {
  primary: string[]
  secondary: string[]
  related: string[]
} {
  const primary = [projectName.toLowerCase()]
  const secondary: string[] = []
  const related: string[] = []

  // 프로젝트명에서 키워드 추출
  const nameWords = projectName.toLowerCase().split(/[\s-_]+/)
  nameWords.forEach(word => {
    if (word.length > 2) secondary.push(word)
  })

  // 설명에서 키워드 추출
  if (description) {
    const descWords = description.toLowerCase()
    const blockchainTerms = [
      'blockchain', 'defi', 'nft', 'dao', 'dex', 'protocol', 'token', 'coin',
      'ethereum', 'bitcoin', 'solana', 'polygon', 'binance', 'layer2',
      'smart contract', 'consensus', 'staking', 'yield', 'liquidity'
    ]
    
    blockchainTerms.forEach(term => {
      if (descWords.includes(term)) {
        related.push(term)
      }
    })
  }

  return { primary, secondary, related }
}

// 3. 데이터 소스 다양화 제안
export const RECOMMENDED_DATA_SOURCES = {
  official: [
    'Official Website',
    'GitHub Repository',
    'Official Documentation',
    'Whitepaper'
  ],
  social: [
    'Twitter Official',
    'Discord Server',
    'Telegram Channel',
    'Reddit Community'
  ],
  analytics: [
    'CoinGecko',
    'CoinMarketCap',
    'DeFiLlama',
    'Dune Analytics'
  ],
  news: [
    'CoinDesk',
    'CoinTelegraph',
    'The Block',
    'Decrypt'
  ],
  developer: [
    'GitHub',
    'GitLab',
    'Developer Portal',
    'API Documentation'
  ]
}

// 4. 검색 결과 신뢰도 점수
export function calculateSourceReliability(url: string): {
  score: number
  category: 'high' | 'medium' | 'low'
  reason: string
} {
  const domain = new URL(url).hostname.toLowerCase()

  // 높은 신뢰도 소스
  const highTrustDomains = [
    'github.com', 'gitlab.com',
    'ethereum.org', 'bitcoin.org',
    'docs.', 'documentation.',
    '.org', '.edu', '.gov'
  ]

  // 중간 신뢰도 소스
  const mediumTrustDomains = [
    'medium.com', 'twitter.com',
    'discord.gg', 't.me',
    'coingecko.com', 'coinmarketcap.com'
  ]

  // 낮은 신뢰도 소스
  const lowTrustPatterns = [
    'blogspot.com', 'wordpress.com',
    'wix.com', 'weebly.com',
    'bit.ly', 'tinyurl.com'
  ]

  for (const trustDomain of highTrustDomains) {
    if (domain.includes(trustDomain)) {
      return {
        score: 90,
        category: 'high',
        reason: 'Official or well-established platform'
      }
    }
  }

  for (const trustDomain of mediumTrustDomains) {
    if (domain.includes(trustDomain)) {
      return {
        score: 60,
        category: 'medium',
        reason: 'Popular platform but requires verification'
      }
    }
  }

  for (const pattern of lowTrustPatterns) {
    if (domain.includes(pattern)) {
      return {
        score: 30,
        category: 'low',
        reason: 'Personal or temporary platform'
      }
    }
  }

  return {
    score: 50,
    category: 'medium',
    reason: 'Unknown domain - manual verification recommended'
  }
}

// 5. 실시간 URL 상태 확인 (서버사이드 전용)
export async function checkUrlStatus(url: string): Promise<{
  status: 'active' | 'inactive' | 'redirect' | 'error'
  statusCode?: number
  redirectUrl?: string
  lastChecked: Date
}> {
  try {
    // 실제 구현에서는 서버사이드 API를 통해 확인
    // 클라이언트에서는 CORS 문제로 직접 확인 불가
    const response = await fetch(`/api/check-url?url=${encodeURIComponent(url)}`)
    const data = await response.json()
    
    return {
      status: data.status,
      statusCode: data.statusCode,
      redirectUrl: data.redirectUrl,
      lastChecked: new Date()
    }
  } catch (error) {
    return {
      status: 'error',
      lastChecked: new Date()
    }
  }
}

// 6. 검색 개선 제안 종합
export function generateSearchImprovementSuggestions(project: {
  name: string
  description?: string
  urls: any
}): {
  priority: 'high' | 'medium' | 'low'
  category: string
  suggestion: string
  implementation: string
}[] {
  const suggestions = []
  const qualityScore = calculateUrlQualityScore(project.urls)
  
  // URL 품질 기반 제안
  if (qualityScore.score < 50) {
    suggestions.push({
      priority: 'high' as const,
      category: 'URL 품질',
      suggestion: 'URL 품질이 낮습니다. 공식 소스 추가가 필요합니다.',
      implementation: '공식 홈페이지, 문서, 소셜미디어 계정 URL 추가'
    })
  }

  // 자동 검증 시스템 제안
  suggestions.push({
    priority: 'medium' as const,
    category: '자동화',
    suggestion: '정기적인 URL 상태 확인 시스템 구축',
    implementation: '매주 자동으로 URL 접근성 확인 및 알림'
  })

  // 다중 소스 검증 제안
  suggestions.push({
    priority: 'medium' as const,
    category: '검증',
    suggestion: '여러 데이터 소스에서 정보 교차 검증',
    implementation: 'CoinGecko, GitHub, 공식 사이트 등에서 정보 수집 후 비교'
  })

  // AI 기반 콘텐츠 분석 제안
  suggestions.push({
    priority: 'low' as const,
    category: 'AI 분석',
    suggestion: 'AI를 활용한 프로젝트 정보 신뢰도 분석',
    implementation: '프로젝트 설명, 팀 정보, 로드맵 등의 일관성 검증'
  })

  return suggestions
}

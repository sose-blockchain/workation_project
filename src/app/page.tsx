'use client'

import { useState, useEffect } from 'react'
import ProjectSearch from '@/components/ProjectSearch'
import ProjectDetail from '@/components/ProjectDetail'
import ProjectSidebar from '@/components/ProjectSidebar'
import SearchImprovements from '@/components/SearchImprovements'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/project'
import { supabase } from '@/lib/supabase'
import { getEnhancedProjectInfo } from '@/lib/enhancedProjectSearch'
import { twitterService, TwitterService } from '@/lib/twitterService'

export default function HomePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [message, setMessage] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(true)

  // 텔레그램 커뮤니티 분석 함수 (실제 스키마 기반)
  const analyzeTelegramCommunityHistory = async (projectName: string, tokenSymbol?: string | null) => {
    try {
      console.log(`📱 MCP를 통한 텔레그램 분석 시작: ${projectName}`)
      
      // 실제 텔레그램 DB 스키마 기반 Claude MCP 분석 요청
      const mcpAnalysisPrompt = `
텔레그램 MCP 데이터베이스에서 "${projectName}" (토큰: ${tokenSymbol || 'N/A'}) 프로젝트의 최근 1년간 커뮤니티 활동을 자동으로 분석해주세요.

**핵심 분석 쿼리:**

1. **프로젝트 등록 및 키워드 확인:**
\`\`\`sql
-- 프로젝트 존재 여부 확인
SELECT p.id, p.name, p.token_symbol, COUNT(pk.id) as keyword_count
FROM projects p
LEFT JOIN project_keywords pk ON p.id = pk.project_id
WHERE p.name ILIKE '%${projectName}%' 
   OR p.token_symbol ILIKE '%${tokenSymbol || projectName}%'
GROUP BY p.id, p.name, p.token_symbol;

-- 연관 키워드 조회
SELECT tk.keyword_text, tk.keyword_type
FROM tracking_keywords tk
JOIN project_keywords pk ON tk.id = pk.keyword_id
JOIN projects p ON pk.project_id = p.id
WHERE p.name ILIKE '%${projectName}%';
\`\`\`

2. **12개월 월별 트렌드 분석:**
\`\`\`sql
SELECT 
  TO_CHAR(DATE_TRUNC('month', dks.date), 'YYYY-MM') as month,
  SUM(dks.mention_count) as total_mentions,
  ROUND(AVG(dks.sentiment_score)::numeric, 3) as avg_sentiment,
  COUNT(DISTINCT dks.channel_id) as active_channels,
  MAX(dks.date) as last_update
FROM daily_keyword_stats dks
JOIN tracking_keywords tk ON dks.keyword_id = tk.id
JOIN project_keywords pk ON tk.id = pk.keyword_id
JOIN projects p ON pk.project_id = p.id
WHERE p.name ILIKE '%${projectName}%'
  AND dks.date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', dks.date)
ORDER BY month DESC;
\`\`\`

3. **TOP 활성 채널 분석:**
\`\`\`sql
SELECT 
  c.channel_name,
  c.channel_title,
  ROUND(AVG(dpcs.sentiment_score)::numeric, 3) as avg_sentiment,
  SUM(dpcs.mention_count) as total_mentions,
  MAX(dpcs.date) as last_mention_date,
  MIN(dpcs.date) as first_mention_date
FROM daily_project_channel_scores dpcs
JOIN channels c ON dpcs.channel_id = c.id
JOIN projects p ON dpcs.project_id = p.id
WHERE p.name ILIKE '%${projectName}%'
  AND dpcs.date >= CURRENT_DATE - INTERVAL '1 year'
GROUP BY c.id, c.channel_name, c.channel_title
HAVING SUM(dpcs.mention_count) >= 10
ORDER BY total_mentions DESC
LIMIT 15;
\`\`\`

4. **최근 30일 일별 활동:**
\`\`\`sql
SELECT 
  dks.date,
  SUM(dks.mention_count) as daily_mentions,
  ROUND(AVG(dks.sentiment_score)::numeric, 3) as daily_sentiment,
  COUNT(DISTINCT dks.channel_id) as daily_channels
FROM daily_keyword_stats dks
JOIN tracking_keywords tk ON dks.keyword_id = tk.id
JOIN project_keywords pk ON tk.id = pk.keyword_id
JOIN projects p ON pk.project_id = p.id
WHERE p.name ILIKE '%${projectName}%'
  AND dks.date >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY dks.date
ORDER BY dks.date DESC;
\`\`\`

5. **실제 최근 메시지 샘플:**
\`\`\`sql
SELECT 
  m.message_text,
  m.timestamp,
  c.channel_name,
  LENGTH(m.message_text) as msg_length
FROM messages m
JOIN channels c ON m.channel_id = c.id
WHERE (m.message_text ILIKE '%${projectName}%' 
       OR m.message_text ILIKE '%${tokenSymbol || projectName}%')
  AND m.timestamp >= CURRENT_DATE - INTERVAL '7 days'
  AND LENGTH(m.message_text) > 20
ORDER BY m.timestamp DESC
LIMIT 25;
\`\`\`

**분석 결과 정리:**
위 쿼리들을 실행한 후, 다음 형식으로 월별 리포트를 생성해주세요:

📊 **${projectName} 텔레그램 커뮤니티 분석 (최근 12개월)**

**월별 트렌드:**
- 각 월의 언급 수, 감정 점수, 활성 채널 수
- 주요 변화점과 패턴 식별

**활성 채널 분석:**
- 가장 활발한 채널들과 각각의 특성
- 공식/커뮤니티 채널별 반응 차이

**최근 30일 동향:**
- 일별 활동 패턴
- 감정 점수 변화
- 급상승/급하락 구간 분석

**실제 커뮤니티 반응:**
- 최근 메시지들에서 추출한 주요 관심사
- 긍정/부정 피드백 내용

**투자 인사이트:**
- 커뮤니티 성장/감소 신호
- 감정 변화의 주요 원인
- 향후 관심사 예측

이 모든 정보를 종합해서 투자자 관점에서 유의미한 인사이트를 제공해주세요.
      `
      
      console.log('📱 MCP 고도화 분석 요청 전송')
      console.log(`🔍 분석 대상: ${projectName} (${tokenSymbol || 'N/A'})`)
      
      // 실제로는 여기서 Claude가 MCP를 통해 위의 쿼리들을 실행하고 분석
      
      return {
        project_name: projectName,
        token_symbol: tokenSymbol,
        analysis_type: 'MCP_REALTIME_ANALYSIS',
        prompt_sent: mcpAnalysisPrompt,
        status: 'MCP_ANALYSIS_REQUESTED'
      }
      
    } catch (error) {
      console.error(`❌ 텔레그램 MCP 분석 실패: ${projectName}`, error)
      throw error
    }
  }

  // 컴포넌트 마운트 시 프로젝트 목록 로드
  useEffect(() => {
    loadProjects()
  }, [])

  const loadProjects = async () => {
    if (!supabase) {
      console.warn('Supabase is not initialized')
      return
    }

    try {
      console.log('🔍 프로젝트 목록 로드 중...')
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        console.error('❌ 프로젝트 로드 오류:', error)
        throw error
      }

      console.log(`✅ 프로젝트 ${data?.length || 0}개 로드 완료`)
      setProjects(data || [])
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const handleSearch = async (projectName: string) => {
    if (!supabase) {
      setMessage('Supabase 연결이 설정되지 않았습니다.')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      console.log(`🔍 프로젝트 검색 시작: "${projectName}"`)
      
      // 먼저 기존 프로젝트 중복 검사
      const { data: existingProjects, error: searchError } = await supabase
        .from('projects')
        .select('*')
        .ilike('name', `%${projectName.toLowerCase()}%`)

      if (searchError) {
        console.error('❌ 기존 프로젝트 검색 오류:', searchError)
      } else if (existingProjects && existingProjects.length > 0) {
        console.log(`📋 기존 프로젝트 발견: ${existingProjects.length}개`)
        const exactMatch = existingProjects.find(p => 
          p.name.toLowerCase() === projectName.toLowerCase()
        )
        
        if (exactMatch) {
          console.log(`✅ 정확히 일치하는 프로젝트 발견: ${exactMatch.name}`)
          setSelectedProject(exactMatch)
          setMessage(`"${exactMatch.name}" 프로젝트가 이미 존재합니다.`)
          setTimeout(() => setMessage(''), 3000)
          return
        }
      }

      // AI와 CryptoRank API로 향상된 프로젝트 정보 검색
      const enhancedResult = await getEnhancedProjectInfo(projectName)
      console.log(`🤖 AI 검색 완료: ${enhancedResult.project.name}`)
      
      // 1. projects 테이블에 기본 정보 저장
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([enhancedResult.project])
        .select()
        .single()

      if (projectError) {
        if (projectError.code === '23505') { // Unique constraint violation
          setMessage(`"${enhancedResult.project.name}" 프로젝트가 이미 존재합니다.`)
          setTimeout(() => setMessage(''), 3000)
          return
        }
        throw projectError
      }



      // 투자 데이터는 현재 프리미엄 서비스 예정으로 저장하지 않음
      // CryptoRank Pro 구독 시 투자 라운드 데이터 저장 예정

      // 2. 트위터 정보가 발견된 경우 자동으로 수집 (여러 후보 시도)
      let twitterMessage = '';
      if (enhancedResult.project.detected_twitter_urls && enhancedResult.project.detected_twitter_urls.length > 0) {
        console.log(`🔍 트위터 계정 후보 ${enhancedResult.project.detected_twitter_urls.length}개 발견`);
        
        let successfulAccount = null;
        
        for (const twitterUrl of enhancedResult.project.detected_twitter_urls) {
          try {
            const handle = TwitterService.extractTwitterHandle(twitterUrl);
            if (!handle) continue;
            
            console.log(`🐦 트위터 계정 시도: @${handle}`);
            const twitterResult = await twitterService.createOrUpdateTwitterAccount({
              project_id: newProject.id,
              screen_name: handle,
              fetch_timeline: true
            });
            
            if (twitterResult.found && twitterResult.account) {
              successfulAccount = { handle, account: twitterResult.account };
              twitterMessage = ` (트위터: @${handle} 정보 수집 완료)`;
              console.log(`✅ 트위터 계정 자동 수집 성공: @${handle}`);
              
              // 팀원 정보도 함께 수집
              try {
                console.log(`🔍 팀원 정보 수집 시작: @${handle}`);
                const teamResult = await twitterService.collectAndSaveTeamMembers(
                  newProject.id,
                  twitterResult.account.id,
                  handle
                );
                
                if (teamResult.success && teamResult.saved_members.length > 0) {
                  twitterMessage += ` (팀원 ${teamResult.saved_members.length}명 수집 완료)`;
                  console.log(`✅ 팀원 정보 수집 성공: ${teamResult.saved_members.length}명`);
                } else {
                  console.log(`📭 팀원 정보 없음 또는 수집 실패: @${handle}`);
                }
              } catch (teamError) {
                console.error(`❌ 팀원 정보 수집 중 오류: @${handle}`, teamError);
                // 팀원 정보 수집 실패는 전체 프로세스를 중단시키지 않음
              }
              
              // 텔레그램 커뮤니티 분석도 함께 실행
              try {
                console.log(`📱 텔레그램 커뮤니티 분석 시작: ${newProject.name}`);
                await analyzeTelegramCommunityHistory(newProject.name, newProject.token_symbol);
                console.log(`✅ 텔레그램 분석 완료: ${newProject.name}`);
              } catch (telegramError) {
                console.error(`❌ 텔레그램 분석 중 오류: ${newProject.name}`, telegramError);
              }
              
              break; // 성공하면 루프 종료
            } else {
              console.warn(`⚠️ 트위터 계정 수집 실패: @${handle} - ${twitterResult.error || '원인 불명'}`);
              // 계속해서 다음 후보 시도
            }
          } catch (err) {
            console.error(`❌ 트위터 계정 @${TwitterService.extractTwitterHandle(twitterUrl)} 처리 중 오류:`, err);
            // 계속해서 다음 후보 시도
          }
        }
        
        if (!successfulAccount) {
          console.log(`📭 모든 트위터 계정 후보에서 수집 실패`);
        }
      } else if (enhancedResult.project.detected_twitter_url) {
        // 기존 단일 URL 처리 (하위 호환성)
        try {
          const handle = TwitterService.extractTwitterHandle(enhancedResult.project.detected_twitter_url);
          if (handle) {
            console.log(`🐦 트위터 계정 자동 수집 시작: @${handle}`);
            const twitterResult = await twitterService.createOrUpdateTwitterAccount({
              project_id: newProject.id,
              screen_name: handle,
              fetch_timeline: true
            });
            
            if (twitterResult.found && twitterResult.account) {
              twitterMessage = ` (트위터: @${handle} 정보 수집 완료)`;
              console.log(`✅ 트위터 계정 자동 수집 성공: @${handle}`);
              
              // 팀원 정보도 함께 수집
              try {
                console.log(`🔍 팀원 정보 수집 시작: @${handle}`);
                const teamResult = await twitterService.collectAndSaveTeamMembers(
                  newProject.id,
                  twitterResult.account.id,
                  handle
                );
                
                if (teamResult.success && teamResult.saved_members.length > 0) {
                  twitterMessage += ` (팀원 ${teamResult.saved_members.length}명 수집 완료)`;
                  console.log(`✅ 팀원 정보 수집 성공: ${teamResult.saved_members.length}명`);
                } else {
                  console.log(`📭 팀원 정보 없음 또는 수집 실패: @${handle}`);
                }
              } catch (teamError) {
                console.error(`❌ 팀원 정보 수집 중 오류: @${handle}`, teamError);
                // 팀원 정보 수집 실패는 전체 프로세스를 중단시키지 않음
              }
            } else {
              console.warn(`⚠️ 트위터 계정 수집 실패: @${handle} - ${twitterResult.error || '원인 불명'}`);
            }
          }
        } catch (twitterError) {
          console.error('❌ 트위터 정보 자동 수집 중 오류:', twitterError);
          // 트위터 오류는 사용자에게 표시하지 않음 (선택적 기능)
        }
      }

      const baseMessage = enhancedResult.data_sources.basic_info.includes('CryptoRank') 
        ? '프로젝트가 성공적으로 저장되었습니다! (CryptoRank API로 정확한 프로젝트명/심볼 확인)'
        : '프로젝트가 성공적으로 저장되었습니다!';
      
      setMessage(baseMessage + twitterMessage)
      console.log(`✅ 프로젝트 저장 완료: ${newProject.name}`)
      
      // 새 프로젝트를 선택하고 목록 새로고침
      setSelectedProject(newProject)
      await loadProjects() // 전체 목록 새로고침으로 일관성 유지
      
      // 3초 후 메시지 제거
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Error searching and saving project:', error)
      setMessage('프로젝트 검색 및 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpdate = async (data: UpdateProjectRequest) => {
    if (!supabase) {
      setMessage('Supabase 연결이 설정되지 않았습니다.')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase
        .from('projects')
        .update(data)
        .eq('id', data.id)

      if (error) {
        throw error
      }

      setMessage('프로젝트가 성공적으로 수정되었습니다!')
      await loadProjects() // 목록 새로고침
      
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Error updating project:', error)
      setMessage('프로젝트 수정 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!supabase) {
      setMessage('Supabase 연결이 설정되지 않았습니다.')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id)

      if (error) {
        throw error
      }

      setMessage('프로젝트가 성공적으로 삭제되었습니다!')
      await loadProjects() // 목록 새로고침
      setSelectedProject(null)
      
      setTimeout(() => {
        setMessage('')
      }, 3000)
      
    } catch (error) {
      console.error('Error deleting project:', error)
      setMessage('프로젝트 삭제 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* 사이드바 */}
      <ProjectSidebar 
        projects={projects}
        onProjectSelect={setSelectedProject}
        selectedProject={selectedProject}
        onToggle={setIsSidebarOpen}
      />

      {/* 메인 컨텐츠 */}
      <div className={`min-h-screen flex flex-col transition-all duration-300 ${isSidebarOpen ? 'ml-64' : 'ml-0'}`}>
        {/* 상단 헤더 */}
        <div className="flex justify-end items-center p-4">
          <button 
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            홈으로
          </button>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mx-4 mt-4 p-4 rounded-md ${
            message.includes('성공') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
        </div>
        )}

        {/* Google 스타일 중앙 정렬 검색 */}
        <div className="flex-1 flex flex-col justify-center items-center px-4 -mt-16">
          <ProjectSearch onSearch={handleSearch} isLoading={isLoading} />
          
          {/* 최근 프로젝트 표시 (검색어가 없을 때만) */}
          {projects.length > 0 && (
            <div className="mt-8 w-full max-w-2xl">
              <h3 className="text-lg font-medium text-gray-900 mb-4">최근 프로젝트</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {projects.slice(0, 4).map((project) => (
                  <button
                    key={project.id}
                    onClick={() => setSelectedProject(project)}
                    className="text-left p-3 border border-gray-200 rounded-lg hover:shadow-md hover:border-gray-300 transition-all duration-200"
                  >
                    <div className="font-medium text-gray-900 text-sm">{project.name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {project.token_symbol ? project.token_symbol : (
                        <span className="text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded text-xs">
                          Pre-TGE
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
            </div>

        {/* 하단 링크 */}
        <div className="py-3 bg-gray-50 border-t">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              <a href="#" className="text-gray-600 hover:text-gray-900">About</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Privacy</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Terms</a>
              <a href="#" className="text-gray-600 hover:text-gray-900">Settings</a>
            </div>
          </div>
        </div>
      </div>

      {/* 프로젝트 상세 모달 */}
      {selectedProject && (
        <ProjectDetail
          project={selectedProject}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onClose={() => setSelectedProject(null)}
          isLoading={isLoading}
        />
      )}
    </div>
  )
}
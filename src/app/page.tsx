'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import ProjectSearch from '@/components/ProjectSearch'
import ProjectDetail from '@/components/ProjectDetail'
import ProjectSidebar from '@/components/ProjectSidebar'
import SearchImprovements from '@/components/SearchImprovements'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/project'
import { supabase } from '@/lib/supabase'
import { getEnhancedProjectInfo } from '@/lib/enhancedProjectSearch'
import { twitterService, TwitterService } from '@/lib/twitterService'

export default function HomePage() {
  const router = useRouter()
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
-- 최근 12개월 월별 메시지 볼륨
SELECT 
  DATE_TRUNC('month', cm.created_at) as month,
  COUNT(*) as message_count,
  COUNT(DISTINCT cm.channel_id) as active_channels,
  COUNT(DISTINCT cm.author_id) as unique_authors,
  AVG(cm.message_length) as avg_message_length,
  COUNT(CASE WHEN cm.sentiment_score > 0.5 THEN 1 END) as positive_messages,
  COUNT(CASE WHEN cm.sentiment_score < -0.5 THEN 1 END) as negative_messages
FROM channel_messages cm
JOIN message_keywords mk ON cm.id = mk.message_id
JOIN tracking_keywords tk ON mk.keyword_id = tk.id
JOIN project_keywords pk ON tk.id = pk.keyword_id
JOIN projects p ON pk.project_id = p.id
WHERE p.name ILIKE '%${projectName}%'
  AND cm.created_at >= NOW() - INTERVAL '12 months'
GROUP BY DATE_TRUNC('month', cm.created_at)
ORDER BY month DESC;
\`\`\`

결과는 간결하고 실무적인 인사이트 중심으로 정리해주세요.
`;

      // MCP 분석 결과 반환 (실제로는 Claude MCP API 호출)
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
          setMessage(`"${exactMatch.name}" 프로젝트가 이미 존재합니다.`)
          setTimeout(() => setMessage(''), 3000)
          return
        }
      }

      // AI와 CoinGecko API로 향상된 프로젝트 정보 검색
      const enhancedResult = await getEnhancedProjectInfo(projectName)
      console.log(`🤖 AI 검색 완료: ${enhancedResult.project.name}`)
      
      // 1. projects 테이블에 기본 정보 저장
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([enhancedResult.project])
        .select()
        .single()

      if (projectError || !newProject?.id) {
        if (projectError?.code === '23505') { // unique constraint violation
          setMessage(`"${enhancedResult.project.name}" 프로젝트가 이미 존재합니다.`)
          setTimeout(() => setMessage(''), 3000)
          return
        }
        throw projectError || new Error('프로젝트 생성 실패')
      }

      // 2. 트위터 정보가 발견된 경우 자동으로 수집 (여러 후보 시도)
      let twitterMessage = '';
      if (enhancedResult.project.detected_twitter_urls && enhancedResult.project.detected_twitter_urls.length > 0) {
        console.log(`🔍 트위터 계정 후보 ${enhancedResult.project.detected_twitter_urls.length}개 발견`);
        
        let successfulAccount = null;
        
        // 여러 트위터 URL 후보 시도
        for (const twitterUrl of enhancedResult.project.detected_twitter_urls) {
          try {
            const handle = TwitterService.extractTwitterHandle(twitterUrl);
            if (!handle) {
              console.warn(`⚠️ 유효하지 않은 트위터 URL: ${twitterUrl}`);
              continue;
            }
            
            console.log(`🔍 트위터 계정 수집 시도: @${handle}`);
            
            const twitterResult = await twitterService.createOrUpdateTwitterAccount({
              project_id: newProject.id!,
              screen_name: handle,
              fetch_timeline: true
            });
            
            if (twitterResult.found && twitterResult.account) {
              successfulAccount = { handle, account: twitterResult.account };
              twitterMessage = ` (트위터: @${handle} 정보 수집 완료)`;
              
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
          if (!handle) {
            console.warn(`⚠️ 유효하지 않은 트위터 URL: ${enhancedResult.project.detected_twitter_url}`);
            return;
          }
          
          console.log(`🔍 트위터 계정 수집 시작: @${handle}`);
          
          const twitterResult = await twitterService.createOrUpdateTwitterAccount({
            project_id: newProject.id!,
            screen_name: handle,
            fetch_timeline: true
          });
          
          if (twitterResult.found && twitterResult.account) {
            twitterMessage = ` (트위터: @${handle} 정보 수집 완료)`;
          } else {
            console.warn(`⚠️ 트위터 계정 수집 실패: @${handle} - ${twitterResult.error || '원인 불명'}`);
          }
        } catch (twitterError) {
          console.error('❌ 트위터 정보 자동 수집 중 오류:', twitterError);
          // 트위터 오류는 사용자에게 표시하지 않음 (선택적 기능)
        }
      }

      const baseMessage = enhancedResult.data_sources.basic_info.includes('CoinGecko') 
        ? '프로젝트가 성공적으로 저장되었습니다! (CoinGecko API로 정확한 프로젝트명/심볼 확인)'
        : '프로젝트가 성공적으로 저장되었습니다! (AI로 프로젝트 정보 생성)';
      
      setMessage(baseMessage + twitterMessage)
      
      // 프로젝트 목록 새로고침
      await loadProjects()
      
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
        <div className="flex justify-between items-center p-4">
          <div className="flex items-center space-x-4">
            {/* 사이드바 토글 버튼 */}
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors lg:hidden"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            
            <h1 className="text-xl font-bold text-gray-800">프로젝트 관리</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* 관리자 대시보드 링크 */}
            <Link 
              href="/admin"
              className="flex items-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <span className="mr-1">⚙️</span>
              관리자
            </Link>
            
            <Link 
              href="/"
              className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              홈으로
            </Link>
          </div>
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
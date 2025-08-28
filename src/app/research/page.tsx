'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import ProjectSearch from '@/components/ProjectSearch'
import ProjectDetail from '@/components/ProjectDetail'
import ProjectSidebar from '@/components/ProjectSidebar'
import SearchImprovements from '@/components/SearchImprovements'
import { Project, CreateProjectRequest, UpdateProjectRequest } from '@/types/project'
import { supabase } from '@/lib/supabase'
import { getEnhancedProjectInfo } from '@/lib/enhancedProjectSearch'

export default function ResearchPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [message, setMessage] = useState('')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)

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
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

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
      // AI와 CryptoRank API로 향상된 프로젝트 정보 검색
      const enhancedResult = await getEnhancedProjectInfo(projectName)
      
      // 1. projects 테이블에 기본 정보 저장
      const { data: newProject, error: projectError } = await supabase
        .from('projects')
        .insert([enhancedResult.project])
        .select()
        .single()

      if (projectError) {
        throw projectError
      }



      // 2. investments 테이블에 투자 데이터 저장 (있는 경우)
      if (enhancedResult.investment_rounds && Array.isArray(enhancedResult.investment_rounds) && newProject) {
        const investmentData = enhancedResult.investment_rounds.map(round => ({
          project_id: newProject.id,
          ...round,
          data_source: round.data_source || enhancedResult.data_sources.investment_data
        }))
        
        const { error: investmentError } = await supabase
          .from('investments')
          .insert(investmentData)

        if (investmentError) {
          console.warn('투자 데이터 저장 실패:', investmentError)
        }
      }

      const successMessage = enhancedResult.data_sources.basic_info.includes('CryptoRank') 
        ? '프로젝트가 성공적으로 저장되었습니다! (CryptoRank API로 정확한 프로젝트명/심볼 확인)'
        : '프로젝트가 성공적으로 저장되었습니다!';
      
      setMessage(successMessage)
      setProjects(prev => [newProject, ...prev])
      
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
      />

      {/* 메인 컨텐츠 */}
      <div className="min-h-screen flex flex-col">
        {/* 상단 헤더 */}
        <div className="flex justify-between items-center p-4">
          <h1 className="text-xl font-semibold text-gray-900">DeSpread</h1>
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

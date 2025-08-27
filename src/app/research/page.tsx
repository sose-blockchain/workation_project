'use client'

import { useState } from 'react'
import ProjectForm from '@/components/ProjectForm'
import { CreateProjectRequest, Project } from '@/types/project'
import { supabase } from '@/lib/supabase'

export default function ResearchPage() {
  const [isLoading, setIsLoading] = useState(false)
  const [projects, setProjects] = useState<Project[]>([])
  const [message, setMessage] = useState('')

  const handleSubmit = async (data: CreateProjectRequest) => {
    if (!supabase) {
      setMessage('Supabase 연결이 설정되지 않았습니다.')
      return
    }

    setIsLoading(true)
    setMessage('')
    
    try {
      const { data: newProject, error } = await supabase
        .from('projects')
        .insert([data])
        .select()
        .single()

      if (error) {
        throw error
      }

      setMessage('프로젝트가 성공적으로 저장되었습니다!')
      setProjects(prev => [newProject, ...prev])
      
      // 폼 초기화를 위해 페이지 새로고침
      setTimeout(() => {
        window.location.reload()
      }, 2000)
      
    } catch (error) {
      console.error('Error saving project:', error)
      setMessage('프로젝트 저장 중 오류가 발생했습니다.')
    } finally {
      setIsLoading(false)
    }
  }

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

  // 컴포넌트 마운트 시 프로젝트 목록 로드
  useState(() => {
    loadProjects()
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            프로젝트 리서치
          </h1>
          <p className="text-lg text-gray-600">
            블록체인 프로젝트 정보를 입력하고 AI 분석을 시작하세요
          </p>
        </div>

        {/* 메시지 표시 */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.includes('성공') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message}
          </div>
        )}

        {/* 프로젝트 입력 폼 */}
        <ProjectForm onSubmit={handleSubmit} isLoading={isLoading} />

        {/* 프로젝트 목록 */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">저장된 프로젝트</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {project.name}
                </h3>
                {project.token_symbol && (
                  <p className="text-sm text-gray-600 mb-2">
                    토큰: {project.token_symbol}
                  </p>
                )}
                {project.description && (
                  <p className="text-gray-700 mb-4 line-clamp-3">
                    {project.description}
                  </p>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">
                    {new Date(project.created_at).toLocaleDateString()}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    project.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {project.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
          {projects.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">저장된 프로젝트가 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

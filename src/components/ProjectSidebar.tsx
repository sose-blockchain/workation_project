'use client'

import { useState, useEffect } from 'react'
import { Project } from '@/types/project'

interface ProjectSidebarProps {
  projects: Project[]
  onProjectSelect: (project: Project) => void
  selectedProject?: Project | null
}

export default function ProjectSidebar({ 
  projects, 
  onProjectSelect, 
  selectedProject 
}: ProjectSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)

  // 프로젝트를 카테고리별로 그룹화
  const groupedProjects = {
    reports: [
      { name: 'Monthly Report', projects: projects.slice(0, 2) },
      { name: 'Community & Blog', projects: projects.slice(2, 4) },
      { name: 'Community PR', projects: projects.slice(4, 6) },
      { name: 'SEO', projects: projects.slice(6, 8) },
      { name: 'Media PR', projects: projects.slice(8, 10) }
    ],
    data: [
      { name: 'Korean Community Data', projects: projects.slice(10, 12) },
      { name: 'Korean Mindshare', projects: projects.slice(12, 14) },
      { name: 'Korean Mindshare Pre TGE', projects: projects.slice(14, 16) },
      { name: 'Narrative Mindshare', projects: projects.slice(16, 18) },
      { name: 'Mitosis Storyteller', projects: projects.slice(18, 20) },
      { name: 'Abstract Storyteller', projects: projects.slice(20, 22) },
      { name: 'Solana Storyteller', projects: projects.slice(22, 24) }
    ]
  }

  return (
    <>
      {/* 토글 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed top-4 left-4 z-50 p-2 rounded-md bg-white shadow-lg border border-gray-200 hover:bg-gray-50 transition-all duration-200 ${
          isOpen ? 'transform rotate-180' : ''
        }`}
      >
        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* 오버레이 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* 사이드바 */}
      <div className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM9 17H7v-7h2v7zm4 0h-2V7h2v10zm4 0h-2v-4h2v4z"/>
                </svg>
              </div>
              <span className="ml-3 font-medium text-gray-900">Projects</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-full hover:bg-gray-100"
            >
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-4">
          {/* 검색 바 */}
          <div className="mb-6">
            <div className="relative">
              <input
                type="text"
                placeholder="Search project"
                className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* 프로젝트 목록 */}
          <div className="space-y-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            {/* Reports 섹션 */}
            <div>
              <div className="flex items-center mb-3">
                <svg className="w-4 h-4 text-gray-500 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
                </svg>
                <h3 className="text-sm font-medium text-gray-900">Reports</h3>
              </div>
              <div className="space-y-1 ml-6">
                {groupedProjects.reports.map((category, index) => (
                  <div key={index}>
                    <div className="text-xs text-gray-500 py-1">{category.name}</div>
                    {category.projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onProjectSelect(project)
                          setIsOpen(false)
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                          selectedProject?.id === project.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* Korean Community Data 섹션 */}
            <div>
              <div className="flex items-center mb-3">
                <svg className="w-4 h-4 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M9,2V8H11V11H5V9H7V2H9M13,2V5H15V9H21V11H15V8H13V2H13M15,13V16H17V23H15V20H13V18H19V20H17V16H15V13H15M3,13V18H5V23H3V20H1V18H7V16H5V13H3Z"/>
                </svg>
                <h3 className="text-sm font-medium text-blue-600">Korean Community Data</h3>
              </div>
              <div className="space-y-1 ml-6">
                {groupedProjects.data.map((category, index) => (
                  <div key={index}>
                    <div className="text-xs text-gray-500 py-1">{category.name}</div>
                    {category.projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => {
                          onProjectSelect(project)
                          setIsOpen(false)
                        }}
                        className={`w-full text-left px-2 py-1 text-xs rounded hover:bg-gray-100 ${
                          selectedProject?.id === project.id ? 'bg-blue-50 text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        {project.name}
                      </button>
                    ))}
                  </div>
                ))}
              </div>
            </div>

            {/* 모든 프로젝트 목록 */}
            <div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">All Projects</h3>
              <div className="space-y-1">
                {projects.map((project) => (
                  <button
                    key={project.id}
                    onClick={() => {
                      onProjectSelect(project)
                      setIsOpen(false)
                    }}
                    className={`w-full text-left px-2 py-2 text-sm rounded hover:bg-gray-100 ${
                      selectedProject?.id === project.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                  >
                    <div className="font-medium">{project.name}</div>
                    {project.token_symbol && (
                      <div className="text-xs text-gray-500">{project.token_symbol}</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

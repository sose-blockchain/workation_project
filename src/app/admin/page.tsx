'use client';

import React, { useState } from 'react';
import TwitterSchedulerDashboard from '@/components/TwitterSchedulerDashboard';
import TwitterAccountManager from '@/components/TwitterAccountManager';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'scheduler' | 'accounts'>('scheduler');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <div className="mb-8">
          {/* 브레드크럼 */}
          <div className="flex items-center space-x-2 text-sm text-gray-500 mb-3">
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log('브레드크럼 홈 클릭됨');
                try {
                  window.location.href = '/';
                } catch (error) {
                  console.error('네비게이션 오류:', error);
                  window.open('/', '_self');
                }
              }}
              style={{ 
                cursor: 'pointer',
                pointerEvents: 'auto'
              }}
              className="hover:text-blue-600 focus:text-blue-600 transition-colors underline focus:outline-none"
            >
              홈
            </button>
            <span>/</span>
            <span className="text-gray-900">관리자</span>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            관리자 대시보드
          </h1>
          <p className="text-gray-600">
            트위터 데이터 수집 스케줄러와 계정을 관리합니다.
          </p>
        </div>

        {/* 탭 네비게이션 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('scheduler')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'scheduler'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                🔄 스케줄러 관리
              </button>
              <button
                onClick={() => setActiveTab('accounts')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'accounts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                👥 계정 관리
              </button>
            </nav>
          </div>
        </div>

        {/* API 사용량 경고 배너 */}
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
                <span className="text-blue-600 font-semibold text-sm">ℹ️</span>
              </div>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-blue-800">
                RapidAPI Basic 플랜 사용 중
              </h3>
              <div className="mt-1 text-sm text-blue-700">
                <p>월 1,000회 API 호출 제한이 있습니다. 스마트 스케줄링이 자동으로 우선순위를 관리합니다.</p>
                <ul className="mt-2 list-disc list-inside text-xs">
                  <li>계정당 2회 API 호출 (사용자 정보 + 타임라인)</li>
                  <li>우선순위 기반 계정 선별 (팔로워 수, 활동도, 업데이트 시점)</li>
                  <li>일일 안전 제한: 30회 (월 1,000회 ÷ 30일)</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'scheduler' && <TwitterSchedulerDashboard />}
          {activeTab === 'accounts' && <TwitterAccountManager />}
        </div>

        {/* 시스템 정보 */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              📊 데이터 수집 통계
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">총 등록 계정</span>
                <span className="text-sm font-medium">실시간 조회</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">수집된 트윗</span>
                <span className="text-sm font-medium">누적 데이터</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">마지막 수집</span>
                <span className="text-sm font-medium">수동 실행</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              🔧 시스템 설정
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">API 플랜</span>
                <span className="text-sm font-medium text-blue-600">Basic (무료)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">스케줄링</span>
                <span className="text-sm font-medium text-green-600">스마트 모드</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">우선순위</span>
                <span className="text-sm font-medium text-purple-600">자동 계산</span>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              💡 권장 사항
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>매일 또는 이틀마다 수동 실행</span>
              </div>
              <div className="flex items-start">
                <span className="text-green-500 mr-2">✓</span>
                <span>계정 15개 이하 유지</span>
              </div>
              <div className="flex items-start">
                <span className="text-yellow-500 mr-2">⚠</span>
                <span>90% 초과 시 Pro 플랜 고려</span>
              </div>
            </div>
          </div>
        </div>

        {/* 빠른 링크 */}
        <div className="mt-8 bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            🔗 빠른 링크
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                console.log('메인 페이지 버튼 클릭됨');
                try {
                  window.location.href = '/';
                } catch (error) {
                  console.error('네비게이션 오류:', error);
                  window.open('/', '_self');
                }
              }}
              style={{ 
                cursor: 'pointer',
                pointerEvents: 'auto',
                zIndex: 1000
              }}
              className="nav-button flex items-center p-3 text-sm text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-300 transition-all duration-200 transform hover:scale-105 active:scale-95 select-none"
            >
              <span className="mr-2">🏠</span>
              메인 페이지
            </button>
            <a 
              href="/api/twitter-scheduler?action=status"
              target="_blank"
              className="flex items-center p-3 text-sm text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
            >
              <span className="mr-2">📊</span>
              API 상태
            </a>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center p-3 text-sm text-purple-600 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
            >
              <span className="mr-2">🔄</span>
              페이지 새로고침
            </button>
            <a 
              href="https://rapidapi.com/hub"
              target="_blank"
              className="flex items-center p-3 text-sm text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
            >
              <span className="mr-2">⬆️</span>
              플랜 업그레이드
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

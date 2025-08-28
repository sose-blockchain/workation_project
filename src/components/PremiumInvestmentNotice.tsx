'use client';

import React from 'react';

interface PremiumInvestmentNoticeProps {
  projectId: string;
}

export default function PremiumInvestmentNotice({ projectId }: PremiumInvestmentNoticeProps) {
  console.log('🔄 PremiumInvestmentNotice FORCE RENDER for project:', projectId);
  
  // 강제 렌더링을 위한 타임스탬프
  const forceRenderKey = `premium-v2-${projectId}-${Date.now()}`;
  
  return (
    <div className="space-y-6" key={forceRenderKey} data-component="premium-investment-notice">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">투자 정보</h3>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Updated 2025.1.28 v2
        </div>
      </div>

      {/* 기존 투자 데이터 안내 */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
        <div className="flex items-start">
          <svg className="h-5 w-5 text-amber-600 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-amber-800 mb-1">
              투자 정보 업데이트 안내
            </h4>
            <p className="text-sm text-amber-700">
              기존에 표시되던 AI 기반 투자 정보는 정확성 문제로 인해 2025년 1월 28일부터 비활성화되었습니다.
            </p>
          </div>
        </div>
      </div>

      {/* 프리미엄 기능 안내 */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-50">
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 mb-4">
          <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m0 0v2m0-2h2m-2 0H8m13-9a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        
        <h4 className="text-lg font-medium text-gray-900 mb-2">
          정확한 투자 라운드 정보
        </h4>
        
        <p className="text-gray-600 mb-4 max-w-sm mx-auto">
          검증된 투자 데이터는 프리미엄 서비스를 통해서만 제공됩니다.
          CryptoRank Pro 구독을 통해 정확한 투자 라운드 정보를 확인하세요.
        </p>
        
        <div className="bg-white rounded-lg p-6 border border-gray-200 mb-6 max-w-xs mx-auto">
          <div className="text-sm text-gray-500 mb-1">CryptoRank Pro</div>
          <div className="text-2xl font-bold text-gray-900 mb-1">월 $475</div>
          <div className="text-sm text-gray-600">
            • 실시간 투자 라운드 데이터<br/>
            • 정확한 밸류에이션 정보<br/>
            • 검증된 투자자 목록<br/>
            • API 액세스 제공
          </div>
        </div>
        
        <div className="space-y-3">
          <a
            href="https://cryptorank.io/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            CryptoRank Pro 구독하기
          </a>
          
          <div>
            <a
              href="https://cryptorank.io/pricing"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              요금제 상세 정보 확인
            </a>
          </div>
        </div>
      </div>
      
      {/* 임시 데이터 안내 */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h5 className="text-sm font-medium text-gray-700 mb-2">
          💡 현재 상황 안내
        </h5>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>• 기존 AI 기반 투자 정보: <span className="text-red-600 font-medium">비활성화</span></li>
          <li>• 프로젝트 기본 정보: <span className="text-green-600 font-medium">CryptoRank API 연동</span></li>
          <li>• 정확한 투자 데이터: <span className="text-blue-600 font-medium">프리미엄 서비스 예정</span></li>
        </ul>
      </div>
    </div>
  );
}

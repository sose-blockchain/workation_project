'use client';

import React from 'react';

interface InvestmentManagerProps {
  projectId: string;
  onInvestmentsChange?: (investments: any[]) => void;
}

export default function InvestmentManager({ projectId, onInvestmentsChange }: InvestmentManagerProps) {
  console.log('InvestmentManager rendering for project:', projectId);
  
  // 기존 투자 데이터를 숨기고 프리미엄 안내만 표시
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">투자 정보</h3>
      </div>

      {/* 프리미엄 기능 안내 - 기존 투자 데이터 대신 표시 */}
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
          현재 AI 기반 투자 정보는 정확성에 한계가 있습니다. 
          검증된 투자 데이터는 프리미엄 서비스를 통해 제공됩니다.
        </p>
        
        <div className="bg-white rounded-lg p-4 border border-gray-200 mb-4">
          <div className="text-sm text-gray-500 mb-1">CoinGecko Pro 구독 시</div>
          <div className="text-lg font-semibold text-gray-900">월 $199</div>
          <div className="text-sm text-gray-600 mt-1">
            실시간 투자 라운드 데이터, 밸류에이션, 투자자 정보
          </div>
        </div>
        
        <p className="text-sm text-gray-500 mb-4">
          정확하고 최신의 투자 라운드 정보가 필요하신 경우 
          <span className="font-medium"> CoinGecko Pro </span>
          구독을 고려해주세요.
        </p>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>알림:</strong> 기존에 표시되던 AI 기반 투자 정보는 정확성 문제로 인해 비활성화되었습니다.
          </p>
        </div>
        
        <div className="mt-6">
          <a
            href="https://cryptorank.io/pricing"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-100 hover:bg-blue-200 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            CoinGecko 요금제 확인
          </a>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { useState, useEffect } from 'react';

interface SchedulerStatus {
  status: string;
  total_accounts: number;
  last_run: string;
  next_run: string;
  api_version: string;
  api_usage?: {
    total_calls: number;
    remaining_calls: number;
    monthly_limit: number;
    daily_average: number;
  };
}

interface CollectionResult {
  success: boolean;
  timestamp: string;
  summary: {
    total_accounts: number;
    successful: number;
    failed: number;
    skipped?: number;
    api_calls_used?: number;
    remaining_calls?: number;
    results: Array<{
      account: string;
      result: {
        success: boolean;
        tweets_collected: number;
        new_tweets: number;
        updated_followers: number;
        error?: string;
      };
    }>;
  };
  message: string;
}

const TwitterSchedulerDashboard: React.FC = () => {
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [lastResult, setLastResult] = useState<CollectionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [collecting, setCollecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 상태 조회
  const loadStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/twitter-scheduler?action=status');
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (err) {
      console.error('상태 조회 실패:', err);
    } finally {
      setLoading(false);
    }
  };

  // 수동 데이터 수집 실행
  const runCollection = async () => {
    setCollecting(true);
    setError(null);
    
    try {
      console.log('🚀 수동 트위터 데이터 수집 시작...');
      
      const response = await fetch('/api/twitter-scheduler', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const result = await response.json();
      
      if (result.success) {
        setLastResult(result);
        console.log('✅ 데이터 수집 완료:', result);
        // 상태 새로고침
        await loadStatus();
      } else {
        setError(result.error || '데이터 수집 실패');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ 데이터 수집 실패:', errorMessage);
    } finally {
      setCollecting(false);
    }
  };

  // 컴포넌트 마운트 시 상태 로드
  useEffect(() => {
    loadStatus();
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3">
          <div className="w-6 h-6 animate-spin border-2 border-blue-500 border-t-transparent rounded-full"></div>
          <h3 className="text-lg font-semibold text-gray-800">
            스케줄러 상태 확인 중...
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 스케줄러 상태 카드 */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-2xl">⏰</span>
            <h3 className="text-lg font-semibold text-gray-800">
              트위터 데이터 수집 스케줄러
            </h3>
          </div>
          <button
            onClick={loadStatus}
            className="px-3 py-1 text-sm bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
          >
            새로고침
          </button>
        </div>

        {status && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {status.total_accounts}
              </div>
              <div className="text-sm text-gray-600">등록된 계정</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-lg font-semibold text-green-600">
                {status.status}
              </div>
              <div className="text-sm text-gray-600">상태</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-sm font-medium text-orange-600">
                {status.last_run}
              </div>
              <div className="text-sm text-gray-600">마지막 실행</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-sm font-medium text-purple-600">
                Manual
              </div>
              <div className="text-sm text-gray-600">실행 방식</div>
            </div>
          </div>
        )}

        {/* API 사용량 정보 */}
        {status?.api_usage && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center">
              ⚠️ RapidAPI Basic 플랜 사용량
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-yellow-600">
                  {status.api_usage.total_calls}/{status.api_usage.monthly_limit}
                </div>
                <div className="text-xs text-gray-600">월 사용량</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {status.api_usage.remaining_calls}
                </div>
                <div className="text-xs text-gray-600">남은 호출</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {Math.round(status.api_usage.daily_average)}
                </div>
                <div className="text-xs text-gray-600">일일 평균</div>
              </div>
              <div className="text-center">
                <div className={`text-lg font-bold ${
                  ((status.api_usage.total_calls / status.api_usage.monthly_limit) * 100) > 80 
                    ? 'text-red-600' 
                    : ((status.api_usage.total_calls / status.api_usage.monthly_limit) * 100) > 60
                    ? 'text-yellow-600'
                    : 'text-green-600'
                }`}>
                  {Math.round((status.api_usage.total_calls / status.api_usage.monthly_limit) * 100)}%
                </div>
                <div className="text-xs text-gray-600">사용률</div>
              </div>
            </div>
            
            {/* 사용량 경고 */}
            {((status.api_usage.total_calls / status.api_usage.monthly_limit) * 100) > 80 && (
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                🚨 API 사용량이 80%를 초과했습니다. 수집 빈도를 조절하거나 계정을 줄이는 것을 권장합니다.
              </div>
            )}
            
            {((status.api_usage.total_calls / status.api_usage.monthly_limit) * 100) > 90 && (
              <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded text-sm text-orange-700">
                💡 Pro 플랜 업그레이드($10/월)를 고려해보세요. 월 100,000회까지 사용 가능합니다.
              </div>
            )}
          </div>
        )}

        {/* 수동 실행 버튼 */}
        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
          <div>
            <h4 className="font-medium text-gray-800">수동 데이터 수집</h4>
            <p className="text-sm text-gray-600">
              모든 등록된 트위터 계정에서 새로운 트윗을 수집합니다
            </p>
          </div>
          <button
            onClick={runCollection}
            disabled={collecting}
            className={`px-6 py-2 rounded-lg font-medium transition-colors ${
              collecting
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {collecting ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 animate-spin border-2 border-white border-t-transparent rounded-full"></div>
                <span>수집 중...</span>
              </div>
            ) : (
              '지금 수집 실행'
            )}
          </button>
        </div>

        {/* 오류 메시지 */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">❌</span>
              <span className="text-red-700 font-medium">오류:</span>
              <span className="text-red-600">{error}</span>
            </div>
          </div>
        )}
      </div>

      {/* 마지막 수집 결과 */}
      {lastResult && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-4">
            <span className="text-2xl">📊</span>
            <h3 className="text-lg font-semibold text-gray-800">
              마지막 수집 결과
            </h3>
            <span className="text-sm text-gray-500">
              {new Date(lastResult.timestamp).toLocaleString('ko-KR')}
            </span>
          </div>

          {/* 수집 요약 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {lastResult.summary.total_accounts}
              </div>
              <div className="text-sm text-gray-600">총 계정</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {lastResult.summary.successful}
              </div>
              <div className="text-sm text-gray-600">성공</div>
            </div>
            <div className="text-center p-3 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {lastResult.summary.failed}
              </div>
              <div className="text-sm text-gray-600">실패</div>
            </div>
            {lastResult.summary.skipped !== undefined && (
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {lastResult.summary.skipped}
                </div>
                <div className="text-sm text-gray-600">스킵</div>
              </div>
            )}
            {lastResult.summary.api_calls_used !== undefined && (
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {lastResult.summary.api_calls_used}
                </div>
                <div className="text-sm text-gray-600">API 사용</div>
              </div>
            )}
          </div>

          {/* 상세 결과 */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">계정별 수집 결과</h4>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {lastResult.summary.results.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    item.result.success
                      ? 'border-green-200 bg-green-50'
                      : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <span className={`text-lg ${
                      item.result.success ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {item.result.success ? '✅' : '❌'}
                    </span>
                    <div>
                      <div className="font-medium text-gray-800">
                        @{item.account}
                      </div>
                      {item.result.error && (
                        <div className="text-sm text-red-600">
                          {item.result.error}
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {item.result.success && (
                    <div className="flex space-x-4 text-sm text-gray-600">
                      <span>📥 {item.result.tweets_collected}개 수집</span>
                      <span>🆕 {item.result.new_tweets}개 신규</span>
                      <span>👥 {item.result.updated_followers.toLocaleString()} 팔로워</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 총 성과 */}
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-center">
              <div className="font-medium text-blue-800">
                {lastResult.message}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                총 {lastResult.summary.results.reduce((sum, r) => sum + r.result.new_tweets, 0)}개의 새로운 트윗이 수집되었습니다
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 자동화 계획 (향후 구현) */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <span className="text-2xl">🔮</span>
          <h3 className="text-lg font-semibold text-gray-800">
            향후 자동화 계획
          </h3>
        </div>
        
        <div className="space-y-3 text-sm text-gray-600">
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">•</span>
            <span>매일 아침 9시 자동 데이터 수집</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">•</span>
            <span>Vercel Cron Jobs를 활용한 스케줄링</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">•</span>
            <span>실패 시 자동 재시도 및 알림</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="text-blue-500">•</span>
            <span>수집 통계 및 성과 대시보드</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TwitterSchedulerDashboard;

'use client';

import React, { useState, useEffect } from 'react';

interface TwitterAccount {
  id: string;
  screen_name: string;
  user_id: string;
  name: string;
  description: string;
  followers_count: number;
  following_count: number;
  tweet_count: number;
  profile_image_url: string;
  verified: boolean;
  created_at_twitter: string;
  project_id: string | null;
  activity_score: number;
  created_at: string;
  last_updated: string;
  stats: {
    total_tweets: number;
    first_tweet_date: string | null;
    last_tweet_date: string | null;
    days_tracked: number;
  };
}

interface AddAccountResult {
  success: boolean;
  message?: string;
  error?: string;
  account?: TwitterAccount;
  timeline_result?: any;
}

const TwitterAccountManager: React.FC = () => {
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [addLoading, setAddLoading] = useState(false);
  const [newAccountInput, setNewAccountInput] = useState('');
  const [projectNameInput, setProjectNameInput] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // 계정 목록 로드
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/twitter-accounts');
      const data = await response.json();

      if (data.success) {
        setAccounts(data.accounts);
        setError('');
      } else {
        setError(data.error || '계정 목록을 불러올 수 없습니다');
      }
    } catch (err) {
      setError('계정 목록 로드 중 오류가 발생했습니다');
      console.error('계정 로드 오류:', err);
    } finally {
      setLoading(false);
    }
  };

  // 새 계정 추가
  const addAccount = async () => {
    if (!newAccountInput.trim()) {
      setError('트위터 계정명 또는 URL을 입력해주세요');
      return;
    }

    try {
      setAddLoading(true);
      setError('');
      setMessage('');

      const response = await fetch('/api/twitter-accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          screen_name: newAccountInput.trim(),
          project_name: projectNameInput.trim() || null
        }),
      });

      const data: AddAccountResult = await response.json();

      if (data.success) {
        setMessage(data.message || '계정이 성공적으로 추가되었습니다');
        setNewAccountInput('');
        setProjectNameInput('');
        await loadAccounts(); // 목록 새로고침
      } else {
        setError(data.error || '계정 추가에 실패했습니다');
      }
    } catch (err) {
      setError('계정 추가 중 오류가 발생했습니다');
      console.error('계정 추가 오류:', err);
    } finally {
      setAddLoading(false);
    }
  };

  // 계정 삭제
  const deleteAccount = async (accountId: string, screenName: string) => {
    if (!confirm(`정말로 @${screenName} 계정을 삭제하시겠습니까?\n관련된 모든 트윗 데이터도 함께 삭제됩니다.`)) {
      return;
    }

    try {
      const response = await fetch(`/api/twitter-accounts?id=${accountId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (data.success) {
        setMessage(data.message);
        await loadAccounts(); // 목록 새로고림
      } else {
        setError(data.error || '계정 삭제에 실패했습니다');
      }
    } catch (err) {
      setError('계정 삭제 중 오류가 발생했습니다');
      console.error('계정 삭제 오류:', err);
    }
  };

  // 컴포넌트 마운트 시 계정 목록 로드
  useEffect(() => {
    loadAccounts();
  }, []);

  // 날짜 포맷팅
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 숫자 포맷팅
  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toLocaleString();
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">트위터 계정 관리</h2>
          <p className="text-gray-600 mt-1">수집 중인 트위터 계정들을 관리합니다</p>
        </div>
        <button
          onClick={loadAccounts}
          disabled={loading}
          className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50"
        >
          {loading ? '로딩 중...' : '새로고침'}
        </button>
      </div>

      {/* 새 계정 추가 폼 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="font-medium text-blue-900 mb-3">새 트위터 계정 추가</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              트위터 계정명 또는 URL
            </label>
            <input
              type="text"
              value={newAccountInput}
              onChange={(e) => setNewAccountInput(e.target.value)}
              placeholder="@username 또는 https://twitter.com/username"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              프로젝트명 (선택)
            </label>
            <input
              type="text"
              value={projectNameInput}
              onChange={(e) => setProjectNameInput(e.target.value)}
              placeholder="프로젝트명 (옵션)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={addAccount}
              disabled={addLoading || !newAccountInput.trim()}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addLoading ? '추가 중...' : '계정 추가'}
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-gray-600">
          💡 계정 추가 시 자동으로 최신 트윗들을 수집합니다. API 제한에 따라 약 20개의 최신 트윗을 가져옵니다.
        </div>
      </div>

      {/* 메시지 표시 */}
      {message && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-green-700">
          {message}
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
          {error}
        </div>
      )}

      {/* 계정 목록 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-medium text-gray-900">
            등록된 계정 ({accounts.length}개)
          </h3>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-500">
            계정 목록을 불러오는 중...
          </div>
        ) : accounts.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            등록된 트위터 계정이 없습니다.
            <br />
            위의 폼을 사용해서 첫 번째 계정을 추가해보세요.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {accounts.map((account) => (
              <div key={account.id} className="p-4 hover:bg-gray-50">
                <div className="flex items-start justify-between">
                  {/* 계정 정보 */}
                  <div className="flex items-start space-x-3">
                    <img
                      src={account.profile_image_url}
                      alt={account.name}
                      className="w-12 h-12 rounded-full"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h4 className="font-medium text-gray-900">
                          {account.name}
                        </h4>
                        {account.verified && (
                          <span className="text-blue-500">✓</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">@{account.screen_name}</p>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {account.description || '설명 없음'}
                      </p>
                    </div>
                  </div>

                  {/* 삭제 버튼 */}
                  <button
                    onClick={() => deleteAccount(account.id, account.screen_name)}
                    className="px-3 py-1 text-sm text-red-600 hover:bg-red-50 rounded-md"
                  >
                    삭제
                  </button>
                </div>

                {/* 통계 정보 */}
                <div className="mt-4 grid grid-cols-2 md:grid-cols-6 gap-4 text-sm">
                  <div className="text-center">
                    <div className="font-medium text-blue-600">
                      {formatNumber(account.followers_count)}
                    </div>
                    <div className="text-gray-500">팔로워</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-green-600">
                      {formatNumber(account.stats.total_tweets)}
                    </div>
                    <div className="text-gray-500">수집된 트윗</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-purple-600">
                      {account.stats.days_tracked}일
                    </div>
                    <div className="text-gray-500">추적 기간</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-orange-600">
                      {account.activity_score.toFixed(0)}점
                    </div>
                    <div className="text-gray-500">활동도</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600 text-xs">
                      {formatDate(account.stats.first_tweet_date)}
                    </div>
                    <div className="text-gray-500">첫 수집</div>
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-gray-600 text-xs">
                      {formatDate(account.last_updated)}
                    </div>
                    <div className="text-gray-500">마지막 업데이트</div>
                  </div>
                </div>

                {/* 프로젝트 정보 */}
                {account.project_id && (
                  <div className="mt-3 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                    프로젝트 ID: {account.project_id}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 하단 정보 */}
      {accounts.length > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <h4 className="font-medium text-gray-800 mb-2">📊 전체 통계</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="text-center">
              <div className="font-medium text-blue-600">
                {accounts.length}개
              </div>
              <div className="text-gray-600">총 계정</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-green-600">
                {formatNumber(accounts.reduce((sum, acc) => sum + acc.stats.total_tweets, 0))}
              </div>
              <div className="text-gray-600">총 트윗</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-purple-600">
                {formatNumber(accounts.reduce((sum, acc) => sum + acc.followers_count, 0))}
              </div>
              <div className="text-gray-600">총 팔로워</div>
            </div>
            <div className="text-center">
              <div className="font-medium text-orange-600">
                {(accounts.reduce((sum, acc) => sum + acc.activity_score, 0) / accounts.length).toFixed(1)}점
              </div>
              <div className="text-gray-600">평균 활동도</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TwitterAccountManager;

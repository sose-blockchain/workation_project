'use client';

import React, { useState, useEffect } from 'react';
import { MarketData } from '@/types/investment';
import { supabase } from '@/lib/supabase';

interface MarketDataManagerProps {
  projectId: string;
  onMarketDataChange?: (marketData: MarketData[]) => void;
}

interface DatabaseMarketData {
  id: string;
  project_id: string;
  market_cap_rank?: number;
  current_price_usd?: number;
  market_cap_usd?: number;
  volume_24h_usd?: number;
  price_change_24h?: number;
  price_change_7d?: number;
  price_change_30d?: number;
  circulating_supply?: number;
  total_supply?: number;
  max_supply?: number;
  fully_diluted_valuation?: number;
  market_cap_dominance?: number;
  data_source: string;
  last_updated_at: string;
  created_at: string;
}

const DATA_SOURCES = [
  'coinmarketcap',
  'coingecko', 
  'cryptorank',
  'manual'
];

export default function MarketDataManager({ projectId, onMarketDataChange }: MarketDataManagerProps) {
  const [marketData, setMarketData] = useState<DatabaseMarketData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingData, setEditingData] = useState<DatabaseMarketData | null>(null);
  const [formData, setFormData] = useState({
    project_id: projectId,
    market_cap_rank: 0,
    current_price_usd: 0,
    market_cap_usd: 0,
    volume_24h_usd: 0,
    price_change_24h: 0,
    price_change_7d: 0,
    price_change_30d: 0,
    circulating_supply: 0,
    total_supply: 0,
    max_supply: 0,
    fully_diluted_valuation: 0,
    market_cap_dominance: 0,
    data_source: 'manual' as string
  });

  // 마켓 데이터 로드
  const loadMarketData = async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('market_data')
        .select('*')
        .eq('project_id', projectId)
        .order('last_updated_at', { ascending: false });

      if (error) throw error;
      
      setMarketData(data || []);
      onMarketDataChange?.(data || []);
    } catch (error) {
      console.error('마켓 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMarketData();
  }, [projectId]);

  // 폼 데이터 초기화
  const resetForm = () => {
    setFormData({
      project_id: projectId,
      market_cap_rank: 0,
      current_price_usd: 0,
      market_cap_usd: 0,
      volume_24h_usd: 0,
      price_change_24h: 0,
      price_change_7d: 0,
      price_change_30d: 0,
      circulating_supply: 0,
      total_supply: 0,
      max_supply: 0,
      fully_diluted_valuation: 0,
      market_cap_dominance: 0,
      data_source: 'manual'
    });
    setEditingData(null);
    setShowForm(false);
  };

  // 마켓 데이터 생성
  const createMarketData = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('market_data')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      await loadMarketData();
      resetForm();
    } catch (error) {
      console.error('마켓 데이터 생성 실패:', error);
      alert('마켓 데이터 생성에 실패했습니다.');
    }
  };

  // 마켓 데이터 업데이트
  const updateMarketData = async () => {
    if (!supabase || !editingData) return;

    try {
      const { error } = await supabase
        .from('market_data')
        .update(formData)
        .eq('id', editingData.id);

      if (error) throw error;

      await loadMarketData();
      resetForm();
    } catch (error) {
      console.error('마켓 데이터 업데이트 실패:', error);
      alert('마켓 데이터 업데이트에 실패했습니다.');
    }
  };

  // 마켓 데이터 삭제
  const deleteMarketData = async (dataId: string) => {
    if (!supabase || !confirm('이 마켓 데이터를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('market_data')
        .delete()
        .eq('id', dataId);

      if (error) throw error;

      await loadMarketData();
    } catch (error) {
      console.error('마켓 데이터 삭제 실패:', error);
      alert('마켓 데이터 삭제에 실패했습니다.');
    }
  };

  // 편집 시작
  const startEdit = (data: DatabaseMarketData) => {
    setEditingData(data);
    setFormData({
      project_id: data.project_id,
      market_cap_rank: data.market_cap_rank || 0,
      current_price_usd: data.current_price_usd || 0,
      market_cap_usd: data.market_cap_usd || 0,
      volume_24h_usd: data.volume_24h_usd || 0,
      price_change_24h: data.price_change_24h || 0,
      price_change_7d: data.price_change_7d || 0,
      price_change_30d: data.price_change_30d || 0,
      circulating_supply: data.circulating_supply || 0,
      total_supply: data.total_supply || 0,
      max_supply: data.max_supply || 0,
      fully_diluted_valuation: data.fully_diluted_valuation || 0,
      market_cap_dominance: data.market_cap_dominance || 0,
      data_source: data.data_source
    });
    setShowForm(true);
  };

  // 숫자 포맷팅
  const formatNumber = (num: number | undefined) => {
    if (!num) return '-';
    if (num >= 1000000000) return `${(num / 1000000000).toFixed(2)}B`;
    if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(2)}K`;
    return num.toFixed(2);
  };

  const formatPrice = (price: number | undefined) => {
    if (!price) return '-';
    return `$${price.toFixed(8)}`;
  };

  const formatPercentage = (percentage: number | undefined) => {
    if (percentage === undefined || percentage === null) return '-';
    const color = percentage >= 0 ? 'text-green-600' : 'text-red-600';
    const sign = percentage >= 0 ? '+' : '';
    return <span className={color}>{sign}{percentage.toFixed(2)}%</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">마켓 데이터</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
        >
          마켓 데이터 추가
        </button>
      </div>

      {/* 마켓 데이터 목록 */}
      {isLoading ? (
        <div className="text-center py-4">로딩 중...</div>
      ) : marketData.length === 0 ? (
        <div className="text-gray-500 text-center py-4">마켓 데이터가 없습니다.</div>
      ) : (
        <div className="space-y-4">
          {marketData.map((data) => (
            <div key={data.id} className="border border-gray-200 p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium capitalize">{data.data_source}</span>
                    <span className="text-sm text-gray-500">
                      업데이트: {new Date(data.last_updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div>
                      <div className="text-xs text-gray-500">순위</div>
                      <div className="font-medium">#{data.market_cap_rank || '-'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">현재 가격</div>
                      <div className="font-medium">{formatPrice(data.current_price_usd)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">시가총액</div>
                      <div className="font-medium">${formatNumber(data.market_cap_usd)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">24h 거래량</div>
                      <div className="font-medium">${formatNumber(data.volume_24h_usd)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">24h 변동</div>
                      <div>{formatPercentage(data.price_change_24h)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">7d 변동</div>
                      <div>{formatPercentage(data.price_change_7d)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">30d 변동</div>
                      <div>{formatPercentage(data.price_change_30d)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">유통량</div>
                      <div className="font-medium">{formatNumber(data.circulating_supply)}</div>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(data)}
                    className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteMarketData(data.id)}
                    className="px-2 py-1 text-xs text-red-600 border border-red-300 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 마켓 데이터 추가/편집 폼 */}
      {showForm && (
        <div className="border border-gray-200 p-4 space-y-4 bg-gray-50">
          <h4 className="font-medium">
            {editingData ? '마켓 데이터 수정' : '새 마켓 데이터 추가'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">데이터 소스</label>
              <select
                value={formData.data_source}
                onChange={(e) => setFormData(prev => ({ ...prev, data_source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              >
                {DATA_SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">시가총액 순위</label>
              <input
                type="number"
                value={formData.market_cap_rank}
                onChange={(e) => setFormData(prev => ({ ...prev, market_cap_rank: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">현재 가격 (USD)</label>
              <input
                type="number"
                step="0.00000001"
                value={formData.current_price_usd}
                onChange={(e) => setFormData(prev => ({ ...prev, current_price_usd: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">시가총액 (USD)</label>
              <input
                type="number"
                value={formData.market_cap_usd}
                onChange={(e) => setFormData(prev => ({ ...prev, market_cap_usd: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">24h 거래량 (USD)</label>
              <input
                type="number"
                value={formData.volume_24h_usd}
                onChange={(e) => setFormData(prev => ({ ...prev, volume_24h_usd: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">24h 변동률 (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_change_24h}
                onChange={(e) => setFormData(prev => ({ ...prev, price_change_24h: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">7d 변동률 (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_change_7d}
                onChange={(e) => setFormData(prev => ({ ...prev, price_change_7d: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">30d 변동률 (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.price_change_30d}
                onChange={(e) => setFormData(prev => ({ ...prev, price_change_30d: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">유통량</label>
              <input
                type="number"
                value={formData.circulating_supply}
                onChange={(e) => setFormData(prev => ({ ...prev, circulating_supply: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">총 공급량</label>
              <input
                type="number"
                value={formData.total_supply}
                onChange={(e) => setFormData(prev => ({ ...prev, total_supply: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">최대 공급량</label>
              <input
                type="number"
                value={formData.max_supply}
                onChange={(e) => setFormData(prev => ({ ...prev, max_supply: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">시장 점유율 (%)</label>
              <input
                type="number"
                step="0.01"
                value={formData.market_cap_dominance}
                onChange={(e) => setFormData(prev => ({ ...prev, market_cap_dominance: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <button
              onClick={editingData ? updateMarketData : createMarketData}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              {editingData ? '수정' : '저장'}
            </button>
            <button
              onClick={resetForm}
              className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

'use client';

import React, { useState, useEffect } from 'react';
import { Investment, CreateInvestmentRequest, UpdateInvestmentRequest } from '@/types/investment';
import { supabase } from '@/lib/supabase';

interface InvestmentManagerProps {
  projectId: string;
  onInvestmentsChange?: (investments: Investment[]) => void;
}

const ROUND_TYPES = [
  'Seed',
  'Series A',
  'Series B', 
  'Series C',
  'Private Sale',
  'Public Sale',
  'Strategic',
  'Bridge',
  'Pre-Seed'
];

const DATA_SOURCES = [
  'manual',
  'cryptorank',
  'crunchbase'
];

export default function InvestmentManager({ projectId, onInvestmentsChange }: InvestmentManagerProps) {
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState<Investment | null>(null);
  const [formData, setFormData] = useState<CreateInvestmentRequest>({
    project_id: projectId,
    round_type: 'Seed',
    date: new Date().toISOString().split('T')[0],
    amount_usd: 0,
    investors: [],
    data_source: 'manual'
  });

  // 투자 데이터 로드
  const loadInvestments = async () => {
    if (!supabase) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('investments')
        .select('*')
        .eq('project_id', projectId)
        .order('date', { ascending: false });

      if (error) throw error;
      
      setInvestments(data || []);
      onInvestmentsChange?.(data || []);
    } catch (error) {
      console.error('투자 데이터 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadInvestments();
  }, [projectId]);

  // 폼 데이터 초기화
  const resetForm = () => {
    setFormData({
      project_id: projectId,
      round_type: 'Seed',
      date: new Date().toISOString().split('T')[0],
      amount_usd: 0,
      investors: [],
      data_source: 'manual'
    });
    setEditingInvestment(null);
    setShowForm(false);
  };

  // 투자 생성
  const createInvestment = async () => {
    if (!supabase) return;
    
    try {
      const { data, error } = await supabase
        .from('investments')
        .insert([formData])
        .select()
        .single();

      if (error) throw error;

      await loadInvestments();
      resetForm();
    } catch (error) {
      console.error('투자 생성 실패:', error);
      alert('투자 정보 생성에 실패했습니다.');
    }
  };

  // 투자 업데이트
  const updateInvestment = async () => {
    if (!supabase || !editingInvestment) return;

    try {
      const { error } = await supabase
        .from('investments')
        .update(formData)
        .eq('id', editingInvestment.id);

      if (error) throw error;

      await loadInvestments();
      resetForm();
    } catch (error) {
      console.error('투자 업데이트 실패:', error);
      alert('투자 정보 업데이트에 실패했습니다.');
    }
  };

  // 투자 삭제
  const deleteInvestment = async (investmentId: string) => {
    if (!supabase || !confirm('이 투자 정보를 삭제하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('investments')
        .delete()
        .eq('id', investmentId);

      if (error) throw error;

      await loadInvestments();
    } catch (error) {
      console.error('투자 삭제 실패:', error);
      alert('투자 정보 삭제에 실패했습니다.');
    }
  };

  // 편집 시작
  const startEdit = (investment: Investment) => {
    setEditingInvestment(investment);
    setFormData({
      project_id: investment.project_id,
      round_type: investment.round_type,
      round_name: investment.round_name || '',
      date: investment.date,
      amount_usd: investment.amount_usd,
      valuation_pre_money_usd: investment.valuation_pre_money_usd || 0,
      valuation_post_money_usd: investment.valuation_post_money_usd || 0,
      lead_investor: investment.lead_investor || '',
      investors: investment.investors,
      investor_count: investment.investor_count || 0,
      announcement_url: investment.announcement_url || '',
      notes: investment.notes || '',
      data_source: investment.data_source || 'manual',
      source_url: investment.source_url || ''
    });
    setShowForm(true);
  };

  // 투자자 추가/제거
  const addInvestor = () => {
    setFormData(prev => ({
      ...prev,
      investors: [...prev.investors, '']
    }));
  };

  const removeInvestor = (index: number) => {
    setFormData(prev => ({
      ...prev,
      investors: prev.investors.filter((_, i) => i !== index)
    }));
  };

  const updateInvestor = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      investors: prev.investors.map((investor, i) => i === index ? value : investor)
    }));
  };

  // 금액 포맷팅
  const formatAmount = (amount: number) => {
    if (amount >= 1000000000) return `$${(amount / 1000000000).toFixed(1)}B`;
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(1)}K`;
    return `$${amount}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">투자 정보</h3>
        <button
          onClick={() => setShowForm(true)}
          className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
        >
          투자 추가
        </button>
      </div>

      {/* 투자 목록 */}
      {isLoading ? (
        <div className="text-center py-4">로딩 중...</div>
      ) : investments.length === 0 ? (
        <div className="text-gray-500 text-center py-4">투자 정보가 없습니다.</div>
      ) : (
        <div className="space-y-2">
          {investments.map((investment) => (
            <div key={investment.id} className="border border-gray-200 p-4 space-y-2">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-gray-900">{investment.round_type}</span>
                    {investment.round_name && (
                      <span className="text-gray-600">({investment.round_name})</span>
                    )}
                    <span className="text-sm text-gray-500">{investment.date}</span>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatAmount(investment.amount_usd)}
                  </div>
                  {investment.lead_investor && (
                    <div className="text-sm text-gray-600">
                      리드 투자자: <span className="text-gray-900">{investment.lead_investor}</span>
                    </div>
                  )}
                  {investment.investors.length > 0 && (
                    <div className="text-sm text-gray-600">
                      투자자: <span className="text-gray-900">{investment.investors.filter(i => i.trim()).join(', ')}</span>
                    </div>
                  )}
                  {(investment.valuation_pre_money_usd || investment.valuation_post_money_usd) && (
                    <div className="text-xs text-gray-500 space-x-4">
                      {investment.valuation_pre_money_usd && (
                        <span>Pre-money: {formatAmount(investment.valuation_pre_money_usd)}</span>
                      )}
                      {investment.valuation_post_money_usd && (
                        <span>Post-money: {formatAmount(investment.valuation_post_money_usd)}</span>
                      )}
                    </div>
                  )}
                  {investment.data_source && (
                    <div className="text-xs text-gray-400 mt-1">
                      출처: {investment.data_source}
                      {investment.source_url && (
                        <a 
                          href={investment.source_url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="ml-1 text-blue-500 hover:text-blue-700 underline"
                        >
                          링크
                        </a>
                      )}
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => startEdit(investment)}
                    className="px-2 py-1 text-xs border border-gray-300 hover:bg-gray-50"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteInvestment(investment.id)}
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

      {/* 투자 추가/편집 폼 */}
      {showForm && (
        <div className="border border-gray-200 p-4 space-y-4 bg-gray-50">
          <h4 className="font-medium">
            {editingInvestment ? '투자 정보 수정' : '새 투자 정보 추가'}
          </h4>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">라운드 유형</label>
              <select
                value={formData.round_type}
                onChange={(e) => setFormData(prev => ({ ...prev, round_type: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              >
                {ROUND_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">라운드 이름 (선택)</label>
              <input
                type="text"
                value={formData.round_name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, round_name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
                placeholder="Series A Round"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">날짜</label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">투자 금액 (USD)</label>
              <input
                type="number"
                value={formData.amount_usd}
                onChange={(e) => setFormData(prev => ({ ...prev, amount_usd: Number(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
                placeholder="1000000"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Pre-money 밸류 (USD, 선택)</label>
              <input
                type="number"
                value={formData.valuation_pre_money_usd || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valuation_pre_money_usd: Number(e.target.value) || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Post-money 밸류 (USD, 선택)</label>
              <input
                type="number"
                value={formData.valuation_post_money_usd || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, valuation_post_money_usd: Number(e.target.value) || undefined }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">리드 투자자 (선택)</label>
              <input
                type="text"
                value={formData.lead_investor || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, lead_investor: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
                placeholder="Andreessen Horowitz"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">데이터 소스</label>
              <select
                value={formData.data_source || 'manual'}
                onChange={(e) => setFormData(prev => ({ ...prev, data_source: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              >
                {DATA_SOURCES.map(source => (
                  <option key={source} value={source}>{source}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 투자자 목록 */}
          <div>
            <label className="block text-sm font-medium mb-1">투자자 목록</label>
            <div className="space-y-2">
              {formData.investors.map((investor, index) => (
                <div key={index} className="flex space-x-2">
                  <input
                    type="text"
                    value={investor}
                    onChange={(e) => updateInvestor(index, e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 text-gray-900 bg-white"
                    placeholder="투자자 이름"
                  />
                  <button
                    onClick={() => removeInvestor(index)}
                    className="px-2 py-2 text-red-600 border border-red-300 hover:bg-red-50"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={addInvestor}
                className="px-3 py-1.5 text-sm border border-gray-300 hover:bg-gray-50"
              >
                투자자 추가
              </button>
            </div>
          </div>

          {/* 추가 정보 */}
          <div>
            <label className="block text-sm font-medium mb-1">발표 URL (선택)</label>
            <input
              type="url"
              value={formData.announcement_url || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, announcement_url: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              placeholder="https://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">메모 (선택)</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 bg-white"
              rows={3}
              placeholder="추가 정보나 메모를 입력하세요"
            />
          </div>

          <div className="flex space-x-2">
            <button
              onClick={editingInvestment ? updateInvestment : createInvestment}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700"
            >
              {editingInvestment ? '수정' : '저장'}
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

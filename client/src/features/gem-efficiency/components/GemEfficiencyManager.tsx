"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { GEM_LEVELS, GemType, GemLevel } from '../constants/gemData';
import { useGemPrices } from '../hooks/useGemPrices';
import { calculateGemBreakEvenPrices } from '../utils/gemCalculator';
import APISettings from '../../smart-crafting/components/APISettings';
import ThemeSelector from '../../smart-crafting/components/ThemeSelector';
import InventoryCalculator from './InventoryCalculator';

export default function GemEfficiencyManager() {
  const [activeTab, setActiveTab] = useState<GemType>('crimson');
  const [targetLevel, setTargetLevel] = useState<GemLevel>(7);
  const [rightColTab, setRightColTab] = useState<'efficiency' | 'inventory'>('efficiency');
  
  // Storage State
  const [apiKey, setApiKey] = useState<string>('');
  
  const {
      prices,
      isLoading,
      isPriceLoaded,
      apiError,
      logs,
      fetchPrices,
      addLog
  } = useGemPrices(apiKey);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [enableTransition, setEnableTransition] = useState<boolean>(false);
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('gemCalcData');
    const sharedApiKey = localStorage.getItem('loa_api_key');
    
    if (sharedApiKey) {
      setApiKey(sharedApiKey);
    }

    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (!sharedApiKey && data.apiKey) {
            setApiKey(data.apiKey);
            localStorage.setItem('loa_api_key', data.apiKey);
        }
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.targetLevel && GEM_LEVELS.includes(data.targetLevel)) setTargetLevel(data.targetLevel);
        
        if (sharedApiKey || data.apiKey) {
            setHasEntered(true);
        }
      } catch (e) { console.error(e); }
    }
    setIsInitialized(true);
    
    const timer = setTimeout(() => setEnableTransition(true), 100);
    return () => clearTimeout(timer);
  }, []);

  // Save to local storage
  useEffect(() => {
    if (!isInitialized) return;

    if (apiKey) {
        localStorage.setItem('loa_api_key', apiKey);
    }

    const data = { 
        apiKey,
        activeTab,
        targetLevel
    };
    localStorage.setItem('gemCalcData', JSON.stringify(data));
  }, [apiKey, activeTab, targetLevel, isInitialized]);

  const isConfigured = !!apiKey && !apiError;
  const isFullyReady = hasEntered && isPriceLoaded;

  useEffect(() => {
    if (hasEntered && !isConfigured) {
      setHasEntered(false);
    }
  }, [hasEntered, isConfigured]);

  const getGemName = (type: GemType) => type === 'crimson' ? '겁화' : type === 'azure' ? '작열' : '종류 무관';

  // Calculate Break-Even Prices
  const breakEvenResult = useMemo(() => {
      if (!isPriceLoaded) return null;
      return calculateGemBreakEvenPrices(targetLevel, activeTab, prices);
  }, [targetLevel, activeTab, prices, isPriceLoaded]);

  if (!isInitialized) return <div className="min-h-screen bg-[var(--bg-main)]" />;

  const titleClass = `fixed left-1/2 -translate-x-1/2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col items-center whitespace-nowrap pointer-events-none ${
      hasEntered
      ? 'top-20 md:top-24 scale-100 opacity-100 hidden'
      : 'top-[12%] md:top-[16%] scale-100 opacity-100'
  }`;

  const apiClass = `fixed z-50 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
      hasEntered 
      ? 'top-20 right-6 scale-100 items-end translate-x-0 translate-y-0' 
      : 'top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 scale-100 items-center'
  }`;

  return (
    <>
      <div 
          className={`fixed inset-0 bg-[var(--bg-main)]/95 backdrop-blur-md z-40 pointer-events-none flex flex-col items-center justify-center ${hasEntered ? 'opacity-0 invisible' : 'opacity-100'}`}
          style={{ 
            transition: enableTransition 
                ? `opacity 1s cubic-bezier(0.4, 0, 0.2, 1), visibility 0s linear ${hasEntered ? '1s' : '0s'}`
                : 'none' 
          }}
      >
          <div className="absolute top-[30%] md:top-[35%] text-center space-y-3 px-4 w-full">
              <p className={`text-slate-300 text-lg md:text-xl font-medium transition-all duration-500 delay-200 ${isConfigured ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  보석 효율 계산을 위해 <span className="text-[var(--color-primary)] font-bold text-xl md:text-2xl decoration-wavy underline decoration-[var(--color-primary)]/30 underline-offset-4">API Key</span>를 입력해주세요.
              </p>
          </div>
          
          <div className={`absolute bottom-32 md:bottom-40 left-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-auto z-[100] ${isConfigured ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
               <button 
                  onClick={() => setHasEntered(true)}
                  className="group relative px-8 py-4 bg-[var(--color-primary)] hover:bg-[var(--color-secondary)] text-white text-lg font-black rounded-2xl shadow-2xl hover:shadow-[var(--color-primary)]/50 transition-all active:scale-95 flex items-center gap-3 overflow-hidden"
               >
                   <span className="relative z-10">계산기 시작하기</span>
                   <svg className="w-6 h-6 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                   </svg>
                   <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
               </button>
          </div>
      </div>

      <div className={titleClass}>
            {/* The title has been removed upon entry, but we can completely remove it here as requested. Let's just keep the container empty or not render it at all. */}
      </div>

      <APISettings 
        apiKey={apiKey}
        setApiKey={setApiKey}
        fetchPrices={(key) => fetchPrices(key)}
        isLoading={isLoading}
        logs={logs}
        className={apiClass}
        forceExpanded={!hasEntered}
        apiError={apiError}
      />

      <div className={`max-w-6xl w-full min-h-[100dvh] flex flex-col justify-center relative transition-opacity duration-1000 pt-24 mx-auto pb-10 px-4 ${isFullyReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none h-0 p-0 overflow-hidden'}`}>
        
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-6 lg:gap-8 mt-4">
            
            {/* Left Column: Target Selection & Current Prices */}
            <div className="lg:col-span-5 flex flex-col gap-4 lg:gap-6">
                {/* Target Selection */}
                <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                    
                    <h2 className="text-lg font-bold text-white mb-3 relative z-10 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        목표 보석 선택
                    </h2>

                    <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner mb-4 relative z-10">
                       {(['any', 'crimson', 'azure'] as GemType[]).map(type => (
                           <button
                               key={type}
                               onClick={() => setActiveTab(type)}
                               className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all duration-300 ${activeTab === type ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                           >
                               {getGemName(type)} {type !== 'any' && '보석'}
                           </button>
                       ))}
                    </div>

                    <div className="grid grid-cols-6 gap-2 relative z-10">
                       {GEM_LEVELS.map(level => (
                           <button
                               key={level}
                               onClick={() => setTargetLevel(level)}
                               className={`py-3 rounded-xl flex flex-col items-center justify-center gap-1 border transition-all ${targetLevel === level ? 'bg-[var(--color-secondary)]/20 border-[var(--color-secondary)] shadow-[0_0_15px_rgba(var(--color-secondary-rgb),0.3)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                           >
                               <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-base ${targetLevel === level ? 'bg-[var(--color-secondary)] text-white shadow-lg' : 'bg-black/50 text-slate-300'}`}>
                                   {level}
                               </div>
                               <span className={`text-[10px] font-bold ${targetLevel === level ? 'text-white' : 'text-slate-400'}`}>Lv.{level}</span>
                           </button>
                       ))}
                    </div>
                </section>

                {/* Current Prices Table */}
                <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-white/5 rounded-2xl p-5 shadow-xl relative overflow-hidden flex-1">
                    <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                        <svg className="w-5 h-5 text-[var(--color-primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        현재 최저가 목록
                    </h2>
                    
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left border-collapse min-w-[300px]">
                            <thead>
                                <tr className="border-b border-white/10 uppercase text-[10px] tracking-wider text-slate-400">
                                    <th className="py-2">레벨</th>
                                    <th className="py-2 text-right">겁화 가격</th>
                                    <th className="py-2 text-right">작열 가격</th>
                                </tr>
                            </thead>
                            <tbody>
                                {GEM_LEVELS.map(level => {
                                    const crimsonPrice = prices.crimson[level] || 0;
                                    const azurePrice = prices.azure[level] || 0;
                                    
                                    return (
                                    <tr key={level} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                                        <td className="py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-5 h-5 rounded-full bg-[var(--color-primary)]/20 text-[var(--color-primary)] flex items-center justify-center font-bold text-[10px]">{level}</div>
                                            </div>
                                        </td>
                                        <td className="py-2 text-right text-xs">
                                            <span className={crimsonPrice > 0 ? 'text-slate-200' : 'text-slate-500'}>
                                                {crimsonPrice > 0 ? crimsonPrice.toLocaleString() : '- '} <span className="text-[10px] text-[var(--color-primary)]">G</span>
                                            </span>
                                        </td>
                                        <td className="py-2 text-right text-xs">
                                            <span className={azurePrice > 0 ? 'text-slate-200' : 'text-slate-500'}>
                                                {azurePrice > 0 ? azurePrice.toLocaleString() : '- '} <span className="text-[10px] text-[var(--color-primary)]">G</span>
                                            </span>
                                        </td>
                                    </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>

            {/* Right Column: Content Toggle Area */}
            <div className="lg:col-span-7 flex flex-col gap-4 lg:gap-6">
                
                {/* Right Column Tabs */}
                {targetLevel > 5 && isFullyReady && (
                    <div className="flex gap-2 p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                        <button
                            onClick={() => setRightColTab('efficiency')}
                            className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${rightColTab === 'efficiency' ? 'bg-[var(--color-primary)] text-white shadow-lg' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            합성 효율 분석
                        </button>
                        <button
                            onClick={() => setRightColTab('inventory')}
                            className={`flex flex-1 items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all duration-300 ${rightColTab === 'inventory' ? 'bg-[var(--color-secondary)] text-white shadow-lg' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                            보유 자산 계산기
                        </button>
                    </div>
                )}

                {/* Target Purchase Limits (Break Even Points) */}
                {rightColTab === 'efficiency' && breakEvenResult && targetLevel > 5 && (
                <section className="flex-1 bg-[var(--bg-panel)]/80 backdrop-blur-md border border-[var(--color-primary)]/30 rounded-2xl p-5 shadow-xl relative overflow-hidden group lg:min-h-[720px] flex flex-col">
                    <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/10 to-[var(--color-secondary)]/10 opacity-50 pointer-events-none" />
                    
                    <div className="relative z-10 mb-5">
                        <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                            <span className="bg-[var(--color-primary)] text-white w-6 h-6 rounded flex items-center justify-center text-sm">{targetLevel}</span>
                            <span>{activeTab === 'any' ? '최저가 기준 합성 기대 비용' : '결과 보석 확률 50%를 반영한 기대 획득 비용'}</span>
                        </h2>
                        <div className="text-xs text-slate-300 space-y-1">
                            {activeTab === 'any' ? (
                                <>
                                    <p>
                                        <b>[{targetLevel}레벨 {getGemName(activeTab)}]</b> 결과 보석의 종류(겁화/작열)와 관계없이 무조건 사용하려는 경우의 <b>최소 획득 비용</b>입니다.
                                    </p>
                                    <p>
                                        합성 결과물을 되팔고 다시 사는 과정이 없으므로, 현재 시장에 등록된 겁화/작열 중 <b>더 저렴한 최저가를 기준</b>으로 계산됩니다.
                                    </p>
                                </>
                            ) : (
                                <>
                                    <p>
                                        <b>[{targetLevel}레벨 {getGemName(activeTab)}]</b> 결과가 뜰 확률 50%, 다른 종류가 떠서 <b>수수료 5%를 떼고 팔아 다시 사는 확률 50%</b>를 모두 감안한 <b>통계적 기대 획득 비용</b>입니다.
                                    </p>
                                    <p>
                                        경매장의 하위 레벨이 적힌 상한선보다 싸다면, 직접 사는 것보다 <b>합성하는 도박이 수학적으로 이득</b>입니다.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                        {/* Direct Purchase Card */}
                        <div className={`relative p-4 rounded-xl border transition-all bg-black/40 border-slate-600/50 hover:border-slate-500/80`}>
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <p className="text-[10px] text-[var(--color-primary)] uppercase tracking-widest font-bold mb-0.5">직접 구매</p>
                                    <p className="text-lg font-black text-white leading-tight">
                                        {targetLevel}레벨 {getGemName(activeTab)}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] text-slate-400 mb-0.5">요구 개수</p>
                                    <p className="font-bold text-sm text-slate-300">1개</p>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                                <div>
                                    <p className="text-xs text-slate-400 mb-0.5">현재 시장 최저가</p>
                                    <p className="text-xl font-black text-slate-200">
                                        {breakEvenResult.targetDirectPrice > 0 ? breakEvenResult.targetDirectPrice.toLocaleString() : '-'}<span className="text-xs font-bold text-[var(--color-primary)] ml-1">G</span>
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Synthesis Strategies */}
                        {breakEvenResult.breakEvenPoints.map((point) => {
                            const isCheaper = point.isProfitable;
                            const diff = point.breakEvenUnitPrice - point.currentCheapestPrice;

                            return (
                                <div key={point.level} className={`relative p-4 rounded-xl border transition-all ${isCheaper ? 'bg-gradient-to-br from-[var(--color-primary)]/20 to-[var(--color-secondary)]/20 border-[var(--color-primary)] shadow-[0_0_15px_rgba(var(--color-primary-rgb),0.3)] scale-[1.01]' : 'bg-black/40 border-white/10 hover:border-white/20'}`}>
                                    {isCheaper && (
                                        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-emerald-400 to-green-600 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg uppercase tracking-wider transform rotate-12">
                                            BUY NOW
                                        </div>
                                    )}
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-0.5">합성 재료</p>
                                            <p className="text-lg font-black text-white leading-tight">
                                                {point.level}레벨 보석
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 mb-0.5">요구 개수</p>
                                            <p className={`font-bold text-sm ${isCheaper ? 'text-[var(--color-secondary)]' : 'text-slate-300'}`}>{point.amountNeeded}개</p>
                                        </div>
                                    </div>

                                    <div className="pt-3 border-t border-white/10 flex justify-between items-end">
                                        <div>
                                            <p className="text-xs text-slate-400 mb-0.5">구매 상한선 (손익분기점)</p>
                                            <p className={`text-xl font-black ${isCheaper ? 'text-amber-400' : 'text-slate-200'}`}>
                                                {point.breakEvenUnitPrice.toLocaleString()}<span className="text-xs font-bold text-[var(--color-primary)] ml-1">G 이하</span>
                                            </p>
                                        </div>
                                    </div>

                                    <div className="mt-3 p-2 rounded-lg bg-black/30 border border-white/5 flex justify-between items-center text-xs">
                                         <span className="text-slate-400">현재 시장 최저가</span>
                                         <span className={`font-bold ${isCheaper ? 'text-green-400' : 'text-red-400'}`}>
                                             {point.currentCheapestPrice > 0 ? point.currentCheapestPrice.toLocaleString() + ' G' : '매물 없음'}
                                         </span>
                                    </div>
                                    {isCheaper && point.currentCheapestPrice > 0 && (
                                        <p className="text-[10px] text-emerald-400 mt-1.5 font-medium text-right">
                                            ✨ 개당 {diff.toLocaleString()} G 이득
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </section>
                )}

                {/* Inventory Synthesis Calculator */}
                {rightColTab === 'inventory' && targetLevel > 5 && isFullyReady && (
                    <InventoryCalculator 
                        targetLevel={targetLevel} 
                        targetType={activeTab} 
                        prices={prices} 
                        isPriceLoaded={isPriceLoaded} 
                    />
                )}

                {targetLevel === 5 && (
                    <div className="text-center p-6 bg-[var(--bg-panel)]/50 backdrop-blur-md rounded-2xl border border-white/5">
                        <p className="text-sm text-slate-400 font-medium">5레벨 보석은 하위 보석 합성을 통해 획득할 수 없으므로 효율 분석을 지원하지 않습니다.</p>
                    </div>
                )}
            </div>

        </div>
      </div>

      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 delay-500 ${hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <ThemeSelector />
      </div>

    </>
  );
}

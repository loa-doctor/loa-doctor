"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { COSTS, MaterialType, BASE_DURATIONS } from '../constants/gameData';
import { useMarketPrices } from '../hooks/useMarketPrices';
import { usePipWindow } from '../hooks/usePipWindow';
import { useCraftingTimer } from '../hooks/useCraftingTimer';
import { useCraftingHistory } from '../hooks/useCraftingHistory';

import BonusSettings from './BonusSettings';
import APISettings from './APISettings';
import MaterialInputs from './MaterialInputs';
import ProfitDisplay from './ProfitDisplay';
import ThemeSelector from './ThemeSelector';
import PurchaseRequirements from './PurchaseRequirements';
import HistoryView from './HistoryView';
import CraftingCard from './CraftingCard';

interface CalculationResult {
  buyCount: number;
  needed: number;
  bundleSize: number;
  cost: number;
}

interface Results {
  rare: CalculationResult;
  uncommon: CalculationResult;
  common: CalculationResult;
  totalMissingCost: number;
}

export default function SmartCraftingManager() {
  const [activeTab, setActiveTab] = useState<MaterialType>('superior');
  const [targetSlots, setTargetSlots] = useState<number>(1);
  const [ownedRare, setOwnedRare] = useState<number>(0);
  const [ownedUncommon, setOwnedUncommon] = useState<number>(0);
  const [ownedCommon, setOwnedCommon] = useState<number>(0);
  
  // API Integration State
  const [apiKey, setApiKey] = useState<string>('');
  
  const { 
      prices, 
      bundleCounts, 
      isLoading, 
      isPriceLoaded, 
      apiError, 
      logs, 
      fetchPrices,
      addLog 
  } = useMarketPrices(apiKey);

  // Bonus Stats
  const [costReduction, setCostReduction] = useState<number | null>(null);
  const [greatSuccessChance, setGreatSuccessChance] = useState<number | null>(null);
  const [ninavBlessing, setNinavBlessing] = useState<boolean>(false);
  
  // Toast State for PiP
  const [toast, setToast] = useState<{message: string, type: 'error' | 'success'} | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
      setToast({message, type});
      setTimeout(() => setToast(null), 3000);
  };
  const [timeReduction, setTimeReduction] = useState<number | null>(null);

  // Previous Value Tracking for Verification Reset
  const prevValues = React.useRef({
      targetSlots: 1,
      ownedRare: 0,
      ownedUncommon: 0,
      ownedCommon: 0
  });

  const handleFocus = (field: keyof typeof prevValues.current, value: number) => {
      prevValues.current[field] = value;
  };

  // Custom Hooks
  const { pipWindow, openPip } = usePipWindow();
  
  const { history, setHistory, updateHistoryEntry, deleteHistory, clearHistory, saveHistory, handleRecordResult, updateLatestEntryDuration } = useCraftingHistory([]);

  const { craftingState, startCrafting, cancelCrafting, setCraftingState } = useCraftingTimer(addLog);

  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [enableTransition, setEnableTransition] = useState<boolean>(false);
  
  // View State
  const [view, setView] = useState<'calculator' | 'history'>('calculator');
  const [hasEntered, setHasEntered] = useState<boolean>(false);

  // Load from local storage
  useEffect(() => {
    const saved = localStorage.getItem('matCalcData');
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setTargetSlots(Number(data.targetSlots) || 1);
        setOwnedRare(Number(data.ownedRare) || 0);
        setOwnedUncommon(Number(data.ownedUncommon) || 0);
        setOwnedCommon(Number(data.ownedCommon) || 0);
        if (data.activeTab) setActiveTab(data.activeTab);
        if (data.apiKey) setApiKey(data.apiKey);
        if (typeof data.costReduction === 'number') setCostReduction(data.costReduction);
        if (typeof data.greatSuccessChance === 'number') setGreatSuccessChance(data.greatSuccessChance);
        if (typeof data.ninavBlessing === 'boolean') setNinavBlessing(data.ninavBlessing);
        if (typeof data.timeReduction === 'number') setTimeReduction(data.timeReduction);
        if (data.history) setHistory(data.history);
        
        // Auto-start if all configuration is present
        if (data.apiKey && 
            typeof data.costReduction === 'number' && 
            typeof data.greatSuccessChance === 'number' && 
            typeof data.timeReduction === 'number') {
            setHasEntered(true);
        }
      } catch (e) { console.error(e); }
    }
    setIsInitialized(true);
    
    // Enable transitions after initial render to prevent flash
    const timer = setTimeout(() => setEnableTransition(true), 100);
    return () => clearTimeout(timer);
  }, [setHistory]);

  // Save to local storage
  useEffect(() => {
    if (!isInitialized) return;

    const data = { 
        targetSlots, 
        ownedRare, 
        ownedUncommon, 
        ownedCommon, 
        activeTab, 
        apiKey,
        costReduction,
        greatSuccessChance,
        ninavBlessing,
        timeReduction,
        history
    };
    localStorage.setItem('matCalcData', JSON.stringify(data));
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, apiKey, costReduction, greatSuccessChance, ninavBlessing, timeReduction, history, isInitialized]);

  const results: Results = useMemo(() => {
    const slots = Math.max(0, targetSlots);
    const owned = { rare: ownedRare, uncommon: ownedUncommon, common: ownedCommon };
    const res: any = { totalMissingCost: 0 };
    const currentCost = COSTS[activeTab];
    
    ['rare', 'uncommon', 'common'].forEach((key) => {
      const k = key as keyof typeof owned;
      const needed = currentCost[k] * slots;
      const deficit = needed - owned[k];
      const bundle = bundleCounts[k as keyof typeof bundleCounts] || 10; 
      const buyCount = deficit <= 0 ? 0 : Math.ceil(deficit / bundle); 
      
      const price = prices[k as keyof typeof prices] || 0;
      const cost = buyCount * price;
      
      res[k] = { buyCount, needed, bundleSize: bundle, cost }; 
      res.totalMissingCost += cost;
    });
    return res as Results;
  }, [targetSlots, ownedRare, ownedUncommon, ownedCommon, activeTab, bundleCounts, prices]);

  // Profit Calculation
  const profitStats = useMemo(() => {
      const slots = Math.max(0, targetSlots);
      if (slots === 0) return null;

      const currentRecipe = COSTS[activeTab];
      const fusionKey = activeTab === 'abidos' ? 'fusion' : 'superiorFusion';
      const outputPrice = prices[fusionKey as keyof typeof prices];
      
      if (!outputPrice) return null;
      if (prices.rare === 0 || prices.uncommon === 0 || prices.common === 0) return null;

      // 1. Material Cost
      let totalMaterialCost = 0;
      (['rare', 'uncommon', 'common'] as const).forEach(key => {
          const needed = currentRecipe[key] * slots;
          const price = prices[key];
          const bundle = bundleCounts[key] || 1;
          const unitPrice = price / bundle;
          totalMaterialCost += needed * unitPrice;
      });

      // 2. Gold Cost
      const baseGold = currentRecipe.gold * slots;
      const reductionMult = 1 - ((costReduction || 0) / 100);
      const totalGoldCost = baseGold * reductionMult;

      // 3. Expected Revenue
      const baseProb = 0.05;
      const finalProb = baseProb * (1 + ((greatSuccessChance || 0) / 100));
      const expectedOutputPerSlot = 10 * (1 + finalProb);
      const totalExpectedOutput = expectedOutputPerSlot * slots;

      const outputBundle = bundleCounts[fusionKey as keyof typeof bundleCounts] || 1;
      const outputUnitPrice = outputPrice / outputBundle; 

      const grossRevenue = totalExpectedOutput * outputUnitPrice;

      // Total Cost
      const totalCost = totalMaterialCost + totalGoldCost;

      // Profit Calculation
      const sellingRevenue = grossRevenue * 0.95;
      const sellingProfit = sellingRevenue - totalCost;

      const usageProfit = grossRevenue - totalCost;
      
      // Hourly Calculation
      const isNinav = ninavBlessing;
      const currentConcurrency = isNinav ? 4 : 3;

      const effectiveSlots = slots || 1;
      const sellingProfitPerSlot = sellingProfit / effectiveSlots;
      const usageProfitPerSlot = usageProfit / effectiveSlots;
      
      const baseTimeSec = BASE_DURATIONS[activeTab];
      const totalReduction = (timeReduction || 0) + (isNinav ? 10 : 0);
      const timeMultiplier = Math.max(0, 1 - (totalReduction / 100));
      const batchTimeSec = baseTimeSec * timeMultiplier;
      
      const batchSellingProfit = sellingProfitPerSlot * currentConcurrency;
      const batchUsageProfit = usageProfitPerSlot * currentConcurrency;

      const hourlySellingProfit = batchTimeSec > 0 ? (batchSellingProfit / batchTimeSec) * 3600 : 0;
      const hourlyUsageProfit = batchTimeSec > 0 ? (batchUsageProfit / batchTimeSec) * 3600 : 0;

      // Calculate Coefficients for Dynamic Adjustment (Hourly = (Revenue - Cost) * TimeCoef)
      // TimeCoef = 3600 * concurrency / (slots * batchTimeSec)
      // Actually simpler: HourlyProfit = (TotalRevenue - TotalCost) * TimeCoef
      // We need:
      // - HourlyCost = TotalCost * TimeCoef
      // - HourlyRevenue = TotalRevenue * TimeCoef
      
      // Let's derive TimeCoef from hourlySellingProfit
      // hourlySellingProfit = (sellingProfit / slots) * concurrency / batchTimeSec * 3600
      // sellingProfit = sellingRevenue - totalCost
      // So TimeCoef = (concurrency * 3600) / (slots * batchTimeSec)
      
      const timeCoef = (slots > 0 && batchTimeSec > 0) ? (currentConcurrency * 3600) / (slots * batchTimeSec) : 0;
      
      const hourlyCost = totalCost * timeCoef;
      
      // Revenue Per Item Coefficient (to multiply by actual count)
      // HourlyRevenue = (Count * UnitPrice) * TimeCoef
      // Coef = UnitPrice * TimeCoef
      const hourlySellingRevenuePerItem = (outputUnitPrice * 0.95) * timeCoef;
      const hourlyUsageRevenuePerItem = outputUnitPrice * timeCoef;

      return {
          grossRevenue,
          sellingRevenue,
          matCost: totalMaterialCost,
          goldCost: totalGoldCost,
          totalCost: totalCost,
          sellingProfit,
          usageProfit,
          outputQty: totalExpectedOutput,
          hourlySellingProfit,
          hourlyUsageProfit,
          hourlyCost,
          hourlySellingRevenuePerItem,
          hourlyUsageRevenuePerItem
      };
  }, [targetSlots, activeTab, prices, bundleCounts, costReduction, greatSuccessChance, ninavBlessing, timeReduction]);

  const handleUpdate = () => {
     if (craftingState.isActive) {
         showToast("제작이 진행 중입니다. 먼저 제작을 취소해주세요.", "error");
         return;
     }
     setOwnedRare(prev => {
        const data = results.rare;
        return (prev + (data.buyCount * data.bundleSize)) - data.needed;
     });
     setOwnedUncommon(prev => {
        const data = results.uncommon;
        return (prev + (data.buyCount * data.bundleSize)) - data.needed;
     });
     setOwnedCommon(prev => {
        const data = results.common;
        return (prev + (data.buyCount * data.bundleSize)) - data.needed;
     });

     // Calculate total duration for history
     const isNinav = ninavBlessing;
     const currentConcurrency = isNinav ? 4 : 3;
     const baseTimeSec = BASE_DURATIONS[activeTab];
     const totalReduction = (timeReduction || 0) + (isNinav ? 10 : 0);
     const timeMultiplier = Math.max(0, 1 - (totalReduction / 100));
     const batchTimeSec = baseTimeSec * timeMultiplier;
     
     // Duration Logic:
     // - Slots: targetSlots
     // - Concurrency: 3 or 4
     // - Batch Size: 10 items (1 slot) per concurrency slot
     // - Total Batches Logic: We process 'concurrency' slots in parallel.
     // - Total Rounds = Ceil(targetSlots / concurrency)
     // - Total Duration = Total Rounds * batchTimeSec
     const totalRounds = Math.ceil(targetSlots / currentConcurrency);
     const totalDuration = totalRounds * batchTimeSec;

     saveHistory(activeTab, targetSlots, prices, bundleCounts, costReduction, greatSuccessChance, addLog, totalDuration);
     startCrafting(
        activeTab, 
        targetSlots, 
        ninavBlessing, 
        timeReduction,
        profitStats?.hourlySellingProfit || 0,
        profitStats?.hourlyUsageProfit || 0,
        profitStats?.hourlyCost || 0,
        profitStats?.hourlyUsageRevenuePerItem || 0,
        profitStats?.hourlySellingRevenuePerItem || 0,
        (targetSlots > 0 && BASE_DURATIONS[activeTab]) ? ((isNinav ? 4 : 3) * 3600) / (targetSlots * BASE_DURATIONS[activeTab] * Math.max(0, 1 - (((timeReduction || 0) + (isNinav ? 10 : 0)) / 100))) : 0
     );
  };

  // [Temporary Fix] Force update latest history duration based on current settings
  // because previous data migration might have rounded the duration incorrectly.
  useEffect(() => {
    if (history.length === 0) return;
    
    // Calculate what the duration SHOULD be with current settings
    const isNinav = ninavBlessing;
    const currentConcurrency = isNinav ? 4 : 3;
    const baseTimeSec = BASE_DURATIONS[activeTab];
    const totalReduction = (timeReduction || 0) + (isNinav ? 10 : 0);
    const timeMultiplier = Math.max(0, 1 - (totalReduction / 100));
    const batchTimeSec = baseTimeSec * timeMultiplier;
    const totalRounds = Math.ceil(targetSlots / currentConcurrency);
    
    const correctDuration = totalRounds * batchTimeSec;
    const latestDuration = history[0].duration || 0;

    // Apply fix if different (with small tolerance for float)
    if (Math.abs(latestDuration - correctDuration) > 1) {
        // console.log("Fixing duration:", latestDuration, "->", correctDuration);
        (window as any).fixLatestDuration = () => {
             // Accessing the exposed function from useCraftingHistory
             // But we need to call the method from the hook returned object.
             // Since we are inside the component using the hook, we can call it directly.
             updateLatestEntryDuration(correctDuration);
             alert(`최신 기록의 제작 시간을 ${latestDuration.toFixed(1)}초에서 ${correctDuration.toFixed(1)}초로 수정했습니다.`);
        };
    }
  }, [history, activeTab, targetSlots, ninavBlessing, timeReduction, updateLatestEntryDuration]);

  const isConfigured = !!apiKey && costReduction !== null && greatSuccessChance !== null && timeReduction !== null && !apiError;
  const isFullyReady = hasEntered && isPriceLoaded;

  // Revert to setup if configuration becomes invalid
  useEffect(() => {
    if (hasEntered && !isConfigured) {
      setHasEntered(false);
    }
  }, [hasEntered, isConfigured]);

  // Expose function for PiP
  useEffect(() => {
    (window as any).startCrafting = () => startCrafting(activeTab, targetSlots, ninavBlessing, timeReduction, 0, 0, 0, 0, 0, 0);
    return () => { (window as any).startCrafting = undefined; };
  }, [startCrafting, activeTab, targetSlots, ninavBlessing, timeReduction]);

  if (!isInitialized) return <div className="min-h-screen bg-[var(--bg-main)]" />;

  // Animation Classes
  const bonusClass = `fixed z-[60] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
      hasEntered 
      ? 'top-20 left-6 scale-100 items-start translate-x-0 translate-y-0' 
      : 'top-[50%] left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-[55%] md:left-auto md:right-[calc(50%+16px)] md:translate-x-0 md:-translate-y-1/2 scale-95 items-center md:items-end'
  }`;

  const apiClass = `fixed z-50 flex flex-col transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] ${
      hasEntered 
      ? 'top-20 right-6 scale-100 items-end translate-x-0 translate-y-0' 
      : 'top-[80%] left-1/2 -translate-x-1/2 -translate-y-1/2 md:top-[55%] md:left-[calc(50%+16px)] md:translate-x-0 md:-translate-y-1/2 scale-95 items-center md:items-start'
  }`;

  const titleClass = `fixed left-1/2 -translate-x-1/2 transition-all duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] z-50 flex flex-col items-center whitespace-nowrap pointer-events-none ${
      hasEntered
      ? 'top-20 scale-100 opacity-100'
      : 'top-[6%] md:top-[12%] scale-100 opacity-100'
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
          <div className="absolute top-[14%] md:top-[22%] text-center space-y-3 px-4 w-full">
              <p className={`text-slate-300 text-lg md:text-xl font-medium transition-all duration-500 delay-200 ${isConfigured ? 'opacity-0 -translate-y-4' : 'opacity-100 translate-y-0'}`}>
                  정확한 이득 계산을 위해 <span className="text-[var(--color-primary)] font-bold text-xl md:text-2xl decoration-wavy underline decoration-[var(--color-primary)]/30 underline-offset-4">API Key</span>와 <span className="text-[var(--color-primary)] font-bold text-xl md:text-2xl decoration-wavy underline decoration-[var(--color-primary)]/30 underline-offset-4">제작 보너스</span>를 설정해주세요.
              </p>
          </div>
          
          <div className={`absolute bottom-10 md:bottom-24 left-1/2 -translate-x-1/2 transition-all duration-700 pointer-events-auto z-[100] ${isConfigured ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
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
               <p className="text-center text-[var(--text-secondary)] text-xs mt-4 animate-pulse uppercase tracking-widest font-bold">All Systems Ready</p>
          </div>
      </div>

      <div className={titleClass}>
            <h1 className={`text-3xl md:text-4xl font-black text-[var(--text-primary)] tracking-tighter drop-shadow-2xl flex items-center gap-2 mb-4 transition-opacity duration-300 ${hasEntered ? 'opacity-0 hidden' : 'opacity-100'}`}>
                <span className="text-[var(--color-primary)]">Smart</span> Crafting Manager
            </h1>
            
            <div className={`flex bg-black/40 backdrop-blur-md rounded-full p-1 border border-white/10 transition-all duration-500 delay-200 pointer-events-auto ${hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <button 
                  onClick={() => setView('calculator')}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'calculator' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                  재료 계산기
                </button>
                <button 
                  onClick={() => setView('history')}
                  className={`px-5 py-1.5 rounded-full text-xs font-bold transition-all ${view === 'history' ? 'bg-[var(--text-primary)] text-[var(--bg-main)] shadow-lg scale-105' : 'text-slate-400 hover:text-white'}`}
                >
                  제작 기록
                </button>
            </div>
      </div>

      <BonusSettings 
        costReduction={costReduction}
        setCostReduction={setCostReduction}
        greatSuccessChance={greatSuccessChance}
        setGreatSuccessChance={setGreatSuccessChance}
        ninavBlessing={ninavBlessing}
        setNinavBlessing={setNinavBlessing}
        timeReduction={timeReduction}
        setTimeReduction={setTimeReduction}
        className={bonusClass}
        forceExpanded={!hasEntered}
      />

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

      <div className={`max-w-5xl w-full relative transition-opacity duration-1000 pt-32 mx-auto ${isFullyReady ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none h-0 overflow-hidden'}`}>
        
        {view === 'calculator' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group h-full flex flex-col">
                <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary)]/5 to-[var(--color-secondary)]/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
                
                <header className="mb-4 relative z-10 shrink-0">
                    <div className="grid grid-cols-2 gap-1 p-1 bg-black/40 rounded-xl border border-white/5 shadow-inner">
                        <button 
                            onClick={() => setActiveTab('abidos')}
                            className={`py-3 rounded-lg text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${activeTab === 'abidos' ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[var(--color-primary)]/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <span>아비도스</span>
                            {prices.fusion > 0 && <span className="text-[10px] opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{prices.fusion} 골드</span>}
                        </button>
                        <button 
                            onClick={() => setActiveTab('superior')}
                            className={`py-3 rounded-lg text-sm font-bold transition-all duration-300 flex flex-col items-center justify-center gap-1 ${activeTab === 'superior' ? 'bg-[var(--color-secondary)] text-white shadow-lg shadow-[var(--color-secondary)]/20 scale-[1.02]' : 'text-slate-400 hover:text-slate-300 hover:bg-white/5'}`}
                        >
                            <span>상급 아비도스</span>
                            {prices.superiorFusion > 0 && <span className="text-[10px] opacity-90 bg-black/20 px-2 py-0.5 rounded-full">{prices.superiorFusion} 골드</span>}
                        </button>
                    </div>
                </header>

                <div className="flex-1 flex flex-col justify-center min-h-0 relative z-10">
                    <MaterialInputs 
                        targetSlots={targetSlots}
                        setTargetSlots={(val) => !isNaN(val) && setTargetSlots(val)}
                        ownedRare={ownedRare}
                        setOwnedRare={(val) => !isNaN(val) && setOwnedRare(val)}
                        ownedUncommon={ownedUncommon}
                        setOwnedUncommon={(val) => !isNaN(val) && setOwnedUncommon(val)}
                        ownedCommon={ownedCommon}
                        setOwnedCommon={(val) => !isNaN(val) && setOwnedCommon(val)}
                        prices={prices}
                        bundleCounts={bundleCounts}
                        maxSlots={ninavBlessing ? 40 : 30}
                    />
                </div>

                <div className="pt-6 border-t border-white/5 mt-auto relative z-10 shrink-0">
                    <button 
                        onClick={() => openPip(activeTab, setActiveTab)} 
                        className="w-full py-4 bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] hover:brightness-110 text-white rounded-xl font-bold transition-all shadow-xl shadow-[var(--color-primary)]/20 active:scale-[0.98] flex items-center justify-center gap-2 group/btn text-lg"
                    >
                        <span>오버레이 실행</span>
                        <svg className="w-5 h-5 opacity-70 group-hover/btn:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 00-2 2h10a2 2 0 00-2-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                    </button>
                    
                    {profitStats && (
                        <div className="mt-10">
                            <ProfitDisplay profitStats={profitStats} />
                        </div>
                    )}
                </div>
            </section>

            <div className="flex flex-col gap-6 h-full">
                {/* Timer Display - Always Visible */}
                <div className="flex flex-col gap-3 flex-1 min-h-0">
                    <CraftingCard 
                  type={craftingState.type}
                  isActive={craftingState.isActive}
                  startTime={craftingState.startTime}
                  endTime={craftingState.endTime}
                  batchDuration={craftingState.batchDuration}
                  concurrency={craftingState.concurrency}
                  totalSlots={craftingState.totalSlots}
                  onCancel={cancelCrafting}
                  hourlySellingProfit={Math.floor((craftingState.isActive || craftingState.endTime) ? (craftingState.hourlySellingProfitSnapshot || 0) : (profitStats?.hourlySellingProfit || 0))}
                  hourlyUsageProfit={Math.floor((craftingState.isActive || craftingState.endTime) ? (craftingState.hourlyUsageProfitSnapshot || 0) : (profitStats?.hourlyUsageProfit || 0))}
                  hourlyCostSnapshot={(craftingState.isActive || craftingState.endTime) ? craftingState.hourlyCostSnapshot : profitStats?.hourlyCost}
                  hourlySellingRevenuePerItemSnapshot={(craftingState.isActive || craftingState.endTime) ? craftingState.hourlySellingRevenuePerItemSnapshot : profitStats?.hourlySellingRevenuePerItem}
                  hourlyUsageRevenuePerItemSnapshot={(craftingState.isActive || craftingState.endTime) ? craftingState.hourlyUsageRevenuePerItemSnapshot : profitStats?.hourlyUsageRevenuePerItem}
                  expectedOutput={profitStats?.outputQty || 0}
                  onRecordResult={(count) => handleRecordResult(count, prices, bundleCounts)}
                  // Pass current prices for real-time calc
                  currentPrices={prices}
                  currentBundleCounts={bundleCounts}
                  timeCoef={craftingState.timeCoef}
                />
                </div>
            
                <PurchaseRequirements  
                    activeTab={activeTab}
                    results={results}
                    prices={prices}
                />
            </div>
          </div>
        ) : (
          <HistoryView 
            history={history} 
            onDelete={deleteHistory} 
            onClear={clearHistory}
            onUpdateEntry={(id, count) => updateHistoryEntry(id, count)}
            currentPrices={prices}
            currentBundleCounts={bundleCounts}
          />
        )}
      </div>

      <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 delay-500 ${hasEntered ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <ThemeSelector />
      </div>

      {pipWindow && createPortal(
        <div className="hud-container">
             {/* HEADER: Tabs & Slots */}
             <div className="hud-header">
                <div className="tab-group">
                    <button 
                        className={`tab-btn ${activeTab === 'abidos' ? 'active' : ''}`}
                        onClick={() => setActiveTab('abidos')}
                    >
                        아비도스
                    </button>
                    <button 
                        className={`tab-btn ${activeTab === 'superior' ? 'active' : ''}`}
                        onClick={() => setActiveTab('superior')}
                    >
                        상급 아비도스
                    </button>
                </div>
                <div className="slot-control-row">
                    <span className="slot-desc">제작 목표 (슬롯 수)</span>
                    <div className="slot-input-wrapper">
                        <input 
                            type="number" 
                            className="slot-input"
                            value={targetSlots}
                            onChange={(e) => setTargetSlots(Number(e.target.value))}
                            onFocus={(e) => handleFocus('targetSlots', Number(e.target.value))}
                            onBlur={() => {
                                const maxSlots = ninavBlessing ? 40 : 30;
                                if (isNaN(targetSlots) || targetSlots < 1) {
                                    showToast("제작 목표 슬롯은 1 이상이어야 합니다.");
                                    setTargetSlots(prevValues.current.targetSlots);
                                    return;
                                }
                                if (targetSlots > maxSlots) {
                                    showToast(`최대 ${maxSlots}슬롯까지만 설정 가능합니다.`);
                                    setTargetSlots(prevValues.current.targetSlots);
                                    return;
                                }
                                if (!Number.isInteger(targetSlots)) {
                                    setTargetSlots(Math.floor(targetSlots));
                                }
                                // If valid, update ref for next time (optional, but focus handles it)
                            }}
                            min="1"
                        />
                        <span className="slot-unit">SLOTS</span>
                    </div>
                </div>
             </div>

             {/* DATA GRID: Materials */}
             <div className="data-grid">
                {/* RARE */}
                <div className="material-row rare">
                    <div className="mat-info">
                        <div className="mat-name">희귀</div>
                        <span className="mat-price">{prices.rare.toLocaleString()} 골드</span>
                    </div>
                    <div className="mat-input-wrapper">
                        <input 
                            type="number" 
                            className="mat-input"
                            value={ownedRare || ''}
                            placeholder="0"
                            onChange={(e) => setOwnedRare(Number(e.target.value))}
                            onFocus={(e) => handleFocus('ownedRare', Number(e.target.value))}
                            onBlur={() => {
                                if (isNaN(ownedRare) || ownedRare < 0) {
                                    showToast("보유량은 0 이상의 정수여야 합니다.");
                                    setOwnedRare(prevValues.current.ownedRare);
                                    return;
                                }
                                if (!Number.isInteger(ownedRare)) {
                                    showToast("보유량은 정수여야 합니다.");
                                    setOwnedRare(prevValues.current.ownedRare);
                                    return;
                                }
                            }}
                        />
                    </div>
                    <div className="mat-status">
                        {results.rare.buyCount > 0 ? (
                            <>
                                <span className="status-bundle">{results.rare.buyCount} 회</span>
                                <span className="status-detail">({results.rare.cost.toLocaleString()} 골드)</span>
                            </>
                        ) : (
                            <span className="status-ok">OK</span>
                        )}
                    </div>
                </div>

                {/* UNCOMMON */}
                <div className="material-row uncommon">
                    <div className="mat-info">
                        <div className="mat-name">고급</div>
                        <span className="mat-price">{prices.uncommon.toLocaleString()} 골드</span>
                    </div>
                    <div className="mat-input-wrapper">
                        <input 
                            type="number" 
                            className="mat-input"
                            value={ownedUncommon || ''}
                            placeholder="0"
                            onChange={(e) => setOwnedUncommon(Number(e.target.value))}
                            onFocus={(e) => handleFocus('ownedUncommon', Number(e.target.value))}
                            onBlur={() => {
                                if (isNaN(ownedUncommon) || ownedUncommon < 0) {
                                    showToast("보유량은 0 이상의 정수여야 합니다.");
                                    setOwnedUncommon(prevValues.current.ownedUncommon);
                                    return;
                                }
                                if (!Number.isInteger(ownedUncommon)) {
                                    showToast("보유량은 정수여야 합니다.");
                                    setOwnedUncommon(prevValues.current.ownedUncommon);
                                    return;
                                }
                            }}
                        />
                    </div>
                    <div className="mat-status">
                        {results.uncommon.buyCount > 0 ? (
                            <>
                                <span className="status-bundle">{results.uncommon.buyCount} 회</span>
                                <span className="status-detail">({results.uncommon.cost.toLocaleString()} 골드)</span>
                            </>
                        ) : (
                            <span className="status-ok">OK</span>
                        )}
                    </div>
                </div>

                {/* COMMON */}
                <div className="material-row common">
                    <div className="mat-info">
                        <div className="mat-name">일반</div>
                        <span className="mat-price">{prices.common.toLocaleString()} 골드</span>
                    </div>
                    <div className="mat-input-wrapper">
                        <input 
                            type="number" 
                            className="mat-input"
                            value={ownedCommon || ''}
                            placeholder="0"
                            onChange={(e) => setOwnedCommon(Number(e.target.value))}
                            onFocus={(e) => handleFocus('ownedCommon', Number(e.target.value))}
                            onBlur={() => {
                                if (isNaN(ownedCommon) || ownedCommon < 0) {
                                    showToast("보유량은 0 이상의 정수여야 합니다.");
                                    setOwnedCommon(prevValues.current.ownedCommon);
                                    return;
                                }
                                if (!Number.isInteger(ownedCommon)) {
                                    showToast("보유량은 정수여야 합니다.");
                                    setOwnedCommon(prevValues.current.ownedCommon);
                                    return;
                                }
                            }}
                        />
                    </div>
                    <div className="mat-status">
                        {results.common.buyCount > 0 ? (
                            <>
                                <span className="status-bundle">{results.common.buyCount} 회</span>
                                <span className="status-detail">({results.common.cost.toLocaleString()} 골드)</span>
                            </>
                        ) : (
                            <span className="status-ok">OK</span>
                        )}
                    </div>
                 </div>
             </div>

             {/* Toast Notification */}
             {toast && (
                 <div className="toast-popup">
                     <div className={`toast-content ${toast.type}`}>
                         {toast.type === 'error' && (
                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
                         )}
                         <span className="toast-message">{toast.message}</span>
                     </div>
                 </div>
             )}

             {/* METRICS BAR */}
             {profitStats && (
                <div className="metrics-bar">
                    {/* Missing Cost Alert */}
                    {results.totalMissingCost > 0 && (
                        <div className="missing-row">
                            <span>부족 비용</span>
                            <span>-{results.totalMissingCost.toLocaleString()} 골드</span>
                        </div>
                    )}

                    {/* Detailed Profit Cards */}
                    <div className="dash-profit-container">
                        {/* Selling Profit */}
                        <div className="dash-profit-card selling">
                            <span className="dash-label" style={{color: 'var(--color-success)'}}>판매 순이익</span>
                            <span className={`dash-val ${profitStats.sellingProfit >= 0 ? 'green' : 'red'}`}>
                                {profitStats.sellingProfit >= 0 ? '+' : ''}{Math.floor(profitStats.sellingProfit).toLocaleString()} <span style={{fontSize: '12px', opacity: 0.7}}>골드</span>
                            </span>
                            <div className="dash-profit-split">
                                <span className="dash-label" style={{color: 'var(--color-success)', opacity: 0.8, fontSize: '10px'}}>시간당 판매</span>
                                <span className={`dash-val ${profitStats.sellingProfit >= 0 ? 'green' : 'red'}`} style={{whiteSpace: 'nowrap'}}>
                                    <span style={{fontSize: '10px', opacity: 0.7, marginRight: '2px'}}>시간당</span>{Math.floor(profitStats.hourlySellingProfit).toLocaleString()} <span style={{fontSize: '12px', opacity: 0.7}}>골드</span>
                                </span>
                            </div>
                        </div>
                        
                        {/* Usage Profit */}
                        <div className="dash-profit-card usage">
                            <span className="dash-label" style={{color: 'var(--color-primary)'}}>사용 이득</span>
                            <span className={`dash-val ${profitStats.usageProfit >= 0 ? 'blue' : 'red'}`}>
                                {profitStats.usageProfit >= 0 ? '+' : ''}{Math.floor(profitStats.usageProfit).toLocaleString()} <span style={{fontSize: '12px', opacity: 0.7}}>골드</span>
                            </span>
                             <div className="dash-profit-split">
                                <span className="dash-label" style={{color: 'var(--color-primary)', opacity: 0.8, fontSize: '10px'}}>시간당 사용</span>
                                <span className={`dash-val ${profitStats.usageProfit >= 0 ? 'blue' : 'red'}`} style={{whiteSpace: 'nowrap'}}>
                                    <span style={{fontSize: '10px', opacity: 0.7, marginRight: '2px'}}>시간당</span>{Math.floor(profitStats.hourlyUsageProfit).toLocaleString()} <span style={{fontSize: '12px', opacity: 0.7}}>골드</span>
                                </span>
                            </div>
                        </div>
                    </div>

                    <div style={{marginTop: '8px'}}>
                        <button className="hud-btn" onClick={handleUpdate}>
                            <span>제작 시작</span>
                            <span className="hud-btn-sub">(보유량 업데이트)</span>
                        </button>
                    </div>
                </div>
             )}
        </div>,
        pipWindow.document.body
      )}
    </>
  );
}

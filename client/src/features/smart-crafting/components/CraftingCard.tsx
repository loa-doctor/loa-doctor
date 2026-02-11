import React, { useState, useEffect } from 'react';
import { MarketPrices, BundleCounts } from '../hooks/useMarketPrices';

interface CraftingCardProps {
  type: 'abidos' | 'superior';
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  batchDuration: number | null;
  concurrency: number;
  totalSlots: number;
  onCancel?: () => void;
  hourlySellingProfit?: number;
  hourlyUsageProfit?: number;
  hourlyCostSnapshot?: number;
  hourlySellingRevenuePerItemSnapshot?: number;
  hourlyUsageRevenuePerItemSnapshot?: number;
  onRecordResult?: (count: number) => void;
  expectedOutput?: number;
  currentPrices?: MarketPrices;
  currentBundleCounts?: BundleCounts;
  timeCoef?: number;
}

import { calculateProfit } from '../utils/profitCalculator';

export default function CraftingCard({ 
  type, 
  isActive, 
  startTime, 
  endTime, 
  batchDuration,
  concurrency,
  totalSlots,
  onCancel,
  hourlySellingProfit,
  hourlyUsageProfit,
  hourlyCostSnapshot,
  hourlySellingRevenuePerItemSnapshot,
  hourlyUsageRevenuePerItemSnapshot,
  onRecordResult,
  expectedOutput,
  currentPrices,
  currentBundleCounts,
  timeCoef
}: CraftingCardProps) {
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [producedItems, setProducedItems] = useState<number>(0);
  const [batchProgress, setBatchProgress] = useState<number>(0);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [actualOutput, setActualOutput] = useState<string>('');

  const totalTargetItems = totalSlots * 10;
  const itemsPerBatch = concurrency * 10;
  const itemName = type === 'abidos' ? '아비도스 융화 재료' : '상급 아비도스 융화 재료';

  const isComplete = !isActive && endTime !== null && Date.now() >= endTime;

  // Dynamic Profit Calculation
  const displayedSellingProfit = React.useMemo(() => {
    return calculateProfit(
        isComplete, 
        actualOutput, 
        hourlySellingRevenuePerItemSnapshot, 
        hourlyCostSnapshot, 
        hourlySellingProfit,
        currentPrices,
        currentBundleCounts,
        timeCoef,
        type,
        expectedOutput,
        false // isUsage
    );
  }, [isComplete, actualOutput, hourlySellingRevenuePerItemSnapshot, hourlyCostSnapshot, hourlySellingProfit, currentPrices, currentBundleCounts, timeCoef, type, expectedOutput]);

  const displayedUsageProfit = React.useMemo(() => {
    return calculateProfit(
        isComplete, 
        actualOutput, 
        hourlyUsageRevenuePerItemSnapshot, 
        hourlyCostSnapshot, 
        hourlyUsageProfit,
        currentPrices,
        currentBundleCounts,
        timeCoef,
        type,
        expectedOutput,
        true // isUsage
    );
  }, [isComplete, actualOutput, hourlyUsageRevenuePerItemSnapshot, hourlyCostSnapshot, hourlyUsageProfit, currentPrices, currentBundleCounts, timeCoef, type, expectedOutput]);

  useEffect(() => {
    if (isComplete && !actualOutput) {
       // Default to basic output (without great success prob)
       setActualOutput(totalTargetItems.toString());
    }
  }, [isComplete, totalTargetItems]);

  useEffect(() => {
    if (!startTime || !endTime || !batchDuration) {
       setTimeLeft('');
       setProducedItems(0);
       setBatchProgress(0);
       return;
    }

    const updateTimer = () => {
      const now = Date.now();
      const diff = endTime - now;

      if (diff <= 0) {
        setTimeLeft('00:00:00');
        setProducedItems(totalTargetItems);
        setBatchProgress(100);
        setProgressPercent(100);
        return;
      }
      
      // If not active and not complete, we shouldn't be here (cancelled?)
      if (!isActive) return;

      // Time Display
      const h = Math.floor(diff / (1000 * 60 * 60));
      const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const s = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);

      // Batch Logic
      const elapsed = now - startTime;
      const completedBatches = Math.floor(elapsed / batchDuration);
      const currentBatchElapsed = elapsed % batchDuration;
      
      // Calculate Produced Items
      const currentProduced = Math.min(totalTargetItems, itemsPerBatch * completedBatches);
      setProducedItems(currentProduced);

      // Batch Progress (0-100% relative to 10 batches)
      if (currentProduced >= totalTargetItems) {
          setBatchProgress(100);
      } else {
          const currentBatchIndex = completedBatches % 10;
          const currentBatchPercent = (currentBatchElapsed / batchDuration) * 100;
          setBatchProgress((currentBatchIndex * 10) + (currentBatchPercent / 10));
      }

      // Time-based Total Progress
      if (startTime && endTime) {
        const totalDuration = endTime - startTime;
        const currentElapsed = now - startTime;
        const p = Math.floor((currentElapsed / totalDuration) * 100);
        setProgressPercent(Math.min(100, Math.max(0, p)));
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 100); // Faster update for smooth batch progress
    return () => clearInterval(interval);
  }, [isActive, startTime, endTime, batchDuration, totalTargetItems, itemsPerBatch]);


  const currentSlots = Math.floor(producedItems / 10);
  
  const formatKoreanTime = (ts: number | null) => {
    if (!ts) return '-';
    const d = new Date(ts);
    const h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? '오후' : '오전';
    const dh = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${ampm} ${dh}시 ${m}분`;
  };
  const eta = endTime ? formatKoreanTime(endTime) : '-';

  return (
    <div 
      className={`w-full h-full flex flex-col relative overflow-hidden rounded-2xl border transition-all duration-300 ${isActive ? 'bg-[var(--bg-panel)] border-[var(--color-primary)]/30 shadow-lg shadow-[var(--color-primary)]/10' : isComplete ? 'bg-[var(--bg-panel)] border-[var(--color-success)]/30 shadow-lg shadow-[var(--color-success)]/10' : 'bg-[var(--bg-panel)]/60 border-white/5 hover:border-[var(--color-primary)]/20'}`}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03]" />
      
      {/* Top Glow (Active or Complete) */}
      {(isActive || isComplete) && (
        <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${isComplete ? 'via-[var(--color-success)]' : 'via-[var(--color-primary)]'} to-transparent opacity-50`} />
      )}
      
      <div className="p-8 flex-1 flex flex-col gap-8 relative z-10 min-h-0 justify-between">
          
          {/* Header Info */}
          <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${isActive ? 'bg-[var(--color-primary)] animate-pulse' : isComplete ? 'bg-[var(--color-success)]' : 'bg-slate-500'}`} />
                <h3 className={`text-sm font-bold uppercase tracking-wider ${isComplete ? 'text-[var(--color-success)]' : 'text-slate-300'}`}>
                  {isActive ? '제작 중' : isComplete ? '제작 예약 완료' : '제작 대기'}
                </h3>
              </div>

              <button 
                  onClick={(e) => {
                      if (!isActive || !onCancel) return;
                      e.stopPropagation();
                      onCancel();
                  }}
                  disabled={!isActive || !onCancel}
                  className={`px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors ${
                      isActive && onCancel 
                      ? 'text-red-400 border-red-500/30 hover:bg-red-500/10 cursor-pointer' 
                      : 'text-transparent border-transparent cursor-default pointer-events-none'
                  }`}
              >
                  제작 취소
              </button>
          </div>

          {/* Progress & Stat Row */}
          <div className="flex flex-col gap-6 shrink-0">
              {/* Count & Percent */}
              <div className="flex items-baseline justify-between">
                  <div className="flex items-baseline gap-3">
                      <span className={`text-6xl font-black tracking-tight ${(isActive || isComplete) ? 'text-white' : 'text-slate-500'}`}>
                          {(isActive || isComplete) ? currentSlots.toLocaleString() : '-'}
                      </span>
                      <span className="text-base text-slate-400 font-bold">
                          / {(isActive || isComplete) ? totalSlots.toLocaleString() : '-'} 슬롯
                      </span>
                  </div>
                  {(isActive || isComplete) && (
                      <span className={`text-5xl font-black ${isComplete ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]'}`}>
                          {progressPercent}%
                      </span>
                  )}
              </div>

              {/* Timer & ETA Grid (Always rendered to maintain size) */}
              <div className={`grid grid-cols-2 gap-4 bg-black/20 rounded-xl p-5 border border-white/5 transition-all duration-300 ${(isActive || isComplete) ? 'opacity-100' : 'opacity-0 grayscale'}`}>
                  <div className="flex flex-col gap-2">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">남은 시간</span>
                      <span className={`text-2xl font-bold tracking-tight ${isComplete ? 'text-[var(--color-success)]' : 'text-white'}`}>
                          {timeLeft || '00:00:00'}
                      </span>
                  </div>
                  <div className="flex flex-col gap-2 border-l border-white/5 pl-5">
                      <span className="text-[11px] uppercase tracking-wider text-slate-400 font-bold">예상 종료</span>
                      <span className="text-xl font-bold tracking-tight text-slate-300">
                          {eta}
                      </span>
                  </div>
              </div>

              {/* Hourly Profit (Overlay Only) */}
              {(hourlySellingProfit !== undefined || hourlyUsageProfit !== undefined) && (
                <div className="mt-2 pt-3 border-t border-white/5 flex gap-4">
                    {/* Selling Profit */}
                    <div className="flex-1 flex flex-col items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">시간당 수익</span>
                         <span className={`text-sm font-bold whitespace-nowrap ${(displayedSellingProfit || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            <span className="text-[10px] opacity-70 mr-0.5">시간당</span>{Math.floor(displayedSellingProfit || 0).toLocaleString()} <span className="text-[10px] opacity-70">골드</span>
                         </span>
                    </div>
                    {/* Vertical Divider */}
                    <div className="w-[1px] bg-white/10 my-1" />
                    {/* Usage Profit */}
                    <div className="flex-1 flex flex-col items-center">
                         <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">시간당 이득</span>
                         <span className={`text-sm font-bold whitespace-nowrap ${(displayedUsageProfit || 0) >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                            <span className="text-[10px] opacity-70 mr-0.5">시간당</span>{Math.floor(displayedUsageProfit || 0).toLocaleString()} <span className="text-[10px] opacity-70">골드</span>
                         </span>
                    </div>
                </div>
              )}


          </div>

          {/* Slots Visualization */}
          <div className="flex flex-col gap-4 min-h-0 overflow-y-auto pr-1 shrink-0 relative">
            {isComplete && onRecordResult && (
                 <div className="absolute inset-x-4 inset-y-auto top-1/2 -translate-y-1/2 bg-[var(--bg-panel)] rounded-2xl border border-[var(--color-primary)]/30 p-6 flex flex-col justify-center items-center gap-4 animate-in fade-in zoom-in-95 duration-500 delay-200 z-50 shadow-2xl shadow-black/80">
                       <div className="text-center">
                           <h4 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1">제작 종료</h4>
                           <div className="text-[10px] text-emerald-500/60 font-medium">실제 제작된 수량을 입력해주세요</div>
                       </div>
                       
                       <div className="flex gap-2 w-full max-w-[340px] items-stretch">
                           {/* Decrease */}
                           <button 
                                onClick={() => {
                                    const val = Number(actualOutput) || 0;
                                    if (val <= totalTargetItems) return;
                                    setActualOutput(Math.max(totalTargetItems, val - 10).toString());
                                }}
                                disabled={Number(actualOutput) <= totalTargetItems}
                                className={`px-3 border transition-colors flex items-center justify-center rounded-lg ${Number(actualOutput) <= totalTargetItems ? 'bg-black/10 border-white/5 text-slate-600 cursor-not-allowed' : 'bg-black/20 hover:bg-emerald-500/10 border-emerald-500/30 text-emerald-400 active:scale-95'}`}
                           >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/></svg>
                           </button>

                           <div className="relative flex-1 min-w-[80px]">
                               <input 
                                  type="number" 
                                  value={actualOutput}
                                  onChange={(e) => setActualOutput(e.target.value)}
                                  className="w-full bg-black/20 border border-emerald-500/30 rounded-lg px-2 py-3 text-white font-bold text-xl outline-none focus:border-emerald-500 focus:z-10 transition-colors text-center h-full"
                                  autoFocus
                               />
                           </div>

                           {/* Increase */}
                           <button 
                                onClick={() => {
                                    const val = Number(actualOutput) || 0;
                                    setActualOutput((val + 10).toString());
                                }}
                                className="px-3 bg-black/20 hover:bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400 transition-colors flex items-center justify-center active:scale-95"
                           >
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
                           </button>
                           
                           {/* Submit */}
                           <button 
                              onClick={() => {
                                  if (!actualOutput) return;
                                  const val = Number(actualOutput);
                                  
                                  if (val < totalTargetItems) {
                                      alert(`실제 제작 수량은 목표 수량(${totalTargetItems}개)보다 적을 수 없습니다.`);
                                      setActualOutput('');
                                      return;
                                  }
                                  if (val % 10 !== 0) {
                                      alert("실제 제작 수량은 10개 단위여야 합니다.");
                                      setActualOutput('');
                                      return;
                                  }

                                  onRecordResult(val);
                              }}
                              className="px-5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-lg transition-all shadow-lg shadow-emerald-500/20 whitespace-nowrap active:scale-95"
                           >
                               기록
                           </button>
                       </div>
                       <p className="text-[10px] text-emerald-400/40 font-medium text-center max-w-[200px] leading-relaxed">
                           * 기록 시 수익이 확정되며<br/>히스토리 탭에 저장됩니다.
                       </p>
                  </div>
            )}
            <div className={`flex flex-col gap-4 w-full transition-opacity duration-200 ease-out ${isComplete && onRecordResult ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                {Array.from({ length: concurrency }).map((_, i) => {
                // Calculate total cycles for THIS specific row (thread)
                const baseCycles = Math.floor(totalSlots / concurrency);
                const remainder = totalSlots % concurrency;
                const myTotalCycles = baseCycles + (remainder > 0 && i < remainder ? 1 : 0);
                
                // If this row has no work at all (e.g. slots < concurrency), it's inactive
                const isRowRelevant = myTotalCycles > 0;

                const currentElapsed = (isActive && startTime) 
                    ? Date.now() - startTime 
                    : (isComplete && startTime && endTime) 
                        ? endTime - startTime 
                        : 0;
                
                // Global cycles done
                const globalCyclesDone = Math.floor(currentElapsed / (batchDuration || 1));
                
                const isRowComplete = isComplete || (isActive && globalCyclesDone >= myTotalCycles);
                const isRowActive = isActive && globalCyclesDone < myTotalCycles;
                
                const myCurrentCycle = Math.min(myTotalCycles, globalCyclesDone + 1);

                return (
                <div 
                    key={i} 
                    className={`w-full aspect-[10/1] rounded-lg border relative overflow-hidden transition-all duration-500 ${
                        isRowRelevant
                            ? (isRowActive || isRowComplete)
                                ? `bg-black/20 ${isRowComplete ? 'border-[var(--color-success)]/30 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]' : 'border-[var(--color-primary)]/30 shadow-[inset_0_0_10px_rgba(59,130,246,0.1)]'}` 
                                : 'bg-white/5 border-white/5 opacity-30'
                            : 'bg-transparent border-white/5 opacity-10 grayscale'
                    }`}
                >
                    {/* 10-Unit Segments with Progress */}
                    {isRowRelevant && (
                        <div className="absolute inset-0 flex z-10">
                            {Array.from({ length: 10 }).map((_, idx) => {
                                const completionPage = Math.floor((isRowComplete ? Math.max(0, myTotalCycles - 1) : globalCyclesDone) / 10);
                                const absoluteBatchIdx = idx + (completionPage * 10);
                                
                                const isPast = absoluteBatchIdx < globalCyclesDone;
                                const isCurrent = !isRowComplete && absoluteBatchIdx === globalCyclesDone;
                                const isValid = absoluteBatchIdx < myTotalCycles;

                                if (!isValid) {
                                    return (
                                        <div key={idx} className="flex-1 relative border-r border-white/5 last:border-0 bg-transparent" />
                                    );
                                }
                                
                                const isDone = isRowComplete || isPast;

                                const currentPercent = isCurrent 
                                    ? ((currentElapsed % (batchDuration || 1)) / (batchDuration || 1)) * 100
                                    : 0;

                                return (
                                    <div key={idx} className="flex-1 relative border-r border-white/5 last:border-0">
                                        {/* Completed Segment (Green) */}
                                        {isDone && (
                                            <div className="absolute inset-0 bg-[var(--color-success)]/40 transition-all duration-300" />
                                        )}
                                        
                                        {/* Current Active Segment (Blue Filling) */}
                                        {isCurrent && (
                                            <>
                                                <div 
                                                    className="absolute top-0 bottom-0 left-0 bg-[var(--color-primary)]/40 transition-all duration-100 ease-linear"
                                                    style={{ width: `${currentPercent}%` }}
                                                />
                                                {/* Active Line */}
                                                <div 
                                                    className="absolute top-0 bottom-0 w-[2px] bg-[var(--color-primary)] z-20 transition-all duration-100 ease-linear"
                                                    style={{ left: `${currentPercent}%` }}
                                                />
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Slot Label Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center z-40 pointer-events-none">
                        <span className={`text-[10px] font-bold tracking-widest ${isRowComplete ? 'text-[var(--color-success)]/80' : isRowActive ? 'text-[var(--color-primary)]/80' : 'text-slate-600'}`}>
                            슬롯 {i+1} {isRowRelevant && (isRowActive || isRowComplete) && <span className="text-[10px] opacity-70 ml-1">({Math.min(myTotalCycles, globalCyclesDone)}/{myTotalCycles})</span>}
                            {!isRowRelevant && <span className="text-[10px] opacity-50 ml-1">(빈 슬롯)</span>}
                        </span>
                    </div>
                </div>
            ); })}
            </div>
          </div>

      </div>

      {/* Progress Bar (Bottom) */}
      {isActive && (
          <div className="absolute bottom-0 left-0 h-1 bg-black/40 w-full">
              <div 
                className="h-full bg-[var(--color-primary)] shadow-[0_0_10px_rgba(59,130,246,0.8)] transition-all duration-300 ease-linear"
                style={{ width: `${(producedItems / totalTargetItems) * 100}%` }}
              />
          </div>
      )}
    </div>
  );
}

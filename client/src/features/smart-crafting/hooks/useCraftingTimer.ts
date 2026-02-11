import { useState, useEffect, useCallback } from 'react';
import { MaterialType, BASE_DURATIONS } from '../constants/gameData';

export interface CraftingState {
  isActive: boolean;
  startTime: number | null;
  endTime: number | null;
  batchDuration: number | null;
  type: MaterialType;
  concurrency: number;
  totalSlots: number;
  hourlySellingProfitSnapshot?: number;
  hourlyUsageProfitSnapshot?: number;
  hourlyCostSnapshot?: number;
  hourlySellingRevenuePerItemSnapshot?: number;
  hourlyUsageRevenuePerItemSnapshot?: number;
  timeCoef?: number;
}

const DEFAULT_STATE: CraftingState = {
  isActive: false,
  startTime: null,
  endTime: null,
  batchDuration: null,
  type: 'superior',
  concurrency: 3,
  totalSlots: 0
};

export function useCraftingTimer(addLog: (msg: string) => void) {
  const [craftingState, setCraftingState] = useState<CraftingState>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('craftingState');
      if (saved) {
        try {
            return JSON.parse(saved);
        } catch (e) { console.error('Failed to parse craftingState', e); }
      }
    }
    return DEFAULT_STATE;
  });

  useEffect(() => {
    localStorage.setItem('craftingState', JSON.stringify(craftingState));
  }, [craftingState]);

  // Timer Logic
  useEffect(() => {
    if (!craftingState.isActive || !craftingState.endTime) return;

    const checkTimer = setInterval(() => {
      const now = Date.now();
      const diff = craftingState.endTime! - now;

      if (diff <= 0) {
        // Complete
        setCraftingState(prev => ({ ...prev, isActive: false })); // Keep endTime to show completion status
        
        // Browser Notification
        if (Notification.permission === 'granted') {
          new Notification("제작 완료!", {
            body: `${craftingState.type === 'abidos' ? '아비도스' : '상급 아비도스'} 융화 재료 제작이 완료되었습니다.`,
            icon: '/icon.png' // Optional
          });
        }
        
        clearInterval(checkTimer);
      }
    }, 1000);

    return () => clearInterval(checkTimer);
  }, [craftingState]);

  // Request Notification Permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  const startCrafting = useCallback((
      activeTab: MaterialType, 
      targetSlots: number, 
      ninavBlessing: boolean, 
      timeReduction: number | null,
      hourlySellingProfit: number,
      hourlyUsageProfit: number,
      hourlyCost: number,
      hourlyUsageRevenuePerItem: number,
      hourlySellingRevenuePerItem: number,
      timeCoef: number
  ) => {
    const isNinav = ninavBlessing;
    const concurrency = isNinav ? 4 : 3;
    const slots = Math.max(1, targetSlots);
    
    // Cycles calculation
    const cycles = Math.ceil(slots / concurrency);

    // Base Time
    // Abidos: 60m (3600s), Superior: 75m (4500s)
    const baseTimeSec = BASE_DURATIONS[activeTab];
    
    // Reduction
    const totalReduction = (timeReduction || 0) + (isNinav ? 10 : 0);
    const multiplier = Math.max(0, 1 - (totalReduction / 100)); // Prevent negative time
    
    // Batch Time (Time for 1 cycle)
    const singleBatchTime = baseTimeSec * multiplier;
    const batchDuration = singleBatchTime * 1000;
    
    // Total Time
    const totalTimeSec = cycles * singleBatchTime;

    const now = Date.now();
    const endTime = now + (totalTimeSec * 1000);

    setCraftingState({
      isActive: true,
      startTime: now,
      endTime,
      batchDuration,
      type: activeTab,
      concurrency,
      totalSlots: slots,
      hourlySellingProfitSnapshot: hourlySellingProfit,
      hourlyUsageProfitSnapshot: hourlyUsageProfit,
      hourlyCostSnapshot: hourlyCost,
      hourlySellingRevenuePerItemSnapshot: hourlySellingRevenuePerItem,
      hourlyUsageRevenuePerItemSnapshot: hourlyUsageRevenuePerItem,
      timeCoef
    });
    
    // Also notify valid start
    addLog(`[타이머] ${activeTab === 'abidos' ? '아비도스' : '상급'} 제작 시작 (${cycles}회 반복, 총 ${Math.floor(totalTimeSec/60)}분)`);
  }, [addLog]);

  const cancelCrafting = useCallback(() => {
    if (confirm('제작을 취소하시겠습니까?')) {
        setCraftingState(prev => ({ ...prev, isActive: false, endTime: null }));
        addLog('[타이머] 제작 취소됨');
    }
  }, [addLog]);

  return {
      craftingState,
      startCrafting,
      cancelCrafting,
      setCraftingState // Exported if needed for direct manipulation, but prefer specific actions
  };
}

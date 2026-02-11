import { useState, useCallback, useEffect } from 'react';
import { CraftingEntry, COSTS, MaterialType, BASE_DURATIONS } from '../constants/gameData';
import { MarketPrices, BundleCounts } from './useMarketPrices';

interface UseCraftingHistoryProps {
    prices: MarketPrices;
    bundleCounts: BundleCounts;
    activeTab: MaterialType;
    targetSlots: number;
    costReduction: number | null;
    greatSuccessChance: number | null;
    addLog: (msg: string) => void;
}



export function useCraftingHistory(initialHistory: CraftingEntry[] = []) {
    const [history, setHistory] = useState<CraftingEntry[]>(initialHistory);

    // One-time migration for corrupted duration data (test mode artifacts)
    useEffect(() => {
        if (history.length === 0) return;

        const needsFix = history.some(entry => entry.duration && entry.duration < 100);
        if (!needsFix) return;

        setHistory(prev => prev.map(entry => {
            if (entry.duration && entry.duration < 100) {
                 // The old test code was: baseTimeSec = (abidos? 1 : 2)
                 // Stored Duration = Rounds * TestBase * Multiplier
                 // True Duration = Rounds * RealBase * Multiplier
                 // Ratio = RealBase / TestBase
                 
                 const ratio = entry.type === 'abidos' ? 3600 : 2250; // 3600/1 or 4500/2
                 const correctedDuration = entry.duration * ratio;
                 
                 return { ...entry, duration: correctedDuration };
            }
            return entry;
        }));
    }, [history]);

    const saveHistory = useCallback((
        activeTab: MaterialType,
        targetSlots: number,
        prices: MarketPrices,
        bundleCounts: BundleCounts,
        costReduction: number | null,
        greatSuccessChance: number | null,
        addLog: (msg: string) => void,
        duration: number 
    ) => {
        // Calculate Unit Cost based on Standard Recipe
        const currentRecipe = COSTS[activeTab];
        const slots = targetSlots;
        if (slots <= 0) return;
    
        // 1. Calculate Inputs
        const inputs = {
            rare: { count: 0, price: 0, total: 0 },
            uncommon: { count: 0, price: 0, total: 0 },
            common: { count: 0, price: 0, total: 0 },
            gold: 0
        };

        let matCostTotal = 0;
        (['rare', 'uncommon', 'common'] as const).forEach(key => {
           const needed = currentRecipe[key] * slots;
           const price = prices[key];
           const bundle = bundleCounts[key] || 1;
           const unitPrice = price / bundle;
           const total = needed * unitPrice;
           
           inputs[key] = { count: needed, price: unitPrice, total };
           matCostTotal += total;
        });
    
        // Gold Cost
        const baseGold = currentRecipe.gold * slots;
        const reductionMult = 1 - ((costReduction || 0) / 100);
        inputs.gold = baseGold * reductionMult;
    
        // Financial Consistency: Floor values to match in-game behavior and UI display
        const totalCostRaw = matCostTotal + inputs.gold;
        const totalCost = Math.floor(totalCostRaw);
    
        // 2. Calculate Outputs
        const baseProb = 0.05;
        const finalProb = baseProb * (1 + ((greatSuccessChance || 0) / 100));
        const outputPerSlot = 10 * (1 + finalProb);
        const expectedOutput = outputPerSlot * slots;
    
        // Market Context
        const fusionKey = activeTab === 'abidos' ? 'fusion' : 'superiorFusion';
        const outputPriceRaw = prices[fusionKey as keyof typeof prices] || 0;
        const outputBundle = bundleCounts[fusionKey as keyof typeof bundleCounts] || 1;
        const outputUnitPrice = outputBundle > 0 ? (outputPriceRaw / outputBundle) : 0;
        
        // 3. Financials
        // Revenue (Net after 5% tax) - Floored
        const expectedRevenueRaw = (expectedOutput * outputUnitPrice) * 0.95;
        const expectedRevenue = Math.floor(expectedRevenueRaw);

        // Profit - Derived from floored values for consistency (A - B = C)
        const expectedProfit = expectedRevenue - totalCost;
    
        const newEntry: CraftingEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          type: activeTab,
          
          inputs: inputs,
          outputs: {
              expectedCount: expectedOutput,
              marketPrice: outputUnitPrice
          },

          totalCost,
          expectedRevenue,
          expectedProfit,
          
          // Metadata
          duration: duration
        };
    
        setHistory(prev => [newEntry, ...prev]);
        addLog(`[기록] 상세 제작 기록 저장 완료 - 순이익: ${expectedProfit.toLocaleString()}G`);
      }, []);

    const deleteHistory = useCallback((id: string) => {
        setHistory(prev => prev.filter(entry => entry.id !== id));
    }, []);

    const clearHistory = useCallback(() => {
        if (confirm('정말 모든 기록을 삭제하시겠습니까?')) {
            setHistory([]);
        }
    }, []);

    const updateHistoryEntry = useCallback((id: string, actualCount: number) => {
        setHistory(prev => prev.map(entry => {
            if (entry.id !== id) return entry;
            
            const marketPrice = entry.outputs.marketPrice;
            const actualRevenue = Math.floor((actualCount * marketPrice) * 0.95);
            const actualProfit = actualRevenue - entry.totalCost;
            
            return { 
                ...entry, 
                outputs: { ...entry.outputs, actualCount },
                actualRevenue,
                actualProfit 
            };
        }));
    }, []);

    const handleRecordResult = useCallback((actualCount: number, _prices: MarketPrices, _bundleCounts: BundleCounts) => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const latest = prev[0];
            
            const marketPrice = latest.outputs.marketPrice;
            const actualRevenue = Math.floor((actualCount * marketPrice) * 0.95);
            const actualProfit = actualRevenue - latest.totalCost;
            
            const updated: CraftingEntry = { 
                ...latest, 
                outputs: { ...latest.outputs, actualCount },
                actualRevenue,
                actualProfit
            };
            return [updated, ...prev.slice(1)];
        });
        alert(`[기록 완료] 실제 결과 ${actualCount}개가 저장되었습니다.`);
    }, []);

    const updateLatestEntryDuration = useCallback((duration: number) => {
        setHistory(prev => {
            if (prev.length === 0) return prev;
            const updated = { ...prev[0], duration };
            return [updated, ...prev.slice(1)];
        });
    }, []);

    return {
        history,
        setHistory,
        saveHistory,
        deleteHistory,
        clearHistory,
        updateHistoryEntry,
        handleRecordResult,
        updateLatestEntryDuration
    };
}

import React from 'react';
import { LOGGING_MATERIALS } from '../constants/items';

interface CalculationResult {
  buyCount: number;
  needed: number;
  bundleSize: number;
}

interface Results {
  rare: CalculationResult;
  uncommon: CalculationResult;
  common: CalculationResult;
}

interface PurchaseRequirementsProps {
  activeTab: 'abidos' | 'superior';
  results: Results;
  prices: { rare: number, uncommon: number, common: number };
}

export default function PurchaseRequirements({
  activeTab,
  results,
  prices
}: PurchaseRequirementsProps) {

  const calculateCost = (key: 'rare' | 'uncommon' | 'common') => {
    const data = results[key];
    if (data.buyCount <= 0) return 0;
    const pricePerBundle = prices[key];
    return data.buyCount * pricePerBundle;
  };

  return (
    <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-white/5 rounded-[2rem] p-4 flex flex-col relative overflow-hidden shrink-0">
        <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center justify-center gap-2">
            구매 필요 횟수 ({activeTab === 'abidos' ? '아비도스' : '상급 아비도스'})
        </h2>
        <div className="grid grid-cols-3 gap-2">
            {[
            { key: 'rare', label: LOGGING_MATERIALS.rare.name, color: '#3b82f6', bg: 'bg-blue-500/10' },
            { key: 'uncommon', label: LOGGING_MATERIALS.uncommon.name, color: '#10b981', bg: 'bg-emerald-500/10' },
            { key: 'common', label: LOGGING_MATERIALS.common.name, color: '#f8fafc', bg: 'bg-slate-500/10' }
            ].map(({ key, label, color, bg }) => {
                const k = key as keyof Results;
                const data = results[k];
                const cost = calculateCost(k);
                const isCompleted = data.buyCount <= 0;

                return (
                <div key={key} className={`group flex flex-col items-center p-3 rounded-2xl transition-all duration-300 ${isCompleted ? 'bg-white/[0.02] border border-white/[0.02] opacity-50 hover:opacity-100' : `bg-black/20 border border-white/5 hover:border-white/10`}`}>
                    <div className="flex justify-center items-start mb-1">
                        <span className="text-xs font-bold tracking-tight truncate" style={{ color }}>{label}</span>
                    </div>
                    
                    <div className="flex items-baseline gap-1 mb-1">
                        <span className={`text-xl font-black tracking-tighter ${isCompleted ? 'text-slate-500' : 'text-white'}`}>
                            {data.buyCount}
                        </span>
                        <span className="text-xs font-bold text-slate-500 uppercase">
                            회 <span className="text-slate-600 font-medium ml-0.5 text-[10px]">({data.bundleSize.toLocaleString()})</span>
                        </span>
                    </div>

                    <div className={`mt-2 pt-2 border-t border-white/5 w-full flex flex-col items-center gap-0.5 ${cost > 0 ? 'opacity-100' : 'opacity-0'}`}>
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">예상 비용</span>
                        <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-amber-500/90">
                                {cost.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-amber-500/60">골드</span>
                        </div>
                    </div>
                </div>
                );
            })}
        </div>
    </section>
  );
}

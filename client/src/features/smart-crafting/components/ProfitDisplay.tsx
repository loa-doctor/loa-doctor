import React from 'react';

interface ProfitStats {
  grossRevenue: number;
  sellingRevenue: number;
  matCost: number;
  goldCost: number;
  totalCost: number;
  sellingProfit: number;
  usageProfit: number;
  outputQty: number;
  hourlySellingProfit: number;
  hourlyUsageProfit: number;
}

interface ProfitDisplayProps {
  profitStats: ProfitStats | null;
}

export default function ProfitDisplay({ profitStats }: ProfitDisplayProps) {
  if (!profitStats) return null;

  return (
    <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Selling Profit */}
        <div className={`p-3 rounded-2xl border transition-all duration-300 ${profitStats.sellingProfit >= 0 ? 'bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10' : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'}`}>
            <h4 className={`text-center text-xs font-bold mb-2 uppercase tracking-widest ${profitStats.sellingProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                판매 시 수익
                <span className="ml-2 bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded animate-pulse">실시간</span>
            </h4>
            
            <div className="bg-black/20 rounded-xl p-2.5 mb-2 space-y-1">
            <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-300/80 uppercase tracking-wider text-xs">매출</span>
                <span className="text-white tracking-wide">{Math.floor(profitStats.sellingRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-red-300/80 uppercase tracking-wider text-xs">제작비</span>
                <span className="text-red-200/90 tracking-wide">-{Math.floor(profitStats.totalCost).toLocaleString()}</span>
            </div>
            </div>

            <div className="flex flex-col items-center pt-1">
                <span className={`text-[10px] font-extrabold mb-0.5 uppercase tracking-[0.2em] ${profitStats.sellingProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    순이익
                </span>
                <span className={`text-2xl font-black tracking-tight ${profitStats.sellingProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {profitStats.sellingProfit >= 0 ? '+' : ''}{Math.floor(profitStats.sellingProfit).toLocaleString()} <span className="text-sm font-bold opacity-70">골드</span>
                </span>
            </div>

            {/* Hourly Profit */}
            <div className="mt-4 pt-3 border-t border-white/5 w-full flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">시간당 수익</span>
                <span className={`text-xl font-black tracking-tight whitespace-nowrap ${profitStats.sellingProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    <span className="text-xs font-bold opacity-70 mr-1">시간당</span>{Math.floor(profitStats.hourlySellingProfit).toLocaleString()} <span className="text-xs font-bold opacity-60">골드</span>
                </span>
            </div>
        </div>
        
        {/* Usage Profit */}
        <div className={`p-3 rounded-2xl border transition-all duration-300 ${profitStats.usageProfit >= 0 ? 'bg-sky-500/5 border-sky-500/20 hover:bg-sky-500/10' : 'bg-red-500/5 border-red-500/20 hover:bg-red-500/10'}`}>
            <h4 className={`text-center text-xs font-bold mb-2 uppercase tracking-widest ${profitStats.usageProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                본인 사용 이득
                <span className="ml-2 bg-red-500/20 text-red-400 text-[10px] px-1.5 py-0.5 rounded animate-pulse">실시간</span>
            </h4>
            
            <div className="bg-black/20 rounded-xl p-2.5 mb-2 space-y-1">
            <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-emerald-300/80 uppercase tracking-wider text-xs">매출</span>
                <span className="text-white tracking-wide">{Math.floor(profitStats.sellingRevenue).toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
                <span className="text-red-300/80 uppercase tracking-wider text-xs">제작비</span>
                <span className="text-red-200/90 tracking-wide">-{Math.floor(profitStats.totalCost).toLocaleString()}</span>
            </div>
            </div>

            <div className="flex flex-col items-center pt-1">
                <span className={`text-[10px] font-extrabold mb-0.5 uppercase tracking-[0.2em] ${profitStats.usageProfit >= 0 ? 'text-sky-600' : 'text-red-600'}`}>
                    절약
                </span>
                <span className={`text-2xl font-black tracking-tight ${profitStats.usageProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                    {profitStats.usageProfit >= 0 ? '+' : ''}{Math.floor(profitStats.usageProfit).toLocaleString()} <span className="text-sm font-bold opacity-50">골드</span>
                </span>
            </div>

            {/* Hourly Profit */}
            <div className="mt-4 pt-3 border-t border-white/5 w-full flex flex-col items-center">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">시간당 이득</span>
                <span className={`text-xl font-black tracking-tight whitespace-nowrap ${profitStats.usageProfit >= 0 ? 'text-sky-400' : 'text-red-400'}`}>
                    <span className="text-xs font-bold opacity-70 mr-1">시간당</span>{Math.floor(profitStats.hourlyUsageProfit).toLocaleString()} <span className="text-xs font-bold opacity-60">골드</span>
                </span>
            </div>
        </div>
    </div>
  );
}

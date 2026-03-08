import React, { useState, useMemo, useEffect } from 'react';
import { GEM_LEVELS, GemLevel, GemType } from '../constants/gemData';
import { GemPrices, calculateInventorySynthesis, InventoryState, getCheapestPrice } from '../utils/gemCalculator';

interface Props {
    targetLevel: GemLevel;
    targetType: GemType;
    prices: GemPrices;
    isPriceLoaded: boolean;
}

export default function InventoryCalculator({ targetLevel, targetType, prices, isPriceLoaded }: Props) {
    const [inventory, setInventory] = useState<InventoryState>({ gold: 0, gems: {} });
    const [isLoaded, setIsLoaded] = useState(false);

    // Load from local storage
    useEffect(() => {
        const saved = localStorage.getItem('gemCalcInventory');
        if (saved) {
            try {
                setInventory(JSON.parse(saved));
            } catch (e) {
                console.error('Failed to parse inventory data');
            }
        }
        setIsLoaded(true);
    }, []);

    // Save to local storage
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('gemCalcInventory', JSON.stringify(inventory));
        }
    }, [inventory, isLoaded]);

    const handleGoldChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
        setInventory(prev => ({ ...prev, gold: isNaN(val) ? 0 : val }));
    };

    const handleGemChange = (level: number, e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseInt(e.target.value.replace(/[^0-9]/g, ''), 10);
        setInventory(prev => ({
            ...prev,
            gems: {
                ...prev.gems,
                [level]: isNaN(val) ? 0 : val
            }
        }));
    };

    const result = useMemo(() => {
        if (!isPriceLoaded) return null;
        return calculateInventorySynthesis(targetLevel, targetType, inventory, prices);
    }, [targetLevel, targetType, inventory, prices, isPriceLoaded]);

    const getGemName = (type: GemType) => type === 'crimson' ? '겁화' : type === 'azure' ? '작열' : '종류 무관';
    const targetBaseUnits = Math.pow(3, targetLevel - 5);
    
    const isDirectPurchaseOptimal = result ? result.isMarketAvailable && result.directPurchase.remainingGold >= result.success.remainingGold : false;

    return (
        <section className="flex-1 bg-[var(--bg-panel)]/80 backdrop-blur-md border border-[var(--color-secondary)]/30 rounded-2xl p-5 shadow-xl relative overflow-hidden group lg:min-h-[720px] flex flex-col">
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-secondary)]/5 to-purple-600/5 opacity-50 pointer-events-none" />

            <div className="relative z-10 mb-5">
                <h2 className="text-xl font-black text-white flex items-center gap-2 mb-2">
                    <svg className="w-5 h-5 text-[var(--color-secondary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                    보유 자산 기반 목표 도달 계산기
                </h2>
                <p className="text-xs text-slate-300">
                    현재 보유 중인 골드와 <b>합성 재료로 사용할 보석(종류 무관)</b>을 입력하세요. 내 자산만으로 {targetLevel}레벨 {getGemName(targetType)} 보석을 도달할 수 있는지, 부족한 골드가 얼마인지 계산합니다.
                </p>
            </div>

            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Area */}
                <div className="space-y-4">
                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">보유 골드</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={inventory.gold === 0 ? '' : inventory.gold.toLocaleString()}
                                onChange={handleGoldChange}
                                placeholder="0"
                                className="w-full bg-black/50 border border-white/10 rounded-lg py-2 pl-3 pr-10 text-right text-amber-400 font-black text-lg focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] transition-all"
                            />
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-amber-500 pointer-events-none">G</span>
                        </div>
                    </div>

                    <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
                            보유 보석 (합성 재료)
                            <span className="font-normal normal-case text-slate-500 ml-2">※ 종류(겁화/작열) 관계 없음</span>
                        </label>
                        <div className="space-y-2">
                            {GEM_LEVELS.filter(l => l < targetLevel).map(level => (
                                <div key={level} className="flex items-center justify-between gap-3 bg-white/5 p-2 rounded-lg border border-white/5">
                                    <div className="flex items-center gap-2 w-20">
                                        <div className="w-6 h-6 rounded-full bg-slate-700 font-bold text-white text-xs flex items-center justify-center">Lv.{level}</div>
                                    </div>
                                    <div className="relative flex-1">
                                        <input
                                            type="text"
                                            value={inventory.gems[level] === 0 || !inventory.gems[level] ? '' : inventory.gems[level].toLocaleString()}
                                            onChange={(e) => handleGemChange(level, e)}
                                            placeholder="0"
                                            className="w-full bg-black/50 border border-white/10 roundedmd py-1 px-3 text-right text-slate-200 font-semibold text-sm focus:outline-none focus:border-slate-500 transition-all"
                                        />
                                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 pointer-events-none">개</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Result Area */}
                {result && (
                    <div className="flex flex-col gap-3">
                        {/* Progress */}
                        <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                            <div className="flex justify-between items-end mb-2">
                                <span className="text-xs text-slate-400 font-bold">인벤토리 합성 진척률</span>
                                <span className="text-sm font-black text-[var(--color-secondary)]">
                                    {Math.min(100, Math.floor(((targetBaseUnits - result.missingBaseUnits) / targetBaseUnits) * 100))}%
                                </span>
                            </div>
                            <div className="w-full bg-black rounded-full h-2 mb-2 overflow-hidden border border-white/10">
                                <div 
                                    className="bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] h-2 rounded-full transition-all duration-1000" 
                                    style={{ width: `${Math.min(100, ((targetBaseUnits - result.missingBaseUnits) / targetBaseUnits) * 100)}%` }}
                                ></div>
                            </div>
                            <p className="text-[10px] text-slate-500 text-right">
                                {targetLevel}레벨 도달까지 필요한 5레벨 보석 <b>{targetBaseUnits}개</b> 중 <b>{targetBaseUnits - result.missingBaseUnits}개</b> 분량 확보
                            </p>
                        </div>

                        {/* Asset Redistribution Plan */}
                        {result.isMarketAvailable && !isDirectPurchaseOptimal && (Object.keys(result.purchasePlan).length > 0 || Object.keys(result.sellPlan).length > 0 || Object.keys(result.keepPlan).length > 0) && (
                            <div className="bg-black/30 p-4 rounded-xl border border-white/5 space-y-4">
                                <div>
                                    <span className="text-xs text-slate-400 font-bold mb-3 flex items-center gap-2">
                                        <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                        최적 자산 재분배 계획 (합성 루트)
                                    </span>
                                    <div className="space-y-3">
                                        {/* Sell Plan */}
                                        {Object.keys(result.sellPlan).length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-emerald-400 font-bold ml-1 uppercase tracking-widest">판매 (골드 확보)</p>
                                                {Object.entries(result.sellPlan).sort(([a], [b]) => Number(b) - Number(a)).map(([level, count]) => {
                                                    const l = Number(level);
                                                    const cheapest = getCheapestPrice(l, prices);
                                                    const sellVal = Math.floor(cheapest * 0.95);
                                                    return (
                                                        <div key={level} className="flex justify-between items-center text-sm bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-white text-[10px] flex items-center justify-center">Lv.{level}</div>
                                                                    <span className="text-slate-300">보석 <span className="text-emerald-400 font-bold ml-1">{count}개</span></span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 pl-7">개당 {sellVal.toLocaleString()} G (수수료 제외)</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-emerald-400 font-bold text-sm">+{(sellVal * count).toLocaleString()}</span>
                                                                <span className="text-[10px] text-emerald-500 ml-1 font-bold">G</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}

                                        {/* Keep Plan */}
                                        {Object.keys(result.keepPlan).length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-blue-400 font-bold ml-1 uppercase tracking-widest">유지 (합성 재료로 사용)</p>
                                                {Object.entries(result.keepPlan).sort(([a], [b]) => Number(b) - Number(a)).map(([level, count]) => (
                                                    <div key={level} className="flex justify-between items-center text-sm bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-white text-[10px] flex items-center justify-center">Lv.{level}</div>
                                                            <span className="text-slate-300">보석</span>
                                                        </div>
                                                        <span className="text-blue-400 font-bold">{count}개</span>
                                                    </div>
                                                ))}
                                            </div>
                                        )}

                                        {/* Purchase Plan */}
                                        {Object.keys(result.purchasePlan).length > 0 && (
                                            <div className="space-y-1.5">
                                                <p className="text-[10px] text-amber-400 font-bold ml-1 uppercase tracking-widest">추가 구매 (재료 충당)</p>
                                                {Object.entries(result.purchasePlan).sort(([a], [b]) => Number(b) - Number(a)).map(([level, count]) => {
                                                    const l = Number(level);
                                                    const cheapest = getCheapestPrice(l, prices);
                                                    return (
                                                        <div key={level} className="flex justify-between items-center text-sm bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/20">
                                                            <div className="flex flex-col">
                                                                <div className="flex items-center gap-2 mb-0.5">
                                                                    <div className="w-5 h-5 rounded-full bg-slate-700 font-bold text-white text-[10px] flex items-center justify-center">Lv.{level}</div>
                                                                    <span className="text-slate-300">보석 <span className="text-amber-400 font-bold ml-1">{count}개</span></span>
                                                                </div>
                                                                <span className="text-[10px] text-slate-400 pl-7">개당 {cheapest.toLocaleString()} G</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-amber-400 font-bold text-sm">-{(cheapest * count).toLocaleString()}</span>
                                                                <span className="text-[10px] text-amber-500 ml-1 font-bold">G</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-slate-500 mt-3 flex justify-between">
                                        <span>판매 금액 기댓값: <b className="text-emerald-400">+{result.totalSellIncome.toLocaleString()} G</b></span>
                                        <span>구매 총액: <b className="text-amber-400">-{result.totalBuyCost.toLocaleString()} G</b></span>
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Outcomes */}
                        {!result.isMarketAvailable ? (
                             <div className="flex-1 flex items-center justify-center p-6 bg-red-500/10 border border-red-500/20 rounded-xl">
                                <p className="text-red-400 text-sm font-bold text-center">경매장에 재료로 사용할 수 있는 하위 보석 매물이 부족하여 계산할 수 없습니다.</p>
                             </div>
                        ) : (
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="text-xs font-bold text-slate-400 mb-1">
                                    {isDirectPurchaseOptimal ? "최종 도달 시나리오 (직접 구매가 합성 성공보다 이득이므로 합성을 추천하지 않습니다)" : "최종 도달 시나리오 비용 비교"}
                                </div>
                                
                                {/* Direct Purchase Route */}
                                <div className={`flex-1 p-3 rounded-lg border transition-all ${result.directPurchase.remainingGold >= 0 ? (isDirectPurchaseOptimal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-purple-500/10 border-purple-500/30') : 'bg-black/40 border-white/5'}`}>
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="break-keep">
                                            <p className={`text-[10px] sm:text-xs font-black mb-1 ${result.directPurchase.remainingGold >= 0 ? (isDirectPurchaseOptimal ? 'text-emerald-400' : 'text-purple-400') : 'text-slate-400'}`}>
                                                {isDirectPurchaseOptimal ? '【 강력 추천: 전부 판매 후 직작 】' : '【 방법 A: 전부 판매 후 직작 】'}
                                            </p>
                                            <p className="text-xs text-slate-300 leading-snug">{targetLevel}레벨 {getGemName(targetType)} 직접 구매</p>
                                        </div>
                                        <div className="text-right shrink-0 whitespace-nowrap">
                                            <p className={`text-base sm:text-lg font-black ${result.directPurchase.remainingGold >= 0 ? 'text-purple-400' : 'text-red-400'}`}>
                                                {result.directPurchase.remainingGold >= 0 ? '도달 가능' : '골드 부족'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {result.directPurchase.remainingGold >= 0 ? '잔여: ' : '추가: '}
                                                <span className={`font-bold ${result.directPurchase.remainingGold >= 0 ? 'text-amber-400' : 'text-red-300'}`}>
                                                    {Math.abs(result.directPurchase.remainingGold).toLocaleString()} G
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {!isDirectPurchaseOptimal && (
                                    <>
                                        {/* Success Route */}
                                        <div className={`flex-1 p-3 rounded-lg border transition-all ${result.success.remainingGold >= 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-black/40 border-white/5'}`}>
                                    <div className="flex justify-between items-center gap-2">
                                        <div className="break-keep">
                                            <p className={`text-[10px] sm:text-xs font-black mb-1 ${result.success.remainingGold >= 0 ? 'text-emerald-400' : 'text-slate-400'}`}>【 방법 B: 재분배 후 합성 (성공) 】</p>
                                            <p className="text-xs text-slate-300 leading-snug">원하는 {getGemName(targetType)} 보석이 떴을 경우{targetType !== 'any' ? ' (50%)' : ''}</p>
                                        </div>
                                        <div className="text-right shrink-0 whitespace-nowrap">
                                            <p className={`text-base sm:text-lg font-black ${result.success.remainingGold >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                                {result.success.remainingGold >= 0 ? '도달 가능' : '골드 부족'}
                                            </p>
                                            <p className="text-xs text-slate-400 mt-0.5">
                                                {result.success.remainingGold >= 0 ? '잔여: ' : '추가: '}
                                                <span className={`font-bold ${result.success.remainingGold >= 0 ? 'text-amber-400' : 'text-red-300'}`}>
                                                    {Math.abs(result.success.remainingGold).toLocaleString()} G
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Failure Route */}
                                {result.failure && (
                                    <div className={`flex-1 p-3 rounded-lg border transition-all ${result.failure.remainingGold >= 0 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-black/40 border-white/5'}`}>
                                        <div className="flex justify-between items-center gap-2">
                                            <div className="break-keep">
                                                <p className={`text-[10px] sm:text-xs font-black mb-1 ${result.failure.remainingGold >= 0 ? 'text-amber-400' : 'text-slate-400'}`}>【 방법 C: 재분배 후 합성 (실패) 】</p>
                                                <p className="text-xs text-slate-300 leading-snug">반대 종류가 떠서 수수료 떼고 팔아 다시 사는 경우 (50%)</p>
                                            </div>
                                            <div className="text-right shrink-0 whitespace-nowrap">
                                                <p className={`text-base sm:text-lg font-black ${result.failure.remainingGold >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                                                    {result.failure.remainingGold >= 0 ? '그래도 가능' : '골드 부족'}
                                                </p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {result.failure.remainingGold >= 0 ? '잔여: ' : '추가: '}
                                                    <span className={`font-bold ${result.failure.remainingGold >= 0 ? 'text-amber-400' : 'text-red-300'}`}>
                                                        {Math.abs(result.failure.remainingGold).toLocaleString()} G
                                                    </span>
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}

import React from 'react';

interface MaterialInputsProps {
  targetSlots: number;
  setTargetSlots: (val: number) => void;
  ownedRare: number;
  setOwnedRare: (val: number) => void;
  ownedUncommon: number;
  setOwnedUncommon: (val: number) => void;
  ownedCommon: number;
  setOwnedCommon: (val: number) => void;
  prices: { rare: number, uncommon: number, common: number };
  bundleCounts: { rare: number, uncommon: number, common: number };
  maxSlots: number;
}

export default function MaterialInputs({
  targetSlots,
  setTargetSlots,
  ownedRare,
  setOwnedRare,
  ownedUncommon,
  setOwnedUncommon,
  ownedCommon,
  setOwnedCommon,
  prices,
  bundleCounts,
  maxSlots

}: MaterialInputsProps) {
  // Track previous values for reset on error
  const prevValues = React.useRef({
      targetSlots: targetSlots,
      ownedRare: ownedRare,
      ownedUncommon: ownedUncommon,
      ownedCommon: ownedCommon
  });

  const handleFocus = (field: keyof typeof prevValues.current, value: number) => {
      prevValues.current[field] = value;
  };

  return (
    <div className="space-y-3 relative z-10">
        <label className="block text-sm font-bold text-slate-400 uppercase tracking-widest mb-1 ml-1">목표 제작 슬롯</label>
        <div className="bg-black/20 rounded-2xl p-4 border border-white/5">
            <div className="flex items-center justify-end gap-3">
                <input 
                    type="number" 
                    value={targetSlots} 
                    onChange={(e) => setTargetSlots(Number(e.target.value))}
                    onFocus={(e) => handleFocus('targetSlots', Number(e.target.value))}
                    onBlur={() => {
                        if (isNaN(targetSlots) || targetSlots < 1) {
                            alert("제작 목표 슬롯은 1 이상이어야 합니다.");
                            setTargetSlots(prevValues.current.targetSlots);
                            return;
                        }
                        if (targetSlots > maxSlots) {
                            alert(`최대 ${maxSlots}슬롯까지만 설정 가능합니다.`);
                            setTargetSlots(prevValues.current.targetSlots);
                            return;
                        }
                        if (!Number.isInteger(targetSlots)) {
                            setTargetSlots(Math.floor(targetSlots));
                        }
                    }}
                    min="1" 
                    className="w-full bg-transparent text-5xl font-black text-white focus:outline-none placeholder-slate-600 text-right selection:bg-[var(--color-primary)]/30"
                />
                <span className="text-base font-bold text-slate-400 whitespace-nowrap">슬롯</span>
            </div>
        </div>

        <div className="space-y-1.5">
            <div className="flex justify-between items-end px-2 pb-1">
                <label className="text-sm font-bold text-slate-400 uppercase tracking-widest">현재 보유량 (벌목 재료)</label>
            </div>
            
            {/* Rare */}
            <div className="bg-black/30 px-3 py-3 rounded-xl border border-white/5 flex items-center justify-between group/item hover:border-[var(--color-primary)]/30 transition-colors">
                <span className="text-sm font-bold text-blue-400 w-16 group-hover/item:text-blue-300 transition-colors">희귀</span>
                <div className="flex-1 flex flex-col items-end mr-3">
                    <input 
                        type="number" 
                        value={ownedRare} 
                        onChange={(e) => setOwnedRare(Number(e.target.value))}
                        onFocus={(e) => handleFocus('ownedRare', Number(e.target.value))}
                        onBlur={() => {
                            if (isNaN(ownedRare) || ownedRare < 0) {
                                alert("보유량은 0 이상의 정수여야 합니다.");
                                setOwnedRare(prevValues.current.ownedRare);
                                return;
                            }
                            if (!Number.isInteger(ownedRare)) {
                                alert("보유량은 정수여야 합니다.");
                                setOwnedRare(prevValues.current.ownedRare);
                                return;
                            }
                        }}
                        className="w-full bg-transparent text-right font-bold text-2xl outline-none text-slate-200 focus:text-white transition-colors placeholder-slate-600 selection:bg-[var(--color-primary)]/30"
                    />
                </div>
                {prices.rare > 0 && (
                    <div className="text-right text-xs text-slate-400 w-28 border-l border-white/5 pl-4">
                        <span className="block text-slate-300 font-bold text-sm mb-0.5">{prices.rare.toLocaleString()} 골드</span>
                        <span className="block text-xs uppercase font-semibold text-slate-500">{bundleCounts.rare}개 단위</span>
                    </div>
                )}
            </div>

            {/* Uncommon */}
            <div className="bg-black/30 px-3 py-3 rounded-xl border border-white/5 flex items-center justify-between group/item hover:border-[var(--color-secondary)]/30 transition-colors">
                <span className="text-sm font-bold text-emerald-400 w-16 group-hover/item:text-emerald-300 transition-colors">고급</span>
                <div className="flex-1 flex flex-col items-end mr-3">
                    <input 
                        type="number" 
                        value={ownedUncommon} 
                        onChange={(e) => setOwnedUncommon(Number(e.target.value))}
                        onFocus={(e) => handleFocus('ownedUncommon', Number(e.target.value))}
                        onBlur={() => {
                            if (isNaN(ownedUncommon) || ownedUncommon < 0) {
                                alert("보유량은 0 이상의 정수여야 합니다.");
                                setOwnedUncommon(prevValues.current.ownedUncommon);
                                return;
                            }
                            if (!Number.isInteger(ownedUncommon)) {
                                alert("보유량은 정수여야 합니다.");
                                setOwnedUncommon(prevValues.current.ownedUncommon);
                                return;
                            }
                        }}
                        className="w-full bg-transparent text-right font-bold text-2xl outline-none text-slate-200 focus:text-white transition-colors placeholder-slate-600 selection:bg-[var(--color-secondary)]/30"
                    />
                </div>
                {prices.uncommon > 0 && (
                    <div className="text-right text-xs text-slate-400 w-28 border-l border-white/5 pl-4">
                        <span className="block text-slate-300 font-bold text-sm mb-0.5">{prices.uncommon.toLocaleString()} 골드</span>
                        <span className="block text-xs uppercase font-semibold text-slate-500">{bundleCounts.uncommon}개 단위</span>
                    </div>
                )}
            </div>

            {/* Common */}
            <div className="bg-black/30 px-3 py-3 rounded-xl border border-white/5 flex items-center justify-between group/item hover:border-slate-500/30 transition-colors">
                <span className="text-sm font-bold text-slate-200 w-16 group-hover/item:text-white transition-colors">일반</span>
                <div className="flex-1 flex flex-col items-end mr-3">
                    <input 
                        type="number" 
                        value={ownedCommon} 
                        onChange={(e) => setOwnedCommon(Number(e.target.value))}
                        onFocus={(e) => handleFocus('ownedCommon', Number(e.target.value))}
                        onBlur={() => {
                            if (isNaN(ownedCommon) || ownedCommon < 0) {
                                alert("보유량은 0 이상의 정수여야 합니다.");
                                setOwnedCommon(prevValues.current.ownedCommon);
                                return;
                            }
                            if (!Number.isInteger(ownedCommon)) {
                                alert("보유량은 정수여야 합니다.");
                                setOwnedCommon(prevValues.current.ownedCommon);
                                return;
                            }
                        }}
                        className="w-full bg-transparent text-right font-bold text-2xl outline-none text-slate-200 focus:text-white transition-colors placeholder-slate-600 selection:bg-slate-500/30"
                    />
                </div>
                {prices.common > 0 && (
                    <div className="text-right text-xs text-slate-400 w-28 border-l border-white/5 pl-4">
                        <span className="block text-slate-300 font-bold text-sm mb-0.5">{prices.common.toLocaleString()} 골드</span>
                        <span className="block text-xs uppercase font-semibold text-slate-500">{bundleCounts.common}개 단위</span>
                    </div>
                )}
            </div>
        </div>
    </div>
  );
}

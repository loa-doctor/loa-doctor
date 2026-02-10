import React, { useState, useEffect } from 'react';
import BonusGuide from './BonusGuide';

interface BonusSettingsProps {
  costReduction: number | null;
  setCostReduction: (val: number | null) => void;
  greatSuccessChance: number | null;
  setGreatSuccessChance: (val: number | null) => void;
  ninavBlessing: boolean;
  setNinavBlessing: (val: boolean) => void;
  timeReduction: number | null;
  setTimeReduction: (val: number | null) => void;
  className?: string;
  forceExpanded?: boolean;
}

export default function BonusSettings({
  costReduction,
  setCostReduction,
  greatSuccessChance,
  setGreatSuccessChance,
  ninavBlessing,
  setNinavBlessing,
  timeReduction,
  setTimeReduction,
  className = "fixed top-6 left-6 z-50 flex flex-col items-start pointer-events-none",
  forceExpanded = false
}: BonusSettingsProps) {
  const [showBonus, setShowBonus] = useState(false);
  
  // Reset manual state when forceExpanded changes (e.g. entering/exiting setup mode)
  useEffect(() => {
    setShowBonus(false);
  }, [forceExpanded]);

  const [showGuide, setShowGuide] = useState(false);
  const isOpen = showBonus || forceExpanded;

  return (
    <div className={className}>
      {!forceExpanded && (
        <button 
            onClick={() => setShowBonus(!showBonus)}
            className="pointer-events-auto px-4 py-2 bg-[var(--bg-panel)] hover:bg-[var(--bg-main)] backdrop-blur-md text-white/80 hover:text-white border border-[var(--border-color)] rounded-lg text-sm font-bold transition-all shadow-lg"
        >
            {isOpen ? '보너스 설정 닫기' : '제작 보너스 설정'}
        </button>
      )}
      
      {isOpen && (
          <div className={`pointer-events-auto mt-3 bg-[var(--bg-main)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 origin-top-left relative ${forceExpanded ? 'flex flex-col min-h-[520px] w-96 p-6' : 'w-80 p-4'}`}>
              
              {/* Header for Initial Setup */}
              {forceExpanded && (
                <h3 className="text-sm font-bold text-[var(--color-primary)] mb-4 text-center uppercase tracking-widest border-b border-white/10 pb-2">제작 보너스 설정</h3>
              )}
              
              {/* Main Guide Toggle */}
              <div className="absolute top-4 right-4 z-10">
                 <div className="relative">
                    <button 
                        className="w-5 h-5 rounded-full bg-[var(--text-secondary)]/20 hover:bg-[var(--color-primary)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center text-[10px] font-bold transition-all cursor-help"
                        onMouseEnter={() => setShowGuide(true)}
                        onMouseLeave={() => setShowGuide(false)}
                    >
                        ?
                    </button>
                    {/* Guide Popover */}
                    <div className={`absolute left-full top-0 ml-4 transition-all duration-300 origin-top-left z-[60] ${showGuide ? 'opacity-100 scale-100 translate-x-0' : 'opacity-0 scale-95 -translate-x-4 pointer-events-none'}`}>
                        <BonusGuide className="w-80" />
                    </div>
                 </div>
              </div>

              <div className="flex flex-col gap-5">
                  
                  {/* Ninav's Blessing */}
                  <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">니나브의 축복 (제작 시간 단축)</label>
                      <button 
                          onClick={() => setNinavBlessing(!ninavBlessing)}
                          className={`w-full py-2.5 rounded-lg text-xs font-bold transition-all border ${ninavBlessing ? 'bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg' : 'bg-[var(--bg-panel)] border-[var(--border-color)] text-[var(--text-secondary)] hover:text-white'}`}
                      >
                          {ninavBlessing ? '적용 중 (ON)' : '미적용 (OFF)'}
                      </button>
                  </div>

                  {/* Cost Reduction */}
                  <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">제작 수수료 감소 (%)</label>
                      <div className="flex items-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3">
                          <input 
                              type="number"
                              value={costReduction ?? ''}
                              onChange={(e) => setCostReduction(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder-white/20"
                              placeholder="0"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold ml-2">%</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-snug break-keep opacity-80">* 대성공 확률도 동일하게 합산하여 입력합니다.</p>
                  </div>

                  {/* Great Success Details */}
                  <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">대성공 확률 (%)</label>
                      <div className="flex items-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3">
                          <input 
                              type="number"
                              value={greatSuccessChance ?? ''}
                              onChange={(e) => setGreatSuccessChance(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder-white/20"
                              placeholder="0"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold ml-2">%</span>
                      </div>
                       <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 opacity-80">* 기본 5% + {greatSuccessChance || 0}% (최종 {(0.05 * (1 + (greatSuccessChance || 0)/100) * 100).toFixed(2)}%)</p>
                  </div>

                  {/* Time Reduction */}
                  <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">제작 시간 감소 (%)</label>
                      <div className="flex items-center bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-lg px-3">
                          <input 
                              type="number"
                              value={timeReduction ?? ''}
                              onChange={(e) => setTimeReduction(e.target.value === '' ? null : Number(e.target.value))}
                              className="w-full bg-transparent py-2 text-sm text-[var(--text-primary)] focus:outline-none placeholder-white/20"
                              placeholder="0"
                          />
                          <span className="text-xs text-[var(--text-secondary)] font-bold ml-2">%</span>
                      </div>
                      <p className="text-[10px] text-[var(--text-secondary)] mt-1.5 leading-snug break-keep opacity-80">
                          * 최종 감소율: {(timeReduction || 0) + (ninavBlessing ? 10 : 0)}% (입력값 {timeReduction || 0}% + 니나브 {ninavBlessing ? 10 : 0}%)
                      </p>
                  </div>

              </div>
          </div>
      )}
    </div>
  );
}

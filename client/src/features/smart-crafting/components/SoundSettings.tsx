
import React, { useState, useEffect } from 'react';
import { soundManager, SoundType } from '../../../utils/soundUtils';

interface SoundSettingsProps {
  enabled: boolean;
  setEnabled: (val: boolean) => void;
  soundType: SoundType;
  setSoundType: (val: SoundType) => void;
  className?: string;
  forceHidden?: boolean;
}

export default function SoundSettings({
  enabled,
  setEnabled,
  soundType,
  setSoundType,
  className = "fixed top-6 right-[140px] z-50 flex flex-col items-end pointer-events-none",
  forceHidden = false
}: SoundSettingsProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Close when hidden
  useEffect(() => {
    if (forceHidden) setIsOpen(false);
  }, [forceHidden]);

  if (forceHidden) return null;

  const handleTest = (type: SoundType) => {
      soundManager.play(type);
  };

  return (
    <div className={className}>
       <button 
           onClick={() => setIsOpen(!isOpen)}
           className={`pointer-events-auto w-10 h-10 flex items-center justify-center rounded-full backdrop-blur-md border transition-all shadow-lg ${
               enabled 
               ? 'bg-[var(--color-primary)] text-white border-[var(--color-primary)] shadow-[var(--color-primary)]/30' 
               : 'bg-[var(--bg-panel)] text-slate-400 border-[var(--border-color)] hover:text-white'
           }`}
           title="알림 설정"
       >
           {enabled ? (
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
           ) : (
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><line x1="2" x2="22" y1="2" y2="22"/></svg>
           )}
       </button>

       {isOpen && (
           <div className="pointer-events-auto mt-3 bg-[var(--bg-main)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-xl shadow-2xl p-4 w-60 animate-in fade-in slide-in-from-top-4 origin-top-right absolute right-0 top-full">
               <h4 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                   알림 설정
               </h4>

               <div className="flex flex-col gap-4">
                   {/* Toggle */}
                   <div className="flex justify-between items-center">
                       <span className="text-sm text-white font-medium">소리 알림</span>
                       <button 
                           onClick={() => setEnabled(!enabled)}
                           className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-[var(--color-success)]' : 'bg-slate-700'}`}
                       >
                           <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-transform ${enabled ? 'left-6' : 'left-1'}`} />
                       </button>
                   </div>

                   {/* Sound Selector */}
                   {enabled && (
                       <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                           <label className="text-[10px] text-slate-400">알림음 선택</label>
                           <div className="grid grid-cols-1 gap-1">
                               {(['chime', 'bell', 'arcade', 'zelda'] as const).map(type => (
                                   <button
                                       key={type}
                                       onClick={() => {
                                           setSoundType(type);
                                           handleTest(type);
                                       }}
                                       className={`text-left px-3 py-2 rounded text-xs font-bold transition-colors flex justify-between items-center ${
                                           soundType === type 
                                           ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border border-[var(--color-primary)]/30' 
                                           : 'bg-black/20 text-slate-400 border border-transparent hover:bg-white/5 hover:text-white'
                                       }`}
                                   >
                                       <span className="capitalize">{type}</span>
                                       {soundType === type && <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)]" />}
                                   </button>
                               ))}
                           </div>
                       </div>
                   )}
               </div>
           </div>
       )}
    </div>
  );
}

import React from 'react';

interface CraftingStatusProps {
  type: 'abidos' | 'superior';
  concurrency: number; // 3 or 4
  onClose: () => void;
  isVisible: boolean;
}

export default function CraftingStatus({ type, concurrency, onClose, isVisible }: CraftingStatusProps) {
  if (!isVisible) return null;

  const itemName = type === 'abidos' ? '아비도스 융화 재료' : '상급 아비도스 융화 재료';
  
  // Icon URL (using a placeholder or standard asset from game if available, otherwise a generic icon)
  // Using a colored div/svg for now to represent the item as requested "like the photo"
  // Photo showed icons. I will use a simple gold/orange circle to mimic the fusion material.
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 p-8 items-center" onClick={onClose}>
        {/* We render N blocks (based on concurrency) similar to the screenshot */}
        {Array.from({ length: concurrency }).map((_, slotIndex) => (
          <div 
            key={slotIndex}
            className="w-[480px] h-32 relative overflow-hidden rounded-lg border border-blue-400/30 shadow-[0_0_30px_rgba(59,130,246,0.3)] bg-gradient-to-b from-slate-800/90 to-slate-900/95 group cursor-pointer hover:scale-[1.02] transition-transform duration-300"
          >
            {/* Top Glow Line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-400 to-transparent opacity-50" />
            
            {/* Content Container */}
            <div className="h-full flex flex-col items-center justify-center gap-3 relative z-10">
                {/* Text Effect */}
                <h3 className="text-xl font-bold text-white drop-shadow-[0_0_10px_rgba(59,130,246,0.8)] tracking-wider">
                    {itemName} 제작 완료
                </h3>
                
                {/* Item Slots Row */}
                <div className="flex gap-1.5 px-4 py-2 bg-black/40 rounded border border-blue-500/20 shadow-inner">
                    {/* Exclamation Icon (Success Indicator) */}
                    <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-400/50 rounded flex items-center justify-center shadow-[0_0_10px_rgba(34,211,238,0.3)]">
                        <span className="text-cyan-300 font-bold text-lg">!</span>
                    </div>
                    
                    {/* Item Icons (10 items) */}
                    {Array.from({ length: 10 }).map((_, i) => (
                        <div key={i} className="w-8 h-8 bg-gradient-to-br from-orange-400/20 to-orange-600/20 border border-orange-400/40 rounded flex items-center justify-center relative overflow-hidden">
                             <div className="w-5 h-5 rounded-full bg-gradient-to-br from-orange-300 to-orange-600 shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
                             {/* Shine effect */}
                             <div className="absolute inset-0 bg-white/20 rotate-45 translate-x-[-100%] animate-[shine_2s_infinite]" />
                        </div>
                    ))}
                </div>
            </div>

            {/* Background Glow */}
            <div className="absolute inset-0 bg-gradient-to-t from-blue-600/10 to-transparent pointer-events-none" />
            <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,0.8)]" />
          </div>
        ))}
        
        <p className="text-slate-400 text-sm mt-4 animate-pulse">화면을 클릭하여 닫기</p>
      </div>
    </div>
  );
}

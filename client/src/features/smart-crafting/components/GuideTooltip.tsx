import React, { useState } from 'react';

interface GuideTooltipProps {
  label: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
}

export default function GuideTooltip({ label, description, imageSrc, imageAlt }: GuideTooltipProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative inline-block ml-2 group">
      <button 
        className="w-4 h-4 rounded-full bg-[var(--text-secondary)]/20 hover:bg-[var(--color-primary)] text-[var(--text-secondary)] hover:text-white flex items-center justify-center text-[10px] font-bold transition-all cursor-help"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        aria-label={label}
      >
        ?
      </button>

      <div 
        className={`absolute z-[60] left-1/2 -translate-x-1/2 bottom-full mb-3 w-64 bg-[var(--bg-panel)] border border-[var(--border-color)] rounded-xl shadow-2xl p-3 transition-all duration-300 origin-bottom pointer-events-none ${isHovered ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-2'}`}
      >
         <div className="mb-2 rounded-lg overflow-hidden border border-[var(--border-color)] bg-black/50">
           <img src={imageSrc} alt={imageAlt} className="w-full h-auto object-cover" />
         </div>
         <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed break-keep font-medium">
            {description}
         </p>
         
         {/* Arrow */}
         <div className="absolute left-1/2 -translate-x-1/2 bottom-[-6px] w-3 h-3 bg-[var(--bg-panel)] border-r border-b border-[var(--border-color)] rotate-45" />
      </div>
    </div>
  );
}

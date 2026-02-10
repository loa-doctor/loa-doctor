import React from 'react';

interface BonusGuideProps {
  className?: string;
}

export default function BonusGuide({ className = "" }: BonusGuideProps) {
  return (
    <div className={`w-80 bg-[var(--bg-panel)]/90 backdrop-blur-md border border-[var(--border-color)] rounded-xl p-4 shadow-2xl flex flex-col gap-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--border-color)] pb-2">
        <h3 className="text-xs font-bold text-[var(--color-primary)] uppercase tracking-widest">설정 가이드 예시</h3>
        <span className="text-[10px] text-[var(--text-secondary)]">로나운의 고서</span>
      </div>

      {/* Image Container */}
      <div className="relative rounded-lg overflow-hidden border border-[var(--border-color)] group">
        <img 
          src="/images/guide_ronaun.png" 
          alt="Bonus Guide Example" 
          className="w-full h-auto object-cover opacity-90 group-hover:opacity-100 transition-opacity"
        />
        {/* Highlight Overlays (Optional visualization) */}
      </div>

      {/* Explanation Grid */}
      <div className="space-y-2">
        <div className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg">
           <span className="text-[var(--text-secondary)] font-medium">제작 수수료 감소</span>
           <span className="text-[var(--color-accent)] font-bold">16%</span>
        </div>
        
        <div className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg">
           <span className="text-[var(--text-secondary)] font-medium">대성공 확률</span>
           <span className="text-[var(--color-accent)] font-bold">7%</span>
        </div>

        <div className="flex justify-between items-center text-xs bg-white/5 p-2 rounded-lg">
           <span className="text-[var(--text-secondary)] font-medium">제작 시간 감소</span>
           <span className="text-[var(--color-accent)] font-bold">13%</span>
        </div>
      </div>
      
      <p className="text-[10px] text-[var(--text-secondary)] text-center leading-relaxed opacity-70">
        * 위 예시처럼 모든 효과를 <strong>합산</strong>하여 입력해주세요.<br/>
        (니나브의 축복은 별도 체크)
      </p>
    </div>
  );
}

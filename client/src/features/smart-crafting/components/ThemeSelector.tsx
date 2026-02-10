"use client";

import React, { useState } from 'react';
import { useTheme, THEMES, Theme } from '../contexts/ThemeContext';

export default function ThemeSelector() {
  const { theme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const colors: Record<Theme, string> = {
    midnight: 'bg-[#3b82f6]',
    forest: 'bg-[#10b981]',
    ocean: 'bg-[#06b6d4]',
    obsidian: 'bg-[#ef4444]',
    sunset: 'bg-[#f97316]'
  };

  return (
    <div className="relative">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-all"
      >
        <span className={`w-2 h-2 rounded-full ${colors[theme]}`} />
        <span>{THEMES[theme]}</span>
      </button>

      {isOpen && (
        <>
            <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
            <div className="absolute bottom-full right-0 mb-2 w-32 bg-[#1a1d29] border border-white/10 rounded-xl shadow-xl z-50 overflow-hidden py-1">
                {Object.entries(THEMES).map(([key, label]) => (
                    <button
                        key={key}
                        onClick={() => {
                            setTheme(key as Theme);
                            setIsOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 text-xs font-bold flex items-center gap-2 hover:bg-white/5 transition-colors ${theme === key ? 'text-white' : 'text-slate-500'}`}
                    >
                        <span className={`w-2 h-2 rounded-full ${colors[key as Theme]}`} />
                        {label}
                    </button>
                ))}
            </div>
        </>
      )}
    </div>
  );
}

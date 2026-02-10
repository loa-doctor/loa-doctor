import React, { useState, useEffect } from 'react';

interface APISettingsProps {
  apiKey: string;
  setApiKey: (key: string) => void;
  fetchPrices: (key: string) => void;
  isLoading: boolean;
  logs: string[];
  className?: string;
  forceExpanded?: boolean;
  apiError?: string | null;
}

export default function APISettings({
  apiKey,
  setApiKey,
  fetchPrices,
  isLoading,
  logs,
  className = "fixed top-6 right-6 z-50 flex flex-col items-end pointer-events-none",
  forceExpanded = false,
  apiError
}: APISettingsProps) {
  const [showSettings, setShowSettings] = useState(false);

  // Reset manual state when forceExpanded changes
  useEffect(() => {
    setShowSettings(false);
  }, [forceExpanded]);

  const isOpen = showSettings || forceExpanded;

  return (
    <div className={className}>
      {!forceExpanded && (
        <button 
            onClick={() => setShowSettings(!showSettings)}
            className="pointer-events-auto px-4 py-2 bg-[var(--bg-panel)] hover:bg-[var(--bg-main)] backdrop-blur-md text-white/80 hover:text-white border border-[var(--border-color)] rounded-lg text-sm font-bold transition-all shadow-lg"
        >
            {isOpen ? '설정 닫기' : 'API 설정'}
        </button>
      )}
      
      {isOpen && (
          <div className={`pointer-events-auto mt-3 bg-[var(--bg-main)]/95 backdrop-blur-xl border border-[var(--border-color)] rounded-xl shadow-2xl animate-in fade-in slide-in-from-top-4 origin-top-left ${forceExpanded ? 'flex flex-col min-h-[520px] w-96 p-6' : 'w-80 p-4'}`}>
               {/* Header for Initial Setup */}
               {forceExpanded && (
                <h3 className="text-sm font-bold text-[var(--color-primary)] mb-4 text-center uppercase tracking-widest border-b border-white/10 pb-2">API / 시스템 설정</h3>
              )}
              <div className="flex flex-col gap-4">
                  <div>
                      <label className="block text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest mb-2">Lost Ark API Key</label>
                      <input 
                          type="password"
                          value={apiKey}
                          onChange={(e) => setApiKey(e.target.value)}
                          placeholder="API Key 입력"
                          className={`w-full bg-[var(--bg-panel)] border rounded-lg px-3 py-2 text-sm text-[var(--text-primary)] focus:border-[var(--color-primary)] outline-none transition-colors ${apiError ? 'border-[var(--color-danger)] animate-pulse' : 'border-[var(--border-color)]'}`}
                      />
                      {apiError && <p className="text-[10px] text-red-400 font-bold mt-2 text-center animate-in fade-in slide-in-from-top-1">{apiError}</p>}
                      <p className="text-[10px] text-slate-400 mt-2 leading-relaxed text-center">
                          <a href="https://developer-lostark.game.onstove.com/" target="_blank" rel="noreferrer" className="text-[var(--color-primary)] hover:brightness-110 underline font-bold">Lost Ark Open API</a>
                          에서 스토브 로그인 후<br/>API Key를 발급받아 입력해주세요.
                      </p>
                  </div>
                  
                  <button 
                      onClick={() => fetchPrices(apiKey)}
                      disabled={isLoading}
                      className="w-full py-2.5 bg-[var(--color-primary)] hover:brightness-110 text-white text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                      {isLoading ? '시세 조회 중...' : '시세 조회하기 (초기화)'}
                  </button>

                  {!forceExpanded && (
                     <div className="mt-2 pt-3 border-t border-[var(--border-color)]">
                          <div className="flex justify-between items-center mb-2">
                             <h3 className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">API 로그</h3>
                             {isLoading && <span className="text-[10px] text-[var(--color-primary)] font-bold animate-pulse">조회 중...</span>}
                          </div>
                          <div className="h-48 overflow-y-auto bg-[var(--bg-panel)] rounded-lg p-2 border border-[var(--border-color)] custom-scrollbar">
                            {logs.length > 0 ? (
                              <div className="space-y-1.5">
                                {logs.map((log, i) => (
                                  <p key={i} className="text-[11px] text-[var(--text-secondary)] leading-relaxed border-b border-[var(--border-color)] pb-1 last:border-0">{log}</p>
                                ))}
                              </div>
                            ) : (
                              <p className="text-[11px] text-[var(--text-secondary)] text-center py-4">로그 기록이 없습니다.</p>
                            )}
                          </div>
                     </div>
                  )}
              </div>
          </div>
      )}
    </div>
  );
}

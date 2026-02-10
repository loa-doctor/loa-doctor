import React, { useState, useMemo } from 'react';
// Reading file first to be safe.

import { CraftingEntry } from '../constants/gameData';

interface HistoryViewProps {
  history: CraftingEntry[];
  onDelete: (id: string) => void;
  onClear?: () => void;
  onUpdateEntry?: (id: string, actualCount: number) => void;
}

export default function HistoryView({ history, onDelete, onClear, onUpdateEntry }: HistoryViewProps) {
  const formatDuration = (secondsInput: number) => {
    const totalSeconds = Math.round(secondsInput);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    
    if (hours > 0) {
        return `${hours}시간 ${minutes}분 ${secs}초`;
    }
    return `${minutes}분 ${secs}초`;
  };

  const [isDeleteMode, setIsDeleteMode] = useState<boolean>(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [filterType, setFilterType] = useState<'all' | 'abidos' | 'superior'>('all');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const ITEMS_PER_PAGE = 8;
  
  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  const startEditing = (entry: CraftingEntry) => {
    setEditingId(entry.id);
    setEditValue((entry.outputs.actualCount ?? Math.floor(entry.outputs.expectedCount)).toString());
  };

  const commitEditing = () => {
    if (editingId && onUpdateEntry && editValue) {
        onUpdateEntry(editingId, Number(editValue));
    }
    setEditingId(null);
  };

  const [viewMode, setViewMode] = useState<'selling' | 'usage'>('selling'); // 'selling' = 순수익(판매), 'usage' = 총 이득(사용)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') commitEditing();
    if (e.key === 'Escape') setEditingId(null);
  };

  const filteredHistory = useMemo(() => {
    let data = [...history];

    // Filter
    if (filterType !== 'all') {
        data = data.filter(entry => entry.type === (filterType === 'superior' ? 'superior' : 'abidos'));
    }

    // Sort
    data.sort((a, b) => {
        return sortOrder === 'newest' ? b.timestamp - a.timestamp : a.timestamp - b.timestamp;
    });

    return data;
  }, [history, filterType, sortOrder]);

  // Reset to first page when filter or sort changes
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, sortOrder]);

  const totalPages = Math.ceil(filteredHistory.length / ITEMS_PER_PAGE);
  const paginatedHistory = filteredHistory.slice(
    (currentPage - 1) * ITEMS_PER_PAGE, 
    currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    return filteredHistory.reduce((acc, entry) => {
        const profit = viewMode === 'selling' 
            ? (entry.actualProfit ?? entry.expectedProfit ?? 0)
            : ((entry.actualRevenue ?? entry.expectedRevenue) - entry.totalCost); // Usage Profit
        
        // Calculate Usage Profit on the fly if not present
        const count = entry.outputs.actualCount ?? entry.outputs.expectedCount;
        const grossRevenue = count * entry.outputs.marketPrice;
        const usageProfit = grossRevenue - entry.totalCost;

        const currentProfit = viewMode === 'selling' 
            ? (entry.actualProfit ?? entry.expectedProfit ?? 0)
            : usageProfit;

        // Accumulate valid duration/profit for hourly rate
        let durationAdd = 0;
        let profitAdd = 0;
        if (entry.duration) {
            durationAdd = entry.duration;
            profitAdd = currentProfit;
        }

        return {
            totalProfit: acc.totalProfit + currentProfit,
            hourlyDurationAccumulator: acc.hourlyDurationAccumulator + durationAdd,
            hourlyProfitAccumulator: acc.hourlyProfitAccumulator + profitAdd
        };
    }, { totalProfit: 0, hourlyDurationAccumulator: 0, hourlyProfitAccumulator: 0 });
  }, [filteredHistory, viewMode]);

  const hourlyProfit = stats.hourlyDurationAccumulator > 0 
    ? (stats.hourlyProfitAccumulator / stats.hourlyDurationAccumulator) * 3600 
    : 0;

  return (
    <section className="bg-[var(--bg-panel)]/80 backdrop-blur-md border border-[var(--border-color)] rounded-[2rem] p-6 shadow-2xl h-[850px] flex flex-col relative">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-1 h-6 bg-[var(--color-primary)] rounded-full"/>
              제작 기록
              <span className="text-xs font-normal text-[var(--text-secondary)] ml-2">
                  {history.length}개의 기록
              </span>
          </h2>
          
          <div className="flex items-center gap-2">
              {/* View Mode Toggle */}
              <div className="flex bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)] mr-2">
                  <button 
                      onClick={() => setViewMode('selling')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'selling' ? 'bg-[var(--color-success)] text-white shadow-lg ring-1 ring-white/20' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                  >
                      판매 시 수익
                  </button>
                  <button 
                      onClick={() => setViewMode('usage')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'usage' ? 'bg-[var(--color-primary)] text-white shadow-lg ring-1 ring-white/20' : 'text-[var(--text-secondary)] hover:text-white hover:bg-white/5'}`}
                  >
                      본인 사용 이득
                  </button>
              </div>

              {/* Filter Toggle */}
              <div className="flex bg-[var(--bg-main)] p-1 rounded-lg border border-[var(--border-color)]">
                  <button 
                      onClick={() => setFilterType('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'all' ? 'bg-[var(--text-secondary)] text-[var(--bg-main)]' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                      전체
                  </button>
                  <button 
                      onClick={() => setFilterType('abidos')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'abidos' ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                      아비도스
                  </button>
                  <button 
                      onClick={() => setFilterType('superior')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${filterType === 'superior' ? 'bg-[var(--color-secondary)] text-white' : 'text-[var(--text-secondary)] hover:text-white'}`}
                  >
                      상급
                  </button>
              </div>

              {/* Sort Toggle */}
              <button 
                  onClick={() => setSortOrder(prev => prev === 'newest' ? 'oldest' : 'newest')}
                  className="px-3 py-1.5 bg-[var(--bg-main)] border border-[var(--border-color)] rounded-lg text-xs font-bold text-[var(--text-secondary)] hover:text-white hover:bg-white/5 transition-all flex items-center gap-1"
              >
                  <span>{sortOrder === 'newest' ? '최신순' : '오래된순'}</span>
                  <svg className={`w-3 h-3 transition-transform ${sortOrder === 'newest' ? 'rotate-0' : 'rotate-180'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
              </button>

              {history.length > 0 && (
                  <>
                    {isDeleteMode && onClear && (
                        <button 
                            onClick={onClear}
                            className="px-3 py-1.5 rounded-lg text-xs font-bold text-[var(--color-danger)] hover:text-white hover:bg-[var(--color-danger)] transition-colors mr-2"
                        >
                            모두 삭제
                        </button>
                    )}
                    <button 
                        onClick={() => setIsDeleteMode(!isDeleteMode)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${isDeleteMode ? 'bg-[var(--color-danger)] text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'}`}
                    >
                        {isDeleteMode ? '완료' : '편집'}
                    </button>
                  </>
              )}
          </div>
        </div>
        
        {/* Summary Dashboard */}
        {filteredHistory.length > 0 && (
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                    <span className="text-[var(--text-secondary)] text-sm font-bold mb-1">
                        {viewMode === 'selling' ? '총 순수익 합계' : '총 이득 합계'}
                    </span>
                    <span className={`text-2xl font-black ${stats.totalProfit >= 0 ? (viewMode === 'selling' ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]') : 'text-[var(--color-danger)]'}`}>
                        {stats.totalProfit > 0 ? '+' : ''}{Math.floor(stats.totalProfit).toLocaleString()} <span className="text-sm font-bold opacity-70">골드</span>
                    </span>
                </div>

                {stats.hourlyDurationAccumulator > 0 && (
                    <div className="bg-black/20 rounded-2xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                        <span className="text-[var(--text-secondary)] text-sm font-bold mb-1 flex items-center gap-2">
                            {viewMode === 'selling' ? '시간당 예상 수익' : '시간당 예상 이득'}
                            <span className="px-1.5 py-0.5 bg-black/40 rounded text-[10px] text-slate-400 font-normal">
                                {formatDuration(stats.hourlyDurationAccumulator)} 데이터
                            </span>
                        </span>
                        <span className={`text-2xl font-black ${hourlyProfit >= 0 ? (viewMode === 'selling' ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]') : 'text-[var(--color-danger)]'}`}>
                            <span className="text-sm font-bold opacity-70 mr-1.5">시간당</span>
                            {Math.round(hourlyProfit).toLocaleString()} 
                            <span className="text-sm font-bold opacity-70 ml-0.5">골드</span>
                        </span>
                    </div>
                )}
            </div>
        )}

        {filteredHistory.length > 0 ? (
              <div className="overflow-x-auto flex-1">
                  <table className="w-full text-[13px] text-left border-collapse border border-[var(--border-color)] table-fixed">
                      <thead className="bg-[var(--bg-main)] text-[var(--text-secondary)] font-bold whitespace-nowrap text-center">
                          <tr>
                              <th className="border border-[var(--border-color)] px-1 py-3 w-[90px]">시간</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 w-[80px]">구분</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 bg-black/20 text-slate-400 w-[80px]">희귀 재료</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 bg-black/20 text-slate-400 w-[80px]">고급 재료</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 bg-black/20 text-slate-400 w-[80px]">일반 재료</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 bg-black/20 text-amber-500/70 w-[90px]">제작비 (골드)</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 bg-black/20 text-slate-200 w-[90px]">총 비용 (골드)</th>
                              <th className="border border-[var(--border-color)] px-1 py-3 bg-white/5 text-slate-200 w-[140px]">
                                  {viewMode === 'selling' ? '결과 (시세 x 수량)' : '결과 (사용 가치)'}
                              </th>
                              <th className={`border border-[var(--border-color)] px-1 py-3 font-black w-[140px] ${viewMode === 'selling' ? 'text-[var(--color-success)]' : 'text-[var(--color-primary)]'}`}>
                                  {viewMode === 'selling' ? '판매 시 수익' : '본인 사용 이득'}
                              </th>
                              {isDeleteMode && <th className="border border-[var(--border-color)] px-1 py-3 bg-[var(--color-danger)]/20 text-red-200 w-[50px]">삭제</th>}
                          </tr>
                      </thead>
                      <tbody>
                          {paginatedHistory.map((entry) => {
                              if (!entry.inputs || !entry.outputs) return null;

                              const count = entry.outputs.actualCount ?? entry.outputs.expectedCount;
                              const grossRevenue = count * entry.outputs.marketPrice;
                              const revenue = viewMode === 'selling' 
                                ? (entry.actualRevenue ?? entry.expectedRevenue) 
                                : grossRevenue; // Usage Value (No tax)

                              const profit = viewMode === 'selling'
                                ? (entry.actualProfit ?? entry.expectedProfit)
                                : (grossRevenue - entry.totalCost);

                              return (
                              <tr key={entry.id} className="hover:bg-white/5 transition-colors border-b border-[var(--border-color)] whitespace-nowrap">
                                  {/* Time */}
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center text-[11px] text-[var(--text-secondary)] font-medium tracking-tight">
                                      {new Date(entry.timestamp).toLocaleString(undefined, {
                                          month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit'
                                      })}
                                  </td>
                                  
                                  {/* Type */}
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center">
                                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${entry.type === 'abidos' ? 'text-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'text-[var(--color-secondary)] bg-[var(--color-secondary)]/10'}`}>
                                          {entry.type === 'abidos' ? '아비도스' : '상급 아비도스'}
                                      </span>
                                  </td>

                                  {/* Materials */}
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center bg-black/10 tabular-nums">
                                      <div className="flex flex-col items-center">
                                          <span className="text-slate-300 font-bold">{Math.floor(entry.inputs.rare.total).toLocaleString()}</span>
                                          <span className="text-[10px] text-slate-400 tracking-tight">
                                              {entry.inputs.rare.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} x {entry.inputs.rare.count}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center bg-black/10 tabular-nums">
                                      <div className="flex flex-col items-center">
                                          <span className="text-slate-300 font-bold">{Math.floor(entry.inputs.uncommon.total).toLocaleString()}</span>
                                          <span className="text-[10px] text-slate-400 tracking-tight">
                                              {entry.inputs.uncommon.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} x {entry.inputs.uncommon.count}
                                          </span>
                                      </div>
                                  </td>
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center bg-black/10 tabular-nums">
                                      <div className="flex flex-col items-center">
                                          <span className="text-slate-300 font-bold">{Math.floor(entry.inputs.common.total).toLocaleString()}</span>
                                          <span className="text-[10px] text-slate-400 tracking-tight">
                                              {entry.inputs.common.price.toLocaleString(undefined, { maximumFractionDigits: 2 })} x {entry.inputs.common.count}
                                          </span>
                                      </div>
                                  </td>
                                  
                                  {/* Gold Cost */}
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center bg-black/10 text-amber-400/80 font-bold tabular-nums">
                                      {Math.floor(entry.inputs.gold).toLocaleString()}
                                  </td>

                                  {/* Total Cost */}
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center bg-black/20 text-slate-200 font-bold tabular-nums">
                                      {Math.floor(entry.totalCost).toLocaleString()}
                                  </td>

                                  {/* Output */}
                                  <td className="px-1 py-3 border-r border-[var(--border-color)] text-center bg-white/5 tabular-nums">
                                      <div className="flex flex-col items-center gap-0.5">
                                          <div className="flex items-center gap-1 justify-center w-full">
                                            <span className="text-[10px] text-slate-400 tracking-tight">
                                                {entry.outputs.marketPrice.toLocaleString(undefined, { maximumFractionDigits: 2 })} x
                                            </span>
                                            {editingId === entry.id ? (
                                                <input 
                                                    type="number"
                                                    value={editValue}
                                                    onChange={(e) => setEditValue(e.target.value)}
                                                    onKeyDown={handleKeyDown}
                                                    onBlur={commitEditing}
                                                    autoFocus
                                                    className="w-12 bg-black/40 border border-[var(--color-primary)] rounded px-1 py-0 text-right text-white font-bold outline-none text-xs"
                                                />
                                            ) : (
                                                <span 
                                                    onClick={() => onUpdateEntry && startEditing(entry)}
                                                    className={`font-bold cursor-pointer hover:text-[var(--color-primary)] ${entry.outputs.actualCount ? 'text-[var(--color-accent)]' : 'text-white'}`}
                                                    title="클릭하여 수량 수정"
                                                >
                                                    {Math.floor(count).toLocaleString()}
                                                </span>
                                            )}
                                          </div>
                                          <div className="flex items-center justify-center gap-1 border-t border-white/10 pt-0.5 w-full">
                                            <span className="text-[10px] text-slate-400 tracking-tight">
                                                {viewMode === 'selling' ? '매출(95%)' : '가치(100%)'}
                                            </span>
                                            <span className="text-white font-bold text-[11px]">
                                                {Math.floor(revenue).toLocaleString()}
                                            </span>
                                          </div>
                                      </div>
                                  </td>

                                  {/* Profit */}
                                  <td className={`px-1 py-3 text-center border-r border-[var(--border-color)] font-black text-sm tabular-nums ${profit >= 0 ? (viewMode === 'selling' ? 'bg-[var(--color-success)]/10 text-[var(--color-success)]' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)]') : 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]'}`}>
                                      {profit > 0 ? '+' : ''}{Math.floor(profit).toLocaleString()}
                                  </td>

                                  {/* Delete */}
                                  {isDeleteMode && (
                                      <td className="px-2 py-3 text-center bg-[var(--color-danger)]/10">
                                          <button 
                                              onClick={() => onDelete(entry.id)}
                                              className="text-white bg-[var(--color-danger)] hover:brightness-110 transition-colors w-6 h-6 rounded flex items-center justify-center mx-auto"
                                              title="삭제"
                                          >
                                              ✕
                                          </button>
                                      </td>
                                  )}
                              </tr>
                              );
                          })}
                      </tbody>
                  </table>
              </div>
        ) : (
          <div className="text-center py-20 text-slate-500 flex-1 flex flex-col justify-center items-center">
              <p className="mb-2 text-4xl">📝</p>
              <p>아직 제작 기록이 없습니다.</p>
              <p className="text-sm mt-2">화면 공유(오버레이) 모드에서 '제작 완료'를 눌러 기록해보세요.</p>
          </div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-auto pt-4 border-t border-[var(--border-color)]/30">
                <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-white/5 transition-colors"
                >
                    &lt;
                </button>
                <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                        <button
                            key={page}
                            onClick={() => setCurrentPage(page)}
                            className={`w-6 h-6 rounded flex items-center justify-center text-xs font-bold transition-all ${currentPage === page ? 'bg-[var(--color-primary)] text-white' : 'text-[var(--text-secondary)] hover:bg-white/5'}`}
                        >
                            {page}
                        </button>
                    ))}
                </div>
                <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded bg-[var(--bg-main)] border border-[var(--border-color)] text-[var(--text-secondary)] disabled:opacity-30 hover:bg-white/5 transition-colors"
                >
                    &gt;
                </button>
            </div>
        )}
    </section>
  );
}

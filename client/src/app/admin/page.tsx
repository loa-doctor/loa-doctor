'use client'

import { useState, useEffect } from 'react'

type AdminMenu = 'raid' | 'gate' | 'phase'

export default function AdminPage() {
  const [loading, setLoading] = useState(false)
  const [feedback, setFeedback] = useState<{
    id: string
    message: string
    type: 'success' | 'error'
  } | null>(null)
  const [activeMenu, setActiveMenu] = useState<AdminMenu>('raid')

  const showFeedback = (id: string, message: string, type: 'success' | 'error' = 'success') => {
    setFeedback({ id, message, type })
    // 3초 후 자동 사라짐 (선택사항)
    setTimeout(() => {
      setFeedback(prev => (prev?.id === id ? null : prev))
    }, 3000)
  }

  const menuClass = (key: AdminMenu) =>
    `w-full text-left px-3 py-2 rounded-lg text-sm transition-colors
   ${
     activeMenu === key
       ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
       : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
   }`

  const resetRaid = async () => {
    const ID = 'reset'
    try {
      setLoading(true)
      setFeedback(null)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/raids/admin/reset`, {
        method: 'POST',
      })

      if (!res.ok) throw new Error('요청 실패')

      showFeedback(ID, '레이드 데이터 초기화 완료')
    } catch (err) {
      showFeedback(ID, '초기화 실패', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addKamenGate3Phase = async () => {
    const ID = 'gate3'
    try {
      setLoading(true)
      setFeedback(null)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/raids/admin/add-guides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boss: '카멘',
          difficulties: ['노말', '하드'],
          gates: [1, 2, 3],
          reset: true,
        }),
      })

      if (!res.ok) throw new Error('요청 실패')

      const data = await res.json()
      showFeedback(ID, `Phase ${data.inserted}개 생성 완료 (3관문)`)
    } catch (err) {
      showFeedback(ID, 'Phase 생성 실패', 'error')
    } finally {
      setLoading(false)
    }
  }

  const addKamenGate1Phase = async () => {
    const ID = 'gate1'
    try {
      setLoading(true)
      setFeedback(null)

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/raids/admin/add-guides`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          boss: '카멘',
          difficulties: ['노말'],
          gates: [1],
          reset: true,
          maxLine: 100, // 테스트용 100줄
        }),
      })

      if (!res.ok) throw new Error('요청 실패')

      const data = await res.json()
      showFeedback(ID, `Phase ${data.inserted}개 생성 완료 (1관문)`)
    } catch (err) {
      showFeedback(ID, 'Phase 생성 실패', 'error')
    } finally {
      setLoading(false)
    }
  }

  // 공통 결과 UI 렌더러
  const renderFeedback = (id: string) => {
    if (feedback?.id !== id) return null
    const isError = feedback.type === 'error'
    return (
      <div
        className={`text-xs rounded-lg px-3 py-2 mt-2 animate-in fade-in slide-in-from-top-1 ${
          isError ? 'bg-red-500/20 text-red-200' : 'bg-green-500/20 text-green-300'
        }`}
      >
        {feedback.message}
      </div>
    )
  }

  // ... (previous code)

  /* GUIDE CRUD STATE */
  const [guideBoss, setGuideBoss] = useState('카멘')
  const [guideDiff, setGuideDiff] = useState('하드')
  const [guideGate, setGuideGate] = useState('3관문')
  const [guideList, setGuideList] = useState<any[]>([])
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({
     line: '',
     phase: '',
     hint: '',
     imageUrl: ''
  })

  // Guide Fetching
  const fetchGuides = async () => {
    try {
        const gateNum = guideGate.replace('관문', '')
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/raids/guides?boss=${guideBoss}&difficulty=${guideDiff}&gate=${gateNum}`)
        const data = await res.json()
        setGuideList(data)
    } catch (e) {
        console.error(e)
    }
  }

  useEffect(() => {
    if (activeMenu === 'phase') fetchGuides()
  }, [activeMenu, guideBoss, guideDiff, guideGate])

  const handleSaveGuide = async () => {
      try {
          const gateNum = guideGate.replace('관문', '')
          
          let url = `${process.env.NEXT_PUBLIC_API_BASE}/api/raids/admin/guide`
          let method = 'POST'
          let body: any = {
              boss: guideBoss,
              difficulty: guideDiff,
              gate: gateNum,
              ...formData
          }

          if (editingId) {
              url += `/${editingId}`
              method = 'PUT'
          }

          const res = await fetch(url, {
              method,
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(body)
          })

          if (!res.ok) throw new Error('저장 실패')

          showFeedback('guide-save', editingId ? '수정 완료' : '생성 완료')
          setFormData({ line: '', phase: '', hint: '', imageUrl: '' })
          setEditingId(null)
          fetchGuides()
      } catch (e) {
          showFeedback('guide-save', '저장 오류', 'error')
      }
  }

  const handleDeleteGuide = async (id: string) => {
      if (!confirm('정말 삭제하시겠습니까?')) return
      try {
          await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/api/raids/admin/guide/${id}`, { method: 'DELETE' })
          showFeedback('guide-delete', '삭제 완료')
          fetchGuides()
      } catch (e) {
         showFeedback('guide-delete', '삭제 오류', 'error')
      }
  }

  const handleEdit = (guide: any) => {
      setEditingId(guide._id)
      setFormData({
          line: guide.line,
          phase: guide.phase,
          hint: guide.hint,
          imageUrl: guide.imageUrl || ''
      })
  }
  
  const cancelEdit = () => {
      setEditingId(null)
      setFormData({ line: '', phase: '', hint: '', imageUrl: '' })
  }

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 px-6 flex items-center border-b border-white/10 bg-[#0f111a]/80 backdrop-blur">
        <h1 className="font-bold text-lg">LOA Doctor Admin</h1>
        <span className="ml-3 text-[10px] text-slate-500 font-mono">DEV MODE</span>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-64 border-r border-white/10 p-4 space-y-4 bg-black/20 shrink-0">
          <div className="text-xs text-slate-500 uppercase tracking-widest mb-2">Data Control</div>

          <button
            className="w-full text-left px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-sm"
            onClick={() => {
              window.location.href = '/'
            }}
          >
            홈으로
          </button>

          <button onClick={() => setActiveMenu('raid')} className={menuClass('raid')}>
            레이드 관리
          </button>

          <button onClick={() => setActiveMenu('gate')} className={menuClass('gate')}>
            관문 관리 (미구현)
          </button>

          <button onClick={() => setActiveMenu('phase')} className={menuClass('phase')}>
            Phase 가이드 관리
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8 overflow-auto">
        {activeMenu === 'raid' && (
            <>
            <h2 className="text-xl font-bold mb-6">레이드 데이터 관리</h2>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Card */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <h3 className="font-semibold text-sm">전체 레이드 초기화</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  모든 레이드 기초 값으로 다시 생성
                </p>
                <button
                  onClick={resetRaid}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 font-bold text-sm transition-all"
                >
                  {loading ? '초기화 중...' : '레이드 초기화 실행'}
                </button>
                {renderFeedback('reset')}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <h3 className="font-semibold text-sm">카멘 3관문 Phase 자동 생성</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  카멘 3관문 줄 수 기반 Phase 가이드 (1000 → 10줄)
                </p>
                <button
                  onClick={addKamenGate3Phase}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 font-bold text-sm transition-all"
                >
                  {loading ? 'Phase 생성 중...' : '카멘 3관문 Phase 생성'}
                </button>
                {renderFeedback('gate3')}
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <h3 className="font-semibold text-sm">카멘 1관문(테스트) Phase 생성</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                   카멘 1관문 테스트용 가이드 생성 (100줄)
                </p>
                <button
                  onClick={addKamenGate1Phase}
                  disabled={loading}
                  className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 font-bold text-sm transition-all"
                >
                  {loading ? 'Phase 생성 중...' : '카멘 1관문 생성'}
                </button>
                {renderFeedback('gate1')}
              </div>
            </div>
            </>
        )}

        {activeMenu === 'phase' && (
            <div className="flex gap-6 h-full">
                {/* Left: Input Form */}
                <div className="w-1/3 min-w-[300px] flex flex-col gap-6">
                    <div className="p-6 rounded-2xl border border-white/10 bg-white/[0.03] space-y-4">
                        <h3 className="font-bold text-lg">{editingId ? '가이드 수정' : '새 가이드 추가'}</h3>
                        
                        <div className="space-y-4">
                           {/* Filters (Selects) */}
                           <div className="grid grid-cols-3 gap-2">
                               <input value={guideBoss} onChange={e=>setGuideBoss(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-xs" placeholder="카멘" />
                               <input value={guideDiff} onChange={e=>setGuideDiff(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-xs" placeholder="하드" />
                               <input value={guideGate} onChange={e=>setGuideGate(e.target.value)} className="bg-black/40 border border-white/10 rounded px-3 py-2 text-xs" placeholder="3관문" />
                           </div>
                           
                           <div className="space-y-2">
                               <label className="text-xs text-slate-500">줄 수</label>
                               <input type="number" 
                                      value={formData.line} 
                                      onChange={e => setFormData({...formData, line: e.target.value})}
                                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" 
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs text-slate-500">기믹 제목</label>
                               <input 
                                      value={formData.phase} 
                                      onChange={e => setFormData({...formData, phase: e.target.value})}
                                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" 
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs text-slate-500">힌트 (내용)</label>
                               <textarea 
                                      value={formData.hint} 
                                      onChange={e => setFormData({...formData, hint: e.target.value})}
                                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm h-24 resize-none" 
                               />
                           </div>
                           <div className="space-y-2">
                               <label className="text-xs text-slate-500">이미지 URL (Optional)</label>
                               <input 
                                      value={formData.imageUrl} 
                                      onChange={e => setFormData({...formData, imageUrl: e.target.value})}
                                      className="w-full bg-black/40 border border-white/10 rounded px-3 py-2 text-sm" 
                               />
                           </div>

                           <div className="flex gap-2 pt-2">
                               <button onClick={handleSaveGuide} className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 rounded-lg text-sm font-bold">
                                   {editingId ? '수정 저장' : '추가하기'}
                               </button>
                               {editingId && (
                                   <button onClick={cancelEdit} className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-lg text-sm font-bold">
                                       취소
                                   </button>
                               )}
                           </div>
                           {renderFeedback('guide-save')}
                        </div>
                    </div>
                </div>

                {/* Right: List */}
                <div className="flex-1 rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden flex flex-col">
                    <div className="p-4 border-b border-white/10 bg-black/20 flex justify-between items-center">
                        <h3 className="font-bold text-sm">등록된 가이드 목록 ({guideList.length})</h3>
                        <button onClick={fetchGuides} className="text-xs text-blue-400 hover:text-blue-300">새로고침</button>
                    </div>
                    <div className="flex-1 overflow-auto p-4 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
                        {guideList.map((guide) => (
                            <div key={guide._id} className="flex items-start gap-4 p-4 rounded-xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors group">
                                <div className="w-16 shrink-0 text-center">
                                    <div className="text-xl font-black text-blue-500">{guide.line}</div>
                                    <div className="text-[10px] text-slate-500">줄</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-slate-200 mb-1">{guide.phase}</h4>
                                    <p className="text-xs text-slate-400 leading-relaxed">{guide.hint}</p>
                                    {guide.imageUrl && (
                                        <div className="mt-2 text-[10px] text-blue-400 truncate">{guide.imageUrl}</div>
                                    )}
                                </div>
                                <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => handleEdit(guide)} className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-xs text-slate-300">수정</button>
                                    <button onClick={() => handleDeleteGuide(guide._id)} className="px-3 py-1.5 rounded bg-red-500/10 hover:bg-red-500/20 text-xs text-red-500">삭제</button>
                                </div>
                            </div>
                        ))}
                        {guideList.length === 0 && (
                            <div className="text-center py-20 text-slate-500 text-sm">
                                데이터가 없습니다.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}
        </main>
      </div>
    </div>
  )
}

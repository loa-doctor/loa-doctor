'use client'

import { useState } from 'react'

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

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 flex flex-col">
      {/* Top Bar */}
      <header className="h-14 px-6 flex items-center border-b border-white/10 bg-[#0f111a]/80 backdrop-blur">
        <h1 className="font-bold text-lg">LOA Doctor Admin</h1>
        <span className="ml-3 text-[10px] text-slate-500 font-mono">DEV MODE</span>
      </header>

      <div className="flex flex-1">
        <aside className="w-64 border-r border-white/10 p-4 space-y-4 bg-black/20">
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
            관문 관리
          </button>

          <button onClick={() => setActiveMenu('phase')} className={menuClass('phase')}>
            Phase 관리
          </button>
        </aside>

        {/* Main Content */}
        {activeMenu === 'raid' && (
          <main className="flex-1 p-8 overflow-auto">
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
                  카멘 3관문 줄 수 기반 Phase 가이드를 자동으로 생성합니다.
                  <br />
                  (1000 → 10줄, 기존 데이터는 초기화됩니다)
                </p>

                <button
                  onClick={addKamenGate3Phase}
                  disabled={loading}
                  className="
                    w-full py-3 rounded-xl
                    bg-blue-600 hover:bg-blue-500
                    disabled:opacity-50
                    font-bold text-sm transition-all
                    "
                >
                  {loading ? 'Phase 생성 중...' : '카멘 3관문 Phase 생성'}
                </button>

                {renderFeedback('gate3')}
              </div>

              {/* 카멘 1관문 (테스트) 추가 */}
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-6 space-y-4">
                <h3 className="font-semibold text-sm">카멘 1관문(가디언/테스트) Phase 생성</h3>

                <p className="text-xs text-slate-400 leading-relaxed">
                  카멘 1관문 가이드 생성 (테스트용 100줄)
                  <br />
                  (100줄 시작, 10줄 단위 기믹)
                </p>

                <button
                  onClick={addKamenGate1Phase}
                  disabled={loading}
                  className="
                    w-full py-3 rounded-xl
                    bg-purple-600 hover:bg-purple-500
                    disabled:opacity-50
                    font-bold text-sm transition-all
                    "
                >
                  {loading ? 'Phase 생성 중...' : '카멘 1관문(테스트) Phase 생성'}
                </button>
                {renderFeedback('gate1')}
              </div>
            </div>
          </main>
        )}
      </div>
    </div>
  )
}

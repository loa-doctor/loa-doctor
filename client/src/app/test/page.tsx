'use client'

import { useEffect, useState } from 'react'

export default function Test() {
  const [status, setStatus] = useState('loading...')

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setStatus(JSON.stringify(data)))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <main className="min-h-screen bg-[var(--bg-main)] text-slate-100 flex items-center justify-center">
      <div className="w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--bg-panel)] p-6 shadow-xl">
        {/* 타이틀 */}
        <h1 className="text-2xl font-bold mb-4 text-center">TestPage</h1>

        {/* API 상태 */}
        <div className="mb-4 rounded-md bg-black/30 p-3 text-sm">
          <span className="font-semibold">API STATUS:</span>{' '}
          <span className="text-green-400 break-all">{status}</span>
        </div>

        {/* 버튼 테스트 */}
        <button
          className="
            w-full rounded-md
            bg-blue-600 hover:bg-blue-500
            active:scale-[0.98]
            py-2 text-sm font-semibold
            transition
          "
        >
          Hover / Active Test
        </button>

        {/* 반응형 테스트 */}
        <div className="mt-4 text-center text-xs text-slate-400">
          <span className="block sm:hidden">📱 Mobile</span>
          <span className="hidden sm:block md:hidden">📲 Tablet</span>
          <span className="hidden md:block">🖥 Desktop</span>
        </div>
      </div>
    </main>
  )
}

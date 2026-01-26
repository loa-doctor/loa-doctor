'use client'

import { useEffect, useState } from 'react'

export const ApiChecker = ({ status }: { status: string }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="max-w-md mx-auto mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">
      <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">
        System Check
      </h2>

      {/* API 상태 체크 */}

      <div className="mb-4 rounded-lg bg-black/40 p-3 text-sm border border-white/5">
        <span className="font-semibold text-slate-300">API STATUS:</span>{' '}
        <span className={status === 'error' ? 'text-red-400' : 'text-green-400'}>{status}</span>
      </div>

      {/* 반응형 디바이스 체크 */}

      <div className="py-2 px-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-center text-xs text-blue-300">
        <span className="block sm:hidden">📱 Mobile Mode Optimized</span>

        <span className="hidden sm:block md:hidden">📲 Tablet Mode Optimized</span>

        <span className="hidden md:block">🖥 Desktop Mode Optimized</span>
      </div>

      <p className="mt-4 text-[10px] text-slate-500 text-center">
        환경 진단 결과가 정상이면 분석을 시작할 수 있습니다.
      </p>
    </div>
  )
}

'use client'

import { useEffect, useState } from 'react'

import Link from 'next/link'
import { ApiChecker } from './components/ApiChecker'

export default function HomePage() {
  const [status, setStatus] = useState('loading...')

  // 기존 API 헬스 체크 로직 유지

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())

      .then(data => setStatus(JSON.stringify(data)))

      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 selection:bg-blue-500/30">
      {/* 네비게이션 바 */}
      <main className="max-w-6xl mx-auto px-6 pt-20 pb-16">
        <div className="flex flex-col items-center text-center mb-16">
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-[var(--color-primary)]/30 bg-[var(--color-primary)]/10 text-[var(--color-primary)] text-sm font-medium">
            로스트아크 스마트 도우미
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">
            스마트 제작 & 보석 효율을 <br />
            <span className="text-[var(--color-primary)]">한눈에</span> 확인하세요
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
            API 기반의 정확한 시세 정보 연동으로 <br />
            제작 및 보석 합성 이익을 손쉽게 계산할 수 있습니다. <br />
            LOA Doctor와 함께 스마트한 게임을 즐겨보세요!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/gem-efficiency"
              className="px-8 py-4 bg-[var(--color-primary)] hover:opacity-90 rounded-xl font-bold text-lg transition-all shadow-lg active:scale-95"
            >
              보석 효율 계산기
            </Link>
            <Link
              href="/smart-crafting"
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-lg transition-all shadow-lg shadow-black/20 active:scale-95 border border-white/5"
            >
              스마트 제작 관리자
            </Link>
          </div>
          {process.env.NEXT_PUBLIC_ENABLE_ANALYZE === 'true' && (
             <div className="mt-8">
               <Link
                 href="/analyze"
                 className="px-4 py-2 bg-blue-600/20 text-blue-400 border border-blue-600/30 hover:bg-blue-600/30 rounded-lg text-sm transition-all"
               >
                 레이드 공략 (관리자 전용)
               </Link>
             </div>
          )}
        </div>

        {/* 시스템 진단 섹션 (기존 코드 기능 통합) */}
        {process.env.NEXT_PUBLIC_ENABLE_ANALYZE === 'true' && process.env.NEXT_PUBLIC_APP_ENV === 'local' && <ApiChecker status={status}/>}
      </main>
    </div>
  )
}

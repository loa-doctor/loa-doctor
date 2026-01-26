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
          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium">
            실시간 로스트아크 레이드 공략
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">
            레이드 공략을 <br />
            <span className="text-blue-500">실시간</span>으로 확인하세요
          </h1>

          <p className="text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">
            LOA Doctor는 보스의 체력을 실시간으로 분석하여, <br />
            다음 기믹과 공략 정보를 즉시 표시합니다. <br />
            기믹을 놓치지 않고 완벽한 공략을 경험하세요!
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link
              href="/analyze"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95"
            >
              지금 시작하기
            </Link>
          </div>
        </div>

        {/* 시스템 진단 섹션 (기존 코드 기능 통합) */}
        {process.env.NEXT_PUBLIC_APP_ENV === 'local' && <ApiChecker status={status}/>}
      </main>
    </div>
  )
}

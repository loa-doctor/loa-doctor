'use client'



import { useEffect, useState } from 'react'

import Link from 'next/link'



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

      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center">

        <div className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">

          LOA Doctor

        </div>

      </nav>



      <main className="max-w-6xl mx-auto px-6 pt-20 pb-16">

        <div className="flex flex-col items-center text-center mb-16">

          <div className="inline-block px-4 py-1.5 mb-6 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-sm font-medium">

            실시간 로스트아크 패턴 분석기

          </div>

         

          <h1 className="text-5xl md:text-7xl font-extrabold mb-8 tracking-tight">

            레이드 공략을 <br />

            <span className="text-blue-500">실시간</span>으로 확인하세요  

          </h1>

         

          <p className="text-lg text-slate-400 mb-10 max-w-2xl leading-relaxed">

            LOA Doctor는 보스의 HP 수치를 기반으로, <br />
            
            레이드의 공략을 실시간으로 표시합니다. <br />

            이제 공략을 외우지 말고, 화면 옆 PiP 창을 보며 판단에만 집중하세요.

          </p>



          <div className="flex flex-col sm:flex-row gap-4">

            <Link href="/analyze" className="px-8 py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-lg transition-all shadow-lg shadow-blue-600/20 active:scale-95">

              지금 시작하기

            </Link>

          </div>

        </div>



        {/* 시스템 진단 섹션 (기존 코드 기능 통합) */}

        <div className="max-w-md mx-auto mt-12 rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm">

          <h2 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">System Check</h2>

         

          {/* API 상태 체크 */}

          <div className="mb-4 rounded-lg bg-black/40 p-3 text-sm border border-white/5">

            <span className="font-semibold text-slate-300">API STATUS:</span>{' '}

            <span className={status === 'error' ? 'text-red-400' : 'text-green-400'}>

              {status}

            </span>

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

      </main>



      {/* 하단 푸터 느낌의 특징 요약 */}

      <section className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-3 gap-6 border-t border-white/5 mt-10">

        <div className="text-center md:text-left">

          <h3 className="font-bold text-slate-200">실시간 화면 분석</h3>

          <p className="text-sm text-slate-500">OpenCV 기반 패턴 감지</p>

        </div>

        <div className="text-center md:text-left">

          <h3 className="font-bold text-slate-200">PiP 모드 지원</h3>

          <p className="text-sm text-slate-500">게임 창 위 가이드 오버레이</p>

        </div>

        <div className="text-center md:text-left">

          <h3 className="font-bold text-slate-200">무설치 웹 서비스</h3>

          <p className="text-sm text-slate-500">브라우저에서 즉시 실행</p>

        </div>

      </section>

    </div>

  )

}
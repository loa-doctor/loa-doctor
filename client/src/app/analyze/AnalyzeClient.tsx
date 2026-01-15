'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ScreenCaptureContainer,
  ScreenCaptureHandle,
} from '@/src/features/screen-capture/ScreenCaptureContainer'

type Raid = {
  name: string
  gates: { gateNumber: number; name: string }[]
}

type PhaseGuide = {
  line: number
  phase: string
  hint: string
}

export default function AnalyzeClient({ raids }: { raids: Raid[] }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const pipWindowRef = useRef<Window | null>(null)
  const captureRef = useRef<ScreenCaptureHandle | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedRaid, setSelectedRaid] = useState('카멘')
  const [selectedGate, setSelectedGate] = useState('1관문')
  const [currentGuide, setCurrentGuide] = useState({
    hpPhase: '분석 대기 중',
    hint: '레이드와 관문을 선택하고 PiP를 실행하세요.',
  })

  const [phaseGuides, setPhaseGuides] = useState<PhaseGuide[]>([])
  const lastTriggeredLineRef = useRef<number | null>(null)

  useEffect(() => {
    const gateNumber = Number(selectedGate.replace('관문', ''))

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/raids/guides?raid=${selectedRaid}&gate=${gateNumber}`
    )
      .then(res => res.json())
      .then(data => {
        setPhaseGuides(data)
        lastTriggeredLineRef.current = null // 관문 변경 시 초기화
      })
  }, [selectedRaid, selectedGate])

  const handleLineDetected = useCallback(
    (currentLine: number) => {
      // 1️⃣ 이미 트리거된 phase보다 "아래"만 보도록 제한
      const next = phaseGuides.find(guide => {
        if (lastTriggeredLineRef.current !== null) {
          return currentLine <= guide.line && guide.line < lastTriggeredLineRef.current
        }
        return currentLine <= guide.line
      })

      if (!next) return

      lastTriggeredLineRef.current = next.line

      setCurrentGuide({
        hpPhase: next.phase,
        hint: next.hint,
      })
    },
    [phaseGuides]
  )

  const raidMap = useMemo(() => {
    const map: Record<string, string[]> = {}
    raids.forEach(r => {
      map[r.name] = r.gates.map(g => g.name)
    })
    return map
  }, [raids])

  const openGuidePip = async () => {
    if (!('documentPictureInPicture' in window)) return alert('Document PiP 미지원 브라우저입니다.')
    try {
      // @ts-ignore
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 320,
        height: 220,
      })
      pipWindowRef.current = pipWindow
      const styleTags = Array.from(document.styleSheets)
        .filter(s => s.href === null || s.href.startsWith(location.origin))
        .map(s => {
          const style = document.createElement('style')
          style.textContent = Array.from(s.cssRules)
            .map(r => r.cssText)
            .join('')
          return style
        })
      styleTags.forEach(s => pipWindow.document.head.appendChild(s))
      updatePipUI(pipWindow)
      pipWindow.addEventListener('pagehide', () => {
        pipWindowRef.current = null
      })
    } catch (err) {
      console.error(err)
    }
  }

  const updatePipUI = (pipWin: Window) => {
    const doc = pipWin.document
    doc.body.innerHTML = ''
    doc.body.className = 'bg-[#0f111a] text-slate-100 font-sans overflow-hidden select-none'
    const root = doc.createElement('div')
    root.className = 'p-4 h-full flex flex-col justify-between border-t-2 border-blue-500/50'
    root.innerHTML = `
      <div>
        <div class="flex justify-between items-center mb-1">
          <span class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">LOA DOCTOR GUIDE</span>
          <div class="flex items-center gap-1.5"><div class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div><span class="text-[9px] text-slate-500 font-mono">LIVE</span></div>
        </div>
        <h1 class="text-base font-bold text-slate-200">${selectedRaid} <span class="text-slate-500 text-xs font-normal">${selectedGate}</span></h1>
      </div>
      <div class="bg-blue-500/10 rounded-xl border border-blue-500/20 p-3 my-2">
        <div class="text-[9px] text-blue-400 font-semibold mb-1 uppercase tracking-wider">Phase</div>
        <div class="text-lg font-bold text-white leading-none">${currentGuide.hpPhase}</div>
      </div>
      <div class="mt-1">
        <p class="text-sm font-medium leading-snug text-slate-300 break-keep">${currentGuide.hint}</p>
      </div>
    `
    doc.body.appendChild(root)
  }

  useEffect(() => {
    if (pipWindowRef.current) updatePipUI(pipWindowRef.current)
  }, [selectedRaid, selectedGate, currentGuide])

  return (
    <div className="min-h-screen bg-[#0f111a] text-slate-100 selection:bg-blue-500/30">
      {/* 네비게이션 바 (메인 페이지와 통일) */}
      <nav className="border-b border-white/10 px-6 py-4 flex justify-between items-center bg-[#0f111a]/80 backdrop-blur-md sticky top-0 z-50">
        <div
          className="text-xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent cursor-pointer"
          onClick={() => router.push('/')}
        >
          LOA Doctor
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          Analysis Mode
        </div>
      </nav>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* 왼쪽 설정 패널: 메인 페이지 'System Check' 스타일 적용 */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-sm shadow-xl">
              <h2 className="text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">
                Raid Configuration
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                    레이드 선택
                  </label>
                  <select
                    value={selectedRaid}
                    onChange={e => {
                      const raid = e.target.value
                      setSelectedRaid(raid)
                      setSelectedGate(raidMap[raid][0])
                    }}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all text-slate-200"
                  >
                    {raids.map(r => (
                      <option key={r.name} value={r.name}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-500 mb-2 uppercase tracking-widest">
                    관문 선택
                  </label>
                  <select
                    value={selectedGate}
                    onChange={e => setSelectedGate(e.target.value)}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm focus:border-blue-500/50 outline-none transition-all text-slate-200"
                  >
                    {raidMap[selectedRaid]?.map(gate => (
                      <option key={gate} value={gate}>
                        {gate}
                      </option>
                    ))}{' '}
                  </select>
                </div>
              </div>

              <div className="mt-8 space-y-3">
                {!isCapturing ? (
                  <button
                    onClick={() => {
                      captureRef.current?.startCapture()
                      setIsCapturing(true)
                    }}
                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-all shadow-lg shadow-blue-600/20 active:scale-95"
                  >
                    화면 공유 시작
                  </button>
                ) : (
                  <>
                    <button
                      onClick={openGuidePip}
                      className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-xl font-bold text-sm transition-all active:scale-95"
                    >
                      공략 가이드 오버레이(PiP) 실행
                    </button>
                    <button
                      onClick={() => {
                        captureRef.current?.stopCapture()
                        setIsCapturing(false)
                      }}
                      className="w-full py-3 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                    >
                      분석 중단
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="py-3 px-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center text-[10px] text-blue-300">
              {isCapturing
                ? '● 실시간 화면 분석 엔진 가동 중'
                : '분석 시작을 위해 화면을 공유해주세요'}
            </div>
          </div>

          {/* 오른쪽 프리뷰 패널 */}

          {/* 오른쪽 프리뷰 패널 */}
          <div className="lg:col-span-8">
            <div
              className="
                    rounded-2xl 
                    border border-white/10 
                    bg-black/30 
                    backdrop-blur-sm 
                    shadow-xl
                    overflow-hidden
                "
            >
              <ScreenCaptureContainer ref={captureRef} embed onLineDetected={handleLineDetected} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

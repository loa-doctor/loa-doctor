'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ScreenCaptureContainer,
  ScreenCaptureHandle,
} from '@/src/features/screen-capture/ScreenCaptureContainer'

type Raid = {
  name: string
  difficulties: {
    name: string
    gates: string[] // ["1관문", "2관문"]
  }[]
}

type PhaseGuide = {
  line: number
  phase: string
  hint: string
}

type AnalysisStatus =
  | 'IDLE' // 분석 대기
  | 'RUNNING' // 분석 중 (숫자 인식됨)
  | 'GUIDE' // 가이드 표시 중
  | 'RETRY' // 리트라이 대기

export default function AnalyzeClient({ raids }: { raids: Raid[] }) {
  const router = useRouter()
  const videoRef = useRef<HTMLVideoElement>(null)
  const pipWindowRef = useRef<Window | null>(null)
  const captureRef = useRef<ScreenCaptureHandle | null>(null)
  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedRaid, setSelectedRaid] = useState('')
  const [selectedDifficulty, setSelectedDifficulty] = useState('')
  const [selectedGate, setSelectedGate] = useState('')
  const [currentGuide, setCurrentGuide] = useState({
    hpPhase: '분석 대기 중',
    hint: '레이드와 관문을 선택하고 PiP를 실행하세요.',
  })

  const statusLabelMap: Record<AnalysisStatus, { title: string; hint: string }> = {
    IDLE: {
      title: '분석 대기 중',
      hint: '숫자가 인식되면 자동으로 분석을 시작합니다.',
    },
    RUNNING: {
      title: '분석 중',
      hint: '보스 줄 수를 실시간으로 분석하고 있습니다.',
    },
    GUIDE: {
      title: currentGuide.hpPhase,
      hint: currentGuide.hint,
    },
    RETRY: {
      title: '리 트라이 대기',
      hint: '숫자 인식이 중단되었습니다.',
    },
  }

  const [phaseGuides, setPhaseGuides] = useState<PhaseGuide[]>([])
  const lastTriggeredLineRef = useRef<number | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE')
  const lastDetectedAtRef = useRef<number | null>(null)
  const runningSinceRef = useRef<number | null>(null)

  const display = statusLabelMap[analysisStatus]

  useEffect(() => {
    if (!selectedRaid || !selectedDifficulty || !selectedGate) return

    const gateNumber = Number(selectedGate.replace('관문', ''))

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/raids/guides?boss=${selectedRaid}&difficulty=${selectedDifficulty}&gate=${gateNumber}`
    )
      .then(res => res.json())
      .then(data => {
        setPhaseGuides(data)
        lastTriggeredLineRef.current = null // 관문 변경 시 초기화
      })
  }, [selectedRaid, selectedGate, selectedDifficulty])

  const handleLineDetected = useCallback(
    (currentLine: number) => {
      const now = Date.now()
      lastDetectedAtRef.current = now

      // 🔥 RUNNING 최초 진입 시점 기록
      setAnalysisStatus(prev => {
        if (prev === 'IDLE' || prev === 'RETRY') {
          runningSinceRef.current = now
          return 'RUNNING'
        }
        return prev
      })

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

      setAnalysisStatus('GUIDE')
    },
    [phaseGuides]
  )

  const raidMap = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {}

    raids.forEach(r => {
      map[r.name] = {}
      r.difficulties.forEach(d => {
        map[r.name][d.name] = d.gates
      })
    })

    return map
  }, [raids])

  useEffect(() => {
    if (!raids.length) return

    const firstRaid = raids[0]
    const firstDifficulty = firstRaid.difficulties[0]
    const firstGate = firstDifficulty.gates[0]

    setSelectedRaid(firstRaid.name)
    setSelectedDifficulty(firstDifficulty.name)
    setSelectedGate(firstGate)
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

  const closeGuidePip = () => {
    if (pipWindowRef.current) {
      try {
        pipWindowRef.current.close()
      } catch (e) {
        // 이미 닫혔을 수도 있음
      }
      pipWindowRef.current = null
    }
  }

  const stopAnalysis = () => {
    // 1. 화면 캡처 중단
    captureRef.current?.stopCapture()
    setIsCapturing(false)

    // 2. PiP 닫기
    closeGuidePip()

    // 3. 가이드 / OCR 상태 초기화
    setPhaseGuides([])
    setCurrentGuide({
      hpPhase: '분석 대기 중',
      hint: '레이드와 관문을 선택하고 PiP를 실행하세요.',
    })
    setAnalysisStatus('IDLE')
    lastDetectedAtRef.current = null
    runningSinceRef.current = null

    // 4. 라인 트리거 초기화
    lastTriggeredLineRef.current = null
  }

  useEffect(() => {
    if (!isCapturing) return

    const interval = setInterval(() => {
      const last = lastDetectedAtRef.current
      if (!last) return

      const diff = Date.now() - last

      // 3초 이상 숫자 인식 안 되면 리트라이
      const MIN_RUNNING_TIME = 2000 // 2초 보장

      if (
        diff > 3000 &&
        runningSinceRef.current &&
        Date.now() - runningSinceRef.current > MIN_RUNNING_TIME
      ) {
        setAnalysisStatus('RETRY')
        setCurrentGuide({
          hpPhase: '리 트라이 대기',
          hint: '보스 재도전 또는 컷신 상태입니다.',
        })
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [isCapturing])

  const updatePipUI = (pipWin: Window) => {
    const display = statusLabelMap[analysisStatus] // 🔥 여기서 다시 계산

    const doc = pipWin.document
    doc.body.innerHTML = ''
    doc.body.className = 'bg-[#0f111a] text-slate-100 font-sans overflow-hidden select-none'

    const root = doc.createElement('div')
    root.className = 'p-4 h-full flex flex-col justify-between border-t-2 border-blue-500/50'

    root.innerHTML = `
    <div>
      <div class="flex justify-between items-center mb-1">
        <span class="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
          LOA DOCTOR GUIDE
        </span>
        <div class="flex items-center gap-1.5">
          <div class="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse"></div>
          <span class="text-[9px] text-slate-500 font-mono">LIVE</span>
        </div>
      </div>
      <h1 class="text-base font-bold text-slate-200">
        ${selectedRaid}
        <span class="text-slate-500 text-xs font-normal">${selectedGate}</span>
      </h1>
    </div>

    <div class="bg-blue-500/10 rounded-xl border border-blue-500/20 p-3 my-2">
      <div class="text-[9px] text-blue-400 font-semibold mb-1 uppercase tracking-wider">
        Status
      </div>
      <div class="text-lg font-bold text-white leading-none">
        ${display.title}
      </div>
    </div>

    <div class="mt-1">
      <p class="text-sm font-medium leading-snug text-slate-300 break-keep">
        ${display.hint}
      </p>
    </div>
  `

    doc.body.appendChild(root)
  }

  useEffect(() => {
    return () => {
      captureRef.current?.stopCapture()
      closeGuidePip()
      lastTriggeredLineRef.current = null
    }
  }, [])

  useEffect(() => {
    if (pipWindowRef.current) {
      updatePipUI(pipWindowRef.current)
    }
  }, [selectedRaid, selectedGate, currentGuide, analysisStatus])

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
                      const firstDifficulty = raids.find(r => r.name === raid)?.difficulties[0]

                      setSelectedRaid(raid)
                      setSelectedDifficulty(firstDifficulty?.name ?? '')
                      setSelectedGate(firstDifficulty?.gates[0] ?? '')
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
                    난이도 선택
                  </label>
                  <select
                    value={selectedDifficulty}
                    onChange={e => {
                      const diff = e.target.value
                      setSelectedDifficulty(diff)
                      setSelectedGate(raidMap[selectedRaid][diff][0])
                    }}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-sm"
                  >
                    {Object.keys(raidMap[selectedRaid] ?? {}).map(diff => (
                      <option key={diff} value={diff}>
                        {diff}
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
                    {(raidMap[selectedRaid]?.[selectedDifficulty] ?? []).map(gate => (
                      <option key={gate} value={gate}>
                        {gate}
                      </option>
                    ))}
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
                      onClick={stopAnalysis}
                      className="w-full py-3 text-red-400 hover:text-red-300 text-xs font-medium transition-colors"
                    >
                      분석 중단
                    </button>
                  </>
                )}
              </div>
            </div>

            <div
              className={`
                    py-3 px-4 rounded-xl border text-center text-[10px]
                    ${
                      analysisStatus === 'IDLE'
                        ? 'bg-white/5 border-white/10 text-slate-400'
                        : analysisStatus === 'RUNNING'
                          ? 'bg-blue-500/10 border-blue-500/20 text-blue-300'
                          : analysisStatus === 'GUIDE'
                            ? 'bg-green-500/10 border-green-500/20 text-green-300'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-300'
                    }
                `}
            >
              {display.title}
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

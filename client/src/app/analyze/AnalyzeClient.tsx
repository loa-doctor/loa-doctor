'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ScreenCaptureContainer,
  ScreenCaptureHandle,
} from '@/src/features/screen-capture/ScreenCaptureContainer'

type Raid = {
  name: string
  difficulties: { name: string; gates: string[] }[]
}

type PhaseGuide = { line: number; phase: string; hint: string }
type AnalysisStatus = 'IDLE' | 'RUNNING' | 'GUIDE' | 'RETRY_RESET'

export default function AnalyzeClient({ raids }: { raids: Raid[] }) {
  const router = useRouter()
  const pipWindowRef = useRef<Window | null>(null)
  const captureRef = useRef<ScreenCaptureHandle | null>(null)

  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedRaid, setSelectedRaid] = useState('카멘')
  const [selectedDifficulty, setSelectedDifficulty] = useState('하드')
  const [selectedGate, setSelectedGate] = useState('3관문')

  const [rawHp, setRawHp] = useState<number>(0)
  const [filteredHp, setFilteredHp] = useState<number>(0)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE')
  const [currentGuide, setCurrentGuide] = useState({
    hpPhase: '준비 완료',
    hint: '인식된 HP에 따라 가이드를 미리 표시합니다.',
  })

  const [phaseGuides, setPhaseGuides] = useState<PhaseGuide[]>([])
  const minLineReachedRef = useRef<number>(999)
  const stabilityRef = useRef({ lastVal: 0, count: 0 })
  const lastTriggeredLineRef = useRef<number | null>(null)

  useEffect(() => {
    const gateNumber = Number(selectedGate.replace('관문', ''))
    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/raids/guides?boss=${selectedRaid}&difficulty=${selectedDifficulty}&gate=${gateNumber}`
    )
      .then(res => res.json())
      .then(data => {
        setPhaseGuides(data.sort((a: any, b: any) => b.line - a.line))
        resetSession()
      })
  }, [selectedRaid, selectedGate, selectedDifficulty])

  const resetSession = useCallback(() => {
    lastTriggeredLineRef.current = null
    minLineReachedRef.current = 999
    stabilityRef.current = { lastVal: 0, count: 0 }
    setFilteredHp(0)
    setAnalysisStatus('RETRY_RESET')
    setCurrentGuide({ hpPhase: '전투 시작 대기', hint: 'HP 인식을 시작합니다.' })
  }, [])

  const handleLineDetected = useCallback(
    (currentLine: number) => {
      //TODO: 줄수가 2940 이런식으로 튀면 그냥 RawHP가 멈춰버리는 이슈 수정해야함.
      setRawHp(currentLine)
      // 1. 안정화 체크
      if (stabilityRef.current.lastVal === currentLine) {
        stabilityRef.current.count++
      } else {
        stabilityRef.current.lastVal = currentLine
        stabilityRef.current.count = 0
      }

      // 2. 리트라이 판정 (90줄 이상으로 확 튀었을 때만)
      // 77, 88 같은 오인식은 여기서 걸러지지 않도록 '패턴' 대신 '안정성'만 봅니다.
      if (currentLine >= phaseGuides[0].line && minLineReachedRef.current < 50) {
        if (stabilityRef.current.count >= 3) {
          resetSession()
        }
        //return
      }

      // 3. [핵심] 지능형 역행 차단
      // 줄 수는 '내려가는 것'이 정상입니다. 올라가는 것은 무조건 의심합니다.
      if (currentLine > minLineReachedRef.current) {
        // (A) 한 자릿수 구간 오인식 방어 (7줄인데 77이 들어오는 경우)
        if (
          minLineReachedRef.current < 10 &&
          currentLine === minLineReachedRef.current * 10 + minLineReachedRef.current
        ) {
          //return // 77은 무시하고 기존 7을 유지 (압축하지 않음)
        }

        // (B) 미세한 인식 오차(±2줄)는 허용하되, 그 이상은 3초 이상 안정화되어야 인정
        if (currentLine > minLineReachedRef.current + 2) {
          //if (stabilityRef.current.count < 10) return // 약 3초간 버텨야 역행 인정
        }
      }

      // 4. 데이터 확정
      if (currentLine < minLineReachedRef.current) {
        minLineReachedRef.current = currentLine
      }
      setFilteredHp(currentLine)

      // 5. 가이드 매칭
      const nextPreview = phaseGuides.find(guide => currentLine > guide.line)
      if (nextPreview && nextPreview.line !== lastTriggeredLineRef.current) {
        lastTriggeredLineRef.current = nextPreview.line
        setCurrentGuide({
          hpPhase: `${nextPreview.line}줄: ${nextPreview.phase}`,
          hint: nextPreview.hint,
        })
        setAnalysisStatus('GUIDE')
      }
    },
    [phaseGuides, resetSession]
  )

  // PiP 업데이트
  const updatePipUI = useCallback(
    (pipWin: Window) => {
      const doc = pipWin.document
      doc.body.innerHTML = ''
      doc.body.className =
        'bg-[#0a0a0c] text-[#e2e8f0] font-sans overflow-hidden select-none border-l-4 border-blue-600'
      const root = doc.createElement('div')
      root.className = 'flex flex-col h-full'
      root.innerHTML = `
      <div class="flex items-center justify-between px-4 py-2 bg-[#141417] border-b border-white/5">
        <div class="flex flex-col">
          <span class="text-[9px] font-black text-blue-500 uppercase tracking-tighter">RAID MONITOR</span>
          <span class="text-[12px] font-bold text-white/90">${selectedRaid} ${selectedGate}</span>
        </div>
        <div class="flex gap-4">
          <div class="flex flex-col items-end opacity-40">
            <span class="text-[7px] font-bold">RAW</span>
            <span class="text-[11px] font-black">${rawHp}</span>
          </div>
          <div class="flex flex-col items-end pl-3 border-l border-white/10">
            <span class="text-[9px] font-bold text-blue-500">HP</span>
            <span class="text-[18px] font-black text-white">${filteredHp}</span>
          </div>
        </div>
      </div>
      <div class="flex-1 flex flex-col justify-center px-4 py-3 bg-gradient-to-b from-transparent to-blue-900/10">
        <h2 class="text-[18px] font-black text-white leading-tight mb-1">${currentGuide.hpPhase}</h2>
        <p class="text-[12px] text-slate-400 line-clamp-2">${currentGuide.hint}</p>
      </div>
    `
      doc.body.appendChild(root)
    },
    [rawHp, filteredHp, currentGuide, selectedRaid, selectedGate]
  )

  useEffect(() => {
    if (pipWindowRef.current) updatePipUI(pipWindowRef.current)
  }, [rawHp, filteredHp, updatePipUI])

  const openGuidePip = async () => {
    if (!('documentPictureInPicture' in window)) return alert('PiP 미지원 브라우저입니다.')
    try {
      // @ts-ignore
      const pipWindow = await window.documentPictureInPicture.requestWindow({
        width: 340,
        height: 180,
      })
      pipWindowRef.current = pipWindow
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          const newStyle = document.createElement('style')
          const css = Array.from(styleSheet.cssRules)
            .map(rule => rule.cssText)
            .join('')
          newStyle.textContent = css
          pipWindow.document.head.appendChild(newStyle)
        } catch (e) {}
      })
      updatePipUI(pipWindow)
      pipWindow.addEventListener('pagehide', () => {
        pipWindowRef.current = null
      })
    } catch (err) {
      console.error('PiP 실패:', err)
    }
  }

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

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
      <nav className="border-b border-white/5 px-8 py-4 bg-black/50 backdrop-blur-xl sticky top-0 z-50">
        <div
          className="text-xl font-black text-white cursor-pointer"
          onClick={() => router.push('/')}
        >
          LOA DOCTOR
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-4 space-y-8">
            <section className="bg-white/[0.03] border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
              <div className="grid grid-cols-2 gap-4 mb-8">
                <div className="bg-black/40 p-4 rounded-2xl border border-white/5">
                  <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">OCR Raw</div>
                  <div className="text-3xl font-black text-slate-200">{rawHp}</div>
                </div>
                <div className="bg-blue-600/10 p-4 rounded-2xl border border-blue-500/20">
                  <div className="text-[10px] font-bold text-blue-400 uppercase mb-1">Filtered</div>
                  <div className="text-3xl font-black text-blue-500">{filteredHp}</div>
                </div>
              </div>
              <div className="space-y-4">
                <select
                  value={selectedRaid}
                  onChange={e => setSelectedRaid(e.target.value)}
                  className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold"
                >
                  {raids.map(r => (
                    <option key={r.name} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <div className="grid grid-cols-2 gap-3">
                  <select
                    value={selectedDifficulty}
                    onChange={e => setSelectedDifficulty(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    {Object.keys(raidMap[selectedRaid] || {}).map(d => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={selectedGate}
                    onChange={e => setSelectedGate(e.target.value)}
                    className="bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    {(raidMap[selectedRaid]?.[selectedDifficulty] || []).map(g => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-10 space-y-3">
                {!isCapturing ? (
                  <button
                    onClick={() => {
                      captureRef.current?.startCapture()
                      setIsCapturing(true)
                    }}
                    className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black transition-all shadow-xl shadow-blue-600/20 uppercase tracking-widest text-sm"
                  >
                    Analyze Start
                  </button>
                ) : (
                  <>
                    <button
                      onClick={openGuidePip}
                      className="w-full py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-black transition-all uppercase tracking-widest text-sm"
                    >
                      Open Overlay
                    </button>
                    <button
                      onClick={() => {
                        captureRef.current?.stopCapture()
                        setIsCapturing(false)
                      }}
                      className="w-full py-3 text-red-500/50 hover:text-red-500 text-xs font-bold transition-colors"
                    >
                      Stop Session
                    </button>
                  </>
                )}
              </div>
            </section>
          </div>
          <div className="lg:col-span-8">
            <div className="rounded-[40px] border border-white/5 bg-black/40 shadow-2xl aspect-video relative">
              <ScreenCaptureContainer ref={captureRef} embed onLineDetected={handleLineDetected} />
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

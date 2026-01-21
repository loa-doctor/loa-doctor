'use client'

import { useRef, useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import {
  ScreenCaptureContainer,
  ScreenCaptureHandle,
} from '@/src/features/screen-capture/ScreenCaptureContainer'
import { useRaidAnalysis } from '@/src/features/raid/hooks/useRaidAnalysis'
import { Raid, PhaseGuide } from '@/src/types/raid'

export default function AnalyzeClient({ raids }: { raids: Raid[] }) {
  const router = useRouter()
  const pipWindowRef = useRef<Window | null>(null)
  const captureRef = useRef<ScreenCaptureHandle | null>(null)

  const [isCapturing, setIsCapturing] = useState(false)
  const [selectedRaid, setSelectedRaid] = useState('카멘')
  const [selectedDifficulty, setSelectedDifficulty] = useState('하드')
  const [selectedGate, setSelectedGate] = useState('3관문')

  const [phaseGuides, setPhaseGuides] = useState<PhaseGuide[]>([])

  const {
    rawHp,
    filteredHp,
    analysisStatus,
    currentGuide,
    handleLineDetected,
    resetSession,
    setAnalysisStatus,
    setFilteredHp,
    setCurrentGuide
  } = useRaidAnalysis({ phaseGuides, selectedRaid, selectedGate })

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
  }, [selectedRaid, selectedGate, selectedDifficulty, resetSession])

  // PiP 업데이트
  const updatePipUI = useCallback(
    (pipWin: Window) => {
      const doc = pipWin.document
      const hasImage = !!currentGuide.imageUrl
      
      // 높이 계산: 여유 있게 조정
      // Header(40) + Text(100) + Padding(20) = 160px
      const BASE_HEIGHT = 160 
      const IMAGE_HEIGHT = 200
      const targetHeight = hasImage ? BASE_HEIGHT + IMAGE_HEIGHT : BASE_HEIGHT
      
      // 창 크기 조절 (requestAnimationFrame으로 렌더링 시점 동기화 시도)
      requestAnimationFrame(() => {
        try {
          // InnerHeight 차이만큼 resizeBy로 조절 (정확한 Viewport 크기 보장)
          const currentHeight = pipWin.innerHeight
          const diff = targetHeight - currentHeight
          
          if (Math.abs(diff) > 2) { // 2px 이상 차이날 때만 조절
             pipWin.resizeBy(0, diff)
          }
        } catch (e) {
          console.warn('PiP resize failed:', e)
        }
      })

      doc.body.innerHTML = ''
      doc.body.className =
        'bg-[#0a0a0c] text-[#e2e8f0] font-sans overflow-hidden select-none border-l-4 border-blue-600 flex flex-col'
      
      const root = doc.createElement('div')
      root.className = 'flex flex-col h-full'
      
      root.innerHTML = `
      <!-- Header -->
      <div class="flex items-center justify-between px-4 py-2 bg-[#141417] border-b border-white/5 h-[${40}px] shrink-0">
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

      <!-- Text Content (Top) -->
      <div class="flex flex-col justify-center px-4 py-3 bg-[#0a0a0c] shrink-0 h-[${100}px]">
        <h2 class="text-[18px] font-black text-white leading-tight mb-1">${currentGuide.hpPhase}</h2>
        <p class="text-[12px] text-slate-400 line-clamp-2 leading-relaxed">${currentGuide.hint}</p>
      </div>

      <!-- Image Content (Bottom) -->
      ${
        hasImage
          ? `
          <div class="flex-1 bg-black relative border-t border-white/10">
            <img src="${currentGuide.imageUrl}" class="absolute inset-0 w-full h-full object-contain" />
          </div>
          `
          : ''
      }
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
        height: 160, // 기본 높이 (Base Height)
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

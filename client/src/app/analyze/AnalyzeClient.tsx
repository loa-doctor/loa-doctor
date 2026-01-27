'use client'

import { useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  ScreenCaptureContainer,
  ScreenCaptureHandle,
} from '@/src/features/screen-capture/ScreenCaptureContainer'
import { useRaidAnalysis } from '@/src/features/raid/hooks/useRaidAnalysis'
import { Raid, PhaseGuide } from '@/src/types/raid'

const OverlayContent = ({ 
    window: targetWindow, 
    activeGuide, 
    upcomingGuide, 
    mainGuide, 
    rawHp, 
    filteredHp, 
    selectedRaid, 
    selectedGate,
    ocrConfidence
}: any) => {
    const rootRef = useRef<HTMLDivElement>(null)

    // Body Style override
    useEffect(() => {
        if (!targetWindow) return
        // Default to hidden, but if resize fails we might need auto.
        // We will try hidden first to satisfy "no scrollbar" request.
        targetWindow.document.body.style.overflow = 'hidden' 
        targetWindow.document.body.style.margin = '0'
        
        // Add scrollbar hiding styles just in case we need to enable overflow
        const style = targetWindow.document.createElement('style')
        style.textContent = `
            body::-webkit-scrollbar { display: none; }
            body { -ms-overflow-style: none; scrollbar-width: none; }
        `
        targetWindow.document.head.appendChild(style)
    }, [targetWindow])

    useLayoutEffect(() => {
        if (!rootRef.current || !targetWindow) return
        
        const adjustSize = () => {
            if (!rootRef.current || targetWindow.closed) return
            
            const contentHeight = rootRef.current.scrollHeight
            const currentHeight = targetWindow.innerHeight
            
            if (Math.abs(contentHeight - currentHeight) > 1) {
                const diff = contentHeight - currentHeight
                try {
                    // Best effort resize. If blocked by browser, we accept current size.
                    targetWindow.resizeBy(0, diff)
                } catch (e) {
                    // Do NOT enable scrollbars even if resize fails, per user preference.
                    // The user will see truncated content but no scrollbars.
                    // We set initial size larger to mitigate this.
                }
            }
        }

        adjustSize()
        const observer = new ResizeObserver(adjustSize)
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [targetWindow, activeGuide, upcomingGuide, mainGuide]) 

    // Helper Render
    const GuideBlock = ({ guide, type }: { guide: any, type: 'ACTIVE' | 'NEXT' }) => {
        if (!guide) return null
        const isActive = type === 'ACTIVE'
        return (
            <div className={`flex flex-col justify-center px-4 py-3 shrink-0 rounded-xl border relative ${
                isActive ? 'border-red-500/30 bg-red-500/5' : 'border-blue-500/20 bg-blue-500/5'
            }`}>
                <div className="flex items-center gap-2 mb-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        isActive ? 'bg-red-500 text-white' : 'bg-blue-500/20 text-blue-400'
                    }`}>
                        {type}
                    </span>
                    <h2 className="text-[15px] font-bold text-white leading-none truncate">{guide.hpPhase}</h2>
                </div>
                <p className="text-[13px] text-slate-300 leading-snug break-keep">{guide.hint}</p>
            </div>
        )
    }

    return (
        <div ref={rootRef} className="flex flex-col w-full h-screen bg-[#0a0a0c] text-[#e2e8f0] font-sans select-none border-l-4 border-blue-600 overflow-hidden box-border">
           {/* Header */}
           <div className="flex items-center justify-between px-5 py-3 bg-[#141417] border-b border-white/5 h-[48px] shrink-0 box-border">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">RAID MONITOR</span>
                <span className="text-[13px] font-bold text-white/90">{selectedRaid} {selectedGate}</span>
              </div>
              <div className="flex gap-4">
                <div className="flex flex-col items-end opacity-40">
                  <span className="text-[8px] font-bold">RAW</span>
                  <div className="flex items-center gap-1">
                      <span className="text-[11px] font-black">{rawHp}</span>
                      <span className="text-[9px] font-normal text-blue-300">{ocrConfidence ? `(${Math.round(ocrConfidence)}%)` : ''}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end pl-3 border-l border-white/10">
                  <span className="text-[10px] font-bold text-blue-500">HP</span>
                  <span className="text-[20px] font-black text-white leading-none">{filteredHp}</span>
                </div>
              </div>
           </div>

           {/* Guides */}
           {(activeGuide || upcomingGuide) && (
               <div className="flex flex-col flex-1 p-4 gap-3 shrink-0 box-border overflow-hidden">
                   <GuideBlock guide={activeGuide} type="ACTIVE" />
                   <GuideBlock guide={upcomingGuide} type="NEXT" />
               </div>
           )}

           {/* Image (Optional, hidden if not enough space or no image) */}
           {/* Only show image if we have plenty of space, or maybe just tiny thumbnail? 
               User asked for layout adjustment. Fixed 300px is small for image + text.
               We'll hide image for now to prioritize text readability in fixed mode as per "contents are cut" feedback previously.
           */}
           {false && mainGuide?.imageUrl && (
               <div className="bg-black relative border-t border-white/10 h-[100px] shrink-0 box-border">
                  <img src={mainGuide.imageUrl} className="absolute inset-0 w-full h-full object-contain" />
               </div>
           )}
        </div>
    )
}

export default function AnalyzeClient({ raids }: { raids: Raid[] }) {
  const router = useRouter()
  const pipWindowRef = useRef<Window | null>(null)
  const captureRef = useRef<ScreenCaptureHandle | null>(null)

  /* Persistence Logic */
  const [isCapturing, setIsCapturing] = useState(false)

  // Initialization fixed to prevent Hydration Error
  const [selectedRaid, setSelectedRaid] = useState(raids.length > 0 ? raids[0].name : '카멘')
  const [selectedDifficulty, setSelectedDifficulty] = useState('하드')
  const [selectedGate, setSelectedGate] = useState('3관문')

  // Load from localStorage after mount
  useEffect(() => {
      if (typeof window === 'undefined') return
      
      const savedRaid = localStorage.getItem('loa-doctor:selectedRaid')
      const savedDiff = localStorage.getItem('loa-doctor:selectedDifficulty')
      const savedGate = localStorage.getItem('loa-doctor:selectedGate')

      if (savedRaid && raids.some(r => r.name === savedRaid)) setSelectedRaid(savedRaid)
      if (savedDiff) setSelectedDifficulty(savedDiff)
      if (savedGate) setSelectedGate(savedGate)
  }, [raids])

  // Save to localStorage
  useEffect(() => {
     if (typeof window !== 'undefined') localStorage.setItem('loa-doctor:selectedRaid', selectedRaid)
  }, [selectedRaid])

  useEffect(() => {
     if (typeof window !== 'undefined') localStorage.setItem('loa-doctor:selectedDifficulty', selectedDifficulty)
  }, [selectedDifficulty])

  useEffect(() => {
     if (typeof window !== 'undefined') localStorage.setItem('loa-doctor:selectedGate', selectedGate)
  }, [selectedGate])

  const [phaseGuides, setPhaseGuides] = useState<PhaseGuide[]>([])

  /* Logic Update: Determine maxLines based on selection */
  const selectedMaxLines = useMemo(() => {
    const r = raids.find(r => r.name === selectedRaid)
    const d = r?.difficulties.find(d => d.name === selectedDifficulty)
    const g = d?.gates.find(g => g.name === selectedGate)
    return g?.maxLines || 0
  }, [raids, selectedRaid, selectedDifficulty, selectedGate])

  /* Conf state */
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>(undefined)

  const {
    rawHp,
    filteredHp,
    analysisStatus,
    activeGuide,
    upcomingGuide,
    handleLineDetected: onLineDetectedOriginal,
    resetSession,
    setAnalysisStatus,
    setFilteredHp,
  } = useRaidAnalysis({ phaseGuides, selectedRaid, selectedGate, maxLines: selectedMaxLines })

  const handleLineDetected = useCallback((line: number, confidence?: number) => {
      onLineDetectedOriginal(line, confidence)
      if (confidence !== undefined) setOcrConfidence(confidence)
  }, [onLineDetectedOriginal])

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
  
  /* PiP Window State */
  const [pipWindow, setPipWindow] = useState<Window | null>(null)

  const openGuidePip = async () => {
    if (!('documentPictureInPicture' in window)) return alert('PiP 미지원 브라우저입니다.')
    try {
      const width = 340
      const height = 300
      
      // @ts-ignore
      const win = await window.documentPictureInPicture.requestWindow({
        width,
        height,
      })
      
      // Positioning: Right - Middle
      // Need to use screen.availWidth/Height for better accuracy excluding taskbar
      try {
          const left = window.screen.availWidth - width - 20 // 20px padding from right
          const top = (window.screen.availHeight - height) / 2
          win.moveTo(left, top)
      } catch (e) {
          console.warn('Move window failed', e)
      }
      
      // Copy Styles
      Array.from(document.styleSheets).forEach(styleSheet => {
        try {
          const newStyle = document.createElement('style')
          const css = Array.from(styleSheet.cssRules).map(rule => rule.cssText).join('')
          newStyle.textContent = css
          // win.document.head.appendChild(newStyle) 
          // Note: Some browsers might need cloned style nodes slightly differently, but textContent is usually safe.
          win.document.head.appendChild(newStyle)
        } catch (e) {}
      })

      // Set State to Render Portal
      setPipWindow(win)

      win.addEventListener('pagehide', () => {
        setPipWindow(null)
        pipWindowRef.current = null
      })
      
      pipWindowRef.current = win // keep ref for sync access if needed elsewhere
      
    } catch (err) {
      console.error('PiP 실패:', err)
    }
  }

  // selection auto-correction
  useEffect(() => {
    const r = raids.find(item => item.name === selectedRaid)
    if (!r) return

    // 1. Difficulty check
    const diffs = r.difficulties.map(d => d.name)
    let nextDiff = selectedDifficulty
    if (!diffs.includes(selectedDifficulty)) {
      nextDiff = diffs[0]
      setSelectedDifficulty(nextDiff)
    }

    // 2. Gate check (based on nextDiff)
    const d = r.difficulties.find(d => d.name === nextDiff)
    if (d) {
        const gates = d.gates.map(g => g.name)
        if (!gates.includes(selectedGate)) {
            setSelectedGate(gates[0])
        }
    }
  }, [selectedRaid, selectedDifficulty, selectedGate, raids])

  const raidMap = useMemo(() => {
    const map: Record<string, Record<string, string[]>> = {}
    raids.forEach(r => {
      map[r.name] = {}
      r.difficulties.forEach(d => {
        map[r.name][d.name] = d.gates.map((g) => g.name)
      })
    })
    return map
  }, [raids])

  const mainGuide = activeGuide || upcomingGuide

  return (
    <>
    <div className="min-h-screen bg-[#0a0a0c] text-slate-200">
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
                    onClick={async () => {
                      try {
                        await captureRef.current?.startCapture()
                        setIsCapturing(true)
                        openGuidePip()
                      } catch (e) {
                          console.error(e)
                      }
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

    {/* React Portal for PiP Overlay */}
    {pipWindow && createPortal(
        <OverlayContent 
            window={pipWindow}
            activeGuide={activeGuide}
            upcomingGuide={upcomingGuide}
            mainGuide={mainGuide}
            rawHp={rawHp}
            filteredHp={filteredHp}
            selectedRaid={selectedRaid}
            selectedGate={selectedGate}
            ocrConfidence={ocrConfidence}
        />,
        pipWindow.document.body
    )}
    </>
  )
}

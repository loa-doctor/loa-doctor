'use client'

import { useRef, useState, useEffect, useCallback, useMemo, useLayoutEffect, Component, type ErrorInfo, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import {
  ScreenCaptureContainer,
  ScreenCaptureHandle,
} from '@/src/features/screen-capture/ScreenCaptureContainer'
import { useRaidAnalysis } from '@/src/features/raid/hooks/useRaidAnalysis'
import { Raid, PhaseGuide } from '@/src/types/raid'


class ErrorBoundary extends Component<{children: ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: ReactNode}) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Overlay Crash:", error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-900/90 text-red-200 text-xs h-screen overflow-auto">
            <h3 className="font-bold mb-2">Overlay Error</h3>
            <pre className="whitespace-pre-wrap">{this.state.error?.toString()}</pre>
        </div>
      )
    }
    return this.props.children
  }
}

const OverlayContent = ({ 
    window: targetWindow, 
    activeGuide, 
    upcomingGuide, 
    mainGuide, 
    rawHp, 
    filteredHp, 
    selectedRaid, 
    selectedGate,
    ocrConfidence,
    onNextGate,
    onChangeSelection,
    raids,
    raidMap,
    maxLines,
    analysisMode, // 'IDLE' | 'RUNNING' | 'PAUSED'
    onStart,
    onPause,
    onStop,
    isDebugOverlay, // New Prop
    captureRef,     // New Prop
    queuedGuides = [], // New Prop
}: any) => {
    const rootRef = useRef<HTMLDivElement>(null)
    const [isSelectionMode, setIsSelectionMode] = useState(false)
    
    // Local state for selection mode
    const [tempRaid, setTempRaid] = useState(selectedRaid)
    const [tempDiff, setTempDiff] = useState('')
    const [tempGate, setTempGate] = useState(selectedGate)

    // HP Percentage Calculation
    const hpPercent = useMemo(() => {
        if (!maxLines || !filteredHp) return 0
        const hp = Number(filteredHp)
        if (isNaN(hp)) return 0
        // Clamp between 0 and 100
        return Math.min(Math.max((hp / maxLines) * 100, 0), 100)
    }, [filteredHp, maxLines])

    // Init temp state when opening selection mode
    useEffect(() => {
        if (isSelectionMode) {
            setTempRaid(selectedRaid)
            // find current diff from raids
            const r = raids.find((r: any) => r.name === selectedRaid)
            const d = r?.difficulties.find((d: any) => d.gates.some((g: any) => g.name === selectedGate))
            setTempDiff(d?.name || '노말')
            setTempGate(selectedGate)
        }
    }, [isSelectionMode, selectedRaid, selectedGate, raids])

    // Body Style override (Keep existing)
    useEffect(() => {
        if (!targetWindow) return
        targetWindow.document.body.style.overflow = 'hidden' 
        targetWindow.document.body.style.margin = '0'
        
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
             // ... existing resize logic
             if (!rootRef.current || targetWindow.closed) return
            
             const contentHeight = rootRef.current.scrollHeight
             const currentHeight = targetWindow.innerHeight
            
             if (Math.abs(contentHeight - currentHeight) > 1) {
                 const diff = contentHeight - currentHeight
                 try {
                     targetWindow.resizeBy(0, diff)
                 } catch (e) {}
             }
        }

        adjustSize()
        const observer = new ResizeObserver(adjustSize)
        observer.observe(rootRef.current)
        return () => observer.disconnect()
    }, [targetWindow, isSelectionMode, activeGuide, upcomingGuide]) 




    // Helper Render
    // Helper Render
    const GuideBlock = ({ guide, type }: { guide: any, type: 'ACTIVE' | 'NEXT' }) => {
        if (!guide) return null
        const isActive = type === 'ACTIVE'
        
        // Ensure absolute URL for PiP compatibility
        const getFullUrl = (path: string) => {
            if (!path) return ''
            if (path.startsWith('http')) return path
            // Use window.location.origin (Main Window) context
            if (typeof window !== 'undefined') {
                return `${window.location.origin}${path}`
            }
            return path
        }

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
                    <h2 className="text-[15px] font-bold text-white leading-none truncate">{guide.phase || guide.hpPhase}</h2>
                </div>
                <p className="text-[13px] text-slate-300 leading-snug break-keep whitespace-pre-wrap">
                    {guide.hint}
                </p>
            </div>
        )
    }

    const handleConfirmSelection = () => {
        onChangeSelection(tempRaid, tempDiff, tempGate)
        setIsSelectionMode(false)
    }

    return (
        <ErrorBoundary>
            <div ref={rootRef} className="flex flex-col w-full bg-[#0a0a0c] text-[#e2e8f0] select-none overflow-hidden box-border h-screen">
           {/* Header */}
           <div className="flex items-center justify-between px-5 py-3 bg-[#141417] border-b border-white/5 h-[48px] shrink-0 box-border relative z-20">
              <div className="flex items-center gap-3">
              <div className="flex flex-col">
                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-tighter">RAID MONITOR</span>
                    <span className="text-[13px] font-bold text-white/90">
                      {raids.find((r: any) => r.name === selectedRaid)?.shortName || selectedRaid} {selectedGate}
                    </span>
                  </div>
                  {/* Collapse Toggle */}

              </div>
              
              <div className="flex gap-4">
                <div className="flex flex-col items-end">
                  <span className="text-[8px] font-bold">RAW</span>
                  <div className="flex items-center gap-1">
                      <span className={`text-[11px] font-black ${rawHp === null ? 'text-red-500/50 text-[9px]' : ''}`}>
                          {rawHp !== null ? rawHp : 'UNIDENTIFIED'}
                      </span>
                      <span className="text-[9px] font-normal text-blue-300">{ocrConfidence && rawHp !== null ? `(${Math.round(ocrConfidence)}%)` : ''}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end pl-3 border-l border-white/10">
                  <span className="text-[10px] font-bold text-blue-500">HP</span>
                  <span className="text-[20px] font-black text-white leading-none">{filteredHp}</span>
                </div>
              </div>
           </div>


               <>
                   {/* Visual HP Bar */}
                   <div className="w-full h-3 bg-white/5 relative shrink-0">
                       <div 
                           className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-600 to-cyan-400 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                           style={{ width: `${hpPercent}%` }}
                       />
                   </div>

                   {/* Debug Canvas Mirror (PIP) */}
                   {isDebugOverlay && (
                       <div className="w-full aspect-video bg-black border-b border-white/10 relative shrink-0">
                            <DebugCanvasMirror captureRef={captureRef} />
                            <div className="absolute top-1 left-1 px-1 bg-black/50 text-[8px] text-green-400">DEBUG VIEW</div>
                       </div>
                   )}

                   {/* Searching Panel */}
                   {analysisMode === 'SEARCHING' && (
                       <div className="absolute bottom-[60px] left-4 right-4 bg-black/80 backdrop-blur border border-blue-500/30 rounded-xl z-50 p-3 flex items-center gap-4">
                            <div className="h-10 w-10 flex items-center justify-center">
                                <div className="h-8 w-8 rounded-full border-4 border-t-blue-500 border-white/10 animate-spin" />
                            </div>
                            <div className="flex flex-col gap-0.5">
                                <span className="text-blue-500 font-black text-base leading-none tracking-wider">SEARCHING...</span>
                                <div className="text-slate-400 text-[10px]">
                                    Looking for "x [Number]" pattern...
                                </div>
                            </div>
                       </div>
                   )}
                   {/* Selection Mode UI */}
                   {isSelectionMode && (
                       <div className="p-4 bg-[#0a0a0c]/95 backdrop-blur absolute bottom-[50px] left-0 right-0 border-t border-white/10 space-y-3 z-10 transition-all">
                           <div className="grid grid-cols-3 gap-2">
                               <select 
                                   value={tempRaid} 
                                   onChange={e => {
                                       setTempRaid(e.target.value)
                                       const r = raids.find((x:any) => x.name === e.target.value)
                                       if(r && r.difficulties.length > 0) {
                                           setTempDiff(r.difficulties[0].name)
                                           if(r.difficulties[0].gates.length > 0) {
                                               setTempGate(r.difficulties[0].gates[0].name)
                                           }
                                       }
                                   }}
                                   className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                               >
                                   {raids.map((r: any) => <option key={r.name} value={r.name} className="bg-[#141417] text-[#e2e8f0]">{r.shortName || r.name}</option>)}
                               </select>
                               <select 
                                   value={tempDiff} 
                                   onChange={e => {
                                       setTempDiff(e.target.value)
                                       const r = raids.find((x:any) => x.name === tempRaid)
                                       const d = r?.difficulties.find((x:any) => x.name === e.target.value)
                                       if(d && d.gates.length > 0) setTempGate(d.gates[0].name)
                                   }}
                                   className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                               >
                                   {Object.keys(raidMap[tempRaid] || {}).map(d => <option key={d} value={d} className="bg-[#141417] text-[#e2e8f0]">{d}</option>)}
                               </select>
                               <select 
                                   value={tempGate} 
                                   onChange={e => setTempGate(e.target.value)}
                                   className="bg-white/5 border border-white/10 rounded px-2 py-1.5 text-xs text-slate-200 outline-none"
                               >
                                   {(raidMap[tempRaid]?.[tempDiff] || []).map((g:string) => <option key={g} value={g} className="bg-[#141417] text-[#e2e8f0]">{g}</option>)}
                               </select>
                           </div>
                           <button 
                               onClick={handleConfirmSelection}
                               className="w-full py-2 bg-blue-600 hover:bg-blue-500 rounded text-xs font-bold text-white transition-colors"
                           >
                               변경 적용
                           </button>
                       </div>
                   )}

                   {/* Guides: Fill the remaining space */}
                   <div className="flex flex-col flex-1 p-4 gap-3 shrink-0 box-border overflow-hidden pb-[60px]">
                       {/* Queued Guides Alert */}
                       {queuedGuides.length > 0 && (
                           <div className="flex flex-col gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl relative overflow-hidden">
                               <div className="absolute top-0 left-0 w-1 h-full bg-yellow-500/50" />
                               <div className="flex items-center gap-2 mb-1">
                                   <span className="text-[10px] font-black bg-yellow-500 text-black px-1.5 rounded uppercase flicker-animation">
                                       SKIP DETECTED
                                   </span>
                                   <span className="text-[11px] font-bold text-yellow-200">
                                       딜이 빨라서 패턴이 밀렸습니다!
                                   </span>
                               </div>
                               <div className="flex flex-col gap-1.5 pl-1">
                                   {queuedGuides.map((guide: any, idx: number) => (
                                       <div key={idx} className="flex items-start gap-2 text-slate-300">
                                           <span className="text-[11px] font-bold text-white shrink-0 mt-0.5">
                                               {guide.line}줄:
                                           </span>
                                           <span className="text-[11px] leading-snug break-keep">
                                               {guide.phase} <span className="text-slate-500">({guide.hint})</span>
                                           </span>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}
                       
                       {activeGuide && <GuideBlock guide={activeGuide} type="ACTIVE" />}
                       {upcomingGuide && <GuideBlock guide={upcomingGuide} type="NEXT" />}
                   </div>

                   {/* Fixed Footer */}
                   <div className="absolute bottom-0 left-0 right-0 h-[50px] bg-[#141417] border-t border-white/5 flex items-center justify-between px-4 z-20">
                       <button 
                           onClick={() => setIsSelectionMode(!isSelectionMode)}
                           className={`px-3 py-1.5 rounded transition-all flex items-center gap-2 text-xs font-bold ${isSelectionMode ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white'}`}
                       >
                           <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                           </svg>
                           {isSelectionMode ? '닫기' : '설정'}
                       </button>

                       {/* Control Buttons */}
                       <div className="flex items-center gap-2">
                           {analysisMode !== 'RUNNING' && (
                               <button onClick={onStart} className="p-1.5 rounded-full bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-colors">
                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                               </button>
                           )}
                           {analysisMode === 'RUNNING' && (
                               <button onClick={onPause} className="p-1.5 rounded-full bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 transition-colors">
                                   <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                       <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   </svg>
                               </button>
                           )}
                           <button onClick={onStop} className="p-1.5 rounded-full bg-red-500/10 hover:bg-red-500/20 text-red-500 transition-colors">
                               <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                               </svg>
                           </button>
                       </div>



                       {onNextGate && (
                           <button 
                               onClick={onNextGate}
                               className="px-4 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 hover:text-blue-300 border border-blue-500/30 rounded text-xs font-bold transition-all flex items-center gap-1"
                           >
                               다음 관문
                               <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                               </svg>
                           </button>
                       )}
                   </div>
               </>

        </div>
    </ErrorBoundary>
    )
}

// Helper: Canvas Mirror
function DebugCanvasMirror({ captureRef }: { captureRef: any }) {
    const canvasRef = useRef<HTMLCanvasElement>(null)
    useEffect(() => {
        let frameId: number
        const render = () => {
             const dest = canvasRef.current
             if (!dest) return

             const ctx = dest.getContext('2d')
             if (!ctx) return

             const source = captureRef.current?.getCanvas()
             
             // Clear
             ctx.fillStyle = '#111'
             ctx.fillRect(0, 0, dest.width, dest.height)

             if (source) {
                 if (dest.width !== source.width || dest.height !== source.height) {
                     dest.width = source.width || 300
                     dest.height = source.height || 150
                 }
                 if (source.width > 0) {
                     ctx.drawImage(source, 0, 0)
                 } else {
                     ctx.fillStyle = 'red'
                     ctx.fillText('Source Canvas Empty 0x0', 10, 50)
                 }
             } else {
                 ctx.fillStyle = 'red'
                 ctx.fillText('No Source Canvas (Ref missing)', 10, 50)
             }
             
             // Heartbeat
             ctx.fillStyle = '#0f0'
             ctx.font = '12px monospace'
             ctx.fillText(`Live: ${(Date.now() / 1000).toFixed(1)}s`, 10, 20)
             ctx.fillText(`Phase: ${captureRef.current?.getPhase()}`, 10, 35)

             frameId = requestAnimationFrame(render)
        }
        render()
        return () => cancelAnimationFrame(frameId)
    }, [captureRef])
    return <canvas ref={canvasRef} className="w-full h-full object-contain border border-white/20" />
}

export default function AnalyzeClient({ raids }: { raids: Raid[] }) {
  const router = useRouter()
  const pipWindowRef = useRef<Window | null>(null)
  const captureRef = useRef<ScreenCaptureHandle | null>(null)

  /* Persistence Logic */
  const [isCapturing, setIsCapturing] = useState(false)
  
  // Analysis Mode State
  const [analysisMode, setAnalysisMode] = useState<'IDLE' | 'RUNNING' | 'PAUSED'>('IDLE')
  
  // Debug Controls
  const [showDebugControls, setShowDebugControls] = useState(false)
  const [isDebugOverlay, setIsDebugOverlay] = useState(false) // Whether current session is debug mode

  const [selectedRaid, setSelectedRaid] = useState(raids.length > 0 ? raids[0].name : '1막 : 대지를 부수는 업화의 궤적')
  const [selectedDifficulty, setSelectedDifficulty] = useState('노말')
  const [selectedGate, setSelectedGate] = useState('1관문')

  // Load from localStorage after mount
  useEffect(() => {
      if (typeof window === 'undefined') return
      
      const savedRaid = localStorage.getItem('loa-doctor:selectedRaid')
      const savedDiff = localStorage.getItem('loa-doctor:selectedDifficulty')
      const savedGate = localStorage.getItem('loa-doctor:selectedGate')

      if (savedRaid && raids.some(r => r.name === savedRaid)) {
          setSelectedRaid(savedRaid)
          // Sync category
          const r = raids.find(r => r.name === savedRaid)
          if (r) setSelectedCategory(r.category || '기타')
      }
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

  /* Derived State: Categories & Filtered Raids */
  const categories = useMemo(() => {
    const cats = new Set(raids.map(r => r.category || '기타'))
    return Array.from(cats)
  }, [raids])

  const [selectedCategory, setSelectedCategory] = useState<string>('카제로스 레이드')

  // Available raids based on category
  const availableRaids = useMemo(() => {
    return raids.filter(r => (r.category || '기타') === selectedCategory)
  }, [raids, selectedCategory])
  
  // Auto-select first raid when category changes
  useEffect(() => {
      if (availableRaids.length > 0) {
          const currentRaidObj = availableRaids.find(r => r.name === selectedRaid)
          if (!currentRaidObj) {
              setSelectedRaid(availableRaids[0].name)
          }
      }
  }, [selectedCategory, availableRaids, selectedRaid])

  /* Logic Update: Determine maxLines based on selection */
  const selectedMaxLines = useMemo(() => {
    const r = raids.find(r => r.name === selectedRaid)
    const d = r?.difficulties.find(d => d.name === selectedDifficulty)
    const g = d?.gates.find(g => g.name === selectedGate)
    return g?.maxLines || 0
  }, [raids, selectedRaid, selectedDifficulty, selectedGate])

  /* Conf state */
  const [ocrConfidence, setOcrConfidence] = useState<number | undefined>(undefined)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const {
    rawHp,
    filteredHp,
    analysisStatus,
    activeGuide,
    upcomingGuide,
    queuedGuides, // New State
    handleLineDetected: onLineDetectedOriginal,
    resetSession,
    setAnalysisStatus,
    setFilteredHp,
  } = useRaidAnalysis({ phaseGuides, selectedRaid, selectedGate, maxLines: selectedMaxLines })



  const handleLineDetected = useCallback((line: number | null, confidence?: number) => {
      // Logic Control
      if (analysisMode !== 'RUNNING') return

      onLineDetectedOriginal(line, confidence)
      if (confidence !== undefined) setOcrConfidence(confidence)
  }, [onLineDetectedOriginal, analysisMode])

  useEffect(() => {
    if (!selectedGate) return
    
    // Find the actual gate object to get its correct gateNumber
    const r = raids.find(r => r.name === selectedRaid)
    const d = r?.difficulties.find(d => d.name === selectedDifficulty)
    const gObj = d?.gates.find(g => g.name === selectedGate)
    const gateNumber = gObj ? gObj.gateNumber : Number(selectedGate.replace(/[^0-9]/g, ''))

    // Cache Key (Version 2)
    const cacheKey = `loa-doctor:guides:v2:${selectedRaid}:${selectedDifficulty}:${gateNumber}`

    // 1. Try Load from Cache (Instant Paint)
    if (typeof window !== 'undefined') {
        const cached = localStorage.getItem(cacheKey)
        if (cached) {
            try {
                const cachedData = JSON.parse(cached)
                if (Array.isArray(cachedData) && cachedData.length > 0) {
                    setPhaseGuides(cachedData)
                    resetSession()
                }
            } catch (e) {
                console.error("Cache parse error", e)
                localStorage.removeItem(cacheKey)
            }
        }
    }

    // 2. Background Fetch (Stale-While-Revalidate)
    // Always fetch to check for updates from Admin
    const eRaid = encodeURIComponent(selectedRaid)
    const eDiff = encodeURIComponent(selectedDifficulty)

    fetch(
      `${process.env.NEXT_PUBLIC_API_BASE}/api/raids/guides?boss=${eRaid}&difficulty=${eDiff}&gate=${gateNumber}`
    )
      .then(res => {
          if (!res.ok) throw new Error(`Fetch failed: ${res.status}`)
          return res.json()
      })
      .then(data => {
        const sorted = data.sort((a: any, b: any) => b.line - a.line)
        
        // Update State & Cache with fresh data
        setPhaseGuides(sorted)
        resetSession() // Reset current active guide calculation? Maybe optional but safe.
        
        if (typeof window !== 'undefined') {
            localStorage.setItem(cacheKey, JSON.stringify(sorted))
        }
      })
      .catch(err => {
          console.error("Fetch error:", err)
          setFetchError(err.toString())
      })
  }, [selectedRaid, selectedGate, selectedDifficulty, resetSession])
  
  /* Control Handlers */
  const handleStartAnalysis = () => {
      captureRef.current?.startAlgorithm()
      setAnalysisMode('RUNNING')
  }
  const handlePauseAnalysis = () => setAnalysisMode('PAUSED')
  const handleStopAnalysis = () => {
      setAnalysisMode('IDLE')
      resetSession()
      setOcrConfidence(undefined)
      setIsDebugOverlay(false)
  }

  /* PiP Window State */
  const [pipWindow, setPipWindow] = useState<Window | null>(null)

  const openGuidePip = async () => {
    if (!('documentPictureInPicture' in window)) return alert('PiP 미지원 브라우저입니다.')
    try {
      const width = 340
      const height = 380
      
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

  // Next Gate Logic
  const handleNextGate = () => {
    const r = raids.find(r => r.name === selectedRaid)
    const d = r?.difficulties.find(d => d.name === selectedDifficulty)
    if (!d) return

    const currentGateIndex = d.gates.findIndex(g => g.name === selectedGate)
    if (currentGateIndex !== -1 && currentGateIndex < d.gates.length - 1) {
        const nextGate = d.gates[currentGateIndex + 1]
        setSelectedGate(nextGate.name)
    }
  }
  
  // Selection Logic
  const handleSelectionFromOverlay = (raid: string, diff: string, gate: string) => {
      setSelectedRaid(raid)
      setSelectedDifficulty(diff)
      setSelectedGate(gate)
  }

  // Determine if next gate exists
  const hasNextGate = useMemo(() => {
      const r = raids.find(r => r.name === selectedRaid)
      const d = r?.difficulties.find(d => d.name === selectedDifficulty)
      if (!d) return false
      const idx = d.gates.findIndex(g => g.name === selectedGate)
      return idx !== -1 && idx < d.gates.length - 1
  }, [raids, selectedRaid, selectedDifficulty, selectedGate])


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
                  {/* Category Selector */}
                  <select
                    value={selectedCategory}
                    onChange={e => setSelectedCategory(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                     {categories.map(cat => (
                         <option key={cat} value={cat} className="bg-[#141417] text-[#e2e8f0]">
                             {cat}
                         </option>
                     ))}
                  </select>

                  <select
                    value={selectedRaid}
                    onChange={e => setSelectedRaid(e.target.value)}
                    className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold"
                  >
                    {availableRaids.map(r => (
                        <option key={r.name} value={r.name} className="bg-[#141417] text-[#e2e8f0]">
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
                      <option key={d} value={d} className="bg-[#141417] text-[#e2e8f0]">
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
                      <option key={g} value={g} className="bg-[#141417] text-[#e2e8f0]">
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="mt-10 space-y-3">
                {/* Debug Settings Toggle */}
                <div className="flex justify-end pr-2">
                    <button 
                    onClick={() => setShowDebugControls(prev => !prev)}
                    className="text-[10px] text-slate-500 hover:text-slate-300 underline decoration-dotted"
                    >
                    {showDebugControls ? '디버그 설정 닫기' : '디버그 설정 열기'}
                    </button>
                </div>

                {showDebugControls && (
                    <div className="p-3 bg-white/5 border border-white/10 rounded-xl space-y-2">
                        <p className="text-xs text-slate-400 mb-2">개발자 디버깅 도구</p>
                        <button
                            onClick={async () => {
                                setIsDebugOverlay(true)
                                try {
                                    await captureRef.current?.startCapture()
                                    setIsCapturing(true)
                                    handleStartAnalysis() // Set RUNNING
                                    openGuidePip()
                                } catch (e) {
                                    console.error(e)
                                }
                            }}
                            disabled={isCapturing}
                            className="w-full py-2 bg-purple-600/20 hover:bg-purple-600/30 text-purple-400 border border-purple-500/30 rounded text-xs font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-1"
                        >
                            <span>🛠️</span> 디버그 모드로 시작
                        </button>
                    </div>
                )}
                {!isCapturing ? (
                    <button
                        onClick={async () => {
                          try {
                            const success = await captureRef.current?.startCapture()
                            if (success) {
                                setIsCapturing(true)
                                setIsDebugOverlay(false) // Normal Mode
                                // handleStartAnalysis() // Removed to allow manual start from Overlay
                                openGuidePip()
                            }
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
                        handleStopAnalysis() // Also stop analysis
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
            onNextGate={hasNextGate ? handleNextGate : null}
            onChangeSelection={handleSelectionFromOverlay}
            raids={raids}
            raidMap={raidMap}
            maxLines={selectedMaxLines}
            analysisMode={analysisMode}
            onStart={handleStartAnalysis}
            onPause={handlePauseAnalysis}
            onStop={handleStopAnalysis}
            isDebugOverlay={isDebugOverlay}
            captureRef={captureRef}
            queuedGuides={queuedGuides}
        />,
        pipWindow.document.body
    )}
    </>
  )
}

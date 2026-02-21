import { useState, useRef, useCallback } from 'react'
import { PhaseGuide, AnalysisStatus } from '@/src/types/raid'


interface UseRaidAnalysisProps {
  phaseGuides: PhaseGuide[]
  selectedRaid: string
  selectedGate: string
  maxLines?: number
}

export const useRaidAnalysis = ({ phaseGuides, selectedRaid, selectedGate, maxLines }: UseRaidAnalysisProps) => {
  const [rawHp, setRawHp] = useState<number | null>(null)
  const [filteredHp, setFilteredHp] = useState<number>(0)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE')
  /* New State Structure */
  /* New State Structure */
  const [guidesState, setGuidesState] = useState<{
    activeGuide: { line?: number; hpPhase: string; hint: string } | null
    upcomingGuide: { line?: number; hpPhase: string; hint: string } | null
  }>({
    activeGuide: null,
    upcomingGuide: { hpPhase: '준비 완료', hint: '전투 시작 대기 중...' },
  })

  // Refs for algorithm
  const minLineReachedRef = useRef<number>(999)
  const stabilityRef = useRef({ lastVal: 0, count: 0 })
  const impossibleLineCountRef = useRef<number>(0)
  const pendingDropRef = useRef<{ val: number; frames: number } | null>(null)

  const resetSession = useCallback(() => {
    minLineReachedRef.current = 999
    stabilityRef.current = { lastVal: 0, count: 0 }
    impossibleLineCountRef.current = 0
    pendingDropRef.current = null
    setFilteredHp(0)
    setAnalysisStatus('RETRY_RESET')
    setGuidesState({
        activeGuide: null,
        upcomingGuide: { hpPhase: '전투 시작 대기', hint: 'HP 인식을 시작합니다.' }
    })
  }, [])

  const handleLineDetected = useCallback(
    (currentLine: number | null, confidence?: number) => {
      // 1. Raw 값 즉시 반영 (신뢰도 상관없이 표시)
      setRawHp(currentLine)

      // 0. 신뢰도 필터링 (60% 이하 무시) - 로직 수행 X
      if (currentLine === null || (confidence !== undefined && confidence <= 60)) {
          return
      }

      // Special Logic: 10줄 아래 진입 시, 99 -> 9, 88 -> 8 등 오인식 보정
      if (minLineReachedRef.current <= 12) {
          if (currentLine > 10 && currentLine < 100 && currentLine % 11 === 0) {
              // 11의 경우, 우리가 아직 10줄 이상(예: 12->11)에 있다면 정상일 수 있음
              // 따라서 이미 한자릿수(10 미만)로 진입한 상태에서만 11 -> 1로 보정
              if (currentLine === 11 && minLineReachedRef.current >= 10) {
                 // 그대로 둠 (12 -> 11 정상 진행)
              } else {
                 // 22~99는 무조건 변환, 11은 10줄 미만일 때만 변환
                 currentLine = currentLine / 11
              }
          }
      }



      // phaseGuides가 없더라도 maxLines가 있으면 로직 수행 가능하도록 수정
      if (phaseGuides.length === 0 && !maxLines) return
      
      const guideMax = phaseGuides.length > 0 ? phaseGuides[0].line : 0
      const maxHp = maxLines && maxLines > 0 ? maxLines : guideMax

      // 3. 말도 안되는 줄수(최대체력 이상) 에러 감지 (여유분 5줄)
      if (currentLine > maxHp + 5) {
        impossibleLineCountRef.current++
        if (impossibleLineCountRef.current >= 15) {
          resetSession()
        }
        return
      }
      impossibleLineCountRef.current = 0

      // 4. 안정화 체크 (트렌드 기반)
      const lastVal = stabilityRef.current.lastVal
      const trendDiff = currentLine - lastVal
      
      const isSteady = Math.abs(trendDiff) <= 2 || (trendDiff < 0 && trendDiff >= -5)
      
      if (isSteady) {
        stabilityRef.current.count++
        stabilityRef.current.lastVal = currentLine
      } else {
        stabilityRef.current.lastVal = currentLine
        stabilityRef.current.count = 0
      }

      // 5. 리트라이 판정
      if (currentLine >= (maxHp - 10) && minLineReachedRef.current < 50) {
        if (stabilityRef.current.count >= 3) {
          resetSession()
        }
        return
      }

      // 6. 급격한 변화 및 딜찍/오인식 구분 로직
      const diff = currentLine - minLineReachedRef.current

      // (A) 역행: 줄수가 올라가는 경우
      if (diff > 5) {
        if (stabilityRef.current.count < 3) {
          return 
        }

        // 역행 안정화 발동 시 특수 페이즈 전환(발악 패턴 진입 등) 대응
        if (phaseGuides.length > 0) {
            const lastGuide = phaseGuides[phaseGuides.length - 1]
            // 만약 이미 마지막 기믹(0줄 등) 근처(<15줄)까지 왔었는데 갑자기 피가 크게 차올랐다면 (0줄->44줄 맵이동 등)
            // 0줄 텍스트 미표시 / 순식간에 지나가서 인식을 못 한 상태로 맵이 바뀐 특수 상황임
            if (minLineReachedRef.current <= lastGuide.line + 15 && currentLine > lastGuide.line + 20) {
                minLineReachedRef.current = lastGuide.line // 마지막 기믹(0줄)에 도달한 것으로 강제 확정
            }
        }
      }

      // (B) 급락: 오인식 가능성 체크
      // -30줄 이상 차이날 때
      if (diff < -30) {
        if (!pendingDropRef.current || Math.abs(pendingDropRef.current.val - currentLine) > 5) {
          // 새로운 급락 발생 -> 일단 대기
          pendingDropRef.current = { val: currentLine, frames: 1 }
        } else {
          // 급락 값 유지 중
          pendingDropRef.current.frames++
        }

        // 5프레임 이상 유지되면 "진짜 떨어졌다(Skip)"고 판단
        if (pendingDropRef.current.frames < 5) {
          return 
        }
        
        // --- [Queued Mechanic Detection Logic] ---
        // 갑작스런 HP 감소가 확정됨.
        // minLineReachedRef.current (예: 180) -> currentLine (예: 130)
        // 이 사이에 있는 가이드들을 "Queue"에 넣는다.
        const skippedGuides = phaseGuides.filter(g => 
            g.line < minLineReachedRef.current && g.line > currentLine
        )
        
        if (skippedGuides.length > 0) {
            // Add to queue (Start from highest line)
            setQueuedGuides(prev => {
                // Avoid duplicates and merge
                const newQueue = [...prev]
                skippedGuides.forEach(g => {
                    if (!newQueue.find(q => q.line === g.line)) {
                        newQueue.push(g)
                    }
                })
                return newQueue.sort((a,b) => b.line - a.line) // DESC sort
            })
        }
        
        pendingDropRef.current = null
      } else if (pendingDropRef.current && currentLine > minLineReachedRef.current - 10) {
        // 급락했다가 다시 원래대로 돌아오면 (오인식 해제)
        pendingDropRef.current = null
      }

      // 8. 데이터 확정 및 가이드 업데이트
      if (currentLine < minLineReachedRef.current) {
        minLineReachedRef.current = currentLine
      }
      setFilteredHp(currentLine)
      
      // --- [Clear Queue Logic] ---
      // If HP drops significantly below the *last* queued item, clear it.
      // e.g. Queue: [170, 145]. Current: 130. 
      // If Current drops to 110 ( < 145 - 20?), maybe users are done with 145?
      // Actually user said: "List just shows what was skipped, until we reach next Normal guide".
      // Let's clear items from queue if currentLine is WAY below them (e.g. -20 lines)
      // Or simply, we just show them.
      
      setQueuedGuides(prev => {
          if (prev.length === 0) return prev
          // If current line is smaller than (lowest_queued_line - 10), remove it?
          // No, user wants to see them.
          // Let's keep them until manually cleared? No user interaction.
          // Strategy: Keep them in queue.
          // If currentLine < upcomingGuide.line (Next Normal), we might switch to Next Normal?
          // Wait, if 130. Next Normal 115.
          // If 115 is reached, 170/145 are definitely meaningless?
          // Yes. If we reach 115 line, we should show 115.
           
          // Remove guides from queue if currentLine <= (guide.line - 30) ?
          // Let's just keep them for now. 
          // Actually, if we reach the NEXT valid guide (e.g. 115), 
          // the queue should probably serve its purpose and disappear?
          // But 115 is "Upcoming".
          
          return prev.filter(g => currentLine >= g.line - 50) // Auto-clear if 50 lines passed
      })


      /* New Guide Logic with Queue */
      // phaseGuides is sorted DESC: [170, 145, 115...]
      const effectiveLine = minLineReachedRef.current
      const upcomingIdx = phaseGuides.findIndex(g => effectiveLine > g.line)
      
      let active: typeof guidesState.activeGuide = null
      let upcoming: typeof guidesState.upcomingGuide = null

      if (upcomingIdx === -1) {
          if (phaseGuides.length > 0 && effectiveLine <= phaseGuides[phaseGuides.length - 1].line) {
             const lastGuide = phaseGuides[phaseGuides.length - 1]
             active = {
                 line: lastGuide.line,
                 hpPhase: `${lastGuide.line}줄: ${lastGuide.phase}`,
                 hint: lastGuide.hint,
             }
             upcoming = null
          }
      } else {
          // upcoming found (Next Normal)
          const upG = phaseGuides[upcomingIdx]
          upcoming = {
              line: upG.line,
              hpPhase: `${upG.line}줄: ${upG.phase}`,
              hint: upG.hint,
          }

          // Active is the one before upcoming (index - 1)
          if (upcomingIdx > 0) {
              const actG = phaseGuides[upcomingIdx - 1]
              active = {
                line: actG.line,
                hpPhase: `${actG.line}줄: ${actG.phase}`,
                hint: actG.hint,
              }
          }
      }

      setGuidesState({ activeGuide: active, upcomingGuide: upcoming })
      setAnalysisStatus('GUIDE')
    },
    [phaseGuides, resetSession, selectedRaid, selectedGate, maxLines]
  )
  
  const [queuedGuides, setQueuedGuides] = useState<PhaseGuide[]>([])

  // Reset Queue on Session Reset
  const resetSessionWithQueue = useCallback(() => {
      resetSession()
      setQueuedGuides([])
  }, [resetSession])

  return {
    rawHp,
    filteredHp,
    analysisStatus,
    activeGuide: guidesState.activeGuide,
    upcomingGuide: guidesState.upcomingGuide,
    queuedGuides, // Export Queue
    handleLineDetected,
    resetSession: resetSessionWithQueue,
    setAnalysisStatus,
    setFilteredHp,
  }
}


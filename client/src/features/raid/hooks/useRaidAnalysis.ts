import { useState, useRef, useCallback } from 'react'
import { PhaseGuide, AnalysisStatus } from '@/src/types/raid'
import { GUIDE_IMAGES } from '@/src/data/guideImages'

interface UseRaidAnalysisProps {
  phaseGuides: PhaseGuide[]
  selectedRaid: string
  selectedGate: string
  maxLines?: number
}

export const useRaidAnalysis = ({ phaseGuides, selectedRaid, selectedGate, maxLines }: UseRaidAnalysisProps) => {
  const [rawHp, setRawHp] = useState<number>(0)
  const [filteredHp, setFilteredHp] = useState<number>(0)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE')
  /* New State Structure */
  const [guidesState, setGuidesState] = useState<{
    activeGuide: { hpPhase: string; hint: string; imageUrl?: string } | null
    upcomingGuide: { hpPhase: string; hint: string; imageUrl?: string } | null
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
    (currentLine: number, confidence?: number) => {
      // 0. 신뢰도 필터링 (60% 이하 무시)
      if (confidence !== undefined && confidence <= 60) {
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

      // 1. Raw 값 즉시 반영
      setRawHp(currentLine)

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
      }

      // (B) 급락: 오인식 가능성 체크
      if (diff < -30) {
        if (!pendingDropRef.current || Math.abs(pendingDropRef.current.val - currentLine) > 5) {
          pendingDropRef.current = { val: currentLine, frames: 1 }
        } else {
          pendingDropRef.current.frames++
        }

        if (pendingDropRef.current.frames < 3) {
          return 
        }
        pendingDropRef.current = null
      } else if (pendingDropRef.current && currentLine > minLineReachedRef.current - 10) {
        pendingDropRef.current = null
      }

      // 8. 데이터 확정 및 가이드 업데이트
      if (currentLine < minLineReachedRef.current) {
        minLineReachedRef.current = currentLine
      }
      setFilteredHp(currentLine)

      /* New Guide Logic */
      // phaseGuides is sorted DESC: [170, 145, 115...]
      // find upcoming: first guide where currentLine > guide.line
      const upcomingIdx = phaseGuides.findIndex(g => currentLine > g.line)
      
      let active: typeof guidesState.activeGuide = null
      let upcoming: typeof guidesState.upcomingGuide = null

      const raidImages = GUIDE_IMAGES[selectedRaid]?.[selectedGate]

      if (upcomingIdx === -1) {
          // If not found, it means currentLine <= all guides? (e.g. 0)
          // or if empty.
          // If currentLine is very low, usually upcomingIdx is -1 implies we are past everything?
          // Actually findIndex returns -1 if NO element satisfies.
          // If currentLine is 10, and guides are [170, 145...], 10 > 170 False...
          // Wait. 10 > 170 is False. 
          // logic: `currentLine > g.line` implies we are BEFORE that line.
          // ex: HP 180. 180 > 170 (True). upcomingIdx = 0 (170).
          // ex: HP 160. 160 > 170 (False). 160 > 145 (True). upcomingIdx = 1 (145).
          
          // If HP 10. 10 > ALL (False? No. 10 > 170 False).
          // Wait logic check.
          // 160 > 145 is True.
          // 10 > 145 is False.
          
          // If HP is smaller than ALL lines (End of raid), findIndex returns -1.
          // In that case, Active is the Last one. Upcoming is None.
          
          if (phaseGuides.length > 0 && currentLine <= phaseGuides[phaseGuides.length - 1].line) {
             const lastGuide = phaseGuides[phaseGuides.length - 1]
             active = {
                 hpPhase: `${lastGuide.line}줄: ${lastGuide.phase}`,
                 hint: lastGuide.hint,
                 imageUrl: raidImages?.[lastGuide.line]
             }
             upcoming = null
          }
      } else {
          // upcoming found
          const upG = phaseGuides[upcomingIdx]
          upcoming = {
              hpPhase: `${upG.line}줄: ${upG.phase}`,
              hint: upG.hint,
              imageUrl: raidImages?.[upG.line]
          }

          // Active is the one before upcoming (index - 1)
          if (upcomingIdx > 0) {
              const actG = phaseGuides[upcomingIdx - 1]
              active = {
                hpPhase: `${actG.line}줄: ${actG.phase}`,
                hint: actG.hint,
                imageUrl: raidImages?.[actG.line]
              }
          }
      }

      setGuidesState({ activeGuide: active, upcomingGuide: upcoming })
      setAnalysisStatus('GUIDE')
    },
    [phaseGuides, resetSession, selectedRaid, selectedGate, maxLines]
  )

  return {
    rawHp,
    filteredHp,
    analysisStatus,
    activeGuide: guidesState.activeGuide,
    upcomingGuide: guidesState.upcomingGuide,
    handleLineDetected,
    resetSession,
    setAnalysisStatus,
    setFilteredHp,
  }
}

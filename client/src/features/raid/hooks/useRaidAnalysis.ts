import { useState, useRef, useCallback } from 'react'
import { PhaseGuide, AnalysisStatus } from '@/src/types/raid'
import { GUIDE_IMAGES } from '@/src/data/guideImages'

interface UseRaidAnalysisProps {
  phaseGuides: PhaseGuide[]
  selectedRaid: string
  selectedGate: string
}

export const useRaidAnalysis = ({ phaseGuides, selectedRaid, selectedGate }: UseRaidAnalysisProps) => {
  const [rawHp, setRawHp] = useState<number>(0)
  const [filteredHp, setFilteredHp] = useState<number>(0)
  const [analysisStatus, setAnalysisStatus] = useState<AnalysisStatus>('IDLE')
  const [currentGuide, setCurrentGuide] = useState<{
    hpPhase: string
    hint: string
    imageUrl?: string
  }>({
    hpPhase: '준비 완료',
    hint: '인식된 HP에 따라 가이드를 미리 표시합니다.',
  })

  // Refs for algorithm
  const minLineReachedRef = useRef<number>(999)
  const stabilityRef = useRef({ lastVal: 0, count: 0 })
  const impossibleLineCountRef = useRef<number>(0)
  const pendingDropRef = useRef<{ val: number; frames: number } | null>(null)
  const lastTriggeredLineRef = useRef<number | null>(null)

  const resetSession = useCallback(() => {
    lastTriggeredLineRef.current = null
    minLineReachedRef.current = 999
    stabilityRef.current = { lastVal: 0, count: 0 }
    impossibleLineCountRef.current = 0
    pendingDropRef.current = null
    setFilteredHp(0)
    setAnalysisStatus('RETRY_RESET')
    setCurrentGuide({ hpPhase: '전투 시작 대기', hint: 'HP 인식을 시작합니다.' })
  }, [])

  const handleLineDetected = useCallback(
    (currentLine: number) => {
      // 1. Raw 값 즉시 반영
      setRawHp(currentLine)

      if (phaseGuides.length === 0) return
      const maxHp = phaseGuides[0].line

      // 3. 말도 안되는 줄수(최대체력 이상) 에러 감지
      if (currentLine > maxHp) {
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
      if (currentLine >= maxHp && minLineReachedRef.current < 50) {
        if (stabilityRef.current.count >= 3) {
          resetSession()
        }
        return
      }

      // 6. 급격한 변화 및 딜찍/오인식 구분 로직
      const diff = currentLine - minLineReachedRef.current

      // (A) 역행: 줄수가 올라가는 경우
      if (diff > 5) {
        if (stabilityRef.current.count < 5) {
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

        if (pendingDropRef.current.frames < 5) {
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

      const nextPreview = phaseGuides.find(guide => currentLine > guide.line)
      if (nextPreview && nextPreview.line !== lastTriggeredLineRef.current) {
        lastTriggeredLineRef.current = nextPreview.line
        
        // 이미지 매핑 조회 (Client-Side Mapping)
        const raidImages = GUIDE_IMAGES[selectedRaid]?.[selectedGate]
        const imageUrl = raidImages?.[nextPreview.line]

        setCurrentGuide({
          hpPhase: `${nextPreview.line}줄: ${nextPreview.phase}`,
          hint: nextPreview.hint,
          imageUrl, // 이미지 URL 주입
        })
        setAnalysisStatus('GUIDE')
      }
    },
    [phaseGuides, resetSession]
  )

  return {
    rawHp,
    filteredHp,
    analysisStatus,
    currentGuide,
    handleLineDetected,
    resetSession,
    setAnalysisStatus,
    setFilteredHp,
    setCurrentGuide
  }
}

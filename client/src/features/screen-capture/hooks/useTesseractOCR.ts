import { useEffect, useRef, useState } from 'react'
import { createWorker, Worker, PSM } from 'tesseract.js'

export function useTesseractOCR() {
  const workerRef = useRef<Worker | null>(null)

  // 화면에 확정 반영된 값
  const confirmedRef = useRef<number | null>(null)

  // 직전 OCR 값 (흐름 감지용)
  const lastSeenRef = useRef<number | null>(null)

  // 애매한 경우를 위한 후보 안정화
  const candidateRef = useRef<number | null>(null)
  const stableCountRef = useRef(0)

  // 연속 감소 감지
  const decreasingStreakRef = useRef(0)

  const [lineText, setLineText] = useState('—')

  /* =============================
   * Worker 초기화
   * ============================= */
  useEffect(() => {
    let mounted = true

    ;(async () => {
      const w = await createWorker('eng')

      await w.setParameters({
        tessedit_char_whitelist: '0123456789',
        tessedit_pageseg_mode: PSM.SINGLE_LINE,
      })

      if (mounted) {
        workerRef.current = w
      } else {
        await w.terminate()
      }
    })()

    return () => {
      mounted = false
      workerRef.current?.terminate()
      workerRef.current = null
    }
  }, [])

  /* =============================
   * 리셋
   * ============================= */
  const stop = () => {
    workerRef.current?.terminate()
    workerRef.current = null

    confirmedRef.current = null
    lastSeenRef.current = null
    candidateRef.current = null
    stableCountRef.current = 0
    decreasingStreakRef.current = 0

    setLineText('—')
  }

  /* =============================
   * OCR 인식
   * ============================= */
  const recognize = async (canvas: HTMLCanvasElement) => {
    if (!workerRef.current) return

    const res = await workerRef.current.recognize(canvas)

    const raw = res.data.text
    const txt = raw.replace(/[^0-9]/g, '')
    if (!txt || txt.length < 2) return

    const n = Number(txt)
    if (Number.isNaN(n) || n < 1 || n > 1500) return

    const confirmed = confirmedRef.current
    const lastSeen = lastSeenRef.current

    /* =============================
     * 확정값 기준 1차 필터
     * ============================= */
    if (confirmed !== null) {
      const diff = confirmed - n

      //말도 안 되는 급감 (자리수 깨짐)
      if (diff > 40) return

      // ⛔ 증가값은 기본적으로 무시
      if (n > confirmed + 5) return
    }

    /* =============================
     * 연속 감소 흐름 감지
     * ============================= */
    let usedDecreasingFlow = false

    if (lastSeen !== null) {
      const stepDiff = lastSeen - n

      // 정상적인 감소 흐름 (값은 달라도 OK)
      if (stepDiff > 0 && stepDiff <= 10) {
        decreasingStreakRef.current += 1

        // 2프레임 이상 연속 감소면 즉시 확정
        if (decreasingStreakRef.current >= 2) {
          confirmedRef.current = n
          setLineText(String(n))
          usedDecreasingFlow = true
        }
      } else {
        decreasingStreakRef.current = 0
      }
    }

    /* =============================
     * 3️⃣ 동일 값 안정화 (정체 구간)
     * ============================= */
    if (!usedDecreasingFlow) {
      let requiredStable = 2

      if (confirmed !== null) {
        const diff = confirmed - n

        // ⚠️ 11~40 감소는 더 보수적으로
        if (diff > 10) {
          requiredStable = 3
        }
      }

      if (candidateRef.current === n) {
        stableCountRef.current += 1
      } else {
        candidateRef.current = n
        stableCountRef.current = 1
      }

      if (stableCountRef.current >= requiredStable) {
        confirmedRef.current = n
        setLineText(String(n))
      }
    }

    /* =============================
     * 마지막 값 갱신
     * ============================= */
    lastSeenRef.current = n
  }

  return {
    lineText,
    recognize,
    stop,
  }
}
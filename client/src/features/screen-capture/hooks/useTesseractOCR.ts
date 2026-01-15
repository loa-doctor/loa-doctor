import { useEffect, useRef, useState } from 'react'
import { createWorker, Worker, PSM } from 'tesseract.js'

export function useTesseractOCR() {
  const workerRef = useRef<Worker | null>(null)

  const [lineText, setLineText] = useState('—')

  // 안정화용
  const lastValueRef = useRef<number | null>(null)
  const stableCountRef = useRef(0)

  useEffect(() => {
    let mounted = true

    ;(async () => {
      const w = await createWorker('eng')

      // 숫자 인식 최적화 설정
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

  const stop = () => {
    workerRef.current?.terminate()
    workerRef.current = null
    setLineText('—')
    lastValueRef.current = null
    stableCountRef.current = 0
  }

  const recognize = async (canvas: HTMLCanvasElement) => {
    if (!workerRef.current) return

    const res = await workerRef.current.recognize(canvas)

    const raw = res.data.text
    const txt = raw.replace(/[^0-9]/g, '')
    if (!txt || txt.length < 2) return

    const n = Number(txt)
    if (Number.isNaN(n) || n < 1 || n > 1500) return

    const last = lastValueRef.current

    if (last === null) {
      // 첫 값
      lastValueRef.current = n
      stableCountRef.current = 1
      return
    }

    // + - 10 이내면 "같은 값"으로 간주
    if (Math.abs(n - last) <= 10) {
      stableCountRef.current += 1

      lastValueRef.current = n
    } else {
      // 완전히 튀는 값 > 리셋
      lastValueRef.current = n
      stableCountRef.current = 1
      return
    }

    // 2회 이상 연속 안정 시 확정
    if (stableCountRef.current >= 2) {
      setLineText(String(lastValueRef.current))
    }
  }

  return { lineText, recognize, stop }
}

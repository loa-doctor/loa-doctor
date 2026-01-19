import { useState, useRef, useCallback } from 'react'
import Tesseract from 'tesseract.js'

export const useTesseractOCR = () => {
  const [lineText, setLineText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const lastValueRef = useRef<number | null>(null)

  const recognize = useCallback(
    async (canvas: HTMLCanvasElement, onLineDetected?: (line: number) => void) => {
      if (isLoading) return
      setIsLoading(true)

      try {
        const result = await Tesseract.recognize(canvas, 'eng')

        const text = result.data.text.replace(/[^0-9]/g, '')
        setLineText(text)

        const n = parseInt(text, 10)

        if (!isNaN(n)) {
          // 리트라이(갑자기 숫자가 커짐) 허용 로직
          // 줄어드는 방향에서만 급격한 변화(-50줄 이상)를 오인식으로 차단
          if (lastValueRef.current !== null) {
            const diff = n - lastValueRef.current
            if (diff < -50) {
              setIsLoading(false)
              return
            }
          }

          onLineDetected?.(n)
          lastValueRef.current = n
        }
      } catch (err) {
        console.error('OCR Error:', err)
      } finally {
        setIsLoading(false)
      }
    },
    [isLoading]
  )

  const stop = useCallback(() => {
    // 필요한 경우 Tesseract 워커 종료 로직 추가 가능
    setLineText('')
    lastValueRef.current = null
  }, [])

  return { lineText, recognize, stop, isLoading }
}

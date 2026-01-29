import { useState, useRef, useCallback } from 'react'
import Tesseract from 'tesseract.js'

export const useTesseractOCR = () => {
  const [lineText, setLineText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(false)
  const lastValueRef = useRef<number | null>(null)

  const processingRef = useRef(false)

  const recognize = useCallback(
    async (canvas: HTMLCanvasElement, onLineDetected?: (line: number | null, confidence: number) => void) => {
      if (processingRef.current) return
      processingRef.current = true
      setIsLoading(true)

      try {
        const result = await Tesseract.recognize(canvas, 'eng')

        const text = result.data.text.replace(/[^0-9]/g, '')
        setLineText(text)

        const n = parseInt(text, 10)
        if (!isNaN(n)) {
          onLineDetected?.(n, result.data.confidence)
          lastValueRef.current = n
        } else {
          onLineDetected?.(null, result.data.confidence)
        }
      } catch (err) {
        console.error('OCR Error:', err)
      } finally {
        processingRef.current = false
        setIsLoading(false)
      }
    },
    [] // 의존성 제거로 인한 인터벌 안정화
  )



  const stop = useCallback(() => {
    // 필요한 경우 Tesseract 워커 종료 로직 추가 가능
    setLineText('')
    lastValueRef.current = null
  }, [])

  return { lineText, recognize, stop, isLoading }
}

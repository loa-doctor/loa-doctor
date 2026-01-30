import { useState, useRef, useCallback, useEffect } from 'react'
import { createWorker, type Worker, PSM } from 'tesseract.js'

export const useTesseractOCR = () => {
  const [lineText, setLineText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const workerRef = useRef<Worker | null>(null)
  const processingRef = useRef(false)
  const lastValueRef = useRef<number | null>(null)

  // Initialize Persistent Worker
  useEffect(() => {
    let active = true
    const initWorker = async () => {
        try {
            console.log('[useTesseractOCR] Initializing Worker...')
            // Version 6+ syntax
            const worker = await createWorker('eng')
            
            // PSM 7 = Treat the image as a single text line.
            // Whitelist disabled temporarily to verify any detection.
            await worker.setParameters({
                tessedit_pageseg_mode: PSM.SINGLE_LINE, 
                // tessedit_char_whitelist: '0123456789xX'
            })
            
            if (active) {
                workerRef.current = worker
                setIsLoading(false)
                console.log('[useTesseractOCR] Worker Ready')
            } else {
                await worker.terminate()
            }
        } catch (err) {
            console.error('[useTesseractOCR] Init Error', err)
            setIsLoading(false)
        }
    }
    initWorker()
    
    return () => {
        active = false
        if (workerRef.current) {
            console.log('[useTesseractOCR] Terminating Worker')
            workerRef.current.terminate()
            workerRef.current = null
        }
    }
  }, [])

  const recognize = useCallback(
    async (imageInput: any, onLineDetected?: (line: number | null, confidence: number) => void) => {
      if (!workerRef.current || processingRef.current) return null
      
      processingRef.current = true

      try {
        const result = await workerRef.current.recognize(imageInput)
        // console.log('[OCR Debug] Raw:', result.data.text)

        const text = result.data.text.replace(/[^0-9]/g, '')
        setLineText(text)

        const n = parseInt(text, 10)
        if (!isNaN(n)) {
          onLineDetected?.(n, result.data.confidence)
          lastValueRef.current = n
        } else {
          onLineDetected?.(null, result.data.confidence)
        }
        return result
      } catch (err) {
        console.error('OCR Error:', err)
        return null
      } finally {
        processingRef.current = false
      }
    },
    []
  )

  const stop = useCallback(() => {
    setLineText('')
    lastValueRef.current = null
  }, [])

  return { lineText, recognize, stop, isLoading }
}

import { useEffect, useRef, useState } from 'react'
import { createWorker, Worker } from 'tesseract.js'

export function useTesseractOCR() {
  const workerRef = useRef<Worker | null>(null)
  const [lineText, setLineText] = useState('—')

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const w = await createWorker('eng')
      if (mounted) workerRef.current = w
    })()
    return () => {
      mounted = false
      workerRef.current?.terminate()
    }
  }, [])

  const stop = () => {
    workerRef.current?.terminate()
    workerRef.current = null
    setLineText('—')
  }

  const recognize = async (canvas: HTMLCanvasElement) => {
    if (!workerRef.current) return
    const res = await workerRef.current.recognize(canvas)
    const txt = res.data.text.replace(/[^0-9]/g, '')
    if (txt) setLineText(txt)
  }

  return { lineText, recognize, stop }
}
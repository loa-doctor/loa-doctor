import { useEffect, RefObject } from 'react'
import { Rect } from '../utils/types'

type UseBossLineSearchingProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  rect: Rect | null
  enabled: boolean
  recognize: (canvas: HTMLCanvasElement, callback?: (line: number | null, confidence: number) => void) => Promise<void>
  onDetected: (line: number) => void
  interval?: number
}

export function useBossLineSearching({
  videoRef,
  canvasRef,
  rect,
  enabled,
  recognize,
  onDetected,
  interval = 700,
}: UseBossLineSearchingProps) {
  useEffect(() => {
    if (!enabled) return
    if (!videoRef.current || !canvasRef.current || !rect) return

    const video = videoRef.current
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let stopped = false
    let cnt = 0
    const loop = async () => {
      if (stopped) return
      cnt++
      if (cnt === 3) {
        onDetected(cnt)
        stopped = true
      }

      setTimeout(loop, interval)
    }

    loop()
    return () => {
      stopped = true
      onDetected(cnt)
    }
  }, [enabled, rect, recognize, onDetected, interval, videoRef, canvasRef])
}

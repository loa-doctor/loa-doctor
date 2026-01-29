import { useEffect, RefObject } from 'react'
import { Rect } from '../utils/types'

type UseBossLineSearchingProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  rect: Rect | null
  enabled: boolean
  // Placeholder: scan dependency removed
  onDetected: (tuning?: any) => void
  interval?: number
}

export function useBossLineSearching({
  videoRef,
  canvasRef,
  rect,
  enabled,
  onDetected,
  interval = 1000,
}: UseBossLineSearchingProps) {
  useEffect(() => {
    if (!enabled) return
    if (!videoRef.current || !canvasRef.current || !rect) return

    let stopped = false
    
    // Logic Rolled Back.
    // Use a simple timeout to simulate "Search complete" or just wait for manual interaction?
    // Given the user said "Rollback indexing", we assume we shouldn't try to find anything.
    // We'll just transition to LOCKED after a short delay (simulating successful "check").
    // OR, we can just sit in SEARCHING until manually locked?
    // The previous implementation (before X-find) was a loop that counted to 3 and locked.
    // Let's restore that simple behavior.
    
    let cnt = 0
    const loop = async () => {
        if (stopped) return
        cnt++
        if (cnt >= 3) {
            onDetected() // No tuning update
            stopped = true
            return
        }
        setTimeout(loop, interval)
    }

    loop()
    return () => {
      stopped = true
    }
  }, [enabled, rect, onDetected, interval, videoRef, canvasRef])
}

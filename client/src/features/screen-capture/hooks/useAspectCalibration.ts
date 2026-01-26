import { useEffect, useState } from 'react'
import { Rect, Aspect } from '../utils/types'
import { calcLargestRect, pickBestRect, lerpRect } from '../utils/rect'

export type CalibrationState = {
  phase: 'IDLE' | 'SEARCHING' | 'LOCKED'
  aspect: Aspect
  displayRect: Rect | null
  lockedRect: Rect | null
  startSearch: () => void
  reset: () => void
}

export function useAspectCalibration(videoRef: React.RefObject<HTMLVideoElement | null>): CalibrationState {
  const [phase, setPhase] = useState<'IDLE' | 'SEARCHING' | 'LOCKED'>('IDLE')
  const [aspect, setAspect] = useState<Aspect>('UNKNOWN')
  const [displayRect, setDisplayRect] = useState<Rect | null>(null)
  const [lockedRect, setLockedRect] = useState<Rect | null>(null)

  useEffect(() => {
    if (phase !== 'SEARCHING') return
    const video = videoRef.current
    if (!video) return

    let raf = 0
    let start = 0
    let last: Rect | null = null

    const tick = (ts: number) => {
      if (!start) start = ts
      if (!video.videoWidth) return (raf = requestAnimationFrame(tick))

      const w = video.videoWidth
      const h = video.videoHeight
      const r21 = calcLargestRect(w, h, '21:9')
      const r16 = calcLargestRect(w, h, '16:9')
      const best = pickBestRect(w, h)
      if (!r21 || !r16 || !best) return

      const elapsed = ts - start
      const d = 1200

      if (elapsed < d) {
        setAspect('21:9')
        setDisplayRect(last ? lerpRect(last, r21, elapsed / d) : r21)
        last = r21
      } else if (elapsed < d * 2) {
        setAspect('16:9')
        setDisplayRect(last ? lerpRect(last, r16, (elapsed - d) / d) : r16)
        last = r16
      } else if (elapsed < d * 3) {
        setAspect(best.aspect)
        setDisplayRect(last ? lerpRect(last, best, (elapsed - d * 2) / d) : best)
        last = best
      } else {
        setLockedRect(best)
        setDisplayRect(best)
        setPhase('LOCKED')
        return
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  return {
    phase,
    aspect,
    displayRect,
    lockedRect,
    startSearch: () => setPhase('SEARCHING'),
    reset: () => {
      setPhase('IDLE')
      setAspect('UNKNOWN')
      setDisplayRect(null)
      setLockedRect(null)
    },
  }
}

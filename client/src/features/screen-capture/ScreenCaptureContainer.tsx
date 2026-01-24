'use client'

import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import ScreenCaptureView from './components/ScreenCaptureView'
import { useScreenShare } from './hooks/useScreenShare'
import { useAspectCalibration } from './hooks/useAspectCalibration'
import { useTesseractOCR } from './hooks/useTesseractOCR'
import { type RectTuning } from './utils/rect'
import { STORAGE_KEYS } from './utils/storageKeys'
import { useOCRLoop } from './hooks/useOCRLoop'

export type ScreenCaptureHandle = {
  startCapture: () => void
  stopCapture: () => void
}

export const ScreenCaptureContainer = forwardRef<
  ScreenCaptureHandle,
  {
    embed?: boolean
    onLineDetected?: (line: number) => void
  }
>(function ScreenCaptureContainer({ embed = false, onLineDetected }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const ocrPreviewCanvasRef = useRef<HTMLCanvasElement>(null)

  // ===== hooks =====
  const { start, stop } = useScreenShare(videoRef)
  const calibration = useAspectCalibration(videoRef)
  const { lineText, recognize, stop: stopOCR } = useTesseractOCR()

  useImperativeHandle(ref, () => ({
    startCapture() {
      start()
      calibration.startSearch()
    },
    stopCapture() {
      stop()
      stopOCR()
      calibration.reset()
    },
  }))

  // ===== debug =====
  const [debugOn, setDebugOn] = useState(true)

  const DEFAULT_TUNING: RectTuning = {
    scale: 0.05,
    padX: 0,
    padY: 0,
    offXRatio: 0.15,
    offYRatio: -0.43,
    threshold: 50,
  }

  const [tuning, setTuning] = useState<RectTuning>(() => {
    if (typeof window === 'undefined') return DEFAULT_TUNING

    try {
      const saved = localStorage.getItem(STORAGE_KEYS.TUNING)
      if (!saved) return DEFAULT_TUNING

      return {
        ...DEFAULT_TUNING,
        ...JSON.parse(saved),
      }
    } catch {
      return DEFAULT_TUNING
    }
  })

  const handleTuningChange = (v: Partial<RectTuning>) => {
    setTuning(prev => ({ ...prev, ...v }))
  }

  // ===== OCR Loop =====
  useOCRLoop({
    videoRef,
    canvasRef: ocrPreviewCanvasRef,
    calibration,
    tuning,
    recognize,
    onLineDetected,
  })

  // ===== OCR ROI =====
  const effectiveTuning =
    calibration.phase === 'LOCKED'
      ? tuning
      : DEFAULT_TUNING

  return (
    <ScreenCaptureView
      ocrPreviewCanvasRef={ocrPreviewCanvasRef}
      videoRef={videoRef}
      {...calibration}
      debugOn={debugOn}
      onToggleDebug={() => setDebugOn(v => !v)}
      tuning={effectiveTuning}
      rawTuning={tuning}
      onTuningChange={handleTuningChange}
      lineText={lineText}
    />
  )
})

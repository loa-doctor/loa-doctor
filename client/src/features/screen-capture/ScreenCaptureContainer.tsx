'use client'

import { useRef, useState, forwardRef, useImperativeHandle } from 'react'
import ScreenCaptureView from './components/ScreenCaptureView'
import { useScreenShare } from './hooks/useScreenShare'
import { useAspectCalibration } from './hooks/useAspectCalibration'
import { useTesseractOCR } from './hooks/useTesseractOCR'
import { type RectTuning } from './utils/rect'
import { STORAGE_KEYS } from './utils/storageKeys'
import { useOCRLoop } from './hooks/useOCRLoop'
import { useBossLineSearching } from './hooks/useBossLineSearching'

export type ScreenCaptureHandle = {
  startCapture: () => void
  stopCapture: () => void
}

export const ScreenCaptureContainer = forwardRef<
  ScreenCaptureHandle,
  {
    embed?: boolean
    onLineDetected?: (line: number, confidence?: number) => void
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
      calibration.startSetting()
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

const [userTuning, setUserTuning] = useState<RectTuning>(() => {
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

// OCR / Preview에서 실제로 쓰는 tuning
const runtimeTuning: RectTuning =
  calibration.phase === 'LOCKED'
    ? userTuning        // 분석 중엔 사용자 튜닝
    : DEFAULT_TUNING    // SETTING / SEARCHING은 항상 기본값


const handleTuningChange = (v: Partial<RectTuning>) => {
  setUserTuning(prev => ({ ...prev, ...v }))
}

  // ===== Boss Line Searching (SEARCHING 전용) =====
  useBossLineSearching({
    videoRef,
    canvasRef: ocrPreviewCanvasRef,
    rect: calibration.lockedRect,
    enabled: calibration.phase === 'SEARCHING',
    recognize,
    onDetected: line => {
      calibration.lock()          // SEARCHING → LOCKED
      onLineDetected?.(line)      // 외부 전달
    },
  })
  // ===== OCR Loop =====
  useOCRLoop({
    videoRef,
    canvasRef: ocrPreviewCanvasRef,
    calibration,
    tuning: runtimeTuning,
    recognize,
    onLineDetected,
  })


  return (
    <ScreenCaptureView
      ocrPreviewCanvasRef={ocrPreviewCanvasRef}
      videoRef={videoRef}
      {...calibration}
      debugOn={debugOn}
      onToggleDebug={() => setDebugOn(v => !v)}
      tuning={runtimeTuning}
      rawTuning={userTuning}
      onTuningChange={handleTuningChange}
      lineText={lineText}
    />
  )
})

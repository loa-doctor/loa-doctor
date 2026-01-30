'use client'

import { useRef, useState, forwardRef, useImperativeHandle, useCallback } from 'react'
import ScreenCaptureView from './components/ScreenCaptureView'
import { useScreenShare } from './hooks/useScreenShare'
import { useAspectCalibration } from './hooks/useAspectCalibration'
import { useTesseractOCR } from './hooks/useTesseractOCR'
import { type RectTuning } from './utils/rect'
import { STORAGE_KEYS } from './utils/storageKeys'
import { useOCRLoop } from './hooks/useOCRLoop'
import { useBossLineSearching } from './hooks/useBossLineSearching'
import { useOpenCV } from '../../hooks/useOpenCV'

export type ScreenCaptureHandle = {
  startCapture: () => void
  stopCapture: () => void
  getPhase: () => 'IDLE' | 'SETTING' | 'SEARCHING' | 'LOCKED'
  getCanvas: () => HTMLCanvasElement | null
}

export const ScreenCaptureContainer = forwardRef<
  ScreenCaptureHandle,
  {
    embed?: boolean
    onLineDetected?: (line: number | null, confidence?: number) => void
    raidName?: string
    gateName?: string
  }
>(function ScreenCaptureContainer({ embed = false, onLineDetected, raidName, gateName }, ref) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const ocrPreviewCanvasRef = useRef<HTMLCanvasElement>(null)

  // ===== hooks =====
  const { start, stop } = useScreenShare(videoRef)
  const calibration = useAspectCalibration(videoRef)
  const { lineText, recognize, stop: stopOCR } = useTesseractOCR()
  const { cv, loaded: cvLoaded } = useOpenCV()

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
    getPhase() {
      return calibration.phase
    },
    getCanvas() {
      return ocrPreviewCanvasRef.current
    }
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
  const handleDetected = useCallback((foundRect: any) => {
      // 1. Get Base Rect (Should be the 16:9/21:9 Screen Fit)
      const base = calibration.lockedRect
      if (!base) return

      // 2. Target Constants (User Requested)
      const TARGET_SCALE = 0.04 // Width Ratio
      const TARGET_OFF_Y = -0.430 // Fixed Y Offset
      const TARGET_THRESH = 50
      
      // 3. Calculate Ratio for Left Alignment
      // Goal: LockedRect.x === foundRect.x (Left borders match)
      // LockedRect.x = (Center - ScaledW/2) + OffsetPx
      
      const cx = base.x + base.w / 2
      const scaledW = base.w * TARGET_SCALE
      const defaultLeft = cx - scaledW / 2
      
      const targetLeft = foundRect.x
      const requiredOffsetPx = targetLeft - defaultLeft
      const calculatedRatio = requiredOffsetPx / base.w
      
      console.log('[Capture] Auto-Lock Alignment:', {
          foundX: foundRect.x,
          defaultLeft,
          requiredOffsetPx,
          ratio: calculatedRatio,
          debugCheck: defaultLeft + (base.w * calculatedRatio)
      })

      // 4. Update User Tuning
      handleTuningChange({
          scale: TARGET_SCALE,
          threshold: TARGET_THRESH,
          offYRatio: TARGET_OFF_Y,
          offXRatio: calculatedRatio
      })

      // 5. Switch to LOCKED phase
      calibration.lock()
  }, [calibration])

  useBossLineSearching({
    videoRef,
    canvasRef: ocrPreviewCanvasRef,
    rect: calibration.lockedRect,
    enabled: calibration.phase === 'SEARCHING',
    onDetected: handleDetected,
    recognize,
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

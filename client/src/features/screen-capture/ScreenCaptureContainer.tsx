'use client'

import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react'
import ScreenCaptureView from './components/ScreenCaptureView'
import { useScreenShare } from './hooks/useScreenShare'
import { useAspectCalibration } from './hooks/useAspectCalibration'
import { useTesseractOCR } from './hooks/useTesseractOCR'
import { applyTuning, type RectTuning } from './utils/rect'
import { STORAGE_KEYS } from './utils/storageKeys'

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

  // ===== OCR ROI =====
  const roi = { x: 0.15, y: 0.27, w: 0.7, h: 0.4 }
  const scaleOCR = 4
  const effectiveTuning =
    calibration.phase === 'LOCKED'
      ? tuning
      : DEFAULT_TUNING
  /**
   * 프리뷰 + OCR 공용 draw 함수
   */
  const drawOCRPreview = useCallback(() => {
    const video = videoRef.current
    const canvas = ocrPreviewCanvasRef.current
    if (!video || !canvas) return
    if (!video.videoWidth || !video.videoHeight) return
    if (!calibration.lockedRect) return

    const tuned = applyTuning(
      calibration.lockedRect,
      video.videoWidth,
      video.videoHeight,
      effectiveTuning
    )

    const rx = Math.round(tuned.w * roi.x)
    const ry = Math.round(tuned.h * roi.y)
    const rw = Math.round(tuned.w * roi.w)
    const rh = Math.round(tuned.h * roi.h)

    if (rw < 10 || rh < 10) return

    canvas.width = rw * scaleOCR
    canvas.height = rh * scaleOCR

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = true
    ctx.filter = 'grayscale(100%) contrast(110%)'

    ctx.drawImage(video, tuned.x + rx, tuned.y + ry, rw, rh, 0, 0, canvas.width, canvas.height)

    ctx.filter = 'none'
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const data = imageData.data

    let sum = 0
    let count = 0

    for (let i = 0; i < data.length; i += 4) {
      sum += data[i]
      count++
    }

    const avg = sum / count
    const THRESHOLD = avg + tuning.threshold // < 튜닝해야하는 값

    for (let i = 0; i < data.length; i += 4) {
      const v = data[i]
      const t = v > THRESHOLD ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = t
    }

    ctx.putImageData(imageData, 0, 0)
  }, [calibration.lockedRect, tuning])

  /**
   * OCR 루프 (느리게)
   */
  useEffect(() => {
    if (calibration.phase !== 'LOCKED') return
    const canvas = ocrPreviewCanvasRef.current
    if (!canvas) return

    const id = window.setInterval(() => {
      recognize(canvas, line => {
        onLineDetected?.(line)
      })
      drawOCRPreview()
    }, 800)

    return () => clearInterval(id)
  }, [calibration.phase, recognize, drawOCRPreview, onLineDetected])

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

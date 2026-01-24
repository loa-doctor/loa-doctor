import { useEffect, useCallback, RefObject } from 'react'
import { applyTuning, type RectTuning } from '../utils/rect'
import { type CalibrationState } from './useAspectCalibration'

type UseOCRLoopProps = {
  videoRef: RefObject<HTMLVideoElement | null>
  canvasRef: RefObject<HTMLCanvasElement | null>
  calibration: CalibrationState
  tuning: RectTuning
  recognize: (canvas: HTMLCanvasElement, callback?: (line: number) => void) => Promise<void>
  onLineDetected?: (line: number) => void
  roi?: { x: number; y: number; w: number; h: number }
  interval?: number
}

export const useOCRLoop = ({
  videoRef,
  canvasRef,
  calibration,
  tuning,
  recognize,
  onLineDetected,
  roi = { x: 0.15, y: 0.27, w: 0.7, h: 0.4 },
  interval = 800,
}: UseOCRLoopProps) => {
  const scaleOCR = 4

  const drawOCRPreview = useCallback(() => {
    const video = videoRef.current
    const canvas = canvasRef.current
    if (!video || !canvas) return
    if (!video.videoWidth || !video.videoHeight) return
    if (!calibration.lockedRect) return

    const effectiveTuning = calibration.phase === 'LOCKED' ? tuning : { ...tuning, scale: 0.05 }

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

    // Average calculation
    for (let i = 0; i < data.length; i += 4) {
      sum += data[i]
      count++
    }

    const avg = sum / count
    const THRESHOLD = avg + tuning.threshold

    // Thresholding
    for (let i = 0; i < data.length; i += 4) {
      const v = data[i]
      const t = v > THRESHOLD ? 255 : 0
      data[i] = data[i + 1] = data[i + 2] = t
    }

    ctx.putImageData(imageData, 0, 0)
  }, [calibration.lockedRect, calibration.phase, tuning, roi, videoRef, canvasRef])

  useEffect(() => {
    if (calibration.phase !== 'LOCKED') return
    const canvas = canvasRef.current
    if (!canvas) return

    const id = window.setInterval(() => {
      recognize(canvas, line => {
        onLineDetected?.(line)
      })
      drawOCRPreview()
    }, interval)

    return () => clearInterval(id)
  }, [calibration.phase, recognize, drawOCRPreview, onLineDetected, interval, canvasRef])

  return { drawOCRPreview }
}

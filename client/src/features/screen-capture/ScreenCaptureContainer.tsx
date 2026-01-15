'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import ScreenCaptureView from './components/ScreenCaptureView'
import { useScreenShare } from './hooks/useScreenShare'
import { useAspectCalibration } from './hooks/useAspectCalibration'
import { useTesseractOCR } from './hooks/useTesseractOCR'
import { applyTuning, type RectTuning } from './utils/rect'

export default function ScreenCaptureContainer() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const ocrPreviewCanvasRef = useRef<HTMLCanvasElement>(null)

  // ===== hooks =====
  const { start, stop } = useScreenShare(videoRef)
  const calibration = useAspectCalibration(videoRef)
  const { lineText, recognize, stop: stopOCR } = useTesseractOCR()

  // ===== debug =====
  const [debugOn, setDebugOn] = useState(true)

  // ===== tuning =====
  const [tuning, setTuning] = useState<RectTuning>({
    scale: 0.05,
    padX: 0,
    padY: 0,
    offXRatio: 0.15,
    offYRatio: -0.43,
  })

  const handleTuningChange = (v: Partial<RectTuning>) => {
    setTuning(prev => ({ ...prev, ...v }))
  }

  const handleStopAll = () => {
    stop()
    stopOCR()
    calibration.reset()
  }

  // ===== OCR ROI =====
  const roi = { x: 0.15, y: 0.27, w: 0.7, h: 0.4 }
  const scaleOCR = 4

  /**
   * 프리뷰 + OCR 공용 draw 함수
   */
  const drawOCRPreview = useCallback(() => {
    const video = videoRef.current
    const canvas = ocrPreviewCanvasRef.current
    if (!video || !canvas) return
    if (!video.videoWidth || !video.videoHeight) return
    if (!calibration.lockedRect) return

    const tuned = applyTuning(calibration.lockedRect, video.videoWidth, video.videoHeight, tuning)

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
    const THRESHOLD = avg + 25 // < 튜닝해야하는 값

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
      recognize(canvas)
      drawOCRPreview()
    }, 800)

    return () => clearInterval(id)
  }, [calibration.phase, recognize, drawOCRPreview])

  return (
    <>
      <div className="flex gap-3 mt-4 ml-4">
        <button
          onClick={() => {
            start()
            calibration.startSearch()
          }}
          className="px-5 py-2.5 rounded-lg bg-zinc-900 text-zinc-100 border border-zinc-700 hover:bg-zinc-800"
        >
          ▶ 화면 공유 시작
        </button>

        <button
          onClick={handleStopAll}
          className="px-5 py-2.5 rounded-lg bg-red-900/80 text-red-100 border border-red-700 hover:bg-red-800"
        >
          ⏹ 전체 중지
        </button>
      </div>

      <ScreenCaptureView
        ocrPreviewCanvasRef={ocrPreviewCanvasRef}
        videoRef={videoRef}
        {...calibration}
        debugOn={debugOn}
        onToggleDebug={() => setDebugOn(v => !v)}
        tuning={tuning}
        onTuningChange={handleTuningChange}
        lineText={lineText}
      />
    </>
  )
}

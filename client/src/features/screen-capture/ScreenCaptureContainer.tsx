'use client'

import { useEffect, useRef, useState } from 'react'
import ScreenCaptureView from './components/ScreenCaptureView'
import { useScreenShare } from './hooks/useScreenShare'
import { useAspectCalibration } from './hooks/useAspectCalibration'
import { useTesseractOCR } from './hooks/useTesseractOCR'
import { applyTuning, type RectTuning } from './utils/rect'

export default function ScreenCaptureContainer() {
  const videoRef = useRef<HTMLVideoElement>(null)

  // ===== hooks =====
  const { start, stop } = useScreenShare(videoRef)
  const calibration = useAspectCalibration(videoRef)
  const { lineText, stop: stopOCR } = useTesseractOCR()

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
    stop() // 화면 공유 중지
    stopOCR() // OCR worker 종료
    calibration.reset() // phase / rect 리셋
  }
  // ROI 비율은 일단 기존 값 그대로 박아도 됨
  const roi = { x: 0.15, y: 0.27, w: 0.7, h: 0.4 }
  const scaleOCR = 4

  // ...Container 내부
  const ocrPreviewCanvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    if (calibration.phase !== 'LOCKED') return

    const video = videoRef.current
    if (!video) return

    let timer: number | null = null

    const drawOCRPreview = () => {
      const canvas = ocrPreviewCanvasRef.current
      if (!canvas) return
      if (!video.videoWidth || !video.videoHeight) return
      if (!calibration.lockedRect) return

      const tuned = applyTuning(calibration.lockedRect, video.videoWidth, video.videoHeight, tuning)

      // ROI (tuned 기준)
      const rx = Math.round(tuned.w * roi.x)
      const ry = Math.round(tuned.h * roi.y)
      const rw = Math.round(tuned.w * roi.w)
      const rh = Math.round(tuned.h * roi.h)

      if (rw < 10 || rh < 10) return

      canvas.width = rw * scaleOCR
      canvas.height = rh * scaleOCR

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.imageSmoothingEnabled = true
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // ✅ 예전처럼 필터 적용
      ctx.filter = 'grayscale(100%) contrast(110%) brightness(80%)'

      ctx.drawImage(video, tuned.x + rx, tuned.y + ry, rw, rh, 0, 0, canvas.width, canvas.height)

      ctx.filter = 'none'
    }

    drawOCRPreview()
    timer = window.setInterval(drawOCRPreview, 200) // 프리뷰는 200ms 정도면 충분히 부드러움

    return () => {
      if (timer) clearInterval(timer)
    }
  }, [calibration.phase, calibration.lockedRect, tuning])
  return (
    <>
      <div className="flex gap-3 mt-4 ml-4">
        {/* 시작 버튼 */}
        <button
          onClick={() => {
            start()
            calibration.startSearch()
          }}
          className="
            inline-flex items-center gap-2
            px-5 py-2.5 rounded-lg
            bg-zinc-900 text-zinc-100
            border border-zinc-700
            hover:bg-zinc-800 hover:border-zinc-600
            active:translate-y-[1px]
            transition
          "
        >
          ▶ 화면 공유 시작
        </button>

        {/* 중지 버튼 */}
        <button
          onClick={handleStopAll}
          className="
            inline-flex items-center gap-2
            px-5 py-2.5 rounded-lg
            bg-red-900/80 text-red-100
            border border-red-700
            hover:bg-red-800
            active:translate-y-[1px]
            transition
          "
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

'use client'

import { useEffect, useRef, useState } from 'react'

type Aspect = '16:9' | '21:9' | 'UNKNOWN'

/* =============================
 * 가장 큰 16:9 / 21:9 사각형 찾기
 * ============================= */
function findLargestAspectRect(
  frameW: number,
  frameH: number
): {
  aspect: Aspect
  x: number
  y: number
  w: number
  h: number
} | null {
  const candidates = [
    { aspect: '21:9' as const, ratio: 21 / 9 },
    { aspect: '16:9' as const, ratio: 16 / 9 },
  ]

  let best: {
    aspect: Aspect
    x: number
    y: number
    w: number
    h: number
  } | null = null

  for (const c of candidates) {
    // 최대 크기로 먼저 시도
    let w = frameW
    let h = Math.floor(w / c.ratio)

    // 프레임 높이를 넘으면 반대로 계산
    if (h > frameH) {
      h = frameH
      w = Math.floor(h * c.ratio)
    }

    if (w <= 0 || h <= 0) continue

    const area = w * h
    if (!best || area > best.w * best.h) {
      best = {
        aspect: c.aspect,
        x: Math.floor((frameW - w) / 2),
        y: Math.floor((frameH - h) / 2),
        w,
        h,
      }
    }
  }

  return best
}

export default function Test() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null)

  const [aspect, setAspect] = useState<Aspect>('UNKNOWN')

  /* =============================
   * 화면 공유 시작
   * ============================= */
  const startScreenShare = async () => {
    const stream = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: 15 },
      audio: false,
    })

    if (videoRef.current) {
      videoRef.current.srcObject = stream
      await videoRef.current.play()
    }
  }

  /* =============================
   * 프레임 처리 루프
   * ============================= */
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        !videoRef.current ||
        !fullCanvasRef.current ||
        !gameCanvasRef.current
      )
        return

      const video = videoRef.current
      if (!video.videoWidth || !video.videoHeight) return

      /* ---------- 전체 프레임 ---------- */
      const fullCanvas = fullCanvasRef.current
      const fullCtx = fullCanvas.getContext('2d')!
      fullCanvas.width = video.videoWidth
      fullCanvas.height = video.videoHeight
      fullCtx.drawImage(video, 0, 0)

      /* ---------- 가장 큰 16:9 / 21:9 사각형 ---------- */
      const rect = findLargestAspectRect(
        fullCanvas.width,
        fullCanvas.height
      )

      if (!rect) {
        setAspect('UNKNOWN')
        return
      }

      setAspect(rect.aspect)

      /* ---------- 게임 화면 캔버스 ---------- */
      const gameCanvas = gameCanvasRef.current
      const gameCtx = gameCanvas.getContext('2d')!

      gameCanvas.width = rect.w
      gameCanvas.height = rect.h

      gameCtx.drawImage(
        fullCanvas,
        rect.x,
        rect.y,
        rect.w,
        rect.h,
        0,
        0,
        rect.w,
        rect.h
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">
        LoA Screen – Largest Aspect Extractor
      </h1>

      <button
        onClick={startScreenShare}
        className="px-4 py-2 bg-blue-600 text-white rounded"
      >
        화면 공유 시작
      </button>

      <div className="text-lg font-semibold">
        감지된 화면 비율:{' '}
        <span className="text-red-600">{aspect}</span>
      </div>

      <video ref={videoRef} className="hidden" />

      <div>
        <p className="font-semibold">전체 프레임</p>
        <canvas
          ref={fullCanvasRef}
          className="border w-full max-w-4xl"
        />
      </div>

      <div>
        <p className="font-semibold">게임 화면 (추출 결과)</p>
        <canvas
          ref={gameCanvasRef}
          className="border w-full max-w-4xl"
        />
      </div>
    </div>
  )
}

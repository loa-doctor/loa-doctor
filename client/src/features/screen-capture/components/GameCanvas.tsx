'use client'

import { useEffect, useRef } from 'react'
import { Rect } from '../utils/types'
import { applyTuning } from '../utils/rect' // ← 기존 함수 그대로 이동해두면 됨

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  rect: Rect | null
  tuning: {
    scale: number
    padX: number
    padY: number
    offXRatio: number
    offYRatio: number
  }
}

export default function GameCanvas({ videoRef, rect, tuning }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || !rect) return
    if (!video.videoWidth || !video.videoHeight) return

    const tuned = applyTuning(rect, video.videoWidth, video.videoHeight, tuning)

    const ctx = canvas.getContext('2d')!
    canvas.width = tuned.w
    canvas.height = tuned.h

    ctx.drawImage(video, tuned.x, tuned.y, tuned.w, tuned.h, 0, 0, tuned.w, tuned.h)
  }, [videoRef, rect, tuning])

  return (
    <div className="space-y-2">
      <p className="font-semibold">게임 화면 (크롭 결과)</p>
      <div className="flex">
        <canvas
          ref={canvasRef}
          className="
      border
      max-w-lg
      aspect-video
      bg-black
      rounded-lg
      shadow-md
    "
        />
      </div>
    </div>
  )
}

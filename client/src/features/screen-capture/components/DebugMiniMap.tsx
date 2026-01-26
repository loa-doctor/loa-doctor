'use client'

import { useEffect, useRef } from 'react'
import { Rect, Aspect } from '../utils/types'
import { applyTuning, RectTuning } from '../utils/rect'

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  rect: Rect | null
  tuning: RectTuning
  phase: 'IDLE' | 'SETTING' | 'SEARCHING' | 'LOCKED'
  aspect: Aspect
}

export default function DebugMiniMap({ videoRef, rect, tuning, phase, aspect }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const video = videoRef.current
    if (!canvas || !video || !rect) return
    if (!video.videoWidth || !video.videoHeight) return

    const ctx = canvas.getContext('2d')!

    const maxW = 900
    const scale = Math.min(1, maxW / video.videoWidth)

    canvas.width = Math.round(video.videoWidth * scale)
    canvas.height = Math.round(video.videoHeight * scale)

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)

    const tuned = applyTuning(rect, video.videoWidth, video.videoHeight, tuning)

    const rx = Math.round(tuned.x * scale)
    const ry = Math.round(tuned.y * scale)
    const rw = Math.round(tuned.w * scale)
    const rh = Math.round(tuned.h * scale)

    // dim
    ctx.save()
    ctx.fillStyle = 'rgba(0,0,0,0.35)'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.clearRect(rx, ry, rw, rh)
    ctx.drawImage(video, tuned.x, tuned.y, tuned.w, tuned.h, rx, ry, rw, rh)

    ctx.lineWidth = 3
    ctx.strokeStyle = phase === 'LOCKED' ? '#22c55e' : '#f59e0b'
    ctx.strokeRect(rx, ry, rw, rh)

    ctx.fillStyle = 'rgba(0,0,0,0.7)'
    ctx.fillRect(rx, Math.max(0, ry - 26), 180, 24)
    ctx.fillStyle = '#fff'
    ctx.font = '12px system-ui'
    ctx.fillText(`${phase} • ${aspect}`, rx + 8, Math.max(16, ry - 10))
    ctx.restore()
  }, [videoRef, rect, tuning, phase, aspect])

  return (
    <div className="space-y-2">
      <p className="font-semibold">디버그 미니맵</p>
      <canvas
        ref={canvasRef}
        className="
    border
    max-w-lg
    bg-black
    rounded-lg
  "
      />
    </div>
  )
}

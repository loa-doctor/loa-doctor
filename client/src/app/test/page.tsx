'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

type Aspect = '16:9' | '21:9' | 'UNKNOWN'

type Rect = {
  aspect: Aspect
  x: number
  y: number
  w: number
  h: number
}

function calcLargestRect(frameW: number, frameH: number, aspect: Aspect): Rect | null {
  const ratio = aspect === '21:9' ? 21 / 9 : aspect === '16:9' ? 16 / 9 : 0
  if (!ratio) return null

  let w = frameW
  let h = Math.floor(w / ratio)

  if (h > frameH) {
    h = frameH
    w = Math.floor(h * ratio)
  }

  if (w <= 0 || h <= 0) return null

  return {
    aspect,
    x: Math.floor((frameW - w) / 2),
    y: Math.floor((frameH - h) / 2),
    w,
    h,
  }
}

function pickBestRect(frameW: number, frameH: number): Rect | null {
  const r21 = calcLargestRect(frameW, frameH, '21:9')
  const r16 = calcLargestRect(frameW, frameH, '16:9')
  const candidates = [r21, r16].filter(Boolean) as Rect[]
  if (!candidates.length) return null

  return candidates.reduce((best, cur) => (cur.w * cur.h > best.w * best.h ? cur : best))
}

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function lerpRect(from: Rect, to: Rect, t: number): Rect {
  return {
    aspect: to.aspect,
    x: Math.round(lerp(from.x, to.x, t)),
    y: Math.round(lerp(from.y, to.y, t)),
    w: Math.round(lerp(from.w, to.w, t)),
    h: Math.round(lerp(from.h, to.h, t)),
  }
}

/**
 * 디버깅용 “미세조절”을 적용한 최종 크롭 Rect 만들기
 * - scale: 0.8 ~ 1.0 (작게 줄이면 안전하게 안쪽으로 들어감)
 * - padX/padY: 추가로 안쪽 여백
 * - offX/offY: 위치 미세 이동 (px)
 */
function applyTuning(
  base: Rect,
  frameW: number,
  frameH: number,
  tuning: {
    scale: number
    padX: number
    padY: number
    offXRatio: number
    offYRatio: number
  }
): Rect {
  const scaledW = Math.round(base.w * tuning.scale)
  const scaledH = Math.round(base.h * tuning.scale)

  const cx = base.x + base.w / 2
  const cy = base.y + base.h / 2

  const offXPx = Math.round(base.w * tuning.offXRatio)
  const offYPx = Math.round(base.h * tuning.offYRatio)

  let x = Math.round(cx - scaledW / 2) + offXPx + tuning.padX
  let y = Math.round(cy - scaledH / 2) + offYPx + tuning.padY
  let w = scaledW - tuning.padX * 2
  let h = scaledH - tuning.padY * 2

  // clamp
  if (w < 1) w = 1
  if (h < 1) h = 1
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + w > frameW) w = frameW - x
  if (y + h > frameH) h = frameH - y

  return { ...base, x, y, w, h }
}

export default function Test() {
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // 캔버스
  const fullCanvasRef = useRef<HTMLCanvasElement | null>(null) // 디버그 미니맵용
  const gameCanvasRef = useRef<HTMLCanvasElement | null>(null) // 실제 출력(크롭)

  // 상태
  const [aspect, setAspect] = useState<Aspect>('UNKNOWN')
  const [debugOn, setDebugOn] = useState(true)

  // “찾는 과정” 표시를 위한 상태
  const [phase, setPhase] = useState<'IDLE' | 'SEARCHING' | 'LOCKED'>('IDLE')
  const [displayRect, setDisplayRect] = useState<Rect | null>(null) // 현재 화면에 보여줄(애니메이션) 사각형
  const [lockedRect, setLockedRect] = useState<Rect | null>(null) // 최종 확정 사각형(튜닝 전)

  // 튜닝 값(디버깅하면서 조절)
  const [scale, setScale] = useState(0.05) // 0.8~1.0 추천
  const [padX, setPadX] = useState(0) // px
  const [padY, setPadY] = useState(0) // px
  const [offXRatio, setOffXRatio] = useState(0.15) // -1.0 ~ 1.0
  const [offYRatio, setOffYRatio] = useState(-0.43)

  const tuning = useMemo(
    () => ({ scale, padX, padY, offXRatio, offYRatio }),
    [scale, padX, padY, offXRatio, offYRatio]
  )

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
      setPhase('SEARCHING')
      setLockedRect(null)
      setDisplayRect(null)
    }
  }

  /* =============================
   * 최초 1회: “천천히 찾는 과정” 애니메이션
   * 21:9 후보 보여주기 → 16:9 후보 → 최종 선택 후 LOCK
   * ============================= */
  useEffect(() => {
    if (phase !== 'SEARCHING') return

    const video = videoRef.current
    if (!video) return

    let raf = 0
    let started = 0
    let step: 0 | 1 | 2 | 3 = 0 // 0: 준비, 1: 21:9, 2: 16:9, 3: best lock
    let lastRect: Rect | null = null

    const tick = (ts: number) => {
      if (!started) started = ts

      if (!video.videoWidth || !video.videoHeight) {
        raf = requestAnimationFrame(tick)
        return
      }

      const frameW = video.videoWidth
      const frameH = video.videoHeight

      const r21 = calcLargestRect(frameW, frameH, '21:9')
      const r16 = calcLargestRect(frameW, frameH, '16:9')
      const best = pickBestRect(frameW, frameH)

      if (!r21 || !r16 || !best) {
        setAspect('UNKNOWN')
        raf = requestAnimationFrame(tick)
        return
      }

      // 총 3단계 연출(각 1.2초 정도)
      const elapsed = ts - started

      const stepDuration = 1200
      const total = stepDuration * 3

      if (elapsed < stepDuration) {
        step = 1
      } else if (elapsed < stepDuration * 2) {
        step = 2
      } else if (elapsed < total) {
        step = 3
      } else {
        // LOCK 확정
        setLockedRect(best)
        setDisplayRect(best)
        setAspect(best.aspect)
        setPhase('LOCKED')
        return
      }

      if (step === 1) {
        // 21:9로 천천히 이동(처음이라면 바로)
        const t = Math.min(1, elapsed / stepDuration)
        setAspect('21:9')
        setDisplayRect(lastRect ? lerpRect(lastRect, r21, t) : r21)
        lastRect = r21
      }

      if (step === 2) {
        const t = Math.min(1, (elapsed - stepDuration) / stepDuration)
        setAspect('16:9')
        setDisplayRect(lastRect ? lerpRect(lastRect, r16, t) : r16)
        lastRect = r16
      }

      if (step === 3) {
        const t = Math.min(1, (elapsed - stepDuration * 2) / stepDuration)
        setAspect(best.aspect)
        setDisplayRect(lastRect ? lerpRect(lastRect, best, t) : best)
        lastRect = best
      }

      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [phase])

  /* =============================
   * 프레임 렌더 루프
   * - 메인: 크롭 캔버스만 그려줌
   * - 디버그 on이면: full 미니맵 + 사각형 오버레이도 그려줌
   * ============================= */
  useEffect(() => {
    const timer = setInterval(() => {
      const video = videoRef.current
      const gameCanvas = gameCanvasRef.current
      const fullCanvas = fullCanvasRef.current

      if (!video || !gameCanvas) return
      if (!video.videoWidth || !video.videoHeight) return

      const frameW = video.videoWidth
      const frameH = video.videoHeight

      // 보여줄 rect: SEARCHING이면 displayRect, LOCKED면 lockedRect
      const baseRect = phase === 'LOCKED' ? lockedRect : displayRect
      if (!baseRect) return

      // 튜닝 적용(LOCKED 후에도 실시간으로 조절 가능)
      const tuned = applyTuning(baseRect, frameW, frameH, tuning)

      // ---- 메인 크롭(게임 캔버스) ----
      const gameCtx = gameCanvas.getContext('2d')!
      gameCanvas.width = tuned.w
      gameCanvas.height = tuned.h
      gameCtx.drawImage(video, tuned.x, tuned.y, tuned.w, tuned.h, 0, 0, tuned.w, tuned.h)

      // ---- 디버그 미니맵(옵션) ----
      if (debugOn && fullCanvas) {
        const ctx = fullCanvas.getContext('2d')!
        const maxW = 900 // 미니맵 표시 크기
        const scaleMini = Math.min(1, maxW / frameW)
        fullCanvas.width = Math.round(frameW * scaleMini)
        fullCanvas.height = Math.round(frameH * scaleMini)

        ctx.drawImage(video, 0, 0, fullCanvas.width, fullCanvas.height)

        // 오버레이: 반투명 마스크 + 사각형 테두리
        ctx.save()
        ctx.fillStyle = 'rgba(0,0,0,0.25)'
        ctx.fillRect(0, 0, fullCanvas.width, fullCanvas.height)

        const rx = Math.round(tuned.x * scaleMini)
        const ry = Math.round(tuned.y * scaleMini)
        const rw = Math.round(tuned.w * scaleMini)
        const rh = Math.round(tuned.h * scaleMini)

        // 사각형 영역만 밝게
        ctx.clearRect(rx, ry, rw, rh)
        ctx.drawImage(video, tuned.x, tuned.y, tuned.w, tuned.h, rx, ry, rw, rh)

        // 테두리
        ctx.lineWidth = 3
        ctx.strokeStyle = phase === 'LOCKED' ? '#22c55e' : '#f59e0b'
        ctx.strokeRect(rx, ry, rw, rh)

        // 라벨
        ctx.fillStyle = 'rgba(0,0,0,0.65)'
        ctx.fillRect(rx, Math.max(0, ry - 26), 170, 24)
        ctx.fillStyle = '#fff'
        ctx.font = '12px system-ui'
        ctx.fillText(`${phase} • ${aspect}`, rx + 8, Math.max(16, ry - 10))
        ctx.restore()
      }
    }, 120) // 부드럽게(디버깅용). 부담되면 200~300으로 올려도 됨.

    return () => clearInterval(timer)
  }, [debugOn, phase, displayRect, lockedRect, tuning, aspect])

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">LoA Screen – Aspect Calibration Debug</h1>

        <button onClick={startScreenShare} className="px-4 py-2 bg-blue-600 text-white rounded">
          화면 공유 시작
        </button>

        <button
          onClick={() => setDebugOn(v => !v)}
          className="px-3 py-2 bg-zinc-800 text-white rounded"
        >
          디버그 {debugOn ? '끄기' : '켜기'}
        </button>

        <div className="ml-auto text-sm">
          상태: <span className="font-semibold">{phase}</span> / 비율:{' '}
          <span className="font-semibold text-red-600">{aspect}</span>
        </div>
      </div>

      <video ref={videoRef} className="hidden" />

      {/* 메인: 사각형(게임 화면)만 */}
      <div className="space-y-2">
        <p className="font-semibold">게임 화면 (사각형 크롭 결과)</p>
        <canvas ref={gameCanvasRef} className="border w-full max-w-4xl" />
      </div>

      {/* 디버그: 미니맵 + 오버레이 */}
      {debugOn && (
        <div className="space-y-2">
          <p className="font-semibold">디버그 미니맵 (전체 프레임 + 사각형 오버레이)</p>
          <canvas ref={fullCanvasRef} className="border w-full max-w-4xl" />
        </div>
      )}

      {/* 튜닝 패널 */}
      <div className="border rounded p-4 space-y-4 max-w-4xl">
        <div className="font-semibold">사각형 튜닝 (디버깅용)</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="space-y-1">
            <div className="text-sm">Scale (0.05 ~ 1.00): {scale.toFixed(2)}</div>
            <input
              type="range"
              min={0.05}
              max={1}
              step={0.01}
              value={scale}
              onChange={e => setScale(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">PadX(px): {padX}</div>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={padX}
              onChange={e => setPadX(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">PadY(px): {padY}</div>
            <input
              type="range"
              min={0}
              max={200}
              step={1}
              value={padY}
              onChange={e => setPadY(Number(e.target.value))}
              className="w-full"
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">OffsetXRatio(%): {offXRatio}</div>
            <input
              type="range"
              min={-0.5}
              max={0.5}
              step={0.001}
              value={offXRatio}
              onChange={e => setOffXRatio(Number(e.target.value))}
            />
          </label>

          <label className="space-y-1">
            <div className="text-sm">OffsetYRatio(%): {offYRatio}</div>
            <input
              type="range"
              min={-0.5}
              max={0.5}
              step={0.001}
              value={offYRatio}
              onChange={e => setOffYRatio(Number(e.target.value))}
            />
          </label>
        </div>

        <div className="text-xs text-zinc-600">
          팁: LOCKED 이후에도 슬라이더로 사각형을 미세 조정하면서 “정확히 게임 화면만” 맞출 수 있음.
        </div>
      </div>
    </div>
  )
}

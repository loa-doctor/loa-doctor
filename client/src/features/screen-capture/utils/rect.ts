import { Rect, Aspect } from './types'

/* =====================================================
 * 기본 Rect 계산 (Aspect 기반)
 * ===================================================== */

/**
 * 주어진 frame 안에서 특정 비율(16:9 / 21:9)의
 * 가장 큰 중앙 Rect 계산
 */
export function calcLargestRect(frameW: number, frameH: number, aspect: Aspect): Rect | null {
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

/**
 * 16:9 / 21:9 중 면적이 더 큰 Rect 선택
 */
export function pickBestRect(frameW: number, frameH: number): Rect | null {
  const r21 = calcLargestRect(frameW, frameH, '21:9')
  const r16 = calcLargestRect(frameW, frameH, '16:9')

  const list = [r21, r16].filter(Boolean) as Rect[]
  if (!list.length) return null

  return list.reduce((a, b) => (a.w * a.h > b.w * b.h ? a : b))
}

/* =====================================================
 * 애니메이션 보간
 * ===================================================== */

export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

export function lerpRect(from: Rect, to: Rect, t: number): Rect {
  return {
    aspect: to.aspect,
    x: Math.round(lerp(from.x, to.x, t)),
    y: Math.round(lerp(from.y, to.y, t)),
    w: Math.round(lerp(from.w, to.w, t)),
    h: Math.round(lerp(from.h, to.h, t)),
  }
}

/* =====================================================
 * Rect Tuning (미세 조정)
 * ===================================================== */

export type RectTuning = {
  scale: number // 0.05 ~ 1.0 (Height scale if widthRatio is present)

  padX: number // px
  padY: number // px
  offXRatio: number // -0.5 ~ 0.5
  offYRatio: number // -0.5 ~ 0.5
  threshold: number // 10 ~ 50
}

/**
 * LOCK된 기준 Rect에 미세 조정 적용
 */
export function applyTuning(base: Rect, frameW: number, frameH: number, tuning: RectTuning): Rect {
  // scale
  const scaledH = Math.round(base.h * tuning.scale)
  const scaledW = Math.round(base.w * tuning.scale)

  // center
  const cx = base.x + base.w / 2
  const cy = base.y + base.h / 2

  // offset (ratio → px)
  const offXPx = Math.round(base.w * tuning.offXRatio)
  const offYPx = Math.round(base.h * tuning.offYRatio)

  // position
  let x = Math.round(cx - scaledW / 2) + offXPx + tuning.padX
  let y = Math.round(cy - scaledH / 2) + offYPx + tuning.padY
  let w = scaledW - tuning.padX * 2
  let h = scaledH - tuning.padY * 2

  // minimum
  if (w < 1) w = 1
  if (h < 1) h = 1

  // clamp
  if (x < 0) x = 0
  if (y < 0) y = 0
  if (x + w > frameW) w = frameW - x
  if (y + h > frameH) h = frameH - y

  return {
    aspect: base.aspect,
    x,
    y,
    w,
    h,
  }
}

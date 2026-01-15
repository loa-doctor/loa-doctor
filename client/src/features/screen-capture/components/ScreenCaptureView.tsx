'use client'

import { Aspect, Rect } from '../utils/types'
import DebugMiniMap from './DebugMiniMap'
import GameCanvas from './GameCanvas'
import OCRPreviewCanvas from './OCRPreviewCanvas'
import TuningPanel from './TuningPanel'

type Props = {
  videoRef: React.RefObject<HTMLVideoElement | null>
  ocrPreviewCanvasRef: React.RefObject<HTMLCanvasElement | null>

  phase: 'IDLE' | 'SEARCHING' | 'LOCKED'
  aspect: Aspect
  displayRect: Rect | null
  lockedRect: Rect | null

  debugOn: boolean
  onToggleDebug: () => void

  lineText: string

  tuning: {
    scale: number
    padX: number
    padY: number
    offXRatio: number
    offYRatio: number
  }
  onTuningChange: (v: Partial<Props['tuning']>) => void
}

export default function ScreenCaptureView({
  videoRef,
  phase,
  aspect,
  displayRect,
  lockedRect,
  debugOn,
  onToggleDebug,
  lineText,
  tuning,
  onTuningChange,
  ocrPreviewCanvasRef,
}: Props) {
    return (
    <div className="p-6 space-y-5">
      {/* 상태 바 */}
      <div className="flex items-center gap-3">
        <h1 className="text-xl font-bold">LoA Screen – Calibration</h1>

        <button
          onClick={onToggleDebug}
          className="px-3 py-2 bg-zinc-800 text-white rounded"
        >
          디버그 {debugOn ? '끄기' : '켜기'}
        </button>

        <div className="ml-auto text-sm">
          상태 <b>{phase}</b> / 비율{' '}
          <b className="text-red-500">{aspect}</b> / 줄수{' '}
          <b className="text-green-400">{lineText}</b>
        </div>
      </div>

      <OCRPreviewCanvas ref={ocrPreviewCanvasRef} />
      <video ref={videoRef} className="hidden" />

      <GameCanvas
        videoRef={videoRef}
        rect={phase === 'LOCKED' ? lockedRect : displayRect}
        tuning={tuning}
      />

      {debugOn && (
        <DebugMiniMap
          videoRef={videoRef}
          rect={phase === 'LOCKED' ? lockedRect : displayRect}
          tuning={tuning}
          phase={phase}
          aspect={aspect}
        />
      )}

      <TuningPanel value={tuning} onChange={onTuningChange} />
    </div>
  )
}
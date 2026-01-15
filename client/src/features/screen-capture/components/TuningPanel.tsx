'use client'

type Tuning = {
  scale: number
  padX: number
  padY: number
  offXRatio: number
  offYRatio: number
}

type Props = {
  value: Tuning
  onChange: (v: Partial<Tuning>) => void
}

export default function TuningPanel({ value, onChange }: Props) {
  return (
    <div className="border rounded p-4 space-y-4 max-w-4xl">
      <div className="font-semibold">사각형 튜닝</div>

      <label className="block">
        Scale: {value.scale.toFixed(2)}
        <input
          type="range"
          min={0.05}
          max={1}
          step={0.01}
          value={value.scale}
          onChange={e => onChange({ scale: Number(e.target.value) })}
        />
      </label>

      <label className="block">
        PadX(px): {value.padX}
        <input
          type="range"
          min={0}
          max={200}
          value={value.padX}
          onChange={e => onChange({ padX: Number(e.target.value) })}
        />
      </label>

      <label className="block">
        PadY(px): {value.padY}
        <input
          type="range"
          min={0}
          max={200}
          value={value.padY}
          onChange={e => onChange({ padY: Number(e.target.value) })}
        />
      </label>

      <label className="block">
        OffsetXRatio: {value.offXRatio}
        <input
          type="range"
          min={-0.5}
          max={0.5}
          step={0.001}
          value={value.offXRatio}
          onChange={e => onChange({ offXRatio: Number(e.target.value) })}
        />
      </label>

      <label className="block">
        OffsetYRatio: {value.offYRatio}
        <input
          type="range"
          min={-0.5}
          max={0.5}
          step={0.001}
          value={value.offYRatio}
          onChange={e => onChange({ offYRatio: Number(e.target.value) })}
        />
      </label>

      <div className="text-xs text-zinc-500">LOCKED 이후에도 실시간 미세 조정 가능</div>
    </div>
  )
}

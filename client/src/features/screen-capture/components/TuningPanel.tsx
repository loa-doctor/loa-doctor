'use client'

import { useEffect } from 'react'
import { STORAGE_KEYS } from '../utils/storageKeys'
import { TuningRow } from './TuningRow'

type Tuning = {
  scale: number
  padX: number
  padY: number
  offXRatio: number
  offYRatio: number
  threshold: number
}

type Props = {
  value: Tuning
  onChange: (v: Partial<Tuning>) => void
}

export default function TuningPanel({ value, onChange }: Props) {
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.TUNING, JSON.stringify(value))
    } catch {}
  }, [value])

  return (
    <div className="border rounded p-4 space-y-4 max-w-4xl">
      <div className="font-semibold">사각형 튜닝</div>

      <TuningRow
        label="Scale"
        value={value.scale}
        displayValue={value.scale.toFixed(2)}
        min={0.02}
        max={1}
        step={0.01}
        onChange={v => onChange({ scale: v })}
      />

      <TuningRow
        label="THRESHOLD"
        value={value.threshold}
        min={5}
        max={200}
        step={1}
        onChange={v => onChange({ threshold: v })}
      />

      <TuningRow
        label="OffsetXRatio"
        value={value.offXRatio}
        displayValue={value.offXRatio.toFixed(3)}
        min={-0.5}
        max={1.0}
        step={0.001}
        onChange={v => onChange({ offXRatio: v })}
      />

      <TuningRow
        label="OffsetYRatio"
        value={value.offYRatio}
        displayValue={value.offYRatio.toFixed(3)}
        min={-0.5}
        max={0.5}
        step={0.001}
        onChange={v => onChange({ offYRatio: v })}
      />

      <div className="text-xs text-zinc-500">
        LOCKED 이후에도 실시간 미세 조정 가능
      </div>
    </div>
  )
}
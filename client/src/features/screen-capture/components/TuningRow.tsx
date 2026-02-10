'use client'

type Props = {
  label: string
  value: number
  displayValue?: string
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}

export function TuningRow({
  label,
  value,
  displayValue,
  min,
  max,
  step,
  onChange,
}: Props) {
  return (
    <div className="space-y-1">
      <div className="text-sm font-medium">
        {label}:{' '}
        <span className="tabular-nums">
          {displayValue ?? value}
        </span>
      </div>

      <div className="flex items-center gap-3">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1"
        />

        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          onFocus={e => e.target.select()}
          className="
            w-28
            px-2 py-1
            text-sm
            bg-zinc-900
            border border-zinc-700
            rounded
            tabular-nums
            tabular-nums
          "
        />
      </div>
    </div>
  )
}
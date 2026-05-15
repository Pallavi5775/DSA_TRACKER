interface AccuracyBarProps {
  value: number
  showText?: boolean
}

export default function AccuracyBar({ value, showText = true }: AccuracyBarProps) {
  const pct = Math.min(value, 100)
  const grad =
    pct >= 80
      ? 'linear-gradient(90deg,#22c55e,#86efac)'
      : pct >= 60
      ? 'linear-gradient(90deg,#f59e0b,#fcd34d)'
      : 'linear-gradient(90deg,#ec4899,#f9a8d4)'
  const textColor =
    pct >= 80 ? '#16a34a' : pct >= 60 ? '#d97706' : '#b5615a'

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className="inline-block bg-rose-50 rounded h-1.5 w-20 overflow-hidden">
        <span
          className="block h-full rounded"
          style={{ width: `${pct}%`, background: grad }}
        />
      </span>
      {showText && (
        <span className="text-xs font-semibold" style={{ color: textColor }}>
          {pct.toFixed(0)}%
        </span>
      )}
    </span>
  )
}

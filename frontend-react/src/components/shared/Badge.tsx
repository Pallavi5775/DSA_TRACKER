interface BadgeProps {
  label: string
  variant?: 'pattern' | 'coverage' | 'revision' | 'due' | 'custom'
  bg?: string
  color?: string
  className?: string
}

export default function Badge({ label, variant = 'custom', bg, color, className = '' }: BadgeProps) {
  let style: React.CSSProperties = {}

  if (variant === 'pattern') {
    style = { background: '#f0ddd8', color: '#8b4a42' }
  } else if (variant === 'coverage') {
    style = label === 'Covered'
      ? { background: '#fde8e3', color: '#8b4a42' }
      : { background: '#fdf5f2', color: '#9b5a52' }
  } else if (variant === 'revision') {
    const map: Record<string, [string, string]> = {
      Mastered: ['#f0ddd8', '#8b4a42'],
      'Needs Work': ['#fff1f2', '#be123c'],
      Pending: ['#fdf5f2', '#e11d48'],
    }
    const [b, c] = map[label] ?? ['#fdf5f2', '#e11d48']
    style = { background: b, color: c }
  } else if (variant === 'due') {
    style = { background: '#ffe4e6', color: '#be123c' }
  } else {
    style = { background: bg ?? '#fdf5f2', color: color ?? '#e11d48' }
  }

  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide uppercase ${className}`}
      style={style}
    >
      {label}
    </span>
  )
}

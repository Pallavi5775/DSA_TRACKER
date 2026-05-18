interface HeatmapProps {
  sessionsByDate: Record<string, number>
  weeks?: number
}

function cellColor(n: number): string {
  if (n === 0) return '#fdf0ec'
  if (n === 1) return '#f5d5c8'
  if (n === 2) return '#d4a898'
  if (n === 3) return '#e11d48'
  return '#7a3f38'
}

export default function Heatmap({ sessionsByDate, weeks = 16 }: HeatmapProps) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Start on Monday of (weeks-1) weeks ago
  const start = new Date(today)
  start.setDate(today.getDate() - today.getDay() + 1 - 7 * (weeks - 1))
  // adjust to Monday (getDay 0=Sun, 1=Mon)
  if (today.getDay() === 0) start.setDate(start.getDate() - 6)

  const dayLabels = ['Mon', '', 'Wed', '', 'Fri', '', 'Sun']

  // Build week columns
  type Cell = { date: string; n: number; isToday: boolean }
  const columns: Cell[][] = []
  const monthMarkers: { month: string; colIdx: number }[] = []
  let cur = new Date(start)
  let prevMonth = -1

  while (cur <= today) {
    if (cur.getMonth() !== prevMonth) {
      monthMarkers.push({
        month: cur.toLocaleString('en', { month: 'short' }),
        colIdx: columns.length,
      })
      prevMonth = cur.getMonth()
    }
    const col: Cell[] = []
    for (let dow = 0; dow < 7; dow++) {
      const d = new Date(cur)
      d.setDate(cur.getDate() + dow)
      const ds = d.toISOString().slice(0, 10)
      col.push({ date: ds, n: sessionsByDate[ds] ?? 0, isToday: ds === today.toISOString().slice(0, 10) })
    }
    columns.push(col)
    cur.setDate(cur.getDate() + 7)
  }

  return (
    <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
      <p className="text-xs font-bold tracking-widest uppercase text-rose-600 mb-3">
        Activity Heatmap — last {weeks} weeks
      </p>
      <div className="flex items-start gap-1">
        {/* Day labels */}
        <div className="flex flex-col gap-0.5 mr-1 mt-3.5">
          {dayLabels.map((l, i) => (
            <div key={i} className="h-3 text-right text-rose-400 text-[9px] leading-3 pr-1">
              {l}
            </div>
          ))}
        </div>

        {/* Columns */}
        <div className="relative overflow-x-auto">
          {/* Month labels row */}
          <div className="relative h-4 mb-1">
            {monthMarkers.map((m) => (
              <span
                key={m.colIdx}
                className="absolute text-[9px] font-bold text-rose-600"
                style={{ left: m.colIdx * 14 }}
              >
                {m.month}
              </span>
            ))}
          </div>
          <div className="flex gap-0.5">
            {columns.map((col, ci) => (
              <div key={ci} className="flex flex-col gap-0.5">
                {col.map((cell) => (
                  <div
                    key={cell.date}
                    title={`${cell.date}: ${cell.n} session${cell.n !== 1 ? 's' : ''}`}
                    className="w-3 h-3 rounded-sm"
                    style={{
                      background: cellColor(cell.n),
                      border: cell.isToday ? '1.5px solid #e11d48' : '1.5px solid transparent',
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3">
        <span className="text-[10px] text-rose-400">Less</span>
        {[0, 1, 2, 3, 4].map((n) => (
          <div
            key={n}
            className="w-2.5 h-2.5 rounded-sm"
            style={{ background: cellColor(n) }}
          />
        ))}
        <span className="text-[10px] text-rose-400">More</span>
      </div>
    </div>
  )
}

import { useState } from 'react'
import { Question } from '../../types'
import Badge from '../shared/Badge'

interface Props {
  questions: Question[]
}

const MONTH_NAMES = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
]
const DAY_NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']

function daysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function firstDayOfMonth(year: number, month: number) {
  // Returns 0=Mon ... 6=Sun
  const d = new Date(year, month, 1).getDay()
  return (d + 6) % 7
}

export default function CalendarTab({ questions }: Props) {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())

  const today = now.toISOString().slice(0, 10)

  const dueMap: Record<string, Question[]> = {}
  for (const q of questions) {
    if (q.next_revision) dueMap[q.next_revision] = [...(dueMap[q.next_revision] ?? []), q]
  }

  const prevMonth = () => {
    if (month === 0) { setYear((y) => y - 1); setMonth(11) }
    else setMonth((m) => m - 1)
  }
  const nextMonth = () => {
    if (month === 11) { setYear((y) => y + 1); setMonth(0) }
    else setMonth((m) => m + 1)
  }

  const totalDays = daysInMonth(year, month)
  const firstDow = firstDayOfMonth(year, month)
  const mStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const mEnd = `${year}-${String(month + 1).padStart(2, '0')}-${String(totalDays).padStart(2, '0')}`

  const monthQs = questions
    .filter((q) => q.next_revision && q.next_revision >= mStart && q.next_revision <= mEnd)
    .sort((a, b) => (a.next_revision ?? '').localeCompare(b.next_revision ?? ''))

  return (
    <div className="max-w-2xl">
      {/* Nav */}
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} className="w-9 h-9 rounded-xl bg-white border border-rose-300 text-rose-600 font-bold hover:bg-rose-100 transition-colors">
          ◀
        </button>
        <h2 className="text-lg font-extrabold text-rose-grad">
          {MONTH_NAMES[month]} {year}
        </h2>
        <button onClick={nextMonth} className="w-9 h-9 rounded-xl bg-white border border-rose-300 text-rose-600 font-bold hover:bg-rose-100 transition-colors">
          ▶
        </button>
      </div>

      {/* Calendar grid */}
      <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm mb-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {DAY_NAMES.map((d) => (
            <div key={d} className="text-center text-[10px] font-bold text-rose-400 uppercase tracking-widest py-1">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {/* Empty cells for first day offset */}
          {Array.from({ length: firstDow }).map((_, i) => (
            <div key={`e${i}`} />
          ))}
          {Array.from({ length: totalDays }).map((_, i) => {
            const day = i + 1
            const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
            const qs = dueMap[ds] ?? []
            const isToday = ds === today
            const isOverdue = ds < today && qs.length > 0
            const hasDue = qs.length > 0

            let cellClass = 'bg-cream border-transparent text-gray-500'
            if (isToday) cellClass = 'text-white border-transparent'
            else if (isOverdue) cellClass = 'bg-red-50 border-red-200 text-red-700'
            else if (hasDue) cellClass = 'bg-rose-100 border-rose-300 text-rose-800'

            return (
              <div
                key={ds}
                className={`rounded-xl border p-1.5 min-h-[52px] flex flex-col items-center gap-1 ${cellClass}`}
                style={isToday ? { background: 'linear-gradient(135deg,#e11d48,#be123c)' } : undefined}
              >
                <span className="text-xs font-semibold leading-none">{day}</span>
                {qs.length > 0 && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white leading-none"
                    style={{ background: isOverdue ? '#ef4444' : 'linear-gradient(135deg,#e11d48,#be123c)' }}
                  >
                    {qs.length}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Revision list */}
      <h3 className="text-xs font-bold uppercase tracking-widest text-rose-400 mb-3">
        Revisions this month — {monthQs.length} problems
      </h3>
      {monthQs.length === 0 ? (
        <p className="text-sm text-rose-400">No revisions scheduled this month.</p>
      ) : (
        <div className="space-y-2">
          {monthQs.map((q) => {
            const isOver = q.next_revision! < today
            return (
              <div
                key={q.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-2.5 ${
                  isOver ? 'bg-red-50 border-red-200' : 'bg-white border-rose-300'
                }`}
              >
                <span className={`text-xs font-bold min-w-[80px] ${isOver ? 'text-red-600' : 'text-rose-600'}`}>
                  📅 {q.next_revision}
                </span>
                <span className="flex-1 text-sm font-semibold text-indigo-950 truncate">
                  {q.title}
                  {isOver && <span className="ml-2 text-[10px] font-bold text-red-600">⚠ OVERDUE</span>}
                </span>
                <Badge label={q.revision_status} variant="revision" />
                <span
                  className="text-sm font-extrabold"
                  style={{ color: (q.accuracy ?? 0) >= 80 ? '#16a34a' : (q.accuracy ?? 0) >= 60 ? '#d97706' : '#be123c' }}
                >
                  🎯 {(q.accuracy ?? 0).toFixed(0)}%
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

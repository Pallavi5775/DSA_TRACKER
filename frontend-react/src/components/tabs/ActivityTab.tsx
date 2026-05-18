import { useQuery } from '@tanstack/react-query'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'
import { getActivity } from '../../api/client'
import { ActivityData } from '../../types'
import Heatmap from '../shared/Heatmap'

const ROSE_PALETTE = [
  '#e11d48','#d4a898','#e8c4b8','#f0ddd8','#be123c',
  '#8b4a42','#7a3f38','#f5d5c8','#e8a898','#fde8e3',
]

export default function ActivityTab() {
  const { data: act, isLoading } = useQuery<ActivityData>({
    queryKey: ['activity'],
    queryFn: () => getActivity(),
  })

  if (isLoading || !act) {
    return <p className="text-sm text-rose-400">Loading activity…</p>
  }

  const totalMins = Math.round((act.total_time_seconds ?? 0) / 60)

  // Prepare chart data
  const allDates = [...new Set([...Object.keys(act.daily_correct ?? {}), ...Object.keys(act.daily_wrong ?? {})])].sort()
  const accuracyData = allDates.map((d) => ({
    date: d.slice(5), // MM-DD
    correct: act.daily_correct?.[d] ?? 0,
    wrong: act.daily_wrong?.[d] ?? 0,
  }))

  const topPatterns = Object.entries(act.pattern_counts ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)

  const topTimes = Object.entries(act.time_by_pattern ?? {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([pattern, secs]: [string, number]) => ({ pattern, minutes: Math.round(secs / 60) }))
    .reverse()

  const recent = act.recent_sessions ?? []
  const grouped: Record<string, typeof recent> = {}
  for (const s of recent) {
    grouped[s.date] = [...(grouped[s.date] ?? []), s]
  }

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: '🎯', label: 'Total Sessions', value: act.total_sessions ?? 0, sub: '' },
          { icon: '🔥', label: 'Current Streak', value: `${act.streak ?? 0}d`, sub: '' },
          { icon: '📈', label: 'Avg Accuracy', value: `${(act.avg_accuracy ?? 0).toFixed(0)}%`, sub: '' },
          { icon: '⏱', label: 'Total Time', value: `${totalMins}m`, sub: '' },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-rose-300 rounded-2xl p-4 shadow-sm text-center">
            <div className="text-2xl mb-1">{s.icon}</div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-600 mb-1">{s.label}</p>
            <p className="text-2xl font-extrabold text-rose-grad">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Heatmap */}
      <Heatmap sessionsByDate={act.sessions_by_date ?? {}} weeks={16} />

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Accuracy trend */}
        <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
            Accuracy Trend — correct vs wrong
          </p>
          {accuracyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={accuracyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0ddd8" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line type="monotone" dataKey="correct" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} name="Correct" />
                <Line type="monotone" dataKey="wrong" stroke="#be123c" strokeWidth={2} dot={{ r: 3 }} name="Wrong" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-rose-400">No data yet.</p>
          )}
        </div>

        {/* Pattern distribution */}
        <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
            Practice by Pattern (top 10)
          </p>
          {topPatterns.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={topPatterns.map(([name, value]) => ({ name, value }))}
                  cx="50%" cy="50%"
                  innerRadius={50} outerRadius={80}
                  dataKey="value"
                  nameKey="name"
                >
                  {topPatterns.map((_, i) => (
                    <Cell key={i} fill={ROSE_PALETTE[i % ROSE_PALETTE.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v, n) => [`${v} sessions`, n]} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-rose-400">No data yet.</p>
          )}
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
          Time Spent per Pattern (minutes, top 10)
        </p>
        {topTimes.length > 0 ? (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={topTimes} layout="vertical" margin={{ left: 8, right: 40, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0ddd8" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 10 }} unit="m" />
              <YAxis dataKey="pattern" type="category" tick={{ fontSize: 10 }} width={110} />
              <Tooltip formatter={(v) => [`${v}m`]} />
              <Bar dataKey="minutes" fill="#e11d48" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10 }} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-sm text-rose-400">No data yet.</p>
        )}
      </div>

      {/* Recent sessions feed */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">📋 Recent Sessions</h3>
        {recent.length === 0 ? (
          <p className="text-sm text-rose-400">No sessions yet — start practicing!</p>
        ) : (
          <div className="max-w-xl space-y-4">
            {Object.entries(grouped)
              .sort(([a], [b]) => b.localeCompare(a))
              .slice(0, 7)
              .map(([day, sessions]: [string, typeof recent]) => (
                <div key={day}>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-rose-400 mb-2">
                    {new Date(day + 'T00:00:00').toLocaleDateString('en', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </p>
                  {sessions.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 bg-white border border-rose-300 rounded-xl px-4 py-2.5 mb-1.5 shadow-sm"
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold ${
                          s.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.correct ? '✅' : '❌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-indigo-950 truncate">{s.question_title}</p>
                        <p className="text-xs text-rose-400">{s.pattern}</p>
                      </div>
                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        ⏱ {Math.max(1, Math.floor((s.time_taken ?? 0) / 60))}m
                      </span>
                    </div>
                  ))}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  )
}

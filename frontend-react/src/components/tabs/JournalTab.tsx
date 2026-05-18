import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import Editor from '@monaco-editor/react'
import { githubHistory } from '../../api/client'
import { JournalSession } from '../../types'

interface HistoryData {
  connected: boolean
  sessions: JournalSession[]
}

export default function JournalTab() {
  const { data, isLoading } = useQuery<HistoryData>({
    queryKey: ['github-history'],
    queryFn: githubHistory,
  })

  const [expanded, setExpanded] = useState<number | null>(null)

  if (isLoading) return <p className="text-sm text-rose-400">Loading journal…</p>

  if (!data?.connected) {
    return (
      <div className="bg-white border border-rose-300 rounded-2xl p-8 text-center max-w-md">
        <p className="text-3xl mb-3">📖</p>
        <p className="text-gray-500 text-sm">
          Your GitHub repository is not connected. Sign in with GitHub to automatically backup and view your practice journal.
        </p>
      </div>
    )
  }

  const sessions = data.sessions ?? []

  if (sessions.length === 0) {
    return (
      <p className="text-sm text-rose-400">
        No sessions in your journal yet. Complete a practice session to start building your history.
      </p>
    )
  }

  // Group by date
  const grouped: Record<string, JournalSession[]> = {}
  for (const s of sessions) {
    grouped[s.date] = [...(grouped[s.date] ?? []), s]
  }

  return (
    <div className="max-w-2xl space-y-6">
      <h2 className="text-xs font-bold uppercase tracking-widest text-rose-600">
        📖 Practice Journal — {sessions.length} sessions
      </h2>

      {Object.entries(grouped)
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([day, daySessions]) => (
          <div key={day}>
            <h3 className="text-xs font-bold uppercase tracking-wider text-rose-400 mb-2">
              {new Date(day + 'T00:00:00').toLocaleDateString('en', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </h3>
            <div className="space-y-2">
              {daySessions.map((s, i) => {
                const idx = sessions.indexOf(s)
                const isOpen = expanded === idx
                return (
                  <div
                    key={i}
                    className="bg-white border border-rose-300 rounded-2xl overflow-hidden shadow-sm"
                  >
                    {/* Summary row */}
                    <button
                      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-100 transition-colors text-left"
                      onClick={() => setExpanded(isOpen ? null : idx)}
                    >
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-bold flex-shrink-0 ${
                          s.correct ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {s.correct ? '✅' : '❌'}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-indigo-950 truncate">{s.question}</p>
                        <div className="flex gap-2 text-xs text-gray-400 mt-0.5">
                          {s.pattern && <span>{s.pattern}</span>}
                          {s.difficulty && <span>· {s.difficulty}</span>}
                          <span>· ⏱ {Math.max(1, Math.floor((s.time_taken_seconds ?? 0) / 60))}m</span>
                        </div>
                      </div>
                      <span className="text-rose-400 text-xs flex-shrink-0">{isOpen ? '▲' : '▼'}</span>
                    </button>

                    {/* Expanded detail */}
                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-rose-200 space-y-3">
                        {s.logic && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Logic</p>
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-rose-100 rounded-xl p-3">
                              {s.logic}
                            </p>
                          </div>
                        )}
                        {s.code && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">Code</p>
                            <div className="rounded-xl overflow-hidden border border-gray-200">
                              <Editor
                                height="200px"
                                defaultLanguage="java"
                                value={s.code}
                                theme="vs-dark"
                                options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
                              />
                            </div>
                          </div>
                        )}
                        {s.gap_analysis && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">AI Gap Analysis</p>
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-rose-100 rounded-xl p-3">
                              {s.gap_analysis}
                            </p>
                          </div>
                        )}
                        {s.ai_insight && (
                          <div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-500 mb-1">AI Insight</p>
                            <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line bg-yellow-50 rounded-xl p-3 border border-yellow-200">
                              {s.ai_insight}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
    </div>
  )
}

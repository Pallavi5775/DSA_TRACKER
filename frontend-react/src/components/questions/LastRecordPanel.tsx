import { useState, useEffect } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import Editor from '@monaco-editor/react'
import { Question, LastLog } from '../../types'
import { getLastLog, updateLastLog } from '../../api/client'

interface Props {
  question: Question
  navIds: number[]
  onNavigate: (dir: -1 | 1) => void
  onClose: () => void
  onSaved: () => void
}

export default function LastRecordPanel({ question: q, navIds, onNavigate, onClose, onSaved }: Props) {
  const curIdx = navIds.indexOf(q.id)
  const hasPrev = curIdx > 0
  const hasNext = curIdx < navIds.length - 1

  const { data: lastLog, isLoading } = useQuery<LastLog>({
    queryKey: ['last-log', q.id],
    queryFn: () => getLastLog(q.id),
    retry: false,
  })

  const [notes, setNotes] = useState('')
  const [myGap, setMyGap] = useState('')
  const [dirty, setDirty] = useState(false)

  useEffect(() => {
    setNotes(lastLog?.notes ?? q.notes ?? '')
    setMyGap(lastLog?.my_gap_analysis ?? q.my_gap_analysis ?? '')
    setDirty(false)
  }, [lastLog, q.id])

  const save = useMutation({
    mutationFn: () =>
      updateLastLog(q.id, { notes, my_gap_analysis: myGap }),
    onSuccess: () => { setDirty(false); onSaved() },
  })

  const acc = q.accuracy ?? 0
  const accColor = acc >= 80 ? '#22c55e' : acc >= 60 ? '#f59e0b' : '#ec4899'

  return (
    <div className="flex flex-col h-full text-cream">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-mid flex-wrap">
        <h2 className="flex-1 min-w-0 text-sm font-extrabold text-rose-400 truncate">
          📖 {q.title}
        </h2>
        {navIds.length > 1 && (
          <span className="text-xs text-gray-400">{curIdx + 1}/{navIds.length}</span>
        )}
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm">✕</button>
      </div>

      {navIds.length > 1 && (
        <div className="flex justify-between px-4 py-2 border-b border-navy-mid">
          <button
            disabled={!hasPrev}
            onClick={() => onNavigate(-1)}
            className="text-xs font-semibold text-rose-400 disabled:text-gray-600"
          >◀ Prev</button>
          <button
            disabled={!hasNext}
            onClick={() => onNavigate(1)}
            className="text-xs font-semibold text-rose-400 disabled:text-gray-600"
          >Next ▶</button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-2">
          <div className="bg-navy-light border border-navy-mid rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Accuracy</p>
            <p className="text-lg font-extrabold mt-0.5" style={{ color: accColor }}>
              {acc.toFixed(0)}%
            </p>
          </div>
          <div className="bg-navy-light border border-navy-mid rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">Next Rev</p>
            <p className="text-sm font-bold text-rose-50 mt-0.5">
              {q.next_revision && q.next_revision !== '9999-12-31' ? q.next_revision : '—'}
            </p>
          </div>
          <div className="bg-navy-light border border-navy-mid rounded-xl p-2.5 text-center">
            <p className="text-[9px] text-rose-500 font-bold uppercase tracking-widest">EF</p>
            <p className="text-sm font-bold text-rose-50 mt-0.5">{(q.ease_factor ?? 2.5).toFixed(2)}</p>
          </div>
        </div>

        {isLoading ? (
          <p className="text-xs text-gray-400">Loading last record…</p>
        ) : !lastLog ? (
          <p className="text-xs text-gray-400 italic">No session logged yet — practice first!</p>
        ) : (
          <>
            {/* Session meta */}
            <div className="flex items-center gap-3 text-xs">
              <span className={`px-2 py-0.5 rounded font-bold ${lastLog.correct ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                {lastLog.correct ? '✅ Correct' : '❌ Wrong'}
              </span>
              <span className="text-gray-400">📅 {lastLog.date}</span>
              <span className="text-gray-400">⏱ {Math.max(1, Math.floor((lastLog.time_taken ?? 0) / 60))}m</span>
            </div>

            {/* Logic */}
            {lastLog.logic && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Logic / Approach</p>
                <div className="bg-navy-light border border-navy-mid rounded-xl p-3 text-xs text-rose-100 leading-relaxed whitespace-pre-line">
                  {lastLog.logic}
                </div>
              </div>
            )}

            {/* Code */}
            {lastLog.code && (
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-1">Code</p>
                <div className="rounded-xl overflow-hidden border border-navy-mid">
                  <Editor
                    height="220px"
                    defaultLanguage="java"
                    value={lastLog.code}
                    theme="vs-dark"
                    options={{ readOnly: true, minimap: { enabled: false }, fontSize: 12, scrollBeyondLastLine: false }}
                  />
                </div>
              </div>
            )}
          </>
        )}

        {/* Editable notes */}
        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block mb-1">
            📝 Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => { setNotes(e.target.value); setDirty(true) }}
            rows={3}
            placeholder="Your personal notes for this question…"
            className="w-full bg-navy-mid border border-navy-mid focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none resize-y leading-relaxed placeholder:text-gray-500"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold uppercase tracking-widest text-rose-400 block mb-1">
            🔍 My Gap Analysis
          </label>
          <textarea
            value={myGap}
            onChange={(e) => { setMyGap(e.target.value); setDirty(true) }}
            rows={3}
            placeholder="What did you miss? What to remember next time?"
            className="w-full bg-navy-mid border border-navy-mid focus:border-rose-500 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none resize-y leading-relaxed placeholder:text-gray-500"
          />
        </div>
      </div>

      {/* Save */}
      {dirty && (
        <div className="px-4 py-3 border-t border-navy-mid">
          <button
            onClick={() => save.mutate()}
            disabled={save.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#c97b6e,#b5615a)' }}
          >
            {save.isPending ? 'Saving…' : '💾 Save Notes'}
          </button>
        </div>
      )}
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'
import { useMutation } from '@tanstack/react-query'
import Editor from '@monaco-editor/react'
import { Question } from '../../types'
import { logSession, generateDescription, hintChat } from '../../api/client'

interface Props {
  question: Question
  navIds: number[]
  onNavigate: (dir: -1 | 1) => void
  onClose: () => void
  onSessionLogged: () => void
}

interface ChatMsg {
  role: 'user' | 'assistant'
  content: string
}

export default function PracticePanel({ question: q, navIds, onNavigate, onClose, onSessionLogged }: Props) {
  const [startTime] = useState(Date.now())
  const [elapsed, setElapsed] = useState(0)
  const [logic, setLogic] = useState('')
  const [code, setCode] = useState('')
  const [correct, setCorrect] = useState(true)
  const [showDesc, setShowDesc] = useState(true)
  const [showHint, setShowHint] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [description, setDescription] = useState(q.description ?? '')
  const [genLoading, setGenLoading] = useState(false)
  const [chatHistory, setChatHistory] = useState<ChatMsg[]>([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const [sessionResult, setSessionResult] = useState<Record<string, any> | null>(null)

  const curIdx = navIds.indexOf(q.id)
  const hasPrev = curIdx > 0
  const hasNext = curIdx < navIds.length - 1

  // Timer
  useEffect(() => {
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startTime) / 1000)), 1000)
    return () => clearInterval(id)
  }, [startTime])

  // Reset state when question changes
  useEffect(() => {
    setLogic('')
    setCode('')
    setCorrect(true)
    setDescription(q.description ?? '')
    setChatHistory([])
    setShowDesc(true)
    setShowHint(false)
    setShowChat(false)
  }, [q.id, q.description])

  const mins = Math.floor(elapsed / 60)
  const secs = elapsed % 60
  const acc = q.accuracy ?? 0
  const ef = q.ease_factor ?? 2.5
  const iv = q.interval_days ?? 0
  const accColor = acc >= 80 ? '#86efac' : acc >= 60 ? '#fcd34d' : '#f9a8d4'

  const submit = useMutation({
    mutationFn: () =>
      logSession(q.id, {
        correct,
        time_taken: elapsed,
        logic,
        code,
        date: new Date().toISOString().slice(0, 10),
      }),
    onSuccess: (data) => {
      setSessionResult({ ...data, submittedCorrect: correct, timeTaken: elapsed })
      onSessionLogged()
    },
  })

  const genDesc = async () => {
    setGenLoading(true)
    try {
      const res = await generateDescription(q.id)
      setDescription(res.description ?? '')
    } catch {
      /* ignore */
    } finally {
      setGenLoading(false)
    }
  }

  const sendChat = async () => {
    if (!chatInput.trim()) return
    const msg = chatInput.trim()
    setChatInput('')
    const newHistory = [...chatHistory, { role: 'user' as const, content: msg }]
    setChatHistory(newHistory)
    setChatLoading(true)
    try {
      const res = await hintChat(q.id, msg, { logic, code }, newHistory.slice(-10))
      setChatHistory([...newHistory, { role: 'assistant', content: res.reply ?? res.message ?? '' }])
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    } catch {
      setChatHistory([...newHistory, { role: 'assistant', content: '⚠️ Failed to get response.' }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full text-cream relative">
      {/* ── Header ── */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-navy-mid flex-wrap">
        <h2 className="flex-1 min-w-0 text-sm font-extrabold text-rose-500 truncate">
          📝 {q.title}
        </h2>
        {navIds.length > 1 && (
          <span className="text-xs text-gray-400 flex-shrink-0">
            {curIdx + 1}/{navIds.length}
          </span>
        )}
        {/* Stats pills */}
        <StatPill label="Time" value={`${mins.toString().padStart(2,'0')}:${secs.toString().padStart(2,'0')}`} />
        <StatPill label="Acc" value={`${acc.toFixed(0)}%`} valueStyle={{ color: accColor }} />
        <StatPill label="Next" value={`${iv}d`} />
        <StatPill label="EF" value={ef.toFixed(2)} />
        <button onClick={onClose} className="text-gray-400 hover:text-white text-sm ml-1">✕</button>
      </div>

      {/* ── Nav prev/next ── */}
      {navIds.length > 1 && (
        <div className="flex justify-between px-4 py-2 border-b border-navy-mid">
          <button
            disabled={!hasPrev}
            onClick={() => onNavigate(-1)}
            className="text-xs font-semibold text-rose-500 disabled:text-gray-600 hover:text-rose-400 transition-colors"
          >
            ◀ Prev
          </button>
          <button
            disabled={!hasNext}
            onClick={() => onNavigate(1)}
            className="text-xs font-semibold text-rose-500 disabled:text-gray-600 hover:text-rose-400 transition-colors"
          >
            Next ▶
          </button>
        </div>
      )}

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-4">
        {/* AI suggestions */}
        {q.suggestions && (
          <div className="bg-gradient-to-br from-navy-mid to-navy-light border-l-4 border-rose-500 rounded-r-xl p-3">
            <p className="text-[10px] font-bold tracking-widest uppercase text-rose-500 mb-1">💡 AI Analysis</p>
            <p className="text-xs text-rose-200 leading-relaxed whitespace-pre-line">{q.suggestions}</p>
          </div>
        )}
        {q.my_gap_analysis && (
          <div className="bg-navy-light border-l-4 border-rose-600 rounded-r-xl p-3">
            <p className="text-xs text-rose-100 leading-relaxed">🔍 {q.my_gap_analysis}</p>
          </div>
        )}

        {/* Problem statement */}
        <Collapsible title="📋 Problem Statement & Examples" open={showDesc} onToggle={() => setShowDesc((v) => !v)}>
          {description ? (
            <DescriptionRenderer text={description} />
          ) : (
            <div>
              <p className="text-xs text-gray-400 mb-2">No description yet.</p>
              <button
                onClick={genDesc}
                disabled={genLoading}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
              >
                {genLoading ? '⏳ Generating…' : '✨ Generate Description'}
              </button>
            </div>
          )}
        </Collapsible>

        {/* Hint */}
        {q.hint && (
          <Collapsible title="💡 Hint" open={showHint} onToggle={() => setShowHint((v) => !v)}>
            <p className="text-xs text-rose-200 leading-relaxed whitespace-pre-line">{q.hint}</p>
          </Collapsible>
        )}

        {/* AI Chat */}
        <Collapsible title="💬 AI Hint Chat" open={showChat} onToggle={() => setShowChat((v) => !v)}>
          <div className="space-y-2 mb-3 max-h-56 overflow-y-auto scrollbar-thin">
            {chatHistory.map((m, i) => (
              <div key={i} className={`text-xs rounded-lg px-3 py-2 leading-relaxed ${
                m.role === 'user'
                  ? 'bg-navy-mid text-rose-200 ml-6'
                  : 'bg-navy-light text-rose-300 mr-6 border-l-2 border-rose-600'
              }`}>
                {m.content}
              </div>
            ))}
            {chatLoading && (
              <div className="text-xs text-gray-400 italic px-3">Thinking…</div>
            )}
            <div ref={chatEndRef} />
          </div>
          <div className="flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendChat()}
              placeholder="Ask for a hint…"
              className="flex-1 bg-navy-mid border border-navy-mid focus:border-rose-600 rounded-lg px-3 py-1.5 text-xs text-cream focus:outline-none"
            />
            <button
              onClick={sendChat}
              disabled={chatLoading || !chatInput.trim()}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
            >
              Send
            </button>
          </div>
        </Collapsible>

        {/* Logic */}
        <div>
          <label className="text-[10px] font-bold tracking-widest uppercase text-rose-500 block mb-1">
            ✍ Logic / Approach
          </label>
          <textarea
            value={logic}
            onChange={(e) => setLogic(e.target.value)}
            rows={4}
            placeholder="Describe your approach, intuition, and key observations…"
            className="w-full bg-navy-mid border border-navy-mid focus:border-rose-600 rounded-xl px-3 py-2 text-xs text-cream focus:outline-none resize-y leading-relaxed placeholder:text-gray-500"
          />
        </div>

        {/* Code editor */}
        <div>
          <label className="text-[10px] font-bold tracking-widest uppercase text-rose-500 block mb-1">
            💻 Code
          </label>
          <div className="rounded-xl overflow-hidden border border-navy-mid">
            <Editor
              height="280px"
              defaultLanguage="java"
              value={code}
              onChange={(v) => setCode(v ?? '')}
              theme="vs-dark"
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                lineNumbers: 'on',
                wordWrap: 'on',
                scrollBeyondLastLine: false,
                tabSize: 4,
              }}
            />
          </div>
        </div>

        {/* Correct / Wrong */}
        <div>
          <label className="text-[10px] font-bold tracking-widest uppercase text-rose-500 block mb-2">
            Self-Assessment
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setCorrect(true)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                correct
                  ? 'bg-green-500 text-white'
                  : 'bg-navy-mid text-gray-400 hover:bg-navy-light'
              }`}
            >
              ✅ Correct
            </button>
            <button
              onClick={() => setCorrect(false)}
              className={`flex-1 py-2 rounded-xl text-sm font-bold transition-colors ${
                !correct
                  ? 'bg-red-500 text-white'
                  : 'bg-navy-mid text-gray-400 hover:bg-navy-light'
              }`}
            >
              ❌ Wrong
            </button>
          </div>
        </div>
      </div>

      {/* ── Submit ── */}
      <div className="px-4 py-3 border-t border-navy-mid">
        <button
          onClick={() => submit.mutate()}
          disabled={submit.isPending}
          className="w-full py-3 rounded-xl text-sm font-extrabold text-white disabled:opacity-60 transition-opacity"
          style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
        >
          {submit.isPending ? '⏳ Saving…' : '🎯 Submit Session'}
        </button>
        {submit.isError && (
          <p className="text-xs text-red-400 mt-1 text-center">Failed to save. Try again.</p>
        )}
      </div>

      {/* ── Session Result Overlay ── */}
      {sessionResult && (
        <div className="absolute inset-0 bg-navy-dark/95 backdrop-blur-sm flex flex-col items-center justify-center z-50 px-6 gap-5">
          {/* Result badge */}
          <div className={`w-20 h-20 rounded-full flex items-center justify-center text-4xl shadow-lg ${
            sessionResult.submittedCorrect ? 'bg-green-500/20 border-2 border-green-400' : 'bg-red-500/20 border-2 border-red-400'
          }`}>
            {sessionResult.submittedCorrect ? '✅' : '❌'}
          </div>

          <div className="text-center">
            <p className="text-white font-extrabold text-lg">
              {sessionResult.submittedCorrect ? 'Session Logged!' : 'Keep Practising!'}
            </p>
            <p className="text-gray-400 text-xs mt-1 truncate max-w-xs">{q.title}</p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 w-full max-w-xs">
            <ResultStat
              label="Time Taken"
              value={`${Math.floor(sessionResult.timeTaken / 60)}m ${sessionResult.timeTaken % 60}s`}
            />
            <ResultStat
              label="Next Revision"
              value={sessionResult.next_revision
                ? new Date(sessionResult.next_revision).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
                : '—'}
            />
            <ResultStat
              label="Interval"
              value={`${sessionResult.interval_days ?? 0}d`}
            />
            <ResultStat
              label="Status"
              value={sessionResult.revision_status ?? '—'}
              valueColor={
                sessionResult.revision_status === 'Mastered' ? '#86efac'
                : sessionResult.revision_status === 'Needs Work' ? '#fca5a5'
                : '#fcd34d'
              }
            />
            <ResultStat
              label="Ease Factor"
              value={(sessionResult.ease_factor ?? 2.5).toFixed(2)}
            />
            <ResultStat
              label="Coverage"
              value={sessionResult.coverage_status ?? '—'}
              valueColor="#86efac"
            />
          </div>

          <p className="text-[10px] text-gray-500 text-center">
            AI accuracy analysis running in background…
          </p>

          {/* Actions */}
          <div className="flex gap-3 w-full max-w-xs">
            {hasNext && (
              <button
                onClick={() => { setSessionResult(null); onNavigate(1) }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
                style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
              >
                Next ▶
              </button>
            )}
            <button
              onClick={() => { setSessionResult(null); onClose() }}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-navy-light text-rose-300 hover:bg-navy-mid border border-navy-mid"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function StatPill({ label, value, valueStyle }: { label: string; value: string; valueStyle?: React.CSSProperties }) {
  return (
    <div className="bg-navy-light border border-navy-mid rounded-lg px-2.5 py-1 text-center flex-shrink-0">
      <p className="text-[9px] text-rose-600 font-bold uppercase tracking-widest leading-none">{label}</p>
      <p className="text-xs font-bold text-rose-100 leading-tight mt-0.5" style={valueStyle}>{value}</p>
    </div>
  )
}

function ResultStat({ label, value, valueColor }: { label: string; value: string; valueColor?: string }) {
  return (
    <div className="bg-navy-light border border-navy-mid rounded-xl px-3 py-2.5 text-center">
      <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest leading-none mb-1">{label}</p>
      <p className="text-sm font-extrabold text-white leading-tight" style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
    </div>
  )
}

function Collapsible({
  title,
  open,
  onToggle,
  children,
}: {
  title: string
  open: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  return (
    <div className="border border-navy-mid rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 bg-navy-light hover:bg-navy-mid transition-colors text-left"
      >
        <span className="text-xs font-semibold text-rose-400">{title}</span>
        <span className="text-rose-500 text-xs">{open ? '▲' : '▼'}</span>
      </button>
      {open && <div className="px-3 py-3 bg-navy-dark text-xs">{children}</div>}
    </div>
  )
}

function DescriptionRenderer({ text }: { text: string }) {
  const lines = text.trim().split('\n')
  return (
    <div className="space-y-0.5">
      {lines.map((line, i) => {
        const s = line.trim()
        if (['PROBLEM', 'EXAMPLE 1', 'EXAMPLE 2', 'CONSTRAINTS'].includes(s)) {
          return (
            <p key={i} className="text-[10px] font-bold tracking-widest uppercase text-rose-600 pt-2 pb-0.5">
              {s}
            </p>
          )
        }
        if (s.startsWith('Input:') || s.startsWith('Output:') || s.startsWith('Explanation:')) {
          const [lbl, ...rest] = s.split(':')
          return (
            <p key={i} className="text-xs leading-relaxed">
              <strong className="text-rose-400">{lbl}:</strong>{' '}
              <code className="bg-navy-mid text-rose-200 px-1.5 py-0.5 rounded text-[11px]">
                {rest.join(':').trim()}
              </code>
            </p>
          )
        }
        if (s.startsWith('•')) {
          return <p key={i} className="text-xs text-gray-300 leading-relaxed pl-1">{s}</p>
        }
        if (s) {
          return <p key={i} className="text-xs text-rose-100 leading-relaxed">{s}</p>
        }
        return <div key={i} className="h-1" />
      })}
    </div>
  )
}

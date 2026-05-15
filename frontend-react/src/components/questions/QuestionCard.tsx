import { Question } from '../../types'
import Badge from '../shared/Badge'
import AccuracyBar from '../shared/AccuracyBar'

interface Props {
  question: Question
  isActive: boolean
  onPractice: () => void
  onLastRecord: () => void
}

export default function QuestionCard({ question: q, isActive, onPractice, onLastRecord }: Props) {
  const today = new Date().toISOString().slice(0, 10)
  const acc = q.accuracy ?? 0
  const nextRev = q.next_revision && q.next_revision !== '9999-12-31' ? q.next_revision : '—'
  const isDue = nextRev !== '—' && nextRev <= today

  const accColor = acc >= 80 ? '#16a34a' : acc >= 60 ? '#d97706' : '#b5615a'
  const accBg = acc >= 80 ? '#dcfce7' : acc >= 60 ? '#fef3c7' : '#fde8e3'

  return (
    <div
      className={`bg-white border rounded-2xl p-4 mb-2.5 transition-shadow ${
        isActive
          ? 'border-rose-500 shadow-md shadow-rose-100'
          : 'border-rose-200 hover:border-rose-300 shadow-sm hover:shadow-md'
      }`}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        {/* Badges row */}
        <div className="flex flex-wrap gap-1">
          <Badge label={q.pattern} variant="pattern" />
          <Badge label={q.coverage_status} variant="coverage" />
          <Badge label={q.revision_status} variant="revision" />
          {isDue && <Badge label="⚠ Due" variant="due" />}
        </div>
        {/* Accuracy pill */}
        <div
          className="flex-shrink-0 rounded-full px-2.5 py-0.5 text-xs font-extrabold border whitespace-nowrap"
          style={{ background: accBg, color: accColor, borderColor: accColor + '33' }}
        >
          🎯 {acc.toFixed(0)}%
        </div>
      </div>

      <h3 className="font-bold text-sm text-indigo-950 mb-2">
        {q.title}
        {q.hint && <span className="ml-1 text-xs" title="Hint available">💡</span>}
      </h3>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <AccuracyBar value={acc} />
          <span className="text-xs text-gray-400">📅 {nextRev}</span>
          <span className="text-xs text-gray-400">⏱ {q.total_time_spent ?? 0}m</span>
        </div>

        <div className="flex gap-2">
          <button
            onClick={onPractice}
            className="px-3 py-1 rounded-lg text-xs font-bold text-white transition-colors"
            style={{ background: isActive ? '#b5615a' : 'linear-gradient(135deg,#c97b6e,#b5615a)' }}
          >
            Practice →
          </button>
          <button
            onClick={onLastRecord}
            className="px-3 py-1 rounded-lg text-xs font-semibold bg-navy text-cream hover:bg-navy-light transition-colors"
          >
            Last Record
          </button>
        </div>
      </div>
    </div>
  )
}

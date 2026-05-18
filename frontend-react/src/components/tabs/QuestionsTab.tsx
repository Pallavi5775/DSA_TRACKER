import { useState, useMemo } from 'react'
import { Question } from '../../types'
import QuestionCard from '../questions/QuestionCard'

interface Props {
  questions: Question[]
  onPractice: (qid: number, navIds: number[]) => void
  onLastRecord: (qid: number, navIds: number[]) => void
  activeQid: number | null
}

const today = new Date().toISOString().slice(0, 10)
const weekStr = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().slice(0, 10)
})()

export default function QuestionsTab({ questions, onPractice, onLastRecord, activeQid }: Props) {
  const [patFilter, setPatFilter] = useState('All')
  const [revFilter, setRevFilter] = useState('All')
  const [accFilter, setAccFilter] = useState('All')
  const [dueFilter, setDueFilter] = useState('All')
  const [covFilter, setCovFilter] = useState('All')
  const [sortBy, setSortBy] = useState('Default')
  const [search, setSearch] = useState('')

  const patterns = useMemo(
    () => ['All', ...Array.from(new Set(questions.map((q) => q.pattern).filter(Boolean))).sort()],
    [questions]
  )

  const filtered = useMemo(() => {
    let flt = questions.filter((q) => {
      if (search && !q.title.toLowerCase().includes(search.toLowerCase())) return false
      if (patFilter !== 'All' && q.pattern !== patFilter) return false
      if (revFilter !== 'All' && q.revision_status !== revFilter) return false
      if (covFilter !== 'All' && q.coverage_status !== covFilter) return false
      const acc = q.accuracy ?? 0
      if (accFilter === 'High ≥80%' && acc < 80) return false
      if (accFilter === 'Medium 60–79%' && (acc < 60 || acc >= 80)) return false
      if (accFilter === 'Low <60%' && acc >= 60) return false
      const nr = q.next_revision ?? '9999-12-31'
      if (dueFilter === 'Due Today' && nr > today) return false
      if (dueFilter === 'Due This Week' && nr > weekStr) return false
      if (dueFilter === 'Overdue' && nr >= today) return false
      return true
    })

    if (sortBy === 'Accuracy ↑') flt = [...flt].sort((a, b) => (a.accuracy ?? 0) - (b.accuracy ?? 0))
    if (sortBy === 'Accuracy ↓') flt = [...flt].sort((a, b) => (b.accuracy ?? 0) - (a.accuracy ?? 0))
    if (sortBy === 'Next Revision ↑')
      flt = [...flt].sort((a, b) =>
        (a.next_revision ?? '9999').localeCompare(b.next_revision ?? '9999')
      )
    return flt
  }, [questions, search, patFilter, revFilter, covFilter, accFilter, dueFilter, sortBy])

  const covered = questions.filter((q) => q.coverage_status === 'Covered').length
  const dueToday = questions.filter(
    (q) => q.next_revision && q.next_revision <= today
  ).length
  const mastered = questions.filter((q) => q.revision_status === 'Mastered').length

  const navIds = filtered.map((q) => q.id)

  return (
    <div>
      {/* Metrics */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'Total', value: questions.length },
          { label: 'Covered', value: covered },
          { label: 'Due Today', value: dueToday },
          { label: 'Mastered', value: mastered },
        ].map((m) => (
          <div
            key={m.label}
            className="bg-white border border-rose-300 rounded-2xl p-4 shadow-sm"
          >
            <p className="text-[10px] font-bold tracking-widest uppercase text-rose-600 mb-1">
              {m.label}
            </p>
            <p className="text-2xl font-extrabold text-rose-grad">{m.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-rose-300 rounded-2xl p-4 mb-4 shadow-sm">
        <p className="text-[10px] font-bold tracking-widest uppercase text-rose-400 mb-3">🔎 Filters</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Search questions…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border border-rose-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-rose-600"
          />
          <Select label="Pattern" value={patFilter} onChange={setPatFilter} options={patterns} />
          <Select
            label="Revision Status"
            value={revFilter}
            onChange={setRevFilter}
            options={['All', 'Pending', 'Needs Work', 'Mastered']}
          />
          <Select
            label="Accuracy"
            value={accFilter}
            onChange={setAccFilter}
            options={['All', 'High ≥80%', 'Medium 60–79%', 'Low <60%']}
          />
          <Select
            label="Due"
            value={dueFilter}
            onChange={setDueFilter}
            options={['All', 'Due Today', 'Due This Week', 'Overdue']}
          />
          <Select
            label="Coverage"
            value={covFilter}
            onChange={setCovFilter}
            options={['All', 'Covered', 'Not Covered']}
          />
          <Select
            label="Sort By"
            value={sortBy}
            onChange={setSortBy}
            options={['Default', 'Accuracy ↑', 'Accuracy ↓', 'Next Revision ↑']}
          />
        </div>
      </div>

      <p className="text-xs font-semibold text-rose-400 mb-3">
        Showing {filtered.length} of {questions.length} problems
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-rose-400">No questions match the current filters.</p>
      ) : (
        filtered.map((q) => (
          <QuestionCard
            key={q.id}
            question={q}
            isActive={q.id === activeQid}
            onPractice={() => onPractice(q.id, navIds)}
            onLastRecord={() => onLastRecord(q.id, navIds)}
          />
        ))
      )}
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <select
      aria-label={label}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="border border-rose-300 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-rose-600"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}

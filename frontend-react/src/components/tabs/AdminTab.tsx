import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import Editor from '@monaco-editor/react'
import { Question, AdminUser } from '../../types'
import {
  adminListUsers, adminCreateUser, adminDeleteUser,
  uploadMd, syncQuestions, createQuestion, updateQuestion, updateHint,
} from '../../api/client'

interface Props {
  questions: Question[]
  onQuestionsChanged: () => void
}

type AdminView = 'questions' | 'users' | 'upload'

export default function AdminTab({ questions, onQuestionsChanged }: Props) {
  const [view, setView] = useState<AdminView>('questions')

  return (
    <div>
      <div className="flex gap-2 mb-6">
        {(['questions', 'users', 'upload'] as AdminView[]).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-colors ${
              view === v
                ? 'text-white'
                : 'bg-white border border-rose-300 text-rose-600 hover:bg-rose-100'
            }`}
            style={view === v ? { background: 'linear-gradient(135deg,#e11d48,#be123c)' } : undefined}
          >
            {v === 'questions' ? '📋 Questions' : v === 'users' ? '👥 Users' : '📤 Upload'}
          </button>
        ))}
      </div>

      {view === 'questions' && (
        <QuestionManager questions={questions} onChanged={onQuestionsChanged} />
      )}
      {view === 'users' && <UserManager />}
      {view === 'upload' && <UploadPanel onChanged={onQuestionsChanged} />}
    </div>
  )
}

// ── Question Manager ───────────────────────────────────────────────────────────
function QuestionManager({ questions, onChanged }: { questions: Question[]; onChanged: () => void }) {
  const [editQ, setEditQ] = useState<Question | null>(null)
  const [newQ, setNewQ] = useState(false)
  const [hint, setHint] = useState('')
  const [hintQid, setHintQid] = useState<number | null>(null)
  const [msg, setMsg] = useState('')

  const syncMut = useMutation({
    mutationFn: syncQuestions,
    onSuccess: (d) => { setMsg(d.status); onChanged() },
  })

  const saveMut = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      editQ ? updateQuestion(editQ.id, data) : createQuestion(data),
    onSuccess: () => { setEditQ(null); setNewQ(false); setMsg('Saved!'); onChanged() },
  })

  const hintMut = useMutation({
    mutationFn: ({ id, hint }: { id: number; hint: string }) => updateHint(id, hint),
    onSuccess: () => { setHintQid(null); setHint(''); setMsg('Hint saved!'); onChanged() },
  })

  return (
    <div className="space-y-4">
      {msg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">{msg}</div>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => syncMut.mutate()}
          disabled={syncMut.isPending}
          className="px-4 py-2 rounded-xl text-sm font-bold bg-navy text-cream hover:bg-navy-light disabled:opacity-60"
        >
          {syncMut.isPending ? 'Syncing…' : '🔄 Sync from MD File'}
        </button>
        <button
          onClick={() => setNewQ(true)}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
        >
          + Add Question
        </button>
      </div>

      {(newQ || editQ) && (
        <QuestionForm
          initial={editQ}
          onSave={(data) => saveMut.mutate(data)}
          onCancel={() => { setEditQ(null); setNewQ(false) }}
          loading={saveMut.isPending}
        />
      )}

      {/* Question list */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {questions.map((q) => (
          <div key={q.id} className="bg-white border border-rose-300 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-950 truncate">{q.title}</p>
              <p className="text-xs text-rose-400">{q.pattern}</p>
            </div>
            {hintQid === q.id ? (
              <div className="flex gap-1">
                <input
                  value={hint}
                  onChange={(e) => setHint(e.target.value)}
                  placeholder="Hint text…"
                  className="border border-rose-300 rounded-lg px-2 py-1 text-xs w-40"
                />
                <button
                  onClick={() => hintMut.mutate({ id: q.id, hint })}
                  className="px-2 py-1 rounded-lg text-xs text-white bg-rose-600"
                >Save</button>
                <button onClick={() => setHintQid(null)} className="px-2 py-1 rounded-lg text-xs text-gray-400">✕</button>
              </div>
            ) : (
              <div className="flex gap-1">
                <button
                  onClick={() => { setEditQ(q); setNewQ(false) }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200"
                >Edit</button>
                <button
                  onClick={() => { setHintQid(q.id); setHint(q.hint ?? '') }}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-100 text-rose-600 hover:bg-rose-200"
                >💡 Hint</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

function QuestionForm({
  initial,
  onSave,
  onCancel,
  loading,
}: {
  initial: Question | null
  onSave: (data: Record<string, unknown>) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState({
    title: initial?.title ?? '',
    pattern: initial?.pattern ?? '',
    difficulty: initial?.difficulty ?? 'Medium',
    hint: initial?.hint ?? '',
    description: initial?.description ?? '',
  })

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }))

  return (
    <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm space-y-3">
      <h3 className="text-sm font-bold text-rose-600">{initial ? 'Edit Question' : 'New Question'}</h3>
      <input
        value={form.title} onChange={(e) => set('title', e.target.value)}
        placeholder="Question title *"
        className="w-full border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600"
      />
      <input
        value={form.pattern} onChange={(e) => set('pattern', e.target.value)}
        placeholder="Pattern (e.g. Array, DP, Graphs)"
        className="w-full border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600"
      />
      <select
        value={form.difficulty} onChange={(e) => set('difficulty', e.target.value)}
        className="border border-rose-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:border-rose-600"
      >
        {['Easy', 'Medium', 'Hard'].map((d) => <option key={d}>{d}</option>)}
      </select>
      <textarea
        value={form.hint} onChange={(e) => set('hint', e.target.value)}
        placeholder="Hint (optional)"
        rows={2}
        className="w-full border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600 resize-y"
      />
      <div className="flex gap-2 justify-end">
        <button onClick={onCancel} className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-100 text-gray-500 hover:bg-gray-200">
          Cancel
        </button>
        <button
          onClick={() => onSave(form)}
          disabled={loading || !form.title}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
        >
          {loading ? 'Saving…' : 'Save'}
        </button>
      </div>
    </div>
  )
}

// ── User Manager ───────────────────────────────────────────────────────────────
function UserManager() {
  const qc = useQueryClient()
  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin-users'],
    queryFn: adminListUsers,
  })
  const [newEmail, setNewEmail] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [msg, setMsg] = useState('')

  const createMut = useMutation({
    mutationFn: () => adminCreateUser({ email: newEmail, role: newRole }),
    onSuccess: () => { setNewEmail(''); setMsg('User created!'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  const deleteMut = useMutation({
    mutationFn: (uid: number) => adminDeleteUser(uid),
    onSuccess: () => { setMsg('User deleted.'); qc.invalidateQueries({ queryKey: ['admin-users'] }) },
  })

  if (isLoading) return <p className="text-sm text-rose-400">Loading users…</p>

  return (
    <div className="space-y-4 max-w-lg">
      {msg && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2 text-sm text-green-700">{msg}</div>
      )}

      {/* Create user */}
      <div className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
        <h3 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">Add User</h3>
        <div className="flex gap-2">
          <input
            value={newEmail} onChange={(e) => setNewEmail(e.target.value)}
            placeholder="user@example.com"
            className="flex-1 border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600"
          />
          <select
            value={newRole} onChange={(e) => setNewRole(e.target.value)}
            className="border border-rose-300 rounded-lg px-3 py-2 text-sm bg-white"
          >
            <option value="user">User</option>
            <option value="admin">Admin</option>
          </select>
          <button
            onClick={() => createMut.mutate()}
            disabled={!newEmail || createMut.isPending}
            className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
            style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
          >
            Add
          </button>
        </div>
      </div>

      {/* User list */}
      <div className="space-y-2">
        {users.map((u) => (
          <div key={u.id} className="bg-white border border-rose-300 rounded-xl px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-950">{u.username}</p>
              <p className="text-xs text-gray-400">{u.email}</p>
            </div>
            <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-200 text-rose-600 capitalize">
              {u.role}
            </span>
            {u.oauth_provider && (
              <span className="text-xs text-gray-400">{u.oauth_provider}</span>
            )}
            <button
              onClick={() => {
                if (confirm(`Delete user "${u.username}"?`)) deleteMut.mutate(u.id)
              }}
              className="text-xs font-semibold text-red-500 hover:text-red-700"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Upload Panel ───────────────────────────────────────────────────────────────
function UploadPanel({ onChanged }: { onChanged: () => void }) {
  const [msg, setMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true)
    try {
      const res = await uploadMd(file)
      setMsg(`✅ Added ${res.added} new questions (${res.total} total).`)
      onChanged()
    } catch {
      setMsg('⚠ Upload failed.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md space-y-4">
      <div className="bg-white border border-rose-300 rounded-2xl p-6 shadow-sm text-center">
        <p className="text-3xl mb-3">📤</p>
        <p className="text-sm text-gray-500 mb-4">
          Upload a Markdown file with questions in the expected format.
        </p>
        <label className="cursor-pointer px-5 py-2.5 rounded-xl text-sm font-bold text-white inline-block"
          style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}>
          {loading ? 'Uploading…' : 'Choose .md File'}
          <input type="file" accept=".md" onChange={handleFile} className="hidden" disabled={loading} />
        </label>
      </div>
      {msg && (
        <div className="bg-rose-100 border border-rose-300 rounded-xl px-4 py-2 text-sm text-rose-700">{msg}</div>
      )}
    </div>
  )
}

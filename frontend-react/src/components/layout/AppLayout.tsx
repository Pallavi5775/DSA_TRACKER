import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { AuthData, ActivePanel, Question } from '../../types'
import { getQuestions } from '../../api/client'
import NotificationBell from '../shared/NotificationBell'
import QuestionsTab from '../tabs/QuestionsTab'
import CalendarTab from '../tabs/CalendarTab'
import ActivityTab from '../tabs/ActivityTab'
import SettingsTab from '../tabs/SettingsTab'
import PatternsTab from '../tabs/PatternsTab'
import JournalTab from '../tabs/JournalTab'
import AdminTab from '../tabs/AdminTab'
import PracticePanel from '../questions/PracticePanel'
import LastRecordPanel from '../questions/LastRecordPanel'

interface Props {
  auth: AuthData
  onLogout: () => void
}

const BASE_TABS = [
  { id: 'questions', label: '📋 Questions' },
  { id: 'calendar', label: '📅 Calendar' },
  { id: 'activity', label: '⚡ Activity' },
  { id: 'settings', label: '⚙ Settings' },
  { id: 'patterns', label: '📚 Patterns' },
]

export default function AppLayout({ auth, onLogout }: Props) {
  const isAdmin = auth.role === 'admin'
  const hasGithub = auth.oauthProvider === 'github'

  const tabs = [
    ...BASE_TABS,
    ...(hasGithub ? [{ id: 'journal', label: '📖 Journal' }] : []),
    ...(isAdmin ? [{ id: 'admin', label: '➕ Add Questions' }] : []),
  ]

  const [activeTab, setActiveTab] = useState('questions')
  const [panel, setPanel] = useState<ActivePanel>({ mode: 'none' })

  const { data: questions = [], refetch: refetchQuestions } = useQuery<Question[]>({
    queryKey: ['questions'],
    queryFn: getQuestions,
  })

  const openPractice = (qid: number, navIds: number[]) =>
    setPanel({ mode: 'practice', qid, navIds })
  const openLastRecord = (qid: number, navIds: number[]) =>
    setPanel({ mode: 'last_record', qid, navIds })
  const closePanel = () => setPanel({ mode: 'none' })

  const navigate = (direction: -1 | 1) => {
    if (panel.mode === 'none') return
    const { qid, navIds, mode } = panel
    const idx = navIds.indexOf(qid) + direction
    if (idx >= 0 && idx < navIds.length) {
      setPanel({ mode, qid: navIds[idx], navIds })
    }
  }

  const activeQ =
    panel.mode !== 'none' ? questions.find((q) => q.id === panel.qid) ?? null : null

  const showSidePanel = panel.mode !== 'none' && activeQ !== null

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* ── Top bar ── */}
      <header className="bg-white border-b border-rose-200 px-6 py-3 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div>
          <h1 className="font-extrabold text-xl tracking-tight text-rose-grad leading-none">
            🎯 DSA Revision Planner
          </h1>
          <p className="text-rose-300 text-xs font-medium">Track · Practice · Master</p>
        </div>

        <div className="flex items-center gap-3">
          <NotificationBell />
          <div className="flex items-center gap-2">
            {auth.avatarUrl && (
              <img
                src={auth.avatarUrl}
                alt={auth.username}
                className="w-7 h-7 rounded-full border border-rose-200"
              />
            )}
            <span
              className="px-3 py-1 rounded-full text-xs font-bold text-white"
              style={{ background: isAdmin ? 'linear-gradient(135deg,#c97b6e,#b5615a)' : 'linear-gradient(135deg,#c97b6e,#8b5cf6)' }}
            >
              {isAdmin ? '👑' : '👤'} {auth.username}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-500 uppercase tracking-wide">
              {auth.role}
            </span>
          </div>
          <button
            onClick={onLogout}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-navy text-cream hover:bg-navy-light transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ── Tab navigation ── */}
      <nav className="bg-white border-b border-rose-200 px-6 flex gap-0 overflow-x-auto">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-3 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 ${
              activeTab === t.id
                ? 'border-rose-500 text-rose-500'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* ── Main content ── */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left: tab content */}
        <main className={`flex-1 overflow-y-auto p-6 ${showSidePanel ? 'max-w-[calc(100%-480px)]' : ''}`}>
          {activeTab === 'questions' && (
            <QuestionsTab
              questions={questions}
              onPractice={openPractice}
              onLastRecord={openLastRecord}
              activeQid={panel.mode !== 'none' ? panel.qid : null}
            />
          )}
          {activeTab === 'calendar' && <CalendarTab questions={questions} />}
          {activeTab === 'activity' && <ActivityTab />}
          {activeTab === 'settings' && <SettingsTab auth={auth} />}
          {activeTab === 'patterns' && <PatternsTab />}
          {activeTab === 'journal' && <JournalTab />}
          {activeTab === 'admin' && (
            <AdminTab questions={questions} onQuestionsChanged={refetchQuestions} />
          )}
        </main>

        {/* Right: practice / last-record panel */}
        {showSidePanel && activeQ && (
          <aside className="w-[480px] flex-shrink-0 border-l border-rose-200 bg-navy overflow-y-auto scrollbar-thin">
            {panel.mode === 'practice' ? (
              <PracticePanel
                question={activeQ}
                navIds={panel.navIds}
                onNavigate={navigate}
                onClose={closePanel}
                onSessionLogged={() => {
                  refetchQuestions()
                  closePanel()
                }}
              />
            ) : (
              <LastRecordPanel
                question={activeQ}
                navIds={panel.navIds}
                onNavigate={navigate}
                onClose={closePanel}
                onSaved={refetchQuestions}
              />
            )}
          </aside>
        )}
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { AuthData, NotifSettings } from '../../types'
import { getPracticeDays, updatePracticeDays, getNotifSettings, updateNotifSettings, githubSetup } from '../../api/client'

interface Props {
  auth: AuthData
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export default function SettingsTab({ auth }: Props) {
  const qc = useQueryClient()
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set())
  const [notifSettings, setNotifSettings] = useState<NotifSettings>({
    email_notif_enabled: false,
    telegram_notif_enabled: false,
    telegram_chat_id: '',
    notify_hour: 9,
  })
  const [saved, setSaved] = useState('')
  const [githubMsg, setGithubMsg] = useState('')

  // Load practice days
  const { data: pdData } = useQuery({ queryKey: ['practice-days'], queryFn: getPracticeDays })
  useEffect(() => {
    if (!pdData) return
    const raw: string = pdData.practice_days ?? ''
    if (!raw) {
      setSelectedDays(new Set())
    } else {
      setSelectedDays(new Set(raw.split(',').map(Number)))
    }
  }, [pdData])

  // Load notification settings
  const { data: nsData } = useQuery<NotifSettings>({ queryKey: ['notif-settings'], queryFn: getNotifSettings })
  useEffect(() => {
    if (!nsData) return
    setNotifSettings(nsData)
  }, [nsData])

  const savePracticeDays = useMutation({
    mutationFn: () => {
      const str = [...selectedDays].sort().join(',')
      return updatePracticeDays(str)
    },
    onSuccess: () => { setSaved('Practice schedule saved!'); qc.invalidateQueries({ queryKey: ['practice-days'] }) },
  })

  const saveNotifSettings = useMutation({
    mutationFn: () => updateNotifSettings(notifSettings as unknown as Record<string, unknown>),
    onSuccess: () => { setSaved('Notification settings saved!'); qc.invalidateQueries({ queryKey: ['notif-settings'] }) },
  })

  const toggleDay = (d: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev)
      next.has(d) ? next.delete(d) : next.add(d)
      return next
    })
  }

  const setupGithub = async () => {
    try {
      const res = await githubSetup()
      setGithubMsg(res.ok ? '✅ GitHub repo ready!' : `⚠ ${res.reason ?? 'Failed'}`)
    } catch {
      setGithubMsg('⚠ Failed to setup GitHub repo.')
    }
  }

  return (
    <div className="max-w-xl space-y-6">
      {saved && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-2.5 text-sm text-green-700 font-medium">
          {saved}
        </div>
      )}

      {/* Practice Schedule */}
      <section className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-4">
          📅 Practice Schedule
        </h2>
        <p className="text-sm text-gray-500 mb-3">
          Select your practice days. Leave all unchecked for daily reminders.
        </p>
        <div className="flex gap-2 flex-wrap mb-4">
          {DAY_LABELS.map((label, i) => (
            <button
              key={i}
              onClick={() => toggleDay(i)}
              className={`px-3 py-2 rounded-xl text-sm font-bold transition-colors ${
                selectedDays.has(i)
                  ? 'text-white'
                  : 'bg-rose-100 text-rose-600 hover:bg-rose-200'
              }`}
              style={selectedDays.has(i) ? { background: 'linear-gradient(135deg,#e11d48,#be123c)' } : undefined}
            >
              {label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mb-4">
          {selectedDays.size === 0
            ? 'Daily practice (all days)'
            : `Practice on: ${[...selectedDays].sort().map((d) => DAY_LABELS[d]).join(', ')}`}
        </p>
        <button
          onClick={() => savePracticeDays.mutate()}
          disabled={savePracticeDays.isPending}
          className="px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
        >
          {savePracticeDays.isPending ? 'Saving…' : 'Save Schedule'}
        </button>
      </section>

      {/* Notifications */}
      <section className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-4">
          🔔 Notification Settings
        </h2>

        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifSettings.email_notif_enabled}
              onChange={(e) => setNotifSettings((s) => ({ ...s, email_notif_enabled: e.target.checked }))}
              className="w-4 h-4 accent-rose-600"
            />
            <span className="text-sm text-gray-700">Email notifications</span>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={notifSettings.telegram_notif_enabled}
              onChange={(e) => setNotifSettings((s) => ({ ...s, telegram_notif_enabled: e.target.checked }))}
              className="w-4 h-4 accent-rose-600"
            />
            <span className="text-sm text-gray-700">Telegram notifications</span>
          </label>

          {notifSettings.telegram_notif_enabled && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">Telegram Chat ID</label>
              <input
                type="text"
                value={notifSettings.telegram_chat_id ?? ''}
                onChange={(e) => setNotifSettings((s) => ({ ...s, telegram_chat_id: e.target.value }))}
                placeholder="e.g. 123456789"
                className="w-full border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">
              Daily digest hour (UTC) — 0–23
            </label>
            <input
              type="number"
              min={0}
              max={23}
              value={notifSettings.notify_hour}
              onChange={(e) => setNotifSettings((s) => ({ ...s, notify_hour: Number(e.target.value) }))}
              className="w-24 border border-rose-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-rose-600"
            />
          </div>
        </div>

        <button
          onClick={() => saveNotifSettings.mutate()}
          disabled={saveNotifSettings.isPending}
          className="mt-4 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-60"
          style={{ background: 'linear-gradient(135deg,#e11d48,#be123c)' }}
        >
          {saveNotifSettings.isPending ? 'Saving…' : 'Save Notification Settings'}
        </button>
      </section>

      {/* GitHub Integration */}
      <section className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
          GitHub Integration
        </h2>
        {auth.oauthProvider === 'github' ? (
          <div>
            <p className="text-sm text-gray-600 mb-3">
              Connected as <strong>@{auth.githubUsername}</strong>. Your practice sessions are backed up to a private GitHub repo.
            </p>
            <button
              onClick={setupGithub}
              className="px-4 py-2 rounded-xl text-sm font-bold bg-navy text-cream hover:bg-navy-light transition-colors"
            >
              🔧 Ensure Repo Exists
            </button>
            {githubMsg && <p className="mt-2 text-sm">{githubMsg}</p>}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            Sign in with GitHub to enable automatic backup of your practice sessions to a private repository.
          </p>
        )}
      </section>

      {/* Account info */}
      <section className="bg-white border border-rose-300 rounded-2xl p-5 shadow-sm">
        <h2 className="text-xs font-bold uppercase tracking-widest text-rose-600 mb-3">
          👤 Account
        </h2>
        <div className="space-y-1 text-sm">
          <div className="flex gap-2">
            <span className="text-gray-400 w-28">Username</span>
            <span className="text-gray-700 font-medium">{auth.username}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-28">Role</span>
            <span className="text-gray-700 font-medium capitalize">{auth.role}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-400 w-28">Auth Provider</span>
            <span className="text-gray-700 font-medium capitalize">{auth.oauthProvider ?? 'N/A'}</span>
          </div>
        </div>
      </section>
    </div>
  )
}

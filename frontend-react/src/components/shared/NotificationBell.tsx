import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getNotifications, markAllNotifRead } from '../../api/client'
import { Notification } from '../../types'

export default function NotificationBell() {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()

  const { data: notifs = [] } = useQuery<Notification[]>({
    queryKey: ['notifications'],
    queryFn: getNotifications,
    refetchInterval: 60_000,
  })

  const unread = notifs.filter((n) => !n.is_read).length

  const markAll = useMutation({
    mutationFn: markAllNotifRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const icons: Record<string, string> = {
    revisions: '📚',
    streak: '🔥',
    mastery: '🏆',
    info: 'ℹ️',
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-light border border-navy-mid text-rose-400 text-sm font-semibold hover:bg-navy-mid transition-colors"
      >
        🔔
        {unread > 0 && (
          <span className="bg-rose-500 text-white text-xs rounded-full px-1.5 py-0.5 font-bold leading-none">
            {unread}
          </span>
        )}
        {unread === 0 && <span>Inbox</span>}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-navy-dark border border-navy-mid rounded-2xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-navy-mid">
            <span className="text-white font-bold text-sm">🔔 Notifications</span>
            <span className="bg-navy-mid text-rose-400 rounded-full px-2.5 py-0.5 text-xs font-bold">
              {unread} unread
            </span>
          </div>

          <div className="max-h-72 overflow-y-auto scrollbar-thin">
            {notifs.length === 0 ? (
              <div className="py-8 text-center text-rose-700 text-sm">
                🎉 All caught up!
              </div>
            ) : (
              notifs.slice(0, 10).map((n) => (
                <div
                  key={n.id}
                  className={`flex gap-3 items-start px-4 py-3 border-b border-navy-mid ${
                    !n.is_read ? 'bg-navy-mid/50' : ''
                  }`}
                >
                  <span className="mt-0.5 text-base flex-shrink-0">
                    {icons[n.type] ?? '🔔'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs leading-relaxed ${n.is_read ? 'text-rose-300' : 'text-rose-100'}`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-rose-800 mt-0.5">
                      {n.created_at.slice(0, 16).replace('T', ' ')} UTC
                    </p>
                  </div>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-rose-400 flex-shrink-0 mt-1.5" />
                  )}
                </div>
              ))
            )}
          </div>

          {unread > 0 && (
            <div className="px-4 py-2.5 border-t border-navy-mid">
              <button
                onClick={() => { markAll.mutate(); setOpen(false) }}
                className="w-full text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
              >
                ✓ Mark all as read
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

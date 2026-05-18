import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import LoginPage from './components/auth/LoginPage'
import AppLayout from './components/layout/AppLayout'
import { AuthData } from './types'
import { saveAuth, loadAuth, clearAuth } from './store/auth'
import { getMe } from './api/client'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 30_000 },
  },
})

function AppInner() {
  const [auth, setAuth] = useState<AuthData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const tok = params.get('tok')

    const hydrateFromMe = async (token: string, storedBase?: Partial<AuthData>) => {
      localStorage.setItem('dsa_token', token)
      try {
        const me = await getMe()
        const authData: AuthData = {
          token,
          username: me.username ?? storedBase?.username ?? '',
          userId: me.id ?? storedBase?.userId ?? 0,
          role: me.role ?? storedBase?.role ?? 'user',
          oauthProvider: me.oauth_provider,
          githubUsername: me.github_username,
          avatarUrl: me.avatar_url,
        }
        saveAuth(authData)
        setAuth(authData)
      } catch {
        clearAuth()
        setAuth(null)
      } finally {
        setLoading(false)
      }
    }

    if (tok) {
      // OAuth callback — clean the URL first
      const clean = new URL(window.location.href)
      clean.search = ''
      window.history.replaceState({}, '', clean.toString())
      hydrateFromMe(tok)
    } else {
      const stored = loadAuth()
      if (stored?.token) {
        hydrateFromMe(stored.token, stored)
      } else {
        setLoading(false)
      }
    }
  }, [])

  const handleLogout = () => {
    clearAuth()
    queryClient.clear()
    setAuth(null)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-3">🎯</div>
          <div className="text-rose-600 font-semibold text-lg">Loading…</div>
        </div>
      </div>
    )
  }

  if (!auth) return <LoginPage />

  return <AppLayout auth={auth} onLogout={handleLogout} />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  )
}

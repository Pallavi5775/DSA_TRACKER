const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? 'https://dsa-planner.co.in'

export default function LoginPage() {
  const params = new URLSearchParams(window.location.search)
  const authError = params.get('auth_error')

  return (
    <div className="min-h-screen bg-cream flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🎯</div>
          <h1 className="text-2xl font-extrabold text-rose-grad mb-1">DSA Revision Planner</h1>
          <p className="text-rose-300 text-sm">Track · Practice · Master</p>
        </div>

        {authError && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
            {decodeURIComponent(authError)}
          </div>
        )}

        {/* Card */}
        <div className="bg-white border border-rose-200 rounded-2xl p-8 shadow-sm">
          <p className="text-center text-gray-500 text-sm mb-6">Sign in to continue</p>

          {/* Google */}
          <a
            href={`${BACKEND}/api/auth/google`}
            className="flex items-center justify-center gap-3 w-full px-5 py-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors mb-3"
          >
            <GoogleIcon />
            Continue with Google
          </a>

          {/* GitHub */}
          <a
            href={`${BACKEND}/api/auth/github`}
            className="flex items-center justify-center gap-3 w-full px-5 py-3 rounded-xl bg-navy text-cream font-semibold text-sm hover:bg-navy-light transition-colors"
          >
            <GitHubIcon />
            Continue with GitHub
          </a>

          <p className="text-center text-rose-300 text-xs mt-5">
            We only read your public profile and email address.
          </p>
        </div>
      </div>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.8 0 6.9 5.4 3 13.3l7.8 6C12.7 13 17.9 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.6 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.9-10 6.9-17z" />
      <path fill="#FBBC05" d="M10.8 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7L2.5 13.3A24 24 0 0 0 0 24c0 3.8.9 7.4 2.5 10.6l8.3-5.9z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.2-8.4 2.2-6.1 0-11.3-3.6-13.2-8.8l-8.3 5.9C6.9 42.6 14.8 48 24 48z" />
    </svg>
  )
}

function GitHubIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.17c-3.34.72-4.04-1.6-4.04-1.6-.54-1.38-1.33-1.75-1.33-1.75-1.09-.74.08-.73.08-.73 1.2.09 1.83 1.24 1.83 1.24 1.07 1.83 2.8 1.3 3.48.99.1-.78.42-1.3.76-1.6-2.66-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.13-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 3-.4c1.02 0 2.04.13 3 .4 2.28-1.55 3.29-1.23 3.29-1.23.66 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

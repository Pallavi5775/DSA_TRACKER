import { AuthData } from '../types'

const STORAGE_KEY = 'dsa_auth'

export function saveAuth(data: AuthData): void {
  localStorage.setItem('dsa_token', data.token)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function loadAuth(): AuthData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as AuthData
  } catch {
    return null
  }
}

export function clearAuth(): void {
  localStorage.removeItem('dsa_token')
  localStorage.removeItem(STORAGE_KEY)
}

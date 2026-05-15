import axios from 'axios'

const BACKEND = (import.meta as any).env?.VITE_BACKEND_URL ?? 'https://dsa-planner.co.in'
const API_URL = `${BACKEND}/api`

const api = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dsa_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('dsa_token')
      localStorage.removeItem('dsa_auth')
      window.location.href = '/'
    }
    return Promise.reject(err)
  }
)

// ── Auth ──────────────────────────────────────────────────────────────────────
export const getMe = () => api.get('/auth/me').then((r) => r.data)

// ── Questions ─────────────────────────────────────────────────────────────────
export const getQuestions = () => api.get('/questions').then((r) => r.data)

export const createQuestion = (data: Record<string, unknown>) =>
  api.post('/questions', data).then((r) => r.data)

export const updateQuestion = (id: number, data: Record<string, unknown>) =>
  api.put(`/questions/${id}`, data).then((r) => r.data)

export const logSession = (qid: number, data: Record<string, unknown>) =>
  api.post(`/questions/${qid}/log`, data).then((r) => r.data)

export const updateStatus = (
  qid: number,
  category: string,
  coverage_status: string,
  revision_status: string
) =>
  api
    .put(`/questions/${qid}/status`, { category, coverage_status, revision_status })
    .then((r) => r.data)

export const updateHint = (qid: number, hint: string) =>
  api.patch(`/questions/${qid}/hint`, JSON.stringify(hint), {
    headers: { 'Content-Type': 'application/json' },
  }).then((r) => r.data)

export const updateNotes = (qid: number, notes: string, myGapAnalysis: string) =>
  api
    .patch(`/questions/${qid}/notes`, { notes, my_gap_analysis: myGapAnalysis })
    .then((r) => r.data)

export const getLastLog = (qid: number) =>
  api.get(`/questions/${qid}/last-log`).then((r) => r.data)

export const updateLastLog = (qid: number, data: Record<string, unknown>) =>
  api.patch(`/questions/${qid}/last-log`, data).then((r) => r.data)

export const generateDescription = (qid: number) =>
  api.post(`/questions/${qid}/description`).then((r) => r.data)

export const validateQuestion = (qid: number) =>
  api.post(`/questions/${qid}/validate`).then((r) => r.data)

export const hintChat = (
  qid: number,
  message: string,
  context: Record<string, unknown>,
  history: unknown[],
  generateVariations = false
) =>
  api
    .post(`/questions/${qid}/chat`, { message, context, history, generate_variations: generateVariations })
    .then((r) => r.data)

export const variationReview = (qid: number, data: Record<string, unknown>) =>
  api.post(`/questions/${qid}/variation-review`, data).then((r) => r.data)

// ── Activity ──────────────────────────────────────────────────────────────────
export const getActivity = (tz?: string) =>
  api
    .get('/activity', { params: { tz: tz ?? Intl.DateTimeFormat().resolvedOptions().timeZone } })
    .then((r) => r.data)

// ── Notifications ─────────────────────────────────────────────────────────────
export const getNotifications = () => api.get('/me/notifications').then((r) => r.data)
export const markNotifRead = (id: number) =>
  api.patch(`/me/notifications/${id}/read`).then((r) => r.data)
export const markAllNotifRead = () => api.patch('/me/notifications/read-all').then((r) => r.data)
export const getNotifSettings = () => api.get('/me/notification-settings').then((r) => r.data)
export const updateNotifSettings = (data: Record<string, unknown>) =>
  api.patch('/me/notification-settings', data).then((r) => r.data)

// ── Practice days ─────────────────────────────────────────────────────────────
export const getPracticeDays = () => api.get('/me/practice-days').then((r) => r.data)
export const updatePracticeDays = (practice_days: string) =>
  api.patch('/me/practice-days', { practice_days }).then((r) => r.data)

// ── GitHub ────────────────────────────────────────────────────────────────────
export const githubSetup = () => api.post('/github/setup').then((r) => r.data)
export const githubHistory = () => api.get('/github/history').then((r) => r.data)

// ── Pattern notes ─────────────────────────────────────────────────────────────
export const getPatternNotes = () => api.get('/pattern-notes').then((r) => r.data)
export const updatePatternNote = (
  pattern: string,
  notes?: string,
  memory_techniques?: string
) => api.patch('/pattern-notes', { pattern, notes, memory_techniques }).then((r) => r.data)
export const patternChat = (pattern: string, message: string, generate_memo = false) =>
  api.post('/pattern-chat', { pattern, message, generate_memo }).then((r) => r.data)

// ── Admin ─────────────────────────────────────────────────────────────────────
export const adminListUsers = () => api.get('/users').then((r) => r.data)
export const adminCreateUser = (data: Record<string, unknown>) =>
  api.post('/users', data).then((r) => r.data)
export const adminDeleteUser = (uid: number) => api.delete(`/users/${uid}`).then((r) => r.data)
export const uploadMd = (file: File) => {
  const fd = new FormData()
  fd.append('file', file)
  return api.post('/upload_md', fd).then((r) => r.data)
}
export const syncQuestions = () => api.post('/sync_questions').then((r) => r.data)

export default api

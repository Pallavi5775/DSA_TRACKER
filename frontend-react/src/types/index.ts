export interface AuthData {
  token: string
  username: string
  userId: number
  role: string
  oauthProvider?: string
  githubUsername?: string
  avatarUrl?: string
}

export interface Question {
  id: number
  title: string
  pattern: string
  category?: string
  difficulty?: string
  hint?: string
  description?: string
  suggestions?: string
  my_gap_analysis?: string
  accuracy?: number
  ease_factor?: number
  interval_days?: number
  coverage_status: 'Covered' | 'Not Covered'
  revision_status: 'Mastered' | 'Needs Work' | 'Pending'
  next_revision?: string
  total_time_spent?: number
  notes?: string
  logs?: SessionLog[]
}

export interface SessionLog {
  date: string
  correct: boolean
  time_taken: number
  logic?: string
  code?: string
  accuracy?: number
}

export interface LastLog {
  date: string
  correct: boolean
  time_taken: number
  logic?: string
  code?: string
  notes?: string
  my_gap_analysis?: string
  accuracy?: number
}

export interface ActivityData {
  sessions_by_date: Record<string, number>
  recent_sessions: RecentSession[]
  total_sessions: number
  streak: number
  patterns_practiced: number
  avg_accuracy: number
  total_time_seconds: number
  daily_correct: Record<string, number>
  daily_wrong: Record<string, number>
  pattern_counts: Record<string, number>
  time_by_pattern: Record<string, number>
}

export interface RecentSession {
  date: string
  question_title: string
  pattern: string
  correct: boolean
  time_taken: number
  accuracy?: number
}

export interface Notification {
  id: number
  message: string
  type: string
  is_read: boolean
  created_at: string
}

export interface PatternNote {
  pattern: string
  notes?: string
  memory_techniques?: string
}

export interface JournalSession {
  date: string
  question: string
  pattern?: string
  category?: string
  difficulty?: string
  correct: boolean
  time_taken_seconds: number
  logic?: string
  code?: string
  gap_analysis?: string
  ai_insight?: string
}

export interface AdminUser {
  id: number
  username: string
  email: string
  role: string
  oauth_provider?: string
}

export interface NotifSettings {
  email_notif_enabled: boolean
  telegram_notif_enabled: boolean
  telegram_chat_id?: string
  notify_hour: number
}

export type ActivePanel =
  | { mode: 'none' }
  | { mode: 'practice'; qid: number; navIds: number[] }
  | { mode: 'last_record'; qid: number; navIds: number[] }

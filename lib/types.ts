export interface User {
  id: string
  email: string | null
  created_at: string
}

export interface Task {
  id: string
  user_id: string
  text: string
  completed: boolean
  created_at: string
  updated_at: string
}

export interface PomodoroSettings {
  id: string
  user_id: string
  work_duration: number
  short_break_duration: number
  long_break_duration: number
  sessions_until_long_break: number
  created_at: string
  updated_at: string
}

export interface StudySpot {
  id: string
  user_id: string
  name: string
  address: string | null
  latitude: number
  longitude: number
  has_wifi: boolean
  has_food: boolean
  has_drinks: boolean
  has_charging: boolean
  notes: string | null
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User
        Insert: Omit<User, "id" | "created_at">
        Update: Partial<Omit<User, "id" | "created_at">>
      }
      tasks: {
        Row: Task
        Insert: Omit<Task, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<Task, "id" | "created_at" | "updated_at">>
      }
      pomodoro_settings: {
        Row: PomodoroSettings
        Insert: Omit<PomodoroSettings, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<PomodoroSettings, "id" | "created_at" | "updated_at">>
      }
      study_spots: {
        Row: StudySpot
        Insert: Omit<StudySpot, "id" | "created_at" | "updated_at">
        Update: Partial<Omit<StudySpot, "id" | "created_at" | "updated_at">>
      }
    }
  }
}


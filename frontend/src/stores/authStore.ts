// src/stores/authStore.ts
import { Store } from '@tanstack/react-store'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'manager' | 'executor'

export interface Profile {
  id: string
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
}

export const authStore = new Store<AuthState>({
  user: null,
  profile: null,
  loading: true,
})

// Удобные селекторы
export const selectRole = (s: AuthState) => s.profile?.role ?? null
export const selectIsManager = (s: AuthState) => s.profile?.role === 'manager'
export const selectIsAuthenticated = (s: AuthState) => !!s.user

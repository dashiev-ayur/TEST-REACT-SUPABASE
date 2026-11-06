import { useEffect, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import { authStore } from '../stores/authStore'
import type { User } from '@supabase/supabase-js'

async function syncAuth(user: User | null) {
  if (!user) {
    authStore.setState((s) => ({ ...s, user: null, profile: null, loading: false }))
    return
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  authStore.setState((s) => ({
    ...s,
    user,
    profile: error ? null : profile,
    loading: false,
  }))
}

export function AuthProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 1. Начальная сессия
    supabase.auth.getSession().then(({ data: { session } }) => {
      syncAuth(session?.user ?? null)
    })

    // 2. Подписка на изменения (вход, выход, обновление токена)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        syncAuth(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return <>{children}</>
}
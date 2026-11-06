import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface ProfileItem {
  id: string
  email: string
  full_name: string
  role: 'manager' | 'executor'
}

export function useExecutors() {
  return useQuery({
    queryKey: ['profiles', 'executors'],
    queryFn: async (): Promise<ProfileItem[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'executor')
        .order('full_name')
      if (error) throw error
      return data as ProfileItem[]
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface DbObject {
  id: string
  name: string
  address: string | null
  created_by: string
  created_at: string
  updated_at: string
}

const objectsKey = ['objects'] as const

export function useObjects() {
  return useQuery({
    queryKey: objectsKey,
    queryFn: async (): Promise<DbObject[]> => {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DbObject[]
    },
  })
}

export function useObject(id: string | undefined) {
  return useQuery({
    queryKey: ['objects', id],
    enabled: !!id,
    queryFn: async (): Promise<DbObject> => {
      const { data, error } = await supabase
        .from('objects')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as DbObject
    },
  })
}

export function useCreateObject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: { name: string; address?: string | null }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { data, error } = await supabase
        .from('objects')
        .insert({ ...input, created_by: user.id })
        .select()
        .single()
      if (error) throw error
      return data as DbObject
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: objectsKey }),
  })
}

export function useUpdateObject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...patch }: { id: string; name: string; address?: string | null }) => {
      const { data, error } = await supabase
        .from('objects')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DbObject
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: objectsKey })
      qc.invalidateQueries({ queryKey: ['objects', updated.id] })
    },
  })
}

export function useDeleteObject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('objects').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: objectsKey }),
  })
}
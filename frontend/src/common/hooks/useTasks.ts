import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { DbTask, DbTaskHistory } from '../entities'

const tasksKey = (objectId?: string) =>
  objectId ? (['tasks', { objectId }] as const) : (['tasks'] as const)

// Задачи по объекту
export function useTasksByObject(objectId: string | undefined) {
  return useQuery({
    queryKey: tasksKey(objectId),
    enabled: !!objectId,
    queryFn: async (): Promise<DbTask[]> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('object_id', objectId!)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DbTask[]
    },
  })
}

// Мои задачи (для исполнителя)
export function useMyTasks() {
  return useQuery({
    queryKey: ['tasks', 'my'],
    queryFn: async (): Promise<DbTask[]> => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assignee_id', user.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as DbTask[]
    },
  })
}

// Одна задача
export function useTask(id: string | undefined) {
  return useQuery({
    queryKey: ['tasks', id],
    enabled: !!id,
    queryFn: async (): Promise<DbTask> => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as DbTask
    },
  })
}

// История задачи
export function useTaskHistory(taskId: string | undefined) {
  return useQuery({
    queryKey: ['task-history', taskId],
    enabled: !!taskId,
    queryFn: async (): Promise<DbTaskHistory[]> => {
      const { data, error } = await supabase
        .from('task_status_history')
        .select('*')
        .eq('task_id', taskId!)
        .order('created_at', { ascending: true })
      if (error) throw error
      return data as DbTaskHistory[]
    },
  })
}

// Создание задачи (только manager)
export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: {
      title: string
      description?: string | null
      object_id: string
      assignee_id: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Не авторизован')

      const { data, error } = await supabase
        .from('tasks')
        .insert({ ...input, author_id: user.id, status: 'new' })
        .select()
        .single()
      if (error) throw error
      return data as DbTask
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks', { objectId: task.object_id }] })
      qc.invalidateQueries({ queryKey: ['tasks', 'my'] })
      qc.invalidateQueries({ queryKey: ['tasks'] })
    },
  })
}

// Редактирование полей задачи (кроме status)
export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string
      title?: string
      description?: string | null
      assignee_id?: string
    }) => {
      const { data, error } = await supabase
        .from('tasks')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as DbTask
    },
    onSuccess: (task) => {
      qc.invalidateQueries({ queryKey: ['tasks', task.id] })
      qc.invalidateQueries({ queryKey: ['tasks', { objectId: task.object_id }] })
      qc.invalidateQueries({ queryKey: ['tasks', 'my'] })
    },
  })
}

// Удаление задачи (только manager)
export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (task: Pick<DbTask, 'id' | 'object_id'>) => {
      const { error } = await supabase.from('tasks').delete().eq('id', task.id)
      if (error) throw error
    },
    onSuccess: (_d, task) => {
      qc.invalidateQueries({ queryKey: ['tasks', { objectId: task.object_id }] })
      qc.invalidateQueries({ queryKey: ['tasks', 'my'] })
    },
  })
}

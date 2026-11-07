export type TaskStatus = 'new' | 'in_progress' | 'on_review' | 'accepted' | 'needs_rework'

export interface DbTask {
  id: string
  title: string
  description: string | null
  object_id: string
  assignee_id: string
  author_id: string
  status: TaskStatus
  created_at: string
  updated_at: string
}

export interface DbTaskHistory {
  id: number
  task_id: string
  from_status: TaskStatus | null
  to_status: TaskStatus
  changed_by: string
  comment: string | null
  created_at: string
}
import { createFileRoute } from '@tanstack/react-router'
import { TaskDetailPage } from '../../pages/TaskDetailPage'

export const Route = createFileRoute('/_auth/objects_/$objectId/task/$taskId')({
  component: RouteComponent,
})

function RouteComponent() {
  return <TaskDetailPage />
}

import { createFileRoute } from '@tanstack/react-router'
import { EditTaskPage } from '../../../pages/EditTaskPage'

export const Route = createFileRoute('/_auth/_manager/objects_/$objectId/task/$taskId/edit')({
  component: RouteComponent,
})

function RouteComponent() {
  return <EditTaskPage />
}

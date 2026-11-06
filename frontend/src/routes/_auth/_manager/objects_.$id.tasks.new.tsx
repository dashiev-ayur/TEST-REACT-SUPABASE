import { createFileRoute } from '@tanstack/react-router'
import { CreateTaskPage } from '../../../pages/CreateTaskPage'

export const Route = createFileRoute('/_auth/_manager/objects_/$id/tasks/new')({
  component: CreateTaskPage,
})


import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_auth/tasks/$id')({
  component: ()=><p>***</p>,
})
import { createFileRoute } from '@tanstack/react-router'
import { ObjectDetailPage } from '../../pages/ObjectDetailPage'

export const Route = createFileRoute('/_auth/objects_/$id')({
  component: ObjectDetailPage,
})
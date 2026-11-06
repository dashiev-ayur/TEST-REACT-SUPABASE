import { createFileRoute } from '@tanstack/react-router'
import { ObjectsPage } from '../../pages/ObjectsPage'

export const Route = createFileRoute('/_auth/objects/')({
  component: ObjectsPage,
})
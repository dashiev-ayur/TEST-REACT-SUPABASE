import { createFileRoute } from '@tanstack/react-router'
import { EditObjectPage } from '../../../pages/EditObjectPage'

export const Route = createFileRoute('/_auth/_manager/objects/edit/$id')({
  component: EditObjectPage,
})
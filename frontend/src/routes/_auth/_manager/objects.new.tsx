import { createFileRoute } from '@tanstack/react-router'
import { CreateObjectPage } from '../../../pages/CreateObjectPage'

export const Route = createFileRoute('/_auth/_manager/objects/new')({
  component: CreateObjectPage,
})
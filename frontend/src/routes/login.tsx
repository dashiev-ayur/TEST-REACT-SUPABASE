import { createFileRoute, redirect } from '@tanstack/react-router'
import { authStore } from '../common/stores/authStore'
import { LoginPage } from '../pages/LoginPage'
import z from 'zod'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/login')({
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    if (authStore.state.user) {
      throw redirect({ to: search.redirect ?? '/objects' })
    }
  },
  component: () => <LoginPage />,
})
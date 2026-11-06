// src/routes/_auth/_manager.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router'
import { authStore, selectIsManager } from '../stores/authStore'

export const Route = createFileRoute('/_manager')({
  beforeLoad: () => {
    const state = authStore.state
    if (!selectIsManager(state)) {
      throw redirect({ to: '/403' })
    }
  },
  component: () => <Outlet />,
})
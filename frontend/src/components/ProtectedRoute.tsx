
import { useSelector } from '@tanstack/react-store'
import { authStore, selectRole } from '../stores/authStore'
import type { ReactNode } from 'react'
import type { UserRole } from '../stores/authStore'
import { Navigate } from '@tanstack/react-router'

interface ProtectedRouteProps {
  children: ReactNode
  allowedRoles?: UserRole[]
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const loading = useSelector(authStore, (s) => s.loading)
  const user = useSelector(authStore, (s) => s.user)
  const role = useSelector(authStore, selectRole)

  // 1. Пока грузим сессию/профиль — не принимаем решений
  if (loading) {
    return <div>Загрузка...</div> // или MUI CircularProgress
  }

  // 2. Нет пользователя — на логин
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // 3. Роль не подходит — на страницу 403 (или главную)
  if (allowedRoles && role && !allowedRoles.includes(role)) {
    return <Navigate to="/403" replace />
  }

  // 4. Всё ок
  return <>{children}</>
}
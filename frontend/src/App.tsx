import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { ObjectsPage } from './pages/ObjectsPage'
import { CreateObjectPage } from './pages/CreateObjectPage'
import { EditObjectPage } from './pages/EditObjectPage'
import { ForbiddenPage } from './pages/ForbiddenPage'

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/403" element={<ForbiddenPage />} />

      <Route
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/objects" element={<ObjectsPage />} />
        <Route
          path="/objects/new"
          element={
            <ProtectedRoute allowedRoles={['manager']}>
              <CreateObjectPage />
            </ProtectedRoute>
          }
        />
        <Route path="/objects/:id/edit" element={<EditObjectPage />} />
      </Route>

      <Route path="/" element={<Navigate to="/objects" replace />} />
      <Route path="*" element={<Navigate to="/objects" replace />} />
    </Routes>
  )
}
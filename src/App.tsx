import type { ReactNode } from 'react'
import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/auth/AuthProvider'
import { Layout } from '@/components/Layout'
import { Spinner } from '@/components/ui'
import { LoginPage } from '@/pages/LoginPage'
import { MonthPage } from '@/pages/MonthPage'
import { RecurrencesPage } from '@/pages/RecurrencesPage'

// Os gráficos são a parte mais pesada: só carregam quando a aba é aberta.
const ReportsPage = lazy(() => import('@/pages/ReportsPage').then((m) => ({ default: m.ReportsPage })))

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <Spinner aria-label="Carregando" />
  if (!user) return <Navigate to="/entrar" replace />
  return <>{children}</>
}

export function App() {
  return (
    <Routes>
      <Route path="/entrar" element={<LoginPage />} />
      <Route
        element={
          <Protected>
            <Layout />
          </Protected>
        }
      >
        <Route index element={<MonthPage />} />
        <Route path="fixos" element={<RecurrencesPage />} />
        <Route
          path="relatorios"
          element={
            <Suspense fallback={<Spinner />}>
              <ReportsPage />
            </Suspense>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

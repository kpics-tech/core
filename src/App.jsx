import { useState } from 'react'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import TodosPage from './pages/TodosPage'
import WorkloadPage from './pages/WorkloadPage'
import MembersPage from './pages/MembersPage'
import AgendasPage from './pages/AgendasPage'
import DecisionsPage from './pages/DecisionsPage'
import Nav from './components/Nav'

export default function App() {
  const { loading, session } = useAuth()
  const [page, setPage] = useState('dashboard')

  if (loading) {
    return (
      <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
        読み込み中…
      </div>
    )
  }

  if (!session) return <Login />

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100dvh' }}>
      <div style={{ flex: 1 }}>
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'agendas' && <AgendasPage />}
        {page === 'decisions' && <DecisionsPage />}
        {page === 'todos' && <TodosPage />}
        {page === 'workload' && <WorkloadPage />}
        {page === 'members' && <MembersPage />}
      </div>
      <Nav active={page} onChange={setPage} />
    </div>
  )
}

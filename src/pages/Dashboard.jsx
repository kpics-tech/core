import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'

export default function Dashboard({ onNavigate }) {
  const { logout } = useAuth()
  const [stats, setStats] = useState(null)

  useEffect(() => {
    async function load() {
      const { data: todos } = await supabase.from('todos').select('status, due_date')
      const active = (todos || []).filter((t) => t.status !== 'done')
      const overdue = active.filter((t) => t.due_date && new Date(t.due_date) < new Date(new Date().toDateString()))
      setStats({ active: active.length, overdue: overdue.length })
    }
    load()
  }, [])

  return (
    <div style={{ padding: '24px 20px 90px', maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--accent-2)', letterSpacing: '0.1em' }}>K-PICS</div>
          <h1 style={{ fontFamily: 'var(--font-display)', margin: '4px 0 0', fontSize: '24px' }}>Core</h1>
        </div>
        <button
          onClick={logout}
          style={{ background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer' }}
        >
          ログアウト
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '16px' }}>
        <button onClick={() => onNavigate('todos')} style={cardStyle}>
          <div style={cardNum}>{stats ? stats.active : '–'}</div>
          <div style={cardLabel}>進行中のToDo</div>
        </button>
        <button onClick={() => onNavigate('todos')} style={{ ...cardStyle, borderColor: stats?.overdue ? 'var(--danger)' : 'var(--border)' }}>
          <div style={{ ...cardNum, color: stats?.overdue ? 'var(--danger)' : 'var(--text)' }}>{stats ? stats.overdue : '–'}</div>
          <div style={cardLabel}>期限切れ</div>
        </button>
      </div>

      <button onClick={() => onNavigate('workload')} style={{ ...cardStyle, width: '100%', textAlign: 'left' }}>
        <div style={cardLabel}>負担バランスを見る →</div>
      </button>
    </div>
  )
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: '12px',
  padding: '16px',
  cursor: 'pointer',
  color: 'var(--text)',
}
const cardNum = { fontFamily: 'var(--font-display)', fontSize: '28px', fontWeight: 700 }
const cardLabel = { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }

import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { logout } = useAuth()

  return (
    <div style={{ padding: '24px', maxWidth: '640px', margin: '0 auto' }}>
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

      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '14px', padding: '20px', color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1.7 }}>
        ログインできました。ここから議題管理・会議管理・ToDoなどの機能を積み上げていきます。
      </div>
    </div>
  )
}

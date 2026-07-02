const TABS = [
  { key: 'dashboard', label: 'ホーム' },
  { key: 'agendas', label: '議題' },
  { key: 'decisions', label: '決定' },
  { key: 'todos', label: 'ToDo' },
  { key: 'workload', label: '負担' },
  { key: 'members', label: 'メンバー' },
]

export default function Nav({ active, onChange }) {
  return (
    <nav style={styles.nav}>
      {TABS.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onChange(tab.key)}
          style={{
            ...styles.tab,
            color: active === tab.key ? 'var(--accent)' : 'var(--text-muted)',
            borderTopColor: active === tab.key ? 'var(--accent)' : 'transparent',
          }}
        >
          {tab.label}
        </button>
      ))}
    </nav>
  )
}

const styles = {
  nav: {
    position: 'sticky',
    bottom: 0,
    display: 'flex',
    overflowX: 'auto',
    background: 'var(--surface)',
    borderTop: '1px solid var(--border)',
  },
  tab: {
    flex: '0 0 auto',
    minWidth: '64px',
    background: 'transparent',
    border: 'none',
    borderTop: '2px solid transparent',
    padding: '12px 10px 14px',
    fontSize: '12px',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  },
}

import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function MembersPage() {
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [role, setRole] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('members').select('*').order('created_at')
    setMembers(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addMember(e) {
    e.preventDefault()
    if (!name.trim()) return
    await supabase.from('members').insert({ name: name.trim(), role: role.trim() || null })
    setName('')
    setRole('')
    load()
  }

  async function removeMember(id) {
    if (!confirm('このメンバーを削除しますか?')) return
    await supabase.from('members').delete().eq('id', id)
    load()
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>メンバー</h1>

      <form onSubmit={addMember} style={styles.form}>
        <input
          placeholder="名前"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="役職(任意)"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          style={styles.input}
        />
        <button type="submit" style={styles.addBtn}>追加</button>
      </form>

      {loading ? (
        <p style={styles.muted}>読み込み中…</p>
      ) : members.length === 0 ? (
        <p style={styles.muted}>まだメンバーがいません。上のフォームから追加してください。</p>
      ) : (
        <ul style={styles.list}>
          {members.map((m) => (
            <li key={m.id} style={styles.item}>
              <div>
                <div style={styles.name}>{m.name}</div>
                {m.role && <div style={styles.role}>{m.role}</div>}
              </div>
              <button onClick={() => removeMember(m.id)} style={styles.removeBtn}>削除</button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const styles = {
  wrap: { padding: '20px 20px 90px', maxWidth: '640px', margin: '0 auto' },
  h1: { fontFamily: 'var(--font-display)', fontSize: '22px', margin: '0 0 16px' },
  form: { display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' },
  input: {
    flex: '1 1 120px',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '8px',
    padding: '10px 12px',
    color: 'var(--text)',
    fontSize: '14px',
  },
  addBtn: {
    background: 'var(--accent)',
    color: '#03181c',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 16px',
    fontWeight: 600,
    cursor: 'pointer',
  },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  item: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'var(--surface)',
    border: '1px solid var(--border)',
    borderRadius: '10px',
    padding: '12px 14px',
  },
  name: { fontSize: '15px', fontWeight: 500 },
  role: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' },
  removeBtn: {
    background: 'transparent',
    border: '1px solid var(--border)',
    color: 'var(--text-muted)',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '12px',
    cursor: 'pointer',
  },
}

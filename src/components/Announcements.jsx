import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function Announcements() {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [text, setText] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setItems(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function add(e) {
    e.preventDefault()
    if (!text.trim()) return
    await supabase.from('announcements').insert({ content: text.trim() })
    setText('')
    setShowForm(false)
    load()
  }

  async function remove(id) {
    await supabase.from('announcements').delete().eq('id', id)
    load()
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <div style={styles.h2}>📣 みんなへの共有事項</div>
        <button onClick={() => setShowForm((v) => !v)} style={styles.addBtn}>
          {showForm ? '閉じる' : '+ 追加'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={add} style={styles.form}>
          <input
            placeholder="例: 来週の飲み会は金曜19時から"
            value={text}
            onChange={(e) => setText(e.target.value)}
            style={styles.input}
            autoFocus
          />
          <button type="submit" style={styles.submitBtn}>共有する</button>
        </form>
      )}

      {!loading && items.length === 0 && !showForm && (
        <p style={styles.muted}>共有事項はありません。</p>
      )}

      {items.length > 0 && (
        <div style={styles.list}>
          {items.map((item) => (
            <div key={item.id} style={styles.item}>
              <div style={styles.itemText}>{item.content}</div>
              <button onClick={() => remove(item.id)} style={styles.doneBtn}>確認済み</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: { marginTop: '20px' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  h2: { fontSize: '14px', fontWeight: 600 },
  addBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 10px', fontSize: '12px', cursor: 'pointer',
  },
  form: { display: 'flex', gap: '8px', marginBottom: '12px' },
  input: {
    flex: 1, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', color: 'var(--text)', fontSize: '13px',
  },
  submitBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none', borderRadius: '8px',
    padding: '10px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  muted: { color: 'var(--text-muted)', fontSize: '13px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  item: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px',
  },
  itemText: { fontSize: '13px', lineHeight: 1.5 },
  doneBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
  },
}

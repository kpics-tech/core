import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)
  const [editId, setEditId] = useState(null)
  const [editText, setEditText] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase
      .from('decisions')
      .select('*, agenda:agendas(title), meeting:meetings(title, meeting_date)')
      .order('decided_at', { ascending: false })
    setDecisions(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function startEdit(d) {
    setEditId(d.id)
    setEditText(d.content)
  }

  async function saveEdit(id) {
    if (!editText.trim()) return
    await supabase.from('decisions').update({ content: editText.trim() }).eq('id', id)
    setEditId(null)
    load()
  }

  async function removeDecision(id) {
    if (!confirm('この決定事項を削除しますか?')) return
    await supabase.from('decisions').delete().eq('id', id)
    load()
  }

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>決定事項</h1>
      {loading ? (
        <p style={styles.muted}>読み込み中…</p>
      ) : decisions.length === 0 ? (
        <p style={styles.muted}>まだ決定事項はありません。</p>
      ) : (
        <div style={styles.list}>
          {decisions.map((d) => (
            <div key={d.id} style={styles.card}>
              {d.agenda?.title && <div style={styles.agendaTitle}>{d.agenda.title}</div>}
              {editId === d.id ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <textarea value={editText} onChange={(e) => setEditText(e.target.value)} style={styles.editInput} autoFocus />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => saveEdit(d.id)} style={styles.saveBtn}>保存</button>
                    <button onClick={() => setEditId(null)} style={styles.ghostBtn}>キャンセル</button>
                  </div>
                </div>
              ) : (
                <>
                  <div style={styles.content}>{d.content}</div>
                  <div style={styles.footerRow}>
                    <div style={styles.meta}>
                      {d.meeting?.title && `${d.meeting.title} ・ `}
                      {(d.meeting?.meeting_date || d.decided_at?.slice(0, 10))}
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => startEdit(d)} style={styles.editBtn}>編集</button>
                      <button onClick={() => removeDecision(d.id)} style={styles.editBtn}>削除</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: { padding: '20px 20px 90px', maxWidth: '640px', margin: '0 auto' },
  h1: { fontFamily: 'var(--font-display)', fontSize: '22px', margin: '0 0 16px' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' },
  agendaTitle: { fontSize: '12px', color: 'var(--accent-2)', marginBottom: '4px' },
  content: { fontSize: '14px', lineHeight: 1.6 },
  footerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' },
  meta: { fontSize: '12px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' },
  editInput: {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', color: 'var(--text)', fontSize: '13px', minHeight: '70px', resize: 'vertical',
  },
  saveBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none', borderRadius: '8px',
    padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  },
  ghostBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
  editBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer',
  },
}

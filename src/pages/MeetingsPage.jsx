import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function MeetingsPage({ onOpenMeeting }) {
  const [meetings, setMeetings] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('')

  async function load() {
    setLoading(true)
    const { data } = await supabase.from('meetings').select('*').order('meeting_date', { ascending: false })
    setMeetings(data || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function addMeeting(e) {
    e.preventDefault()
    if (!title.trim() || !date) return
    const { data } = await supabase.from('meetings').insert({ title: title.trim(), meeting_date: date }).select().single()
    setTitle(''); setDate(''); setShowForm(false)
    load()
    if (data) onOpenMeeting(data.id)
  }

  async function removeMeeting(id) {
    if (!confirm('この会議を削除しますか?(紐づく議題の状態は変わりません)')) return
    await supabase.from('meetings').delete().eq('id', id)
    load()
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>会議</h1>
        <button onClick={() => setShowForm((v) => !v)} style={styles.addBtn}>
          {showForm ? '閉じる' : '+ 新しい会議'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addMeeting} style={styles.form}>
          <input placeholder="会議のタイトル" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} autoFocus />
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={styles.input} />
          <button type="submit" style={styles.submitBtn}>作成して開く</button>
        </form>
      )}

      {loading ? (
        <p style={styles.muted}>読み込み中…</p>
      ) : meetings.length === 0 ? (
        <p style={styles.muted}>会議はまだありません。</p>
      ) : (
        <div style={styles.list}>
          {meetings.map((m) => (
            <div key={m.id} style={styles.card}>
              <button onClick={() => onOpenMeeting(m.id)} style={styles.cardMain}>
                <div style={styles.cardTitle}>{m.title}</div>
                <div style={styles.cardDate}>{m.meeting_date}</div>
              </button>
              <button onClick={() => removeMeeting(m.id)} style={styles.removeBtn}>削除</button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrap: { padding: '20px 20px 90px', maxWidth: '640px', margin: '0 auto' },
  headerRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
  h1: { fontFamily: 'var(--font-display)', fontSize: '22px', margin: 0 },
  addBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none', borderRadius: '8px',
    padding: '8px 14px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
  },
  form: {
    display: 'flex', flexDirection: 'column', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px',
    padding: '16px', marginBottom: '20px',
  },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', color: 'var(--text)', fontSize: '14px', width: '100%',
  },
  submitBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none', borderRadius: '8px',
    padding: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px',
  },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  card: {
    display: 'flex', alignItems: 'center', gap: '8px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px',
  },
  cardMain: { flex: 1, background: 'transparent', border: 'none', textAlign: 'left', padding: '14px', cursor: 'pointer', color: 'var(--text)' },
  cardTitle: { fontSize: '15px', fontWeight: 500 },
  cardDate: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px', fontFamily: 'var(--font-mono)' },
  removeBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', marginRight: '10px', flexShrink: 0,
  },
}

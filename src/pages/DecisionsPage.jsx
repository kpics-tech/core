import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function DecisionsPage() {
  const [decisions, setDecisions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const { data } = await supabase
        .from('decisions')
        .select('*, agenda:agendas(title), meeting:meetings(title, meeting_date)')
        .order('decided_at', { ascending: false })
      setDecisions(data || [])
      setLoading(false)
    }
    load()
  }, [])

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
              <div style={styles.content}>{d.content}</div>
              <div style={styles.meta}>
                {d.meeting?.title && `${d.meeting.title} ・ `}
                {(d.meeting?.meeting_date || d.decided_at?.slice(0, 10))}
              </div>
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
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', fontFamily: 'var(--font-mono)' },
}

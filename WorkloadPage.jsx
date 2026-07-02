import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

export default function WorkloadPage() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: members }, { data: todos }] = await Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('todos').select('assignee_id, status'),
      ])

      const counts = {}
      ;(members || []).forEach((m) => { counts[m.id] = { name: m.name, active: 0, done: 0 } })

      let unassigned = 0
      ;(todos || []).forEach((t) => {
        if (!t.assignee_id || !counts[t.assignee_id]) { if (t.status !== 'done') unassigned += 1; return }
        if (t.status === 'done') counts[t.assignee_id].done += 1
        else counts[t.assignee_id].active += 1
      })

      const list = Object.values(counts).sort((a, b) => b.active - a.active)
      setRows({ list, unassigned })
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={styles.wrap}><p style={styles.muted}>読み込み中…</p></div>

  const { list, unassigned } = rows
  const max = Math.max(1, ...list.map((r) => r.active))
  const avg = list.length ? list.reduce((s, r) => s + r.active, 0) / list.length : 0

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>負担バランス</h1>
      <p style={styles.sub}>各メンバーが今抱えている未完了ToDoの数です。</p>

      {list.length === 0 ? (
        <p style={styles.muted}>メンバーがまだ登録されていません。</p>
      ) : (
        <div style={styles.list}>
          {list.map((r) => {
            const overloaded = r.active >= avg + 2 && r.active > 2
            return (
              <div key={r.name} style={styles.row}>
                <div style={styles.rowHead}>
                  <span style={styles.name}>{r.name}</span>
                  <span style={{ ...styles.count, color: overloaded ? 'var(--danger)' : 'var(--text)' }}>
                    {r.active}件{overloaded ? ' ・ 偏り注意' : ''}
                  </span>
                </div>
                <div style={styles.barBg}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${(r.active / max) * 100}%`,
                      background: overloaded ? 'var(--danger)' : 'var(--accent)',
                    }}
                  />
                </div>
                <div style={styles.doneNote}>完了 {r.done}件</div>
              </div>
            )
          })}
        </div>
      )}

      {unassigned > 0 && (
        <p style={styles.unassigned}>担当者未定のToDoが {unassigned}件 あります</p>
      )}
    </div>
  )
}

const styles = {
  wrap: { padding: '20px 20px 90px', maxWidth: '640px', margin: '0 auto' },
  h1: { fontFamily: 'var(--font-display)', fontSize: '22px', margin: '0 0 4px' },
  sub: { color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 20px' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '14px' },
  row: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px',
  },
  rowHead: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' },
  name: { fontWeight: 500 },
  count: { fontFamily: 'var(--font-mono)', fontSize: '13px' },
  barBg: { height: '8px', borderRadius: '999px', background: 'var(--bg)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  doneNote: { marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' },
  unassigned: { marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' },
}

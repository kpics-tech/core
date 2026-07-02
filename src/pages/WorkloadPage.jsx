import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const PRIORITY_LABEL = { low: '低', normal: '中', high: '高' }
const STATUS_LABEL = { todo: '未着手', in_progress: '進行中', done: '完了' }

export default function WorkloadPage() {
  const [members, setMembers] = useState([])
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [openId, setOpenId] = useState(null)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const [{ data: m }, { data: t }] = await Promise.all([
        supabase.from('members').select('*').order('name'),
        supabase.from('todos').select('*'),
      ])
      setMembers(m || [])
      setTodos(t || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div style={styles.wrap}><p style={styles.muted}>読み込み中…</p></div>

  const rows = members.map((m) => {
    const mine = todos.filter((t) => t.assignee_id === m.id)
    return {
      id: m.id,
      name: m.name,
      active: mine.filter((t) => t.status !== 'done'),
      done: mine.filter((t) => t.status === 'done'),
    }
  }).sort((a, b) => b.active.length - a.active.length)

  const unassigned = todos.filter((t) => !t.assignee_id && t.status !== 'done')
  const max = Math.max(1, ...rows.map((r) => r.active.length))
  const avg = rows.length ? rows.reduce((s, r) => s + r.active.length, 0) / rows.length : 0

  return (
    <div style={styles.wrap}>
      <h1 style={styles.h1}>負担バランス</h1>
      <p style={styles.sub}>名前をタップすると、その人が抱えているToDoが見れます。</p>

      {rows.length === 0 ? (
        <p style={styles.muted}>メンバーがまだ登録されていません。</p>
      ) : (
        <div style={styles.list}>
          {rows.map((r) => {
            const overloaded = r.active.length >= avg + 2 && r.active.length > 2
            const isOpen = openId === r.id
            return (
              <div key={r.id} style={styles.row}>
                <button onClick={() => setOpenId(isOpen ? null : r.id)} style={styles.rowBtn}>
                  <div style={styles.rowHead}>
                    <span style={styles.name}>{r.name}</span>
                    <span style={{ ...styles.count, color: overloaded ? 'var(--danger)' : 'var(--text)' }}>
                      {r.active.length}件{overloaded ? ' ・ 偏り注意' : ''}
                    </span>
                  </div>
                  <div style={styles.barBg}>
                    <div
                      style={{
                        ...styles.barFill,
                        width: `${(r.active.length / max) * 100}%`,
                        background: overloaded ? 'var(--danger)' : 'var(--accent)',
                      }}
                    />
                  </div>
                  <div style={styles.doneNote}>完了 {r.done.length}件 ・ タップして詳細 {isOpen ? '▲' : '▼'}</div>
                </button>

                {isOpen && (
                  <div style={styles.detail}>
                    {r.active.length === 0 && r.done.length === 0 ? (
                      <p style={styles.muted}>ToDoはありません。</p>
                    ) : (
                      <>
                        {r.active.map((t) => (
                          <div key={t.id} style={styles.todoRow}>
                            <span>{t.status === 'in_progress' ? '🔵' : '⚪'}</span>
                            <div style={{ flex: 1 }}>
                              <div style={styles.todoTitle}>{t.title}</div>
                              <div style={styles.todoMeta}>
                                {STATUS_LABEL[t.status]} ・ 優先度{PRIORITY_LABEL[t.priority]}
                                {t.due_date && ` ・ 〆${t.due_date}`}
                              </div>
                            </div>
                          </div>
                        ))}
                        {r.done.map((t) => (
                          <div key={t.id} style={{ ...styles.todoRow, opacity: 0.5 }}>
                            <span>✅</span>
                            <div style={{ flex: 1 }}>
                              <div style={{ ...styles.todoTitle, textDecoration: 'line-through' }}>{t.title}</div>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {unassigned.length > 0 && (
        <p style={styles.unassigned}>担当者未定のToDoが {unassigned.length}件 あります</p>
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
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', overflow: 'hidden',
  },
  rowBtn: { width: '100%', textAlign: 'left', background: 'transparent', border: 'none', padding: '14px', cursor: 'pointer', color: 'var(--text)' },
  rowHead: { display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '14px' },
  name: { fontWeight: 500 },
  count: { fontFamily: 'var(--font-mono)', fontSize: '13px' },
  barBg: { height: '8px', borderRadius: '999px', background: 'var(--bg)', overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: '999px', transition: 'width 0.3s' },
  doneNote: { marginTop: '6px', fontSize: '11px', color: 'var(--text-muted)' },
  detail: {
    borderTop: '1px solid var(--border)', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '10px',
  },
  todoRow: { display: 'flex', alignItems: 'flex-start', gap: '8px' },
  todoTitle: { fontSize: '13px' },
  todoMeta: { fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' },
  unassigned: { marginTop: '20px', fontSize: '13px', color: 'var(--text-muted)' },
}

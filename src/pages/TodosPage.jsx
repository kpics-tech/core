import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const PRIORITY_LABEL = { low: '低', normal: '中', high: '高' }
const STATUS_LABEL = { todo: '未着手', in_progress: '進行中', done: '完了' }

export default function TodosPage() {
  const [todos, setTodos] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [priority, setPriority] = useState('normal')
  const [memo, setMemo] = useState('')

  async function load() {
    setLoading(true)
    const [{ data: t }, { data: m }] = await Promise.all([
      supabase.from('todos').select('*').order('due_date', { ascending: true, nullsFirst: false }),
      supabase.from('members').select('*').order('name'),
    ])
    setTodos(t || [])
    setMembers(m || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function memberName(id) {
    return members.find((m) => m.id === id)?.name || '未割り当て'
  }

  async function addTodo(e) {
    e.preventDefault()
    if (!title.trim()) return
    await supabase.from('todos').insert({
      title: title.trim(),
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      priority,
      memo: memo.trim() || null,
    })
    setTitle(''); setAssigneeId(''); setDueDate(''); setPriority('normal'); setMemo('')
    setShowForm(false)
    load()
  }

  async function cycleStatus(todo) {
    const next = todo.status === 'todo' ? 'in_progress' : todo.status === 'in_progress' ? 'done' : 'todo'
    await supabase.from('todos').update({ status: next }).eq('id', todo.id)
    load()
  }

  async function removeTodo(id) {
    if (!confirm('このToDoを削除しますか?')) return
    await supabase.from('todos').delete().eq('id', id)
    load()
  }

  const visible = todos.filter((t) => filterAssignee === 'all' || t.assignee_id === filterAssignee)
  const isOverdue = (t) => t.due_date && t.status !== 'done' && new Date(t.due_date) < new Date(new Date().toDateString())

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>ToDo</h1>
        <button onClick={() => setShowForm((v) => !v)} style={styles.addBtn}>
          {showForm ? '閉じる' : '+ 割り振る'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addTodo} style={styles.form}>
          <input placeholder="やること" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} autoFocus />
          <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={styles.input}>
            <option value="">担当者を選ぶ</option>
            {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
          <div style={{ display: 'flex', gap: '8px' }}>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ ...styles.input, flex: 1 }} />
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...styles.input, flex: 1 }}>
              <option value="low">優先度: 低</option>
              <option value="normal">優先度: 中</option>
              <option value="high">優先度: 高</option>
            </select>
          </div>
          <textarea placeholder="メモ(任意)" value={memo} onChange={(e) => setMemo(e.target.value)} style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} />
          <button type="submit" style={styles.submitBtn}>割り振る</button>
        </form>
      )}

      <div style={styles.filterRow}>
        <select value={filterAssignee} onChange={(e) => setFilterAssignee(e.target.value)} style={styles.filterSelect}>
          <option value="all">全員</option>
          {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {loading ? (
        <p style={styles.muted}>読み込み中…</p>
      ) : visible.length === 0 ? (
        <p style={styles.muted}>ToDoはまだありません。</p>
      ) : (
        <ul style={styles.list}>
          {visible.map((t) => (
            <li key={t.id} style={{ ...styles.item, opacity: t.status === 'done' ? 0.5 : 1 }}>
              <button onClick={() => cycleStatus(t)} style={styles.statusBtn}>
                {t.status === 'done' ? '✅' : t.status === 'in_progress' ? '🔵' : '⚪'}
              </button>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ ...styles.title, textDecoration: t.status === 'done' ? 'line-through' : 'none' }}>{t.title}</div>
                <div style={styles.meta}>
                  {memberName(t.assignee_id)}
                  {t.due_date && <span style={{ color: isOverdue(t) ? 'var(--danger)' : 'var(--text-muted)' }}> ・ 〆{t.due_date}</span>}
                  {' ・ '}優先度{PRIORITY_LABEL[t.priority]}
                  {' ・ '}{STATUS_LABEL[t.status]}
                </div>
              </div>
              <button onClick={() => removeTodo(t.id)} style={styles.removeBtn}>削除</button>
            </li>
          ))}
        </ul>
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
    padding: '16px', marginBottom: '16px',
  },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', color: 'var(--text)', fontSize: '14px', width: '100%',
  },
  submitBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none', borderRadius: '8px',
    padding: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px',
  },
  filterRow: { marginBottom: '12px' },
  filterSelect: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 12px', color: 'var(--text)', fontSize: '13px',
  },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  list: { listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' },
  item: {
    display: 'flex', alignItems: 'flex-start', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px',
  },
  statusBtn: { background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: 0 },
  title: { fontSize: '14px', fontWeight: 500 },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  removeBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0,
  },
}

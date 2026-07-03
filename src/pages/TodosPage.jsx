import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const PRIORITY_LABEL = { low: '低', normal: '中', high: '高' }

export default function TodosPage() {
  const [todos, setTodos] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterAssignee, setFilterAssignee] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [showCompleted, setShowCompleted] = useState(false)
  const [editId, setEditId] = useState(null)

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

  async function toggleInProgress(todo) {
    const next = todo.status === 'todo' ? 'in_progress' : 'todo'
    await supabase.from('todos').update({ status: next }).eq('id', todo.id)
    load()
  }

  async function markDone(todo) {
    await supabase.from('todos').update({ status: 'done' }).eq('id', todo.id)
    load()
  }

  async function reopen(todo) {
    await supabase.from('todos').update({ status: 'todo' }).eq('id', todo.id)
    load()
  }

  async function removeTodo(id) {
    if (!confirm('このToDoを削除しますか?')) return
    await supabase.from('todos').delete().eq('id', id)
    load()
  }

  const filtered = todos.filter((t) => filterAssignee === 'all' || t.assignee_id === filterAssignee)
  const active = filtered.filter((t) => t.status !== 'done')
  const completed = filtered.filter((t) => t.status === 'done')
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
          <div>
            <label style={styles.fieldLabel}>締切(任意)</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} style={{ ...styles.input, flex: 1 }} />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} style={{ ...styles.input, flex: 1 }}>
                <option value="low">優先度: 低</option>
                <option value="normal">優先度: 中</option>
                <option value="high">優先度: 高</option>
              </select>
            </div>
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
      ) : active.length === 0 ? (
        <p style={styles.muted}>未完了のToDoはありません。</p>
      ) : (
        <ul style={styles.list}>
          {active.map((t) => (
            editId === t.id ? (
              <EditTodoForm key={t.id} todo={t} members={members} onSaved={() => { load(); setEditId(null) }} onCancel={() => setEditId(null)} />
            ) : (
              <li key={t.id} style={styles.item}>
                <button onClick={() => toggleInProgress(t)} style={styles.statusBtn} title="進行中にする">
                  {t.status === 'in_progress' ? '🔵' : '⚪'}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.title}>{t.title}</div>
                  <div style={styles.meta}>
                    {memberName(t.assignee_id)}
                    {t.due_date && <span style={{ color: isOverdue(t) ? 'var(--danger)' : 'var(--text-muted)' }}> ・ 〆{t.due_date}</span>}
                    {' ・ '}優先度{PRIORITY_LABEL[t.priority]}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                  <button onClick={() => markDone(t)} style={styles.doneBtn}>✅ 完了</button>
                  <button onClick={() => setEditId(t.id)} style={styles.editBtn}>編集</button>
                  <button onClick={() => removeTodo(t.id)} style={styles.removeBtn}>削除</button>
                </div>
              </li>
            )
          ))}
        </ul>
      )}

      <div style={styles.completedSection}>
        <button onClick={() => setShowCompleted((v) => !v)} style={styles.completedToggle}>
          ✅ 完了済みToDo ({completed.length}) {showCompleted ? '▲' : '▼'}
        </button>
        {showCompleted && (
          completed.length === 0 ? (
            <p style={styles.muted}>まだありません。</p>
          ) : (
            <ul style={styles.list}>
              {completed.map((t) => (
                <li key={t.id} style={{ ...styles.item, opacity: 0.6 }}>
                  <span style={{ fontSize: '18px' }}>✅</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ ...styles.title, textDecoration: 'line-through' }}>{t.title}</div>
                    <div style={styles.meta}>{memberName(t.assignee_id)}</div>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    <button onClick={() => reopen(t)} style={styles.editBtn}>戻す</button>
                    <button onClick={() => removeTodo(t.id)} style={styles.removeBtn}>削除</button>
                  </div>
                </li>
              ))}
            </ul>
          )
        )}
      </div>
    </div>
  )
}

function EditTodoForm({ todo, members, onSaved, onCancel }) {
  const [title, setTitle] = useState(todo.title)
  const [assigneeId, setAssigneeId] = useState(todo.assignee_id || '')
  const [dueDate, setDueDate] = useState(todo.due_date || '')
  const [priority, setPriority] = useState(todo.priority)
  const [memo, setMemo] = useState(todo.memo || '')

  async function save(e) {
    e.preventDefault()
    if (!title.trim()) return
    await supabase.from('todos').update({
      title: title.trim(),
      assignee_id: assigneeId || null,
      due_date: dueDate || null,
      priority,
      memo: memo.trim() || null,
    }).eq('id', todo.id)
    onSaved()
  }

  return (
    <li style={styles.editCard}>
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} />
        <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={styles.input}>
          <option value="">担当者</option>
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
        <textarea value={memo} onChange={(e) => setMemo(e.target.value)} style={{ ...styles.input, minHeight: '50px' }} placeholder="メモ" />
        <div style={{ display: 'flex', gap: '8px' }}>
          <button type="submit" style={styles.submitBtn}>保存</button>
          <button type="button" onClick={onCancel} style={styles.ghostBtn}>キャンセル</button>
        </div>
      </form>
    </li>
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
  fieldLabel: { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' },
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
  editCard: {
    background: 'var(--surface)', border: '1px solid var(--accent)', borderRadius: '10px', padding: '14px',
  },
  statusBtn: { background: 'transparent', border: 'none', fontSize: '18px', cursor: 'pointer', lineHeight: 1, padding: 0 },
  title: { fontSize: '14px', fontWeight: 500 },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' },
  doneBtn: {
    background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0, whiteSpace: 'nowrap',
  },
  editBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0,
  },
  removeBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0,
  },
  ghostBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer',
  },
  completedSection: { marginTop: '24px', borderTop: '1px solid var(--border)', paddingTop: '16px' },
  completedToggle: {
    background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px',
    fontWeight: 600, cursor: 'pointer', padding: 0, marginBottom: '10px',
  },
}

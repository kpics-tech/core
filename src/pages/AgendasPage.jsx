import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AGENDA_STATUS, AGENDA_STATUS_META, PRIORITY_META } from '../lib/constants'

export default function AgendasPage() {
  const [agendas, setAgendas] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [proposerId, setProposerId] = useState('')
  const [assigneeId, setAssigneeId] = useState('')
  const [priority, setPriority] = useState('normal')
  const [estimatedMinutes, setEstimatedMinutes] = useState('')
  const [deadline, setDeadline] = useState('')
  const [tags, setTags] = useState('')
  const [isIdea, setIsIdea] = useState(false)

  async function load() {
    setLoading(true)
    const [{ data: a }, { data: m }] = await Promise.all([
      supabase.from('agendas').select('*').order('created_at', { ascending: false }),
      supabase.from('members').select('*').order('name'),
    ])
    setAgendas(a || [])
    setMembers(m || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function memberName(id) {
    return members.find((m) => m.id === id)?.name || '未設定'
  }

  async function addAgenda(e) {
    e.preventDefault()
    if (!title.trim()) return
    await supabase.from('agendas').insert({
      title: title.trim(),
      content: content.trim() || null,
      proposer_id: proposerId || null,
      assignee_id: assigneeId || null,
      status: isIdea ? 'idea' : 'undiscussed',
      priority,
      estimated_minutes: estimatedMinutes ? Number(estimatedMinutes) : null,
      discussion_deadline: deadline || null,
      tags: tags.trim() || null,
    })
    setTitle(''); setContent(''); setProposerId(''); setAssigneeId('')
    setPriority('normal'); setEstimatedMinutes(''); setDeadline(''); setTags(''); setIsIdea(false)
    setShowForm(false)
    load()
  }

  async function changeStatus(id, status) {
    await supabase.from('agendas').update({ status }).eq('id', id)
    load()
  }

  async function promoteIdea(id) {
    await changeStatus(id, 'undiscussed')
  }

  async function removeAgenda(id) {
    if (!confirm('この議題を削除しますか?')) return
    await supabase.from('agendas').delete().eq('id', id)
    load()
  }

  const grouped = AGENDA_STATUS.map((s) => ({
    status: s,
    items: agendas.filter((a) => a.status === s),
  })).filter((g) => g.items.length > 0)

  return (
    <div style={styles.wrap}>
      <div style={styles.headerRow}>
        <h1 style={styles.h1}>議題</h1>
        <button onClick={() => setShowForm((v) => !v)} style={styles.addBtn}>
          {showForm ? '閉じる' : '+ 新しい議題'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={addAgenda} style={styles.form}>
          <input placeholder="タイトル" value={title} onChange={(e) => setTitle(e.target.value)} style={styles.input} autoFocus />
          <textarea placeholder="内容(任意)" value={content} onChange={(e) => setContent(e.target.value)} style={{ ...styles.input, minHeight: '60px', resize: 'vertical' }} />
          <div style={styles.row2}>
            <select value={proposerId} onChange={(e) => setProposerId(e.target.value)} style={styles.input}>
              <option value="">提案者</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)} style={styles.input}>
              <option value="">担当者</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={styles.row2}>
            <select value={priority} onChange={(e) => setPriority(e.target.value)} style={styles.input}>
              <option value="low">優先度: 低</option>
              <option value="normal">優先度: 中</option>
              <option value="high">優先度: 高</option>
            </select>
            <select value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} style={styles.input}>
              <option value="">議論時間</option>
              <option value="5">5分</option>
              <option value="10">10分</option>
              <option value="15">15分</option>
              <option value="30">30分</option>
            </select>
          </div>
          <div style={styles.row2}>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={styles.input} />
            <input placeholder="タグ(例: 新歓, 会計)" value={tags} onChange={(e) => setTags(e.target.value)} style={styles.input} />
          </div>
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={isIdea} onChange={(e) => setIsIdea(e.target.checked)} />
            まだアイデア段階(議題にはしない)
          </label>
          <button type="submit" style={styles.submitBtn}>作成</button>
        </form>
      )}

      {loading ? (
        <p style={styles.muted}>読み込み中…</p>
      ) : grouped.length === 0 ? (
        <p style={styles.muted}>議題はまだありません。</p>
      ) : (
        grouped.map((g) => (
          <div key={g.status} style={{ marginBottom: '20px' }}>
            <div style={styles.groupHeader}>
              {AGENDA_STATUS_META[g.status].emoji} {AGENDA_STATUS_META[g.status].label}
              <span style={styles.groupCount}>{g.items.length}</span>
            </div>
            <div style={styles.list}>
              {g.items.map((a) => (
                <div key={a.id} style={styles.card}>
                  <div style={styles.cardTop}>
                    <div style={styles.cardTitle}>{a.title}</div>
                    <button onClick={() => removeAgenda(a.id)} style={styles.removeBtn}>削除</button>
                  </div>
                  {a.content && <div style={styles.cardContent}>{a.content}</div>}
                  <div style={styles.meta}>
                    提案: {memberName(a.proposer_id)}
                    {a.assignee_id && ` ・ 担当: ${memberName(a.assignee_id)}`}
                    {' ・ 優先度'}{PRIORITY_META[a.priority].label}
                    {a.estimated_minutes && ` ・ ${a.estimated_minutes}分`}
                    {a.discussion_deadline && ` ・ 〆${a.discussion_deadline}`}
                    {a.tags && ` ・ #${a.tags}`}
                  </div>
                  <div style={styles.statusRow}>
                    {a.status === 'idea' ? (
                      <button onClick={() => promoteIdea(a.id)} style={styles.promoteBtn}>議題に昇格 →</button>
                    ) : (
                      <select value={a.status} onChange={(e) => changeStatus(a.id, e.target.value)} style={styles.statusSelect}>
                        {AGENDA_STATUS.map((s) => (
                          <option key={s} value={s}>{AGENDA_STATUS_META[s].emoji} {AGENDA_STATUS_META[s].label}</option>
                        ))}
                      </select>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
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
  row2: { display: 'flex', gap: '8px' },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', color: 'var(--text)', fontSize: '14px', width: '100%', flex: 1,
  },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0' },
  submitBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none', borderRadius: '8px',
    padding: '10px', fontWeight: 600, cursor: 'pointer', marginTop: '4px',
  },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  groupHeader: {
    display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: 600,
    color: 'var(--text-muted)', marginBottom: '8px', letterSpacing: '0.02em',
  },
  groupCount: {
    fontFamily: 'var(--font-mono)', fontSize: '11px', background: 'var(--surface)',
    border: '1px solid var(--border)', borderRadius: '999px', padding: '1px 7px',
  },
  list: { display: 'flex', flexDirection: 'column', gap: '8px' },
  card: {
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px',
  },
  cardTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' },
  cardTitle: { fontSize: '15px', fontWeight: 500 },
  cardContent: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.6 },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 },
  statusRow: { marginTop: '10px' },
  statusSelect: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '6px 10px', color: 'var(--text)', fontSize: '13px',
  },
  promoteBtn: {
    background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)',
    borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
  },
  removeBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0,
  },
}

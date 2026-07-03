import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { AGENDA_STATUS, AGENDA_STATUS_META, PRIORITY_META } from '../lib/constants'

const PRIORITY_ORDER = { high: 0, normal: 1, low: 2 }

export default function AgendasPage() {
  const [agendas, setAgendas] = useState([])
  const [members, setMembers] = useState([])
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [openId, setOpenId] = useState(null)
  const [editId, setEditId] = useState(null)
  const [commentOpenId, setCommentOpenId] = useState(null)

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
    const [{ data: a }, { data: m }, { data: c }] = await Promise.all([
      supabase.from('agendas').select('*').neq('status', 'decided').order('created_at', { ascending: false }),
      supabase.from('members').select('*').order('name'),
      supabase.from('agenda_comments').select('*').order('created_at', { ascending: true }),
    ])
    setAgendas(a || [])
    setMembers(m || [])
    setComments(c || [])
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

  async function promoteIdea(id) {
    await supabase.from('agendas').update({ status: 'undiscussed' }).eq('id', id)
    load()
  }

  async function removeAgenda(id) {
    if (!confirm('この議題を削除しますか?')) return
    await supabase.from('agendas').delete().eq('id', id)
    load()
  }

  const grouped = AGENDA_STATUS
    .filter((s) => s !== 'decided')
    .map((s) => ({
      status: s,
      items: agendas
        .filter((a) => a.status === s)
        .sort((x, y) => PRIORITY_ORDER[x.priority] - PRIORITY_ORDER[y.priority]),
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
          <div>
            <label style={styles.fieldLabel}>話し合い期限(任意)</label>
            <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} style={styles.input} />
          </div>
          <input placeholder="タグ(例: 新歓, 会計)" value={tags} onChange={(e) => setTags(e.target.value)} style={styles.input} />
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
                <AgendaCard
                  key={a.id}
                  agenda={a}
                  members={members}
                  memberName={memberName}
                  comments={comments.filter((c) => c.agenda_id === a.id)}
                  isOpen={openId === a.id}
                  isEditing={editId === a.id}
                  commentsOpen={commentOpenId === a.id}
                  onToggle={() => setOpenId(openId === a.id ? null : a.id)}
                  onToggleEdit={() => setEditId(editId === a.id ? null : a.id)}
                  onToggleComments={() => setCommentOpenId(commentOpenId === a.id ? null : a.id)}
                  onPromoteIdea={() => promoteIdea(a.id)}
                  onRemove={() => removeAgenda(a.id)}
                  onChanged={() => { load(); setOpenId(null); setEditId(null) }}
                  onCommentAdded={load}
                />
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  )
}

function AgendaCard({ agenda: a, members, memberName, comments, isOpen, isEditing, commentsOpen, onToggle, onToggleEdit, onToggleComments, onPromoteIdea, onRemove, onChanged, onCommentAdded }) {
  const [discussion, setDiscussion] = useState('')
  const [alsoTodo, setAlsoTodo] = useState(false)
  const [todoAssignee, setTodoAssignee] = useState(a.assignee_id || '')
  const [todoDue, setTodoDue] = useState('')

  const [eTitle, setETitle] = useState(a.title)
  const [eContent, setEContent] = useState(a.content || '')
  const [eProposer, setEProposer] = useState(a.proposer_id || '')
  const [eAssignee, setEAssignee] = useState(a.assignee_id || '')
  const [ePriority, setEPriority] = useState(a.priority)
  const [eMinutes, setEMinutes] = useState(a.estimated_minutes || '')
  const [eDeadline, setEDeadline] = useState(a.discussion_deadline || '')
  const [eTags, setETags] = useState(a.tags || '')

  const [commentAuthor, setCommentAuthor] = useState('')
  const [commentText, setCommentText] = useState('')

  const canDiscuss = a.status !== 'idea' && a.status !== 'decided' && a.status !== 'rejected'

  async function decide(e) {
    e.preventDefault()
    const content = discussion.trim() || a.content || a.title
    const { data: decision } = await supabase
      .from('decisions')
      .insert({ agenda_id: a.id, content })
      .select().single()
    await supabase.from('agendas').update({ status: 'decided' }).eq('id', a.id)
    if (alsoTodo && decision) {
      await supabase.from('todos').insert({
        title: content,
        assignee_id: todoAssignee || null,
        due_date: todoDue || null,
        source_decision_id: decision.id,
      })
    }
    onChanged()
  }

  async function hold() {
    await supabase.from('agendas').update({ status: 'pending' }).eq('id', a.id)
    onChanged()
  }

  async function reject() {
    await supabase.from('agendas').update({ status: 'rejected' }).eq('id', a.id)
    onChanged()
  }

  async function saveEdit(e) {
    e.preventDefault()
    if (!eTitle.trim()) return
    await supabase.from('agendas').update({
      title: eTitle.trim(),
      content: eContent.trim() || null,
      proposer_id: eProposer || null,
      assignee_id: eAssignee || null,
      priority: ePriority,
      estimated_minutes: eMinutes ? Number(eMinutes) : null,
      discussion_deadline: eDeadline || null,
      tags: eTags.trim() || null,
    }).eq('id', a.id)
    onChanged()
  }

  async function addComment(e) {
    e.preventDefault()
    if (!commentText.trim()) return
    await supabase.from('agenda_comments').insert({
      agenda_id: a.id,
      author_id: commentAuthor || null,
      content: commentText.trim(),
    })
    setCommentText('')
    onCommentAdded()
  }

  if (isEditing) {
    return (
      <div style={styles.card}>
        <form onSubmit={saveEdit} style={styles.editForm}>
          <input value={eTitle} onChange={(e) => setETitle(e.target.value)} style={styles.input} />
          <textarea value={eContent} onChange={(e) => setEContent(e.target.value)} style={{ ...styles.input, minHeight: '60px' }} />
          <div style={styles.row2}>
            <select value={eProposer} onChange={(e) => setEProposer(e.target.value)} style={styles.input}>
              <option value="">提案者</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <select value={eAssignee} onChange={(e) => setEAssignee(e.target.value)} style={styles.input}>
              <option value="">担当者</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div style={styles.row2}>
            <select value={ePriority} onChange={(e) => setEPriority(e.target.value)} style={styles.input}>
              <option value="low">優先度: 低</option>
              <option value="normal">優先度: 中</option>
              <option value="high">優先度: 高</option>
            </select>
            <select value={eMinutes} onChange={(e) => setEMinutes(e.target.value)} style={styles.input}>
              <option value="">議論時間</option>
              <option value="5">5分</option>
              <option value="10">10分</option>
              <option value="15">15分</option>
              <option value="30">30分</option>
            </select>
          </div>
          <div>
            <label style={styles.fieldLabel}>話し合い期限(任意)</label>
            <input type="date" value={eDeadline} onChange={(e) => setEDeadline(e.target.value)} style={styles.input} />
          </div>
          <input value={eTags} onChange={(e) => setETags(e.target.value)} style={styles.input} placeholder="タグ" />
          <div style={styles.actionRow}>
            <button type="submit" style={styles.decideBtn}>保存</button>
            <button type="button" onClick={onToggleEdit} style={styles.ghostBtn}>キャンセル</button>
          </div>
        </form>
      </div>
    )
  }

  return (
    <div style={styles.card}>
      <button
        onClick={() => (canDiscuss ? onToggle() : null)}
        style={{ ...styles.cardTop, cursor: canDiscuss ? 'pointer' : 'default', background: 'transparent', border: 'none', width: '100%', textAlign: 'left', padding: 0 }}
      >
        <div style={{ flex: 1 }}>
          <div style={styles.cardTitle}>{a.title}</div>
          {a.content && <div style={styles.cardContent}>{a.content}</div>}
          <div style={styles.meta}>
            提案: {memberName(a.proposer_id)}
            {a.assignee_id && ` ・ 担当: ${memberName(a.assignee_id)}`}
            {' ・ 優先度'}{PRIORITY_META[a.priority].label}
            {a.estimated_minutes && ` ・ ${a.estimated_minutes}分`}
            {a.discussion_deadline && ` ・ 〆${a.discussion_deadline}`}
            {a.tags && ` ・ #${a.tags}`}
          </div>
        </div>
      </button>

      <div style={styles.cardFooter}>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {a.status === 'idea' ? (
            <button onClick={onPromoteIdea} style={styles.promoteBtn}>議題に昇格 →</button>
          ) : canDiscuss ? (
            <button onClick={onToggle} style={styles.discussBtn}>
              {isOpen ? '閉じる' : '💬 話し合った内容を記録する'}
            </button>
          ) : null}
          <button onClick={onToggleComments} style={styles.commentBtn}>
            🗨 意見 {comments.length > 0 ? `(${comments.length})` : ''}
          </button>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onToggleEdit} style={styles.ghostBtn}>編集</button>
          <button onClick={onRemove} style={styles.removeBtn}>削除</button>
        </div>
      </div>

      {isOpen && canDiscuss && (
        <form onSubmit={decide} style={styles.decideForm}>
          <textarea
            placeholder="何を話し合って、何が決まったか"
            value={discussion}
            onChange={(e) => setDiscussion(e.target.value)}
            style={styles.notesInput}
            autoFocus
          />
          <label style={styles.checkboxLabel}>
            <input type="checkbox" checked={alsoTodo} onChange={(e) => setAlsoTodo(e.target.checked)} />
            ToDoも同時に作る
          </label>
          {alsoTodo && (
            <div style={styles.row2}>
              <select value={todoAssignee} onChange={(e) => setTodoAssignee(e.target.value)} style={styles.smallInput}>
                <option value="">担当者</option>
                {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
              <input type="date" value={todoDue} onChange={(e) => setTodoDue(e.target.value)} style={styles.smallInput} />
            </div>
          )}
          <div style={styles.actionRow}>
            <button type="submit" style={styles.decideBtn}>✅ 決定事項にする</button>
            <button type="button" onClick={hold} style={styles.ghostBtn}>⏸ 保留</button>
            <button type="button" onClick={reject} style={styles.ghostBtnDanger}>❌ 却下</button>
          </div>
        </form>
      )}

      {commentsOpen && (
        <div style={styles.commentSection}>
          {comments.length === 0 ? (
            <p style={styles.muted}>まだ意見がありません。</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
              {comments.map((c) => (
                <div key={c.id} style={styles.commentItem}>
                  <div style={styles.commentAuthor}>{memberName(c.author_id)}</div>
                  <div style={styles.commentText}>{c.content}</div>
                </div>
              ))}
            </div>
          )}
          <form onSubmit={addComment} style={styles.row2}>
            <select value={commentAuthor} onChange={(e) => setCommentAuthor(e.target.value)} style={{ ...styles.smallInput, flex: '0 0 100px' }}>
              <option value="">名前</option>
              {members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
            <input
              placeholder="意見を書く"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              style={{ ...styles.smallInput, flex: 1 }}
            />
            <button type="submit" style={styles.decideBtn}>投稿</button>
          </form>
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
  editForm: { display: 'flex', flexDirection: 'column', gap: '8px' },
  fieldLabel: { display: 'block', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' },
  row2: { display: 'flex', gap: '8px' },
  input: {
    background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '10px 12px', color: 'var(--text)', fontSize: '14px', width: '100%', flex: 1,
  },
  smallInput: {
    flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 10px', color: 'var(--text)', fontSize: '13px',
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
  cardTitle: { fontSize: '15px', fontWeight: 500, color: 'var(--text)' },
  cardContent: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.6 },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6 },
  cardFooter: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginTop: '12px', gap: '8px', flexWrap: 'wrap' },
  discussBtn: {
    background: 'transparent', border: '1px solid var(--accent)', color: 'var(--accent)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
  commentBtn: {
    background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
  promoteBtn: {
    background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)',
    borderRadius: '8px', padding: '6px 12px', fontSize: '12px', cursor: 'pointer',
  },
  removeBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '5px 9px', fontSize: '11px', cursor: 'pointer', flexShrink: 0,
  },
  decideForm: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '8px' },
  commentSection: { marginTop: '12px', paddingTop: '12px', borderTop: '1px solid var(--border)' },
  commentItem: { background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 10px' },
  commentAuthor: { fontSize: '11px', color: 'var(--accent-2)', marginBottom: '2px' },
  commentText: { fontSize: '13px', lineHeight: 1.5 },
  notesInput: {
    width: '100%', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '13px', minHeight: '70px', resize: 'vertical',
  },
  actionRow: { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  decideBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none',
    borderRadius: '8px', padding: '8px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  },
  ghostBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
  ghostBtnDanger: {
    background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
}

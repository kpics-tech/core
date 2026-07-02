import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { PRIORITY_META } from '../lib/constants'

export default function MeetingDetailPage({ meetingId, onBack }) {
  const [meeting, setMeeting] = useState(null)
  const [items, setItems] = useState([]) // meeting_agendas + agenda joined
  const [candidates, setCandidates] = useState([])
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  async function load() {
    setLoading(true)
    const [{ data: mtg }, { data: mAgendas }, { data: allAgendas }, { data: m }] = await Promise.all([
      supabase.from('meetings').select('*').eq('id', meetingId).single(),
      supabase.from('meeting_agendas').select('*, agenda:agendas(*)').eq('meeting_id', meetingId).order('created_at'),
      supabase.from('agendas').select('*').in('status', ['undiscussed', 'scheduled', 'pending']),
      supabase.from('members').select('*').order('name'),
    ])
    setMeeting(mtg)
    setItems(mAgendas || [])
    const inMeetingIds = new Set((mAgendas || []).map((x) => x.agenda_id))
    const cand = (allAgendas || [])
      .filter((a) => !inMeetingIds.has(a.id))
      .sort((a, b) => {
        const dA = a.discussion_deadline || '9999-12-31'
        const dB = b.discussion_deadline || '9999-12-31'
        if (dA !== dB) return dA < dB ? -1 : 1
        const pOrder = { high: 0, normal: 1, low: 2 }
        return pOrder[a.priority] - pOrder[b.priority]
      })
    setCandidates(cand)
    setMembers(m || [])
    setLoading(false)
  }

  useEffect(() => { load() }, [meetingId])

  function memberName(id) {
    return members.find((x) => x.id === id)?.name || '未設定'
  }

  async function addToMeeting(agendaId) {
    await supabase.from('meeting_agendas').insert({ meeting_id: meetingId, agenda_id: agendaId })
    await supabase.from('agendas').update({ status: 'scheduled' }).eq('id', agendaId)
    load()
  }

  async function saveNotes(itemId, notes) {
    await supabase.from('meeting_agendas').update({ notes }).eq('id', itemId)
  }

  async function markDiscussing(agendaId) {
    await supabase.from('agendas').update({ status: 'discussing' }).eq('id', agendaId)
    load()
  }

  async function hold(item) {
    await supabase.from('agendas').update({ status: 'pending' }).eq('id', item.agenda_id)
    await supabase.from('meeting_agendas').update({ outcome: 'pending' }).eq('id', item.id)
    load()
  }

  async function reject(item) {
    await supabase.from('agendas').update({ status: 'rejected' }).eq('id', item.agenda_id)
    await supabase.from('meeting_agendas').update({ outcome: 'rejected' }).eq('id', item.id)
    load()
  }

  const totalMinutes = items.reduce((s, i) => s + (i.agenda?.estimated_minutes || 0), 0)

  if (loading || !meeting) return <div style={styles.wrap}><p style={styles.muted}>読み込み中…</p></div>

  return (
    <div style={styles.wrap}>
      <button onClick={onBack} style={styles.backBtn}>← 会議一覧</button>
      <h1 style={styles.h1}>{meeting.title}</h1>
      <div style={styles.sub}>{meeting.meeting_date} ・ 予定合計 {totalMinutes}分</div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>この会議の議題 ({items.length})</div>
        {items.length === 0 ? (
          <p style={styles.muted}>下の候補から議題を追加してください。</p>
        ) : (
          <div style={styles.list}>
            {items.map((item) => (
              <AgendaItem
                key={item.id}
                item={item}
                memberName={memberName}
                members={members}
                onSaveNotes={saveNotes}
                onMarkDiscussing={markDiscussing}
                onHold={hold}
                onReject={reject}
                onDecided={load}
                meetingId={meetingId}
              />
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <div style={styles.sectionHeader}>候補議題 ({candidates.length})</div>
        {candidates.length === 0 ? (
          <p style={styles.muted}>候補になる議題はありません。</p>
        ) : (
          <div style={styles.list}>
            {candidates.map((a) => (
              <div key={a.id} style={styles.candidateCard}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={styles.cardTitle}>{a.title}</div>
                  <div style={styles.meta}>
                    優先度{PRIORITY_META[a.priority].label}
                    {a.estimated_minutes && ` ・ ${a.estimated_minutes}分`}
                    {a.discussion_deadline && ` ・ 〆${a.discussion_deadline}`}
                  </div>
                </div>
                <button onClick={() => addToMeeting(a.id)} style={styles.addToMeetingBtn}>+ 追加</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function AgendaItem({ item, memberName, members, onSaveNotes, onMarkDiscussing, onHold, onReject, onDecided, meetingId }) {
  const a = item.agenda
  const [notes, setNotes] = useState(item.notes || '')
  const [showDecide, setShowDecide] = useState(false)
  const [decisionContent, setDecisionContent] = useState(a?.content || a?.title || '')
  const [alsoTodo, setAlsoTodo] = useState(true)
  const [todoAssignee, setTodoAssignee] = useState(a?.assignee_id || '')
  const [todoDue, setTodoDue] = useState('')

  if (!a) return null

  async function confirmDecision(e) {
    e.preventDefault()
    const { data: decision } = await supabase
      .from('decisions')
      .insert({ agenda_id: a.id, meeting_id: meetingId, content: decisionContent.trim() })
      .select().single()

    await supabase.from('agendas').update({ status: 'decided' }).eq('id', a.id)
    await supabase.from('meeting_agendas').update({ outcome: 'decided' }).eq('id', item.id)

    if (alsoTodo && decision) {
      await supabase.from('todos').insert({
        title: decisionContent.trim(),
        assignee_id: todoAssignee || null,
        due_date: todoDue || null,
        source_decision_id: decision.id,
      })
    }
    setShowDecide(false)
    onDecided()
  }

  return (
    <div style={styles.itemCard}>
      <div style={styles.cardTitle}>{a.title}</div>
      {a.content && <div style={styles.cardContent}>{a.content}</div>}
      <div style={styles.meta}>
        担当: {a.assignee_id ? memberName(a.assignee_id) : '未設定'}
        {a.estimated_minutes && ` ・ ${a.estimated_minutes}分`}
      </div>

      <textarea
        placeholder="議論メモ"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        onBlur={() => onSaveNotes(item.id, notes)}
        style={styles.notesInput}
      />

      {!showDecide ? (
        <div style={styles.actionRow}>
          <button onClick={() => onMarkDiscussing(a.id)} style={styles.ghostBtn}>💬 議論中にする</button>
          <button onClick={() => setShowDecide(true)} style={styles.decideBtn}>✅ 決定</button>
          <button onClick={() => onHold(item)} style={styles.ghostBtn}>⏸ 保留</button>
          <button onClick={() => onReject(item)} style={styles.ghostBtnDanger}>❌ 却下</button>
        </div>
      ) : (
        <form onSubmit={confirmDecision} style={styles.decideForm}>
          <textarea
            value={decisionContent}
            onChange={(e) => setDecisionContent(e.target.value)}
            style={styles.notesInput}
            placeholder="決定事項の内容"
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
            <button type="submit" style={styles.decideBtn}>確定</button>
            <button type="button" onClick={() => setShowDecide(false)} style={styles.ghostBtn}>キャンセル</button>
          </div>
        </form>
      )}
    </div>
  )
}

const styles = {
  wrap: { padding: '20px 20px 90px', maxWidth: '640px', margin: '0 auto' },
  backBtn: { background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '13px', cursor: 'pointer', padding: 0, marginBottom: '12px' },
  h1: { fontFamily: 'var(--font-display)', fontSize: '22px', margin: 0 },
  sub: { fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 20px', fontFamily: 'var(--font-mono)' },
  section: { marginBottom: '28px' },
  sectionHeader: { fontSize: '13px', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' },
  muted: { color: 'var(--text-muted)', fontSize: '14px' },
  list: { display: 'flex', flexDirection: 'column', gap: '10px' },
  itemCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '14px' },
  candidateCard: {
    display: 'flex', alignItems: 'center', gap: '10px',
    background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '12px 14px',
  },
  cardTitle: { fontSize: '15px', fontWeight: 500 },
  cardContent: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' },
  meta: { fontSize: '12px', color: 'var(--text-muted)', marginTop: '6px' },
  notesInput: {
    width: '100%', marginTop: '10px', background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: '8px', padding: '10px 12px', color: 'var(--text)', fontSize: '13px', minHeight: '50px', resize: 'vertical',
  },
  actionRow: { display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' },
  ghostBtn: {
    background: 'transparent', border: '1px solid var(--border)', color: 'var(--text-muted)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
  ghostBtnDanger: {
    background: 'transparent', border: '1px solid var(--danger)', color: 'var(--danger)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer',
  },
  decideBtn: {
    background: 'var(--accent)', color: '#03181c', border: 'none',
    borderRadius: '8px', padding: '7px 14px', fontSize: '12px', fontWeight: 600, cursor: 'pointer',
  },
  decideForm: { marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' },
  checkboxLabel: { display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-muted)' },
  row2: { display: 'flex', gap: '8px' },
  smallInput: {
    flex: 1, background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px',
    padding: '8px 10px', color: 'var(--text)', fontSize: '13px',
  },
  addToMeetingBtn: {
    background: 'transparent', border: '1px solid var(--accent-2)', color: 'var(--accent-2)',
    borderRadius: '8px', padding: '7px 12px', fontSize: '12px', cursor: 'pointer', flexShrink: 0,
  },
}

export const AGENDA_STATUS = ['idea', 'undiscussed', 'scheduled', 'discussing', 'pending', 'decided', 'rejected']

export const AGENDA_STATUS_META = {
  idea: { emoji: '💡', label: 'アイデア' },
  undiscussed: { emoji: '🟡', label: '未議論' },
  scheduled: { emoji: '📅', label: '次回会議予定' },
  discussing: { emoji: '💬', label: '議論中' },
  pending: { emoji: '⏸', label: '保留' },
  decided: { emoji: '✅', label: '決定' },
  rejected: { emoji: '❌', label: '却下' },
}

export const PRIORITY_META = {
  low: { label: '低' },
  normal: { label: '中' },
  high: { label: '高' },
}

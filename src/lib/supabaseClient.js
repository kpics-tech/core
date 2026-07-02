import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// 幹部共有アカウント用のダミーメール
// (合言葉ログインの裏側で使う。ユーザーには見せない)
export const SHARED_ACCOUNT_EMAIL = 'kpics-core@internal.local'

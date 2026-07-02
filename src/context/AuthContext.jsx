import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, SHARED_ACCOUNT_EMAIL } from '../lib/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined) // undefined = 確認中, null = 未ログイン
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  async function loginWithPassphrase(passphrase) {
    setError(null)
    const { data, error } = await supabase.auth.signInWithPassword({
      email: SHARED_ACCOUNT_EMAIL,
      password: passphrase,
    })
    if (error) {
      setError('合言葉が違います')
      return false
    }
    setSession(data.session)
    return true
  }

  async function logout() {
    await supabase.auth.signOut()
    setSession(null)
  }

  return (
    <AuthContext.Provider value={{ session, loading: session === undefined, error, loginWithPassphrase, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}

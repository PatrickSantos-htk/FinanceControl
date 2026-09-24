import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { isLocalMode, supabase } from '@/lib/supabase'

interface AuthUser {
  id: string
  email: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** dados salvos só neste navegador (sem conta) */
  local: boolean
  signIn(email: string, password: string): Promise<void>
  signUp(email: string, password: string): Promise<{ needsConfirmation: boolean }>
  resetPassword(email: string): Promise<void>
  signOut(): Promise<void>
  /** true quando o usuário chegou pelo link de redefinir senha */
  recovering: boolean
  updatePassword(password: string): Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const LOCAL_USER: AuthUser = { id: 'local', email: 'neste aparelho' }

function translate(message: string): string {
  const m = message.toLowerCase()
  if (m.includes('invalid login')) return 'E-mail ou senha incorretos.'
  if (m.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar (veja sua caixa de entrada).'
  if (m.includes('already registered')) return 'Este e-mail já tem conta. Tente entrar.'
  if (m.includes('password should be')) return 'A senha precisa ter pelo menos 6 caracteres.'
  if (m.includes('rate limit')) return 'Muitas tentativas. Aguarde um pouco e tente de novo.'
  return message
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(!isLocalMode)
  const [recovering, setRecovering] = useState(false)

  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data } = supabase.auth.onAuthStateChange((event, s) => {
      setSession(s)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  const value = useMemo<AuthContextValue>(() => {
    const user: AuthUser | null = isLocalMode
      ? LOCAL_USER
      : session
        ? { id: session.user.id, email: session.user.email ?? '' }
        : null

    return {
      user,
      loading,
      local: isLocalMode,
      async signIn(email, password) {
        const { error } = await supabase!.auth.signInWithPassword({ email, password })
        if (error) throw new Error(translate(error.message))
      },
      async signUp(email, password) {
        const { data, error } = await supabase!.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        })
        if (error) throw new Error(translate(error.message))
        return { needsConfirmation: !data.session }
      },
      async resetPassword(email) {
        const { error } = await supabase!.auth.resetPasswordForEmail(email, {
          redirectTo: window.location.origin,
        })
        if (error) throw new Error(translate(error.message))
      },
      async signOut() {
        if (supabase) await supabase.auth.signOut()
      },
      recovering,
      async updatePassword(password) {
        const { error } = await supabase!.auth.updateUser({ password })
        if (error) throw new Error(translate(error.message))
        setRecovering(false)
      },
    }
  }, [session, loading, recovering])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth precisa estar dentro de <AuthProvider>')
  return ctx
}

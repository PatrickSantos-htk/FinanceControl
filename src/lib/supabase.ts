import { createClient, type SupabaseClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

/** Sem as variáveis do Supabase o app salva tudo no próprio navegador (localStorage). */
export const isLocalMode = !url || !anonKey

export const supabase: SupabaseClient | null = isLocalMode
  ? null
  : createClient(url!, anonKey!, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })

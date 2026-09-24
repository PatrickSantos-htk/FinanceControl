import { isDemoMode, supabase } from '@/lib/supabase'
import { createLocalApi } from './localApi'
import { createSupabaseApi } from './supabaseApi'
import { buildOccurrence, pendingMonths } from '@/domain/recurrence'
import { monthStart } from '@/domain/month'
import type { MonthKey } from '@/domain/types'

export const api = isDemoMode ? createLocalApi() : createSupabaseApi(supabase!)

/**
 * Lança automaticamente os gastos/ganhos fixos até o mês informado
 * (normalmente o mês atual). Seguro para rodar várias vezes.
 */
export async function syncRecurrences(until: MonthKey): Promise<number> {
  const recs = await api.listRecurrences()
  let created = 0
  for (const rec of recs) {
    const months = pendingMonths(rec, until)
    if (!months.length) continue
    created += await api.insertOccurrences(months.map((m) => buildOccurrence(rec, m)))
    await api.updateRecurrence(rec.id, { last_generated_month: monthStart(months[months.length - 1]) })
  }
  return created
}

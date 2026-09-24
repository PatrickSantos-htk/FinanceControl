import type { SupabaseClient } from '@supabase/supabase-js'
import type { Recurrence, Transaction } from '@/domain/types'
import type { DataApi } from './api'

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message)
}

const toTx = (r: Transaction): Transaction => ({ ...r, amount: Number(r.amount) })
const toRec = (r: Recurrence): Recurrence => ({ ...r, amount: Number(r.amount) })

export function createSupabaseApi(db: SupabaseClient): DataApi {
  return {
    async listTransactions(from, to) {
      const { data, error } = await db
        .from('transactions')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
      fail(error)
      return (data as Transaction[]).map(toTx)
    },
    async createTransaction(input) {
      const { data, error } = await db.from('transactions').insert(input).select().single()
      fail(error)
      return toTx(data as Transaction)
    },
    async updateTransaction(id, patch) {
      const { data, error } = await db
        .from('transactions')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      fail(error)
      return toTx(data as Transaction)
    },
    async deleteTransaction(id) {
      const { error } = await db.from('transactions').delete().eq('id', id)
      fail(error)
    },
    async insertOccurrences(rows) {
      if (!rows.length) return 0
      const { data, error } = await db
        .from('transactions')
        .upsert(rows, { onConflict: 'recurrence_id,ref_month', ignoreDuplicates: true })
        .select('id')
      fail(error)
      return data?.length ?? 0
    },

    async listRecurrences() {
      const { data, error } = await db
        .from('recurrences')
        .select('*')
        .order('type', { ascending: true })
        .order('day_of_month', { ascending: true })
      fail(error)
      return (data as Recurrence[]).map(toRec)
    },
    async createRecurrence(input) {
      const { data, error } = await db.from('recurrences').insert(input).select().single()
      fail(error)
      return toRec(data as Recurrence)
    },
    async updateRecurrence(id, patch) {
      const { data, error } = await db
        .from('recurrences')
        .update(patch)
        .eq('id', id)
        .select()
        .single()
      fail(error)
      return toRec(data as Recurrence)
    },
    async deleteRecurrence(id) {
      const { error } = await db.from('recurrences').delete().eq('id', id)
      fail(error)
    },
  }
}

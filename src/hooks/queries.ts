import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, syncRecurrences } from '@/data'
import { addMonths, currentMonth, monthEnd, monthStart } from '@/domain/month'
import type {
  MonthKey,
  Recurrence,
  RecurrenceInput,
  TransactionInput,
  TxType,
} from '@/domain/types'

export const keys = {
  tx: ['transactions'] as const,
  txRange: (from: string, to: string) => ['transactions', from, to] as const,
  rec: ['recurrences'] as const,
  sync: ['sync-recurrences'] as const,
}

/** Garante que os fixos do mês atual já foram lançados antes de listar. */
export function useRecurrenceSync() {
  const qc = useQueryClient()
  return useQuery({
    queryKey: keys.sync,
    queryFn: async () => {
      const created = await syncRecurrences(currentMonth())
      if (created) await qc.invalidateQueries({ queryKey: keys.tx })
      return created
    },
    staleTime: 1000 * 60 * 30,
    retry: 1,
  })
}

export function useMonthTransactions(month: MonthKey) {
  const from = monthStart(month)
  const to = monthEnd(month)
  return useQuery({
    queryKey: keys.txRange(from, to),
    queryFn: () => api.listTransactions(from, to),
  })
}

export function useRangeTransactions(fromMonth: MonthKey, toMonth: MonthKey) {
  const from = monthStart(fromMonth)
  const to = monthEnd(toMonth)
  return useQuery({
    queryKey: keys.txRange(from, to),
    queryFn: () => api.listTransactions(from, to),
  })
}

/** Últimos 6 meses de lançamentos, usados para sugerir categorias já usadas. */
export function useRecentCategories(type: TxType): string[] {
  const to = currentMonth()
  const q = useRangeTransactions(addMonths(to, -5), to)
  return [...new Set((q.data ?? []).filter((t) => t.type === type).map((t) => t.category))]
}

export function useRecurrences() {
  return useQuery({ queryKey: keys.rec, queryFn: () => api.listRecurrences() })
}

export function useTransactionMutations() {
  const qc = useQueryClient()
  const done = () => qc.invalidateQueries({ queryKey: keys.tx })
  return {
    create: useMutation({
      mutationFn: (input: TransactionInput) => api.createTransaction(input),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({ id, patch }: { id: string; patch: Partial<TransactionInput> }) =>
        api.updateTransaction(id, patch),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.deleteTransaction(id),
      onSuccess: done,
    }),
  }
}

export function useRecurrenceMutations() {
  const qc = useQueryClient()
  const done = async () => {
    await syncRecurrences(currentMonth())
    await Promise.all([
      qc.invalidateQueries({ queryKey: keys.rec }),
      qc.invalidateQueries({ queryKey: keys.tx }),
    ])
  }
  return {
    create: useMutation({
      mutationFn: (input: RecurrenceInput) => api.createRecurrence(input),
      onSuccess: done,
    }),
    update: useMutation({
      mutationFn: ({
        id,
        patch,
      }: {
        id: string
        patch: Partial<RecurrenceInput & Pick<Recurrence, 'last_generated_month'>>
      }) => api.updateRecurrence(id, patch),
      onSuccess: done,
    }),
    remove: useMutation({
      mutationFn: (id: string) => api.deleteRecurrence(id),
      onSuccess: done,
    }),
  }
}

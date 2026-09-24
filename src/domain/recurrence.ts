import { addMonths, dateInMonth, monthOf, monthStart, monthsBetween } from './month'
import type { ListItem, MonthKey, Recurrence, Transaction, TransactionInput } from './types'

export function recurrenceCovers(rec: Recurrence, month: MonthKey): boolean {
  if (!rec.active) return false
  if (month < monthOf(rec.start_month)) return false
  if (rec.end_month && month > monthOf(rec.end_month)) return false
  return true
}

/**
 * Meses que ainda precisam ser lançados para um gasto fixo, até `until`.
 * Começa depois do último mês já gerado, para que um lançamento apagado
 * pelo usuário não volte a aparecer.
 */
export function pendingMonths(rec: Recurrence, until: MonthKey): MonthKey[] {
  if (!rec.active) return []
  const start = monthOf(rec.start_month)
  const from = rec.last_generated_month
    ? addMonths(monthOf(rec.last_generated_month), 1)
    : start
  const first = from > start ? from : start
  const endLimit = rec.end_month && monthOf(rec.end_month) < until ? monthOf(rec.end_month) : until
  if (first > endLimit) return []
  return monthsBetween(first, endLimit)
}

export function buildOccurrence(rec: Recurrence, month: MonthKey): TransactionInput {
  return {
    description: rec.description,
    type: rec.type,
    category: rec.category,
    amount: rec.amount,
    date: dateInMonth(month, rec.day_of_month),
    paid: false,
    recurrence_id: rec.id,
    ref_month: monthStart(month),
    notes: null,
  }
}

/** Gastos fixos previstos para um mês futuro que ainda não foram lançados. */
export function projectedItems(
  recs: Recurrence[],
  month: MonthKey,
  existing: Transaction[],
): ListItem[] {
  const already = new Set(
    existing.filter((t) => t.recurrence_id).map((t) => `${t.recurrence_id}|${t.ref_month}`),
  )
  return recs
    .filter((r) => recurrenceCovers(r, month))
    .filter((r) => !already.has(`${r.id}|${monthStart(month)}`))
    .map((r) => ({
      ...buildOccurrence(r, month),
      id: `proj-${r.id}-${month}`,
      recurrence_id: r.id,
      ref_month: monthStart(month),
      notes: null,
      created_at: '',
      projected: true,
    }))
}

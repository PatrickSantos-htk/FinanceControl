import { categoryColor } from './categories'
import { sum } from './money'
import { monthOf } from './month'
import type { MonthKey, Transaction } from './types'

export interface MonthSummary {
  income: number
  outcome: number
  balance: number
  incomePending: number
  outcomePending: number
  /** saldo considerando só o que já foi pago/recebido */
  realizedBalance: number
}

export function summarize(items: Transaction[]): MonthSummary {
  const inc = items.filter((t) => t.type === 'income')
  const out = items.filter((t) => t.type === 'outcome')
  const income = sum(inc.map((t) => t.amount))
  const outcome = sum(out.map((t) => t.amount))
  const incomePending = sum(inc.filter((t) => !t.paid).map((t) => t.amount))
  const outcomePending = sum(out.filter((t) => !t.paid).map((t) => t.amount))
  return {
    income,
    outcome,
    balance: sum([income, -outcome]),
    incomePending,
    outcomePending,
    realizedBalance: sum([income - incomePending, -(outcome - outcomePending)]),
  }
}

export interface CategorySlice {
  name: string
  value: number
  percent: number
  color: string
}

export function byCategory(items: Transaction[], type: 'income' | 'outcome'): CategorySlice[] {
  const map = new Map<string, number>()
  for (const t of items) {
    if (t.type !== type) continue
    map.set(t.category, (map.get(t.category) ?? 0) + Math.round(t.amount * 100))
  }
  const total = [...map.values()].reduce((a, b) => a + b, 0)
  return [...map.entries()]
    .map(([name, cents]) => ({
      name,
      value: cents / 100,
      percent: total ? (cents / total) * 100 : 0,
      color: categoryColor(name),
    }))
    .sort((a, b) => b.value - a.value)
}

export interface MonthPoint {
  month: MonthKey
  income: number
  outcome: number
  balance: number
}

export function byMonth(items: Transaction[], months: MonthKey[]): MonthPoint[] {
  return months.map((month) => {
    const s = summarize(items.filter((t) => monthOf(t.date) === month))
    return { month, income: s.income, outcome: s.outcome, balance: s.balance }
  })
}

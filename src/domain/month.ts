import type { MonthKey } from './types'

const pad = (n: number) => String(n).padStart(2, '0')

export function toMonthKey(d: Date): MonthKey {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`
}

export function currentMonth(): MonthKey {
  return toMonthKey(new Date())
}

export function todayISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function isMonthKey(v: string | null | undefined): v is MonthKey {
  return !!v && /^\d{4}-(0[1-9]|1[0-2])$/.test(v)
}

export function parseMonth(key: MonthKey): { year: number; month: number } {
  const [y, m] = key.split('-').map(Number)
  return { year: y, month: m }
}

export function addMonths(key: MonthKey, n: number): MonthKey {
  const { year, month } = parseMonth(key)
  const d = new Date(year, month - 1 + n, 1)
  return toMonthKey(d)
}

export function daysInMonth(key: MonthKey): number {
  const { year, month } = parseMonth(key)
  return new Date(year, month, 0).getDate()
}

export function monthStart(key: MonthKey): string {
  return `${key}-01`
}

export function monthEnd(key: MonthKey): string {
  return `${key}-${pad(daysInMonth(key))}`
}

export function monthOf(isoDate: string): MonthKey {
  return isoDate.slice(0, 7)
}

/** Dia do mês limitado ao último dia (ex.: dia 31 em fevereiro vira 28/29). */
export function dateInMonth(key: MonthKey, day: number): string {
  return `${key}-${pad(Math.min(Math.max(day, 1), daysInMonth(key)))}`
}

/** Lista de meses de `from` até `to` (inclusive). */
export function monthsBetween(from: MonthKey, to: MonthKey): MonthKey[] {
  const out: MonthKey[] = []
  let cur = from
  while (cur <= to && out.length < 600) {
    out.push(cur)
    cur = addMonths(cur, 1)
  }
  return out
}

const monthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric' })
const shortMonthFmt = new Intl.DateTimeFormat('pt-BR', { month: 'short' })
const dayFmt = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', day: '2-digit', month: 'short' })

function localDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d || 1)
}

export function monthLabel(key: MonthKey): string {
  const s = monthFmt.format(localDate(monthStart(key)))
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function shortMonthLabel(key: MonthKey): string {
  const { year } = parseMonth(key)
  const m = shortMonthFmt.format(localDate(monthStart(key))).replace('.', '')
  return `${m}/${String(year).slice(2)}`
}

export function dayLabel(iso: string): string {
  const s = dayFmt.format(localDate(iso)).replace(/\./g, '')
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDateBR(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}

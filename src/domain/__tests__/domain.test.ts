import { describe, expect, it } from 'vitest'
import { formatMoney, parseMoney, sum } from '../money'
import { addMonths, dateInMonth, monthsBetween } from '../month'
import { buildOccurrence, pendingMonths, projectedItems } from '../recurrence'
import { summarize } from '../summary'
import { transactionsToCSV } from '../csv'
import type { Recurrence, Transaction } from '../types'

const rec = (over: Partial<Recurrence> = {}): Recurrence => ({
  id: 'r1',
  description: 'Aluguel',
  type: 'outcome',
  category: 'Moradia',
  amount: 1100,
  day_of_month: 31,
  start_month: '2026-01-01',
  end_month: null,
  active: true,
  last_generated_month: null,
  created_at: '',
  ...over,
})

const tx = (over: Partial<Transaction>): Transaction => ({
  id: Math.random().toString(),
  description: 'x',
  type: 'outcome',
  category: 'Outros',
  amount: 10,
  date: '2026-09-10',
  paid: true,
  recurrence_id: null,
  ref_month: null,
  notes: null,
  created_at: '',
  ...over,
})

describe('dinheiro', () => {
  it('entende valores digitados no formato brasileiro', () => {
    expect(parseMoney('1.234,56')).toBe(1234.56)
    expect(parseMoney('49,9')).toBe(49.9)
    expect(parseMoney('R$ 10')).toBe(10)
    expect(parseMoney('12.5')).toBe(12.5)
    expect(parseMoney('abc')).toBeNaN()
    expect(parseMoney('')).toBeNaN()
  })

  it('soma sem erro de ponto flutuante', () => {
    expect(sum([0.1, 0.2])).toBe(0.3)
    expect(formatMoney(1234.5)).toMatch(/1\.234,50/)
  })
})

describe('meses', () => {
  it('navega entre anos', () => {
    expect(addMonths('2026-12', 1)).toBe('2027-01')
    expect(addMonths('2026-01', -1)).toBe('2025-12')
    expect(monthsBetween('2026-11', '2027-02')).toEqual(['2026-11', '2026-12', '2027-01', '2027-02'])
  })

  it('ajusta o dia 31 para o último dia do mês', () => {
    expect(dateInMonth('2026-02', 31)).toBe('2026-02-28')
    expect(dateInMonth('2028-02', 31)).toBe('2028-02-29')
    expect(dateInMonth('2026-04', 31)).toBe('2026-04-30')
  })
})

describe('gastos fixos', () => {
  it('lança do início até o mês atual', () => {
    expect(pendingMonths(rec(), '2026-03')).toEqual(['2026-01', '2026-02', '2026-03'])
  })

  it('não relança meses já gerados (lançamento apagado não volta)', () => {
    expect(pendingMonths(rec({ last_generated_month: '2026-03-01' }), '2026-03')).toEqual([])
    expect(pendingMonths(rec({ last_generated_month: '2026-02-01' }), '2026-04')).toEqual(['2026-03', '2026-04'])
  })

  it('respeita pausa e data de término', () => {
    expect(pendingMonths(rec({ active: false }), '2026-05')).toEqual([])
    expect(pendingMonths(rec({ end_month: '2026-02-01' }), '2026-05')).toEqual(['2026-01', '2026-02'])
    expect(pendingMonths(rec({ start_month: '2026-10-01' }), '2026-09')).toEqual([])
  })

  it('gera o lançamento pendente com o mês de referência', () => {
    const o = buildOccurrence(rec(), '2026-02')
    expect(o).toMatchObject({ date: '2026-02-28', paid: false, recurrence_id: 'r1', ref_month: '2026-02-01' })
  })

  it('mostra como previsto em mês futuro só o que ainda não foi lançado', () => {
    const r2 = rec({ id: 'r2', description: 'Internet', day_of_month: 15 })
    const existing = [tx({ recurrence_id: 'r1', ref_month: '2026-12-01', date: '2026-12-31' })]
    const proj = projectedItems([rec(), r2], '2026-12', existing)
    expect(proj.map((p) => p.description)).toEqual(['Internet'])
    expect(proj[0].projected).toBe(true)
  })
})

describe('resumo e exportação', () => {
  const items = [
    tx({ type: 'income', amount: 3000, paid: true }),
    tx({ type: 'income', amount: 500, paid: false }),
    tx({ type: 'outcome', amount: 1100, paid: true }),
    tx({ type: 'outcome', amount: 99.9, paid: false }),
  ]

  it('calcula saldo previsto e realizado', () => {
    const s = summarize(items)
    expect(s.income).toBe(3500)
    expect(s.outcome).toBe(1199.9)
    expect(s.balance).toBe(2300.1)
    expect(s.incomePending).toBe(500)
    expect(s.outcomePending).toBe(99.9)
    expect(s.realizedBalance).toBe(1900)
  })

  it('gera CSV no padrão do Excel em português', () => {
    const csv = transactionsToCSV([tx({ description: 'Mercado; feira', amount: 45.5 })])
    expect(csv.startsWith('﻿Data;Descrição')).toBe(true)
    expect(csv).toContain('10/09/2026;"Mercado; feira";Saída;Outros;-45,50;Pago;Não')
  })
})

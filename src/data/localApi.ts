import { newId } from '@/lib/id'
import { addMonths, currentMonth, dateInMonth, monthStart } from '@/domain/month'
import type { Recurrence, Transaction, TransactionInput } from '@/domain/types'
import type { DataApi } from './api'

const TX_KEY = 'fc:demo:transactions'
const REC_KEY = 'fc:demo:recurrences'

function read<T>(key: string): T[] {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '[]') as T[]
  } catch {
    return []
  }
}

function write<T>(key: string, value: T[]) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* armazenamento indisponível: segue só em memória */
  }
}

const now = () => new Date().toISOString()

function tx(input: TransactionInput): Transaction {
  return {
    recurrence_id: null,
    ref_month: null,
    notes: null,
    ...input,
    id: newId(),
    created_at: now(),
  }
}

/** Dados de exemplo para quem abre o app sem configurar o Supabase. */
function seed() {
  const m0 = currentMonth()
  const months = [addMonths(m0, -2), addMonths(m0, -1), m0]
  const recs: Recurrence[] = [
    ['Salário', 'income', 'Salário', 3200, 5],
    ['Aluguel', 'outcome', 'Moradia', 1100, 10],
    ['Internet', 'outcome', 'Contas da casa', 99.9, 15],
    ['Academia', 'outcome', 'Lazer', 89.9, 8],
    ['Streaming', 'outcome', 'Assinaturas', 39.9, 20],
  ].map(([description, type, category, amount, day]) => ({
    id: newId(),
    description: description as string,
    type: type as Recurrence['type'],
    category: category as string,
    amount: amount as number,
    day_of_month: day as number,
    start_month: monthStart(months[0]),
    end_month: null,
    active: true,
    last_generated_month: monthStart(m0),
    created_at: now(),
  }))

  const txs: Transaction[] = []
  const today = new Date().getDate()
  months.forEach((m, i) => {
    const isCurrent = i === months.length - 1
    for (const r of recs) {
      txs.push(
        tx({
          description: r.description,
          type: r.type,
          category: r.category,
          amount: r.amount,
          date: dateInMonth(m, r.day_of_month),
          paid: !isCurrent || r.day_of_month <= today,
          recurrence_id: r.id,
          ref_month: monthStart(m),
        }),
      )
    }
    const extras: [string, Transaction['type'], string, number, number][] = [
      ['Mercado do mês', 'outcome', 'Mercado', 480 + i * 35, 3],
      ['Uber', 'outcome', 'Transporte', 62.4 + i * 8, 12],
      ['Delivery', 'outcome', 'Alimentação', 78.5, 17],
      ['Farmácia', 'outcome', 'Saúde', 45 + i * 10, 22],
      ['Projeto freelance', 'income', 'Freelance', 600 + i * 150, 25],
    ]
    for (const [description, type, category, amount, day] of extras) {
      if (isCurrent && day > today) continue
      txs.push(
        tx({ description, type, category, amount, date: dateInMonth(m, day), paid: true }),
      )
    }
  })
  write(REC_KEY, recs)
  write(TX_KEY, txs)
}

const sortTx = (a: Transaction, b: Transaction) =>
  b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)

const delay = <T>(v: T) => new Promise<T>((r) => setTimeout(() => r(v), 60))

export function createLocalApi(): DataApi {
  try {
    if (localStorage.getItem(TX_KEY) === null) seed()
  } catch {
    /* ignora */
  }

  return {
    async listTransactions(from, to) {
      return delay(read<Transaction>(TX_KEY).filter((t) => t.date >= from && t.date <= to).sort(sortTx))
    },
    async createTransaction(input) {
      const item = tx(input)
      write(TX_KEY, [...read<Transaction>(TX_KEY), item])
      return delay(item)
    },
    async updateTransaction(id, patch) {
      const all = read<Transaction>(TX_KEY)
      const i = all.findIndex((t) => t.id === id)
      if (i < 0) throw new Error('Lançamento não encontrado')
      all[i] = { ...all[i], ...patch }
      write(TX_KEY, all)
      return delay(all[i])
    },
    async deleteTransaction(id) {
      write(TX_KEY, read<Transaction>(TX_KEY).filter((t) => t.id !== id))
      await delay(null)
    },
    async insertOccurrences(rows) {
      const all = read<Transaction>(TX_KEY)
      const keys = new Set(all.filter((t) => t.recurrence_id).map((t) => `${t.recurrence_id}|${t.ref_month}`))
      const fresh = rows.filter((r) => !keys.has(`${r.recurrence_id}|${r.ref_month}`)).map(tx)
      write(TX_KEY, [...all, ...fresh])
      return delay(fresh.length)
    },

    async listRecurrences() {
      return delay(
        read<Recurrence>(REC_KEY).sort(
          (a, b) => a.type.localeCompare(b.type) || a.day_of_month - b.day_of_month,
        ),
      )
    },
    async createRecurrence(input) {
      const item: Recurrence = { ...input, id: newId(), last_generated_month: null, created_at: now() }
      write(REC_KEY, [...read<Recurrence>(REC_KEY), item])
      return delay(item)
    },
    async updateRecurrence(id, patch) {
      const all = read<Recurrence>(REC_KEY)
      const i = all.findIndex((r) => r.id === id)
      if (i < 0) throw new Error('Gasto fixo não encontrado')
      all[i] = { ...all[i], ...patch }
      write(REC_KEY, all)
      return delay(all[i])
    },
    async deleteRecurrence(id) {
      write(REC_KEY, read<Recurrence>(REC_KEY).filter((r) => r.id !== id))
      write(
        TX_KEY,
        read<Transaction>(TX_KEY).map((t) => (t.recurrence_id === id ? { ...t, recurrence_id: null } : t)),
      )
      await delay(null)
    },
  }
}

export function resetDemoData() {
  try {
    localStorage.removeItem(TX_KEY)
    localStorage.removeItem(REC_KEY)
  } catch {
    /* ignora */
  }
}

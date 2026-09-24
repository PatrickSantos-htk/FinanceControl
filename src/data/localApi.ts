import { newId } from '@/lib/id'
import type { Recurrence, Transaction, TransactionInput } from '@/domain/types'
import type { DataApi } from './api'

export const TX_KEY = 'fc:transactions'
export const REC_KEY = 'fc:recurrences'

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

const sortTx = (a: Transaction, b: Transaction) =>
  b.date.localeCompare(a.date) || b.created_at.localeCompare(a.created_at)

const delay = <T>(v: T) => Promise.resolve(v)

export function createLocalApi(): DataApi {
  // Pede ao navegador para não apagar os dados quando faltar espaço.
  try {
    navigator.storage?.persist?.()
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

export interface Backup {
  app: 'FinanceControl'
  version: 1
  exportedAt: string
  transactions: Transaction[]
  recurrences: Recurrence[]
}

const LAST_BACKUP_KEY = 'fc:last-backup'

export function exportBackup(): Backup {
  const backup: Backup = {
    app: 'FinanceControl',
    version: 1,
    exportedAt: new Date().toISOString(),
    transactions: read<Transaction>(TX_KEY),
    recurrences: read<Recurrence>(REC_KEY),
  }
  try {
    localStorage.setItem(LAST_BACKUP_KEY, backup.exportedAt)
  } catch {
    /* ignora */
  }
  return backup
}

export function lastBackupAt(): string | null {
  try {
    return localStorage.getItem(LAST_BACKUP_KEY)
  } catch {
    return null
  }
}

/** Valida e substitui todos os dados pelos do arquivo. Retorna a contagem restaurada. */
export function importBackup(raw: string): { transactions: number; recurrences: number } {
  let data: Partial<Backup>
  try {
    data = JSON.parse(raw)
  } catch {
    throw new Error('Arquivo inválido: não é um backup do FinanceControl.')
  }
  if (data.app !== 'FinanceControl' || !Array.isArray(data.transactions) || !Array.isArray(data.recurrences)) {
    throw new Error('Arquivo inválido: não é um backup do FinanceControl.')
  }
  const okTx = data.transactions.every(
    (t) => t && typeof t.id === 'string' && typeof t.amount === 'number' && /^\d{4}-\d{2}-\d{2}$/.test(t.date),
  )
  const okRec = data.recurrences.every((r) => r && typeof r.id === 'string' && typeof r.amount === 'number')
  if (!okTx || !okRec) throw new Error('O backup está corrompido ou incompleto.')
  write(TX_KEY, data.transactions)
  write(REC_KEY, data.recurrences)
  return { transactions: data.transactions.length, recurrences: data.recurrences.length }
}

export function clearAllData() {
  try {
    localStorage.removeItem(TX_KEY)
    localStorage.removeItem(REC_KEY)
  } catch {
    /* ignora */
  }
}

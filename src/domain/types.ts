export type TxType = 'income' | 'outcome'

/** Mês no formato YYYY-MM */
export type MonthKey = string

export interface Transaction {
  id: string
  description: string
  type: TxType
  category: string
  amount: number
  /** YYYY-MM-DD */
  date: string
  paid: boolean
  recurrence_id: string | null
  /** YYYY-MM-01 quando veio de um gasto fixo */
  ref_month: string | null
  notes: string | null
  created_at: string
}

export type TransactionInput = Pick<
  Transaction,
  'description' | 'type' | 'category' | 'amount' | 'date' | 'paid'
> &
  Partial<Pick<Transaction, 'recurrence_id' | 'ref_month' | 'notes'>>

export interface Recurrence {
  id: string
  description: string
  type: TxType
  category: string
  amount: number
  day_of_month: number
  /** YYYY-MM-01 */
  start_month: string
  /** YYYY-MM-01 */
  end_month: string | null
  active: boolean
  last_generated_month: string | null
  created_at: string
}

export type RecurrenceInput = Pick<
  Recurrence,
  'description' | 'type' | 'category' | 'amount' | 'day_of_month' | 'start_month' | 'end_month' | 'active'
>

/** Lançamento exibido na lista: real ou apenas previsto (mês futuro). */
export type ListItem = Transaction & { projected?: boolean }

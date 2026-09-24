import type {
  Recurrence,
  RecurrenceInput,
  Transaction,
  TransactionInput,
} from '@/domain/types'

export interface DataApi {
  listTransactions(from: string, to: string): Promise<Transaction[]>
  createTransaction(input: TransactionInput): Promise<Transaction>
  updateTransaction(id: string, patch: Partial<TransactionInput>): Promise<Transaction>
  deleteTransaction(id: string): Promise<void>
  /** Insere lançamentos de gastos fixos ignorando os que já existem. Retorna quantos entraram. */
  insertOccurrences(rows: TransactionInput[]): Promise<number>

  listRecurrences(): Promise<Recurrence[]>
  createRecurrence(input: RecurrenceInput): Promise<Recurrence>
  updateRecurrence(
    id: string,
    patch: Partial<RecurrenceInput & Pick<Recurrence, 'last_generated_month'>>,
  ): Promise<Recurrence>
  deleteRecurrence(id: string): Promise<void>
}

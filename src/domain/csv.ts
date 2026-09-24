import { formatDateBR } from './month'
import type { Transaction } from './types'

function cell(v: string) {
  return /[";\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v
}

/** CSV com ";" e vírgula decimal, que o Excel em português abre direto. */
export function transactionsToCSV(items: Transaction[]): string {
  const header = ['Data', 'Descrição', 'Tipo', 'Categoria', 'Valor', 'Situação', 'Fixo']
  const rows = [...items]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((t) => [
      formatDateBR(t.date),
      t.description,
      t.type === 'income' ? 'Entrada' : 'Saída',
      t.category,
      (t.type === 'income' ? t.amount : -t.amount).toFixed(2).replace('.', ','),
      t.paid ? (t.type === 'income' ? 'Recebido' : 'Pago') : 'Pendente',
      t.recurrence_id ? 'Sim' : 'Não',
    ])
  return '﻿' + [header, ...rows].map((r) => r.map(cell).join(';')).join('\r\n')
}

export function downloadFile(filename: string, content: string, mime = 'text/csv;charset=utf-8') {
  const blob = new Blob([content], { type: mime })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

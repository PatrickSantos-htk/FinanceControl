const brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })
const brlCompact = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  notation: 'compact',
  maximumFractionDigits: 1,
})

export function formatMoney(value: number): string {
  return brl.format(value)
}

export function formatMoneyCompact(value: number): string {
  return brlCompact.format(value)
}

/** Aceita "1.234,56", "1234,56", "1234.56" ou "R$ 1.234,56". Retorna NaN se inválido. */
export function parseMoney(input: string): number {
  const raw = input.replace(/[R$\s]/g, '')
  if (!raw) return NaN
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw
  if (!/^-?\d+(\.\d{1,2})?$/.test(normalized)) return NaN
  return Math.round(Number(normalized) * 100) / 100
}

/** Valor para exibir num input de edição (ex.: 1234.5 → "1234,50"). */
export function moneyToInput(value: number): string {
  return value.toFixed(2).replace('.', ',')
}

/** Soma sem erro de ponto flutuante (trabalha em centavos). */
export function sum(values: number[]): number {
  return values.reduce((acc, v) => acc + Math.round(v * 100), 0) / 100
}

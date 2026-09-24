import type { TxType } from './types'

export const DEFAULT_CATEGORIES: Record<TxType, string[]> = {
  outcome: [
    'Moradia',
    'Contas da casa',
    'Alimentação',
    'Mercado',
    'Transporte',
    'Saúde',
    'Educação',
    'Assinaturas',
    'Lazer',
    'Compras',
    'Cartão de crédito',
    'Impostos e taxas',
    'Outros',
  ],
  income: ['Salário', 'Bolsa estágio', 'Freelance', 'Rendimentos', 'Reembolso', 'Outros'],
}

const PALETTE = [
  '#00B37E',
  '#81D8F7',
  '#FBA94C',
  '#F75A68',
  '#B18CFF',
  '#F7D060',
  '#4DD4AC',
  '#FF8FB1',
  '#6C9EFF',
  '#C4C4CC',
  '#E07A5F',
  '#9BE564',
]

export function categoryColor(name: string): string {
  let h = 7
  for (const ch of name.toLowerCase()) h = (h * 31 + ch.codePointAt(0)!) >>> 0
  return PALETTE[h % PALETTE.length]
}

/** Categorias padrão + as que o usuário já usou, sem repetir. */
export function mergeCategories(type: TxType, used: string[]): string[] {
  const set = new Map<string, string>()
  for (const c of [...DEFAULT_CATEGORIES[type], ...used]) {
    const key = c.trim().toLowerCase()
    if (key && !set.has(key)) set.set(key, c.trim())
  }
  return [...set.values()]
}

import { useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { currentMonth, isMonthKey } from '@/domain/month'
import type { MonthKey } from '@/domain/types'

/** Mês selecionado, guardado na URL (?mes=2026-09) para funcionar com voltar/atualizar. */
export function useMonthParam(): [MonthKey, (m: MonthKey) => void] {
  const [params, setParams] = useSearchParams()
  const raw = params.get('mes')
  const month = isMonthKey(raw) ? raw : currentMonth()
  const setMonth = useCallback(
    (m: MonthKey) => {
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (m === currentMonth()) next.delete('mes')
          else next.set('mes', m)
          return next
        },
        { replace: true },
      )
    },
    [setParams],
  )
  return [month, setMonth]
}

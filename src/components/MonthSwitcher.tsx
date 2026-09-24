import { CaretLeft, CaretRight } from '@phosphor-icons/react'
import styled from 'styled-components'
import { addMonths, currentMonth, monthLabel } from '@/domain/month'
import type { MonthKey } from '@/domain/types'
import { IconButton } from './ui'

const Wrap = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
`

const Label = styled.h1`
  font-size: 1.35rem;
  min-width: 11ch;
  text-align: center;
  @media (min-width: ${({ theme }) => theme.bp.md}) { font-size: 1.6rem; }
`

const Today = styled.button`
  margin-left: 0.5rem;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  border-radius: 999px;
  padding: 0.3rem 0.75rem;
  font-size: 0.8rem;
  font-weight: 700;
  &:hover { color: ${({ theme }) => theme.colors.text}; }
`

export function MonthSwitcher({ month, onChange }: { month: MonthKey; onChange: (m: MonthKey) => void }) {
  const isCurrent = month === currentMonth()
  return (
    <Wrap>
      <IconButton type="button" aria-label="Mês anterior" onClick={() => onChange(addMonths(month, -1))}>
        <CaretLeft size={22} weight="bold" />
      </IconButton>
      <Label aria-live="polite">{monthLabel(month)}</Label>
      <IconButton type="button" aria-label="Próximo mês" onClick={() => onChange(addMonths(month, 1))}>
        <CaretRight size={22} weight="bold" />
      </IconButton>
      {!isCurrent && (
        <Today type="button" onClick={() => onChange(currentMonth())}>
          Hoje
        </Today>
      )}
    </Wrap>
  )
}

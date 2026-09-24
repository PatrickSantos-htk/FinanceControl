import { ArrowCircleDown, ArrowCircleUp, CurrencyCircleDollar } from '@phosphor-icons/react'
import styled, { css } from 'styled-components'
import { formatMoney } from '@/domain/money'
import type { MonthSummary } from '@/domain/summary'

const Grid = styled.section`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;

  > :first-child { grid-column: 1 / -1; }

  @media (min-width: ${({ theme }) => theme.bp.md}) {
    grid-template-columns: repeat(3, 1fr);
    gap: 1rem;
    > :first-child { grid-column: auto; order: 3; }
  }
`

const CardBox = styled.div<{ $tone: 'green' | 'red' | 'balance'; $negative?: boolean }>`
  border-radius: ${({ theme }) => theme.radius};
  padding: 1rem;
  background: ${({ theme }) => theme.colors.surface2};
  min-width: 0;

  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: ${({ theme }) => theme.colors.textMuted};
    font-size: 0.85rem;
  }

  strong {
    display: block;
    margin-top: 0.5rem;
    font-size: 1.2rem;
    overflow-wrap: anywhere;
  }

  small {
    display: block;
    margin-top: 0.35rem;
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }

  ${({ theme, $tone, $negative }) =>
    $tone === 'balance'
      ? css`
          background: ${$negative ? theme.colors.redStrong : theme.colors.greenDark};
          header, small { color: ${theme.colors.text}cc; }
          strong { font-size: 1.75rem; }
        `
      : css`
          header svg { color: ${$tone === 'green' ? theme.colors.green : theme.colors.red}; }
        `}

  @media (min-width: ${({ theme }) => theme.bp.md}) {
    padding: 1.5rem;
    strong { font-size: 1.75rem; }
  }
`

function Delta({ current, previous }: { current: number; previous?: number }) {
  if (previous === undefined || previous === 0) return null
  const pct = ((current - previous) / previous) * 100
  if (!isFinite(pct)) return null
  const sign = pct > 0 ? '+' : ''
  return (
    <small>
      {sign}
      {pct.toFixed(0)}% vs mês anterior
    </small>
  )
}

export function SummaryCards({ summary, previous }: { summary: MonthSummary; previous?: MonthSummary }) {
  const negative = summary.balance < 0
  return (
    <Grid aria-label="Resumo do mês">
      <CardBox $tone="balance" $negative={negative}>
        <header>
          <span>Saldo do mês</span>
          <CurrencyCircleDollar size={26} />
        </header>
        <strong>{formatMoney(summary.balance)}</strong>
        <small>
          Realizado até agora: {formatMoney(summary.realizedBalance)}
        </small>
      </CardBox>

      <CardBox $tone="green">
        <header>
          <span>Entradas</span>
          <ArrowCircleUp size={24} />
        </header>
        <strong>{formatMoney(summary.income)}</strong>
        {summary.incomePending > 0 ? (
          <small>A receber: {formatMoney(summary.incomePending)}</small>
        ) : (
          <Delta current={summary.income} previous={previous?.income} />
        )}
      </CardBox>

      <CardBox $tone="red">
        <header>
          <span>Saídas</span>
          <ArrowCircleDown size={24} />
        </header>
        <strong>{formatMoney(summary.outcome)}</strong>
        {summary.outcomePending > 0 ? (
          <small>A pagar: {formatMoney(summary.outcomePending)}</small>
        ) : (
          <Delta current={summary.outcome} previous={previous?.outcome} />
        )}
      </CardBox>
    </Grid>
  )
}

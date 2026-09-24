import { useMemo, useState } from 'react'
import { Plus, Repeat } from '@phosphor-icons/react'
import styled from 'styled-components'
import { RecurrenceForm } from '@/components/RecurrenceForm'
import { Badge, Button, Card, Empty, ErrorBox, PageTitle, SectionTitle, Spinner } from '@/components/ui'
import { categoryColor } from '@/domain/categories'
import { formatMoney, sum } from '@/domain/money'
import { addMonths, currentMonth, monthLabel, monthOf, monthStart } from '@/domain/month'
import { recurrenceCovers } from '@/domain/recurrence'
import type { Recurrence } from '@/domain/types'
import { useRecurrenceMutations, useRecurrences } from '@/hooks/queries'

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`

const Totals = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  @media (min-width: ${({ theme }) => theme.bp.md}) {
    grid-template-columns: repeat(3, 1fr);
    > div:last-child { grid-column: auto; }
  }
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  > div {
    background: ${({ theme }) => theme.colors.surface2};
    border-radius: ${({ theme }) => theme.radius};
    padding: 1rem;
  }
  > div:last-child { grid-column: 1 / -1; }
  span { font-size: 0.8rem; color: ${({ theme }) => theme.colors.textMuted}; }
  strong { display: block; font-size: 1.25rem; margin-top: 0.35rem; }
`

const Bar = styled.span<{ $pct: number }>`
  display: block;
  height: 6px;
  border-radius: 999px;
  background: ${({ theme }) => theme.colors.border};
  margin: 0.6rem 0 0.4rem;
  overflow: hidden;
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $pct }) => Math.min($pct, 100)}%;
    background: ${({ theme, $pct }) =>
      $pct > 80 ? theme.colors.red : $pct > 50 ? theme.colors.yellow : theme.colors.green};
  }
`

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  & + h2 { margin-top: 1.75rem; }
`

const Item = styled.li<{ $inactive: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.75rem 0.9rem;
  opacity: ${({ $inactive }) => ($inactive ? 0.55 : 1)};

  > button:first-child {
    flex: 1;
    min-width: 0;
    border: 0;
    background: transparent;
    color: inherit;
    text-align: left;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }
`

const Day = styled.div`
  flex: none;
  width: 44px;
  text-align: center;
  font-size: 0.65rem;
  text-transform: uppercase;
  color: ${({ theme }) => theme.colors.textMuted};
  strong { display: block; font-size: 1.15rem; color: ${({ theme }) => theme.colors.text}; }
`

const Info = styled.div`
  flex: 1;
  min-width: 0;
  p { font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  div {
    display: flex; align-items: center; flex-wrap: wrap; gap: 0.35rem;
    font-size: 0.78rem; color: ${({ theme }) => theme.colors.textMuted}; margin-top: 0.2rem;
  }
  i { width: 8px; height: 8px; border-radius: 50%; }
`

const Amount = styled.strong<{ $type: 'income' | 'outcome' }>`
  color: ${({ $type, theme }) => ($type === 'income' ? theme.colors.green : theme.colors.red)};
  flex: none;
`

const Switch = styled.button<{ $on: boolean }>`
  flex: none;
  width: 44px;
  height: 26px;
  border-radius: 999px;
  border: 0;
  position: relative;
  background: ${({ theme, $on }) => ($on ? theme.colors.greenStrong : theme.colors.border)};
  &::after {
    content: '';
    position: absolute;
    top: 3px;
    left: ${({ $on }) => ($on ? '21px' : '3px')};
    width: 20px;
    height: 20px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.white};
    transition: left 0.15s;
  }
`

function endLabel(r: Recurrence) {
  const m = currentMonth()
  if (r.end_month && monthOf(r.end_month) < m) return 'encerrado'
  if (monthOf(r.start_month) > m) return `começa em ${monthLabel(monthOf(r.start_month)).toLowerCase()}`
  if (r.end_month) return `até ${monthLabel(monthOf(r.end_month)).toLowerCase()}`
  return null
}

export function RecurrencesPage() {
  const { data, isLoading, error } = useRecurrences()
  const { update } = useRecurrenceMutations()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Recurrence | null>(null)

  const month = currentMonth()
  const { incomes, outcomes, totalIn, totalOut } = useMemo(() => {
    const list = data ?? []
    const active = list.filter((r) => recurrenceCovers(r, month))
    return {
      incomes: list.filter((r) => r.type === 'income'),
      outcomes: list.filter((r) => r.type === 'outcome'),
      totalIn: sum(active.filter((r) => r.type === 'income').map((r) => r.amount)),
      totalOut: sum(active.filter((r) => r.type === 'outcome').map((r) => r.amount)),
    }
  }, [data, month])

  const committed = totalIn ? (totalOut / totalIn) * 100 : 0

  function toggle(r: Recurrence) {
    const reactivating = !r.active
    // Ao reativar, não lança os meses em que ficou pausado.
    const lastPaused = monthStart(addMonths(month, -1))
    update.mutate({
      id: r.id,
      patch: {
        active: reactivating,
        ...(reactivating && (!r.last_generated_month || r.last_generated_month < lastPaused)
          ? { last_generated_month: lastPaused }
          : {}),
      },
    })
  }

  function edit(r: Recurrence | null) {
    setEditing(r)
    setOpen(true)
  }

  const renderList = (list: Recurrence[]) => (
    <List>
      {list.map((r) => {
        const extra = endLabel(r)
        return (
          <Item key={r.id} $inactive={!r.active}>
            <button type="button" onClick={() => edit(r)}>
              <Day>
                dia<strong>{r.day_of_month}</strong>
              </Day>
              <Info>
                <p>{r.description}</p>
                <div>
                  <i style={{ background: categoryColor(r.category) }} />
                  {r.category}
                  {!r.active && <Badge>pausado</Badge>}
                  {extra && <Badge $tone="yellow">{extra}</Badge>}
                </div>
              </Info>
              <Amount $type={r.type}>{formatMoney(r.amount)}</Amount>
            </button>
            <Switch
              type="button"
              role="switch"
              aria-checked={r.active}
              aria-label={r.active ? `Pausar ${r.description}` : `Reativar ${r.description}`}
              $on={r.active}
              onClick={() => toggle(r)}
            />
          </Item>
        )
      })}
    </List>
  )

  return (
    <>
      <Top>
        <PageTitle>Fixos do mês</PageTitle>
        <Button type="button" onClick={() => edit(null)}>
          <Plus size={18} weight="bold" /> Novo fixo
        </Button>
      </Top>

      <Totals>
        <div>
          <span>Ganhos fixos</span>
          <strong>{formatMoney(totalIn)}</strong>
        </div>
        <div>
          <span>Gastos fixos</span>
          <strong>{formatMoney(totalOut)}</strong>
        </div>
        <div>
          <span>Sobra depois dos fixos</span>
          <strong>{formatMoney(sum([totalIn, -totalOut]))}</strong>
          {totalIn > 0 && (
            <>
              <Bar $pct={committed} aria-hidden />
              <span>{committed.toFixed(0)}% da renda fixa comprometida</span>
            </>
          )}
        </div>
      </Totals>

      {error ? (
        <ErrorBox>Não foi possível carregar: {(error as Error).message}</ErrorBox>
      ) : isLoading ? (
        <Spinner />
      ) : !data?.length ? (
        <Card>
          <Empty>
            <Repeat size={48} />
            <p>
              Cadastre aqui o que se repete todo mês (aluguel, internet, assinaturas, salário).
              <br />O app lança sozinho a cada mês.
            </p>
            <Button type="button" onClick={() => edit(null)}>
              <Plus size={18} weight="bold" /> Cadastrar o primeiro
            </Button>
          </Empty>
        </Card>
      ) : (
        <>
          {outcomes.length > 0 && (
            <>
              <SectionTitle>Gastos fixos</SectionTitle>
              {renderList(outcomes)}
            </>
          )}
          {incomes.length > 0 && (
            <>
              <SectionTitle>Ganhos fixos</SectionTitle>
              {renderList(incomes)}
            </>
          )}
        </>
      )}

      <RecurrenceForm open={open} onOpenChange={setOpen} editing={editing} />
    </>
  )
}

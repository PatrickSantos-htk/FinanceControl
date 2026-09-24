import { CheckCircle, Circle, Repeat } from '@phosphor-icons/react'
import styled, { css } from 'styled-components'
import { categoryColor } from '@/domain/categories'
import { formatMoney, sum } from '@/domain/money'
import { dayLabel } from '@/domain/month'
import type { ListItem } from '@/domain/types'
import { Badge } from './ui'

const Group = styled.section`
  & + & { margin-top: 1.25rem; }
`

const GroupHead = styled.header`
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  padding: 0 0.25rem 0.5rem;
`

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
`

const Item = styled.li<{ $projected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.35rem 0.5rem 0.35rem 0.35rem;

  ${({ $projected, theme }) =>
    $projected &&
    css`
      background: transparent;
      border: 1px dashed ${theme.colors.border};
      opacity: 0.8;
    `}
`

const Toggle = styled.button<{ $paid: boolean }>`
  flex: none;
  display: grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  color: ${({ $paid, theme }) => ($paid ? theme.colors.green : theme.colors.yellow)};
  &:hover { background: ${({ theme }) => theme.colors.surface}; }
  &:disabled { cursor: default; color: ${({ theme }) => theme.colors.textSubtle}; }
`

const Main = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  padding: 0.45rem 0;
  &:disabled { cursor: default; }
`

const Info = styled.div`
  flex: 1;
  min-width: 0;

  p {
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  div {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.35rem;
    margin-top: 0.2rem;
    font-size: 0.78rem;
    color: ${({ theme }) => theme.colors.textMuted};
  }
`

const Dot = styled.i<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  flex: none;
`

const Amount = styled.strong<{ $type: 'income' | 'outcome' }>`
  flex: none;
  font-size: 0.95rem;
  color: ${({ $type, theme }) => ($type === 'income' ? theme.colors.green : theme.colors.red)};
`

function groupByDate(items: ListItem[]) {
  const map = new Map<string, ListItem[]>()
  for (const t of items) {
    const list = map.get(t.date) ?? []
    list.push(t)
    map.set(t.date, list)
  }
  return [...map.entries()].sort(([a], [b]) => b.localeCompare(a))
}

export function TransactionList({
  items,
  onEdit,
  onTogglePaid,
}: {
  items: ListItem[]
  onEdit: (t: ListItem) => void
  onTogglePaid: (t: ListItem) => void
}) {
  return (
    <div>
      {groupByDate(items).map(([date, list]) => {
        const net = sum(list.map((t) => (t.type === 'income' ? t.amount : -t.amount)))
        return (
          <Group key={date}>
            <GroupHead>
              <span>{dayLabel(date)}</span>
              <span>{formatMoney(net)}</span>
            </GroupHead>
            <List>
              {list.map((t) => {
                const statusLabel = t.type === 'income' ? 'recebido' : 'pago'
                return (
                  <Item key={t.id} $projected={t.projected}>
                    <Toggle
                      type="button"
                      $paid={t.paid}
                      disabled={t.projected}
                      onClick={() => onTogglePaid(t)}
                      aria-label={
                        t.projected
                          ? 'Previsto'
                          : t.paid
                            ? `Marcar como não ${statusLabel}`
                            : `Marcar como ${statusLabel}`
                      }
                      title={t.paid ? statusLabel : 'pendente'}
                    >
                      {t.paid && !t.projected ? (
                        <CheckCircle size={24} weight="fill" />
                      ) : (
                        <Circle size={24} />
                      )}
                    </Toggle>
                    <Main type="button" onClick={() => onEdit(t)} disabled={t.projected}>
                      <Info>
                        <p>{t.description}</p>
                        <div>
                          <Dot $color={categoryColor(t.category)} />
                          {t.category}
                          {t.recurrence_id && (
                            <Badge $tone="blue">
                              <Repeat size={10} weight="bold" /> fixo
                            </Badge>
                          )}
                          {t.projected ? (
                            <Badge>previsto</Badge>
                          ) : (
                            !t.paid && <Badge $tone="yellow">pendente</Badge>
                          )}
                        </div>
                      </Info>
                      <Amount $type={t.type}>
                        {t.type === 'outcome' ? '− ' : '+ '}
                        {formatMoney(t.amount)}
                      </Amount>
                    </Main>
                  </Item>
                )
              })}
            </List>
          </Group>
        )
      })}
    </div>
  )
}

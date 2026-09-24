import { useDeferredValue, useMemo, useState } from 'react'
import { MagnifyingGlass, Plus, Receipt } from '@phosphor-icons/react'
import { Link } from 'react-router-dom'
import styled from 'styled-components'
import { MonthSwitcher } from '@/components/MonthSwitcher'
import { SummaryCards } from '@/components/SummaryCards'
import { TransactionForm } from '@/components/TransactionForm'
import { TransactionList } from '@/components/TransactionList'
import { Button, Empty, ErrorBox, Input, Spinner } from '@/components/ui'
import { addMonths, currentMonth } from '@/domain/month'
import { projectedItems } from '@/domain/recurrence'
import { summarize } from '@/domain/summary'
import type { ListItem, Transaction } from '@/domain/types'
import {
  useMonthTransactions,
  useRecurrences,
  useTransactionMutations,
} from '@/hooks/queries'
import { useMonthParam } from '@/hooks/useMonthParam'

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
  flex-wrap: wrap;

  > button { display: none; }
  @media (min-width: ${({ theme }) => theme.bp.md}) {
    > button { display: inline-flex; }
  }
`

const Toolbar = styled.div`
  margin: 1.5rem 0 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  @media (min-width: ${({ theme }) => theme.bp.md}) {
    flex-direction: row;
    align-items: center;
  }
`

const Search = styled.div`
  position: relative;
  flex: 1;
  svg {
    position: absolute;
    left: 0.85rem;
    top: 50%;
    transform: translateY(-50%);
    color: ${({ theme }) => theme.colors.textSubtle};
  }
  input { padding-left: 2.5rem; height: 44px; }
`

const Filters = styled.div`
  display: flex;
  gap: 0.4rem;
  overflow-x: auto;
  scrollbar-width: none;
`

const FilterBtn = styled.button<{ $active: boolean }>`
  flex: none;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  font-size: 0.85rem;
  font-weight: 700;
  border: 1px solid ${({ theme, $active }) => ($active ? theme.colors.green : theme.colors.border)};
  background: ${({ theme, $active }) => ($active ? `${theme.colors.green}1f` : 'transparent')};
  color: ${({ theme, $active }) => ($active ? theme.colors.green : theme.colors.textMuted)};
`

const Fab = styled.button`
  position: fixed;
  z-index: 25;
  right: 1rem;
  bottom: calc(5rem + env(safe-area-inset-bottom));
  width: 56px;
  height: 56px;
  border-radius: 50%;
  border: 0;
  background: ${({ theme }) => theme.colors.greenStrong};
  color: ${({ theme }) => theme.colors.white};
  display: grid;
  place-items: center;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.45);
  @media (min-width: ${({ theme }) => theme.bp.md}) { display: none; }
`

const Note = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-bottom: 0.75rem;
`

type Filter = 'all' | 'income' | 'outcome' | 'pending'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'Todos' },
  { key: 'outcome', label: 'Saídas' },
  { key: 'income', label: 'Entradas' },
  { key: 'pending', label: 'Pendentes' },
]

export function MonthPage() {
  const [month, setMonth] = useMonthParam()
  const { data, isLoading, error } = useMonthTransactions(month)
  const prev = useMonthTransactions(addMonths(month, -1))
  const recs = useRecurrences()
  const { update } = useTransactionMutations()

  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query)
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)

  const isFuture = month > currentMonth()

  const allItems = useMemo<ListItem[]>(() => {
    const real = data ?? []
    if (!isFuture) return real
    return [...real, ...projectedItems(recs.data ?? [], month, real)]
  }, [data, recs.data, month, isFuture])

  const summary = useMemo(() => summarize(allItems), [allItems])
  const prevSummary = useMemo(() => (prev.data ? summarize(prev.data) : undefined), [prev.data])

  const visible = useMemo(() => {
    const q = deferredQuery.trim().toLowerCase()
    return allItems.filter((t) => {
      if (filter === 'income' && t.type !== 'income') return false
      if (filter === 'outcome' && t.type !== 'outcome') return false
      if (filter === 'pending' && (t.paid || t.projected)) return false
      if (!q) return true
      return t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
    })
  }, [allItems, filter, deferredQuery])

  function openNew() {
    setEditing(null)
    setFormOpen(true)
  }

  function openEdit(t: ListItem) {
    if (t.projected) return
    setEditing(t)
    setFormOpen(true)
  }

  return (
    <>
      <Top>
        <MonthSwitcher month={month} onChange={setMonth} />
        <Button type="button" onClick={openNew}>
          <Plus size={18} weight="bold" /> Novo lançamento
        </Button>
      </Top>

      <SummaryCards summary={summary} previous={prevSummary} />

      <Toolbar>
        <Search>
          <MagnifyingGlass size={18} />
          <Input
            type="search"
            placeholder="Buscar por descrição ou categoria"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar lançamentos"
          />
        </Search>
        <Filters role="tablist" aria-label="Filtrar">
          {FILTERS.map((f) => (
            <FilterBtn
              key={f.key}
              type="button"
              role="tab"
              aria-selected={filter === f.key}
              $active={filter === f.key}
              onClick={() => setFilter(f.key)}
            >
              {f.label}
            </FilterBtn>
          ))}
        </Filters>
      </Toolbar>

      {isFuture && allItems.some((t) => t.projected) && (
        <Note>Mês futuro: os fixos aparecem como previstos e são lançados quando o mês chegar.</Note>
      )}

      {error ? (
        <ErrorBox>Não foi possível carregar: {(error as Error).message}</ErrorBox>
      ) : isLoading ? (
        <Spinner aria-label="Carregando" />
      ) : visible.length === 0 ? (
        <Empty>
          <Receipt size={48} />
          {allItems.length === 0 ? (
            <>
              <p>Nenhum lançamento neste mês.</p>
              <Button type="button" onClick={openNew}>
                <Plus size={18} weight="bold" /> Adicionar o primeiro
              </Button>
              <p style={{ fontSize: '0.85rem' }}>
                Dica: cadastre aluguel, contas e salário em <Link to="/fixos">Fixos</Link> e eles entram sozinhos todo
                mês.
              </p>
            </>
          ) : (
            <p>Nada encontrado com esse filtro.</p>
          )}
        </Empty>
      ) : (
        <TransactionList
          items={visible}
          onEdit={openEdit}
          onTogglePaid={(t) => update.mutate({ id: t.id, patch: { paid: !t.paid } })}
        />
      )}

      <Fab type="button" onClick={openNew} aria-label="Novo lançamento">
        <Plus size={26} weight="bold" />
      </Fab>

      <TransactionForm open={formOpen} onOpenChange={setFormOpen} month={month} editing={editing} />
    </>
  )
}

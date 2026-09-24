import { useMemo, useState } from 'react'
import { DownloadSimple } from '@phosphor-icons/react'
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Line,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import styled, { useTheme } from 'styled-components'
import { Button, Card, Empty, ErrorBox, PageTitle, SectionTitle, Spinner } from '@/components/ui'
import { downloadFile, transactionsToCSV } from '@/domain/csv'
import { formatMoney, formatMoneyCompact, sum } from '@/domain/money'
import { addMonths, currentMonth, monthLabel, monthOf, monthsBetween, shortMonthLabel } from '@/domain/month'
import { byCategory, byMonth } from '@/domain/summary'
import { useRangeTransactions } from '@/hooks/queries'

const Top = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`

const Seg = styled.div`
  display: inline-flex;
  background: ${({ theme }) => theme.colors.surface2};
  border-radius: 999px;
  padding: 3px;

  button {
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.textMuted};
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0.45rem 0.9rem;
    border-radius: 999px;
  }
  button[aria-pressed='true'] {
    background: ${({ theme }) => theme.colors.surface};
    color: ${({ theme }) => theme.colors.text};
  }
`

const Kpis = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  margin-bottom: 1rem;
  @media (min-width: ${({ theme }) => theme.bp.md}) { grid-template-columns: repeat(4, 1fr); }

  div {
    background: ${({ theme }) => theme.colors.surface2};
    border-radius: ${({ theme }) => theme.radius};
    padding: 0.9rem 1rem;
    min-width: 0;
  }
  span { font-size: 0.78rem; color: ${({ theme }) => theme.colors.textMuted}; }
  strong { display: block; margin-top: 0.3rem; font-size: 1.1rem; overflow-wrap: anywhere; }
  small { display: block; font-size: 0.75rem; color: ${({ theme }) => theme.colors.textMuted}; margin-top: 0.15rem; }
`

const Grid = styled.div`
  display: grid;
  gap: 1rem;
  @media (min-width: 960px) { grid-template-columns: 3fr 2fr; }
`

const ChartBox = styled.div`
  height: 280px;
  margin: 0 -0.5rem;
`

const CatHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
  flex-wrap: wrap;
  margin-bottom: 0.5rem;
  h2 { margin: 0; }
`

const CatList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
  margin-top: 0.75rem;

  li { font-size: 0.875rem; }
  li > div:first-child { display: flex; align-items: center; gap: 0.5rem; }
  li i { width: 10px; height: 10px; border-radius: 50%; flex: none; }
  li span { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  li small { color: ${({ theme }) => theme.colors.textMuted}; }
`

const Track = styled.div<{ $pct: number; $color: string }>`
  height: 4px;
  border-radius: 999px;
  margin-top: 0.3rem;
  background: ${({ theme }) => theme.colors.border};
  &::after {
    content: '';
    display: block;
    height: 100%;
    width: ${({ $pct }) => $pct}%;
    border-radius: 999px;
    background: ${({ $color }) => $color};
  }
`

const PERIODS = [3, 6, 12] as const

export function ReportsPage() {
  const theme = useTheme()
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(6)
  const [catScope, setCatScope] = useState<'month' | 'period'>('month')

  const to = currentMonth()
  const from = addMonths(to, -(period - 1))
  const { data, isLoading, error } = useRangeTransactions(from, to)

  const months = useMemo(() => monthsBetween(from, to), [from, to])
  const items = useMemo(() => data ?? [], [data])
  const series = useMemo(
    () => byMonth(items, months).map((p) => ({ ...p, label: shortMonthLabel(p.month) })),
    [items, months],
  )
  const catItems = useMemo(
    () => (catScope === 'month' ? items.filter((t) => monthOf(t.date) === to) : items),
    [items, catScope, to],
  )
  const categories = useMemo(() => byCategory(catItems, 'outcome'), [catItems])

  const totalIn = sum(series.map((s) => s.income))
  const totalOut = sum(series.map((s) => s.outcome))
  // média só entre meses que têm algum lançamento (evita puxar para baixo quem começou agora)
  const activeMonths = Math.max(1, series.filter((m) => m.income || m.outcome).length)
  const savingsRate = totalIn ? ((totalIn - totalOut) / totalIn) * 100 : 0
  const biggest = items.filter((t) => t.type === 'outcome').sort((a, b) => b.amount - a.amount)[0]

  function exportCSV() {
    downloadFile(`financas_${from}_a_${to}.csv`, transactionsToCSV(items))
  }

  const tooltipStyle = {
    background: theme.colors.surface,
    border: `1px solid ${theme.colors.border}`,
    borderRadius: 8,
    color: theme.colors.text,
  }

  return (
    <>
      <Top>
        <PageTitle>Relatórios</PageTitle>
        <Seg role="group" aria-label="Período">
          {PERIODS.map((p) => (
            <button key={p} type="button" aria-pressed={period === p} onClick={() => setPeriod(p)}>
              {p} meses
            </button>
          ))}
        </Seg>
      </Top>

      {error ? (
        <ErrorBox>Não foi possível carregar: {(error as Error).message}</ErrorBox>
      ) : isLoading ? (
        <Spinner />
      ) : items.length === 0 ? (
        <Card>
          <Empty>
            <p>Ainda não há lançamentos neste período para montar os relatórios.</p>
          </Empty>
        </Card>
      ) : (
        <>
          <Kpis>
            <div>
              <span>Média de entradas</span>
              <strong>{formatMoney(totalIn / activeMonths)}</strong>
              <small>por mês ({activeMonths} {activeMonths === 1 ? 'mês' : 'meses'} com dados)</small>
            </div>
            <div>
              <span>Média de saídas</span>
              <strong>{formatMoney(totalOut / activeMonths)}</strong>
              <small>por mês</small>
            </div>
            <div>
              <span>Taxa de economia</span>
              <strong style={{ color: savingsRate < 0 ? theme.colors.red : theme.colors.green }}>
                {savingsRate.toFixed(0)}%
              </strong>
              <small>do que entrou, sobrou</small>
            </div>
            <div>
              <span>Maior gasto</span>
              <strong>{biggest ? formatMoney(biggest.amount) : '—'}</strong>
              <small>{biggest?.description ?? ''}</small>
            </div>
          </Kpis>

          <Grid>
            <Card>
              <SectionTitle>Entradas x saídas por mês</SectionTitle>
              <ChartBox>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid stroke={theme.colors.border} vertical={false} />
                    <XAxis dataKey="label" stroke={theme.colors.textMuted} fontSize={12} tickLine={false} />
                    <YAxis
                      stroke={theme.colors.textMuted}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={64}
                      tickFormatter={(v: number) => formatMoneyCompact(v)}
                    />
                    <Tooltip
                      contentStyle={tooltipStyle}
                      cursor={{ fill: `${theme.colors.border}66` }}
                      formatter={(v) => formatMoney(Number(v))}
                      labelFormatter={(_, p) => (p?.[0] ? monthLabel(p[0].payload.month) : '')}
                    />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="income" name="Entradas" fill={theme.colors.green} radius={[4, 4, 0, 0]} />
                    <Bar dataKey="outcome" name="Saídas" fill={theme.colors.red} radius={[4, 4, 0, 0]} />
                    <Line
                      dataKey="balance"
                      name="Saldo"
                      type="monotone"
                      stroke={theme.colors.blue}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartBox>
            </Card>

            <Card>
              <CatHead>
                <SectionTitle>Gastos por categoria</SectionTitle>
                <Seg role="group" aria-label="Escopo">
                  <button type="button" aria-pressed={catScope === 'month'} onClick={() => setCatScope('month')}>
                    Este mês
                  </button>
                  <button type="button" aria-pressed={catScope === 'period'} onClick={() => setCatScope('period')}>
                    Período
                  </button>
                </Seg>
              </CatHead>

              {categories.length === 0 ? (
                <Empty>
                  <p>Sem gastos neste recorte.</p>
                </Empty>
              ) : (
                <>
                  <ChartBox style={{ height: 200 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categories}
                          dataKey="value"
                          nameKey="name"
                          innerRadius="58%"
                          outerRadius="90%"
                          paddingAngle={2}
                          stroke="none"
                        >
                          {categories.map((c) => (
                            <Cell key={c.name} fill={c.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={tooltipStyle} formatter={(v) => formatMoney(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </ChartBox>
                  <CatList>
                    {categories.map((c) => (
                      <li key={c.name}>
                        <div>
                          <i style={{ background: c.color }} />
                          <span>{c.name}</span>
                          <strong>{formatMoney(c.value)}</strong>
                          <small>{c.percent.toFixed(0)}%</small>
                        </div>
                        <Track $pct={c.percent} $color={c.color} />
                      </li>
                    ))}
                  </CatList>
                </>
              )}
            </Card>
          </Grid>

          <Card style={{ marginTop: '1rem', display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <SectionTitle style={{ marginBottom: '0.25rem' }}>Exportar</SectionTitle>
              <p style={{ fontSize: '0.85rem', color: theme.colors.textMuted }}>
                {items.length} lançamentos de {monthLabel(from).toLowerCase()} a {monthLabel(to).toLowerCase()}, em CSV
                (abre no Excel e no Google Planilhas).
              </p>
            </div>
            <Button type="button" $variant="outline" onClick={exportCSV}>
              <DownloadSimple size={18} /> Baixar CSV
            </Button>
          </Card>
        </>
      )}
    </>
  )
}

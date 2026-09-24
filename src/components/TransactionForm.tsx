import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowCircleDown, ArrowCircleUp, Repeat, Trash } from '@phosphor-icons/react'
import styled from 'styled-components'
import { Sheet } from './Sheet'
import { CategoryPicker } from './CategoryPicker'
import { Button, CheckRow, ErrorBox, Field, Input, Row, TypeToggle, Badge } from './ui'
import { mergeCategories } from '@/domain/categories'
import { moneyToInput, parseMoney } from '@/domain/money'
import { currentMonth, monthOf, monthStart, todayISO } from '@/domain/month'
import type { MonthKey, Transaction } from '@/domain/types'
import {
  useRecentCategories,
  useRecurrenceMutations,
  useTransactionMutations,
} from '@/hooks/queries'

const schema = z.object({
  type: z.enum(['income', 'outcome']),
  description: z.string().trim().min(1, 'Informe uma descrição').max(120),
  amount: z
    .string()
    .refine((v) => parseMoney(v) > 0, 'Informe um valor maior que zero (ex.: 49,90)'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida'),
  category: z.string().trim().min(1, 'Escolha uma categoria').max(60),
  paid: z.boolean(),
  repeat: z.boolean(),
})

type FormData = z.infer<typeof schema>

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  > :last-child { flex: 1; }
`

const Hint = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
  margin-top: -0.5rem;
  padding-left: 1.9rem;
`

function defaultDate(month: MonthKey) {
  return month === currentMonth() ? todayISO() : monthStart(month)
}

export function TransactionForm({
  open,
  onOpenChange,
  month,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  month: MonthKey
  editing: Transaction | null
}) {
  const tx = useTransactionMutations()
  const rec = useRecurrenceMutations()
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    setConfirmDelete(false)
    setError(null)
    reset(
      editing
        ? {
            type: editing.type,
            description: editing.description,
            amount: moneyToInput(editing.amount),
            date: editing.date,
            category: editing.category,
            paid: editing.paid,
            repeat: false,
          }
        : {
            type: 'outcome',
            description: '',
            amount: '',
            date: defaultDate(month),
            category: '',
            paid: true,
            repeat: false,
          },
    )
  }, [open, editing, month, reset])

  const type = watch('type') ?? 'outcome'
  const used = useRecentCategories(type)
  const repeat = watch('repeat')
  const date = watch('date')

  async function onSubmit(data: FormData) {
    setError(null)
    const amount = parseMoney(data.amount)
    try {
      if (editing) {
        await tx.update.mutateAsync({
          id: editing.id,
          patch: {
            type: data.type,
            description: data.description,
            amount,
            date: data.date,
            category: data.category,
            paid: data.paid,
          },
        })
      } else if (data.repeat) {
        const day = Number(data.date.slice(8, 10))
        await rec.create.mutateAsync({
          type: data.type,
          description: data.description,
          category: data.category,
          amount,
          day_of_month: day,
          start_month: monthStart(monthOf(data.date)),
          end_month: null,
          active: true,
        })
      } else {
        await tx.create.mutateAsync({
          type: data.type,
          description: data.description,
          amount,
          date: data.date,
          category: data.category,
          paid: data.paid,
        })
      }
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  async function onDelete() {
    if (!editing) return
    if (!confirmDelete) return setConfirmDelete(true)
    try {
      await tx.remove.mutateAsync(editing.id)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir.')
    }
  }

  const isFuture = monthOf(date ?? todayISO()) > currentMonth()

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={editing ? 'Editar lançamento' : 'Novo lançamento'}
    >
      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
        {editing?.recurrence_id && (
          <Badge $tone="blue">
            <Repeat size={12} weight="bold" /> Lançado a partir de um fixo
          </Badge>
        )}

        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <TypeToggle
              value={field.value ?? 'outcome'}
              onChange={(v) => {
                field.onChange(v)
                setValue('category', '')
              }}
              icons={{
                income: <ArrowCircleUp size={22} />,
                outcome: <ArrowCircleDown size={22} />,
              }}
            />
          )}
        />

        <Field label="Descrição" error={errors.description?.message}>
          <Input
            {...register('description')}
            placeholder={type === 'income' ? 'Ex.: Salário, freela' : 'Ex.: Mercado, conta de luz'}
            aria-invalid={!!errors.description}
            autoComplete="off"
            maxLength={120}
          />
        </Field>

        <Row>
          <Field label="Valor (R$)" error={errors.amount?.message}>
            <Input
              {...register('amount')}
              inputMode="decimal"
              placeholder="0,00"
              aria-invalid={!!errors.amount}
              autoComplete="off"
            />
          </Field>
          <Field label="Data" error={errors.date?.message}>
            <Input type="date" {...register('date')} aria-invalid={!!errors.date} />
          </Field>
        </Row>

        <Field label="Categoria" error={errors.category?.message}>
          <Controller
            control={control}
            name="category"
            render={({ field }) => (
              <CategoryPicker
                value={field.value ?? ''}
                onChange={field.onChange}
                options={mergeCategories(type, used)}
                invalid={!!errors.category}
              />
            )}
          />
        </Field>

        {!editing && (
          <>
            <CheckRow>
              <input type="checkbox" {...register('repeat')} />
              <Repeat size={18} /> Repetir todo mês (gasto fixo)
            </CheckRow>
            {repeat && (
              <Hint>
                Vira um fixo lançado automaticamente todo dia {Number((date ?? '').slice(8, 10)) || 1}
                . Você gerencia na aba Fixos.
              </Hint>
            )}
          </>
        )}

        {!repeat && (
          <CheckRow>
            <input type="checkbox" {...register('paid')} />
            {type === 'income' ? 'Já recebido' : 'Já pago'}
            {isFuture && <Badge $tone="yellow">data futura</Badge>}
          </CheckRow>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        <Actions>
          {editing && (
            <Button type="button" $variant="danger" onClick={onDelete} disabled={tx.remove.isPending}>
              <Trash size={18} /> {confirmDelete ? 'Confirmar' : 'Excluir'}
            </Button>
          )}
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </Button>
        </Actions>
      </Form>
    </Sheet>
  )
}

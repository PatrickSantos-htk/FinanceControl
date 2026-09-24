import { useEffect, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { ArrowCircleDown, ArrowCircleUp, Trash } from '@phosphor-icons/react'
import styled from 'styled-components'
import { Sheet } from './Sheet'
import { CategoryPicker } from './CategoryPicker'
import { Button, ErrorBox, Field, Input, Row, TypeToggle } from './ui'
import { mergeCategories } from '@/domain/categories'
import { moneyToInput, parseMoney } from '@/domain/money'
import { currentMonth, monthOf, monthStart } from '@/domain/month'
import type { Recurrence } from '@/domain/types'
import { useRecentCategories, useRecurrenceMutations } from '@/hooks/queries'

const schema = z
  .object({
    type: z.enum(['income', 'outcome']),
    description: z.string().trim().min(1, 'Informe uma descrição').max(120),
    amount: z.string().refine((v) => parseMoney(v) > 0, 'Informe um valor maior que zero'),
    day: z.coerce.number().int().min(1, 'Dia entre 1 e 31').max(31, 'Dia entre 1 e 31'),
    category: z.string().trim().min(1, 'Escolha uma categoria').max(60),
    start: z.string().regex(/^\d{4}-\d{2}$/, 'Mês inválido'),
    end: z.string().regex(/^(\d{4}-\d{2})?$/, 'Mês inválido'),
  })
  .refine((d) => !d.end || d.end >= d.start, {
    path: ['end'],
    message: 'O fim precisa ser depois do início',
  })

type FormIn = z.input<typeof schema>
type FormOut = z.output<typeof schema>

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Hint = styled.p`
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};
`

const Actions = styled.div`
  display: flex;
  gap: 0.75rem;
  margin-top: 0.5rem;
  > :last-child { flex: 1; }
`

export function RecurrenceForm({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editing: Recurrence | null
}) {
  const { create, update, remove } = useRecurrenceMutations()
  const [error, setError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormIn, unknown, FormOut>({ resolver: zodResolver(schema) })

  useEffect(() => {
    if (!open) return
    setError(null)
    setConfirmDelete(false)
    reset(
      editing
        ? {
            type: editing.type,
            description: editing.description,
            amount: moneyToInput(editing.amount),
            day: editing.day_of_month,
            category: editing.category,
            start: monthOf(editing.start_month),
            end: editing.end_month ? monthOf(editing.end_month) : '',
          }
        : {
            type: 'outcome',
            description: '',
            amount: '',
            day: 10,
            category: '',
            start: currentMonth(),
            end: '',
          },
    )
  }, [open, editing, reset])

  const type = watch('type') ?? 'outcome'
  const used = useRecentCategories(type)

  async function onSubmit(d: FormOut) {
    setError(null)
    const payload = {
      type: d.type,
      description: d.description,
      amount: parseMoney(d.amount),
      day_of_month: d.day,
      category: d.category,
      start_month: monthStart(d.start),
      end_month: d.end ? monthStart(d.end) : null,
      active: editing?.active ?? true,
    }
    try {
      if (editing) await update.mutateAsync({ id: editing.id, patch: payload })
      else await create.mutateAsync(payload)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível salvar.')
    }
  }

  async function onDelete() {
    if (!editing) return
    if (!confirmDelete) return setConfirmDelete(true)
    try {
      await remove.mutateAsync(editing.id)
      onOpenChange(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível excluir.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={editing ? 'Editar fixo' : 'Novo gasto ou ganho fixo'}>
      <Form onSubmit={handleSubmit(onSubmit)} noValidate>
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
              outcomeLabel="Gasto fixo"
              incomeLabel="Ganho fixo"
              icons={{ income: <ArrowCircleUp size={22} />, outcome: <ArrowCircleDown size={22} /> }}
            />
          )}
        />

        <Field label="Descrição" error={errors.description?.message}>
          <Input
            {...register('description')}
            placeholder={type === 'income' ? 'Ex.: Salário' : 'Ex.: Aluguel, internet, academia'}
            aria-invalid={!!errors.description}
            autoComplete="off"
          />
        </Field>

        <Row>
          <Field label="Valor (R$)" error={errors.amount?.message}>
            <Input {...register('amount')} inputMode="decimal" placeholder="0,00" aria-invalid={!!errors.amount} />
          </Field>
          <Field label="Dia do mês" error={errors.day?.message}>
            <Input type="number" min={1} max={31} inputMode="numeric" {...register('day')} aria-invalid={!!errors.day} />
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

        <Row>
          <Field label="Começa em" error={errors.start?.message}>
            <Input type="month" {...register('start')} aria-invalid={!!errors.start} />
          </Field>
          <Field label="Termina em (opcional)" error={errors.end?.message}>
            <Input type="month" {...register('end')} aria-invalid={!!errors.end} />
          </Field>
        </Row>

        <Hint>
          Todo mês o app lança este valor sozinho como pendente. Quando pagar, é só marcar na lista do mês.
          {editing && ' Alterações valem para os próximos lançamentos; os já lançados não mudam.'}
        </Hint>

        {error && <ErrorBox>{error}</ErrorBox>}

        <Actions>
          {editing && (
            <Button type="button" $variant="danger" onClick={onDelete} disabled={remove.isPending}>
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

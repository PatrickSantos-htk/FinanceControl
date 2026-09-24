import type { ReactNode } from 'react'
import styled, { css, keyframes } from 'styled-components'

type Variant = 'primary' | 'ghost' | 'danger' | 'outline'

export const Button = styled.button<{ $variant?: Variant; $block?: boolean }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  height: 44px;
  padding: 0 1.1rem;
  border-radius: ${({ theme }) => theme.radius};
  border: 1px solid transparent;
  font-weight: 700;
  font-size: 0.95rem;
  transition: background-color 0.15s, border-color 0.15s, opacity 0.15s;
  width: ${({ $block }) => ($block ? '100%' : 'auto')};
  white-space: nowrap;

  ${({ theme, $variant = 'primary' }) => {
    const c = theme.colors
    switch ($variant) {
      case 'ghost':
        return css`
          background: transparent;
          color: ${c.text};
          &:hover:not(:disabled) { background: ${c.surface2}; }
        `
      case 'outline':
        return css`
          background: transparent;
          color: ${c.text};
          border-color: ${c.border};
          &:hover:not(:disabled) { border-color: ${c.textSubtle}; }
        `
      case 'danger':
        return css`
          background: transparent;
          color: ${c.red};
          border-color: ${c.redStrong};
          &:hover:not(:disabled) { background: ${c.redStrong}; color: ${c.white}; }
        `
      default:
        return css`
          background: ${c.greenStrong};
          color: ${c.white};
          &:hover:not(:disabled) { background: ${c.greenDark}; }
        `
    }
  }}

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`

export const IconButton = styled.button`
  display: inline-grid;
  place-items: center;
  width: 40px;
  height: 40px;
  border-radius: 999px;
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.text};
  &:hover { background: ${({ theme }) => theme.colors.surface2}; }
  &:disabled { opacity: 0.4; cursor: not-allowed; }
`

export const Card = styled.div`
  background: ${({ theme }) => theme.colors.surface};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radius};
  padding: 1.25rem;
`

const inputStyles = css`
  width: 100%;
  height: 48px;
  border-radius: ${({ theme }) => theme.radius};
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.bg};
  color: ${({ theme }) => theme.colors.text};
  padding: 0 0.9rem;

  &::placeholder { color: ${({ theme }) => theme.colors.textSubtle}; }
  &:focus { border-color: ${({ theme }) => theme.colors.green}; outline: none; }
  &[aria-invalid='true'] { border-color: ${({ theme }) => theme.colors.red}; }
`

export const Input = styled.input`
  ${inputStyles}
  &[type='date'], &[type='month'] { color-scheme: dark; }
`

export const Select = styled.select`
  ${inputStyles}
  appearance: none;
  background-image: linear-gradient(45deg, transparent 50%, #8d8d99 50%),
    linear-gradient(135deg, #8d8d99 50%, transparent 50%);
  background-position: calc(100% - 18px) 21px, calc(100% - 13px) 21px;
  background-size: 5px 5px;
  background-repeat: no-repeat;
  padding-right: 2rem;
`

const FieldWrap = styled.label`
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};
  min-width: 0;
`

const ErrorText = styled.span`
  color: ${({ theme }) => theme.colors.red};
  font-size: 0.8rem;
`

export function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: ReactNode
}) {
  return (
    <FieldWrap>
      <span>{label}</span>
      {children}
      {error && <ErrorText role="alert">{error}</ErrorText>}
    </FieldWrap>
  )
}

export const Row = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
`

export const Badge = styled.span<{ $tone?: 'green' | 'red' | 'yellow' | 'muted' | 'blue' }>`
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  ${({ theme, $tone = 'muted' }) => {
    const map = {
      green: theme.colors.green,
      red: theme.colors.red,
      yellow: theme.colors.yellow,
      blue: theme.colors.blue,
      muted: theme.colors.textMuted,
    }
    return css`
      color: ${map[$tone]};
      background: ${map[$tone]}1f;
    `
  }}
`

export const Muted = styled.span`
  color: ${({ theme }) => theme.colors.textMuted};
`

const spin = keyframes`to { transform: rotate(360deg); }`

export const Spinner = styled.div`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 3px solid ${({ theme }) => theme.colors.border};
  border-top-color: ${({ theme }) => theme.colors.green};
  animation: ${spin} 0.8s linear infinite;
  margin: 3rem auto;
`

export const PageTitle = styled.h1`
  font-size: 1.5rem;
  line-height: 1.2;
`

export const SectionTitle = styled.h2`
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.text};
  margin-bottom: 0.75rem;
`

export const Empty = styled.div`
  text-align: center;
  padding: 2.5rem 1rem;
  color: ${({ theme }) => theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;

  svg { color: ${({ theme }) => theme.colors.textSubtle}; }
`

export const ErrorBox = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.redStrong};
  background: ${({ theme }) => theme.colors.redStrong}22;
  color: ${({ theme }) => theme.colors.red};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
`

/** Botões Entrada / Saída */
const SegWrap = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.5rem;
`

const SegBtn = styled.button<{ $active: boolean; $tone: 'green' | 'red' }>`
  height: 48px;
  border-radius: ${({ theme }) => theme.radius};
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-weight: 700;
  border: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.surface2};
  color: ${({ theme }) => theme.colors.textMuted};

  ${({ theme, $active, $tone }) => {
    const c = $tone === 'green' ? theme.colors.green : theme.colors.red
    return $active
      ? css`
          color: ${theme.colors.white};
          background: ${$tone === 'green' ? theme.colors.greenDark : theme.colors.redStrong};
          border-color: ${c};
          svg { color: ${theme.colors.white}; }
        `
      : css`svg { color: ${c}; }`
  }}
`

export function TypeToggle({
  value,
  onChange,
  incomeLabel = 'Entrada',
  outcomeLabel = 'Saída',
  icons,
}: {
  value: 'income' | 'outcome'
  onChange: (v: 'income' | 'outcome') => void
  incomeLabel?: string
  outcomeLabel?: string
  icons: { income: ReactNode; outcome: ReactNode }
}) {
  return (
    <SegWrap role="radiogroup" aria-label="Tipo">
      <SegBtn
        type="button"
        role="radio"
        aria-checked={value === 'outcome'}
        $active={value === 'outcome'}
        $tone="red"
        onClick={() => onChange('outcome')}
      >
        {icons.outcome} {outcomeLabel}
      </SegBtn>
      <SegBtn
        type="button"
        role="radio"
        aria-checked={value === 'income'}
        $active={value === 'income'}
        $tone="green"
        onClick={() => onChange('income')}
      >
        {icons.income} {incomeLabel}
      </SegBtn>
    </SegWrap>
  )
}

export const CheckRow = styled.label`
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.95rem;
  color: ${({ theme }) => theme.colors.text};
  cursor: pointer;
  user-select: none;

  input {
    width: 20px;
    height: 20px;
    accent-color: ${({ theme }) => theme.colors.greenStrong};
  }
`

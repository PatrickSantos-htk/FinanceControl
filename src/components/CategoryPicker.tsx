import styled from 'styled-components'
import { categoryColor } from '@/domain/categories'
import { Input } from './ui'

const Chips = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
`

const Chip = styled.button<{ $active: boolean; $color: string }>`
  border: 1px solid ${({ $active, $color, theme }) => ($active ? $color : theme.colors.border)};
  background: ${({ $active, $color }) => ($active ? `${$color}26` : 'transparent')};
  color: ${({ theme }) => theme.colors.text};
  border-radius: 999px;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;

  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ $color }) => $color};
  }
`

export function CategoryPicker({
  value,
  onChange,
  options,
  invalid,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  invalid?: boolean
}) {
  return (
    <div>
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Escolha abaixo ou digite uma nova"
        aria-invalid={invalid}
        maxLength={60}
      />
      <Chips>
        {options.map((c) => (
          <Chip
            key={c}
            type="button"
            $active={c.toLowerCase() === value.trim().toLowerCase()}
            $color={categoryColor(c)}
            onClick={() => onChange(c)}
          >
            {c}
          </Chip>
        ))}
      </Chips>
    </div>
  )
}

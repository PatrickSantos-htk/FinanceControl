import * as Dialog from '@radix-ui/react-dialog'
import { X } from '@phosphor-icons/react'
import type { ReactNode } from 'react'
import styled, { keyframes } from 'styled-components'

const fade = keyframes`from { opacity: 0 } to { opacity: 1 }`
const up = keyframes`from { transform: translateY(24px); opacity: 0 } to { transform: none; opacity: 1 }`

const Overlay = styled(Dialog.Overlay)`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.7);
  animation: ${fade} 0.15s ease-out;
  z-index: 40;
`

/** No celular abre como folha de baixo para cima; no PC, centralizado. */
const Content = styled(Dialog.Content)`
  position: fixed;
  z-index: 50;
  left: 0;
  right: 0;
  bottom: 0;
  max-height: 92dvh;
  overflow-y: auto;
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: 16px 16px 0 0;
  padding: 1.5rem 1.25rem calc(1.5rem + env(safe-area-inset-bottom));
  animation: ${up} 0.2s ease-out;

  @media (min-width: ${({ theme }) => theme.bp.md}) {
    left: 50%;
    right: auto;
    bottom: auto;
    top: 50%;
    transform: translate(-50%, -50%);
    width: min(520px, calc(100vw - 2rem));
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: 12px;
    padding: 2rem;
    animation: ${fade} 0.15s ease-out;
  }
`

const Head = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
`

const Title = styled(Dialog.Title)`
  font-size: 1.25rem;
`

const Close = styled(Dialog.Close)`
  border: 0;
  background: transparent;
  color: ${({ theme }) => theme.colors.textMuted};
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border-radius: 999px;
  &:hover { background: ${({ theme }) => theme.colors.surface2}; color: ${({ theme }) => theme.colors.text}; }
`

export function Sheet({
  open,
  onOpenChange,
  title,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  children: ReactNode
}) {
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Overlay />
        <Content aria-describedby={undefined}>
          <Head>
            <Title>{title}</Title>
            <Close aria-label="Fechar">
              <X size={20} />
            </Close>
          </Head>
          {children}
        </Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

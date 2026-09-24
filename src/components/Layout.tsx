import { NavLink, Outlet } from 'react-router-dom'
import { useState } from 'react'
import { CalendarBlank, ChartPieSlice, CloudArrowDown, Repeat, SignOut, Wallet } from '@phosphor-icons/react'
import styled from 'styled-components'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/auth/AuthProvider'
import { useRecurrenceSync } from '@/hooks/queries'
import { NewPasswordSheet } from './NewPasswordSheet'
import { BackupSheet } from './BackupSheet'
import { lastBackupAt, TX_KEY } from '@/data/localApi'

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 20;
  background: ${({ theme }) => theme.colors.bg}ee;
  backdrop-filter: blur(8px);
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: env(safe-area-inset-top);
`

const HeaderInner = styled.div`
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  gap: 1.5rem;
`

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  font-size: 1.1rem;
  svg { color: ${({ theme }) => theme.colors.green}; }
`

const TopNav = styled.nav`
  display: none;
  gap: 0.25rem;
  @media (min-width: ${({ theme }) => theme.bp.md}) { display: flex; }

  a {
    display: inline-flex;
    align-items: center;
    gap: 0.4rem;
    padding: 0.5rem 0.85rem;
    border-radius: ${({ theme }) => theme.radius};
    color: ${({ theme }) => theme.colors.textMuted};
    text-decoration: none;
    font-weight: 700;
    font-size: 0.9rem;
    &:hover { color: ${({ theme }) => theme.colors.text}; }
    &.active {
      color: ${({ theme }) => theme.colors.text};
      background: ${({ theme }) => theme.colors.surface2};
    }
  }
`

const UserBox = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.8rem;
  color: ${({ theme }) => theme.colors.textMuted};

  span {
    max-width: 180px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    display: none;
    @media (min-width: ${({ theme }) => theme.bp.md}) { display: inline; }
  }

  button {
    border: 0;
    background: transparent;
    color: inherit;
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.5rem;
    border-radius: ${({ theme }) => theme.radius};
    &:hover { color: ${({ theme }) => theme.colors.text}; background: ${({ theme }) => theme.colors.surface2}; }
  }
`

const Reminder = styled.div`
  background: ${({ theme }) => theme.colors.yellow}1a;
  color: ${({ theme }) => theme.colors.yellow};
  font-size: 0.8rem;
  text-align: center;
  padding: 0.45rem 1rem;

  button {
    background: none;
    border: 0;
    color: inherit;
    text-decoration: underline;
    font-size: inherit;
    font-weight: 700;
    margin-left: 0.35rem;
  }
`

const BACKUP_EVERY_DAYS = 30

function needsBackup(): boolean {
  try {
    const hasData = (localStorage.getItem(TX_KEY) ?? '[]') !== '[]'
    if (!hasData) return false
    const last = lastBackupAt()
    if (!last) return true
    return Date.now() - new Date(last).getTime() > BACKUP_EVERY_DAYS * 86_400_000
  } catch {
    return false
  }
}

const Main = styled.main`
  max-width: ${({ theme }) => theme.maxWidth};
  margin: 0 auto;
  padding: 1.25rem 1rem calc(6rem + env(safe-area-inset-bottom));

  @media (min-width: ${({ theme }) => theme.bp.md}) {
    padding: 2rem 1.5rem 4rem;
  }
`

const BottomNav = styled.nav`
  position: fixed;
  z-index: 30;
  left: 0;
  right: 0;
  bottom: 0;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  background: ${({ theme }) => theme.colors.surface};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-bottom: env(safe-area-inset-bottom);

  @media (min-width: ${({ theme }) => theme.bp.md}) { display: none; }

  a {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    padding: 0.6rem 0 0.55rem;
    font-size: 0.72rem;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.textSubtle};
    text-decoration: none;
    &.active { color: ${({ theme }) => theme.colors.green}; }
  }
`

const links = [
  { to: '/', label: 'Mês', icon: CalendarBlank, end: true },
  { to: '/fixos', label: 'Fixos', icon: Repeat, end: false },
  { to: '/relatorios', label: 'Relatórios', icon: ChartPieSlice, end: false },
]

export function Layout() {
  const { user, local, signOut } = useAuth()
  const [backupOpen, setBackupOpen] = useState(false)
  const queryClient = useQueryClient()
  useRecurrenceSync()

  return (
    <>
      <Header>
        {local && !backupOpen && needsBackup() && (
          <Reminder>
            Seus dados ficam só neste aparelho.
            <button type="button" onClick={() => setBackupOpen(true)}>
              Fazer backup
            </button>
          </Reminder>
        )}
        <HeaderInner>
          <Brand>
            <Wallet size={26} weight="duotone" /> FinanceControl
          </Brand>
          <TopNav aria-label="Principal">
            {links.map(({ to, label, icon: Icon, end }) => (
              <NavLink key={to} to={to} end={end}>
                <Icon size={18} /> {label}
              </NavLink>
            ))}
          </TopNav>
          {local ? (
            <UserBox>
              <button type="button" onClick={() => setBackupOpen(true)} aria-label="Backup dos dados">
                <CloudArrowDown size={20} /> Backup
              </button>
            </UserBox>
          ) : (
            <UserBox>
              <span title={user?.email}>{user?.email}</span>
              <button type="button" onClick={async () => {
                  await signOut()
                  queryClient.clear()
                }} aria-label="Sair">
                <SignOut size={18} /> Sair
              </button>
            </UserBox>
          )}
        </HeaderInner>
      </Header>

      <Main>
        <Outlet />
      </Main>

      <BottomNav aria-label="Principal">
        {links.map(({ to, label, icon: Icon, end }) => (
          <NavLink key={to} to={to} end={end}>
            <Icon size={24} /> {label}
          </NavLink>
        ))}
      </BottomNav>

      {local ? <BackupSheet open={backupOpen} onOpenChange={setBackupOpen} /> : <NewPasswordSheet />}
    </>
  )
}

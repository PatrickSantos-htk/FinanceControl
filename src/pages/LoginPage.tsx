import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wallet } from '@phosphor-icons/react'
import styled from 'styled-components'
import { useAuth } from '@/auth/AuthProvider'
import { Button, Card, ErrorBox, Field, Input } from '@/components/ui'

const Page = styled.div`
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 1.5rem 1rem;
`

const Box = styled(Card)`
  width: min(420px, 100%);
  padding: 2rem 1.5rem;
  @media (min-width: ${({ theme }) => theme.bp.md}) { padding: 2.5rem; }
`

const Brand = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1.75rem;
  text-align: center;

  svg { color: ${({ theme }) => theme.colors.green}; }
  h1 { font-size: 1.5rem; }
  p { color: ${({ theme }) => theme.colors.textMuted}; font-size: 0.9rem; }
`

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`

const Switch = styled.p`
  margin-top: 1.25rem;
  text-align: center;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.textMuted};

  button {
    background: none;
    border: 0;
    color: ${({ theme }) => theme.colors.green};
    font-weight: 700;
    font-size: inherit;
  }
`

const Success = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.greenStrong};
  background: ${({ theme }) => theme.colors.greenDark}33;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
`

const schema = z.object({
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(6, 'Mínimo de 6 caracteres'),
})
type FormData = z.infer<typeof schema>

type Mode = 'signin' | 'signup' | 'reset'

export function LoginPage() {
  const { user, signIn, signUp, resetPassword } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  if (user) return <Navigate to="/" replace />

  async function onSubmit({ email, password }: FormData) {
    setError(null)
    setInfo(null)
    try {
      if (mode === 'signin') await signIn(email, password)
      else {
        const { needsConfirmation } = await signUp(email, password)
        if (needsConfirmation) setInfo('Conta criada! Confirme pelo link que enviamos para o seu e-mail e depois entre.')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado.')
    }
  }

  async function onReset() {
    setError(null)
    setInfo(null)
    const email = getValues('email')?.trim()
    if (!email) return setError('Digite seu e-mail acima para receber o link.')
    try {
      await resetPassword(email)
      setInfo('Se esse e-mail tiver conta, você vai receber um link para redefinir a senha.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Algo deu errado.')
    }
  }

  return (
    <Page>
      <Box>
        <Brand>
          <Wallet size={44} weight="duotone" />
          <h1>FinanceControl</h1>
          <p>Seus ganhos e gastos do mês, no celular e no PC.</p>
        </Brand>

        <Form onSubmit={handleSubmit(onSubmit)} noValidate>
          <Field label="E-mail" error={errors.email?.message}>
            <Input type="email" autoComplete="email" {...register('email')} aria-invalid={!!errors.email} />
          </Field>
          {mode !== 'reset' && (
            <Field label="Senha" error={errors.password?.message}>
              <Input
                type="password"
                autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                {...register('password')}
                aria-invalid={!!errors.password}
              />
            </Field>
          )}

          {error && <ErrorBox role="alert">{error}</ErrorBox>}
          {info && <Success role="status">{info}</Success>}

          {mode === 'reset' ? (
            <Button type="button" $block onClick={onReset}>
              Enviar link de redefinição
            </Button>
          ) : (
            <Button type="submit" $block disabled={isSubmitting}>
              {isSubmitting ? 'Aguarde…' : mode === 'signin' ? 'Entrar' : 'Criar conta'}
            </Button>
          )}
        </Form>

        <Switch>
          {mode === 'signin' ? (
            <>
              Não tem conta?{' '}
              <button type="button" onClick={() => setMode('signup')}>
                Criar conta
              </button>
              <br />
              <button type="button" onClick={() => setMode('reset')} style={{ marginTop: '0.5rem' }}>
                Esqueci a senha
              </button>
            </>
          ) : (
            <>
              Já tem conta?{' '}
              <button type="button" onClick={() => setMode('signin')}>
                Entrar
              </button>
            </>
          )}
        </Switch>
      </Box>
    </Page>
  )
}

import type { FormEvent } from 'react'
import { useState } from 'react'
import { useAuth } from '@/auth/AuthProvider'
import { Sheet } from './Sheet'
import { Button, ErrorBox, Field, Input } from './ui'

/** Aparece quando o usuário abre o link de "esqueci a senha" do e-mail. */
export function NewPasswordSheet() {
  const { recovering, updatePassword } = useAuth()
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  async function save(e: FormEvent) {
    e.preventDefault()
    if (password.length < 6) return setError('A senha precisa ter pelo menos 6 caracteres.')
    setSaving(true)
    setError(null)
    try {
      await updatePassword(password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={recovering} onOpenChange={() => {}} title="Criar nova senha">
      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <Field label="Nova senha">
          <Input
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>
        {error && <ErrorBox>{error}</ErrorBox>}
        <Button type="submit" $block disabled={saving}>
          {saving ? 'Salvando…' : 'Salvar nova senha'}
        </Button>
      </form>
    </Sheet>
  )
}

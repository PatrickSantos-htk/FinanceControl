import { useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { DownloadSimple, Trash, UploadSimple } from '@phosphor-icons/react'
import styled from 'styled-components'
import { downloadFile } from '@/domain/csv'
import { clearAllData, exportBackup, importBackup, lastBackupAt } from '@/data/localApi'
import { Sheet } from './Sheet'
import { Button, ErrorBox } from './ui'

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  font-size: 0.9rem;
  color: ${({ theme }) => theme.colors.textMuted};

  strong { color: ${({ theme }) => theme.colors.text}; }
`

const Ok = styled.div`
  border: 1px solid ${({ theme }) => theme.colors.greenStrong};
  background: ${({ theme }) => theme.colors.greenDark}33;
  color: ${({ theme }) => theme.colors.text};
  border-radius: ${({ theme }) => theme.radius};
  padding: 0.75rem 1rem;
`

const Danger = styled.div`
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  padding-top: 1rem;
  margin-top: 0.5rem;
`

function formatWhen(iso: string | null) {
  if (!iso) return 'nunca'
  return new Date(iso).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

export function BackupSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const qc = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)
  const [msg, setMsg] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)
  const [last, setLast] = useState(lastBackupAt)

  function refresh() {
    qc.invalidateQueries()
  }

  function onExport() {
    const b = exportBackup()
    downloadFile(
      `financecontrol-backup-${b.exportedAt.slice(0, 10)}.json`,
      JSON.stringify(b, null, 2),
      'application/json',
    )
    setLast(b.exportedAt)
    setError(null)
    setMsg(`Backup baixado com ${b.transactions.length} lançamentos e ${b.recurrences.length} fixos.`)
  }

  async function onImport(file: File | undefined) {
    if (!file) return
    setMsg(null)
    setError(null)
    try {
      const r = importBackup(await file.text())
      refresh()
      setMsg(`Restaurado: ${r.transactions} lançamentos e ${r.recurrences} fixos.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível restaurar.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function onClear() {
    if (!confirmClear) return setConfirmClear(true)
    clearAllData()
    setConfirmClear(false)
    refresh()
    setMsg('Todos os dados deste aparelho foram apagados.')
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(o) => {
        onOpenChange(o)
        if (!o) {
          setMsg(null)
          setError(null)
          setConfirmClear(false)
        }
      }}
      title="Backup dos seus dados"
    >
      <Body>
        <p>
          Seus dados ficam salvos <strong>só neste aparelho e navegador</strong>. Baixe um backup de vez em quando
          e use-o para passar os dados para outro aparelho (celular ↔ PC) ou recuperar se limpar o navegador.
        </p>
        <p>
          Último backup: <strong>{formatWhen(last)}</strong>
        </p>

        <Button type="button" $block onClick={onExport}>
          <DownloadSimple size={18} /> Baixar backup (.json)
        </Button>

        <Button type="button" $block $variant="outline" onClick={() => fileRef.current?.click()}>
          <UploadSimple size={18} /> Restaurar de um backup
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept="application/json,.json"
          hidden
          onChange={(e) => onImport(e.target.files?.[0])}
        />
        <p style={{ fontSize: '0.8rem', marginTop: '-0.5rem' }}>
          Restaurar substitui tudo o que está neste aparelho pelos dados do arquivo.
        </p>

        {msg && <Ok role="status">{msg}</Ok>}
        {error && <ErrorBox role="alert">{error}</ErrorBox>}

        <Danger>
          <Button type="button" $variant="danger" onClick={onClear}>
            <Trash size={18} /> {confirmClear ? 'Confirmar: apagar tudo' : 'Apagar todos os dados'}
          </Button>
        </Danger>
      </Body>
    </Sheet>
  )
}

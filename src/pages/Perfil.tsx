import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  ExternalLink,
  IdCard,
  KeyRound,
  LockKeyhole,
  LogOut,
  Mail,
  ShieldCheck,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { EmptyState } from '../components/EmptyState'
import { useAccess } from '../context/AccessContext'
import { useToast } from '../hooks/use-toast'
import { AreaBadge, getAreaIcon } from '../lib/areaIcons'
import { formatarData, iniciais } from '../lib/format'
import { STATUS_MAP } from '../types/access'

export default function Perfil() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { usuarioLogado, perfis, sistemas, sair, trocarMinhaSenha } = useAccess()
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erro, setErro] = useState('')

  if (!usuarioLogado) return null

  const meusSistemas = sistemas.filter((sistema) => usuarioLogado.sistemasIds.includes(sistema.id))

  const salvarSenha = (event: React.FormEvent) => {
    event.preventDefault()
    setErro('')
    if (senhaAtual !== usuarioLogado.senha) {
      setErro('A senha atual está incorreta.')
      return
    }
    if (novaSenha.length < 6) {
      setErro('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (novaSenha !== confirmacao) {
      setErro('A confirmação não corresponde à nova senha.')
      return
    }
    trocarMinhaSenha(novaSenha)
    setSenhaAtual('')
    setNovaSenha('')
    setConfirmacao('')
    toast({
      title: 'Senha alterada com sucesso.',
      description: 'Sua nova senha já pode ser usada nesta sessão.',
      duration: 3500,
    })
  }

  const encerrarSessao = () => {
    sair()
    navigate('/login')
    toast({ title: 'Sessão encerrada.', description: 'Até a próxima!', duration: 3500 })
  }

  return (
    <div className="profile-page page-stack">
      <PageHeader
        eyebrow="CONTA PESSOAL"
        title="Meu Perfil"
        description="Consulte seus dados e portais disponíveis."
        actions={
          <Button
            variant="outline"
            className="button-secondary button-logout"
            onClick={encerrarSessao}
          >
            <LogOut size={17} /> Sair
          </Button>
        }
      />

      <section className="profile-grid">
        <article className="profile-card glass-surface">
          <div className="profile-identity">
            <span className="profile-avatar">{iniciais(usuarioLogado.nome)}</span>
            <span>
              <div className="flex items-center gap-2">
                <small>COLABORADOR</small>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 ${
                    usuarioLogado.statusId === 1
                      ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                      : usuarioLogado.statusId === 2
                        ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                        : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                  }`}
                >
                  <i
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      background: STATUS_MAP[usuarioLogado.statusId ?? 1]?.color ?? '#10B981',
                    }}
                  />
                  {STATUS_MAP[usuarioLogado.statusId ?? 1]?.nome ?? 'Ativo'}
                </span>
              </div>
              <h2>{usuarioLogado.nome}</h2>
              <p>{usuarioLogado.departamento || 'Sem departamento'}</p>
            </span>
          </div>
          <div className="profile-details">
            <div>
              <span className="detail-icon">
                <Mail size={17} />
              </span>
              <span>
                <small>E-mail corporativo</small>
                <strong>{usuarioLogado.email}</strong>
              </span>
            </div>
            <div>
              <span className="detail-icon">
                <Building2 size={17} />
              </span>
              <span>
                <small>Departamento</small>
                <strong>{usuarioLogado.departamento}</strong>
              </span>
            </div>
            <div>
              <span className="detail-icon">
                <IdCard size={17} />
              </span>
              <span>
                <small>ID Microsoft (GUID)</small>
                <strong
                  className="font-mono text-xs"
                  title={usuarioLogado.idMicrosoft ?? 'Não configurado'}
                >
                  {usuarioLogado.idMicrosoft || 'Não configurado'}
                </strong>
              </span>
            </div>
            <div>
              <span className="detail-icon">
                <ShieldCheck size={17} />
              </span>
              <span>
                <small>Membro desde</small>
                <strong>{formatarData(usuarioLogado.criadoEm)}</strong>
              </span>
            </div>
          </div>
        </article>

        <article className="password-card glass-surface">
          <div className="card-heading">
            <div>
              <span className="card-kicker">SEGURANÇA</span>
              <h2>Alterar minha senha</h2>
            </div>
            <span className="dialog-icon">
              <LockKeyhole size={20} />
            </span>
          </div>
          <p className="card-description">
            A alteração vale apenas durante esta sessão de demonstração.
          </p>
          <form onSubmit={salvarSenha}>
            <div className="form-field">
              <label htmlFor="senha-atual">Senha atual</label>
              <input
                id="senha-atual"
                className="field"
                type="password"
                value={senhaAtual}
                onChange={(event) => setSenhaAtual(event.target.value)}
                placeholder="Digite sua senha atual"
                required
              />
            </div>
            <div className="password-columns">
              <div className="form-field">
                <label htmlFor="nova-senha">Nova senha</label>
                <input
                  id="nova-senha"
                  className="field"
                  type="password"
                  value={novaSenha}
                  onChange={(event) => setNovaSenha(event.target.value)}
                  placeholder="Mínimo de 6 caracteres"
                  required
                />
              </div>
              <div className="form-field">
                <label htmlFor="confirmar-senha">Confirmar nova senha</label>
                <input
                  id="confirmar-senha"
                  className="field"
                  type="password"
                  value={confirmacao}
                  onChange={(event) => setConfirmacao(event.target.value)}
                  placeholder="Repita a nova senha"
                  required
                />
              </div>
            </div>
            {erro && <p className="form-error profile-password-error">{erro}</p>}
            <Button className="button-primary" type="submit">
              <KeyRound size={16} /> Atualizar senha
            </Button>
          </form>
        </article>
      </section>

      <section className="my-systems-section">
        <div className="section-heading">
          <div>
            <span className="card-kicker">MEUS ACESSOS</span>
            <h2>Sistemas disponíveis</h2>
            <p>Portais atribuídos ao seu perfil.</p>
          </div>
          <span className="count-badge">{meusSistemas.length}</span>
        </div>
        {meusSistemas.length ? (
          <div className="my-systems-grid">
            {meusSistemas.map((sistema) => {
              const IconeArea = getAreaIcon(sistema.area)
              const vinculo = usuarioLogado.vinculos?.find((v) => v.sistemaId === sistema.id)
              const perfilVinculado = vinculo?.perfilId
                ? perfis.find((p) => p.id === vinculo.perfilId)
                : undefined

              return (
                <div
                  className="my-system-card glass-surface flex flex-col justify-between"
                  key={sistema.id}
                >
                  <a
                    href={sistema.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-3 w-full"
                  >
                    <span className="system-icon" title={`Área: ${sistema.area}`}>
                      <IconeArea size={21} />
                    </span>
                    <span className="flex-1">
                      <strong>{sistema.nome}</strong>
                      <AreaBadge area={sistema.area} size="sm" />
                      <em>{sistema.url.replace(/^https?:\/\//, '')}</em>
                    </span>
                    <ExternalLink size={17} />
                  </a>

                  {perfilVinculado && (
                    <div className="mt-2 pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs text-[var(--text-secondary)]">
                      <span>
                        Perfil:{' '}
                        <strong className="text-[var(--text-primary)]">
                          {perfilVinculado.nome}
                        </strong>
                      </span>
                      <span className="text-[10px] bg-[var(--color-primary-soft)] text-[var(--color-primary)] font-medium px-2 py-0.5 rounded">
                        {perfilVinculado.nivel || 'Operacional'}
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="glass-surface empty-card">
            <EmptyState
              icon={ShieldCheck}
              title="Nenhum acesso por aqui ainda."
              description="Fale com o administrador para solicitar acesso a um portal interno."
            />
          </div>
        )}
      </section>
    </div>
  )
}

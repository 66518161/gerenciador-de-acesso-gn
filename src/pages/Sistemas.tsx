import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ExternalLink,
  FolderKanban,
  Globe2,
  Pencil,
  Plus,
  Search,
  ServerCog,
  Trash2,
  UsersRound,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useAccess } from '../context/AccessContext'
import { useToast } from '../hooks/use-toast'
import { AreaBadge, AreaSelectDropdown, getAreaIcon } from '../lib/areaIcons'
import { classePorTexto, pluralizar } from '../lib/format'
import type { Sistema, SistemaInput } from '../types/access'

const formVazio: SistemaInput = { nome: '', url: '', area: '' }

export default function Sistemas() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { sistemas, usuarios, criarSistema, atualizarSistema, excluirSistema } = useAccess()
  const [busca, setBusca] = useState(() => searchParams.get('q') ?? '')
  const [area, setArea] = useState(() => searchParams.get('area') ?? 'todas')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Sistema | null>(null)
  const [form, setForm] = useState<SistemaInput>(formVazio)
  const [erros, setErros] = useState<Partial<Record<keyof SistemaInput, string>>>({})
  const [novaArea, setNovaArea] = useState(false)
  const [excluindo, setExcluindo] = useState<Sistema | null>(null)

  useEffect(() => {
    const parametroArea = searchParams.get('area')
    const parametroBusca = searchParams.get('q')
    if (parametroArea) setArea(parametroArea)
    if (parametroBusca) setBusca(parametroBusca)
  }, [searchParams])

  const areas = useMemo(
    () => [...new Set(sistemas.map((item) => item.area))].sort((a, b) => a.localeCompare(b)),
    [sistemas],
  )

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return sistemas.filter((sistema) => {
      const correspondeBusca =
        !termo || `${sistema.nome} ${sistema.url}`.toLocaleLowerCase('pt-BR').includes(termo)
      return correspondeBusca && (area === 'todas' || sistema.area === area)
    })
  }, [area, busca, sistemas])

  const abrirNovo = () => {
    setEditando(null)
    setForm(formVazio)
    setErros({})
    setNovaArea(false)
    setModalAberto(true)
  }

  const abrirEdicao = (sistema: Sistema) => {
    setEditando(sistema)
    setForm({ nome: sistema.nome, url: sistema.url, area: sistema.area })
    setErros({})
    setNovaArea(!areas.includes(sistema.area))
    setModalAberto(true)
  }

  const validar = () => {
    const proximosErros: Partial<Record<keyof SistemaInput, string>> = {}
    if (!form.nome.trim()) proximosErros.nome = 'Informe o nome do sistema.'
    if (!form.url.trim()) proximosErros.url = 'Informe a URL do sistema.'
    else {
      try {
        const url = new URL(form.url)
        if (!['http:', 'https:'].includes(url.protocol))
          proximosErros.url = 'Use uma URL iniciada por http:// ou https://.'
      } catch {
        proximosErros.url = 'Informe uma URL válida, como https://portal.empresa.com.'
      }
    }
    if (!form.area.trim()) proximosErros.area = 'Informe a área responsável.'
    setErros(proximosErros)
    return Object.keys(proximosErros).length === 0
  }

  const salvar = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validar()) return
    const dados = { nome: form.nome.trim(), url: form.url.trim(), area: form.area.trim() }
    if (editando) {
      atualizarSistema(editando.id, dados)
      toast({
        title: 'Sistema atualizado com sucesso.',
        description: `${dados.nome} já está com as informações novas.`,
        duration: 3500,
      })
    } else {
      criarSistema(dados)
      toast({
        title: 'Sistema criado com sucesso.',
        description: `${dados.nome} foi adicionado ao catálogo.`,
        duration: 3500,
      })
    }
    setModalAberto(false)
  }

  const confirmarExclusao = () => {
    if (!excluindo) return
    excluirSistema(excluindo.id)
    toast({
      title: 'Sistema excluído.',
      description: 'Os vínculos de acesso relacionados também foram removidos.',
      duration: 3500,
    })
    setExcluindo(null)
  }

  const limparFiltros = () => {
    setBusca('')
    setArea('todas')
    setSearchParams({})
  }

  return (
    <div className="systems-page page-stack">
      <PageHeader
        eyebrow="CATÁLOGO INTERNO"
        title="Sistemas"
        description="Portais internos gerenciados."
        actions={
          <Button className="button-primary" onClick={abrirNovo}>
            <Plus size={17} /> Novo sistema
          </Button>
        }
      />

      <section className="filter-bar glass-surface">
        <div className="search-field">
          <Search size={17} />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar por nome ou URL..."
            aria-label="Buscar sistemas"
          />
        </div>
        <div className="select-field">
          <span>Área</span>
          <AreaSelectDropdown
            value={area}
            onChange={(proxima) => {
              setArea(proxima)
              setSearchParams((prev) => {
                const next = new URLSearchParams(prev)
                if (proxima === 'todas') next.delete('area')
                else next.set('area', proxima)
                return next
              })
            }}
            areas={areas}
            allowAll
            allLabel="Todas as áreas"
            aria-label="Filtrar por área"
          />
        </div>
        <span className="result-count">
          {pluralizar(filtrados.length, 'resultado', 'resultados')}
        </span>
      </section>

      {filtrados.length ? (
        <section className="systems-grid">
          {filtrados.map((sistema, index) => {
            const totalUsuarios = usuarios.filter((usuario) =>
              usuario.sistemasIds.includes(sistema.id),
            ).length
            const cor = classePorTexto(sistema.area)
            const IconeArea = getAreaIcon(sistema.area)
            return (
              <article
                className={`system-card glass-surface stagger-${(index % 5) + 1}`}
                key={sistema.id}
              >
                <div className="system-card__top">
                  <span
                    className={`system-icon system-icon--${cor}`}
                    title={`Área: ${sistema.area}`}
                  >
                    <IconeArea size={22} />
                  </span>
                  <div className="card-actions">
                    <button
                      onClick={() => abrirEdicao(sistema)}
                      aria-label={`Editar ${sistema.nome}`}
                      title="Editar"
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      className="danger-action"
                      onClick={() => setExcluindo(sistema)}
                      aria-label={`Excluir ${sistema.nome}`}
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="system-card__copy">
                  <h2>{sistema.nome}</h2>
                  <AreaBadge area={sistema.area} size="sm" />
                </div>
                <a className="system-url" href={sistema.url} target="_blank" rel="noreferrer">
                  <Globe2 size={15} />
                  <span>{sistema.url.replace(/^https?:\/\//, '')}</span>
                  <ExternalLink size={14} />
                </a>
                <div className="system-card__footer">
                  <span>
                    <UsersRound size={16} />
                    {pluralizar(totalUsuarios, 'usuário com acesso', 'usuários com acesso')}
                  </span>
                  <span className="system-status">
                    <i /> Ativo
                  </span>
                </div>
              </article>
            )
          })}
        </section>
      ) : (
        <div className="glass-surface empty-card">
          <EmptyState
            icon={FolderKanban}
            title="Nenhum sistema por aqui ainda."
            description="Tente ajustar os filtros ou cadastre um novo portal interno."
            action={
              <Button variant="outline" className="button-secondary" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            }
          />
        </div>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="glass-surface app-dialog">
          <form onSubmit={salvar} noValidate>
            <DialogHeader>
              <span className="dialog-icon">
                <ServerCog size={22} />
              </span>
              <DialogTitle>{editando ? 'Editar sistema' : 'Novo sistema'}</DialogTitle>
              <DialogDescription>
                {editando
                  ? 'Atualize as informações do portal interno.'
                  : 'Cadastre um portal para gerenciar seus acessos.'}
              </DialogDescription>
            </DialogHeader>
            <div className="dialog-form">
              <div className="form-field">
                <label htmlFor="sistema-nome">
                  Nome <b>*</b>
                </label>
                <input
                  id="sistema-nome"
                  className="field"
                  value={form.nome}
                  onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
                  placeholder="Ex.: Portal de Qualidade"
                  autoFocus
                />
                {erros.nome && <p className="form-error">{erros.nome}</p>}
              </div>
              <div className="form-field">
                <label htmlFor="sistema-url">
                  URL <b>*</b>
                </label>
                <input
                  id="sistema-url"
                  className="field"
                  value={form.url}
                  onChange={(event) => setForm((atual) => ({ ...atual, url: event.target.value }))}
                  placeholder="https://portal.empresa.com"
                />
                {erros.url && <p className="form-error">{erros.url}</p>}
              </div>
              <div className="form-field">
                <label htmlFor="sistema-area">
                  Área responsável <b>*</b>
                </label>
                {novaArea ? (
                  <input
                    id="sistema-area"
                    className="field"
                    value={form.area}
                    onChange={(event) =>
                      setForm((atual) => ({ ...atual, area: event.target.value }))
                    }
                    placeholder="Digite uma nova área (ex.: Operações, TI, Marketing)"
                    autoFocus
                  />
                ) : (
                  <AreaSelectDropdown
                    id="sistema-area"
                    value={form.area}
                    onChange={(val) => setForm((atual) => ({ ...atual, area: val }))}
                    areas={areas}
                    placeholder="Selecione uma área responsável"
                    allowCustom
                    onSelectCustom={() => {
                      setNovaArea(true)
                      setForm((atual) => ({ ...atual, area: '' }))
                    }}
                    aria-label="Área responsável"
                  />
                )}
                {erros.area && <p className="form-error">{erros.area}</p>}
                {novaArea && (
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => {
                      setNovaArea(false)
                      setForm((atual) => ({ ...atual, area: '' }))
                    }}
                  >
                    Escolher uma área existente
                  </button>
                )}
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="button-secondary"
                onClick={() => setModalAberto(false)}
              >
                Cancelar
              </Button>
              <Button className="button-primary" type="submit">
                {editando ? 'Salvar alterações' : 'Criar sistema'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(excluindo)}
        onOpenChange={(aberto) => !aberto && setExcluindo(null)}
        title="Excluir sistema?"
        description={
          excluindo
            ? `Esta ação removerá também os vínculos de acesso de ${usuarios.filter((usuario) => usuario.sistemasIds.includes(excluindo.id)).length} usuário(s). O portal “${excluindo.nome}” sairá do catálogo.`
            : ''
        }
        onConfirm={confirmarExclusao}
      />
    </div>
  )
}

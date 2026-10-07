import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  Check,
  ChevronDown,
  IdCard,
  Pencil,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
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
import { classePorTexto, iniciais, pluralizar } from '../lib/format'
import type { Usuario, UsuarioInput } from '../types/access'

const formVazio: UsuarioInput = {
  nome: '',
  email: '',
  departamento: '',
  senha: '',
  idMicrosoft: '',
  sistemasIds: [],
}

export default function Usuarios() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const { toast } = useToast()
  const { sistemas, usuarios, usuarioLogado, criarUsuario, atualizarUsuario, excluirUsuario } =
    useAccess()
  const [busca, setBusca] = useState(() => searchParams.get('q') ?? '')
  const [departamento, setDepartamento] = useState(() => searchParams.get('dept') ?? 'todos')
  const [sistemaFiltro, setSistemaFiltro] = useState(() => searchParams.get('system') ?? 'todos')
  const [modalAberto, setModalAberto] = useState(false)
  const [editando, setEditando] = useState<Usuario | null>(null)
  const [form, setForm] = useState<UsuarioInput>(formVazio)
  const [erros, setErros] = useState<Partial<Record<keyof UsuarioInput, string>>>({})
  const [novoDepartamento, setNovoDepartamento] = useState(false)
  const [buscaSistemas, setBuscaSistemas] = useState('')
  const [excluindo, setExcluindo] = useState<Usuario | null>(null)

  const departamentos = useMemo(
    () =>
      [...new Set(usuarios.map((item) => item.departamento))].sort((a, b) => a.localeCompare(b)),
    [usuarios],
  )

  useEffect(() => {
    const parametroBusca = searchParams.get('q')
    const parametroDept = searchParams.get('dept')
    const parametroSistema = searchParams.get('system')
    if (parametroBusca) setBusca(parametroBusca)
    if (parametroDept) setDepartamento(parametroDept)
    if (parametroSistema) setSistemaFiltro(parametroSistema)
    if (searchParams.get('novo') === '1') {
      setEditando(null)
      setForm(formVazio)
      setErros({})
      setNovoDepartamento(false)
      setBuscaSistemas('')
      setModalAberto(true)
      const proximos = new URLSearchParams(searchParams)
      proximos.delete('novo')
      setSearchParams(proximos, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return usuarios.filter((usuario) => {
      const correspondeBusca =
        !termo ||
        `${usuario.nome} ${usuario.email} ${usuario.idMicrosoft}`
          .toLocaleLowerCase('pt-BR')
          .includes(termo)
      const correspondeDept = departamento === 'todos' || usuario.departamento === departamento
      const correspondeSistema =
        sistemaFiltro === 'todos' ||
        (sistemaFiltro === 'sem-atribuicao'
          ? usuario.sistemasIds.length === 0
          : usuario.sistemasIds.includes(sistemaFiltro))
      return correspondeBusca && correspondeDept && correspondeSistema
    })
  }, [busca, departamento, sistemaFiltro, usuarios])

  const sistemasDoFormulario = useMemo(() => {
    const termo = buscaSistemas.trim().toLocaleLowerCase('pt-BR')
    return sistemas.filter(
      (sistema) =>
        !termo || `${sistema.nome} ${sistema.area}`.toLocaleLowerCase('pt-BR').includes(termo),
    )
  }, [buscaSistemas, sistemas])

  const abrirNovo = () => {
    setEditando(null)
    setForm(formVazio)
    setErros({})
    setNovoDepartamento(false)
    setBuscaSistemas('')
    setModalAberto(true)
  }

  const abrirEdicao = (usuario: Usuario) => {
    setEditando(usuario)
    setForm({
      nome: usuario.nome,
      email: usuario.email,
      departamento: usuario.departamento,
      senha: '',
      idMicrosoft: usuario.idMicrosoft,
      sistemasIds: [...usuario.sistemasIds],
    })
    setErros({})
    setNovoDepartamento(!departamentos.includes(usuario.departamento))
    setBuscaSistemas('')
    setModalAberto(true)
  }

  const validar = () => {
    const proximosErros: Partial<Record<keyof UsuarioInput, string>> = {}
    if (!form.nome.trim()) proximosErros.nome = 'Informe o nome do usuário.'
    if (!form.email.trim()) proximosErros.email = 'Informe o e-mail corporativo.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      proximosErros.email = 'Informe um e-mail válido.'
    else if (
      usuarios.some(
        (usuario) =>
          usuario.id !== editando?.id &&
          usuario.email.toLowerCase() === form.email.trim().toLowerCase(),
      )
    )
      proximosErros.email = 'Este e-mail já está cadastrado.'
    if (!form.departamento.trim()) proximosErros.departamento = 'Informe o departamento.'
    if (!editando && !form.senha) proximosErros.senha = 'Crie uma senha inicial.'
    else if (form.senha && form.senha.length < 6)
      proximosErros.senha = 'A senha deve ter pelo menos 6 caracteres.'
    if (!form.idMicrosoft.trim()) proximosErros.idMicrosoft = 'Informe o ID Microsoft.'
    setErros(proximosErros)
    return Object.keys(proximosErros).length === 0
  }

  const salvar = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validar()) return
    const dados: UsuarioInput = {
      nome: form.nome.trim(),
      email: form.email.trim().toLowerCase(),
      departamento: form.departamento.trim(),
      senha: form.senha,
      idMicrosoft: form.idMicrosoft.trim(),
      sistemasIds: [...form.sistemasIds],
    }
    if (editando) {
      atualizarUsuario(editando.id, dados)
      toast({
        title: 'Usuário atualizado com sucesso.',
        description: 'As informações e os acessos foram atualizados.',
        duration: 3500,
      })
    } else {
      criarUsuario(dados)
      toast({
        title: 'Usuário criado com sucesso.',
        description: `${dados.nome} foi adicionado ao gerenciador.`,
        duration: 3500,
      })
    }
    setModalAberto(false)
  }

  const alternarSistema = (id: string) => {
    setForm((atual) => ({
      ...atual,
      sistemasIds: atual.sistemasIds.includes(id)
        ? atual.sistemasIds.filter((sistemaId) => sistemaId !== id)
        : [...atual.sistemasIds, id],
    }))
  }

  const confirmarExclusao = () => {
    if (!excluindo) return
    const excluiuProprio = excluindo.id === usuarioLogado?.id
    excluirUsuario(excluindo.id)
    setExcluindo(null)
    toast({
      title: 'Usuário excluído.',
      description: 'O cadastro e seu histórico de atribuições foram removidos.',
      duration: 3500,
    })
    if (excluiuProprio) navigate('/login')
  }

  const limparFiltros = () => {
    setBusca('')
    setDepartamento('todos')
    setSistemaFiltro('todos')
    setSearchParams({})
  }

  const renderPillsSistemas = (usuario: Usuario) => {
    const vinculados = usuario.sistemasIds
      .map((id) => sistemas.find((sistema) => sistema.id === id))
      .filter(Boolean)
    if (!vinculados.length) return <span className="no-access-pill">Sem atribuição</span>
    return (
      <div className="system-pills">
        {vinculados.slice(0, 3).map((sistema) => (
          <span key={sistema!.id}>{sistema!.nome}</span>
        ))}
        {vinculados.length > 3 && <span className="more-pill">+{vinculados.length - 3}</span>}
      </div>
    )
  }

  return (
    <div className="users-page page-stack">
      <PageHeader
        eyebrow="PESSOAS E PERMISSÕES"
        title="Usuários"
        description="Colaboradores e seus acessos."
        actions={
          <Button className="button-primary" onClick={abrirNovo}>
            <Plus size={17} /> Novo usuário
          </Button>
        }
      />

      <section className="filter-bar filter-bar--users glass-surface">
        <div className="search-field">
          <Search size={17} />
          <input
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar nome, e-mail ou ID Microsoft..."
            aria-label="Buscar usuários"
          />
        </div>
        <label className="select-field">
          <span>Departamento</span>
          <select value={departamento} onChange={(event) => setDepartamento(event.target.value)}>
            <option value="todos">Todos</option>
            {departamentos.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </label>
        <label className="select-field">
          <span>Sistema</span>
          <select value={sistemaFiltro} onChange={(event) => setSistemaFiltro(event.target.value)}>
            <option value="todos">Todos os sistemas</option>
            <option value="sem-atribuicao">Sem atribuição</option>
            {sistemas.map((item) => (
              <option key={item.id} value={item.id}>
                {item.nome}
              </option>
            ))}
          </select>
        </label>
        <span className="result-count">{pluralizar(filtrados.length, 'usuário', 'usuários')}</span>
      </section>

      {filtrados.length ? (
        <section className="users-table-wrap glass-surface">
          <table className="users-table">
            <thead>
              <tr>
                <th>Usuário</th>
                <th>Departamento</th>
                <th>ID Microsoft</th>
                <th>Sistemas</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((usuario) => {
                const primeiroSistema = sistemas.find((sistema) =>
                  usuario.sistemasIds.includes(sistema.id),
                )
                const cor = classePorTexto(primeiroSistema?.area ?? usuario.departamento)
                return (
                  <tr key={usuario.id}>
                    <td data-label="Usuário">
                      <div className="user-cell">
                        <span className={`avatar avatar--tone-${cor}`}>
                          {iniciais(usuario.nome)}
                        </span>
                        <span>
                          <strong>{usuario.nome}</strong>
                          <small>{usuario.email}</small>
                        </span>
                      </div>
                    </td>
                    <td data-label="Departamento">
                      <span className="department-pill">{usuario.departamento}</span>
                    </td>
                    <td data-label="ID Microsoft">
                      <span className="microsoft-id" title={usuario.idMicrosoft}>
                        <IdCard size={14} />
                        {usuario.idMicrosoft}
                      </span>
                    </td>
                    <td data-label="Sistemas">{renderPillsSistemas(usuario)}</td>
                    <td data-label="Ações">
                      <div className="table-actions">
                        <button
                          onClick={() => abrirEdicao(usuario)}
                          aria-label={`Editar ${usuario.nome}`}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="danger-action"
                          onClick={() => setExcluindo(usuario)}
                          aria-label={`Excluir ${usuario.nome}`}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ) : (
        <div className="glass-surface empty-card">
          <EmptyState
            icon={UsersRound}
            title="Nenhum usuário encontrado."
            description="Ajuste os filtros ou cadastre um novo colaborador."
            action={
              <Button variant="outline" className="button-secondary" onClick={limparFiltros}>
                Limpar filtros
              </Button>
            }
          />
        </div>
      )}

      <Dialog open={modalAberto} onOpenChange={setModalAberto}>
        <DialogContent className="glass-surface app-dialog app-dialog--wide">
          <form onSubmit={salvar} noValidate>
            <DialogHeader>
              <span className="dialog-icon">
                <UserPlus size={22} />
              </span>
              <DialogTitle>{editando ? 'Editar usuário' : 'Novo usuário'}</DialogTitle>
              <DialogDescription>
                {editando
                  ? 'Atualize o cadastro e os sistemas que este usuário acessa.'
                  : 'Cadastre um colaborador e defina seus acessos iniciais.'}
              </DialogDescription>
            </DialogHeader>
            <div className="dialog-form dialog-form--two-columns">
              <div className="form-field">
                <label htmlFor="usuario-nome">
                  Nome <b>*</b>
                </label>
                <input
                  id="usuario-nome"
                  className="field"
                  value={form.nome}
                  onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
                  placeholder="Nome completo"
                  autoFocus
                />
                {erros.nome && <p className="form-error">{erros.nome}</p>}
              </div>
              <div className="form-field">
                <label htmlFor="usuario-email">
                  E-mail <b>*</b>
                </label>
                <input
                  id="usuario-email"
                  className="field"
                  type="email"
                  value={form.email}
                  onChange={(event) =>
                    setForm((atual) => ({ ...atual, email: event.target.value }))
                  }
                  placeholder="nome@empresa.com"
                />
                {erros.email && <p className="form-error">{erros.email}</p>}
              </div>
              <div className="form-field">
                <label htmlFor="usuario-departamento">
                  Departamento <b>*</b>
                </label>
                {novoDepartamento ? (
                  <input
                    id="usuario-departamento"
                    className="field"
                    value={form.departamento}
                    onChange={(event) =>
                      setForm((atual) => ({ ...atual, departamento: event.target.value }))
                    }
                    placeholder="Digite um novo departamento"
                  />
                ) : (
                  <div className="select-wrap">
                    <select
                      id="usuario-departamento"
                      className="field"
                      value={form.departamento}
                      onChange={(event) => {
                        if (event.target.value === '__novo') {
                          setNovoDepartamento(true)
                          setForm((atual) => ({ ...atual, departamento: '' }))
                        } else setForm((atual) => ({ ...atual, departamento: event.target.value }))
                      }}
                    >
                      <option value="">Selecione</option>
                      {departamentos.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                      <option value="__novo">+ Criar novo departamento</option>
                    </select>
                    <ChevronDown size={15} />
                  </div>
                )}
                {erros.departamento && <p className="form-error">{erros.departamento}</p>}
                {novoDepartamento && (
                  <button
                    type="button"
                    className="inline-link"
                    onClick={() => {
                      setNovoDepartamento(false)
                      setForm((atual) => ({ ...atual, departamento: '' }))
                    }}
                  >
                    Escolher departamento existente
                  </button>
                )}
              </div>
              <div className="form-field">
                <label htmlFor="usuario-senha">Senha {!editando && <b>*</b>}</label>
                <input
                  id="usuario-senha"
                  className="field"
                  type="password"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(event) =>
                    setForm((atual) => ({ ...atual, senha: event.target.value }))
                  }
                  placeholder={editando ? 'Deixe em branco para manter' : 'Mínimo de 6 caracteres'}
                />
                {erros.senha && <p className="form-error">{erros.senha}</p>}
              </div>
              <div className="form-field form-field--full">
                <label htmlFor="usuario-microsoft">
                  ID Microsoft <b>*</b>
                </label>
                <input
                  id="usuario-microsoft"
                  className="field"
                  value={form.idMicrosoft}
                  onChange={(event) =>
                    setForm((atual) => ({ ...atual, idMicrosoft: event.target.value }))
                  }
                  placeholder="usuario@empresa.com ou GUID"
                />
                {erros.idMicrosoft && <p className="form-error">{erros.idMicrosoft}</p>}
                <small className="field-hint">
                  Campo livre para identificação no ambiente Microsoft.
                </small>
              </div>
              <div className="form-field form-field--full system-access-field">
                <div className="system-access-heading">
                  <div>
                    <label>Sistemas que acessa</label>
                    <small>O usuário pode ficar sem atribuições.</small>
                  </div>
                  <span>{form.sistemasIds.length} selecionado(s)</span>
                </div>
                {sistemas.length > 5 && (
                  <div className="system-search">
                    <Search size={15} />
                    <input
                      value={buscaSistemas}
                      onChange={(event) => setBuscaSistemas(event.target.value)}
                      placeholder="Buscar sistema..."
                      aria-label="Buscar sistema no formulário"
                    />
                  </div>
                )}
                <div className="system-toggle-list">
                  {sistemasDoFormulario.map((sistema) => {
                    const selecionado = form.sistemasIds.includes(sistema.id)
                    return (
                      <button
                        type="button"
                        className={selecionado ? 'system-toggle is-selected' : 'system-toggle'}
                        key={sistema.id}
                        onClick={() => alternarSistema(sistema.id)}
                        role="switch"
                        aria-checked={selecionado}
                      >
                        <span className="system-toggle__icon">
                          <ShieldCheck size={17} />
                        </span>
                        <span>
                          <strong>{sistema.nome}</strong>
                          <small>{sistema.area}</small>
                        </span>
                        <i>{selecionado && <Check size={13} />}</i>
                      </button>
                    )
                  })}
                </div>
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
                {editando ? 'Salvar alterações' : 'Criar usuário'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={Boolean(excluindo)}
        onOpenChange={(aberto) => !aberto && setExcluindo(null)}
        title="Excluir usuário?"
        description={
          excluindo
            ? `O cadastro de “${excluindo.nome}” e seus ${excluindo.sistemasIds.length} vínculo(s) de acesso serão removidos. Esta ação não pode ser desfeita nesta sessão.`
            : ''
        }
        onConfirm={confirmarExclusao}
      />
    </div>
  )
}

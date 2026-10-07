import { useState } from 'react'
import {
  AlertCircle,
  Building2,
  FolderTree,
  Pencil,
  Plus,
  Search,
  Shield,
  ShieldCheck,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { useAccess } from '../context/AccessContext'
import { useToast } from '../hooks/use-toast'
import { getAreaIcon } from '../lib/areaIcons'
import { formatarData, pluralizar } from '../lib/format'
import {
  STATUS_MAP,
  type Departamento,
  type DepartamentoInput,
  type PerfilAcesso,
  type PerfilInput,
  type StatusId,
} from '../types/access'

export default function Configuracoes() {
  const { toast } = useToast()
  const {
    departamentos,
    perfis,
    sistemas,
    usuarios,
    criarDepartamento,
    atualizarDepartamento,
    excluirDepartamento,
    usuariosVinculadosAoDepartamento,
    criarPerfil,
    atualizarPerfil,
    excluirPerfil,
    usuariosVinculadosAoPerfil,
  } = useAccess()

  const [abaAtiva, setAbaAtiva] = useState<'departamentos' | 'perfis'>('departamentos')

  // Estado para busca
  const [buscaDept, setBuscaDept] = useState('')
  const [buscaPerfil, setBuscaPerfil] = useState('')

  // Estados modal Departamento
  const [modalDeptAberto, setModalDeptAberto] = useState(false)
  const [editandoDept, setEditandoDept] = useState<Departamento | null>(null)
  const [formDept, setFormDept] = useState<DepartamentoInput>({
    nome: '',
    descricao: '',
    statusId: 1,
  })
  const [errosDept, setErrosDept] = useState<Partial<Record<keyof DepartamentoInput, string>>>({})

  // Estados exclusão Departamento
  const [excluindoDept, setExcluindoDept] = useState<Departamento | null>(null)
  const [bloqueioExclusaoDept, setBloqueioExclusaoDept] = useState<string | null>(null)

  // Filtro de sistema na aba perfis
  const [sistemaPerfilFiltro, setSistemaPerfilFiltro] = useState<string>('todos')

  // Estados modal Perfil
  const [modalPerfilAberto, setModalPerfilAberto] = useState(false)
  const [editandoPerfil, setEditandoPerfil] = useState<PerfilAcesso | null>(null)
  const [formPerfil, setFormPerfil] = useState<PerfilInput>({
    sistemaId: '',
    nome: '',
    descricao: '',
    nivel: 'Operacional',
    statusId: 1,
  })
  const [errosPerfil, setErrosPerfil] = useState<Partial<Record<keyof PerfilInput, string>>>({})

  // Estados exclusão Perfil
  const [excluindoPerfil, setExcluindoPerfil] = useState<PerfilAcesso | null>(null)
  const [bloqueioExclusaoPerfil, setBloqueioExclusaoPerfil] = useState<string | null>(null)

  // ---------------------------------------------------------------------------
  // Ações de Departamento
  // ---------------------------------------------------------------------------
  const abrirNovoDept = () => {
    setEditandoDept(null)
    setFormDept({ nome: '', descricao: '', statusId: 1 })
    setErrosDept({})
    setModalDeptAberto(true)
  }

  const abrirEdicaoDept = (dept: Departamento) => {
    setEditandoDept(dept)
    setFormDept({ nome: dept.nome, descricao: dept.descricao || '', statusId: dept.statusId ?? 1 })
    setErrosDept({})
    setModalDeptAberto(true)
  }

  const validarDept = () => {
    const proximos: Partial<Record<keyof DepartamentoInput, string>> = {}
    if (!formDept.nome.trim()) {
      proximos.nome = 'Informe o nome do departamento.'
    } else {
      const nomeDuplicado = departamentos.some(
        (d) =>
          d.id !== editandoDept?.id &&
          d.nome.trim().toLowerCase() === formDept.nome.trim().toLowerCase(),
      )
      if (nomeDuplicado) {
        proximos.nome = 'Já existe um departamento com este nome.'
      }
    }
    setErrosDept(proximos)
    return Object.keys(proximos).length === 0
  }

  const salvarDept = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validarDept()) return
    const dados: DepartamentoInput = {
      nome: formDept.nome.trim(),
      descricao: formDept.descricao?.trim() || undefined,
      statusId: (Number(formDept.statusId) || 1) as StatusId,
    }
    if (editandoDept) {
      atualizarDepartamento(editandoDept.id, dados)
      toast({
        title: 'Departamento atualizado.',
        description: `As alterações em “${dados.nome}” foram salvas.`,
        duration: 3500,
      })
    } else {
      criarDepartamento(dados)
      toast({
        title: 'Departamento cadastrado.',
        description: `O departamento “${dados.nome}” foi adicionado com sucesso.`,
        duration: 3500,
      })
    }
    setModalDeptAberto(false)
  }

  const tentarExcluirDept = (dept: Departamento) => {
    const vinculados = usuariosVinculadosAoDepartamento(dept.nome)
    if (vinculados.length > 0) {
      setBloqueioExclusaoDept(
        `Não é possível excluir o departamento “${dept.nome}” pois há ${pluralizar(
          vinculados.length,
          'colaborador vinculado',
          'colaboradores vinculados',
        )} a ele (${vinculados
          .map((u) => u.nome)
          .slice(0, 3)
          .join(', ')}${
          vinculados.length > 3 ? '...' : ''
        }). Reatribua os colaboradores antes de prosseguir.`,
      )
      return
    }
    setBloqueioExclusaoDept(null)
    setExcluindoDept(dept)
  }

  const confirmarExclusaoDept = () => {
    if (!excluindoDept) return
    const resultado = excluirDepartamento(excluindoDept.id)
    if (resultado.sucesso) {
      toast({
        title: 'Departamento excluído.',
        description: `O departamento “${excluindoDept.nome}” foi removido.`,
        duration: 3500,
      })
    } else {
      toast({
        title: 'Atenção ao excluir.',
        description: resultado.mensagem,
        variant: 'destructive',
        duration: 4000,
      })
    }
    setExcluindoDept(null)
  }

  // ---------------------------------------------------------------------------
  // Ações de Perfil
  // ---------------------------------------------------------------------------
  const abrirNovoPerfil = () => {
    setEditandoPerfil(null)
    setFormPerfil({
      sistemaId: sistemas[0]?.id || '',
      nome: '',
      descricao: '',
      nivel: 'Operacional',
      statusId: 1,
    })
    setErrosPerfil({})
    setModalPerfilAberto(true)
  }

  const abrirEdicaoPerfil = (perfil: PerfilAcesso) => {
    setEditandoPerfil(perfil)
    setFormPerfil({
      sistemaId: perfil.sistemaId || sistemas[0]?.id || '',
      nome: perfil.nome,
      descricao: perfil.descricao || '',
      nivel: perfil.nivel || 'Operacional',
      statusId: perfil.statusId ?? 1,
    })
    setErrosPerfil({})
    setModalPerfilAberto(true)
  }

  const validarPerfil = () => {
    const proximos: Partial<Record<keyof PerfilInput, string>> = {}
    if (!formPerfil.nome.trim()) {
      proximos.nome = 'Informe o nome do perfil de acesso.'
    }
    if (!formPerfil.sistemaId) {
      proximos.sistemaId = 'Selecione o sistema ao qual o perfil pertence.'
    } else {
      const nomeDuplicado = perfis.some(
        (p) =>
          p.id !== editandoPerfil?.id &&
          p.sistemaId === formPerfil.sistemaId &&
          p.nome.trim().toLowerCase() === formPerfil.nome.trim().toLowerCase(),
      )
      if (nomeDuplicado) {
        proximos.nome = 'Já existe um perfil com este nome para este sistema.'
      }
    }
    setErrosPerfil(proximos)
    return Object.keys(proximos).length === 0
  }

  const salvarPerfil = (event: React.FormEvent) => {
    event.preventDefault()
    if (!validarPerfil()) return
    const dados: PerfilInput = {
      sistemaId: formPerfil.sistemaId,
      nome: formPerfil.nome.trim(),
      descricao: formPerfil.descricao?.trim() || undefined,
      nivel: formPerfil.nivel?.trim() || 'Operacional',
      statusId: (Number(formPerfil.statusId) || 1) as StatusId,
    }
    if (editandoPerfil) {
      atualizarPerfil(editandoPerfil.id, dados)
      toast({
        title: 'Perfil atualizado.',
        description: `O perfil “${dados.nome}” foi atualizado com sucesso.`,
        duration: 3500,
      })
    } else {
      criarPerfil(dados)
      toast({
        title: 'Perfil cadastrado.',
        description: `O perfil “${dados.nome}” foi criado com sucesso.`,
        duration: 3500,
      })
    }
    setModalPerfilAberto(false)
  }

  const tentarExcluirPerfil = (perfil: PerfilAcesso) => {
    const vinculados = usuariosVinculadosAoPerfil(perfil.id)
    if (vinculados.length > 0) {
      setBloqueioExclusaoPerfil(
        `Não é possível excluir o perfil “${perfil.nome}” pois há ${pluralizar(
          vinculados.length,
          'colaborador',
          'colaboradores',
        )} com este perfil (${vinculados
          .map((u) => u.nome)
          .slice(0, 3)
          .join(', ')}${
          vinculados.length > 3 ? '...' : ''
        }). Reatribua os colaboradores antes de prosseguir.`,
      )
      return
    }
    setBloqueioExclusaoPerfil(null)
    setExcluindoPerfil(perfil)
  }

  const confirmarExclusaoPerfil = () => {
    if (!excluindoPerfil) return
    const resultado = excluirPerfil(excluindoPerfil.id)
    if (resultado.sucesso) {
      toast({
        title: 'Perfil excluído.',
        description: `O perfil “${excluindoPerfil.nome}” foi removido.`,
        duration: 3500,
      })
    } else {
      toast({
        title: 'Atenção ao excluir.',
        description: resultado.mensagem,
        variant: 'destructive',
        duration: 4000,
      })
    }
    setExcluindoPerfil(null)
  }

  // Filtragens
  const deptTermo = buscaDept.trim().toLowerCase()
  const departamentosFiltrados = departamentos.filter((d) =>
    `${d.nome} ${d.descricao || ''}`.toLowerCase().includes(deptTermo),
  )

  const perfilTermo = buscaPerfil.trim().toLowerCase()
  const perfisFiltrados = perfis.filter((p) => {
    const nomeSistema = sistemas.find((s) => s.id === p.sistemaId)?.nome || ''
    const matchBusca = `${p.nome} ${p.descricao || ''} ${p.nivel || ''} ${nomeSistema}`
      .toLowerCase()
      .includes(perfilTermo)
    const matchSistema = sistemaPerfilFiltro === 'todos' || p.sistemaId === sistemaPerfilFiltro
    return matchBusca && matchSistema
  })

  return (
    <div className="settings-page page-stack">
      <PageHeader
        eyebrow="SISTEMA & ESTRUTURA"
        title="Configurações"
        description="Gestão de departamentos e perfis de acesso da organização."
        actions={
          abaAtiva === 'departamentos' ? (
            <Button className="button-primary" onClick={abrirNovoDept}>
              <Plus size={17} /> Novo departamento
            </Button>
          ) : (
            <Button className="button-primary" onClick={abrirNovoPerfil}>
              <Plus size={17} /> Novo perfil
            </Button>
          )
        }
      />

      <Tabs
        value={abaAtiva}
        onValueChange={(val) => setAbaAtiva(val as 'departamentos' | 'perfis')}
        className="settings-tabs"
      >
        <TabsList className="glass-surface settings-tabs__list">
          <TabsTrigger value="departamentos" className="settings-tabs__trigger">
            <Building2 size={16} />
            <span>Cadastro de Departamento</span>
            <span className="settings-badge">{departamentos.length}</span>
          </TabsTrigger>
          <TabsTrigger value="perfis" className="settings-tabs__trigger">
            <ShieldCheck size={16} />
            <span>Cadastro de Perfil</span>
            <span className="settings-badge">{perfis.length}</span>
          </TabsTrigger>
        </TabsList>

        {/* ABA: DEPARTAMENTOS */}
        <TabsContent value="departamentos" className="settings-tab-content">
          <section className="filter-bar glass-surface">
            <div className="search-field">
              <Search size={17} />
              <input
                value={buscaDept}
                onChange={(e) => setBuscaDept(e.target.value)}
                placeholder="Buscar departamento por nome ou descrição..."
                aria-label="Buscar departamentos"
              />
            </div>
            <span className="result-count">
              {pluralizar(departamentosFiltrados.length, 'departamento', 'departamentos')}
            </span>
          </section>

          {departamentosFiltrados.length ? (
            <section className="settings-grid">
              {departamentosFiltrados.map((dept, index) => {
                const vinculados = usuariosVinculadosAoDepartamento(dept.nome)
                const IconeDept = getAreaIcon(dept.nome)
                return (
                  <article
                    key={dept.id}
                    className={`settings-card glass-surface stagger-${(index % 5) + 1}`}
                  >
                    <div className="settings-card__top">
                      <div className="settings-card__icon-wrap">
                        <span className="settings-icon" title={`Área/Departamento: ${dept.nome}`}>
                          <IconeDept size={22} />
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <h2>{dept.nome}</h2>
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                dept.statusId === 1
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : dept.statusId === 2
                                    ? 'bg-slate-500/15 text-slate-400 border border-slate-500/30'
                                    : 'bg-rose-500/15 text-rose-500 border border-rose-500/30'
                              }`}
                            >
                              {STATUS_MAP[dept.statusId ?? 1]?.nome ?? 'Ativo'}
                            </span>
                          </div>
                          <small className="settings-card__date">
                            Criado em {formatarData(dept.dataCriacao || dept.criadoEm)}
                          </small>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          onClick={() => abrirEdicaoDept(dept)}
                          aria-label={`Editar departamento ${dept.nome}`}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="danger-action"
                          onClick={() => tentarExcluirDept(dept)}
                          aria-label={`Excluir departamento ${dept.nome}`}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="settings-card__desc">
                      {dept.descricao || 'Sem descrição informada.'}
                    </p>

                    <div className="settings-card__footer">
                      <span className="settings-card__users">
                        <UsersRound size={15} />
                        {pluralizar(vinculados.length, 'colaborador', 'colaboradores')}
                      </span>
                      {vinculados.length > 0 ? (
                        <span className="status-pill status-pill--active">Em uso</span>
                      ) : (
                        <span className="status-pill status-pill--idle">Sem vínculos</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>
          ) : (
            <div className="glass-surface empty-card">
              <EmptyState
                icon={FolderTree}
                title="Nenhum departamento encontrado."
                description="Cadastre um novo departamento para organizar os usuários e acessos da empresa."
                action={
                  <Button className="button-primary" onClick={abrirNovoDept}>
                    <Plus size={17} /> Criar departamento
                  </Button>
                }
              />
            </div>
          )}
        </TabsContent>

        {/* ABA: PERFIS */}
        <TabsContent value="perfis" className="settings-tab-content">
          <section className="filter-bar glass-surface">
            <div className="search-field">
              <Search size={17} />
              <input
                value={buscaPerfil}
                onChange={(e) => setBuscaPerfil(e.target.value)}
                placeholder="Buscar perfil por nome, nível, sistema ou descrição..."
                aria-label="Buscar perfis"
              />
            </div>
            <label className="select-field">
              <span>Sistema</span>
              <select
                value={sistemaPerfilFiltro}
                onChange={(e) => setSistemaPerfilFiltro(e.target.value)}
              >
                <option value="todos">Todos os sistemas</option>
                {sistemas.map((sis) => (
                  <option key={sis.id} value={sis.id}>
                    {sis.nome}
                  </option>
                ))}
              </select>
            </label>
            <span className="result-count">
              {pluralizar(perfisFiltrados.length, 'perfil', 'perfis')}
            </span>
          </section>

          {perfisFiltrados.length ? (
            <section className="settings-grid">
              {perfisFiltrados.map((perfil, index) => {
                const vinculados = usuariosVinculadosAoPerfil(perfil.id)
                const sistemaVinculado = sistemas.find((s) => s.id === perfil.sistemaId)
                return (
                  <article
                    key={perfil.id}
                    className={`settings-card glass-surface stagger-${(index % 5) + 1}`}
                  >
                    <div className="settings-card__top">
                      <div className="settings-card__icon-wrap">
                        <span className="settings-icon settings-icon--orange">
                          <Shield size={22} />
                        </span>
                        <div>
                          <div className="settings-card__title-row">
                            <h2>{perfil.nome}</h2>
                            {perfil.nivel && (
                              <span className="perfil-level-pill">{perfil.nivel}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-[11px] font-semibold text-[var(--color-primary)] bg-[var(--color-primary-soft)] px-2 py-0.5 rounded">
                              {sistemaVinculado?.nome ?? 'Sistema geral'}
                            </span>
                            <small className="settings-card__date">
                              {formatarData(perfil.dataCriacao || perfil.criadoEm)}
                            </small>
                          </div>
                        </div>
                      </div>
                      <div className="card-actions">
                        <button
                          onClick={() => abrirEdicaoPerfil(perfil)}
                          aria-label={`Editar perfil ${perfil.nome}`}
                          title="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          className="danger-action"
                          onClick={() => tentarExcluirPerfil(perfil)}
                          aria-label={`Excluir perfil ${perfil.nome}`}
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>

                    <p className="settings-card__desc">
                      {perfil.descricao || 'Sem descrição cadastrada.'}
                    </p>

                    <div className="settings-card__footer">
                      <span className="settings-card__users">
                        <UsersRound size={15} />
                        {pluralizar(
                          vinculados.length,
                          'usuário com este perfil',
                          'usuários com este perfil',
                        )}
                      </span>
                      {vinculados.length > 0 ? (
                        <span className="status-pill status-pill--active">Ativo</span>
                      ) : (
                        <span className="status-pill status-pill--idle">Disponível</span>
                      )}
                    </div>
                  </article>
                )
              })}
            </section>
          ) : (
            <div className="glass-surface empty-card">
              <EmptyState
                icon={ShieldCheck}
                title="Nenhum perfil encontrado."
                description="Cadastre perfis de acesso para padronizar os privilégios dos colaboradores."
                action={
                  <Button className="button-primary" onClick={abrirNovoPerfil}>
                    <Plus size={17} /> Criar perfil
                  </Button>
                }
              />
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* MODAL: CRIAR / EDITAR DEPARTAMENTO */}
      <Dialog open={modalDeptAberto} onOpenChange={setModalDeptAberto}>
        <DialogContent className="glass-surface app-dialog">
          <form onSubmit={salvarDept} noValidate>
            <DialogHeader>
              <span className="dialog-icon">
                <Building2 size={22} />
              </span>
              <DialogTitle>
                {editandoDept ? 'Editar departamento' : 'Novo departamento'}
              </DialogTitle>
              <DialogDescription>
                {editandoDept
                  ? 'Atualize as informações do departamento. O nome será refletido nos colaboradores vinculados.'
                  : 'Cadastre um novo departamento para organizar a equipe.'}
              </DialogDescription>
            </DialogHeader>
            <div className="dialog-form">
              <div className="form-field">
                <label htmlFor="dept-nome">
                  Nome do departamento <b>*</b>
                </label>
                <input
                  id="dept-nome"
                  className="field"
                  value={formDept.nome}
                  onChange={(e) => setFormDept((atual) => ({ ...atual, nome: e.target.value }))}
                  placeholder="Ex.: Recursos Humanos, TI, Comercial..."
                  autoFocus
                />
                {errosDept.nome && <p className="form-error">{errosDept.nome}</p>}
              </div>

              <div className="form-field">
                <label htmlFor="dept-status">Status</label>
                <select
                  id="dept-status"
                  className="field"
                  value={formDept.statusId ?? 1}
                  onChange={(e) =>
                    setFormDept((atual) => ({
                      ...atual,
                      statusId: Number(e.target.value) as StatusId,
                    }))
                  }
                >
                  <option value={1}>Ativo (1)</option>
                  <option value={2}>Inativo (2)</option>
                  <option value={3}>Bloqueado (3)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="dept-descricao">Descrição / Finalidade</label>
                <textarea
                  id="dept-descricao"
                  className="field field--textarea"
                  rows={3}
                  value={formDept.descricao}
                  onChange={(e) =>
                    setFormDept((atual) => ({ ...atual, descricao: e.target.value }))
                  }
                  placeholder="Descreva as responsabilidades deste departamento (opcional)"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="button-secondary"
                onClick={() => setModalDeptAberto(false)}
              >
                Cancelar
              </Button>
              <Button className="button-primary" type="submit">
                {editandoDept ? 'Salvar alterações' : 'Criar departamento'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* MODAL: CRIAR / EDITAR PERFIL */}
      <Dialog open={modalPerfilAberto} onOpenChange={setModalPerfilAberto}>
        <DialogContent className="glass-surface app-dialog">
          <form onSubmit={salvarPerfil} noValidate>
            <DialogHeader>
              <span className="dialog-icon">
                <ShieldCheck size={22} />
              </span>
              <DialogTitle>
                {editandoPerfil ? 'Editar perfil' : 'Novo perfil de acesso'}
              </DialogTitle>
              <DialogDescription>
                {editandoPerfil
                  ? 'Atualize as propriedades e o nível de acesso deste perfil.'
                  : 'Defina um perfil de permissões para vincular aos usuários.'}
              </DialogDescription>
            </DialogHeader>
            <div className="dialog-form">
              <div className="form-field">
                <label htmlFor="perfil-sistema">
                  Sistema vinculado <b>*</b>
                </label>
                <select
                  id="perfil-sistema"
                  className="field"
                  value={formPerfil.sistemaId}
                  onChange={(e) =>
                    setFormPerfil((atual) => ({ ...atual, sistemaId: e.target.value }))
                  }
                >
                  <option value="">Selecione o sistema</option>
                  {sistemas.map((sis) => (
                    <option key={sis.id} value={sis.id}>
                      {sis.nome} ({sis.area})
                    </option>
                  ))}
                </select>
                {errosPerfil.sistemaId && <p className="form-error">{errosPerfil.sistemaId}</p>}
              </div>

              <div className="form-field">
                <label htmlFor="perfil-nome">
                  Nome do perfil <b>*</b>
                </label>
                <input
                  id="perfil-nome"
                  className="field"
                  value={formPerfil.nome}
                  onChange={(e) => setFormPerfil((atual) => ({ ...atual, nome: e.target.value }))}
                  placeholder="Ex.: Administrador, Gestor, Auditor..."
                  autoFocus
                />
                {errosPerfil.nome && <p className="form-error">{errosPerfil.nome}</p>}
              </div>

              <div className="form-field">
                <label htmlFor="perfil-nivel">Nível de permissão</label>
                <select
                  id="perfil-nivel"
                  className="field"
                  value={formPerfil.nivel}
                  onChange={(e) => setFormPerfil((atual) => ({ ...atual, nivel: e.target.value }))}
                >
                  <option value="Total">Total (Administração completa)</option>
                  <option value="Gerencial">Gerencial (Supervisão e equipes)</option>
                  <option value="Operacional">Operacional (Uso rotineiro)</option>
                  <option value="Consulta">Consulta (Apenas leitura)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="perfil-status">Status</label>
                <select
                  id="perfil-status"
                  className="field"
                  value={formPerfil.statusId ?? 1}
                  onChange={(e) =>
                    setFormPerfil((atual) => ({
                      ...atual,
                      statusId: Number(e.target.value) as StatusId,
                    }))
                  }
                >
                  <option value={1}>Ativo (1)</option>
                  <option value={2}>Inativo (2)</option>
                  <option value={3}>Bloqueado (3)</option>
                </select>
              </div>

              <div className="form-field">
                <label htmlFor="perfil-descricao">Descrição do escopo</label>
                <textarea
                  id="perfil-descricao"
                  className="field field--textarea"
                  rows={3}
                  value={formPerfil.descricao}
                  onChange={(e) =>
                    setFormPerfil((atual) => ({ ...atual, descricao: e.target.value }))
                  }
                  placeholder="Explique quais acessos ou responsabilidades cabem a este perfil"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="button-secondary"
                onClick={() => setModalPerfilAberto(false)}
              >
                Cancelar
              </Button>
              <Button className="button-primary" type="submit">
                {editandoPerfil ? 'Salvar alterações' : 'Criar perfil'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* CONFIRMAÇÃO EXCLUSÃO: DEPARTAMENTO */}
      <ConfirmDialog
        open={Boolean(excluindoDept)}
        onOpenChange={(aberto) => !aberto && setExcluindoDept(null)}
        title="Excluir departamento?"
        description={
          excluindoDept
            ? `Tem certeza que deseja remover o departamento “${excluindoDept.nome}”? Nenhum colaborador está vinculado no momento.`
            : ''
        }
        onConfirm={confirmarExclusaoDept}
      />

      {/* CONFIRMAÇÃO EXCLUSÃO: PERFIL */}
      <ConfirmDialog
        open={Boolean(excluindoPerfil)}
        onOpenChange={(aberto) => !aberto && setExcluindoPerfil(null)}
        title="Excluir perfil de acesso?"
        description={
          excluindoPerfil
            ? `Tem certeza que deseja excluir o perfil “${excluindoPerfil.nome}”? Não há colaboradores utilizando este perfil atualmente.`
            : ''
        }
        onConfirm={confirmarExclusaoPerfil}
      />

      {/* DIALOG DE BLOQUEIO DE EXCLUSÃO (DEPARTAMENTO COM VÍNCULOS) */}
      <Dialog
        open={Boolean(bloqueioExclusaoDept)}
        onOpenChange={(aberto) => !aberto && setBloqueioExclusaoDept(null)}
      >
        <DialogContent className="glass-surface app-dialog app-dialog--small">
          <DialogHeader>
            <span className="dialog-icon dialog-icon--danger">
              <AlertCircle size={22} />
            </span>
            <DialogTitle>Exclusão impedida</DialogTitle>
            <DialogDescription>{bloqueioExclusaoDept}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="button-primary" onClick={() => setBloqueioExclusaoDept(null)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DIALOG DE BLOQUEIO DE EXCLUSÃO (PERFIL COM VÍNCULOS) */}
      <Dialog
        open={Boolean(bloqueioExclusaoPerfil)}
        onOpenChange={(aberto) => !aberto && setBloqueioExclusaoPerfil(null)}
      >
        <DialogContent className="glass-surface app-dialog app-dialog--small">
          <DialogHeader>
            <span className="dialog-icon dialog-icon--danger">
              <AlertCircle size={22} />
            </span>
            <DialogTitle>Exclusão impedida</DialogTitle>
            <DialogDescription>{bloqueioExclusaoPerfil}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="button-primary" onClick={() => setBloqueioExclusaoPerfil(null)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

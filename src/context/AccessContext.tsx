import { createContext, useContext, useMemo, useState } from 'react'
import sistemasSeed from '../data/sistemas.json'
import usuariosSeed from '../data/usuarios.json'
import atribuicoesSeed from '../data/atribuicoes.json'
import dashboardSeed from '../data/dashboard.json'
import departamentosSeed from '../data/departamentos.json'
import perfisSeed from '../data/perfis.json'
import type {
  Atribuicao,
  Departamento,
  DepartamentoInput,
  Estatisticas,
  IndicadorVisual,
  PerfilAcesso,
  PerfilInput,
  Sistema,
  SistemaInput,
  Usuario,
  UsuarioInput,
  UsuarioSistemaItem,
} from '../types/access'

interface AccessContextValue {
  departamentos: Departamento[]
  perfis: PerfilAcesso[]
  sistemas: Sistema[]
  usuarios: Usuario[]
  atribuicoes: Atribuicao[]
  usuarioLogado: Usuario | null
  autenticado: boolean
  indicadores: Record<'sistemas' | 'usuarios' | 'acessos' | 'semAtribuicao', IndicadorVisual>
  estatisticas: Estatisticas
  autenticar: (email: string, senha: string) => Usuario | null
  sair: () => void
  recarregarDemonstracao: () => void
  criarDepartamento: (dados: DepartamentoInput) => Departamento
  atualizarDepartamento: (id: string, dados: DepartamentoInput) => void
  excluirDepartamento: (id: string) => { sucesso: boolean; mensagem?: string }
  usuariosVinculadosAoDepartamento: (nomeOuId: string) => Usuario[]
  criarPerfil: (dados: PerfilInput) => PerfilAcesso
  atualizarPerfil: (id: string, dados: PerfilInput) => void
  excluirPerfil: (id: string) => { sucesso: boolean; mensagem?: string }
  usuariosVinculadosAoPerfil: (id: string) => Usuario[]
  criarSistema: (dados: SistemaInput) => Sistema
  atualizarSistema: (id: string, dados: SistemaInput) => void
  excluirSistema: (id: string) => void
  criarUsuario: (dados: UsuarioInput) => Usuario
  atualizarUsuario: (id: string, dados: UsuarioInput) => void
  excluirUsuario: (id: string) => void
  atribuirSistema: (usuarioId: string, sistemaId: string) => void
  desatribuirSistema: (usuarioId: string, sistemaId: string) => void
  trocarMinhaSenha: (novaSenha: string) => void
}

const AccessContext = createContext<AccessContextValue | null>(null)
const SESSION_KEY = 'gerenciador-acesso-sessao-demo'

const copiarDepartamentos = () => (departamentosSeed as Departamento[]).map((item) => ({ ...item }))
const copiarPerfis = () => (perfisSeed as PerfilAcesso[]).map((item) => ({ ...item }))
const copiarSistemas = () => (sistemasSeed as Sistema[]).map((item) => ({ ...item }))
const copiarUsuarios = () =>
  (usuariosSeed as Usuario[]).map((item) => ({ ...item, sistemasIds: [...item.sistemasIds] }))
const copiarAtribuicoes = () => (atribuicoesSeed as Atribuicao[]).map((item) => ({ ...item }))

function novoId(prefixo: string) {
  const id =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(16).slice(2)}`
  return `${prefixo}-${id}`
}

export function AccessProvider({ children }: { children: React.ReactNode }) {
  const [departamentos, setDepartamentos] = useState<Departamento[]>(copiarDepartamentos)
  const [perfis, setPerfis] = useState<PerfilAcesso[]>(copiarPerfis)
  const [sistemas, setSistemas] = useState<Sistema[]>(copiarSistemas)
  const [usuarios, setUsuarios] = useState<Usuario[]>(copiarUsuarios)
  const [atribuicoes, setAtribuicoes] = useState<Atribuicao[]>(copiarAtribuicoes)
  const [usuarioLogadoId, setUsuarioLogadoId] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY),
  )

  const usuarioLogado = useMemo(
    () => usuarios.find((usuario) => usuario.id === usuarioLogadoId) ?? null,
    [usuarios, usuarioLogadoId],
  )

  const estatisticas = useMemo<Estatisticas>(() => {
    const acessosConcedidos = usuarios.reduce(
      (total, usuario) => total + (usuario.sistemasIds?.length ?? 0),
      0,
    )
    const acessosPorSistema = sistemas
      .map((sistema) => ({
        sistema,
        quantidade: usuarios.filter((usuario) => usuario.sistemasIds?.includes(sistema.id)).length,
      }))
      .sort((a, b) => b.quantidade - a.quantidade || a.sistema.nome.localeCompare(b.sistema.nome))

    const contagemDepartamentos = usuarios.reduce<Record<string, number>>((acc, usuario) => {
      const nomeDept = usuario.departamento || 'Sem departamento'
      acc[nomeDept] = (acc[nomeDept] ?? 0) + 1
      return acc
    }, {})

    const areas = sistemas.reduce<Record<string, number>>((acc, sistema) => {
      acc[sistema.area] = (acc[sistema.area] ?? 0) + 1
      return acc
    }, {})

    type UltimoAcessoItem = {
      atribuicao: Atribuicao
      usuario: Usuario
      sistema: Sistema
      perfil?: PerfilAcesso
    }

    const ultimosAcessos: UltimoAcessoItem[] = []
    for (const atribuicao of atribuicoes) {
      const usuario = usuarios.find((item) => item.id === atribuicao.usuarioId)
      const sistema = sistemas.find((item) => item.id === atribuicao.sistemaId)
      if (usuario && sistema) {
        const perfil = atribuicao.perfilId
          ? perfis.find((p) => p.id === atribuicao.perfilId)
          : undefined
        ultimosAcessos.push({ atribuicao, usuario, sistema, perfil })
      }
    }
    ultimosAcessos.sort(
      (a, b) => new Date(b.atribuicao.data).getTime() - new Date(a.atribuicao.data).getTime(),
    )

    return {
      sistemasAtivos: sistemas.filter((s) => s.statusId === 1).length,
      usuariosCadastrados: usuarios.length,
      acessosConcedidos,
      semAtribuicao: usuarios.filter(
        (usuario) => !usuario.sistemasIds || usuario.sistemasIds.length === 0,
      ).length,
      acessosPorSistema,
      usuariosPorDepartamento: Object.entries(contagemDepartamentos)
        .map(([departamento, quantidade]) => ({ departamento, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
      sistemasPorArea: Object.entries(areas)
        .map(([area, quantidade]) => ({ area, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade || a.area.localeCompare(b.area)),
      ultimosAcessos,
    }
  }, [atribuicoes, perfis, sistemas, usuarios])

  const autenticar = (email: string, senha: string) => {
    const encontrado = usuarios.find(
      (usuario) =>
        usuario.email.toLowerCase() === email.trim().toLowerCase() && usuario.senha === senha,
    )
    if (!encontrado) return null
    setUsuarioLogadoId(encontrado.id)
    localStorage.setItem(SESSION_KEY, encontrado.id)
    return encontrado
  }

  const sair = () => {
    setUsuarioLogadoId(null)
    localStorage.removeItem(SESSION_KEY)
  }

  const recarregarDemonstracao = () => {
    setDepartamentos(copiarDepartamentos())
    setPerfis(copiarPerfis())
    setSistemas(copiarSistemas())
    setUsuarios(copiarUsuarios())
    setAtribuicoes(copiarAtribuicoes())
    if (usuarioLogadoId && !(usuariosSeed as Usuario[]).some((item) => item.id === usuarioLogadoId))
      sair()
  }

  const usuariosVinculadosAoDepartamento = (nomeOuId: string) => {
    const dept = departamentos.find(
      (d) => d.id === nomeOuId || d.nome.toLowerCase() === nomeOuId.toLowerCase(),
    )
    const nomeAlvo = dept ? dept.nome.toLowerCase() : nomeOuId.toLowerCase()
    return usuarios.filter((u) => u.departamento.toLowerCase() === nomeAlvo)
  }

  const criarDepartamento = (dados: DepartamentoInput) => {
    const agora = new Date().toISOString()
    const departamento: Departamento = {
      id: novoId('dept'),
      nome: dados.nome.trim(),
      descricao: dados.descricao?.trim(),
      statusId: dados.statusId ?? 1,
      dataCriacao: agora,
      dataAlteracao: null,
      criadoEm: agora,
    }
    setDepartamentos((atuais) => [...atuais, departamento])
    return departamento
  }

  const atualizarDepartamento = (id: string, dados: DepartamentoInput) => {
    const agora = new Date().toISOString()
    const deptAnterior = departamentos.find((d) => d.id === id)
    setDepartamentos((atuais) =>
      atuais.map((d) =>
        d.id === id
          ? {
              ...d,
              nome: dados.nome.trim(),
              descricao: dados.descricao?.trim(),
              statusId: dados.statusId ?? d.statusId ?? 1,
              dataAlteracao: agora,
            }
          : d,
      ),
    )
    // Atualizar o nome do departamento nos usuários que pertencem a ele
    if (deptAnterior && deptAnterior.nome !== dados.nome.trim()) {
      const nomeAntigo = deptAnterior.nome.toLowerCase()
      const novoNome = dados.nome.trim()
      setUsuarios((atuais) =>
        atuais.map((usuario) =>
          usuario.departamento.toLowerCase() === nomeAntigo
            ? { ...usuario, departamento: novoNome }
            : usuario,
        ),
      )
    }
  }

  const excluirDepartamento = (id: string) => {
    const dept = departamentos.find((d) => d.id === id)
    if (!dept) {
      return { sucesso: false, mensagem: 'Departamento não encontrado.' }
    }
    const vinculados = usuariosVinculadosAoDepartamento(dept.nome)
    if (vinculados.length > 0) {
      return {
        sucesso: false,
        mensagem: `Não é possível excluir o departamento “${dept.nome}” porque existem ${vinculados.length} usuário(s) vinculado(s) a ele. Reatribua os colaboradores antes de excluir.`,
      }
    }
    setDepartamentos((atuais) => atuais.filter((d) => d.id !== id))
    return { sucesso: true }
  }

  const usuariosVinculadosAoPerfil = (id: string) => {
    return usuarios.filter((u) => u.perfilId === id)
  }

  const criarPerfil = (dados: PerfilInput) => {
    const agora = new Date().toISOString()
    const perfil: PerfilAcesso = {
      id: novoId('perfil'),
      sistemaId: dados.sistemaId,
      nome: dados.nome.trim(),
      descricao: dados.descricao?.trim(),
      nivel: dados.nivel?.trim() || 'Operacional',
      statusId: dados.statusId ?? 1,
      dataCriacao: agora,
      dataAlteracao: null,
      criadoEm: agora,
    }
    setPerfis((atuais) => [...atuais, perfil])
    return perfil
  }

  const atualizarPerfil = (id: string, dados: PerfilInput) => {
    const agora = new Date().toISOString()
    setPerfis((atuais) =>
      atuais.map((p) =>
        p.id === id
          ? {
              ...p,
              sistemaId: dados.sistemaId || p.sistemaId,
              nome: dados.nome.trim(),
              descricao: dados.descricao?.trim(),
              nivel: dados.nivel?.trim() || p.nivel,
              statusId: dados.statusId ?? p.statusId ?? 1,
              dataAlteracao: agora,
            }
          : p,
      ),
    )
  }

  const excluirPerfil = (id: string) => {
    const perfil = perfis.find((p) => p.id === id)
    if (!perfil) {
      return { sucesso: false, mensagem: 'Perfil não encontrado.' }
    }
    const vinculados = usuariosVinculadosAoPerfil(id)
    if (vinculados.length > 0) {
      return {
        sucesso: false,
        mensagem: `Não é possível excluir o perfil “${perfil.nome}” porque existem ${vinculados.length} usuário(s) com este perfil atribuído. Reatribua os colaboradores antes de excluir.`,
      }
    }
    setPerfis((atuais) => atuais.filter((p) => p.id !== id))
    return { sucesso: true }
  }

  const criarSistema = (dados: SistemaInput) => {
    const agora = new Date().toISOString()
    const sistema: Sistema = {
      ...dados,
      statusId: dados.statusId ?? 1,
      id: novoId('sistema'),
      dataCriacao: agora,
      dataAlteracao: null,
      criadoEm: agora,
    }
    setSistemas((atuais) => [...atuais, sistema])
    return sistema
  }

  const atualizarSistema = (id: string, dados: SistemaInput) => {
    const agora = new Date().toISOString()
    setSistemas((atuais) =>
      atuais.map((sistema) =>
        sistema.id === id
          ? {
              ...sistema,
              ...dados,
              statusId: dados.statusId ?? sistema.statusId ?? 1,
              dataAlteracao: agora,
            }
          : sistema,
      ),
    )
  }

  const excluirSistema = (id: string) => {
    setSistemas((atuais) => atuais.filter((sistema) => sistema.id !== id))
    setUsuarios((atuais) =>
      atuais.map((usuario) => ({
        ...usuario,
        sistemasIds: usuario.sistemasIds.filter((sistemaId) => sistemaId !== id),
      })),
    )
    setAtribuicoes((atuais) => atuais.filter((atribuicao) => atribuicao.sistemaId !== id))
  }

  const registrarNovosAcessos = (usuarioId: string, anteriores: string[], proximos: string[]) => {
    const novos = proximos.filter((sistemaId) => !anteriores.includes(sistemaId))
    if (novos.length === 0) return
    const momento = new Date().toISOString()
    setAtribuicoes((atuais) => [
      ...atuais,
      ...novos.map((sistemaId) => ({
        usuarioId,
        sistemaId,
        statusId: 1 as const,
        dataInicio: momento,
        dataCriacao: momento,
        data: momento,
      })),
    ])
  }

  const criarUsuario = (dados: UsuarioInput) => {
    const agora = new Date().toISOString()
    const departamentoEncontrado = dados.departamentoId
      ? departamentos.find((d) => d.id === dados.departamentoId)
      : departamentos.find((d) => d.nome.toLowerCase() === (dados.departamento ?? '').toLowerCase())
    const departamentoNome = departamentoEncontrado?.nome ?? dados.departamento ?? ''
    const departamentoId = departamentoEncontrado?.id ?? dados.departamentoId ?? null

    const vinculosCompletos: UsuarioSistemaItem[] = dados.vinculos
      ? dados.vinculos.map((v) => ({
          sistemaId: v.sistemaId,
          perfilId: v.perfilId,
          statusId: v.statusId ?? 1,
          dataInicio: v.dataInicio ?? agora,
          dataExpiracao: v.dataExpiracao ?? null,
          concedidoPor: usuarioLogadoId,
          dataCriacao: agora,
          dataAlteracao: null,
        }))
      : dados.sistemasIds.map((sId) => ({
          sistemaId: sId,
          perfilId: dados.perfilId,
          statusId: 1 as const,
          dataInicio: agora,
          dataExpiracao: null,
          concedidoPor: usuarioLogadoId,
          dataCriacao: agora,
          dataAlteracao: null,
        }))

    const usuario: Usuario = {
      id: novoId('usuario'),
      nome: dados.nome,
      email: dados.email,
      departamentoId,
      departamento: departamentoNome,
      statusId: dados.statusId ?? 1,
      idMicrosoft: dados.idMicrosoft || null,
      senha: dados.senha || 'demo2024',
      sistemasIds: [...dados.sistemasIds],
      vinculos: vinculosCompletos,
      perfilId: dados.perfilId,
      dataCriacao: agora,
      dataAlteracao: null,
      criadoEm: agora,
    }
    setUsuarios((atuais) => [...atuais, usuario])
    registrarNovosAcessos(usuario.id, [], usuario.sistemasIds)
    return usuario
  }

  const atualizarUsuario = (id: string, dados: UsuarioInput) => {
    const agora = new Date().toISOString()
    const anterior = usuarios.find((usuario) => usuario.id === id)
    if (anterior) registrarNovosAcessos(id, anterior.sistemasIds, dados.sistemasIds)

    const departamentoEncontrado = dados.departamentoId
      ? departamentos.find((d) => d.id === dados.departamentoId)
      : dados.departamento
        ? departamentos.find(
            (d) => d.nome.toLowerCase() === (dados.departamento ?? '').toLowerCase(),
          )
        : undefined

    setUsuarios((atuais) =>
      atuais.map((usuario) => {
        if (usuario.id !== id) return usuario

        const departamentoNome = departamentoEncontrado
          ? departamentoEncontrado.nome
          : dados.departamento !== undefined
            ? dados.departamento
            : usuario.departamento
        const departamentoId = departamentoEncontrado
          ? departamentoEncontrado.id
          : dados.departamentoId !== undefined
            ? dados.departamentoId
            : usuario.departamentoId

        const vinculosAtualizados: UsuarioSistemaItem[] = dados.vinculos
          ? dados.vinculos.map((v) => ({
              sistemaId: v.sistemaId,
              perfilId: v.perfilId,
              statusId: v.statusId ?? 1,
              dataInicio: v.dataInicio ?? agora,
              dataExpiracao: v.dataExpiracao ?? null,
              concedidoPor: usuarioLogadoId,
              dataCriacao: agora,
              dataAlteracao: null,
            }))
          : dados.sistemasIds.map((sId) => {
              const vinculoAntigo = usuario.vinculos?.find((v) => v.sistemaId === sId)
              return (
                vinculoAntigo ?? {
                  sistemaId: sId,
                  perfilId: dados.perfilId ?? usuario.perfilId,
                  statusId: 1 as const,
                  dataInicio: agora,
                  dataExpiracao: null,
                  concedidoPor: usuarioLogadoId,
                  dataCriacao: agora,
                  dataAlteracao: null,
                }
              )
            })

        return {
          ...usuario,
          nome: dados.nome,
          email: dados.email,
          departamento: departamentoNome,
          departamentoId,
          statusId: dados.statusId ?? usuario.statusId ?? 1,
          idMicrosoft: dados.idMicrosoft !== undefined ? dados.idMicrosoft : usuario.idMicrosoft,
          perfilId: dados.perfilId !== undefined ? dados.perfilId : usuario.perfilId,
          senha: dados.senha || usuario.senha,
          sistemasIds: [...dados.sistemasIds],
          vinculos: vinculosAtualizados,
          dataAlteracao: agora,
        }
      }),
    )
  }

  const excluirUsuario = (id: string) => {
    setUsuarios((atuais) => atuais.filter((usuario) => usuario.id !== id))
    setAtribuicoes((atuais) => atuais.filter((atribuicao) => atribuicao.usuarioId !== id))
    if (usuarioLogadoId === id) sair()
  }

  const atribuirSistema = (usuarioId: string, sistemaId: string) => {
    const usuario = usuarios.find((item) => item.id === usuarioId)
    if (!usuario || usuario.sistemasIds.includes(sistemaId)) return
    setUsuarios((atuais) =>
      atuais.map((item) =>
        item.id === usuarioId ? { ...item, sistemasIds: [...item.sistemasIds, sistemaId] } : item,
      ),
    )
    const momento = new Date().toISOString()
    setAtribuicoes((atuais) => [
      ...atuais,
      {
        usuarioId,
        sistemaId,
        statusId: 1 as const,
        dataInicio: momento,
        dataCriacao: momento,
        data: momento,
      },
    ])
  }

  const desatribuirSistema = (usuarioId: string, sistemaId: string) => {
    setUsuarios((atuais) =>
      atuais.map((item) =>
        item.id === usuarioId
          ? { ...item, sistemasIds: item.sistemasIds.filter((id) => id !== sistemaId) }
          : item,
      ),
    )
  }

  const trocarMinhaSenha = (novaSenha: string) => {
    if (!usuarioLogadoId) return
    setUsuarios((atuais) =>
      atuais.map((usuario) =>
        usuario.id === usuarioLogadoId ? { ...usuario, senha: novaSenha } : usuario,
      ),
    )
  }

  const value: AccessContextValue = {
    departamentos,
    perfis,
    sistemas,
    usuarios,
    atribuicoes,
    usuarioLogado,
    autenticado: Boolean(usuarioLogado),
    indicadores: dashboardSeed.indicadores,
    estatisticas,
    autenticar,
    sair,
    recarregarDemonstracao,
    criarDepartamento,
    atualizarDepartamento,
    excluirDepartamento,
    usuariosVinculadosAoDepartamento,
    criarPerfil,
    atualizarPerfil,
    excluirPerfil,
    usuariosVinculadosAoPerfil,
    criarSistema,
    atualizarSistema,
    excluirSistema,
    criarUsuario,
    atualizarUsuario,
    excluirUsuario,
    atribuirSistema,
    desatribuirSistema,
    trocarMinhaSenha,
  }

  return <AccessContext.Provider value={value}>{children}</AccessContext.Provider>
}

export function useAccess() {
  const context = useContext(AccessContext)
  if (!context) throw new Error('useAccess deve ser usado dentro de AccessProvider.')
  return context
}

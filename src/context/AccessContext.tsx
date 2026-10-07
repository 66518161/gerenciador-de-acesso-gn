import { createContext, useContext, useMemo, useState } from 'react'
import sistemasSeed from '../data/sistemas.json'
import usuariosSeed from '../data/usuarios.json'
import atribuicoesSeed from '../data/atribuicoes.json'
import dashboardSeed from '../data/dashboard.json'
import type {
  Atribuicao,
  Estatisticas,
  IndicadorVisual,
  Sistema,
  SistemaInput,
  Usuario,
  UsuarioInput,
} from '../types/access'

interface AccessContextValue {
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
      (total, usuario) => total + usuario.sistemasIds.length,
      0,
    )
    const acessosPorSistema = sistemas
      .map((sistema) => ({
        sistema,
        quantidade: usuarios.filter((usuario) => usuario.sistemasIds.includes(sistema.id)).length,
      }))
      .sort((a, b) => b.quantidade - a.quantidade || a.sistema.nome.localeCompare(b.sistema.nome))

    const departamentos = usuarios.reduce<Record<string, number>>((acc, usuario) => {
      acc[usuario.departamento] = (acc[usuario.departamento] ?? 0) + 1
      return acc
    }, {})

    const areas = sistemas.reduce<Record<string, number>>((acc, sistema) => {
      acc[sistema.area] = (acc[sistema.area] ?? 0) + 1
      return acc
    }, {})

    const ultimosAcessos = atribuicoes
      .map((atribuicao) => ({
        atribuicao,
        usuario: usuarios.find((item) => item.id === atribuicao.usuarioId),
        sistema: sistemas.find((item) => item.id === atribuicao.sistemaId),
      }))
      .filter((item): item is { atribuicao: Atribuicao; usuario: Usuario; sistema: Sistema } =>
        Boolean(item.usuario && item.sistema),
      )
      .sort((a, b) => new Date(b.atribuicao.data).getTime() - new Date(a.atribuicao.data).getTime())

    return {
      sistemasAtivos: sistemas.length,
      usuariosCadastrados: usuarios.length,
      acessosConcedidos,
      semAtribuicao: usuarios.filter((usuario) => usuario.sistemasIds.length === 0).length,
      acessosPorSistema,
      usuariosPorDepartamento: Object.entries(departamentos)
        .map(([departamento, quantidade]) => ({ departamento, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade),
      sistemasPorArea: Object.entries(areas)
        .map(([area, quantidade]) => ({ area, quantidade }))
        .sort((a, b) => b.quantidade - a.quantidade || a.area.localeCompare(b.area)),
      ultimosAcessos,
    }
  }, [atribuicoes, sistemas, usuarios])

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
    setSistemas(copiarSistemas())
    setUsuarios(copiarUsuarios())
    setAtribuicoes(copiarAtribuicoes())
    if (usuarioLogadoId && !(usuariosSeed as Usuario[]).some((item) => item.id === usuarioLogadoId))
      sair()
  }

  const criarSistema = (dados: SistemaInput) => {
    const sistema: Sistema = {
      ...dados,
      id: novoId('sistema'),
      criadoEm: new Date().toISOString(),
    }
    setSistemas((atuais) => [...atuais, sistema])
    return sistema
  }

  const atualizarSistema = (id: string, dados: SistemaInput) => {
    setSistemas((atuais) =>
      atuais.map((sistema) => (sistema.id === id ? { ...sistema, ...dados } : sistema)),
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
      ...novos.map((sistemaId) => ({ usuarioId, sistemaId, data: momento })),
    ])
  }

  const criarUsuario = (dados: UsuarioInput) => {
    const usuario: Usuario = {
      ...dados,
      sistemasIds: [...dados.sistemasIds],
      id: novoId('usuario'),
      criadoEm: new Date().toISOString(),
    }
    setUsuarios((atuais) => [...atuais, usuario])
    registrarNovosAcessos(usuario.id, [], usuario.sistemasIds)
    return usuario
  }

  const atualizarUsuario = (id: string, dados: UsuarioInput) => {
    const anterior = usuarios.find((usuario) => usuario.id === id)
    if (anterior) registrarNovosAcessos(id, anterior.sistemasIds, dados.sistemasIds)
    setUsuarios((atuais) =>
      atuais.map((usuario) =>
        usuario.id === id
          ? {
              ...usuario,
              ...dados,
              senha: dados.senha || usuario.senha,
              sistemasIds: [...dados.sistemasIds],
            }
          : usuario,
      ),
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
    setAtribuicoes((atuais) => [
      ...atuais,
      { usuarioId, sistemaId, data: new Date().toISOString() },
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

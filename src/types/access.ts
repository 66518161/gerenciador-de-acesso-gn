export type StatusId = 1 | 2 | 3

export interface StatusInfo {
  statusId: StatusId
  nome: 'Ativo' | 'Inativo' | 'Bloqueado'
}

export const STATUS_MAP: Record<StatusId, { nome: string; badgeClass: string; color: string }> = {
  1: { nome: 'Ativo', badgeClass: 'status-badge--ativo', color: '#10B981' },
  2: { nome: 'Inativo', badgeClass: 'status-badge--inativo', color: '#64748B' },
  3: { nome: 'Bloqueado', badgeClass: 'status-badge--bloqueado', color: '#EF4444' },
}

export interface Departamento {
  id: string
  departamentoId?: number
  nome: string
  descricao?: string
  statusId: StatusId
  dataCriacao: string
  dataAlteracao?: string | null
  // Retrocompatibilidade opcional com componentes legados
  criadoEm?: string
}

export interface Sistema {
  id: string
  sistemaId?: number
  nome: string
  descricao?: string
  url: string
  statusId: StatusId
  area: string // mantido conforme instrução (área é derivada/extra do schema oficial)
  dataCriacao: string
  dataAlteracao?: string | null
  criadoEm?: string
}

export interface PerfilAcesso {
  id: string
  perfilId?: number
  sistemaId: string // Pertence obrigatoriamente a um sistema
  nome: string
  descricao?: string
  nivel?: string
  statusId?: StatusId
  dataCriacao: string
  dataAlteracao?: string | null
  criadoEm?: string
}

export interface UsuarioSistemaItem {
  sistemaId: string
  perfilId?: string
  statusId?: StatusId
  dataInicio?: string
  dataExpiracao?: string | null
  concedidoPor?: string | null
  dataCriacao?: string
  dataAlteracao?: string | null
}

export interface Usuario {
  id: string
  usuarioId?: number
  nome: string
  email: string
  departamentoId?: string | null
  departamento?: string
  statusId: StatusId
  idMicrosoft?: string | null // GUID do Entra ID
  senha?: string
  ultimoLogin?: string | null
  dataCriacao: string
  dataAlteracao?: string
  criadoEm?: string
  sistemasIds: string[] // IDs dos sistemas vinculados
  vinculos?: UsuarioSistemaItem[] // Informações completas de UsuarioSistema
  perfilId?: string // retrocompatibilidade
}

export interface Atribuicao {
  usuarioSistemaId?: string
  usuarioId: string
  sistemaId: string
  perfilId?: string
  statusId?: StatusId
  dataInicio?: string
  dataExpiracao?: string | null
  concedidoPor?: string | null
  dataCriacao?: string
  dataAlteracao?: string | null
  data: string // data de atribuição / início
}

export interface LogAcesso {
  logAcessoId: string
  usuarioId?: string | null
  sistemaId?: string | null
  emailInformado: string
  dataHora: string
  sucesso: boolean
  motivo?: string | null
  enderecoIp?: string | null
  userAgent?: string | null
}

export interface IndicadorVisual {
  delta: number
  serie: number[]
}

export interface Estatisticas {
  sistemasAtivos: number
  usuariosCadastrados: number
  acessosConcedidos: number
  semAtribuicao: number
  acessosPorSistema: Array<{ sistema: Sistema; quantidade: number }>
  usuariosPorDepartamento: Array<{ departamento: string; quantidade: number }>
  sistemasPorArea: Array<{ area: string; quantidade: number }>
  ultimosAcessos: Array<{
    atribuicao: Atribuicao
    usuario: Usuario
    sistema: Sistema
    perfil?: PerfilAcesso
  }>
}

export type DepartamentoInput = {
  nome: string
  descricao?: string
  statusId?: StatusId
}

export type PerfilInput = {
  sistemaId: string
  nome: string
  descricao?: string
  nivel?: string
  statusId?: StatusId
}

export type SistemaInput = {
  nome: string
  descricao?: string
  url: string
  area: string
  statusId?: StatusId
}

export type UsuarioVinculoInput = {
  sistemaId: string
  perfilId?: string
  dataInicio?: string
  dataExpiracao?: string | null
  statusId?: StatusId
}

export type UsuarioInput = {
  nome: string
  email: string
  departamentoId?: string | null
  departamento?: string
  statusId?: StatusId
  senha?: string
  idMicrosoft?: string | null
  sistemasIds: string[]
  perfilId?: string
  vinculos?: UsuarioVinculoInput[]
}

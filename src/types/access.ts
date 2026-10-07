export interface Sistema {
  id: string
  nome: string
  url: string
  area: string
  criadoEm: string
}

export interface Usuario {
  id: string
  nome: string
  email: string
  departamento: string
  senha: string
  idMicrosoft: string
  sistemasIds: string[]
  criadoEm: string
}

export interface Atribuicao {
  usuarioId: string
  sistemaId: string
  data: string
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
  ultimosAcessos: Array<{ atribuicao: Atribuicao; usuario: Usuario; sistema: Sistema }>
}

export type SistemaInput = Pick<Sistema, 'nome' | 'url' | 'area'>
export type UsuarioInput = Pick<
  Usuario,
  'nome' | 'email' | 'departamento' | 'senha' | 'idMicrosoft' | 'sistemasIds'
>

import React, { useEffect, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Building2,
  Check,
  ChevronDown,
  Cpu,
  Database,
  DollarSign,
  FileSpreadsheet,
  FolderKanban,
  Gavel,
  GraduationCap,
  Headphones,
  HeartHandshake,
  Landmark,
  Layers,
  LineChart,
  Megaphone,
  Monitor,
  PackageCheck,
  Plus,
  Scale,
  Server,
  Settings,
  ShieldCheck,
  Truck,
  Users,
  Wrench,
} from 'lucide-react'
import { classePorTexto } from './format'

/**
 * Normaliza uma string de área para comparação sem acentos, pontuação ou maiúsculas.
 */
function normalizarTexto(texto: string): string {
  return (texto || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/**
 * Mapeamento semântico centralizado de áreas corporativas para ícones Lucide.
 * Cobre todas as áreas presentes nos dados seed:
 * - Recursos Humanos / RH -> Users
 * - Suprimentos -> PackageCheck
 * - TI / Tecnologia -> Monitor
 * - Comunicação -> Megaphone
 * - Financeiro -> DollarSign
 * - Dados / BI -> Database / LineChart
 * - Comercial -> HeartHandshake
 * - Operações -> Settings
 * - Jurídico -> Scale
 * E fallback neutro -> Building2
 */
export const AREA_ICON_MAP: Record<string, LucideIcon> = {
  // RH & Pessoas
  'recursos humanos': Users,
  rh: Users,
  'gestao de pessoas': Users,
  'gente e gestao': Users,
  dp: Users,
  treinamento: GraduationCap,

  // TI & Tecnologia
  ti: Monitor,
  tecnologia: Monitor,
  'tecnologia da informacao': Monitor,
  infraestrutura: Server,
  helpdesk: Headphones,
  suporte: Headphones,
  desenvolvimento: Cpu,
  sistemas: Server,

  // Suprimentos & Compras & Logística
  suprimentos: PackageCheck,
  compras: PackageCheck,
  procurement: PackageCheck,
  logistica: Truck,
  distribuicao: Truck,

  // Comunicação & Marketing
  comunicacao: Megaphone,
  marketing: Megaphone,
  imprensa: Megaphone,
  endomarketing: Megaphone,

  // Financeiro & Controladoria
  financeiro: DollarSign,
  financas: DollarSign,
  controladoria: Landmark,
  contabilidade: FileSpreadsheet,
  tesouraria: DollarSign,
  fiscal: Landmark,

  // Dados & BI
  dados: Database,
  data: Database,
  bi: LineChart,
  analytics: LineChart,
  'business intelligence': LineChart,

  // Comercial & Vendas
  comercial: HeartHandshake,
  vendas: HeartHandshake,
  parcerias: HeartHandshake,

  // Operações & Campo
  operacoes: Settings,
  campo: Settings,
  manutencao: Wrench,
  engenharia: Wrench,

  // Jurídico & Compliance
  juridico: Scale,
  legal: Scale,
  compliance: ShieldCheck,
  auditoria: Gavel,

  // Projetos & Gestão
  projetos: FolderKanban,
  planejamento: FolderKanban,
}

/** Ícone de fallback neutro para qualquer área não mapeada */
export const FALLBACK_AREA_ICON: LucideIcon = Building2

/**
 * Retorna o componente de ícone correspondente à área informada.
 * Se a área não for encontrada no mapeamento, retorna FALLBACK_AREA_ICON (Building2).
 */
export function getAreaIcon(area?: string | null): LucideIcon {
  if (!area) return FALLBACK_AREA_ICON
  const chave = normalizarTexto(area)
  if (AREA_ICON_MAP[chave]) {
    return AREA_ICON_MAP[chave]
  }

  // Busca parcial por substrings conhecidas
  for (const [termo, icone] of Object.entries(AREA_ICON_MAP)) {
    if (chave.includes(termo) || termo.includes(chave)) {
      return icone
    }
  }

  return FALLBACK_AREA_ICON
}

export interface AreaBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  area: string
  showLabel?: boolean
  label?: string
  iconSize?: number
  size?: 'sm' | 'md' | 'lg'
}

/**
 * Componente visual de badge de área com ícone estilizado no padrão Vibra (glass + tom laranja/accent).
 * Funciona nos modos claro e escuro.
 */
export function AreaBadge({
  area,
  showLabel = true,
  label,
  iconSize,
  size = 'md',
  className = '',
  ...props
}: AreaBadgeProps) {
  const Icone = getAreaIcon(area)
  const cor = classePorTexto(area)
  const texto = label ?? area

  const sizeClasses = {
    sm: 'area-badge--sm',
    md: 'area-badge--md',
    lg: 'area-badge--lg',
  }[size]

  const defaultIconSize = size === 'sm' ? 12 : size === 'lg' ? 16 : 13

  return (
    <span
      className={`area-badge area-badge--${cor} ${sizeClasses} ${className}`.trim()}
      title={area}
      {...props}
    >
      <span className="area-badge__icon" aria-hidden="true">
        <Icone size={iconSize ?? defaultIconSize} />
      </span>
      {showLabel && <span className="area-badge__label">{texto}</span>}
    </span>
  )
}

/**
 * Componente Seletor de Área com ícone representativo em cada opção.
 * Suporta opção "Todas as áreas" (para filtros) ou opções para formulários.
 */
export interface AreaSelectDropdownProps {
  value: string
  onChange: (value: string) => void
  areas: string[]
  allowAll?: boolean
  allLabel?: string
  placeholder?: string
  allowCustom?: boolean
  onSelectCustom?: () => void
  className?: string
  id?: string
  'aria-label'?: string
}

export function AreaSelectDropdown({
  value,
  onChange,
  areas,
  allowAll = false,
  allLabel = 'Todas as áreas',
  placeholder = 'Selecione uma área',
  allowCustom = false,
  onSelectCustom,
  className = '',
  id,
  'aria-label': ariaLabel,
}: AreaSelectDropdownProps) {
  const [aberto, setAberto] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fecha o dropdown ao clicar fora
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setAberto(false)
      }
    }
    if (aberto) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [aberto])

  // Fecha no Esc
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setAberto(false)
    }
    if (aberto) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [aberto])

  const isAll = allowAll && (value === 'todas' || !value)
  const IconeSelecionado = isAll ? Layers : value ? getAreaIcon(value) : Building2

  const textoBotao = isAll ? allLabel : value || placeholder

  return (
    <div className={`relative inline-block ${className}`} ref={containerRef}>
      <button
        type="button"
        id={id}
        aria-label={ariaLabel ?? 'Selecionar área'}
        aria-expanded={aberto}
        aria-haspopup="listbox"
        className="area-select-trigger w-full"
        onClick={() => setAberto((prev) => !prev)}
      >
        <span className="area-select-trigger__value">
          <span className="area-select-option__icon" aria-hidden="true">
            <IconeSelecionado size={14} />
          </span>
          <span>{textoBotao}</span>
        </span>
        <ChevronDown
          size={15}
          className={`transition-transform duration-150 ${aberto ? 'rotate-180' : ''}`}
        />
      </button>

      {aberto && (
        <div
          role="listbox"
          className="area-select-popover absolute left-0 top-[calc(100%+6px)] min-w-full"
        >
          {allowAll && (
            <button
              type="button"
              role="option"
              aria-selected={isAll}
              className={`area-select-option ${isAll ? 'is-selected' : ''}`}
              onClick={() => {
                onChange('todas')
                setAberto(false)
              }}
            >
              <span className="area-select-option__left">
                <span className="area-select-option__icon">
                  <Layers size={14} />
                </span>
                <span>{allLabel}</span>
              </span>
              {isAll && <Check size={14} />}
            </button>
          )}

          {areas.map((item) => {
            const Icone = getAreaIcon(item)
            const selecionado = value === item
            return (
              <button
                type="button"
                key={item}
                role="option"
                aria-selected={selecionado}
                className={`area-select-option ${selecionado ? 'is-selected' : ''}`}
                onClick={() => {
                  onChange(item)
                  setAberto(false)
                }}
              >
                <span className="area-select-option__left">
                  <span className="area-select-option__icon">
                    <Icone size={14} />
                  </span>
                  <span>{item}</span>
                </span>
                {selecionado && <Check size={14} />}
              </button>
            )
          })}

          {allowCustom && onSelectCustom && (
            <>
              <div className="my-1 border-t border-[var(--hairline)]" />
              <button
                type="button"
                className="area-select-option text-[var(--color-primary)] font-medium"
                onClick={() => {
                  setAberto(false)
                  onSelectCustom()
                }}
              >
                <span className="area-select-option__left">
                  <span className="area-select-option__icon">
                    <Plus size={14} />
                  </span>
                  <span>+ Criar nova área</span>
                </span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

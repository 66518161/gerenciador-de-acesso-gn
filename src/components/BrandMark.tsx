import { cn } from '../lib/utils'

interface BrandMarkProps {
  compact?: boolean
  className?: string
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div
      className={cn('brand-mark', compact && 'brand-mark--compact', className)}
      aria-label="Gerenciador de Acesso — símbolo ilustrativo"
      title="Símbolo genérico ilustrativo; o logotipo oficial não foi fornecido."
    >
      <svg viewBox="0 0 40 40" role="img" aria-hidden="true">
        <path d="M20 3.5 27 10.5 20 17.5 13 10.5Z" />
        <path d="m29.5 13 7 7-7 7-7-7Z" />
        <path d="m10.5 13 7 7-7 7-7-7Z" />
        <path d="m20 22.5 7 7-7 7-7-7Z" />
        <circle cx="20" cy="20" r="3.2" />
      </svg>
      {!compact && (
        <span className="brand-copy">
          <strong>Acesso</strong>
          <small>Gerenciador interno</small>
        </span>
      )}
    </div>
  )
}

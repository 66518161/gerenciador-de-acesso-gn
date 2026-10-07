import { ArrowLeft, FileQuestion } from 'lucide-react'
import { Link } from 'react-router-dom'
import { BrandMark } from '../components/BrandMark'

export default function NotFound() {
  return (
    <main className="not-found-page">
      <div className="not-found-card glass-surface">
        <BrandMark compact />
        <span className="empty-state__icon">
          <FileQuestion size={28} />
        </span>
        <span className="eyebrow">ERRO 404</span>
        <h1>Página não encontrada</h1>
        <p>O endereço informado não existe ou foi movido.</p>
        <Link to="/" className="button-primary link-button">
          <ArrowLeft size={17} /> Voltar para o início
        </Link>
      </div>
    </main>
  )
}

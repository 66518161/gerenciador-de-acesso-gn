import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Briefcase,
  ChevronDown,
  DatabaseZap,
  LayoutDashboard,
  LogOut,
  Mail,
  Menu,
  Moon,
  RefreshCw,
  ServerCog,
  Settings,
  Sun,
  User,
  UsersRound,
  X,
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { BrandMark } from './BrandMark'
import { useAccess } from '../context/AccessContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../hooks/use-toast'
import { iniciais } from '../lib/format'
import { cn } from '../lib/utils'

const navegacao = [
  { label: 'Visão Geral', to: '/', icon: LayoutDashboard },
  { label: 'Sistemas', to: '/sistemas', icon: ServerCog },
  { label: 'Usuários', to: '/usuarios', icon: UsersRound },
  { label: 'Configurações', to: '/configuracoes', icon: Settings },
]

const titulos: Record<string, string> = {
  '/': 'Visão Geral',
  '/sistemas': 'Sistemas',
  '/usuarios': 'Usuários',
  '/configuracoes': 'Configurações',
  '/perfil': 'Meu Perfil',
}

export default function Layout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toast } = useToast()
  const { tema, alternarTema } = useTheme()
  const { usuarioLogado, perfis, sair, recarregarDemonstracao } = useAccess()
  const [drawerAberto, setDrawerAberto] = useState(false)

  useEffect(() => {
    setDrawerAberto(false)
  }, [location.pathname, location.search])

  const encerrarSessao = () => {
    sair()
    navigate('/login')
    toast({ title: 'Sessão encerrada.', description: 'Até a próxima!', duration: 3500 })
  }

  const atualizarDados = () => {
    recarregarDemonstracao()
    toast({
      title: 'Dados atualizados.',
      description: 'Os dados de demonstração foram restaurados.',
      duration: 3500,
    })
  }

  if (!usuarioLogado) return null

  return (
    <div className="app-shell">
      <button
        className={cn('drawer-overlay', drawerAberto && 'is-open')}
        onClick={() => setDrawerAberto(false)}
        aria-label="Fechar menu"
        tabIndex={drawerAberto ? 0 : -1}
      />

      <aside className={cn('sidebar glass-surface', drawerAberto && 'is-open')}>
        <div className="sidebar__top">
          <BrandMark />
          <button
            className="icon-button sidebar__close"
            onClick={() => setDrawerAberto(false)}
            aria-label="Fechar navegação"
          >
            <X size={19} />
          </button>
        </div>

        <nav className="sidebar__nav" aria-label="Navegação principal">
          <span className="nav-section-label">GERENCIAMENTO</span>
          {navegacao.map(({ label, to, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) => cn('nav-item', isActive && 'is-active')}
            >
              <Icon size={18} />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar__footer">
          <div className="demo-badge">
            <DatabaseZap size={13} /> Dados de demonstração
          </div>
          <div className="sync-row">
            <div>
              <span>Dados atualizados</span>
              <strong>agora mesmo</strong>
            </div>
            <button
              className="icon-button"
              onClick={atualizarDados}
              aria-label="Restaurar dados de demonstração"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar glass-surface">
          <div className="topbar__title">
            <button
              className="icon-button menu-button"
              onClick={() => setDrawerAberto(true)}
              aria-label="Abrir navegação"
            >
              <Menu size={21} />
            </button>
            <div>
              <span>PÁGINA ATUAL</span>
              <strong>{titulos[location.pathname] ?? 'Gerenciador'}</strong>
            </div>
          </div>

          <div className="topbar__actions">
            <button
              className="icon-button theme-toggle"
              onClick={alternarTema}
              aria-label={`Ativar tema ${tema === 'dark' ? 'claro' : 'escuro'}`}
              title={`Ativar tema ${tema === 'dark' ? 'claro' : 'escuro'}`}
            >
              {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            {(() => {
              const vinculoComPerfil = usuarioLogado.vinculos?.find((v) => v.perfilId)
              const perfilEncontrado = vinculoComPerfil?.perfilId
                ? perfis.find((p) => p.id === vinculoComPerfil.perfilId)
                : null
              const perfilNome = perfilEncontrado?.nome ?? perfilEncontrado?.nivel ?? 'Colaborador'

              return (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="topbar-user-flag glass-surface" aria-label="Menu do usuário">
                      <span className="avatar topbar-user-flag__avatar">
                        {iniciais(usuarioLogado.nome)}
                      </span>
                      <div className="topbar-user-flag__info">
                        <strong className="topbar-user-flag__name">{usuarioLogado.nome}</strong>
                        <span className="topbar-user-flag__meta">
                          {usuarioLogado.departamento || 'Geral'}
                        </span>
                      </div>
                      <ChevronDown size={14} className="topbar-user-flag__chevron" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={8}
                    className="glass-surface dropdown-panel topbar-user-menu"
                  >
                    <div className="user-menu-header">
                      <div className="user-menu-header__top">
                        <span className="avatar avatar--large">{iniciais(usuarioLogado.nome)}</span>
                        <div className="user-menu-header__titles">
                          <strong className="user-menu-header__name">{usuarioLogado.nome}</strong>
                          <span className="user-menu-header__role-pill">{perfilNome}</span>
                        </div>
                      </div>
                      <div className="user-menu-details">
                        <div className="user-menu-detail-item" title={usuarioLogado.email}>
                          <Mail size={13} />
                          <span>{usuarioLogado.email}</span>
                        </div>
                        {usuarioLogado.departamento && (
                          <div className="user-menu-detail-item">
                            <Briefcase size={13} />
                            <span>{usuarioLogado.departamento}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem onSelect={() => navigate('/perfil')}>
                      <User size={15} /> Meu Perfil
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => navigate('/configuracoes')}>
                      <Settings size={15} /> Configurações
                    </DropdownMenuItem>

                    <DropdownMenuSeparator />

                    <DropdownMenuItem className="menu-danger" onSelect={encerrarSessao}>
                      <LogOut size={15} /> Sair da conta
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )
            })()}
          </div>
        </header>

        <main className="content-area">
          <div key={`${location.pathname}${location.search}`} className="page-transition">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

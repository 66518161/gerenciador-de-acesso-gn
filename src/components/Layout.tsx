import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell,
  ChevronDown,
  DatabaseZap,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  RefreshCw,
  ServerCog,
  Settings,
  Sun,
  UserRound,
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
  const { usuarioLogado, estatisticas, sair, recarregarDemonstracao } = useAccess()
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="sidebar-user glass-surface">
                <span className="avatar avatar--orange">{iniciais(usuarioLogado.nome)}</span>
                <span className="sidebar-user__copy">
                  <strong>{usuarioLogado.nome}</strong>
                  <small>{usuarioLogado.departamento}</small>
                </span>
                <ChevronDown size={15} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="top"
              align="start"
              className="glass-surface dropdown-panel sidebar-user-menu"
            >
              <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onSelect={() => navigate('/configuracoes')}>
                <Settings size={16} /> Configurações
              </DropdownMenuItem>
              <DropdownMenuItem className="menu-danger" onSelect={encerrarSessao}>
                <LogOut size={16} /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
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

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="icon-button notification-button" aria-label="Abrir notificações">
                  <Bell size={18} />
                  <span className="notification-dot">{estatisticas.semAtribuicao > 0 ? 2 : 1}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="glass-surface dropdown-panel notifications-panel"
              >
                <DropdownMenuLabel>Notificações</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {estatisticas.semAtribuicao > 0 && (
                  <DropdownMenuItem onSelect={() => navigate('/usuarios?system=sem-atribuicao')}>
                    <span className="notification-icon notification-icon--warning">
                      <UserRound size={16} />
                    </span>
                    <span>
                      <strong>{estatisticas.semAtribuicao} sem atribuição</strong>
                      <small>Revise os acessos pendentes.</small>
                    </span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onSelect={atualizarDados}>
                  <span className="notification-icon">
                    <DatabaseZap size={16} />
                  </span>
                  <span>
                    <strong>Ambiente demonstrativo</strong>
                    <small>Alterações duram apenas nesta sessão.</small>
                  </span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="topbar-avatar" title={usuarioLogado.nome}>
              {iniciais(usuarioLogado.nome)}
            </div>
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

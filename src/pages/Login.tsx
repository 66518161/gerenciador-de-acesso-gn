import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Moon, Sun } from 'lucide-react'
import { Button } from '../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog'
import { BrandMark } from '../components/BrandMark'
import { useAccess } from '../context/AccessContext'
import { useTheme } from '../context/ThemeContext'
import { useToast } from '../hooks/use-toast'
import { cn } from '../lib/utils'

export default function Login() {
  const navigate = useNavigate()
  const { toast } = useToast()
  const { autenticar, usuarios } = useAccess()
  const { tema, alternarTema } = useTheme()
  const usuarioDemo = usuarios[0]
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [sacudir, setSacudir] = useState(false)
  const [esqueciAberto, setEsqueciAberto] = useState(false)

  const entrar = (event: React.FormEvent) => {
    event.preventDefault()
    setErro('')
    setCarregando(true)
    requestAnimationFrame(() => {
      const usuario = autenticar(email, senha)
      setCarregando(false)
      if (!usuario) {
        setErro('E-mail ou senha inválidos.')
        setSacudir(true)
        return
      }
      toast({
        title: `Bem-vindo(a), ${usuario.nome}!`,
        description: 'Seu ambiente de acessos está pronto.',
        className: 'welcome-toast',
        duration: 3500,
      })
      navigate('/')
    })
  }

  const loginGoogle = () => {
    toast({
      title: 'Login social indisponível.',
      description: 'O acesso com Google não está disponível nesta versão de demonstração.',
      duration: 3500,
    })
  }

  return (
    <div className="login-page">
      <div className="login-beam" aria-hidden="true" />
      <button
        className="icon-button login-theme"
        onClick={alternarTema}
        aria-label={`Ativar tema ${tema === 'dark' ? 'claro' : 'escuro'}`}
      >
        {tema === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
      </button>

      <main className="login-wrap">
        <form
          className={cn('login-card glass-surface', sacudir && 'animate-shake')}
          onSubmit={entrar}
          onAnimationEnd={() => setSacudir(false)}
        >
          <BrandMark compact className="login-brand" />
          <div className="login-copy">
            <h1>Entrar</h1>
            <p>Informe seus dados para acessar.</p>
          </div>

          <div className="form-field">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              className="field"
              type="email"
              autoComplete="email"
              placeholder="Digite seu e-mail"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="form-field">
            <label htmlFor="senha">Senha</label>
            <div className="field-with-action">
              <input
                id="senha"
                className="field"
                type={mostrarSenha ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Senha"
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setMostrarSenha((valor) => !valor)}
                aria-label={mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'}
              >
                {mostrarSenha ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="button" className="forgot-link" onClick={() => setEsqueciAberto(true)}>
            Esqueceu a senha?
          </button>
          {erro && (
            <p className="form-error login-error" role="alert">
              {erro}
            </p>
          )}

          <Button className="login-submit" type="submit" disabled={carregando}>
            {carregando ? (
              <>
                <LoaderCircle size={18} className="spin" /> Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>

          <div className="login-divider">
            <span>OU</span>
          </div>
          <Button type="button" variant="outline" className="google-button" onClick={loginGoogle}>
            <span className="google-g">G</span> Continuar com Google
          </Button>

          <p className="login-footer">
            Não tem uma conta? <strong>Fale com o administrador.</strong>
          </p>
        </form>

        <p className="demo-hint">
          Ambiente de demonstração · <span>{usuarioDemo?.email}</span> · senha{' '}
          <span>{usuarioDemo?.senha}</span>
        </p>
      </main>

      <Dialog open={esqueciAberto} onOpenChange={setEsqueciAberto}>
        <DialogContent className="glass-surface app-dialog app-dialog--small">
          <DialogHeader>
            <span className="dialog-icon">
              <LockKeyhole size={22} />
            </span>
            <DialogTitle>Recuperar acesso</DialogTitle>
            <DialogDescription>
              Neste ambiente de demonstração, a troca de senha não envia e-mails. Solicite uma nova
              senha ao administrador responsável pelos acessos internos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button className="button-primary" onClick={() => setEsqueciAberto(false)}>
              Entendi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

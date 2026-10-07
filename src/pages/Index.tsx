import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Download,
  KeyRound,
  Layers3,
  Plus,
  ServerCog,
  ShieldCheck,
  UserRoundX,
  UsersRound,
} from 'lucide-react'
import { Button } from '../components/ui/button'
import { PageHeader } from '../components/PageHeader'
import { useAccess } from '../context/AccessContext'
import { formatarData, iniciais, pluralizar } from '../lib/format'

type KpiKey = 'sistemas' | 'usuarios' | 'acessos' | 'semAtribuicao'

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    let frame = 0
    const inicio = performance.now()
    const animar = (agora: number) => {
      const progresso = Math.min((agora - inicio) / 800, 1)
      setDisplay(Math.round(value * (1 - Math.pow(1 - progresso, 3))))
      if (progresso < 1) frame = requestAnimationFrame(animar)
    }
    frame = requestAnimationFrame(animar)
    return () => cancelAnimationFrame(frame)
  }, [value])
  return <>{display}</>
}

function Sparkline({ values, alert }: { values: number[]; alert?: boolean }) {
  const minimo = Math.min(...values)
  const maximo = Math.max(...values)
  const pontos = values
    .map((valor, indice) => {
      const x = (indice / Math.max(values.length - 1, 1)) * 92 + 4
      const y = 31 - ((valor - minimo) / Math.max(maximo - minimo, 1)) * 23
      return `${x},${y}`
    })
    .join(' ')
  return (
    <svg
      className={alert ? 'sparkline sparkline--alert' : 'sparkline'}
      viewBox="0 0 100 38"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={alert ? 'spark-alert' : 'spark-orange'} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="currentColor" stopOpacity=".28" />
          <stop offset="1" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon
        points={`4,36 ${pontos} 96,36`}
        fill={`url(#${alert ? 'spark-alert' : 'spark-orange'})`}
      />
      <polyline
        points={pontos}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={pontos.split(' ').at(-1)?.split(',')[0]}
        cy={pontos.split(' ').at(-1)?.split(',')[1]}
        r="2.5"
        fill="currentColor"
      />
    </svg>
  )
}

const kpiConfig: Array<{
  key: KpiKey
  label: string
  icon: typeof ServerCog
  valueKey: 'sistemasAtivos' | 'usuariosCadastrados' | 'acessosConcedidos' | 'semAtribuicao'
  alert?: boolean
}> = [
  { key: 'sistemas', label: 'Sistemas Ativos', icon: ServerCog, valueKey: 'sistemasAtivos' },
  {
    key: 'usuarios',
    label: 'Usuários Cadastrados',
    icon: UsersRound,
    valueKey: 'usuariosCadastrados',
  },
  { key: 'acessos', label: 'Acessos Concedidos', icon: KeyRound, valueKey: 'acessosConcedidos' },
  {
    key: 'semAtribuicao',
    label: 'Sem Atribuição',
    icon: UserRoundX,
    valueKey: 'semAtribuicao',
    alert: true,
  },
]

export default function Dashboard() {
  const navigate = useNavigate()
  const { estatisticas, indicadores } = useAccess()
  const maiorAcesso = Math.max(...estatisticas.acessosPorSistema.map((item) => item.quantidade), 1)

  const totalDepartamentos = estatisticas.usuariosPorDepartamento.reduce(
    (total, item) => total + item.quantidade,
    0,
  )
  const donut = useMemo(() => {
    let acumulado = 0
    return estatisticas.usuariosPorDepartamento.map((item, index) => {
      const inicio = (acumulado / Math.max(totalDepartamentos, 1)) * 100
      acumulado += item.quantidade
      const fim = (acumulado / Math.max(totalDepartamentos, 1)) * 100
      return { ...item, inicio, fim, classe: `donut-segment--${index % 3}` }
    })
  }, [estatisticas.usuariosPorDepartamento, totalDepartamentos])

  const donutGradient = donut
    .map((item, index) => {
      const cor =
        index % 3 === 0
          ? 'var(--color-primary)'
          : index % 3 === 1
            ? 'var(--color-turquoise)'
            : 'var(--neutral-soft)'
      return `${cor} ${item.inicio}% ${Math.max(item.inicio, item.fim - 1)}%, var(--surface-base) ${Math.max(item.inicio, item.fim - 1)}% ${item.fim}%`
    })
    .join(', ')

  const exportarCsv = () => {
    const linhas = [
      ['Usuário', 'E-mail', 'Sistema', 'Área', 'Concedido em'],
      ...estatisticas.ultimosAcessos.map(({ usuario, sistema, atribuicao }) => [
        usuario.nome,
        usuario.email,
        sistema.nome,
        sistema.area,
        formatarData(atribuicao.data, true),
      ]),
    ]
    const csv = linhas
      .map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'acessos-concedidos.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="dashboard-page page-stack">
      <PageHeader
        eyebrow="PAINEL ADMINISTRATIVO"
        title="Gerenciador de Acessos"
        description="Controle o acesso dos colaboradores aos portais internos."
        actions={
          <>
            <Button variant="outline" className="button-secondary" onClick={exportarCsv}>
              <Download size={17} /> Exportar
            </Button>
            <Button className="button-primary" onClick={() => navigate('/usuarios?novo=1')}>
              <Plus size={17} /> Novo usuário
            </Button>
          </>
        }
      />

      <section className="kpi-grid" aria-label="Indicadores principais">
        {kpiConfig.map(({ key, label, icon: Icon, valueKey, alert }, index) => {
          const visual = indicadores[key]
          const positivo = visual.delta >= 0
          return (
            <article
              key={key}
              className={`kpi-card glass-surface stagger-${index + 1}${alert ? ' kpi-card--alert' : ''}`}
            >
              <div className="kpi-card__top">
                <span className="kpi-icon">
                  <Icon size={19} />
                </span>
                <span className={`delta ${positivo ? 'is-positive' : 'is-negative'}`}>
                  {positivo ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                  {Math.abs(visual.delta)}%
                </span>
              </div>
              <div className="kpi-card__body">
                <div>
                  <strong>
                    <AnimatedNumber value={estatisticas[valueKey]} />
                  </strong>
                  <span>{label}</span>
                </div>
                <Sparkline values={visual.serie} alert={alert} />
              </div>
              <small>{alert ? 'Requer atenção' : 'em relação ao período anterior'}</small>
            </article>
          )
        })}
      </section>

      <section className="dashboard-grid dashboard-grid--charts">
        <article className="dashboard-card glass-surface access-bars-card">
          <div className="card-heading">
            <div>
              <span className="card-kicker">DISTRIBUIÇÃO</span>
              <h2>Acessos por Sistema</h2>
            </div>
            <span className="status-pill">
              <span /> Atualizado
            </span>
          </div>
          <div className="access-bars">
            {estatisticas.acessosPorSistema.map(({ sistema, quantidade }, index) => (
              <button
                className="access-bar-row"
                key={sistema.id}
                onClick={() => navigate(`/usuarios?system=${encodeURIComponent(sistema.id)}`)}
                style={{ '--bar-delay': `${index * 60}ms` } as React.CSSProperties}
                title={`${sistema.nome}: ${pluralizar(quantidade, 'acesso', 'acessos')}`}
              >
                <span className="access-bar-label">
                  <strong>{sistema.nome}</strong>
                  <small>{sistema.area}</small>
                </span>
                <span className="access-bar-track">
                  <span
                    className="access-bar-fill"
                    style={
                      {
                        '--bar-size': `${Math.max((quantidade / maiorAcesso) * 100, 4)}%`,
                      } as React.CSSProperties
                    }
                  />
                </span>
                <b>{quantidade}</b>
              </button>
            ))}
          </div>
        </article>

        <article className="dashboard-card glass-surface department-card">
          <div className="card-heading">
            <div>
              <span className="card-kicker">EQUIPES</span>
              <h2>Usuários por Departamento</h2>
            </div>
          </div>
          <div className="department-chart">
            <div className="donut-wrap">
              <div
                className="donut-chart"
                style={{ background: `conic-gradient(${donutGradient})` }}
              >
                <div className="donut-center">
                  <strong>{totalDepartamentos}</strong>
                  <span>usuários</span>
                </div>
              </div>
            </div>
            <div className="donut-legend">
              {donut.map((item, index) => (
                <button
                  key={item.departamento}
                  onClick={() =>
                    navigate(`/usuarios?dept=${encodeURIComponent(item.departamento)}`)
                  }
                >
                  <span className={`legend-dot donut-segment--${index % 3}`} />
                  <span>
                    <strong>{item.departamento}</strong>
                    <small>{item.quantidade} usuários</small>
                  </span>
                  <ArrowRight size={14} />
                </button>
              ))}
            </div>
          </div>
        </article>
      </section>

      <section className="dashboard-grid dashboard-grid--bottom">
        <article className="dashboard-card glass-surface recent-access-card">
          <div className="card-heading">
            <div>
              <span className="card-kicker">ATIVIDADE RECENTE</span>
              <h2>Últimos acessos concedidos</h2>
            </div>
            <button className="text-link" onClick={() => navigate('/usuarios')}>
              Ver todos <ArrowRight size={14} />
            </button>
          </div>
          <div className="recent-list">
            {estatisticas.ultimosAcessos.slice(0, 5).map(({ atribuicao, usuario, sistema }) => (
              <div
                className="recent-row"
                key={`${atribuicao.usuarioId}-${atribuicao.sistemaId}-${atribuicao.data}`}
              >
                <span className="avatar avatar--small">{iniciais(usuario.nome)}</span>
                <span className="recent-copy">
                  <strong>{usuario.nome}</strong>
                  <small>
                    recebeu acesso a <b>{sistema.nome}</b>
                  </small>
                </span>
                <span className="recent-date">
                  <CheckCircle2 size={14} />
                  {formatarData(atribuicao.data)}
                </span>
              </div>
            ))}
          </div>
        </article>

        <article className="dashboard-card glass-surface areas-card">
          <div className="card-heading">
            <div>
              <span className="card-kicker">CATÁLOGO</span>
              <h2>Sistemas por Área</h2>
            </div>
            <Layers3 size={19} />
          </div>
          <p className="card-description">
            Explore os portais organizados pelas áreas responsáveis.
          </p>
          <div className="area-chips">
            {estatisticas.sistemasPorArea.map(({ area, quantidade }) => (
              <button
                key={area}
                onClick={() => navigate(`/sistemas?area=${encodeURIComponent(area)}`)}
              >
                <span>{area}</span>
                <b>{quantidade}</b>
                <ArrowRight size={14} />
              </button>
            ))}
          </div>
          <div className="areas-summary">
            <span className="kpi-icon">
              <ShieldCheck size={18} />
            </span>
            <span>
              <strong>{estatisticas.sistemasAtivos} portais monitorados</strong>
              <small>Catálogo de sistemas internos ativos</small>
            </span>
          </div>
        </article>
      </section>
    </div>
  )
}

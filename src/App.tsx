import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  ArchiveRestore,
  CalendarDays,
  Check,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  Download,
  Eye,
  FileSpreadsheet,
  Heart,
  LayoutDashboard,
  Lock,
  Menu,
  Palette,
  Phone,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  Store,
  Upload,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { DashboardTheme, ImportReport, WeddingData } from './types'
import { seedData } from './seed'
import { parseWorkbook } from './parser'
import {
  daysFromToday,
  daysUntil,
  downloadFile,
  formatMoney,
  hashText,
  normalize,
  parseDate,
  saveData,
} from './utils'

type Section = 'visao' | 'convidados' | 'financas' | 'cronograma' | 'fornecedores'
type Preview = { data: WeddingData; report: ImportReport }
function loadInitial(): WeddingData {
  try {
    return JSON.parse(localStorage.getItem('nosso-sim-data') || '')
  } catch {
    return seedData
  }
}
function loadHistory(): WeddingData[] {
  try {
    return JSON.parse(localStorage.getItem('nosso-sim-history') || '[]')
  } catch {
    return []
  }
}

function App() {
  const [data, setData] = useState<WeddingData>(loadInitial),
    [history, setHistory] = useState<WeddingData[]>(loadHistory)
  const [section, setSection] = useState<Section>('visao'),
    [preview, setPreview] = useState<Preview | null>(null),
    [settingsOpen, setSettingsOpen] = useState(false)
  const [loading, setLoading] = useState(false),
    [notice, setNotice] = useState(''),
    [menuOpen, setMenuOpen] = useState(false)
  const [locked, setLocked] = useState(Boolean(localStorage.getItem('nosso-sim-password')))
  const [installPrompt, setInstallPrompt] = useState<
    (Event & { prompt?: () => Promise<void> }) | null
  >(null)
  const inputRef = useRef<HTMLInputElement>(null),
    restoreRef = useRef<HTMLInputElement>(null)
  useEffect(() => {
    const h = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as Event & { prompt?: () => Promise<void> })
    }
    window.addEventListener('beforeinstallprompt', h)
    return () => window.removeEventListener('beforeinstallprompt', h)
  }, [])
  const theme = data.theme || seedData.theme!
  useEffect(() => {
    document.documentElement.dataset.theme = theme.dark ? 'dark' : 'light'
    document.documentElement.style.setProperty('--olive', theme.accent)
  }, [theme])
  const stats = useMemo(() => computeStats(data), [data]),
    alerts = useMemo(() => buildAlerts(data), [data])
  function toast(message: string) {
    setNotice(message)
    window.setTimeout(() => setNotice(''), 4200)
  }
  async function onFile(file?: File) {
    if (!file) return
    setLoading(true)
    try {
      setPreview(await parseWorkbook(file))
    } catch {
      toast('Não consegui ler o arquivo. Exporte como .xlsx e tente novamente.')
    } finally {
      setLoading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }
  function confirmImport() {
    if (!preview) return
    const h = [data, ...history].slice(0, 5)
    setHistory(h)
    localStorage.setItem('nosso-sim-history', JSON.stringify(h))
    const next = { ...preview.data, theme }
    setData(next)
    saveData(next)
    setPreview(null)
    setSection('visao')
    toast('Dados atualizados. Uma cópia anterior foi guardada.')
  }
  function undoImport() {
    if (!history[0]) return
    const h = history.slice(1)
    setData(history[0])
    saveData(history[0])
    setHistory(h)
    localStorage.setItem('nosso-sim-history', JSON.stringify(h))
    toast('Importação desfeita.')
  }
  async function restoreBackup(file?: File) {
    if (!file) return
    try {
      const restored = JSON.parse(await file.text()) as WeddingData
      if (!restored.guests || !restored.budget) throw new Error()
      setData(restored)
      saveData(restored)
      toast('Backup restaurado com sucesso.')
    } catch {
      toast('Esse arquivo não é um backup válido.')
    }
    if (restoreRef.current) restoreRef.current.value = ''
  }
  function updateTheme(next: DashboardTheme) {
    const updated = { ...data, theme: next }
    setData(updated)
    saveData(updated)
  }
  function clearData() {
    localStorage.removeItem('nosso-sim-data')
    localStorage.removeItem('nosso-sim-history')
    setData(seedData)
    setHistory([])
    setSettingsOpen(false)
    toast('Dados locais removidos; a demonstração foi restaurada.')
  }
  if (locked) return <LockScreen onUnlock={() => setLocked(false)} />
  const nav: { id: Section; label: string; icon: LucideIcon }[] = [
    { id: 'visao', label: 'Visão geral', icon: LayoutDashboard },
    { id: 'convidados', label: 'Convidados', icon: Users },
    { id: 'financas', label: 'Finanças', icon: WalletCards },
    { id: 'cronograma', label: 'Cronograma', icon: CalendarDays },
    { id: 'fornecedores', label: 'Fornecedores', icon: Store },
  ]
  return (
    <div className="app-shell">
      <aside className={menuOpen ? 'sidebar open' : 'sidebar'}>
        <button className="close-menu" onClick={() => setMenuOpen(false)}>
          <X />
        </button>
        <div className="brand">
          <span className="brand-mark">{theme.monogram || <Heart fill="currentColor" />}</span>
          <span>
            nosso
            <br />
            <b>sim.</b>
          </span>
        </div>
        <nav>
          {nav.map((item) => (
            <button
              key={item.id}
              className={section === item.id ? 'active' : ''}
              onClick={() => {
                setSection(item.id)
                setMenuOpen(false)
              }}
            >
              <item.icon />
              {item.label}
            </button>
          ))}
        </nav>
        <button className="settings-link" onClick={() => setSettingsOpen(true)}>
          <Settings /> Personalizar e proteger
        </button>
        <div className="side-card">
          {theme.photo ? (
            <img src={theme.photo} alt="Casal" />
          ) : (
            <div className="mini-rings">♡</div>
          )}
          <b>{data.couple}</b>
          <span>{formatWeddingDate(data.weddingDate)}</span>
          <small>{data.city}</small>
        </div>
        <div className="side-footer">
          <ShieldCheck /> Dados salvos somente neste dispositivo
        </div>
      </aside>
      <main>
        <header className="topbar">
          <button className="menu-button" onClick={() => setMenuOpen(true)}>
            <Menu />
          </button>
          <div className="crumb">
            <span>Planejamento</span>
            <ChevronRight />
            <b>{nav.find((n) => n.id === section)?.label}</b>
          </div>
          <div className="top-actions">
            {history.length > 0 && (
              <button className="ghost-button" onClick={undoImport}>
                <ArchiveRestore /> Desfazer importação
              </button>
            )}
            <button
              className="import-button"
              onClick={() => inputRef.current?.click()}
              disabled={loading}
            >
              <Upload />
              {loading ? 'Lendo…' : 'Importar planilha'}
            </button>
          </div>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx"
            hidden
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </header>
        <div className="content">
          {section === 'visao' && (
            <Overview
              data={data}
              stats={stats}
              alerts={alerts}
              widgets={theme.widgets}
              importFile={() => inputRef.current?.click()}
            />
          )}{' '}
          {section === 'convidados' && <Guests data={data} stats={stats} />}{' '}
          {section === 'financas' && <Finances data={data} stats={stats} />}{' '}
          {section === 'cronograma' && <Timeline data={data} />}{' '}
          {section === 'fornecedores' && <Vendors data={data} />}
        </div>
      </main>
      {menuOpen && <div className="scrim" onClick={() => setMenuOpen(false)} />}{' '}
      {preview && (
        <ImportModal
          preview={preview}
          onCancel={() => setPreview(null)}
          onConfirm={confirmImport}
        />
      )}{' '}
      {settingsOpen && (
        <SettingsModal
          data={data}
          theme={theme}
          onTheme={updateTheme}
          onClose={() => setSettingsOpen(false)}
          onBackup={() =>
            downloadFile(
              `nosso-sim-backup-${new Date().toISOString().slice(0, 10)}.json`,
              JSON.stringify(data, null, 2),
              'application/json',
            )
          }
          onRestore={() => restoreRef.current?.click()}
          onClear={clearData}
          installPrompt={installPrompt}
          onLock={() => setLocked(true)}
        />
      )}
      <input
        ref={restoreRef}
        type="file"
        accept=".json"
        hidden
        onChange={(e) => restoreBackup(e.target.files?.[0])}
      />
      {notice && (
        <div className="toast">
          <Check />
          {notice}
        </div>
      )}
    </div>
  )
}

function computeStats(data: WeddingData) {
  const responses = { confirmed: 0, waiting: 0, maybe: 0, declined: 0 }
  data.guests.forEach((g) => {
    const s = normalize(g.rsvp)
    if (s.includes('confirm')) responses.confirmed += g.people
    else if (s.includes('talvez')) responses.maybe += g.people
    else if (s.includes('recus') || s.includes('nao vai')) responses.declined += g.people
    else responses.waiting += g.people
  })
  if (data.guestSummary && data.guests.length < 20) Object.assign(responses, data.guestSummary)
  const planned = data.budget.reduce((s, x) => s + x.planned, 0),
    contracted = data.budget.reduce((s, x) => s + x.contracted, 0),
    paid = data.budget.reduce((s, x) => s + x.paid, 0),
    overdue = data.payments.filter(
      (p) => !p.paid && (normalize(p.status).includes('atras') || (daysFromToday(p.due) ?? 1) < 0),
    ).length
  return { responses, planned, contracted, paid, overdue }
}
type Stats = ReturnType<typeof computeStats>
function buildAlerts(data: WeddingData) {
  const list: { type: 'danger' | 'warn' | 'info'; title: string; detail: string }[] = []
  const overdue = data.payments.filter(
    (p) => !p.paid && (normalize(p.status).includes('atras') || (daysFromToday(p.due) ?? 1) < 0),
  )
  if (overdue.length)
    list.push({
      type: 'danger',
      title: `${overdue.length} pagamento(s) atrasado(s)`,
      detail: `Total de ${formatMoney(overdue.reduce((s, p) => s + p.value, 0))}`,
    })
  const soon = data.payments.filter(
    (p) => !p.paid && (daysFromToday(p.due) ?? 99) >= 0 && (daysFromToday(p.due) ?? 99) <= 7,
  )
  if (soon.length)
    list.push({
      type: 'warn',
      title: `${soon.length} pagamento(s) vencem em 7 dias`,
      detail: 'Confira o calendário financeiro',
    })
  const waiting =
    data.guestSummary && data.guests.length < 20
      ? data.guestSummary.waiting
      : data.guests
          .filter((g) => normalize(g.rsvp).includes('aguard'))
          .reduce((s, g) => s + g.people, 0)
  if (waiting)
    list.push({
      type: 'info',
      title: `${waiting} pessoa(s) aguardando RSVP`,
      detail: 'Vale programar um lembrete',
    })
  const unsigned = data.vendors.filter((v) => !v.contractSigned && v.value > 0)
  if (unsigned.length)
    list.push({
      type: 'warn',
      title: `${unsigned.length} contrato(s) pendente(s)`,
      detail: 'Fornecedores com valor e sem contrato assinado',
    })
  data.budget
    .filter((b) => b.contracted > b.planned && b.planned > 0)
    .forEach((b) =>
      list.push({
        type: 'danger',
        title: `${b.category} acima do orçamento`,
        detail: `Excesso de ${formatMoney(b.contracted - b.planned)}`,
      }),
    )
  const late = data.timeline.filter(
    (t) => !normalize(t.status).includes('conclu') && (daysFromToday(t.end) ?? 1) < 0,
  )
  if (late.length)
    list.push({
      type: 'danger',
      title: `${late.length} tarefa(s) atrasada(s)`,
      detail: 'Revise responsáveis e prazos',
    })
  return list
}

function Overview({
  data,
  stats,
  alerts,
  widgets,
  importFile,
}: {
  data: WeddingData
  stats: Stats
  alerts: ReturnType<typeof buildAlerts>
  widgets: string[]
  importFile: () => void
}) {
  const total = Object.values(stats.responses).reduce((a, b) => a + b, 0) || data.plannedGuests,
    budgetPct = data.budgetTotal ? Math.round((stats.contracted / data.budgetTotal) * 100) : 0,
    completed = data.timeline.filter((t) => normalize(t.status).includes('conclu')).length,
    show = (id: string) => widgets?.includes(id) !== false
  return (
    <>
      <section className="hero-row">
        <div>
          <p className="eyebrow">O GRANDE DIA ESTÁ CHEGANDO</p>
          <h1>
            Olá, {data.couple.replace(' & ', ' e ')} <span>♡</span>
          </h1>
          <p className="subtitle">
            Tudo o que vocês precisam para planejar com calma, em um só lugar.
          </p>
        </div>
        <div className="countdown">
          <span>Faltam</span>
          <b>{daysUntil(data.weddingDate).toLocaleString('pt-BR')}</b>
          <strong>dias</strong>
          <CalendarDays />
        </div>
      </section>
      <section className="metric-grid">
        <Metric
          icon={Users}
          label="Pessoas na lista"
          value={String(total)}
          hint={`de ${data.plannedGuests} planejadas`}
          tone="rose"
        />
        <Metric
          icon={CircleDollarSign}
          label="Orçamento contratado"
          value={formatMoney(stats.contracted)}
          hint={`${budgetPct}% de ${formatMoney(data.budgetTotal)}`}
          tone="olive"
        />
        <Metric
          icon={Check}
          label="Etapas concluídas"
          value={`${completed} / ${data.timeline.length}`}
          hint={
            data.timeline.length
              ? `${Math.round((completed / data.timeline.length) * 100)}% do cronograma`
              : 'Importe seu cronograma'
          }
          tone="clay"
        />
        <Metric
          icon={Clock3}
          label="Pagamentos atrasados"
          value={String(stats.overdue)}
          hint={stats.overdue ? 'precisam de atenção' : 'Tudo em dia por aqui'}
          tone="sand"
        />
      </section>
      <section className="dashboard-grid">
        {show('alerts') && (
          <div className="card alert-card">
            <CardTitle
              kicker="CENTRAL DE ALERTAS"
              title={alerts.length ? 'Precisa da atenção de vocês' : 'Tudo sob controle'}
              action={`${alerts.length} alertas`}
            />
            <div className="alert-list">
              {alerts.slice(0, 5).map((a, i) => (
                <div className={`alert-item ${a.type}`} key={i}>
                  <AlertCircle />
                  <div>
                    <b>{a.title}</b>
                    <span>{a.detail}</span>
                  </div>
                </div>
              ))}
              {!alerts.length && (
                <div className="all-good">
                  <Check />
                  <span>Nenhuma pendência crítica encontrada.</span>
                </div>
              )}
            </div>
          </div>
        )}
        {show('budget') && (
          <div className="card budget-card">
            <CardTitle kicker="FINANÇAS" title="Visão do orçamento" action="Resumo" />
            <div className="budget-summary">
              <div
                className="donut"
                style={
                  { '--progress': `${Math.min(budgetPct, 100) * 3.6}deg` } as React.CSSProperties
                }
              >
                <div>
                  <b>{budgetPct}%</b>
                  <span>contratado</span>
                </div>
              </div>
              <div className="budget-values">
                <span>
                  <i className="dot planned" />
                  Planejado <b>{formatMoney(data.budgetTotal)}</b>
                </span>
                <span>
                  <i className="dot contracted" />
                  Contratado <b>{formatMoney(stats.contracted)}</b>
                </span>
                <span>
                  <i className="dot paid" />
                  Pago <b>{formatMoney(stats.paid)}</b>
                </span>
                <hr />
                <span className="available">
                  Disponível <b>{formatMoney(data.budgetTotal - stats.contracted)}</b>
                </span>
              </div>
            </div>
          </div>
        )}
        {show('guests') && (
          <div className="card guests-card">
            <CardTitle kicker="CONVIDADOS" title="Confirmações" action="RSVP" />
            <div className="response-total">
              <b>{total}</b>
              <span>pessoas na lista</span>
            </div>
            <div className="stacked-bar">
              <i style={{ width: `${total ? (stats.responses.confirmed / total) * 100 : 0}%` }} />
              <i style={{ width: `${total ? (stats.responses.waiting / total) * 100 : 100}%` }} />
            </div>
            <div className="response-list">
              <Response label="Confirmados" value={stats.responses.confirmed} cls="confirmed" />
              <Response label="Aguardando" value={stats.responses.waiting} cls="waiting" />
              <Response label="Talvez" value={stats.responses.maybe} cls="maybe" />
              <Response label="Não vão" value={stats.responses.declined} cls="declined" />
            </div>
          </div>
        )}
        {show('timeline') && (
          <div className="card timeline-card">
            <CardTitle kicker="PRÓXIMOS PASSOS" title="Cronograma geral" action="Etapas" />
            <div className="timeline-list">
              {data.timeline
                .filter((t) => t.kind === 'marco' || !t.kind)
                .slice(0, 4)
                .map((item, i) => (
                  <div className="timeline-row" key={item.id || i}>
                    <span
                      className={
                        normalize(item.status).includes('andamento')
                          ? 'timeline-dot current'
                          : 'timeline-dot'
                      }
                    >
                      {i + 1}
                    </span>
                    <div>
                      <b>{item.title}</b>
                      <span>
                        {item.end || 'Sem data'} · {item.owner || 'Sem responsável'}
                      </span>
                    </div>
                    <Status value={item.status} />
                  </div>
                ))}
            </div>
          </div>
        )}
        {show('sync') && (
          <div className="card sync-card">
            <div className="sync-icon">
              <Download />
            </div>
            <div>
              <p className="eyebrow">ATUALIZAÇÃO DOS DADOS</p>
              <h3>{data.sourceName ? 'Planilha sincronizada' : 'Seu painel está pronto'}</h3>
              <p>
                {data.importedAt
                  ? `Importada em ${new Date(data.importedAt).toLocaleString('pt-BR')}.`
                  : 'Exporte como Excel e importe aqui.'}
              </p>
            </div>
            <button onClick={importFile}>
              <Upload /> Atualizar dados
            </button>
          </div>
        )}
      </section>
    </>
  )
}

function Guests({ data, stats }: { data: WeddingData; stats: Stats }) {
  const [query, setQuery] = useState(''),
    [rsvp, setRsvp] = useState(''),
    [side, setSide] = useState(''),
    [table, setTable] = useState(''),
    [onlyRestriction, setOnlyRestriction] = useState(false),
    [onlyNotInvited, setOnlyNotInvited] = useState(false),
    [view, setView] = useState<'lista' | 'mesas'>('lista')
  const options = (field: 'rsvp' | 'side' | 'table') =>
      [...new Set(data.guests.map((g) => g[field]).filter(Boolean))].sort(),
    list = data.guests.filter(
      (g) =>
        normalize(`${g.name} ${g.group}`).includes(normalize(query)) &&
        (!rsvp || g.rsvp === rsvp) &&
        (!side || g.side === side) &&
        (!table || g.table === table) &&
        (!onlyRestriction || !!g.restriction) &&
        (!onlyNotInvited || !g.inviteSent),
    )
  const exportCsv = () => {
    const rows = [
      ['Nome', 'Grupo', 'Lado', 'RSVP', 'Pessoas', 'Acompanhantes', 'Mesa', 'Restrição'],
      ...list.map((g) => [
        g.name,
        g.group,
        g.side,
        g.rsvp,
        g.people,
        g.companions,
        g.table,
        g.restriction,
      ]),
    ]
    downloadFile(
      'convidados-filtrados.csv',
      '\ufeff' +
        rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n'),
      'text/csv;charset=utf-8',
    )
  }
  const tables = Object.entries(
    list.reduce<Record<string, typeof list>>((a, g) => {
      const k = g.table || 'Sem mesa'
      ;(a[k] ??= []).push(g)
      return a
    }, {}),
  )
  return (
    <>
      <PageHeader
        eyebrow="LISTA DE CONVIDADOS"
        title="Quem vai celebrar com vocês"
        description="Filtre confirmações, organize mesas e exporte a lista certa para cada fornecedor."
      />
      <section className="metric-grid compact">
        <Metric
          icon={Users}
          label="Confirmados"
          value={String(stats.responses.confirmed)}
          hint="pessoas"
          tone="olive"
        />
        <Metric
          icon={Clock3}
          label="Aguardando"
          value={String(stats.responses.waiting)}
          hint="pessoas"
          tone="sand"
        />
        <Metric
          icon={Heart}
          label="Adultos / crianças"
          value={`${data.guests.reduce((s, g) => s + (g.adults || g.people), 0)} / ${data.guests.reduce((s, g) => s + (g.children || 0), 0)}`}
          hint={`${data.guests.reduce((s, g) => s + (g.companions || 0), 0)} acompanhantes`}
          tone="rose"
        />
      </section>
      <div className="card filter-card">
        <div className="search">
          <Search />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar convidado ou família…"
          />
        </div>
        <select value={rsvp} onChange={(e) => setRsvp(e.target.value)}>
          <option value="">Todos os RSVPs</option>
          {options('rsvp').map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={side} onChange={(e) => setSide(e.target.value)}>
          <option value="">Todos os lados</option>
          {options('side').map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={table} onChange={(e) => setTable(e.target.value)}>
          <option value="">Todas as mesas</option>
          {options('table').map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <label>
          <input
            type="checkbox"
            checked={onlyRestriction}
            onChange={(e) => setOnlyRestriction(e.target.checked)}
          />{' '}
          Restrições
        </label>
        <label>
          <input
            type="checkbox"
            checked={onlyNotInvited}
            onChange={(e) => setOnlyNotInvited(e.target.checked)}
          />{' '}
          Convite pendente
        </label>
      </div>
      <div className="view-actions">
        <div className="segmented">
          <button className={view === 'lista' ? 'active' : ''} onClick={() => setView('lista')}>
            Lista
          </button>
          <button className={view === 'mesas' ? 'active' : ''} onClick={() => setView('mesas')}>
            Mapa de mesas
          </button>
        </div>
        <button className="ghost-button" onClick={exportCsv}>
          <Download /> Exportar filtrados
        </button>
        <span>{list.length} registros</span>
      </div>
      {view === 'lista' ? (
        <div className="card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Convidado</th>
                  <th>Grupo</th>
                  <th>Convite</th>
                  <th>RSVP</th>
                  <th>Pessoas</th>
                  <th>Mesa</th>
                </tr>
              </thead>
              <tbody>
                {list.map((g) => (
                  <tr key={g.id + g.name}>
                    <td>
                      <b>{g.name}</b>
                      {g.restriction && <small>{g.restriction}</small>}
                    </td>
                    <td>
                      {g.group || '—'}
                      <small>{g.side || ''}</small>
                    </td>
                    <td>{g.inviteSent ? 'Enviado' : 'Pendente'}</td>
                    <td>
                      <Status value={g.rsvp} />
                    </td>
                    <td>{g.people}</td>
                    <td>{g.table || 'A definir'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!list.length && <Empty text="Nenhum convidado encontrado com esses filtros." />}
          </div>
        </div>
      ) : (
        <div className="table-planner">
          {tables.map(([name, guests]) => (
            <div className="card table-seat" key={name}>
              <div>
                <b>{name}</b>
                <span>{guests.reduce((s, g) => s + g.people, 0)} pessoas</span>
              </div>
              {guests.map((g) => (
                <p key={g.id}>
                  {g.name}
                  <span>{g.people > 1 ? `+${g.people - 1}` : ''}</span>
                </p>
              ))}
            </div>
          ))}
        </div>
      )}
    </>
  )
}

function Finances({ data, stats }: { data: WeddingData; stats: Stats }) {
  const projected = Math.max(
      stats.contracted,
      data.budget.reduce((s, b) => s + Math.max(b.contracted, b.planned), 0),
    ),
    confirmed = stats.responses.confirmed || data.plannedGuests,
    monthly = Object.entries(
      data.payments.reduce<Record<string, number>>((a, p) => {
        const d = parseDate(p.due)
        if (d) {
          const k = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' })
          a[k] = (a[k] || 0) + p.value
        }
        return a
      }, {}),
    ),
    max = Math.max(...monthly.map(([, v]) => v), 1)
  return (
    <>
      <PageHeader
        eyebrow="FINANÇAS"
        title="Orçamento sem surpresas"
        description="Planejado, contratado, pago e o calendário de parcelas em uma visão."
      />
      <section className="metric-grid">
        <Metric
          icon={WalletCards}
          label="Orçamento total"
          value={formatMoney(data.budgetTotal)}
          hint="valor definido"
          tone="sand"
        />
        <Metric
          icon={CircleDollarSign}
          label="Custo projetado"
          value={formatMoney(projected)}
          hint={projected > data.budgetTotal ? 'acima do teto' : 'dentro do teto'}
          tone="clay"
        />
        <Metric
          icon={Check}
          label="Pago"
          value={formatMoney(stats.paid)}
          hint={`${formatMoney(stats.contracted - stats.paid)} a pagar`}
          tone="olive"
        />
        <Metric
          icon={Users}
          label="Custo por convidado"
          value={formatMoney(projected / Math.max(confirmed, 1))}
          hint={`base: ${confirmed} pessoas`}
          tone="rose"
        />
      </section>
      <div className="finance-grid">
        <div className="card">
          <CardTitle
            kicker="CATEGORIAS"
            title="Planejado × contratado × pago"
            action="Comparativo"
          />
          <div className="budget-rows">
            {data.budget.map((x) => (
              <div
                className={`budget-row ${x.contracted > x.planned && x.planned ? 'over' : ''}`}
                key={x.category}
              >
                <div>
                  <b>{x.category}</b>
                  <span>
                    {formatMoney(x.contracted)} contratado · {formatMoney(x.paid)} pago
                  </span>
                </div>
                <div className="bar">
                  <i
                    style={{
                      width: `${Math.min(100, x.planned ? (x.contracted / x.planned) * 100 : 0)}%`,
                    }}
                  />
                  <em
                    style={{
                      width: `${Math.min(100, x.planned ? (x.paid / x.planned) * 100 : 0)}%`,
                    }}
                  />
                </div>
                <strong>{formatMoney(x.planned)}</strong>
              </div>
            ))}
          </div>
        </div>
        <div className="card">
          <CardTitle
            kicker="FLUXO DE CAIXA"
            title="Parcelas por mês"
            action={`${data.payments.length} parcelas`}
          />
          {monthly.length ? (
            <div className="month-chart">
              {monthly.map(([month, value]) => (
                <div key={month}>
                  <b>{formatMoney(value)}</b>
                  <i style={{ height: `${Math.max(8, (value / max) * 150)}px` }} />
                  <span>{month}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty text="Preencha a aba Pagamentos para ver o fluxo mensal." />
          )}
          <div className="payment-list">
            {data.payments.slice(0, 6).map((p) => (
              <div key={p.id}>
                <span>
                  <b>{p.item}</b>
                  {p.due}
                </span>
                <strong>{formatMoney(p.value)}</strong>
                <Status value={p.paid ? 'Pago' : p.status || 'Pendente'} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

function Timeline({ data }: { data: WeddingData }) {
  const [mode, setMode] = useState<'lista' | 'kanban'>('kanban'),
    [owner, setOwner] = useState(''),
    [kind, setKind] = useState('')
  const list = data.timeline.filter(
      (t) => (!owner || t.owner === owner) && (!kind || t.kind === kind),
    ),
    owners = [...new Set(data.timeline.map((t) => t.owner).filter(Boolean))],
    groups = ['Não iniciada', 'Em andamento', 'Concluída'],
    phases = Object.entries(
      data.timeline.reduce<Record<string, { total: number; done: number }>>((a, t) => {
        const k = t.phase || 'Geral'
        a[k] ??= { total: 0, done: 0 }
        a[k].total++
        if (normalize(t.status).includes('conclu')) a[k].done++
        return a
      }, {}),
    )
  return (
    <>
      <PageHeader
        eyebrow="PLANEJAMENTO"
        title="Do primeiro passo ao grande dia"
        description="Marcos, checklist e prioridades reunidos com responsáveis e prazos."
      />
      <div className="card filter-card">
        <select value={owner} onChange={(e) => setOwner(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          {owners.map((x) => (
            <option key={x}>{x}</option>
          ))}
        </select>
        <select value={kind} onChange={(e) => setKind(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option value="marco">Marcos</option>
          <option value="tarefa">Checklist</option>
          <option value="prioridade">Prioridades</option>
        </select>
        <div className="segmented">
          <button className={mode === 'kanban' ? 'active' : ''} onClick={() => setMode('kanban')}>
            Kanban
          </button>
          <button className={mode === 'lista' ? 'active' : ''} onClick={() => setMode('lista')}>
            Lista
          </button>
        </div>
      </div>
      <div className="phase-progress">
        {phases.slice(0, 6).map(([phase, p]) => (
          <div className="card" key={phase}>
            <span>{phase}</span>
            <b>{p.total ? Math.round((p.done / p.total) * 100) : 0}%</b>
            <div className="bar">
              <i style={{ width: `${p.total ? (p.done / p.total) * 100 : 0}%` }} />
            </div>
          </div>
        ))}
      </div>
      {mode === 'kanban' ? (
        <div className="kanban">
          {groups.map((group) => (
            <div className="kanban-col" key={group}>
              <h3>
                {group}
                <span>{list.filter((t) => statusGroup(t.status) === group).length}</span>
              </h3>
              {list
                .filter((t) => statusGroup(t.status) === group)
                .map((t) => (
                  <div
                    className={`task-card ${isLate(t.end) && group !== 'Concluída' ? 'late' : ''}`}
                    key={t.id + t.title}
                  >
                    <span>
                      {t.kind || 'etapa'} {t.priority && `· ${t.priority}`}
                    </span>
                    <b>{t.title}</b>
                    <small>
                      {t.end || 'Sem prazo'} · {t.owner || 'Sem responsável'}
                    </small>
                  </div>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="card table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Etapa</th>
                  <th>Prazo</th>
                  <th>Responsável</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t) => (
                  <tr key={t.id + t.title}>
                    <td>{t.kind}</td>
                    <td>
                      <b>{t.title}</b>
                      <small>{t.phase}</small>
                    </td>
                    <td>{t.end || '—'}</td>
                    <td>{t.owner || '—'}</td>
                    <td>
                      <Status value={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  )
}

function Vendors({ data }: { data: WeddingData }) {
  const [category, setCategory] = useState(''),
    categories = [...new Set(data.vendors.map((v) => v.category).filter(Boolean))],
    list = data.vendors.filter((v) => !category || v.category === category)
  return (
    <>
      <PageHeader
        eyebrow="PARCEIROS"
        title="Todos os fornecedores em um só lugar"
        description="Compare propostas, confira contratos e fale com cada parceiro rapidamente."
      />
      <div className="view-actions">
        <select value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <span>{list.length} fornecedores</span>
      </div>
      <div className="vendor-grid">
        {list.map((v) => (
          <div className="card vendor-card" key={v.id + v.company}>
            <div className="vendor-head">
              <span>
                <Store />
              </span>
              <div>
                <small>{v.type || v.category}</small>
                <h3>{v.company}</h3>
              </div>
              <Status value={v.status || 'Em avaliação'} />
            </div>
            <div className="vendor-money">
              <span>
                Proposta<b>{formatMoney(v.value)}</b>
              </span>
              <span>
                Pago<b>{formatMoney(v.paid)}</b>
              </span>
              <span>
                Saldo<b>{formatMoney(v.value - v.paid)}</b>
              </span>
            </div>
            <div className="contract-line">
              <span className={v.contractSigned ? 'ok' : 'pending'}>
                {v.contractSigned ? 'Contrato assinado' : 'Contrato pendente'}
              </span>
              {v.nextDue && <span>Próximo: {v.nextDue}</span>}
            </div>
            <div className="vendor-actions">
              {v.phone && (
                <a
                  href={`https://wa.me/${v.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Phone /> WhatsApp
                </a>
              )}
              {v.email && <a href={`mailto:${v.email}`}>E-mail</a>}
              {v.link && (
                <a href={v.link} target="_blank" rel="noreferrer">
                  Proposta
                </a>
              )}
            </div>
          </div>
        ))}
        {!list.length && (
          <div className="card">
            <Empty text="Preencha a aba Fornecedores; os cards e comparações aparecerão aqui." />
          </div>
        )}
      </div>
    </>
  )
}

function ImportModal({
  preview,
  onCancel,
  onConfirm,
}: {
  preview: Preview
  onCancel: () => void
  onConfirm: () => void
}) {
  const r = preview.report
  return (
    <Modal onClose={onCancel}>
      <div className="modal-icon">
        <Eye />
      </div>
      <p className="eyebrow">PRÉVIA DA IMPORTAÇÃO</p>
      <h2>Confira antes de atualizar</h2>
      <p className="modal-copy">
        O arquivo <b>{r.fileName}</b> foi lido. Seus dados atuais só serão substituídos após a
        confirmação.
      </p>
      <div className="import-counts">
        <span>
          <b>{r.counts.guests}</b> convidados
        </span>
        <span>
          <b>{r.counts.budget}</b> categorias
        </span>
        <span>
          <b>{r.counts.payments}</b> pagamentos
        </span>
        <span>
          <b>{r.counts.timeline}</b> etapas
        </span>
        <span>
          <b>{r.counts.vendors}</b> fornecedores
        </span>
      </div>
      {r.missingSheets.length > 0 && (
        <div className="import-warning">
          <AlertCircle />
          <div>
            <b>Abas não encontradas</b>
            <span>{r.missingSheets.join(', ')}</span>
          </div>
        </div>
      )}
      {r.warnings.map((w) => (
        <div className="import-warning" key={w}>
          <AlertCircle />
          <span>{w}</span>
        </div>
      ))}
      <div className="modal-actions">
        <button className="ghost-button" onClick={onCancel}>
          Cancelar
        </button>
        <button className="import-button" onClick={onConfirm}>
          <Check /> Aplicar atualização
        </button>
      </div>
    </Modal>
  )
}
function SettingsModal({
  data,
  theme,
  onTheme,
  onClose,
  onBackup,
  onRestore,
  onClear,
  installPrompt,
  onLock,
}: {
  data: WeddingData
  theme: DashboardTheme
  onTheme: (t: DashboardTheme) => void
  onClose: () => void
  onBackup: () => void
  onRestore: () => void
  onClear: () => void
  installPrompt: (Event & { prompt?: () => Promise<void> }) | null
  onLock: () => void
}) {
  const [password, setPassword] = useState(''),
    widgets = [
      ['alerts', 'Alertas'],
      ['budget', 'Orçamento'],
      ['guests', 'Convidados'],
      ['timeline', 'Cronograma'],
      ['sync', 'Atualização'],
    ],
    protectedNow = Boolean(localStorage.getItem('nosso-sim-password'))
  async function setPasswordLock() {
    if (password.length < 4) return
    localStorage.setItem('nosso-sim-password', await hashText(password))
    onLock()
  }
  function photo(file?: File) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => onTheme({ ...theme, photo: String(reader.result) })
    reader.readAsDataURL(file)
  }
  return (
    <Modal onClose={onClose} wide>
      <p className="eyebrow">PREFERÊNCIAS</p>
      <h2>Deixem o painel com a cara de vocês</h2>
      <div className="settings-grid">
        <section>
          <h3>
            <Palette /> Aparência
          </h3>
          <label>
            Cor principal{' '}
            <input
              type="color"
              value={theme.accent}
              onChange={(e) => onTheme({ ...theme, accent: e.target.value })}
            />
          </label>
          <label>
            Monograma{' '}
            <input
              value={theme.monogram}
              maxLength={5}
              onChange={(e) => onTheme({ ...theme, monogram: e.target.value })}
            />
          </label>
          <label>
            Foto do casal{' '}
            <input type="file" accept="image/*" onChange={(e) => photo(e.target.files?.[0])} />
          </label>
          <label className="switch">
            <input
              type="checkbox"
              checked={theme.dark}
              onChange={(e) => onTheme({ ...theme, dark: e.target.checked })}
            />{' '}
            Tema escuro
          </label>
        </section>
        <section>
          <h3>
            <Eye /> Página inicial
          </h3>
          {widgets.map(([id, label]) => (
            <label className="switch" key={id}>
              <input
                type="checkbox"
                checked={theme.widgets.includes(id)}
                onChange={(e) =>
                  onTheme({
                    ...theme,
                    widgets: e.target.checked
                      ? [...theme.widgets, id]
                      : theme.widgets.filter((x) => x !== id),
                  })
                }
              />
              {label}
            </label>
          ))}
        </section>
        <section>
          <h3>
            <Download /> Dados e aplicativo
          </h3>
          <button className="settings-button" onClick={onBackup}>
            Baixar backup
          </button>
          <button className="settings-button" onClick={onRestore}>
            Restaurar backup
          </button>
          {installPrompt && (
            <button className="settings-button" onClick={() => installPrompt.prompt?.()}>
              Instalar no dispositivo
            </button>
          )}
          <button className="settings-button" onClick={() => window.print()}>
            <Printer /> Imprimir resumo
          </button>
        </section>
        <section>
          <h3>
            <Lock /> Privacidade local
          </h3>
          <p>Proteja a abertura neste navegador com uma senha.</p>
          {protectedNow ? (
            <button
              className="settings-button"
              onClick={() => localStorage.removeItem('nosso-sim-password')}
            >
              Desativar proteção
            </button>
          ) : (
            <>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo de 4 caracteres"
              />
              <button
                className="settings-button"
                disabled={password.length < 4}
                onClick={setPasswordLock}
              >
                Ativar proteção
              </button>
            </>
          )}
          <button
            className="danger-button"
            onClick={() => {
              if (window.confirm('Apagar todos os dados importados deste navegador?')) onClear()
            }}
          >
            Apagar dados locais
          </button>
        </section>
      </div>
      <p className="privacy-note">
        <ShieldCheck /> Os dados de {data.couple} ficam somente neste navegador.
      </p>
    </Modal>
  )
}
function LockScreen({ onUnlock }: { onUnlock: () => void }) {
  const [password, setPassword] = useState(''),
    [error, setError] = useState('')
  async function unlock() {
    if ((await hashText(password)) === localStorage.getItem('nosso-sim-password')) onUnlock()
    else setError('Senha incorreta.')
  }
  return (
    <div className="lock-screen">
      <div className="lock-card">
        <span className="brand-mark">
          <Heart fill="currentColor" />
        </span>
        <p className="eyebrow">NOSSO SIM</p>
        <h1>O planejamento de vocês está protegido</h1>
        <p>Digite a senha local para abrir o dashboard.</p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && unlock()}
          autoFocus
          placeholder="Senha"
        />
        <button className="import-button" onClick={unlock}>
          <Lock /> Abrir dashboard
        </button>
        {error && <span className="form-error">{error}</span>}
        <small>A senha é local e não pode ser recuperada remotamente.</small>
      </div>
    </div>
  )
}
function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode
  onClose: () => void
  wide?: boolean
}) {
  return (
    <div className="modal-backdrop">
      <div className={`modal ${wide ? 'wide' : ''}`}>
        <button className="modal-close" onClick={onClose}>
          <X />
        </button>
        {children}
      </div>
    </div>
  )
}
function Metric({
  icon: Icon,
  label,
  value,
  hint,
  tone,
}: {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  tone: string
}) {
  return (
    <div className={`metric ${tone}`}>
      <span className="metric-icon">
        <Icon />
      </span>
      <div>
        <p>{label}</p>
        <b>{value}</b>
        <small>{hint}</small>
      </div>
    </div>
  )
}
function CardTitle({ kicker, title, action }: { kicker: string; title: string; action: string }) {
  return (
    <div className="card-title">
      <div>
        <p className="eyebrow">{kicker}</p>
        <h2>{title}</h2>
      </div>
      <button>
        {action}
        <ChevronRight />
      </button>
    </div>
  )
}
function Response({ label, value, cls }: { label: string; value: number; cls: string }) {
  return (
    <span>
      <i className={`dot ${cls}`} />
      {label}
      <b>{value}</b>
    </span>
  )
}
function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string
  title: string
  description: string
}) {
  return (
    <div className="page-header">
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
  )
}
function Status({ value }: { value: string }) {
  const n = normalize(value),
    cls =
      n.includes('confirm') || n.includes('conclu') || n === 'pago'
        ? 'ok'
        : n.includes('andamento')
          ? 'progress'
          : n.includes('atras')
            ? 'danger'
            : 'neutral'
  return <span className={`status ${cls}`}>{value || 'A definir'}</span>
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty">
      <FileSpreadsheet />
      <b>Nada por aqui ainda</b>
      <span>{text}</span>
    </div>
  )
}
function statusGroup(status: string) {
  const n = normalize(status)
  if (n.includes('conclu')) return 'Concluída'
  if (n.includes('andamento')) return 'Em andamento'
  return 'Não iniciada'
}
function isLate(date: string) {
  return (daysFromToday(date) ?? 1) < 0
}
function formatWeddingDate(date: string) {
  const d = parseDate(date)
  return d
    ? d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })
    : date
}
export default App

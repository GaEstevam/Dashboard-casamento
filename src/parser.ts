import type { ImportReport, Row, WeddingData } from './types'
import { seedData } from './seed'

type SpreadsheetSheet = { sheet: string; data: unknown[][] }

const clean = (v: unknown) =>
  v instanceof Date ? v.toLocaleDateString('pt-BR') : String(v ?? '').trim()
const key = (v: unknown) =>
  clean(v)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
const money = (v: unknown) => {
  if (typeof v === 'number') return v
  const s = clean(v)
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')
  return Number(s) || 0
}
const num = (v: unknown) => (typeof v === 'number' ? v : Number(clean(v).replace(',', '.')) || 0)
const yes = (v: unknown) => ['sim', 'pago', 'true', '1'].includes(key(v))

function rowsFromSheet(raw: unknown[][]): Row[] {
  const headerIndex = raw.findIndex(
    (row) =>
      Array.isArray(row) &&
      row.filter(Boolean).length >= 3 &&
      row.some((v) =>
        ['id', 'categoria', 'marco', 'nomeougrupo', 'fornecedoritem', 'tipo'].includes(key(v)),
      ),
  )
  if (headerIndex < 0) return []
  const headers = raw[headerIndex].map((v) => clean(v))
  return raw
    .slice(headerIndex + 1)
    .filter((row) => row.some(Boolean))
    .map(
      (row) =>
        Object.fromEntries(
          headers.map((h, i) => {
            const value = (row as unknown[])[i]
            return [
              key(h),
              typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
                ? value
                : '',
            ]
          }),
        ) as Row,
    )
}

function findSheet(sheets: SpreadsheetSheet[], wanted: string) {
  const found = sheets.find(({ sheet }) => key(sheet) === key(wanted))
  return found ? rowsFromSheet(found.data) : []
}

function configFromSheet(sheets: SpreadsheetSheet[]) {
  const raw = sheets.find(({ sheet }) => key(sheet) === 'configuracoes')?.data
  if (!raw) return new Map<string, string>()
  return new Map<string, string>(raw.map((r) => [key(r[0]), clean(r[1])]))
}

function isoDate(value: string) {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  return match ? `${match[3]}-${match[2].padStart(2, '0')}-${match[1].padStart(2, '0')}` : value
}

export async function parseWorkbook(
  file: File,
): Promise<{ data: WeddingData; report: ImportReport }> {
  const { default: readWorkbook } = await import('read-excel-file/browser')
  const sheets = (await readWorkbook(file)) as SpreadsheetSheet[]
  const cfg = configFromSheet(sheets)
  const guestRows = findSheet(sheets, 'Convidados')
  const budgetRows = findSheet(sheets, 'Orçamento').filter((r) => key(r.categoria) !== 'total')
  const timelineRows = findSheet(sheets, 'Cronograma geral')
  const checklistRows = findSheet(sheets, 'Checklist')
  const priorityRows = findSheet(sheets, 'Prioridades')
  const paymentRows = findSheet(sheets, 'Pagamentos')
  const vendorRows = findSheet(sheets, 'Fornecedores')
  const p1 = cfg.get('nomedapessoa1') || ''
  const p2 = cfg.get('nomedapessoa2') || ''

  const required = [
    'Configurações',
    'Convidados',
    'Orçamento',
    'Cronograma geral',
    'Pagamentos',
    'Fornecedores',
  ]
  const sheetsFound = required.filter((wanted) =>
    sheets.some(({ sheet }) => key(sheet) === key(wanted)),
  )
  const missingSheets = required.filter((wanted) => !sheetsFound.includes(wanted))
  const timeline = [
    ...timelineRows
      .filter((r) => clean(r.marco))
      .map((r) => ({
        id: clean(r.id),
        title: clean(r.marco),
        start: clean(r.datadeinicio),
        end: clean(r.datafinal),
        owner: clean(r.responsavel),
        status: clean(r.status),
        phase: clean(r.fase),
        kind: 'marco' as const,
      })),
    ...checklistRows
      .filter((r) => clean(r.tarefa))
      .map((r) => ({
        id: `C${clean(r.id)}`,
        title: clean(r.tarefa),
        start: '',
        end: clean(r.prazoajustado || r.prazosugerido),
        owner: clean(r.responsavel),
        status: clean(r.status),
        phase: clean(r.fase),
        priority: clean(r.prioridade),
        kind: 'tarefa' as const,
      })),
    ...priorityRows
      .filter((r) => clean(r.tarefa || r.item))
      .map((r) => ({
        id: `P${clean(r.id)}`,
        title: clean(r.tarefa || r.item),
        start: '',
        end: clean(r.prazo || r.data),
        owner: clean(r.responsavel),
        status: clean(r.status),
        phase: clean(r.fase),
        priority: clean(r.prioridade),
        kind: 'prioridade' as const,
      })),
  ]
  const data: WeddingData = {
    couple: [p1.split(' ')[0], p2.split(' ')[0]].filter(Boolean).join(' & ') || seedData.couple,
    weddingDate: isoDate(cfg.get('datadocasamento') || seedData.weddingDate),
    city: cfg.get('cidade') || '',
    budgetTotal:
      money(cfg.get('orcamentototal')) || budgetRows.reduce((s, r) => s + money(r.planejado), 0),
    plannedGuests:
      num(cfg.get('convidadosplanejados')) ||
      guestRows.reduce((s, r) => s + Math.max(1, num(r.totaldepessoas)), 0),
    guests: guestRows
      .filter((r) => clean(r.nomeougrupo))
      .map((r) => ({
        id: clean(r.id),
        name: clean(r.nomeougrupo),
        group: clean(r.familiagrupo),
        side: clean(r.lado),
        rsvp: clean(r.rsvp) || 'Aguardando',
        people: Math.max(1, num(r.totaldepessoas)),
        table: clean(r.mesa),
        restriction: clean(r.restricaoalimentar),
        inviteSent: yes(r.conviteenviado),
        companions: num(r.acompanhantes),
        adults: num(r.adultos) || Math.max(1, num(r.totaldepessoas) - num(r.criancas)),
        children: num(r.criancas),
      })),
    budget: budgetRows
      .filter((r) => clean(r.categoria))
      .map((r) => ({
        category: clean(r.categoria),
        planned: money(r.planejado),
        contracted: money(r.contratado),
        paid: money(r.pago),
      })),
    timeline,
    payments: paymentRows
      .filter((r) => clean(r.fornecedoritem))
      .map((r) => ({
        id: clean(r.id),
        item: clean(r.fornecedoritem),
        category: clean(r.categoria),
        due: clean(r.vencimento),
        value: money(r.valor),
        paid: yes(r.pago),
        status: clean(r.situacao),
        method: clean(r.forma),
      })),
    vendors: vendorRows
      .filter((r) => clean(r.empresaprofissional))
      .map((r) => ({
        id: clean(r.id),
        company: clean(r.empresaprofissional),
        type: clean(r.tipo),
        category: clean(r.categoriadoorcamento),
        contact: clean(r.contato),
        phone: clean(r.telefone),
        email: clean(r.email),
        value: money(r.valorcontratado),
        paid: money(r.valorpago),
        status: clean(r.status),
        link: clean(r.link),
        contractSigned: yes(r.contratoassinado),
        nextDue: clean(r.proximovencimento),
      })),
    importedAt: new Date().toISOString(),
    sourceName: file.name,
    fullNames: [p1, p2].filter(Boolean),
    theme: seedData.theme,
  }
  const warnings: string[] = []
  if (!data.weddingDate) warnings.push('Data do casamento não encontrada em Configurações.')
  if (!data.guests.length) warnings.push('Nenhum convidado preenchido foi encontrado.')
  if (!data.budget.length) warnings.push('Nenhuma categoria de orçamento foi encontrada.')
  return {
    data,
    report: {
      fileName: file.name,
      sheetsFound,
      missingSheets,
      warnings,
      counts: {
        guests: data.guests.length,
        budget: data.budget.length,
        payments: data.payments.length,
        timeline: data.timeline.length,
        vendors: data.vendors.length,
      },
    },
  }
}

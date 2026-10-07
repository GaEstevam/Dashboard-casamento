export type Row = Record<string, string | number | boolean | null>

export type BudgetItem = {
  category: string
  planned: number
  contracted: number
  paid: number
}

export type Guest = {
  id: string
  name: string
  group: string
  side: string
  rsvp: string
  people: number
  table: string
  restriction: string
  inviteSent: boolean
  companions: number
  adults: number
  children: number
}

export type TimelineItem = {
  id: string
  title: string
  start: string
  end: string
  owner: string
  status: string
  phase?: string
  priority?: string
  kind?: 'marco' | 'tarefa' | 'prioridade'
}

export type Payment = {
  id: string
  item: string
  category: string
  due: string
  value: number
  paid: boolean
  status: string
  method?: string
}

export type Vendor = {
  id: string
  company: string
  type: string
  category: string
  contact: string
  value: number
  paid: number
  status: string
  phone?: string
  email?: string
  link?: string
  contractSigned?: boolean
  nextDue?: string
}

export type WeddingData = {
  couple: string
  weddingDate: string
  city: string
  budgetTotal: number
  plannedGuests: number
  guests: Guest[]
  guestSummary?: { confirmed: number; waiting: number; maybe: number; declined: number }
  budget: BudgetItem[]
  timeline: TimelineItem[]
  payments: Payment[]
  vendors: Vendor[]
  importedAt?: string
  sourceName?: string
  fullNames?: string[]
  theme?: DashboardTheme
}

export type DashboardTheme = {
  accent: string
  dark: boolean
  monogram: string
  photo?: string
  widgets: string[]
}

export type ImportReport = {
  fileName: string
  sheetsFound: string[]
  missingSheets: string[]
  warnings: string[]
  counts: { guests: number; budget: number; payments: number; timeline: number; vendors: number }
}

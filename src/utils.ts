import type { WeddingData } from './types'

export const normalize = (v: string) =>
  v
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
export const formatMoney = (v: number) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  }).format(v)

export function parseDate(value: string) {
  if (!value) return null
  const br = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/)
  if (br)
    return new Date(
      Number(br[3].length === 2 ? `20${br[3]}` : br[3]),
      Number(br[2]) - 1,
      Number(br[1]),
    )
  const date = new Date(`${value}T12:00:00`)
  return Number.isNaN(date.getTime()) ? null : date
}

export function daysFromToday(value: string) {
  const d = parseDate(value)
  if (!d) return null
  const now = new Date()
  return Math.ceil(
    (new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() -
      new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) /
      86400000,
  )
}

export function daysUntil(date: string) {
  const days = daysFromToday(date)
  return Math.max(0, days ?? 0)
}

export function saveData(data: WeddingData) {
  localStorage.setItem('nosso-sim-data', JSON.stringify(data))
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 500)
}

export async function hashText(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

import { afterEach, describe, expect, it, vi } from 'vitest'
import { daysFromToday, daysUntil, hashText, normalize, parseDate } from './utils'

describe('utilitários de texto', () => {
  it('normaliza acentos e caixa para comparações', () => {
    expect(normalize('Confirmação')).toBe('confirmacao')
    expect(normalize('NÃO INICIADA')).toBe('nao iniciada')
  })
})

describe('utilitários de data', () => {
  afterEach(() => vi.useRealTimers())

  it('interpreta datas no formato brasileiro', () => {
    const date = parseDate('18/11/2028')

    expect(date?.getFullYear()).toBe(2028)
    expect(date?.getMonth()).toBe(10)
    expect(date?.getDate()).toBe(18)
  })

  it('calcula dias corridos sem depender do horário', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 9, 7, 23, 55))

    expect(daysFromToday('08/10/2026')).toBe(1)
    expect(daysUntil('06/10/2026')).toBe(0)
  })

  it('retorna nulo para uma data inválida', () => {
    expect(parseDate('data desconhecida')).toBeNull()
  })
})

describe('proteção local', () => {
  it('gera hashes determinísticos sem guardar a senha original', async () => {
    const first = await hashText('senha-segura')
    const second = await hashText('senha-segura')

    expect(first).toBe(second)
    expect(first).not.toContain('senha-segura')
    expect(first).toHaveLength(64)
  })
})

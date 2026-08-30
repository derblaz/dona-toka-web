import { describe, it, expect } from 'vitest'
import {
  normalizeCep,
  isValidCep,
  quoteFreight,
  FREE_SHIPPING_THRESHOLD_CENTS,
} from '../freight'

describe('normalizeCep', () => {
  it('strips hyphen from formatted CEP', () => {
    expect(normalizeCep('12345-678')).toBe('12345678')
  })

  it('returns unformatted CEP unchanged', () => {
    expect(normalizeCep('12345678')).toBe('12345678')
  })

  it('strips all non-digit characters', () => {
    expect(normalizeCep('123.45-678')).toBe('12345678')
  })
})

describe('isValidCep', () => {
  it('accepts unformatted 8-digit CEP', () => {
    expect(isValidCep('12345678')).toBe(true)
  })

  it('accepts formatted 8-digit CEP', () => {
    expect(isValidCep('12345-678')).toBe(true)
  })

  it('rejects 5-digit CEP', () => {
    expect(isValidCep('12345')).toBe(false)
  })

  it('rejects 7-digit CEP', () => {
    expect(isValidCep('1234567')).toBe(false)
  })

  it('rejects non-numeric input', () => {
    expect(isValidCep('abcdefgh')).toBe(false)
  })

  it('rejects empty string', () => {
    expect(isValidCep('')).toBe(false)
  })
})

describe('quoteFreight', () => {
  it('returns error for invalid CEP', () => {
    const result = quoteFreight({ cep: '12345', subtotalCents: 1000 })
    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INVALID_CEP')
      expect(result.error.message).toBeTruthy()
    }
  })

  it('returns error for non-numeric CEP', () => {
    const result = quoteFreight({ cep: 'abcd-efgh', subtotalCents: 1000 })
    expect(result.ok).toBe(false)
  })

  it('returns zero freight when subtotal meets free-shipping threshold', () => {
    const result = quoteFreight({
      cep: '01310100',
      subtotalCents: FREE_SHIPPING_THRESHOLD_CENTS,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(0)
      expect(result.quote.estimatedDays).toBeTruthy()
    }
  })

  it('returns zero freight when subtotal exceeds free-shipping threshold', () => {
    const result = quoteFreight({
      cep: '01310100',
      subtotalCents: FREE_SHIPPING_THRESHOLD_CENTS + 1,
    })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(0)
    }
  })

  it('returns non-zero freight below threshold for sul/sudeste CEP (prefix 01)', () => {
    const result = quoteFreight({ cep: '01310100', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(1590)
      expect(result.quote.estimatedDays).toBe('5–7 dias úteis')
    }
  })

  it('returns non-zero freight below threshold for sul/sudeste CEP (prefix 29)', () => {
    const result = quoteFreight({ cep: '29000000', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(1590)
    }
  })

  it('returns non-zero freight below threshold for centro-oeste/nordeste CEP (prefix 30)', () => {
    const result = quoteFreight({ cep: '30000000', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(2250)
      expect(result.quote.estimatedDays).toBe('7–10 dias úteis')
    }
  })

  it('returns non-zero freight below threshold for centro-oeste/nordeste CEP (prefix 59)', () => {
    const result = quoteFreight({ cep: '59000000', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(2250)
    }
  })

  it('returns non-zero freight below threshold for norte/nordeste CEP (prefix 60)', () => {
    const result = quoteFreight({ cep: '60000000', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(2890)
      expect(result.quote.estimatedDays).toBe('10–15 dias úteis')
    }
  })

  it('returns non-zero freight below threshold for norte CEP (prefix 99)', () => {
    const result = quoteFreight({ cep: '99999999', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.amountCents).toBe(2890)
    }
  })

  it('is deterministic — same inputs always produce the same output', () => {
    const params = { cep: '12345-678', subtotalCents: 5000 }
    const a = quoteFreight(params)
    const b = quoteFreight(params)
    expect(a).toEqual(b)
  })

  it('formatted and unformatted CEP produce the same quote', () => {
    const formatted = quoteFreight({ cep: '12345-678', subtotalCents: 5000 })
    const unformatted = quoteFreight({ cep: '12345678', subtotalCents: 5000 })
    expect(formatted).toEqual(unformatted)
  })

  it('label is marked as an estimate', () => {
    const result = quoteFreight({ cep: '01310100', subtotalCents: 1000 })
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.quote.label).toMatch(/estimat/i)
    }
  })
})

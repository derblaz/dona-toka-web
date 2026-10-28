import { describe, it, expect } from 'vitest'
import {
  normalizeCep,
  isValidCep,
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

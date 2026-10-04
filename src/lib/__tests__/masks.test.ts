import { describe, it, expect } from 'vitest'
import { stripNonDigits, formatPhone, formatCpfCnpj, formatCep } from '../masks'

describe('stripNonDigits', () => {
  it('removes punctuation, spaces, and letters', () => {
    expect(stripNonDigits('(11) 99988-7766')).toBe('11999887766')
    expect(stripNonDigits('12.345.678/0001-90')).toBe('12345678000190')
    expect(stripNonDigits('abc123')).toBe('123')
  })

  it('returns an empty string when there are no digits', () => {
    expect(stripNonDigits('()- /abc')).toBe('')
  })
})

describe('formatPhone', () => {
  it('formats an 11-digit mobile number', () => {
    expect(formatPhone('11999887766')).toBe('(11) 99988-7766')
  })

  it('formats a 10-digit landline number', () => {
    expect(formatPhone('1199887766')).toBe('(11) 9988-7766')
  })

  it('formats progressively while typing', () => {
    expect(formatPhone('')).toBe('')
    expect(formatPhone('1')).toBe('(1')
    expect(formatPhone('11')).toBe('(11')
    expect(formatPhone('119')).toBe('(11) 9')
    expect(formatPhone('1199988')).toBe('(11) 9998-8')
    expect(formatPhone('1199988776')).toBe('(11) 9998-8776')
  })

  it('strips punctuation from pasted formatted input and limits it to 11 digits', () => {
    expect(formatPhone('(11) 99988-7766')).toBe('(11) 99988-7766')
    expect(formatPhone('+55 (11) 99988-7766')).toBe('(11) 99988-7766')
    expect(formatPhone('+55 (55) 85999-4622')).toBe('(55) 85999-4622')
    expect(formatPhone('119998877661234')).toBe('(11) 99988-7766')
  })
})

describe('formatCpfCnpj', () => {
  it('formats 11 digits as CPF', () => {
    expect(formatCpfCnpj('12345678909')).toBe('123.456.789-09')
  })

  it('formats 14 digits as CNPJ', () => {
    expect(formatCpfCnpj('12345678000190')).toBe('12.345.678/0001-90')
  })

  it('formats partial CPF input progressively', () => {
    expect(formatCpfCnpj('')).toBe('')
    expect(formatCpfCnpj('123')).toBe('123')
    expect(formatCpfCnpj('1234')).toBe('123.4')
    expect(formatCpfCnpj('1234567')).toBe('123.456.7')
    expect(formatCpfCnpj('1234567890')).toBe('123.456.789-0')
  })

  it('switches to the CNPJ mask from 12 digits onward', () => {
    expect(formatCpfCnpj('123456780001')).toBe('12.345.678/0001')
    expect(formatCpfCnpj('1234567800019')).toBe('12.345.678/0001-9')
  })

  it('normalizes pasted formatted input and limits it to 14 digits', () => {
    expect(formatCpfCnpj('123.456.789-09')).toBe('123.456.789-09')
    expect(formatCpfCnpj('12.345.678/0001-90')).toBe('12.345.678/0001-90')
    expect(formatCpfCnpj('12345678000190123')).toBe('12.345.678/0001-90')
  })
})

describe('formatCep', () => {
  it('formats 8 digits as CEP', () => {
    expect(formatCep('12345678')).toBe('12345-678')
  })

  it('formats partial input progressively', () => {
    expect(formatCep('')).toBe('')
    expect(formatCep('12345')).toBe('12345')
    expect(formatCep('123456')).toBe('12345-6')
  })

  it('normalizes pasted formatted input and limits it to 8 digits', () => {
    expect(formatCep('12345-678')).toBe('12345-678')
    expect(formatCep('12345678999')).toBe('12345-678')
  })
})

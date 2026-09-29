import { describe, it, expect } from 'vitest'
import { addressSchema, checkoutFormSchema, customerSchema, notesSchema } from '../schemas'

describe('customerSchema', () => {
  it('accepts valid customer data and normalizes phone and document digits', () => {
    const result = customerSchema.safeParse({
      name: 'Ana Lima',
      email: 'ana@example.com',
      phone: '(11) 91234-5678',
      cpfCnpj: '123.456.789-09',
    })

    expect(result.success).toBe(true)
    expect(result.data?.phone).toBe('11912345678')
    expect(result.data?.cpfCnpj).toBe('12345678909')
  })

  it('accepts a formatted CNPJ after normalization', () => {
    const result = customerSchema.safeParse({
      name: 'Ana Lima',
      email: 'ana@example.com',
      phone: '11 91234-5678',
      cpfCnpj: '12.345.678/0001-90',
    })

    expect(result.success).toBe(true)
    expect(result.data?.cpfCnpj).toBe('12345678000190')
  })

  it('rejects a phone number with fewer than 11 digits', () => {
    const result = customerSchema.safeParse({
      name: 'Ana Lima',
      email: 'ana@example.com',
      phone: '1191234567',
      cpfCnpj: '123.456.789-09',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('phone')
  })

  it('rejects a missing CPF/CNPJ', () => {
    const result = customerSchema.safeParse({
      name: 'Ana Lima',
      email: 'ana@example.com',
      phone: '11 91234-5678',
      cpfCnpj: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('cpfCnpj')
  })
})

describe('addressSchema', () => {
  const validAddress = {
    cep: '01310-100',
    street: 'Av. Paulista',
    number: '1000',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
  }

  it('accepts valid address and normalizes CEP', () => {
    const result = addressSchema.safeParse(validAddress)

    expect(result.success).toBe(true)
    expect(result.data?.cep).toBe('01310100')
  })

  it('rejects malformed CEP', () => {
    const result = addressSchema.safeParse({ ...validAddress, cep: '1234' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('cep')
  })

  it('rejects missing street', () => {
    const result = addressSchema.safeParse({ ...validAddress, street: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('street')
  })

  it('rejects missing number', () => {
    const result = addressSchema.safeParse({ ...validAddress, number: '' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('number')
  })

  it('rejects invalid state code', () => {
    const result = addressSchema.safeParse({ ...validAddress, state: 'São Paulo' })

    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('state')
  })
})

describe('notesSchema', () => {
  it('accepts empty notes', () => {
    const result = notesSchema.safeParse('')

    expect(result.success).toBe(true)
  })

  it('accepts undefined notes', () => {
    const result = notesSchema.safeParse(undefined)

    expect(result.success).toBe(true)
  })

  it('rejects notes over 300 characters', () => {
    const result = notesSchema.safeParse('x'.repeat(301))

    expect(result.success).toBe(false)
  })

  it('accepts notes up to 300 characters', () => {
    const result = notesSchema.safeParse('x'.repeat(300))

    expect(result.success).toBe(true)
  })
})

describe('checkoutFormSchema', () => {
  const validForm = {
    customer: {
      name: 'Ana Lima',
      email: 'ana@example.com',
      phone: '(11) 91234-5678',
      cpfCnpj: '123.456.789-09',
    },
    address: {
      cep: '01310100',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    notes: '',
  }

  it('accepts a complete checkout form without local payment fields', () => {
    const result = checkoutFormSchema.safeParse(validForm)

    expect(result.success).toBe(true)
    expect(result.data?.customer.phone).toBe('11912345678')
    expect(result.data?.customer.cpfCnpj).toBe('12345678909')
  })

  it('rejects missing customer and address data', () => {
    const result = checkoutFormSchema.safeParse({
      customer: { name: '', email: '', phone: '', cpfCnpj: '' },
      address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
      notes: '',
    })

    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBeGreaterThan(0)
  })
})

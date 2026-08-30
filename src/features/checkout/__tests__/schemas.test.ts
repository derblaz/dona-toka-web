import { describe, it, expect } from 'vitest'
import {
  customerSchema,
  addressSchema,
  notesSchema,
  pixPaymentSchema,
  cardPaymentSchema,
  checkoutFormSchema,
} from '../schemas'

// ── Customer ──────────────────────────────────────────────────────────────────

describe('customerSchema', () => {
  it('accepts valid customer data', () => {
    const result = customerSchema.safeParse({
      name: 'Ana Lima',
      email: 'ana@example.com',
      phone: '(11) 91234-5678',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty name', () => {
    const result = customerSchema.safeParse({ name: '', email: 'a@b.com', phone: '11912345678' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('name')
  })

  it('rejects invalid email', () => {
    const result = customerSchema.safeParse({ name: 'Ana', email: 'not-an-email', phone: '11912345678' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('email')
  })

  it('rejects malformed phone', () => {
    const result = customerSchema.safeParse({ name: 'Ana Lima', email: 'a@b.com', phone: '123' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('phone')
  })
})

// ── Address ───────────────────────────────────────────────────────────────────

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

  it('accepts address without complement', () => {
    const result = addressSchema.safeParse(validAddress)
    expect(result.success).toBe(true)
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

// ── Notes ─────────────────────────────────────────────────────────────────────

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

// ── PIX payment ───────────────────────────────────────────────────────────────

describe('pixPaymentSchema', () => {
  it('accepts pix type', () => {
    const result = pixPaymentSchema.safeParse({ type: 'pix' })
    expect(result.success).toBe(true)
  })

  it('rejects wrong type', () => {
    const result = pixPaymentSchema.safeParse({ type: 'card' })
    expect(result.success).toBe(false)
  })
})

// ── Card payment ──────────────────────────────────────────────────────────────

describe('cardPaymentSchema', () => {
  const validCard = {
    type: 'card' as const,
    cardholderName: 'Ana Lima',
    cardNumber: '4539 1488 0343 6467', // valid Luhn
    expiry: '12/99',
    cvv: '123',
  }

  it('accepts valid card data', () => {
    const result = cardPaymentSchema.safeParse(validCard)
    expect(result.success).toBe(true)
  })

  it('strips spaces from card number', () => {
    const result = cardPaymentSchema.safeParse(validCard)
    expect(result.success).toBe(true)
    expect(result.data?.cardNumber).toBe('4539148803436467')
  })

  it('rejects card number that fails Luhn', () => {
    const result = cardPaymentSchema.safeParse({ ...validCard, cardNumber: '1234 5678 9012 3456' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('cardNumber')
  })

  it('rejects invalid expiry format', () => {
    const result = cardPaymentSchema.safeParse({ ...validCard, expiry: '13/25' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('expiry')
  })

  it('rejects expired card', () => {
    const result = cardPaymentSchema.safeParse({ ...validCard, expiry: '01/00' })
    expect(result.success).toBe(false)
  })

  it('rejects short CVV', () => {
    const result = cardPaymentSchema.safeParse({ ...validCard, cvv: '12' })
    expect(result.success).toBe(false)
    expect(result.error?.issues[0].path).toContain('cvv')
  })

  it('rejects empty cardholder name', () => {
    const result = cardPaymentSchema.safeParse({ ...validCard, cardholderName: 'AB' })
    expect(result.success).toBe(false)
  })
})

// ── Full checkout form ────────────────────────────────────────────────────────

describe('checkoutFormSchema', () => {
  const validForm = {
    customer: { name: 'Ana Lima', email: 'ana@example.com', phone: '(11) 91234-5678' },
    address: {
      cep: '01310100',
      street: 'Av. Paulista',
      number: '1000',
      neighborhood: 'Bela Vista',
      city: 'São Paulo',
      state: 'SP',
    },
    notes: '',
    payment: { type: 'pix' as const },
  }

  it('accepts a complete valid PIX form', () => {
    const result = checkoutFormSchema.safeParse(validForm)
    expect(result.success).toBe(true)
  })

  it('accepts a complete valid card form', () => {
    const result = checkoutFormSchema.safeParse({
      ...validForm,
      payment: {
        type: 'card',
        cardholderName: 'Ana Lima',
        cardNumber: '4539 1488 0343 6467',
        expiry: '12/99',
        cvv: '123',
      },
    })
    expect(result.success).toBe(true)
  })

  it('reports errors for all missing required fields', () => {
    const result = checkoutFormSchema.safeParse({
      customer: { name: '', email: '', phone: '' },
      address: { cep: '', street: '', number: '', neighborhood: '', city: '', state: '' },
      payment: { type: 'pix' },
    })
    expect(result.success).toBe(false)
    expect(result.error?.issues.length).toBeGreaterThan(0)
  })
})

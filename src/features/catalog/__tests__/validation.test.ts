import { describe, expect, it } from 'vitest'
import { quantitySchema, validateQuantity, MIN_QUANTITY, MAX_QUANTITY } from '../validation'

describe('quantitySchema', () => {
  it('accepts minimum valid quantity', () => {
    expect(quantitySchema.safeParse(MIN_QUANTITY).success).toBe(true)
  })

  it('accepts maximum valid quantity', () => {
    expect(quantitySchema.safeParse(MAX_QUANTITY).success).toBe(true)
  })

  it('accepts mid-range quantity', () => {
    expect(quantitySchema.safeParse(5).success).toBe(true)
  })

  it('rejects zero', () => {
    const result = quantitySchema.safeParse(0)
    expect(result.success).toBe(false)
  })

  it('rejects negative values', () => {
    expect(quantitySchema.safeParse(-1).success).toBe(false)
  })

  it('rejects value above maximum', () => {
    const result = quantitySchema.safeParse(MAX_QUANTITY + 1)
    expect(result.success).toBe(false)
  })

  it('rejects fractional values', () => {
    expect(quantitySchema.safeParse(1.5).success).toBe(false)
  })

  it('rejects fractional values like 2.7', () => {
    expect(quantitySchema.safeParse(2.7).success).toBe(false)
  })

  it('rejects non-number values', () => {
    expect(quantitySchema.safeParse('abc').success).toBe(false)
    expect(quantitySchema.safeParse(null).success).toBe(false)
    expect(quantitySchema.safeParse(undefined).success).toBe(false)
  })
})

describe('validateQuantity', () => {
  it('returns success with data for valid quantity', () => {
    const result = validateQuantity(3)
    expect(result.success).toBe(true)
    if (result.success) expect(result.data).toBe(3)
  })

  it('returns failure with error message for zero', () => {
    const result = validateQuantity(0)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })

  it('returns failure with error message for above-max value', () => {
    const result = validateQuantity(MAX_QUANTITY + 1)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toMatch(/máxima/i)
  })

  it('returns failure with error message for fractional value', () => {
    const result = validateQuantity(1.5)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error).toBeTruthy()
  })
})

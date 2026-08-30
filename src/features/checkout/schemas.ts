import { z } from 'zod'
import { normalizeCep } from '@/lib/freight'

export const customerSchema = z.object({
  name: z.string().min(2, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  phone: z
    .string()
    .regex(/^\(?\d{2}\)?\s?\d{4,5}-?\d{4}$/, 'Telefone inválido. Formato: (11) 91234-5678'),
})

export const addressSchema = z.object({
  cep: z
    .string()
    .transform(normalizeCep)
    .pipe(z.string().regex(/^\d{8}$/, 'CEP inválido. Informe 8 dígitos')),
  street: z.string().min(3, 'Informe o logradouro'),
  number: z.string().min(1, 'Informe o número'),
  complement: z.string().max(60, 'Complemento muito longo').optional(),
  neighborhood: z.string().min(2, 'Informe o bairro'),
  city: z.string().min(2, 'Informe a cidade'),
  state: z
    .string()
    .length(2, 'Use a sigla do estado (ex: SP)')
    .regex(/^[A-Z]{2}$/, 'Use a sigla do estado (ex: SP)'),
})

export const notesSchema = z
  .string()
  .max(300, 'Observações devem ter no máximo 300 caracteres')
  .optional()
  .default('')

export const pixPaymentSchema = z.object({
  type: z.literal('pix'),
})

export const cardPaymentSchema = z.object({
  type: z.literal('card'),
  cardholderName: z.string().min(3, 'Informe o nome do titular'),
  cardNumber: z
    .string()
    .transform((v) => v.replace(/\s+/g, ''))
    .pipe(
      z
        .string()
        .regex(/^\d{13,19}$/, 'Número de cartão inválido')
        .refine(luhnCheck, 'Número de cartão inválido'),
    ),
  expiry: z
    .string()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Validade inválida. Formato: MM/AA')
    .refine((v) => {
      const [month, year] = v.split('/')
      const now = new Date()
      const expDate = new Date(2000 + Number(year), Number(month) - 1, 1)
      return expDate >= new Date(now.getFullYear(), now.getMonth(), 1)
    }, 'Cartão expirado'),
  cvv: z.string().regex(/^\d{3,4}$/, 'CVV inválido'),
})

export const paymentSchema = z.discriminatedUnion('type', [pixPaymentSchema, cardPaymentSchema])

export const checkoutFormSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  notes: notesSchema,
  payment: paymentSchema,
})

export type CustomerInput = z.input<typeof customerSchema>
export type AddressInput = z.input<typeof addressSchema>
export type NotesInput = z.input<typeof notesSchema>
export type PixPaymentInput = z.input<typeof pixPaymentSchema>
export type CardPaymentInput = z.input<typeof cardPaymentSchema>
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>

/** Luhn algorithm for card number validation */
function luhnCheck(num: string): boolean {
  let sum = 0
  let alternate = false
  for (let i = num.length - 1; i >= 0; i--) {
    let n = parseInt(num[i], 10)
    if (alternate) {
      n *= 2
      if (n > 9) n -= 9
    }
    sum += n
    alternate = !alternate
  }
  return sum % 10 === 0
}

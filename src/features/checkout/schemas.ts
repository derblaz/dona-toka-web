import { z } from 'zod'
import { stripNonDigits } from '@/lib/masks'

export const customerSchema = z
  .object({
    name: z.string().min(2, 'Informe seu nome completo'),
    email: z.string().email('E-mail inválido'),
    phone: z
      .string()
      .transform(stripNonDigits)
      .pipe(z.string().regex(/^\d{11}$/, 'Telefone inválido. Informe 11 dígitos')),
    cpfCnpj: z
      .string()
      .transform(stripNonDigits)
      .pipe(
        z
          .string()
          .refine((value) => value.length === 11 || value.length === 14, {
            message: 'CPF ou CNPJ inválido. Informe 11 ou 14 dígitos',
          }),
      ),
  })
  .strict()

export const addressSchema = z
  .object({
    cep: z
      .string()
      .transform(stripNonDigits)
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
  .strict()

export const notesSchema = z
  .string()
  .max(300, 'Observações devem ter no máximo 300 caracteres')
  .optional()
  .default('')

export const checkoutFormSchema = z
  .object({
    customer: customerSchema,
    address: addressSchema,
    notes: notesSchema,
  })
  .strict()

export type CustomerInput = z.input<typeof customerSchema>
export type AddressInput = z.input<typeof addressSchema>
export type NotesInput = z.input<typeof notesSchema>
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>

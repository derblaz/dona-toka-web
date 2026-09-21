import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useCartStore } from '@/features/cart/hooks'
import * as cartStore from '@/features/cart/store'
import { formatCurrency } from '@/lib/currency'
import { normalizeCep } from '@/lib/freight'
import { confirmCheckout } from '@/features/checkout/service'
import {
  customerSchema,
  addressSchema,
  notesSchema,
  paymentSchema,
} from '@/features/checkout/schemas'
import { ShippingQuoteValidationError, useShippingQuote } from '@/features/shipping/hooks'
import type { ShippingOption, ShippingQuoteResult } from '@/features/shipping/types'
import type { FreightQuote } from '@/lib/freight'
import type { CustomerInput, AddressInput, CardPaymentInput } from '@/features/checkout/schemas'

export const Route = createFileRoute('/checkout')({
  beforeLoad() {
    const items = cartStore.getItems()
    if (items.length === 0) {
      throw redirect({ to: '/carrinho' })
    }
  },
  component: CheckoutPage,
})

type PaymentType = 'pix' | 'card'

interface FieldErrors {
  name?: string
  email?: string
  phone?: string
  cep?: string
  street?: string
  number?: string
  complement?: string
  neighborhood?: string
  city?: string
  state?: string
  notes?: string
  cardholderName?: string
  cardNumber?: string
  expiry?: string
  cvv?: string
  freight?: string
  general?: string
}

function CheckoutPage() {
  const { items, subtotalCents } = useCartStore()
  const navigate = useNavigate()

  const [customer, setCustomer] = useState<CustomerInput>({ name: '', email: '', phone: '' })
  const [address, setAddress] = useState<AddressInput>({
    cep: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
  })
  const [notes, setNotes] = useState('')
  const [paymentType, setPaymentType] = useState<PaymentType>('pix')
  const [card, setCard] = useState<Omit<CardPaymentInput, 'type'>>({
    cardholderName: '',
    cardNumber: '',
    expiry: '',
    cvv: '',
  })
  const [freightQuote, setFreightQuote] = useState<FreightQuote | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShippingCode, setSelectedShippingCode] = useState<string | null>(null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [submitting, setSubmitting] = useState(false)
  const shippingQuote = useShippingQuote()

  const totalCents = subtotalCents + (freightQuote?.amountCents ?? 0)

  function mapShippingQuoteToOption(result: ShippingQuoteResult, option: ShippingOption): FreightQuote {
    return {
      amountCents: result.freeShippingApplied ? 0 : option.priceCents,
      estimatedDays: `${option.estimatedDays} dias úteis`,
      label: result.freeShippingApplied ? 'Frete grátis' : option.carrierName,
    }
  }

  function sortShippingOptions(options: ShippingOption[]): ShippingOption[] {
    return [...options].sort((a, b) => {
      if (a.priceCents === b.priceCents) return a.estimatedDays - b.estimatedDays
      return a.priceCents - b.priceCents
    })
  }

  function handleFreightQuote() {
    const normalizedCep = normalizeCep(address.cep)
    if (!/^\d{8}$/.test(normalizedCep)) {
      setFreightQuote(null)
      setShippingOptions([])
      setSelectedShippingCode(null)
      setErrors((e) => ({ ...e, freight: 'CEP inválido. Informe um CEP com 8 dígitos.' }))
      return
    }

    shippingQuote.mutate(
      {
        destinationZip: normalizedCep,
        items: items.map(({ productId, quantity }) => ({ productId, quantity })),
      },
      {
        onSuccess: (result) => {
          if (!result.options || result.options.length === 0) {
            setFreightQuote(null)
            setShippingOptions([])
            setSelectedShippingCode(null)
            setErrors((e) => ({ ...e, freight: 'Não foi possível calcular o frete para este CEP. Tente novamente.' }))
            return
          }

          const orderedOptions = sortShippingOptions(result.options)
          setShippingOptions(orderedOptions)
          const cheapest = orderedOptions[0]
          setSelectedShippingCode(cheapest.serviceCode)
          const nextQuote = mapShippingQuoteToOption(result, cheapest)
          setFreightQuote(nextQuote)
          setErrors((e) => ({ ...e, freight: undefined }))
        },
        onError: (error) => {
          const message = error instanceof ShippingQuoteValidationError
            ? error.message
            : 'Não foi possível calcular o frete neste momento. Tente novamente.'
          setFreightQuote(null)
          setShippingOptions([])
          setSelectedShippingCode(null)
          setErrors((e) => ({ ...e, freight: message }))
        },
      },
    )
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const newErrors: FieldErrors = {}

    const customerResult = customerSchema.safeParse(customer)
    if (!customerResult.success) {
      for (const issue of customerResult.error.issues) {
        const field = issue.path[0] as keyof CustomerInput
        newErrors[field] = issue.message
      }
    }

    const normalizedAddress = { ...address, cep: normalizeCep(address.cep) }
    const addressResult = addressSchema.safeParse(normalizedAddress)
    if (!addressResult.success) {
      for (const issue of addressResult.error.issues) {
        const field = issue.path[0] as string
        if (
          field === 'cep' ||
          field === 'street' ||
          field === 'number' ||
          field === 'complement' ||
          field === 'neighborhood' ||
          field === 'city' ||
          field === 'state'
        ) {
          newErrors[field as keyof FieldErrors] = issue.message
        }
      }
    }

    const notesResult = notesSchema.safeParse(notes)
    if (!notesResult.success) {
      newErrors.notes = notesResult.error.issues[0]?.message
    }

    const paymentInput =
      paymentType === 'pix' ? { type: 'pix' as const } : { type: 'card' as const, ...card }
    const paymentResult = paymentSchema.safeParse(paymentInput)
    if (!paymentResult.success) {
      for (const issue of paymentResult.error.issues) {
        const field = issue.path[0] as string
        if (
          field === 'cardholderName' ||
          field === 'cardNumber' ||
          field === 'expiry' ||
          field === 'cvv'
        ) {
          newErrors[field as keyof FieldErrors] = issue.message
        }
      }
    }

    if (!freightQuote) {
      newErrors.freight = 'Calcule o frete antes de continuar'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setErrors({})
    setSubmitting(true)

    try {
      const order = confirmCheckout({
        customer: customerResult.data!,
        address: addressResult.data!,
        notes: notesResult.data ?? '',
        payment: paymentResult.data!,
        items,
        freightQuote: freightQuote!,
      })

      cartStore.clearCart()
      toast.success('Pedido confirmado!')
      await navigate({ to: '/pedido/$orderId', params: { orderId: order.orderId } })
    } catch (_err) {
      toast.error('Não foi possível confirmar seu pedido. Tente novamente.')
      setErrors({ general: 'Erro ao confirmar pedido. Tente novamente.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="mx-auto max-w-5xl px-6 py-12">
      <h1 className="font-display text-4xl text-text-primary mb-8">Finalizar Pedido</h1>

      <form onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col gap-8 lg:flex-row">
          {/* Left column: forms */}
          <div className="flex flex-1 flex-col gap-6">
            {/* Identity */}
            <fieldset className="rounded-[var(--radius)] border border-border bg-surface p-6">
              <legend className="sr-only">Seus dados</legend>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Seus dados</h2>
              <div className="flex flex-col gap-4">
                <FormField
                  label="Nome completo"
                  id="name"
                  autoComplete="name"
                  value={customer.name}
                  onChange={(v) => setCustomer((c) => ({ ...c, name: v }))}
                  error={errors.name}
                  required
                />
                <FormField
                  label="E-mail"
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={customer.email}
                  onChange={(v) => setCustomer((c) => ({ ...c, email: v }))}
                  error={errors.email}
                  required
                />
                <FormField
                  label="Telefone"
                  id="phone"
                  type="tel"
                  autoComplete="tel"
                  placeholder="(11) 91234-5678"
                  value={customer.phone}
                  onChange={(v) => setCustomer((c) => ({ ...c, phone: v }))}
                  error={errors.phone}
                  required
                />
              </div>
            </fieldset>

            {/* Address */}
            <fieldset className="rounded-[var(--radius)] border border-border bg-surface p-6">
              <legend className="sr-only">Endereço de entrega</legend>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Endereço de entrega</h2>
              <div className="flex flex-col gap-4">
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <FormField
                      label="CEP"
                      id="cep"
                      autoComplete="postal-code"
                      placeholder="00000-000"
                      value={address.cep}
                      onChange={(v) => {
                        setAddress((a) => ({ ...a, cep: v }))
                        setFreightQuote(null)
                      }}
                      error={errors.cep}
                      required
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleFreightQuote}
                    className="h-10 rounded-[var(--radius)] border border-primary px-4 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                  >
                    Calcular frete
                  </button>
                </div>
                {errors.freight && (
                  <p role="alert" className="text-sm text-danger">
                    {errors.freight}
                  </p>
                )}
                {shippingOptions.length > 0 && (
                  <div className="flex flex-col gap-2">
                    {shippingOptions.map((option) => {
                      const optionQuote = mapShippingQuoteToOption(
                        { options: shippingOptions, freeShippingApplied: shippingOptions.some((current) => current.priceCents === 0), subtotalCents },
                        option,
                      )
                      const isSelected = option.serviceCode === selectedShippingCode

                      return (
                        <label
                          key={option.serviceCode}
                          className={`flex cursor-pointer items-center justify-between gap-3 rounded-[var(--radius)] border px-3 py-2 ${
                            isSelected ? 'border-primary bg-primary/5' : 'border-border bg-surface'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="checkout-shipping-option"
                              checked={isSelected}
                              onChange={() => {
                                setSelectedShippingCode(option.serviceCode)
                                setFreightQuote(optionQuote)
                                setErrors((e) => ({ ...e, freight: undefined }))
                              }}
                              className="accent-primary"
                            />
                            <div>
                              <div className="font-medium text-text-primary">{option.carrierName}</div>
                              <div className="text-xs text-text-secondary">{option.estimatedDays} dias úteis</div>
                            </div>
                          </div>
                          <span className="font-semibold text-text-primary">
                            {optionQuote.amountCents === 0 ? 'Grátis' : formatCurrency(optionQuote.amountCents)}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}

                {freightQuote && (
                  <p className="text-sm text-success font-medium">
                    {freightQuote.label} — {freightQuote.estimatedDays}
                    {freightQuote.amountCents > 0 &&
                      ` (${formatCurrency(freightQuote.amountCents)})`}
                  </p>
                )}
                <FormField
                  label="Rua / Avenida"
                  id="street"
                  autoComplete="street-address"
                  value={address.street}
                  onChange={(v) => setAddress((a) => ({ ...a, street: v }))}
                  error={errors.street}
                  required
                />
                <div className="flex gap-3">
                  <div className="w-28">
                    <FormField
                      label="Número"
                      id="number"
                      value={address.number}
                      onChange={(v) => setAddress((a) => ({ ...a, number: v }))}
                      error={errors.number}
                      required
                    />
                  </div>
                  <div className="flex-1">
                    <FormField
                      label="Complemento"
                      id="complement"
                      autoComplete="address-line2"
                      placeholder="Apto, bloco... (opcional)"
                      value={address.complement ?? ''}
                      onChange={(v) => setAddress((a) => ({ ...a, complement: v }))}
                      error={errors.complement}
                    />
                  </div>
                </div>
                <FormField
                  label="Bairro"
                  id="neighborhood"
                  value={address.neighborhood}
                  onChange={(v) => setAddress((a) => ({ ...a, neighborhood: v }))}
                  error={errors.neighborhood}
                  required
                />
                <div className="flex gap-3">
                  <div className="flex-1">
                    <FormField
                      label="Cidade"
                      id="city"
                      autoComplete="address-level2"
                      value={address.city}
                      onChange={(v) => setAddress((a) => ({ ...a, city: v }))}
                      error={errors.city}
                      required
                    />
                  </div>
                  <div className="w-20">
                    <FormField
                      label="Estado"
                      id="state"
                      autoComplete="address-level1"
                      placeholder="SP"
                      maxLength={2}
                      value={address.state}
                      onChange={(v) => setAddress((a) => ({ ...a, state: v.toUpperCase() }))}
                      error={errors.state}
                      required
                    />
                  </div>
                </div>
              </div>
            </fieldset>

            {/* Notes */}
            <fieldset className="rounded-[var(--radius)] border border-border bg-surface p-6">
              <legend className="sr-only">Observações</legend>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Observações</h2>
              <label htmlFor="notes" className="block text-sm font-medium text-text-secondary mb-1">
                Alguma observação sobre o pedido? (opcional)
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={320}
                rows={3}
                aria-invalid={!!errors.notes}
                aria-describedby={errors.notes ? 'notes-error' : undefined}
                className="w-full rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary resize-none"
              />
              {errors.notes && (
                <p id="notes-error" role="alert" className="mt-1 text-sm text-danger">
                  {errors.notes}
                </p>
              )}
            </fieldset>

            {/* Payment */}
            <fieldset className="rounded-[var(--radius)] border border-border bg-surface p-6">
              <legend className="sr-only">Forma de pagamento</legend>
              <h2 className="mb-4 text-lg font-semibold text-text-primary">Forma de pagamento</h2>
              <div className="flex gap-4 mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="pix"
                    checked={paymentType === 'pix'}
                    onChange={() => setPaymentType('pix')}
                    className="accent-primary"
                  />
                  <span className="font-medium">PIX</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="paymentType"
                    value="card"
                    checked={paymentType === 'card'}
                    onChange={() => setPaymentType('card')}
                    className="accent-primary"
                  />
                  <span className="font-medium">Cartão de crédito</span>
                </label>
              </div>

              {paymentType === 'pix' && (
                <p className="text-sm text-text-secondary">
                  Após confirmar o pedido, você receberá as instruções de pagamento PIX por
                  e-mail.
                </p>
              )}

              {paymentType === 'card' && (
                <div className="flex flex-col gap-4">
                  <FormField
                    label="Nome no cartão"
                    id="cardholderName"
                    autoComplete="cc-name"
                    value={card.cardholderName}
                    onChange={(v) => setCard((c) => ({ ...c, cardholderName: v }))}
                    error={errors.cardholderName}
                    required
                  />
                  <FormField
                    label="Número do cartão"
                    id="cardNumber"
                    autoComplete="cc-number"
                    placeholder="1234 5678 9012 3456"
                    value={card.cardNumber}
                    onChange={(v) => setCard((c) => ({ ...c, cardNumber: v }))}
                    error={errors.cardNumber}
                    required
                  />
                  <div className="flex gap-3">
                    <div className="w-28">
                      <FormField
                        label="Validade"
                        id="expiry"
                        autoComplete="cc-exp"
                        placeholder="MM/AA"
                        maxLength={5}
                        value={card.expiry}
                        onChange={(v) => setCard((c) => ({ ...c, expiry: v }))}
                        error={errors.expiry}
                        required
                      />
                    </div>
                    <div className="w-24">
                      <FormField
                        label="CVV"
                        id="cvv"
                        autoComplete="cc-csc"
                        placeholder="123"
                        maxLength={4}
                        value={card.cvv}
                        onChange={(v) => setCard((c) => ({ ...c, cvv: v }))}
                        error={errors.cvv}
                        required
                      />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          </div>

          {/* Right column: order summary */}
          <aside className="lg:w-80" aria-label="Resumo do pedido">
            <div className="flex flex-col gap-4 rounded-[var(--radius)] border border-border bg-surface p-6 sticky top-[108px]">
              <h2 className="text-lg font-semibold text-text-primary">Resumo do pedido</h2>
              <ul className="flex flex-col gap-2" aria-label="Itens">
                {items.map((item) => (
                  <li
                    key={`${item.productId}-${item.variantId}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-text-secondary">
                      {item.productName} ({item.variantName}) × {item.quantity}
                    </span>
                    <span className="font-medium text-text-primary">
                      {formatCurrency(item.priceCents * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>
              <hr className="border-border" />
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Subtotal</span>
                <span className="font-medium">{formatCurrency(subtotalCents)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Frete (estimativa)</span>
                <span className="font-medium">
                  {freightQuote == null
                    ? '–'
                    : freightQuote.amountCents === 0
                      ? 'Grátis'
                      : formatCurrency(freightQuote.amountCents)}
                </span>
              </div>
              {shippingOptions.length > 0 && (
                <div className="rounded-[var(--radius)] border border-border bg-surface-elevated p-3 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-text-secondary">Entrega selecionada</span>
                    <span className="font-medium text-text-primary">
                      {shippingOptions.find((option) => option.serviceCode === selectedShippingCode)?.carrierName ?? 'Opcional'}
                    </span>
                  </div>
                </div>
              )}
              <hr className="border-border" />
              <div className="flex justify-between font-semibold">
                <span>Total estimado</span>
                <span>{formatCurrency(totalCents)}</span>
              </div>
              <p className="text-xs text-text-secondary italic">
                Prazo de entrega é uma estimativa baseada no CEP informado.
              </p>
              {errors.general && (
                <p role="alert" className="text-sm text-danger">
                  {errors.general}
                </p>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-[var(--radius)] bg-primary py-3 font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:opacity-60"
              >
                {submitting ? 'Confirmando...' : 'Confirmar pedido'}
              </button>
            </div>
          </aside>
        </div>
      </form>
    </section>
  )
}

interface FormFieldProps {
  label: string
  id: string
  type?: string
  autoComplete?: string
  placeholder?: string
  maxLength?: number
  value: string
  onChange: (value: string) => void
  error?: string
  required?: boolean
}

function FormField({
  label,
  id,
  type = 'text',
  autoComplete,
  placeholder,
  maxLength,
  value,
  onChange,
  error,
  required,
}: FormFieldProps) {
  const errorId = error ? `${id}-error` : undefined

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-medium text-text-secondary">
        {label}
        {required && (
          <span className="text-danger ml-0.5" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className="rounded-[var(--radius)] border border-border bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-secondary focus:outline-none focus:ring-2 focus:ring-primary aria-[invalid=true]:border-danger"
      />
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import { normalizeCep, quoteFreight } from '@/lib/freight'
import { formatCurrency } from '@/lib/currency'
import { ShippingQuoteValidationError, useShippingQuote } from '@/features/shipping/hooks'
import type { FreightQuote } from '@/lib/freight'
import type { ShippingOption, ShippingQuoteResult } from '@/features/shipping/types'

interface FreightEstimatorProps {
  subtotalCents: number
  /** Product page calls pass the current product to use the shared backend quote flow. */
  productId?: string
  quantity?: number
  items?: Array<{ productId: string; quantity: number }>
  /** Called with the resolved quote so parent can include it in totals. */
  onQuote?: (quote: FreightQuote | null) => void
}

function getQuoteForOption(result: ShippingQuoteResult, option: ShippingOption): FreightQuote {
  return {
    amountCents: result.freeShippingApplied ? 0 : option.priceCents,
    estimatedDays: `${option.estimatedDays} dias úteis`,
    label: result.freeShippingApplied ? 'Frete grátis (estimativa)' : 'Estimativa de frete',
  }
}

function sortOptions(options: ShippingOption[]): ShippingOption[] {
  return [...options].sort((a, b) => {
    if (a.priceCents === b.priceCents) return a.estimatedDays - b.estimatedDays
    return a.priceCents - b.priceCents
  })
}

export function FreightEstimator({ subtotalCents, productId, quantity = 1, items, onQuote }: FreightEstimatorProps) {
  const [cep, setCep] = useState('')
  const [cepError, setCepError] = useState<string | null>(null)
  const [quote, setQuote] = useState<FreightQuote | null>(null)
  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedCode, setSelectedCode] = useState<string | null>(null)
  const shippingQuote = useShippingQuote()

  useEffect(() => {
    if (shippingOptions.length === 0) {
      setSelectedCode(null)
      return
    }

    if (!selectedCode || !shippingOptions.some((option) => option.serviceCode === selectedCode)) {
      const nextOption = sortOptions(shippingOptions)[0]
      setSelectedCode(nextOption.serviceCode)
      setQuote(getQuoteForOption({
        options: shippingOptions,
        freeShippingApplied: shippingOptions.some((option) => option.priceCents === 0),
        subtotalCents,
      }, nextOption))
      onQuote?.(getQuoteForOption({
        options: shippingOptions,
        freeShippingApplied: shippingOptions.some((option) => option.priceCents === 0),
        subtotalCents,
      }, nextOption))
    }
  }, [shippingOptions, selectedCode, subtotalCents, onQuote])

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const filtered = raw.replace(/[^\d-]/g, '').slice(0, 9)
    setCep(filtered)
    setCepError(null)
  }

  function finishWithError(message: string) {
    setCepError(message)
    setShippingOptions([])
    setSelectedCode(null)
    setQuote(null)
    onQuote?.(null)
    toast.error(message)
  }

  function handleEstimate() {
    const normalizedCep = normalizeCep(cep)

    if (!/^\d{8}$/.test(normalizedCep)) {
      finishWithError('CEP inválido. Informe um CEP com 8 dígitos.')
      return
    }

    const requestItems = productId
      ? [{ productId, quantity }]
      : (items ?? []).map(({ productId, quantity }) => ({ productId, quantity }))

    if (requestItems.length === 0) {
      finishWithError('Adicione ao menos um produto para calcular o frete.')
      return
    }

    shippingQuote.mutate(
      {
        destinationZip: normalizedCep,
        items: requestItems,
      },
      {
        onSuccess: (result) => {
          if (!result.options || result.options.length === 0) {
            finishWithError('Não foi possível calcular o frete para este CEP. Tente novamente.')
            return
          }

          const orderedOptions = sortOptions(result.options)
          setShippingOptions(orderedOptions)
          const nextOption = orderedOptions[0]
          setSelectedCode(nextOption.serviceCode)
          const nextQuote = getQuoteForOption(result, nextOption)
          setQuote(nextQuote)
          onQuote?.(nextQuote)
          setCepError(null)
        },
        onError: (error) => {
          const localQuote = quoteFreight({ cep: normalizedCep, subtotalCents })

          if (localQuote.ok) {
            const fallbackOption: ShippingOption = {
              serviceCode: 'local-estimate',
              carrierName: localQuote.quote.amountCents === 0 ? 'Frete grátis' : 'PAC',
              priceCents: localQuote.quote.amountCents,
              estimatedDays: localQuote.quote.estimatedDays.includes('5–7') ? 7 : localQuote.quote.estimatedDays.includes('7–10') ? 10 : 15,
            }
            const result: ShippingQuoteResult = {
              options: [fallbackOption],
              freeShippingApplied: localQuote.quote.amountCents === 0,
              subtotalCents,
            }
            const nextQuote = getQuoteForOption(result, fallbackOption)
            setShippingOptions([fallbackOption])
            setSelectedCode(fallbackOption.serviceCode)
            setQuote(nextQuote)
            onQuote?.(nextQuote)
            setCepError(null)
            return
          }

          const message = error instanceof ShippingQuoteValidationError
            ? error.message
            : localQuote.error.message
          finishWithError(message)
        },
      },
    )
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleEstimate()
  }

  const normalizedCep = normalizeCep(cep)
  const displayCep = normalizedCep.length === 8 ? `${normalizedCep.slice(0, 5)}-${normalizedCep.slice(5)}` : cep
  const selectedOption = useMemo(
    () => shippingOptions.find((option) => option.serviceCode === selectedCode) ?? null,
    [shippingOptions, selectedCode],
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-text-primary">Calcular frete (estimativa)</p>
      <div className="flex gap-2">
        <div className="flex flex-col flex-1 gap-1">
          <input
            id="cep-input"
            type="text"
            inputMode="numeric"
            placeholder="00000-000"
            value={displayCep}
            onChange={handleCepChange}
            onKeyDown={handleKeyDown}
            aria-label="CEP para estimativa de frete"
            aria-invalid={cepError != null}
            aria-describedby={cepError ? 'cep-error' : undefined}
            className="h-9 rounded-[var(--radius)] border border-border bg-surface px-3 text-sm focus:border-primary focus:outline-none"
          />
          {cepError && (
            <p id="cep-error" role="alert" className="text-xs text-danger">
              {cepError}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={handleEstimate}
          disabled={shippingQuote.isPending}
          className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors disabled:cursor-not-allowed disabled:opacity-70"
        >
          {shippingQuote.isPending ? 'Calculando...' : 'Calcular'}
        </button>
      </div>

      {shippingOptions.length > 0 && (
        <div className="rounded-[var(--radius)] border border-border bg-surface-elevated p-3 text-sm">
          <p className="mb-2 text-xs text-text-secondary uppercase tracking-wide">Opções de entrega</p>
          <div className="flex flex-col gap-2">
            {shippingOptions.map((option) => {
              const optionQuote = getQuoteForOption({
                options: shippingOptions,
                freeShippingApplied: shippingOptions.some((current) => current.priceCents === 0),
                subtotalCents,
              }, option)
              const isSelected = selectedOption?.serviceCode === option.serviceCode

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
                      name="shipping-option"
                      checked={isSelected}
                      onChange={() => {
                        setSelectedCode(option.serviceCode)
                        setQuote(optionQuote)
                        onQuote?.(optionQuote)
                      }}
                      className="accent-primary"
                    />
                    <div>
                      <div className="font-medium text-text-primary">{option.carrierName}</div>
                      <div className="text-xs text-text-secondary">Entrega em {option.estimatedDays} dias</div>
                    </div>
                  </div>
                  <span className="font-semibold text-text-primary">
                    {optionQuote.amountCents === 0 ? 'Grátis' : formatCurrency(optionQuote.amountCents)}
                  </span>
                </label>
              )
            })}
          </div>
        </div>
      )}

      {quote && (
        <div
          role="status"
          aria-live="polite"
          className="rounded-[var(--radius)] border border-border bg-surface-elevated p-3 text-sm"
        >
          <p className="text-xs text-text-secondary mb-1 italic">
            Valores e prazos são estimativas e não representam compromisso do transportador.
          </p>
          <div className="flex justify-between">
            <span className="text-text-secondary">{quote.label}</span>
            <span className="font-semibold text-text-primary">
              {quote.amountCents === 0 ? 'Grátis' : formatCurrency(quote.amountCents)}
            </span>
          </div>
          <p className="mt-1 text-text-secondary">
            Prazo estimado: <span className="font-medium text-text-primary">{quote.estimatedDays}</span>
          </p>
        </div>
      )}
    </div>
  )
}

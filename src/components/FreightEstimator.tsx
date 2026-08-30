import { useState } from 'react'
import { toast } from 'sonner'
import { quoteFreight, normalizeCep } from '@/lib/freight'
import { formatCurrency } from '@/lib/currency'
import type { FreightQuote } from '@/lib/freight'

interface FreightEstimatorProps {
  subtotalCents: number
  /** Called with the resolved quote so parent can include it in totals. */
  onQuote?: (quote: FreightQuote | null) => void
}

export function FreightEstimator({ subtotalCents, onQuote }: FreightEstimatorProps) {
  const [cep, setCep] = useState('')
  const [cepError, setCepError] = useState<string | null>(null)
  const [quote, setQuote] = useState<FreightQuote | null>(null)

  function handleCepChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Allow only digits and hyphen, max 9 chars (00000-000)
    const filtered = raw.replace(/[^\d-]/g, '').slice(0, 9)
    setCep(filtered)
    setCepError(null)
  }

  function handleEstimate() {
    const result = quoteFreight({ cep, subtotalCents })
    if (!result.ok) {
      setCepError(result.error.message)
      setQuote(null)
      onQuote?.(null)
      toast.error(result.error.message)
      return
    }
    setCepError(null)
    setQuote(result.quote)
    onQuote?.(result.quote)
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') handleEstimate()
  }

  const normalizedCep = normalizeCep(cep)
  const displayCep = normalizedCep.length === 8
    ? `${normalizedCep.slice(0, 5)}-${normalizedCep.slice(5)}`
    : cep

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
          className="rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
        >
          Calcular
        </button>
      </div>

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

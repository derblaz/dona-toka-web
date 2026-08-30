import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/currency'
import type { Product, ProductVariant } from './models'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant>(product.variants[0])
  const [imageRole, setImageRole] = useState<'layout' | 'real-product'>('real-product')

  const layoutImage = selectedVariant.images.find((i) => i.role === 'layout')
  const realImage = selectedVariant.images.find((i) => i.role === 'real-product')
  const activeImage = imageRole === 'layout' ? layoutImage : realImage

  return (
    <article className="rounded-[var(--radius)] border border-border bg-surface overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-surface-elevated">
        {activeImage && (
          <img
            src={activeImage.src}
            alt={activeImage.alt}
            width={activeImage.width}
            height={activeImage.height}
            loading="lazy"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        )}
        <div className="absolute bottom-2 right-2 flex gap-1">
          <button
            type="button"
            onClick={() => setImageRole('real-product')}
            aria-pressed={imageRole === 'real-product'}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
              imageRole === 'real-product'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface/80 text-text-secondary hover:bg-surface',
            )}
          >
            Produto
          </button>
          <button
            type="button"
            onClick={() => setImageRole('layout')}
            aria-pressed={imageRole === 'layout'}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-semibold transition-colors',
              imageRole === 'layout'
                ? 'bg-primary text-primary-foreground'
                : 'bg-surface/80 text-text-secondary hover:bg-surface',
            )}
          >
            Layout
          </button>
        </div>
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <h2 className="font-display text-lg text-text-primary">{product.name}</h2>

        <div className="flex flex-wrap gap-1" role="radiogroup" aria-label={`Variantes de ${product.name}`}>
          {product.variants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              role="radio"
              aria-checked={selectedVariant.id === variant.id}
              onClick={() => setSelectedVariant(variant)}
              className={cn(
                'rounded-[var(--radius)] border px-3 py-1 text-sm transition-colors',
                selectedVariant.id === variant.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border text-text-secondary hover:border-primary',
              )}
            >
              {variant.name}
            </button>
          ))}
        </div>

        <p className="text-xl font-semibold text-text-primary">{formatCurrency(selectedVariant.priceCents)}</p>

        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="mt-auto inline-flex items-center justify-center rounded-[var(--radius)] bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover transition-colors"
          aria-label={`Ver detalhes de ${product.name} — ${selectedVariant.name}`}
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}

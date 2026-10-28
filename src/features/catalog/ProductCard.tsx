import { Link } from '@tanstack/react-router'
import { formatCurrency } from '@/lib/currency'
import type { Product } from './models'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  if (!product.active) {
    return null
  }

  const heroImage = product.mainImageUrl || product.galleryImageUrls[0] || ''

  return (
    <article className="rounded-[var(--radius)] border border-border bg-surface overflow-hidden flex flex-col">
      <div className="relative aspect-square overflow-hidden bg-surface-elevated">
        {heroImage ? (
          <img
            src={heroImage}
            alt={product.name}
            width={800}
            height={800}
            loading="lazy"
            className="w-full h-full object-cover transition-opacity duration-300"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-text-secondary">
            Imagem indisponível
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col gap-3 flex-1">
        <h2 className="font-display text-lg text-text-primary">{product.name}</h2>
        <p className="text-sm text-text-secondary line-clamp-3">{product.description}</p>
        <p className="text-xl font-semibold text-text-primary">{formatCurrency(product.priceCents)}</p>

        <Link
          to="/produto/$slug"
          params={{ slug: product.slug }}
          className="btn-primary mt-auto px-4 py-2 text-sm"
          aria-label={`Ver detalhes de ${product.name}`}
        >
          Ver detalhes
        </Link>
      </div>
    </article>
  )
}

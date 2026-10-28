import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { catalogRepository } from '@/features/catalog/repository'
import { ProductDetail } from '@/features/catalog/ProductDetail'
import type { Product } from '@/features/catalog/models'

export const Route = createFileRoute('/produto/$slug')({
  component: ProductPage,
})

function ProductPage() {
  const { slug } = Route.useParams()
  const [product, setProduct] = useState<Product | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProduct() {
      try {
        const catalogProduct = await catalogRepository.getProductBySlug(slug)
        if (!active) return
        setProduct(catalogProduct ?? null)
        setLoadError(null)
      } catch {
        if (!active) return
        setProduct(null)
        setLoadError('Não foi possível carregar o produto no momento.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadProduct()

    return () => {
      active = false
    }
  }, [slug])

  if (isLoading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <p className="text-text-secondary">Carregando produto...</p>
      </main>
    )
  }

  if (!product) {
    if (loadError) {
      return (
        <main className="mx-auto max-w-5xl px-6 py-20 text-center">
          <h1 className="font-display text-3xl text-text-primary">Erro ao carregar produto</h1>
          <p className="mt-4 text-text-secondary">{loadError}</p>
          <a
            href="/colecao"
            className="btn-primary mt-8 px-5 py-3"
          >
            Ver coleção
          </a>
        </main>
      )
    }

    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl text-text-primary">Produto não encontrado</h1>
        <p className="mt-4 text-text-secondary">
          O produto que você está procurando não existe ou foi removido da coleção.
        </p>
        <a
          href="/colecao"
          className="btn-primary mt-8 px-5 py-3"
        >
          Ver coleção
        </a>
      </main>
    )
  }

  if (!product.active) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-20 text-center">
        <h1 className="font-display text-3xl text-text-primary">Produto indisponível</h1>
        <p className="mt-4 text-text-secondary">
          Este item não está disponível no momento.
        </p>
        <a
          href="/colecao"
          className="btn-primary mt-8 px-5 py-3"
        >
          Ver coleção
        </a>
      </main>
    )
  }

  return (
    <main>
      <ProductDetail product={product} />
    </main>
  )
}

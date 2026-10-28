import { useEffect, useState } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { catalogRepository } from '@/features/catalog/repository'
import { ProductCard } from '@/features/catalog/ProductCard'
import type { Product } from '@/features/catalog/models'

export const Route = createFileRoute('/colecao')({
  component: CollectionPage,
})

function CollectionPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    async function loadProducts() {
      try {
        const catalogProducts = await catalogRepository.getCollectionProducts()
        if (!active) return
        setProducts(catalogProducts)
        setError(null)
      } catch {
        if (!active) return
        setProducts([])
        setError('Não foi possível carregar a coleção no momento.')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadProducts()

    return () => {
      active = false
    }
  }, [])

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl text-text-primary">Coleção</h1>
        <p className="mt-2 text-text-secondary">
          Toucas cirúrgicas e gorros artesanais com opções de personalização para o seu estilo profissional.
        </p>
      </section>

      {isLoading ? (
        <section className="mx-auto max-w-5xl px-6 pb-16 text-center">
          <p className="text-text-secondary">Carregando coleção...</p>
        </section>
      ) : error ? (
        <section className="mx-auto max-w-5xl px-6 pb-16 text-center">
          <p className="text-text-secondary">{error}</p>
        </section>
      ) : products.length === 0 ? (
        <section className="mx-auto max-w-5xl px-6 pb-16 text-center">
          <p className="text-text-secondary">Nenhum produto disponível no momento.</p>
        </section>
      ) : (
        <section
          className="mx-auto max-w-5xl px-6 pb-16 grid grid-cols-1 sm:grid-cols-2 gap-8"
          aria-label="Produtos da coleção"
        >
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </section>
      )}
    </main>
  )
}

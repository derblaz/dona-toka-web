import { createFileRoute } from '@tanstack/react-router'
import { catalogRepository } from '@/features/catalog/repository'
import { ProductCard } from '@/features/catalog/ProductCard'

export const Route = createFileRoute('/colecao')({
  component: CollectionPage,
})

function CollectionPage() {
  const products = catalogRepository.getCollectionProducts()

  return (
    <main>
      <section className="mx-auto max-w-5xl px-6 py-12">
        <h1 className="font-display text-4xl text-text-primary">Coleção</h1>
        <p className="mt-2 text-text-secondary">
          Toucas cirúrgicas e gorros artesanais com opções de personalização para o seu estilo profissional.
        </p>
      </section>

      {products.length === 0 ? (
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

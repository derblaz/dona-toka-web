import { describe, expect, it } from 'vitest'
import { catalogRepository } from '../repository'
import { CATALOG_SEED } from '../seed'

describe('catalogRepository', () => {
  describe('getProducts', () => {
    it('returns all seeded products', () => {
      const products = catalogRepository.getProducts()
      expect(products).toHaveLength(CATALOG_SEED.length)
      expect(products).toEqual(CATALOG_SEED)
    })

    it('returns both toca-cirurgica and gorro products', () => {
      const products = catalogRepository.getProducts()
      const categories = products.map((p) => p.category)
      expect(categories).toContain('toca-cirurgica')
      expect(categories).toContain('gorro')
    })

    it('returns products with declared variants', () => {
      const products = catalogRepository.getProducts()
      for (const product of products) {
        expect(product.variants.length).toBeGreaterThan(0)
      }
    })
  })

  describe('getProductBySlug', () => {
    it('returns the toca-cirurgica product for slug "toca-cirurgica"', () => {
      const product = catalogRepository.getProductBySlug('toca-cirurgica')
      expect(product).toBeDefined()
      expect(product?.id).toBe('toca-cirurgica')
      expect(product?.category).toBe('toca-cirurgica')
    })

    it('returns the gorro product for slug "gorro"', () => {
      const product = catalogRepository.getProductBySlug('gorro')
      expect(product).toBeDefined()
      expect(product?.id).toBe('gorro')
      expect(product?.category).toBe('gorro')
    })

    it('returns undefined for an unknown slug', () => {
      const product = catalogRepository.getProductBySlug('produto-inexistente')
      expect(product).toBeUndefined()
    })

    it('returns undefined for empty slug', () => {
      expect(catalogRepository.getProductBySlug('')).toBeUndefined()
    })
  })

  describe('getCollectionProducts', () => {
    it('returns both products', () => {
      const products = catalogRepository.getCollectionProducts()
      expect(products).toHaveLength(2)
    })
  })

  describe('seed data integrity', () => {
    it('every seeded variant has distinct layout and real-product images', () => {
      for (const product of CATALOG_SEED) {
        for (const variant of product.variants) {
          const layoutImages = variant.images.filter((i) => i.role === 'layout')
          const realImages = variant.images.filter((i) => i.role === 'real-product')
          expect(layoutImages.length).toBeGreaterThan(0)
          expect(realImages.length).toBeGreaterThan(0)
        }
      }
    })

    it('every seeded variant has non-empty alt text on all images', () => {
      for (const product of CATALOG_SEED) {
        for (const variant of product.variants) {
          for (const image of variant.images) {
            expect(image.alt.trim()).not.toBe('')
          }
        }
      }
    })

    it('toca-cirurgica has plain, printed, lateral-name, brand-logo, and embroidered-name variants', () => {
      const toca = CATALOG_SEED.find((p) => p.slug === 'toca-cirurgica')!
      const variantIds = toca.variants.map((v) => v.id)
      expect(variantIds).toContain('toca-lisa')
      expect(variantIds).toContain('toca-estampada')
      expect(variantIds).toContain('toca-nome-lateral')
      expect(variantIds).toContain('toca-logo-marca')
      expect(variantIds).toContain('toca-nome-bordado')
    })

    it('gorro has all five variant types', () => {
      const gorro = CATALOG_SEED.find((p) => p.slug === 'gorro')!
      const variantIds = gorro.variants.map((v) => v.id)
      expect(variantIds).toContain('gorro-liso')
      expect(variantIds).toContain('gorro-estampado')
      expect(variantIds).toContain('gorro-nome-lateral')
      expect(variantIds).toContain('gorro-logo-marca')
      expect(variantIds).toContain('gorro-nome-bordado')
    })

    it('every variant has a positive price in centavos', () => {
      for (const product of CATALOG_SEED) {
        for (const variant of product.variants) {
          expect(variant.priceCents).toBeGreaterThan(0)
          expect(Number.isInteger(variant.priceCents)).toBe(true)
        }
      }
    })
  })
})

import { queryOptions } from '@tanstack/react-query'
import { catalogRepository } from './repository'

/**
 * `staleTime: 0` makes every mount (navigation) and focus return refetch the
 * public catalog. Queries are never served as fresh, so saved admin edits show
 * up on the next view without cross-tab real-time sync.
 */
export const collectionQueryOptions = queryOptions({
  queryKey: ['catalog', 'collection'] as const,
  queryFn: () => catalogRepository.getCollectionProducts(),
  staleTime: 0,
  retry: false,
})

export function productQueryOptions(slug: string) {
  return queryOptions({
    queryKey: ['catalog', 'product', slug] as const,
    queryFn: async () => (await catalogRepository.getProductBySlug(slug)) ?? null,
    staleTime: 0,
    retry: false,
  })
}

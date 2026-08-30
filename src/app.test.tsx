import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { routeTree } from '@/routeTree.gen'

describe('application foundation', () => {
  it('mounts the landing route through the application router', async () => {
    const router = createRouter({
      routeTree,
      history: createMemoryHistory({ initialEntries: ['/'] }),
    })

    render(<RouterProvider router={router} />)
    expect(await screen.findByRole('heading', { name: /sua touca, do seu jeito/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /criar minha touca/i })).toHaveAttribute('href', '/colecao')
  })
})
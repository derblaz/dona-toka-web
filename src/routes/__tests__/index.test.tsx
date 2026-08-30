import { render, screen } from '@testing-library/react'
import { createMemoryHistory, createRouter, RouterProvider } from '@tanstack/react-router'
import { describe, expect, it } from 'vitest'
import { routeTree } from '@/routeTree.gen'

function renderHomePage() {
    const router = createRouter({ routeTree, history: createMemoryHistory({ initialEntries: ['/'] }) })
    render(<RouterProvider router={router} />)
}

describe('HomePage', () => {
    it('renders the reference hero content and image', async () => {
        renderHomePage()
        expect(await screen.findByRole('heading', { name: /sua touca, do seu jeito/i, level: 1 })).toBeInTheDocument()
        expect(screen.getByText(/toucas cirúrgicas · dona tôka/i)).toBeInTheDocument()
        expect(screen.getByAltText(/modelo dona tôka/i)).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /criar minha touca/i })).toHaveAttribute('href', '/colecao')
    })

    it('renders collection, personalization, brand and customer sections', async () => {
        renderHomePage()
        expect(await screen.findByText('Nossa coleção')).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /você imagina/i })).toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /autêntica por natureza/i })).toBeInTheDocument()
        expect(screen.getAllByRole('article')).toHaveLength(6)
        expect(screen.getByText('Juliana · Enfermeira')).toBeInTheDocument()
    })

    it('renders the sticky navigation anchors and cart link', async () => {
        renderHomePage()
        const header = await screen.findByRole('banner')
        expect(screen.getByText(/feitas com cuidado/i)).toBeInTheDocument()
        expect(header).toHaveClass('site-header')
        expect(screen.getByRole('link', { name: /carrinho/i })).toBeInTheDocument()
        expect(screen.getByRole('link', { name: /a dona tôka/i })).toHaveAttribute('href', '/#marca')
        expect(screen.getByRole('link', { name: /clientes/i })).toHaveAttribute('href', '/#clientes')
    })
})
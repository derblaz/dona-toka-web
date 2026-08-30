import type { Product } from './models'

/**
 * Phase 1 catalog seed data.
 * Images reference placeholder paths; replace with production assets without
 * changing the data shape or route code.
 */
export const CATALOG_SEED: Product[] = [
  {
    id: 'toca-cirurgica',
    slug: 'toca-cirurgica',
    name: 'Touca Cirúrgica',
    category: 'toca-cirurgica',
    description:
      'Touca cirúrgica artesanal com tecido respirável e ajuste confortável. Ideal para profissionais da saúde que não abrem mão do estilo.',
    variants: [
      {
        id: 'toca-lisa',
        name: 'Lisa',
        slug: 'toca-lisa',
        priceCents: 4500,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica lisa — diagrama de posicionamento da personalização',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica lisa em uso real por profissional de saúde',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'toca-estampada',
        name: 'Estampada',
        slug: 'toca-estampada',
        priceCents: 5200,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica estampada — diagrama de posicionamento da estampa',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica estampada em uso real por profissional de saúde',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'toca-nome-lateral',
        name: 'Nome Lateral',
        slug: 'toca-nome-lateral',
        priceCents: 5800,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica com nome lateral — diagrama mostrando área de bordado',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica com nome bordado no lateral em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'toca-logo-marca',
        name: 'Logo de Marca',
        slug: 'toca-logo-marca',
        priceCents: 6500,
        maxQuantity: 10,
        images: [
          {
            src: '/logo-dona-toka.png',
            alt: 'Touca cirúrgica com logo de marca — diagrama de posicionamento do logotipo',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica com logo de marca bordado em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'toca-nome-bordado',
        name: 'Nome Bordado',
        slug: 'toca-nome-bordado',
        priceCents: 6200,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica com nome bordado — diagrama mostrando área do bordado personalizado',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Touca cirúrgica com nome bordado personalizado em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
    ],
  },
  {
    id: 'gorro',
    slug: 'gorro',
    name: 'Gorro',
    category: 'gorro',
    description:
      'Gorro confortável e elegante, feito com tecido de qualidade. Perfeito para ambientes frios e para quem valoriza um visual cuidado.',
    variants: [
      {
        id: 'gorro-liso',
        name: 'Liso',
        slug: 'gorro-liso',
        priceCents: 4200,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Gorro liso — diagrama de posicionamento da personalização',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Gorro liso em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'gorro-estampado',
        name: 'Estampado',
        slug: 'gorro-estampado',
        priceCents: 5000,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Gorro estampado — diagrama de posicionamento da estampa',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Gorro estampado em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'gorro-nome-lateral',
        name: 'Nome Lateral',
        slug: 'gorro-nome-lateral',
        priceCents: 5600,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Gorro com nome lateral — diagrama mostrando área de bordado',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Gorro com nome bordado no lateral em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'gorro-logo-marca',
        name: 'Logo de Marca',
        slug: 'gorro-logo-marca',
        priceCents: 6300,
        maxQuantity: 10,
        images: [
          {
            src: '/logo-dona-toka.png',
            alt: 'Gorro com logo de marca — diagrama de posicionamento do logotipo',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Gorro com logo de marca bordado em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
      {
        id: 'gorro-nome-bordado',
        name: 'Nome Bordado',
        slug: 'gorro-nome-bordado',
        priceCents: 6000,
        maxQuantity: 10,
        images: [
          {
            src: '/hero-modelo.png',
            alt: 'Gorro com nome bordado — diagrama mostrando área do bordado personalizado',
            role: 'layout',
            width: 800,
            height: 600,
          },
          {
            src: '/hero-modelo.png',
            alt: 'Gorro com nome bordado personalizado em uso real',
            role: 'real-product',
            width: 800,
            height: 600,
          },
        ],
      },
    ],
  },
]

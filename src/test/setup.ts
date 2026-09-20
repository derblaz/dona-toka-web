import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

afterEach(cleanup)

import.meta.env.VITE_API_BASE_URL = 'http://localhost:8080'

Object.defineProperty(window, 'scrollTo', { value: () => undefined, writable: true })

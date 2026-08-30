import { defineConfig } from 'vitest/config'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      exclude: ['**/*.config.ts', 'dist/**', 'src/main.tsx', 'src/routeTree.gen.ts', 'src/routes/__root.tsx', 'src/routes/carrinho.tsx'],
      thresholds: { lines: 80, functions: 80, branches: 80, statements: 80 },
    },
  },
})
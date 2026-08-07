import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vitest/config'

const alias = {
  '@': fileURLToPath(new URL('./src', import.meta.url)),
  '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
}

export default defineConfig({
  define: { __APP_VERSION__: JSON.stringify('test') },
  resolve: { alias },
  test: {
    projects: [
      {
        // Spiellogik, Validierung, Serverdienste und API – reines Node.
        resolve: { alias },
        define: { __APP_VERSION__: JSON.stringify('test') },
        test: {
          name: 'unit',
          environment: 'node',
          include: ['src/shared/**/*.test.ts', 'src/data/**/*.test.ts', 'server/**/*.test.ts'],
        },
      },
      {
        // Komponenten, die geheime Zustände zeigen bzw. verbergen müssen.
        plugins: [vue()],
        resolve: { alias },
        define: { __APP_VERSION__: JSON.stringify('test') },
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.dom.test.ts'],
        },
      },
    ],
  },
})

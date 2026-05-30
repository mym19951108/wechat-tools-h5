import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  base: '/',
  build: { outDir: 'docs' },
  plugins: [vue()],
  server: {
    host: '0.0.0.0',
    port: 5173
  },
  test: {
    environment: 'jsdom'
  }
})

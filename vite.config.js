import path from 'path'
import { fileURLToPath } from 'url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    open: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      clientPort: 5173,
      overlay: true,
    },
    watch: {
      usePolling: true,
      interval: 200,
      ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**'],
    },
  },
  optimizeDeps: {
    force: true,
  },
  clearScreen: false,
})

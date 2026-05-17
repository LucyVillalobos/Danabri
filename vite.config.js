import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/punto-venta/',
  server: {
    proxy: {
      '/danabri_backend/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/danabri_backend\/api/, '/api'),
      },
    },
  },
})
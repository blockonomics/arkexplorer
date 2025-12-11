import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173, // frontend dev server
    proxy: {
      '/api': {
        target: 'http://localhost:8082', // Go backend
        changeOrigin: true,
        secure: false,
      },
    },
  },
})
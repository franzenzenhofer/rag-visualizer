import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  build: {
    target: 'esnext',
    rollupOptions: {
      output: {
        manualChunks: {
          transformers: ['@xenova/transformers'],
          visx: ['@visx/xychart', '@visx/scale', '@visx/group', '@visx/shape'],
          motion: ['framer-motion']
        }
      }
    }
  },
  optimizeDeps: {
    include: ['@xenova/transformers']
  },
  worker: {
    format: 'es'
  }
})

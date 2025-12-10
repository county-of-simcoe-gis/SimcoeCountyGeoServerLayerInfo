import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'classic' // Use classic runtime for React 16
    })
  ],
  base: '/layerInfo/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: true
  }
})


import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import path from 'path'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // BUG-003 FIX: Configuración de build para chunks estables
  build: {
    rollupOptions: {
      output: {
        // Agrupar dependencias en chunks con nombres estables
        manualChunks: {
          // Vendors de React
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // TanStack Query para data fetching
          'query-vendor': ['@tanstack/react-query'],
          // Iconos (lucide es pesado)
          'icons-vendor': ['lucide-react'],
          // Ene 2026: Librerías pesadas para lazy loading
          'charts-vendor': ['chart.js', 'react-chartjs-2'],
          'd3-vendor': ['d3', 'd3-org-chart'],
          'reactflow-vendor': ['reactflow'],
        },
        // Nombres de chunks estables para mejor caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Advertir si un chunk supera 1MB
    chunkSizeWarningLimit: 1000,
  },
  server: {
    port: 8080,
    host: '0.0.0.0', // Escuchar en todas las interfaces (necesario para Docker)
    watch: {
      usePolling: true, // Necesario para hot reload en Docker en algunos sistemas
      interval: 300, // Intervalo optimizado (300ms = balance performance/responsividad)
    },
    hmr: {
      // Configuración de Hot Module Replacement
      host: 'localhost', // Cambia esto a tu IP si accedes desde otra máquina
      port: 8080,
    },
    proxy: {
      '/api': {
        // Proxy desde el contenedor frontend al backend
        // Vite proxy corre DENTRO del contenedor, puede resolver 'back'
        target: 'http://back:3000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
})

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
  // Ene 2026: Code splitting simplificado para evitar problemas de dependencias
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React ecosystem en un solo chunk (evita problemas de orden de carga)
            if (
              id.includes('react') ||
              id.includes('react-dom') ||
              id.includes('react-router') ||
              id.includes('@tanstack/react-query') ||
              id.includes('zustand')
            ) {
              return 'react-vendor';
            }

            // Librerías pesadas separadas (solo las que NO dependen de React internamente)
            if (id.includes('chart.js') && !id.includes('react-chartjs')) {
              return 'charts-vendor';
            }
            if (id.includes('/d3') || id.includes('d3-org-chart')) {
              return 'd3-vendor';
            }

            // Iconos
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }

            // Formularios
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'forms-vendor';
            }
          }
        },
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    chunkSizeWarningLimit: 500,
  },
  server: {
    port: 8080,
    host: '0.0.0.0', // Escuchar en todas las interfaces (necesario para Docker)
    allowedHosts: ['.trycloudflare.com'], // Permitir túneles Cloudflare
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

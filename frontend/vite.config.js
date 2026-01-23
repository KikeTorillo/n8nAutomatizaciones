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
  // Ene 2026: Code splitting por módulo de negocio
  build: {
    rollupOptions: {
      output: {
        // Agrupar dependencias en chunks con nombres estables
        manualChunks: (id) => {
          // ========== VENDORS (node_modules) ==========
          if (id.includes('node_modules')) {
            // React core
            if (id.includes('react-dom') || id.includes('/react/')) {
              return 'react-vendor';
            }
            if (id.includes('react-router')) {
              return 'react-vendor';
            }

            // TanStack Query
            if (id.includes('@tanstack/react-query')) {
              return 'query-vendor';
            }

            // Iconos (lucide es pesado ~500KB)
            if (id.includes('lucide-react')) {
              return 'icons-vendor';
            }

            // Librerías pesadas para lazy loading
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'charts-vendor';
            }
            if (id.includes('/d3') || id.includes('d3-org-chart')) {
              return 'd3-vendor';
            }
            if (id.includes('reactflow')) {
              return 'reactflow-vendor';
            }

            // Formularios
            if (id.includes('react-hook-form') || id.includes('zod') || id.includes('@hookform')) {
              return 'forms-vendor';
            }

            // Zustand
            if (id.includes('zustand')) {
              return 'state-vendor';
            }
          }

          // ========== MÓDULOS DE NEGOCIO (src) ==========
          // Inventario (páginas y componentes)
          if (id.includes('/pages/inventario/') || id.includes('/components/inventario/')) {
            return 'inventario-module';
          }

          // POS (páginas y componentes)
          if (id.includes('/pages/pos/') || id.includes('/components/pos/')) {
            return 'pos-module';
          }

          // Personas (clientes, profesionales, usuarios)
          if (id.includes('/pages/clientes/') || id.includes('/components/clientes/') ||
              id.includes('/pages/profesionales/') || id.includes('/components/profesionales/') ||
              id.includes('/pages/usuarios/') || id.includes('/components/usuarios/')) {
            return 'personas-module';
          }

          // Configuración
          if (id.includes('/pages/configuracion/') || id.includes('/components/configuracion/')) {
            return 'config-module';
          }

          // Agendamiento (citas, servicios, horarios)
          if (id.includes('/pages/citas/') || id.includes('/components/citas/') ||
              id.includes('/pages/servicios/') || id.includes('/components/servicios/')) {
            return 'agendamiento-module';
          }

          // Website builder
          if (id.includes('/pages/website/') || id.includes('/components/website/')) {
            return 'website-module';
          }

          // Eventos digitales
          if (id.includes('/pages/eventos-digitales/') || id.includes('/components/eventos-digitales/')) {
            return 'eventos-module';
          }

          // Vacaciones y ausencias
          if (id.includes('/pages/vacaciones/') || id.includes('/pages/ausencias/') ||
              id.includes('/components/vacaciones/') || id.includes('/components/ausencias/')) {
            return 'rrhh-module';
          }
        },
        // Nombres de chunks estables para mejor caching
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
      },
    },
    // Advertir si un chunk supera 500KB (reducido de 1MB)
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

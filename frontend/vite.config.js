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
  server: {
    port: 3001,
    host: '0.0.0.0', // Escuchar en todas las interfaces (necesario para Docker)
    watch: {
      usePolling: true, // Necesario para hot reload en Docker en algunos sistemas
      interval: 100, // Intervalo de polling en ms
    },
    hmr: {
      // Configuración de Hot Module Replacement
      host: 'localhost', // Cambia esto a tu IP si accedes desde otra máquina
      port: 3001,
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

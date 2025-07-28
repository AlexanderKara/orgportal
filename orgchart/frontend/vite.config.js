import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig({
  plugins: [react(), svgr()],
  server: {
    port: 5173,
    open: true,
    proxy: {
      '/api': 'http://localhost:3001',
      '/uploads': 'http://localhost:3001',
      // добавьте другие пути, если нужно
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
    allowedHosts: ['a-team.moscow', 'www.a-team.moscow', 'localhost', '127.0.0.1'],
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    chunkSizeWarningLimit: 1000, // Увеличиваем лимит до 1MB
    rollupOptions: {
      output: {
        manualChunks: {
          // Основные библиотеки
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          // UI библиотеки
          ui: ['lucide-react', 'react-icons'],
          // Утилиты и графики
          utils: ['d3', 'qrcode', 'react-select'],
          // Частицы
          particles: ['react-tsparticles', 'tsparticles'],
        },
      },
    },
  },
  base: '/',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || ''),
    'import.meta.env.VITE_FRONTEND_URL': JSON.stringify(process.env.VITE_FRONTEND_URL || ''),
  },
}); 
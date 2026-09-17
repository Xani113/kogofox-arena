import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './')
    }
  },
  server: {
    port: 5174,
    open: false,
    proxy: {
      '/api': 'http://localhost:5173'
    }
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        demo: path.resolve(import.meta.dirname, 'demo.html')
      }
    }
  }
});

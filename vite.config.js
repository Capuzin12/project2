import { defineConfig } from 'vite';

export default defineConfig({
  root: './',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  server: {
    port: 4000,
    open: true
  },
  // Підтримка змінних середовища
  envPrefix: 'VITE_'
});


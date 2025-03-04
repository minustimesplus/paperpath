import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  root: resolve(__dirname, './'), // Ensure root is set to the correct directory
  publicDir: resolve(__dirname, 'public'), // Ensure publicDir is set to the correct directory
});
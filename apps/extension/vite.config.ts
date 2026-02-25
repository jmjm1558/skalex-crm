import { resolve } from 'node:path';

import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  // IMPORTANT: evita que Vite prefiera archivos .js emitidos por tsc dentro de src/
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json']
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // Para extensión es mejor tener nombres estables (manifest los referencia)
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.tsx'),
        background: resolve(__dirname, 'src/background.ts')
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]'
      }
    }
  }
});
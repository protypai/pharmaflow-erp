import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',  // Use relative paths for Electron app:// protocol
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,  // Disable sourcemaps in production (reduces size)
    rollupOptions: {
      output: {
        // Ensure assets are in the assets folder with simple names
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
      },
    },
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 5173,
  },
});

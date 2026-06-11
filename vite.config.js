import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],

  build: {
    target: 'es2020',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 900,
    minify: 'oxc',
    sourcemap: false,
    // Inject modulepreload polyfill so <link rel="modulepreload"> works in all browsers
    modulePreload: { polyfill: true },
    rollupOptions: {
      output: {
        // Stable chunk names for better long-term caching
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase'))         return 'vendor-firebase';
          if (id.includes('lucide-react'))     return 'vendor-icons';
          if (id.includes('axios'))            return 'vendor-http';
          if (id.includes('react-router-dom')) return 'vendor-router';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'axios',
      'lucide-react',
    ],
    exclude: ['firebase/messaging'],
  },

  server: {
    port: 5173,
    hmr: { overlay: true },
  },
});

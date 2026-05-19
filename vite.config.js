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
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('firebase'))        return 'vendor-firebase';
          if (id.includes('lucide-react'))    return 'vendor-icons';
          if (id.includes('axios'))           return 'vendor-http';
          if (id.includes('react-router-dom'))return 'vendor-router';
          if (id.includes('react') || id.includes('react-dom')) return 'vendor-react';
          return 'vendor';
        },
      },
    },
  },

  // Optimize deps pre-bundling
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'axios'],
    exclude: ['firebase/messaging'], // lazy loaded
  },

  server: {
    port: 5173,
    hmr: { overlay: true },
  },
});

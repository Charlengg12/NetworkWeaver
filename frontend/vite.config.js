import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  build: {
    // Output directory
    outDir: 'dist',

    // Generate source maps for production debugging
    sourcemap: false,

    // Minify with esbuild (faster than terser)
    minify: 'esbuild',

    // Chunk size warnings
    chunkSizeWarningLimit: 1000,

    // Rollup options for optimization
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for React and related libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // Separate chunk for icons
          'icons': ['lucide-react'],
        },
        // Asset file naming
        assetFileNames: 'assets/[name]-[hash][extname]',
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
      },
    },

    // Target modern browsers for better optimization
    target: 'esnext',

    // CSS code splitting
    cssCodeSplit: true,
  },

  server: {
    host: true,
    port: 5173,
    allowedHosts: ['networkweaver-frontend', 'localhost', '127.0.0.1'],
  },
})

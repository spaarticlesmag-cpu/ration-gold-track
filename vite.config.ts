import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Enable compression
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: mode === 'production',
      },
    },
    // Optimize chunk splitting
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React libraries
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          // UI libraries
          'ui-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-toast',
            '@radix-ui/react-tooltip',
            'lucide-react'
          ],
          // Maps and charts
          'maps-charts': ['leaflet', 'react-leaflet', 'recharts'],
          // Supabase and auth
          'supabase': ['@supabase/supabase-js'],
          // Query and forms
          'query-forms': ['@tanstack/react-query', 'react-hook-form', '@hookform/resolvers', 'zod'],
          // Other utilities
          'utils': ['date-fns', 'clsx', 'tailwind-merge', 'class-variance-authority']
        },
        // Optimize chunk file names
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop()?.replace('.tsx', '').replace('.ts', '') || 'chunk'
            : 'chunk';
          return `js/${facadeModuleId}-[hash].js`;
        },
        assetFileNames: (assetInfo) => {
          const name = assetInfo.name;
          if (name?.endsWith('.css')) {
            return 'css/[name]-[hash][extname]';
          }
          if (name?.match(/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/i)) {
            return 'images/[name]-[hash][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        }
      },
    },
    // Performance optimizations
    chunkSizeWarningLimit: 1000,
    sourcemap: mode === 'development',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize assets
    assetsInlineLimit: 4096,
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      'lucide-react'
    ],
    exclude: ['@vite/client', '@vite/env']
  },
  // Performance optimizations
  esbuild: {
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  }
}));

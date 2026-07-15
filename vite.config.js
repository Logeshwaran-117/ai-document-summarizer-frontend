import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    // Split vendor code into separate cacheable chunks
    rollupOptions: {
      output: {
        manualChunks: {
          // Core React runtime — tiny, cached forever
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          // Charts — heavy, only needed on dashboard/admin pages
          'vendor-charts': ['recharts'],
          // Animation — loaded only where framer-motion is used
          'vendor-motion': ['framer-motion'],
          // Icons — tree-shaken but still sizeable
          'vendor-icons': ['lucide-react'],
        },
      },
    },
    // Raise the chunk-size warning threshold (recharts is legitimately large)
    chunkSizeWarningLimit: 600,
  },
})

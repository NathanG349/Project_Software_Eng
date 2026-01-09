import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from "path"

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // 👇 C'EST ÇA QUI VA TE CHANGER LA VIE SUR WSL
  server: {
    watch: {
      usePolling: true,
    },
    host: true, // Pour être sûr que ça marche bien en local
    strictPort: true,
    port: 5173,
  }
})
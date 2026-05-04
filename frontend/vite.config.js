import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rolldownOptions: {
      checks: {
        pluginTimings: false
      }
    }
  },
  server: {
    allowedHosts: true // Isto permite qualquer host, facilitando a tua vida na apresentação
  }
})

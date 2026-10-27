import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
        secure: false,
        configure: (proxy) => {
          proxy.on('error', (err, _req, res) => {
            // Handle offline backend gracefully without spamming AggregateError
            if (res && 'writeHead' in res && !(res as any).headersSent) {
              ;(res as any).writeHead(503, { 'Content-Type': 'application/json' })
              res.end(JSON.stringify({
                error: 'Backend API server is not running or unreachable on port 4000.',
                hint: 'Run "npm run dev" to start both the backend server and frontend client concurrently.'
              }))
            }
          })
        }
      }
    }
  }
})

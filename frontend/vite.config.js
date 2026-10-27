import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiBaseUrl = env.VITE_API_BASE_URL || 'http://localhost:5000/api'
  const apiUrl = new URL(apiBaseUrl)
  const apiPath = apiUrl.pathname.replace(/\/$/, '') || '/api'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: {
        '/api': {
          target: apiUrl.origin,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api(?=\/|$)/, apiPath),
        },
      },
    },
  }
})

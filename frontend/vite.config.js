import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  server: {
    // Necessário para funcionar dentro do Docker (expõe para fora do container)
    host: '0.0.0.0',
    port: 5173,

    proxy: {
      // Toda chamada que começar com /api será redirecionada para o backend.
      // Ex: fetch("/api/settings/ai") → http://backend:3333/settings/ai
      '/api': {
        // 'backend' é o nome do serviço no docker-compose.yml.
        // Se estiver rodando SEM Docker, troque por 'http://localhost:3333'.
        target: 'http://backend:3333',
        changeOrigin: true,

        // Remove o prefixo /api antes de enviar ao Express.
        // /api/settings/ai → /settings/ai  (que é a rota real no routes.js)
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
})

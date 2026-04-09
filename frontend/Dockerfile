# frontend/Dockerfile
FROM node:20-alpine

# O Tini gerencia os processos
RUN apk add --no-cache tini

WORKDIR /app

# Copia os manifestos primeiro
COPY package.json package-lock.json ./

# Instala as dependências
RUN npm ci

# Copia o restante do código do frontend
COPY . .

# Expõe a porta padrão do Vite
EXPOSE 5173

ENTRYPOINT ["/sbin/tini", "--"]

# Comando crítico: o Vite precisa do --host 0.0.0.0 para ser acessível fora do container
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]
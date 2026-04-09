# backend/Dockerfile
FROM node:20-alpine

# Instala as dependências do Prisma E do Puppeteer/Chromium para o Alpine
RUN apk add --no-cache \
    openssl \
    tini \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    mesa-gl \
    mesa-dri-gallium \
    libdrm \
    font-noto

# Informa ao Puppeteer para usar o Chromium nativo do Alpine e não baixar um novo
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

# Copia os arquivos de dependência primeiro para otimizar o cache do Docker
COPY package.json package-lock.json ./

# Instala as dependências limpas
RUN npm ci

# Copia a pasta do Prisma e gera o Client para o ambiente Linux do container
COPY prisma ./prisma
RUN npx prisma generate

# Copia o restante do código-fonte do backend
COPY . .

# Expõe a porta 3333 que você usa no Node
EXPOSE 3333

# O Tini ajuda a lidar com sinais de parada (Ctrl+C) corretamente no Docker
ENTRYPOINT ["/sbin/tini", "--"]

# O comando padrão (pode ser sobrescrito pelo docker-compose)
CMD ["npm", "run", "dev"]
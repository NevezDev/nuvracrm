# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copia apenas os manifests primeiro para cache eficiente
COPY package*.json ./
RUN npm ci

# Copia o restante do código
COPY . .

# Passa variáveis VITE para o build (sem crases nos valores)
ARG VITE_SUPABASE_URL
ARG VITE_SUPABASE_ANON_KEY
ARG VITE_GOOGLE_CLIENT_ID
ARG VITE_GOOGLE_REDIRECT_URI
# ATENÇÃO: não passe VITE_GOOGLE_CLIENT_SECRET para o frontend

ENV VITE_SUPABASE_URL=$VITE_SUPABASE_URL
ENV VITE_SUPABASE_ANON_KEY=$VITE_SUPABASE_ANON_KEY
ENV VITE_GOOGLE_CLIENT_ID=$VITE_GOOGLE_CLIENT_ID
ENV VITE_GOOGLE_REDIRECT_URI=$VITE_GOOGLE_REDIRECT_URI

# Build do Vite
RUN npm run build

# Runtime stage
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copia dist e config de preview
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/vite.preview.config.js ./

# Instala vite CLI global para servir o build
RUN npm i -g vite@5

# Porta padrão do vite preview é 4173, mas respeita $PORT do PaaS
EXPOSE 4173
CMD ["sh", "-c", "vite preview --host --port ${PORT:-4173} --config vite.preview.config.js"]
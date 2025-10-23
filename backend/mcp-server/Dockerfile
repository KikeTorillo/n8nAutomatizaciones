# ==========================================
# STAGE 1: Base
# ==========================================
FROM node:20-alpine AS base

WORKDIR /app

# Instalar curl para healthcheck
RUN apk add --no-cache curl

# ==========================================
# STAGE 2: Dependencies
# ==========================================
FROM base AS dependencies

COPY package*.json ./

# Instalar dependencias de producción
RUN npm ci --only=production

# ==========================================
# STAGE 3: Production
# ==========================================
FROM base AS production

# Copiar node_modules desde stage anterior
COPY --from=dependencies /app/node_modules ./node_modules

# Copiar código fuente
COPY . .

# Crear usuario no-root para seguridad
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Cambiar ownership de archivos
RUN chown -R nodejs:nodejs /app

# Exponer puerto
EXPOSE 3100

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3100/health || exit 1

# Cambiar a usuario no-root
USER nodejs

# Comando de inicio
CMD ["node", "index.js"]

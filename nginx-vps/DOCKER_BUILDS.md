# 🐳 Docker Multi-stage Builds - Referencia Técnica

## 📋 Contenido

- [Arquitectura Multi-stage](#arquitectura-multi-stage)
- [Scripts NPM Disponibles](#scripts-npm-disponibles)
- [Comparación Dev vs Prod](#comparación-dev-vs-prod)
- [Troubleshooting Docker](#troubleshooting-docker)

---

## 🏗 Arquitectura Multi-stage

### Frontend (React + Vite → Nginx)

```dockerfile
# Stage 1: Build con Node.js
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build  # Genera /app/dist

# Stage 2: Runtime con Nginx
FROM nginx:alpine AS runtime
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
USER nginx
EXPOSE 8080
```

**Resultado:**
- Desarrollo: 564MB
- **Producción: 82.5MB** (85% reducción) ✨

**Ubicación:** `frontend/Dockerfile.prod`

---

### Backend (Node.js + Express)

```dockerfile
# Stage 1: Dependencies (solo producción)
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production  # Sin devDependencies (jest, nodemon, etc.)

# Stage 2: Runtime
FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache dumb-init
RUN addgroup -g 1001 -S nodejs && adduser -S nodejs -u 1001
COPY --from=dependencies /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs . .
USER nodejs
EXPOSE 3000
CMD ["node", "app.js"]
```

**Resultado:**
- Desarrollo: 428MB
- **Producción: 298MB** (30% reducción) ✨

**Ubicación:** `backend/app/Dockerfile.prod`

---

## 📝 Scripts NPM Disponibles

### Build y Deploy

```bash
# Build completo (backend + frontend)
npm run prod:build

# Build individual
npm run prod:build:backend
npm run prod:build:frontend

# Build + Levantar (deploy completo)
npm run prod:deploy
```

### Gestión de Servicios

```bash
# Levantar servicios
npm run prod:up

# Detener servicios
npm run prod:down

# Reiniciar servicios
npm run prod:restart
```

### Monitoreo

```bash
# Ver estado de contenedores
npm run prod:status

# Logs en tiempo real
npm run prod:logs
npm run prod:logs:backend
npm run prod:logs:frontend

# Ver imágenes creadas
npm run prod:images
```

### Health Checks Locales

```bash
# Backend
curl http://localhost:3000/health

# Frontend
curl http://localhost:8080/health

# MCP Server
curl http://localhost:3100/health
```

---

## 🔄 Comparación Dev vs Prod

### Archivos Docker

| Servicio | Desarrollo | Producción |
|----------|-----------|-----------|
| Frontend | `Dockerfile.dev` | `Dockerfile.prod` |
| Backend | `dockerfile.dev` | `Dockerfile.prod` |
| Compose | `docker-compose.yml` | `docker-compose.prod.yml` |
| Env | `.env` | `.env.prod` |

### Características

| Feature | Desarrollo | Producción |
|---------|-----------|-----------|
| **Base Image** | node:22-alpine | node:22-alpine (misma) |
| **Hot Reload** | ✅ Vite + Nodemon | ❌ |
| **Source Code** | Volume montado | Dentro de imagen |
| **devDependencies** | ✅ Instaladas | ❌ Excluidas |
| **Tamaño Frontend** | 564MB | 82.5MB |
| **Tamaño Backend** | 428MB | 298MB |
| **Usuario** | nodejs:1001 | nodejs:1001 (mismo) |
| **Restart Policy** | unless-stopped | always |
| **Resource Limits** | 2 CPU / 1GB | 0.5-1 CPU / 256-512MB |
| **Logging** | debug | info/warn |

### Comandos Equivalentes

| Acción | Desarrollo | Producción |
|--------|-----------|-----------|
| Levantar | `npm run dev` | `npm run prod:up` |
| Build | Automático en dev | `npm run prod:build` |
| Logs | `npm run logs:all` | `npm run prod:logs` |
| Estado | `npm run status` | `npm run prod:status` |
| Detener | `npm run stop` | `npm run prod:down` |

---

## 🐛 Troubleshooting Docker

### 1. Frontend no carga (404)

**Diagnóstico:**
```bash
# Verificar que el build generó archivos
docker exec front_prod ls -la /usr/share/nginx/html

# Debe contener: index.html, assets/
```

**Solución:**
```bash
npm run prod:build:frontend
npm run prod:up
```

---

### 2. Backend no conecta a DB

**Diagnóstico:**
```bash
npm run prod:logs:backend
docker ps | grep postgres_db_prod
```

**Solución:**
```bash
# Verificar variables de entorno
docker exec back_prod env | grep DB_

# Reiniciar
npm run prod:restart
```

---

### 3. Imagen muy grande

**Causa:** `.dockerignore` no funciona

**Solución:**
```bash
# Verificar .dockerignore
cat backend/app/.dockerignore

# Debe excluir: node_modules, __tests__, *.md, coverage, etc.

# Rebuild con --no-cache
npm run prod:build:backend
```

---

### 4. Error de permisos en Nginx

**Síntoma:** `Permission denied` en `/var/log/nginx`

**Solución:** Ya está implementado en `Dockerfile.prod`:
```dockerfile
RUN chown -R nginx:nginx /var/log/nginx
```

Si persiste:
```bash
docker compose -f docker-compose.prod.yml down
npm run prod:build:frontend
npm run prod:up
```

---

## ✅ Checklist Post-Build

```bash
# 1. Verificar imágenes creadas
npm run prod:images
# Frontend: ~82MB ✅
# Backend: ~298MB ✅

# 2. Verificar servicios healthy
npm run prod:status
# Todos deben mostrar (healthy)

# 3. Health checks responden
curl http://localhost:3000/health
curl http://localhost:8080/health
curl http://localhost:3100/health

# 4. Resource limits activos
docker stats --no-stream back_prod front_prod
# Memory y CPU deben respetar limits
```

---

## 📚 Archivos Relacionados

- `frontend/Dockerfile.prod` - Multi-stage frontend
- `backend/app/Dockerfile.prod` - Multi-stage backend
- `docker-compose.prod.yml` - Compose de producción
- `.env.prod` - Variables de producción
- `VPS_DEPLOYMENT_GUIDE.md` - Deployment en VPS

---

**Versión:** 1.0
**Actualización:** Octubre 2025

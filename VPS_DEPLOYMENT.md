# 🚀 Guía de Deployment VPS

**Última actualización:** 29 Octubre 2025

---

## ✅ Checklist Pre-Deployment

### DNS y Dominios
- [ ] DNS configurado en Hostinger (3 registros A apuntando a IP del VPS)
- [ ] Propagación DNS verificada (15-30 min)

### VPS
- [ ] Ubuntu 20.04+ instalado (mínimo 2GB RAM, 2 vCPU)
- [ ] Acceso root/sudo al VPS
- [ ] Docker y Docker Compose instalados
- [ ] Nginx instalado
- [ ] Firewall UFW configurado (puertos 22, 80, 443)

### Certificados SSL
- [ ] Certbot instalado
- [ ] Certificado wildcard obtenido
- [ ] Renovación automática configurada

### Código
- [ ] Repositorio clonado en `/var/www/n8nAutomatizaciones`
- [ ] `.env` configurado con valores de producción
- [ ] `nginx.vps.conf` copiado a `/etc/nginx/sites-available/`

---

## 🏗️ Arquitectura

El sistema usa **dos instancias de Nginx**:

### Nginx #1: VPS Host (`nginx.vps.conf`)
- SSL/TLS termination (Let's Encrypt)
- Routing de subdominios
- Security headers y rate limiting

### Nginx #2: Frontend Container
- Sirve archivos React
- Proxy `/api` → backend
- Client-side routing

**Flujo:**
```
Internet (HTTPS) → Nginx VPS → Contenedores Docker (HTTP)
```

---

## 📋 Pasos de Deployment

### Paso 1: Configuración Inicial del VPS

```bash
ssh root@tu-vps-ip

# Actualizar sistema
apt update && apt upgrade -y

# Instalar dependencias
apt install -y curl git ufw

# Configurar firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw enable
```

### Paso 2: Instalar Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl start docker
systemctl enable docker
```

### Paso 3: Instalar Nginx

```bash
apt install -y nginx
systemctl stop nginx  # Lo configuraremos antes
```

**Configurar Rate Limiting Zone:**

```bash
# Editar nginx.conf para agregar zone de rate limiting
nano /etc/nginx/nginx.conf
```

Agregar dentro del bloque `http {`, justo después de `http {`:

```nginx
http {

	##
	# Rate Limiting Zones
	##
	limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;

	##
	# Basic Settings
	##
	...
```

Guardar y cerrar (Ctrl+X, Y, Enter).

### Paso 4: Configurar DNS

En Hostinger, crea **3 registros A**:

| Nombre | Valor | TTL |
|--------|-------|-----|
| @ | TU_VPS_IP | 14400 |
| api | TU_VPS_IP | 14400 |
| n8n | TU_VPS_IP | 14400 |

Verificar propagación:
```bash
dig n8nflowautomat.com
```

### Paso 5: Obtener Certificados SSL

⚠️ **IMPORTANTE**: Antes de ejecutar certbot, asegúrate de que los registros DNS hayan propagado correctamente (puede tardar 15-30 minutos).

```bash
apt install -y certbot python3-certbot-nginx

# Obtener wildcard certificate
certbot certonly --manual --preferred-challenges dns \
  -d "*.n8nflowautomat.com" -d "n8nflowautomat.com"
```

**IMPORTANTE**: Certbot te pedirá que agregues registros TXT en tu DNS. Sigue las instrucciones en pantalla.

**Crear archivos de configuración SSL:**

Al usar `certbot certonly --manual`, no se crean automáticamente los archivos de configuración SSL. Créalos manualmente:

```bash
# Crear options-ssl-nginx.conf
cat > /etc/letsencrypt/options-ssl-nginx.conf << 'EOF'
ssl_session_cache shared:le_nginx_SSL:10m;
ssl_session_timeout 1440m;
ssl_session_tickets off;

ssl_protocols TLSv1.2 TLSv1.3;
ssl_prefer_server_ciphers off;

ssl_ciphers "ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384";
EOF

# Generar parámetros DH (puede tardar 1-2 minutos)
openssl dhparam -out /etc/letsencrypt/ssl-dhparams.pem 2048
```

**Configurar renovación automática:**

```bash
systemctl enable certbot.timer
systemctl start certbot.timer
```

### Paso 6: Clonar Repositorio

```bash
mkdir -p /var/www
cd /var/www
git clone https://github.com/tu-usuario/tu-repo.git n8nAutomatizaciones
cd n8nAutomatizaciones

# Configurar .env
cp .env.prod .env
nano .env  # Editar valores de producción
```

**Variables críticas a configurar:**
- `POSTGRES_PASSWORD`
- `N8N_ENCRYPTION_KEY`
- `N8N_BASIC_AUTH_PASSWORD`
- `JWT_SECRET`
- `WEBHOOK_URL=https://n8nflowautomat.com`
- `N8N_EDITOR_BASE_URL=https://n8n.n8nflowautomat.com`
- `CORS_ORIGIN=https://n8nflowautomat.com`

### Paso 7: Configurar Nginx del VPS

```bash
# Copiar configuración
cp nginx.vps.conf /etc/nginx/sites-available/n8nflowautomat.com

# Crear symlink
ln -s /etc/nginx/sites-available/n8nflowautomat.com /etc/nginx/sites-enabled/

# Eliminar default
rm /etc/nginx/sites-enabled/default

# Verificar y reiniciar
nginx -t
systemctl start nginx
systemctl enable nginx
```

### Paso 8: Deployment con Script

```bash
cd /var/www/n8nAutomatizaciones

# Ejecutar deployment completo
bash deploy.sh deploy
```

El script hará automáticamente:
1. Copiar `.env.prod` a `.env` (si no existe)
2. Construir imágenes Docker
3. Levantar infraestructura (PostgreSQL, Redis, n8n)
4. Configurar n8n (owner + API key)
5. Levantar aplicación (backend, mcp-server, frontend)
6. Verificar health checks

### Paso 9: Verificar Funcionamiento

```bash
# Health check automático
bash deploy.sh health

# Verificar manualmente
curl -I https://n8nflowautomat.com           # Frontend
curl https://api.n8nflowautomat.com/health   # Backend
```

Acceder a n8n:
- URL: `https://n8n.n8nflowautomat.com`
- Credenciales: Ver `.env` (N8N_BASIC_AUTH_USER/PASSWORD)

### Paso 10: Configurar n8n API Key

```bash
# 1. Acceder a https://n8n.n8nflowautomat.com
# 2. Login con credenciales de .env
# 3. Ir a Settings → API
# 4. Crear API Key
# 5. Copiar el token

# 6. Actualizar .env
nano .env
# Agregar: N8N_API_KEY=tu-token-generado

# 7. Reiniciar backend y mcp-server
docker restart back mcp-server
```

### Paso 11: Restringir Acceso a n8n (Opcional)

```bash
nano /etc/nginx/sites-available/n8nflowautomat.com

# En la sección de n8n (líneas 207-211), descomentar:
# allow TU_IP_PUBLICA;
# deny all;

nginx -t && systemctl reload nginx
```

---

## 🎯 Comandos del Script deploy.sh

### Operaciones Diarias

```bash
bash deploy.sh status    # Ver estado de servicios
bash deploy.sh logs      # Ver logs en tiempo real
bash deploy.sh health    # Health check completo
bash deploy.sh restart   # Reiniciar servicios
```

### Actualizar Código

```bash
bash deploy.sh update    # Git pull + rebuild + restart
```

### Backup

```bash
bash deploy.sh backup    # Backup de PostgreSQL
# Crea: backup_YYYYMMDD_HHMMSS.sql
```

### Gestión de Servicios

```bash
bash deploy.sh up        # Levantar servicios
bash deploy.sh stop      # Detener servicios
bash deploy.sh down      # Bajar contenedores
bash deploy.sh help      # Ver todos los comandos
```

---

## 🔧 Troubleshooting

### Frontend devuelve 502 Bad Gateway

**Causa:** Contenedor frontend no está corriendo o puerto incorrecto

**Solución:**
```bash
docker ps | grep front
bash deploy.sh logs
docker compose -f docker-compose.prod.yml up -d front
```

### Backend no responde

**Causa:** Variables de entorno incorrectas o base de datos no lista

**Solución:**
```bash
docker logs back | grep -i error
docker restart postgres_db
sleep 30
docker restart back
```

### n8n no carga

**Causa:** Base de datos no está lista

**Solución:**
```bash
docker inspect postgres_db | grep -A 10 Health
docker restart postgres_db n8n-main
```

### Webhooks no funcionan

**Causa:** WEBHOOK_URL incorrecto en .env

**Verificar:**
```bash
docker exec n8n-main env | grep WEBHOOK_URL
# Debe ser: WEBHOOK_URL=https://n8nflowautomat.com
```

**Solución:**
```bash
nano .env
docker restart n8n-main n8n-worker
```

### MCP Server no conecta al backend

**Causa:** BACKEND_API_URL incorrecto

**Verificar:**
```bash
docker logs mcp-server
# Debe ver: backend: connected
```

**Solución:**
```bash
# Verificar que docker-compose.prod.yml tenga:
# BACKEND_API_URL=http://back:3000
docker compose -f docker-compose.prod.yml up -d --force-recreate mcp-server
```

### Certificados SSL expirados

**Solución:**
```bash
certbot renew --force-renewal
nginx -t && systemctl reload nginx
```

---

## 🔄 Mantenimiento Regular

### Actualizar aplicación después de git push

```bash
ssh user@vps
cd /var/www/n8nAutomatizaciones
bash deploy.sh update
bash deploy.sh health
```

### Backup semanal

```bash
bash deploy.sh backup
# Mover backup a ubicación segura
```

### Ver uso de recursos

```bash
docker stats
bash deploy.sh status
```

### Limpiar imágenes antiguas

```bash
docker image prune -a
```

---

## 📞 URLs de Producción

- **Frontend:** https://n8nflowautomat.com
- **Backend API:** https://api.n8nflowautomat.com
- **n8n (privado):** https://n8n.n8nflowautomat.com
- **Webhooks:** https://n8nflowautomat.com/webhook/*

---

## 🎉 Deployment Completado

Si todos los health checks pasan, tu aplicación está funcionando correctamente en producción.

Para verificar:
```bash
bash deploy.sh health
```

Deberías ver:
```
Frontend (8080): ✅ OK
Backend (3000): ✅ OK
n8n (5678): ✅ OK
MCP Server (3100): ✅ OK
```

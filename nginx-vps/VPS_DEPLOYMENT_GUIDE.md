# 🚀 Guía de Despliegue en VPS con Subdominios

> **Nota:** Esta guía está **optimizada para Hostinger VPS** (Ubuntu 24.04). Compatible con cualquier VPS Ubuntu/Debian con ajustes menores.
>
> **Referencia técnica Docker:** Ver [`DOCKER_BUILDS.md`](./DOCKER_BUILDS.md) para detalles de multi-stage builds.

## 📋 Resumen de Arquitectura Final

```
┌─────────────────────────────────────────────────────────────┐
│                    n8nflowautomat.com                       │
│                  (Certificado SSL Wildcard)                 │
└─────────────────────────────────────────────────────────────┘
                             │
                    ┌────────┴────────┐
                    │   Nginx (VPS)   │
                    │   Puerto 443    │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
┌───────▼───────┐   ┌────────▼─────────┐   ┌─────▼──────┐
│   Frontend    │   │   Backend API    │   │    n8n     │
│               │   │                  │   │            │
│ n8nflowautomat│   │ api.n8nflowautomat│   │ n8n.n8n... │
│    .com       │   │     .com         │   │  (privado) │
│               │   │                  │   │            │
│ Docker:8080   │   │  Docker:3000     │   │Docker:5678 │
└───────────────┘   └──────────────────┘   └────────────┘
        │                    │                    │
        └────────────────────┼────────────────────┘
                             │
                    ┌────────▼────────┐
                    │   PostgreSQL    │
                    │   Redis         │
                    │   Docker Network│
                    └─────────────────┘
```

## ✅ URLs Finales

| Servicio | URL | Descripción |
|----------|-----|-------------|
| **Frontend** | https://n8nflowautomat.com | App principal (público) |
| **Backend API** | https://api.n8nflowautomat.com | API REST (público) |
| **n8n UI** | https://n8n.n8nflowautomat.com | Workflows (privado, solo tu IP) |
| **Webhooks** | https://n8nflowautomat.com/webhook/* | Telegram bots |

---

## 📝 Paso 1: Configurar DNS en Hostinger

### 1.1 Obtener IP de tu VPS

```bash
# Ir a hPanel → VPS → Manage (tu servidor)
# Copiar la IP del VPS desde "VPS Information"
```

### 1.2 Configurar Registros DNS

**Opción A: Si tu dominio está en Hostinger**

1. Ve a **hPanel** → **Domains** → **Manage** (n8nflowautomat.com)
2. Ve a **DNS / Name Servers** → **Manage DNS Records**
3. Agrega estos 3 registros tipo **A**:

```dns
Tipo    Nombre    Points To (IP)     TTL
----    ------    ----------------   -----
A       @         <IP_TU_VPS>        14400
A       api       <IP_TU_VPS>        14400
A       n8n       <IP_TU_VPS>        14400
```

**Opción B: Si tu dominio está en otro proveedor (Cloudflare, GoDaddy)**

Accede al panel DNS de tu proveedor y crea los mismos registros A.

### 1.3 Verificar Propagación DNS

```bash
# Esperar 5-30 minutos (Hostinger: típicamente 15min)
dig n8nflowautomat.com
dig api.n8nflowautomat.com
dig n8n.n8nflowautomat.com

# Los 3 deben resolver a tu IP del VPS
```

**Nota:** Propagación DNS en Hostinger suele ser rápida (15-30 min), pero puede tardar hasta 24h.

---

## 🔐 Paso 2: Obtener Certificado SSL Wildcard en Hostinger

### 2.1 Conectar por SSH al VPS

**Opción A: Browser Terminal (más fácil)**
```bash
# 1. Ve a hPanel → VPS → Manage (tu servidor)
# 2. Click en "Browser Terminal" (esquina superior derecha)
# 3. Ya estás dentro del VPS con acceso root
```

**Opción B: SSH Tradicional**
```bash
# Obtén las credenciales SSH desde hPanel → VPS → SSH Access
ssh root@<IP_TU_VPS>
# Ingresa la contraseña de tu VPS
```

### 2.2 Instalar Certbot

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Certbot
sudo apt install certbot -y

# Verificar instalación
certbot --version
```

### 2.3 Obtener Certificado Wildcard (Método Manual DNS-01)

⚠️ **IMPORTANTE para Hostinger:** Los certificados wildcard requieren validación DNS manual.

```bash
# Ejecutar certbot en modo manual
sudo certbot certonly --manual \
  --preferred-challenges dns \
  -d "n8nflowautomat.com" \
  -d "*.n8nflowautomat.com"
```

**Certbot te pedirá:**

1. **Email:** Tu email para notificaciones
2. **Aceptar términos:** Presiona `Y`
3. **Registro TXT DNS:** Certbot mostrará algo como:

```
Please deploy a DNS TXT record under the name:
_acme-challenge.n8nflowautomat.com

with the following value:
xyz123abc456def789...

Before continuing, verify the record is deployed.
```

### 2.4 Agregar Registro TXT en Hostinger

**NO PRESIONES ENTER EN CERTBOT TODAVÍA**

1. Ve a **hPanel** → **Domains** → **Manage** (n8nflowautomat.com)
2. Ve a **DNS / Name Servers** → **Manage DNS Records**
3. Click **Add Record**
4. Agrega estos datos:

```
Type:    TXT
Name:    _acme-challenge
Points To (Value):    <el valor que dio certbot>
TTL:     14400
```

5. **Espera 5 minutos** (propagación DNS)
6. **Verifica** el registro TXT:
```bash
dig TXT _acme-challenge.n8nflowautomat.com
```

7. Si ves el valor correcto, vuelve a la terminal SSH y **presiona ENTER**

### 2.5 Resultado

Certbot generará el certificado en:
```
/etc/letsencrypt/live/n8nflowautomat.com/fullchain.pem
/etc/letsencrypt/live/n8nflowautomat.com/privkey.pem
```

**Este certificado wildcard cubre:**
- ✅ n8nflowautomat.com
- ✅ api.n8nflowautomat.com
- ✅ n8n.n8nflowautomat.com
- ✅ cualquier-cosa.n8nflowautomat.com

**Renovación Automática:**
```bash
# Configurar cron para renovación (cada 60 días)
sudo crontab -e

# Agregar esta línea:
0 3 1 */2 * certbot renew --quiet
```

---

## 📦 Paso 3: Preparar Proyecto en VPS

### 3.1 Verificar Docker (Hostinger VPS)

**¿Tu VPS tiene Docker preinstalado?**

Hostinger ofrece un **template Ubuntu 24.04 con Docker** ya instalado. Verifica:

```bash
# Verificar si Docker está instalado
docker --version
docker compose version

# Si está instalado, verás:
# Docker version 24.x.x
# Docker Compose version v2.x.x
```

**Si NO tienes Docker instalado:**
```bash
# Instalar Docker y Docker Compose
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo apt install docker-compose-plugin -y

# Verificar instalación
docker --version
docker compose version
```

### 3.2 Instalar Git (si no está)

```bash
# Verificar Git
git --version

# Si no está instalado
sudo apt install git -y
```

### 3.3 Clonar Proyecto

```bash
# Ubicación recomendada
cd /opt

# Clonar proyecto (ajustar URL de tu repo)
sudo git clone <tu-repo-url> saas-agendamiento
cd saas-agendamiento

# Dar permisos si es necesario
sudo chown -R $USER:$USER .
```

### 3.4 Configurar Variables de Entorno

```bash
# El archivo .env.prod ya está listo con la configuración de subdominios

# Verificar que tenga las URLs correctas
grep -E "WEBHOOK_URL|N8N_EDITOR_BASE_URL|CORS_ORIGIN" .env.prod

# Debe mostrar:
# WEBHOOK_URL=https://n8nflowautomat.com
# N8N_EDITOR_BASE_URL=https://n8n.n8nflowautomat.com
# CORS_ORIGIN=https://n8nflowautomat.com
```

---

## 🐳 Paso 4: Construir Imágenes de Producción

```bash
cd /opt/saas-agendamiento

# Build de imágenes multi-stage optimizadas
docker compose -f docker-compose.prod.yml build --no-cache

# Esto toma ~5-10 minutos
# Frontend: ~82MB
# Backend: ~298MB
```

---

## 🌐 Paso 5: Configurar Nginx

```bash
# Copiar configuración con subdominios
sudo cp /opt/saas-agendamiento/nginx-vps/production-subdomains.conf \
        /etc/nginx/sites-available/n8nflowautomat.com

# Activar configuración
sudo ln -s /etc/nginx/sites-available/n8nflowautomat.com \
           /etc/nginx/sites-enabled/

# IMPORTANTE: Editar para agregar tu IP
sudo nano /etc/nginx/sites-available/n8nflowautomat.com

# Buscar esta sección (línea ~168):
# allow 190.85.xxx.xxx;  # Tu IP
# deny all;

# Descomentar y cambiar por tu IP real:
allow 190.85.123.456;  # Tu IP real aquí
deny all;

# Verificar sintaxis
sudo nginx -t

# Debe mostrar:
# nginx: configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Recargar nginx
sudo systemctl reload nginx
```

---

## 🚀 Paso 6: Levantar Stack de Producción

```bash
cd /opt/saas-agendamiento

# Levantar servicios usando .env.prod
docker compose -f docker-compose.prod.yml up -d

# Ver estado
docker compose -f docker-compose.prod.yml ps

# Debe mostrar:
# front_prod        Up (healthy)    0.0.0.0:8080->8080/tcp
# back_prod         Up (healthy)    0.0.0.0:3000->3000/tcp
# n8n-main-prod     Up              0.0.0.0:5678->5678/tcp
# postgres_db_prod  Up (healthy)    0.0.0.0:5432->5432/tcp
# redis_prod        Up (healthy)    0.0.0.0:6379->6379/tcp
```

---

## ✅ Paso 7: Verificar que Todo Funciona

### 7.1 Health Checks

```bash
# Frontend
curl -I https://n8nflowautomat.com/health
# Esperado: HTTP/2 200

# Backend API
curl https://api.n8nflowautomat.com/health
# Esperado: {"status":"ok","uptime":...}

# n8n (desde tu IP permitida)
curl https://n8n.n8nflowautomat.com/healthz
# Esperado: {"status":"ok"}
```

### 7.2 Verificar en Navegador

1. **Frontend:** https://n8nflowautomat.com
   - ✅ Debe cargar la app React
   - ✅ Login debe funcionar
   - ✅ No errores de CORS en consola

2. **Backend API:** https://api.n8nflowautomat.com/health
   - ✅ Debe mostrar JSON de health check

3. **n8n UI:** https://n8n.n8nflowautomat.com
   - ✅ Debe pedir usuario/password (Basic Auth)
   - ✅ Credenciales: `admin` / `<N8N_BASIC_AUTH_PASSWORD del .env.prod>`
   - ✅ Solo accesible desde tu IP

4. **Webhooks:** Probar con un bot de Telegram existente
   - ✅ Debe recibir mensajes correctamente

### 7.3 Verificar Logs

```bash
# Ver logs en tiempo real
docker compose -f docker-compose.prod.yml logs -f

# Logs solo de backend
docker compose -f docker-compose.prod.yml logs -f backend

# Logs solo de frontend
docker compose -f docker-compose.prod.yml logs -f frontend

# Logs de nginx del VPS
sudo tail -f /var/log/nginx/frontend-access.log
sudo tail -f /var/log/nginx/api-access.log
sudo tail -f /var/log/nginx/n8n-access.log
```

---

## 🔒 Paso 8: Configurar Firewall (Hostinger)

### 8.1 Firewall de Hostinger hPanel

⚠️ **IMPORTANTE:** Hostinger tiene **2 niveles de firewall**:
1. **Firewall hPanel** (GUI - prioridad)
2. **UFW** (Linux - dentro del VPS)

**Configurar en hPanel primero:**

1. Ve a **hPanel** → **VPS** → **Manage** (tu servidor)
2. Click en **Firewall** (menú izquierdo)
3. Asegúrate que estos puertos estén **ABIERTOS**:

```
Puerto   Protocolo   Descripción
------   ---------   -----------
22       TCP         SSH (administración)
80       TCP         HTTP (redirige a HTTPS)
443      TCP         HTTPS (tráfico web)
```

4. **BLOQUEAR** todos los demás puertos (especialmente estos):
   - ❌ 3000 (Backend API directo)
   - ❌ 5678 (n8n directo)
   - ❌ 8080 (Frontend directo)
   - ❌ 5432 (PostgreSQL)
   - ❌ 6379 (Redis)

**Nota:** Si tienes problemas con Firewall hPanel, puedes **resetear** desde:
- hPanel → VPS → Settings → Reset Firewall

### 8.2 Firewall UFW (dentro del VPS)

Configurar también UFW como segunda capa de seguridad:

```bash
# Verificar estado UFW
sudo ufw status

# Si está inactivo, configurar reglas
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Permitir solo puertos necesarios
sudo ufw allow 80/tcp    # HTTP (redirige a HTTPS)
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 22/tcp    # SSH

# BLOQUEAR acceso directo a puertos de Docker
sudo ufw deny 3000/tcp   # Backend
sudo ufw deny 5678/tcp   # n8n
sudo ufw deny 8080/tcp   # Frontend
sudo ufw deny 5432/tcp   # PostgreSQL
sudo ufw deny 6379/tcp   # Redis

# Activar firewall
sudo ufw enable

# Verificar
sudo ufw status verbose
```

### 8.3 Verificar Configuración

```bash
# Verificar que solo nginx responde externamente
curl https://n8nflowautomat.com        # ✅ Debe funcionar
curl http://<IP_VPS>:3000/health       # ❌ Debe fallar (bloqueado)
curl http://<IP_VPS>:5678              # ❌ Debe fallar (bloqueado)
curl http://<IP_VPS>:8080              # ❌ Debe fallar (bloqueado)
```

**Resultado esperado:** Todo el tráfico externo DEBE pasar por nginx (puerto 443) únicamente.

---

## 🔄 Paso 9: Configurar Actualizaciones Automáticas

### 9.1 Script de Deploy

```bash
# Crear script de actualización
sudo nano /opt/scripts/deploy-saas.sh
```

```bash
#!/bin/bash
# Script de actualización automática

cd /opt/saas-agendamiento

echo "📥 Pulling latest code..."
git pull origin main

echo "🔨 Building images..."
docker compose -f docker-compose.prod.yml build --no-cache

echo "🚀 Restarting services..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Deploy completed!"
```

```bash
# Dar permisos
sudo chmod +x /opt/scripts/deploy-saas.sh

# Ejecutar cuando necesites actualizar
sudo /opt/scripts/deploy-saas.sh
```

### 9.2 Backups Automáticos

```bash
# Crear script de backup
sudo nano /opt/scripts/backup-saas.sh
```

```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"
mkdir -p $BACKUP_DIR

# Backup de base de datos
docker exec postgres_db_prod pg_dumpall -U admin | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Backup de n8n data
tar -czf "$BACKUP_DIR/n8n_data_$DATE.tar.gz" /opt/saas-agendamiento/data/n8n

# Eliminar backups antiguos (mantener últimos 7 días)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "✅ Backup completado: $DATE"
```

```bash
# Dar permisos
sudo chmod +x /opt/scripts/backup-saas.sh

# Agregar a crontab (cada día a las 3 AM)
sudo crontab -e
# Agregar: 0 3 * * * /opt/scripts/backup-saas.sh >> /var/log/saas-backup.log 2>&1
```

---

## 📊 Comandos Útiles de Producción

```bash
# Ver estado de contenedores
docker compose -f docker-compose.prod.yml ps

# Ver uso de recursos
docker stats --no-stream

# Reiniciar todo el stack
docker compose -f docker-compose.prod.yml restart

# Reiniciar solo un servicio
docker compose -f docker-compose.prod.yml restart backend

# Ver logs
docker compose -f docker-compose.prod.yml logs -f backend

# Acceder a contenedor
docker exec -it back_prod sh

# Acceder a base de datos
docker exec -it postgres_db_prod psql -U admin -d postgres

# Backup manual
docker exec postgres_db_prod pg_dumpall -U admin > backup_$(date +%Y%m%d).sql
```

---

## 🐛 Troubleshooting

### Problema 1: Frontend no carga (404)

**Diagnóstico:**
```bash
# Verificar que nginx esté corriendo
sudo systemctl status nginx

# Verificar que el contenedor frontend esté up
docker ps | grep front_prod

# Ver logs de nginx
sudo tail -f /var/log/nginx/frontend-error.log
```

**Solución:**
```bash
# Reiniciar frontend
docker compose -f docker-compose.prod.yml restart frontend

# Reiniciar nginx
sudo systemctl reload nginx
```

### Problema 2: Backend API no responde (502)

**Diagnóstico:**
```bash
# Verificar que backend esté healthy
docker ps | grep back_prod

# Ver logs del backend
docker logs back_prod --tail 50
```

**Solución:**
```bash
# Verificar variables de entorno
docker exec back_prod env | grep -E "DB_|CORS|NODE_ENV"

# Reiniciar backend
docker compose -f docker-compose.prod.yml restart backend
```

### Problema 3: n8n no accesible (403 Forbidden)

**Causa:** Tu IP cambió o no está en la lista permitida

**Solución:**
```bash
# Ver tu IP actual
curl ifconfig.me

# Actualizar nginx
sudo nano /etc/nginx/sites-available/n8nflowautomat.com
# Cambiar allow por tu nueva IP

sudo nginx -t && sudo systemctl reload nginx
```

### Problema 4: Webhooks no funcionan

**Diagnóstico:**
```bash
# Verificar WEBHOOK_URL
docker exec back_prod env | grep WEBHOOK_URL
# Debe ser: https://n8nflowautomat.com (sin /webhook)

docker exec n8n-main-prod env | grep WEBHOOK_URL
# Debe ser: https://n8nflowautomat.com

# Ver logs de webhooks
sudo tail -f /var/log/nginx/frontend-access.log | grep webhook
```

**Solución:**
```bash
# Si WEBHOOK_URL está mal, actualizar .env.prod y reiniciar
nano /opt/saas-agendamiento/.env.prod
# Asegurar: WEBHOOK_URL=https://n8nflowautomat.com

docker compose -f docker-compose.prod.yml restart n8n-main
```

---

## ✅ Checklist Final de Despliegue

- [ ] DNS configurado (3 registros A)
- [ ] Certificado SSL wildcard obtenido
- [ ] Proyecto clonado en `/opt/saas-agendamiento`
- [ ] `.env.prod` con URLs de subdominios correctas
- [ ] Imágenes de producción construidas
- [ ] Nginx configurado y recargado
- [ ] Firewall configurado (solo 80, 443, 22)
- [ ] Stack levantado y todos los contenedores healthy
- [ ] Frontend accesible en `https://n8nflowautomat.com`
- [ ] Backend API responde en `https://api.n8nflowautomat.com/health`
- [ ] n8n accesible en `https://n8n.n8nflowautomat.com` (desde tu IP)
- [ ] Webhooks funcionan (probar con bot de Telegram)
- [ ] Backups automáticos configurados
- [ ] Script de deploy creado

---

## 🎉 ¡Listo!

Tu SaaS está desplegado profesionalmente con subdominios, SSL, y listo para producción.

**URLs de tu aplicación:**
- 🌐 Frontend: https://n8nflowautomat.com
- 🔌 API: https://api.n8nflowautomat.com
- ⚙️ n8n: https://n8n.n8nflowautomat.com

**Próximos pasos recomendados:**
1. Configurar monitoring (Prometheus + Grafana)
2. Setup CI/CD con GitHub Actions
3. Configurar alertas (Uptime Robot, Better Uptime)
4. Documentar API con Swagger

---

**Versión:** 1.0
**Fecha:** Octubre 2025
**Arquitectura:** Subdominios profesionales

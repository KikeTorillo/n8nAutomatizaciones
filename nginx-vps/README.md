# 📁 nginx-vps - Configuración de Nginx para VPS

Esta carpeta contiene toda la documentación y configuración para despliegue en VPS con subdominios.

> **✅ Optimizado para Hostinger VPS** - Ver [`HOSTINGER_NOTES.md`](./HOSTINGER_NOTES.md) para diferencias específicas.

## 📄 Archivos

### `production-subdomains.conf` ⭐
Configuración de Nginx con subdominios profesionales.

**Usar en:** `/etc/nginx/sites-available/n8nflowautomat.com`

**Arquitectura:**
- `n8nflowautomat.com` → Frontend React
- `api.n8nflowautomat.com` → Backend API
- `n8n.n8nflowautomat.com` → n8n UI (privado)
- `n8nflowautomat.com/webhook/*` → Webhooks Telegram

---

### `VPS_DEPLOYMENT_GUIDE.md` 📚
Guía completa paso a paso para desplegar en VPS.

**Cubre:**
- Configuración DNS (subdominios)
- Obtención SSL wildcard
- Setup Docker Compose en VPS
- Configuración Nginx con subdominios
- Configuración de firewall
- Scripts de backup automático
- Troubleshooting VPS

---

### `DOCKER_BUILDS.md` 🐳
Referencia técnica de multi-stage builds.

**Explica:**
- Arquitectura multi-stage (frontend + backend)
- Scripts npm disponibles (prod:build, etc.)
- Comparación dev vs prod
- Troubleshooting Docker específico

---

### `HOSTINGER_NOTES.md` 🏢
Notas específicas para Hostinger VPS.

**Cubre:**
- Diferencias DNS (hPanel vs otros)
- SSL wildcard método manual DNS-01
- Firewall doble capa (hPanel + UFW)
- Browser Terminal SSH
- Docker template preinstalado
- Troubleshooting Hostinger específico

## 🚀 Despliegue Rápido

```bash
# 1. Copiar configuración a VPS
scp production-subdomains.conf user@vps:/tmp/

# 2. En el VPS
ssh user@vps
sudo mv /tmp/production-subdomains.conf /etc/nginx/sites-available/n8nflowautomat.com
sudo ln -s /etc/nginx/sites-available/n8nflowautomat.com /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

## 📖 Documentación Completa

Lee `VPS_DEPLOYMENT_GUIDE.md` para instrucciones detalladas.

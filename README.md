# Sistema de Automatización WhatsApp con n8n

Bot de WhatsApp inteligente con integración de IA DeepSeek, Google Calendar y arquitectura basada en contenedores Docker.

## 🚀 Características

- **Bot de WhatsApp** integrado con Evolution API
- **Agente IA DeepSeek** para respuestas inteligentes y especializadas
- **Integración Google Calendar** para gestión automatizada de citas
- **Flujos especializados** (barbería, servicios generales)
- **Proxy reverso Nginx** con SSL/TLS
- **Base de datos PostgreSQL** compartida
- **Interfaz de administración** con pgAdmin

## 🏗️ Arquitectura

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   WhatsApp      │────│  Evolution API  │────│      n8n        │
│   Mensajes      │    │   (Puerto 8000) │    │  (Puerto 5678)  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│   DeepSeek AI   │────│  Google         │              │
│   Agent         │    │  Calendar API   │              │
└─────────────────┘    └─────────────────┘              │
                                                        │
┌─────────────────┐    ┌─────────────────┐              │
│   PostgreSQL    │────│    pgAdmin      │──────────────┘
│                 │    │  (Puerto 8001)  │
└─────────────────┘    └─────────────────┘
                │
┌─────────────────┐
│   Nginx Proxy   │
│  SSL/TLS        │
└─────────────────┘
```

## 🔧 Requisitos

- Docker >= 20.0.0
- Node.js >= 18.0.0
- Docker Compose

## ⚡ Inicio Rápido

### 1. Clonar el repositorio
```bash
git clone <repo-url>
cd n8nAutomatizaciones
```

### 2. Configurar variables de entorno
```bash
cp .env.dev .env
# Editar .env con tus configuraciones
```

### 3. Iniciar servicios
```bash
npm run start
```

### 4. Acceder a las interfaces
- **n8n**: http://localhost:5678
- **pgAdmin**: http://localhost:8001
- **Evolution API**: http://localhost:8000

## 📋 Comandos Disponibles

### Gestión de Servicios
```bash
npm run start       # Iniciar todos los servicios
npm run stop        # Detener todos los servicios
npm run restart     # Reiniciar todos los servicios
npm run dev         # Construir e iniciar servicios
npm run dev:fresh   # Inicio limpio con reconstrucción
```

### Monitoreo
```bash
npm run status      # Estado de servicios
npm run logs        # Ver logs de todos los servicios
npm run logs:n8n    # Ver logs específicos de n8n
npm run logs:evolution # Ver logs de Evolution API
npm run logs:postgres  # Ver logs de PostgreSQL
```

### Base de Datos
```bash
npm run backup:db   # Respaldar base de datos
npm run db:connect  # Conectar a CLI de PostgreSQL
```

### Limpieza
```bash
npm run clean       # Limpiar contenedores
npm run clean:data  # Limpiar todos los volúmenes
npm run fresh:clean # Instalación completamente limpia
```

## 📁 Estructura del Proyecto

```
n8nAutomatizaciones/
├── flows/                          # Flujos de n8n
│   ├── Barberia/                   # Flujos para barbería
│   │   ├── Barberia.json          # Flujo principal
│   │   └── promtAgenteBarberia.md # Prompt especializado
│   └── ejemploDeepseekGoggleCalendar/ # Ejemplos de integración
├── data/                           # Volúmenes de datos
├── nginx.conf                      # Configuración Nginx producción
├── nginx.conf.local               # Configuración Nginx local
├── docker-compose.yml             # Configuración de servicios
├── .env                          # Variables de entorno
└── package.json                  # Scripts npm
```

## 🔐 Configuración de Variables de Entorno

Las variables principales en `.env`:

```bash
# Evolution API
AUTHENTICATION_API_KEY=tu_clave_api
SERVER_URL=http://localhost:8000

# Webhooks
WEBHOOK_URL=https://tu-ngrok.ngrok.io

# n8n
N8N_EDITOR_BASE_URL=http://localhost:5678

# PostgreSQL
POSTGRES_DB=n8n_db
POSTGRES_USER=admin
POSTGRES_PASSWORD=tu_password
```

## 🤖 Flujos Disponibles

### Barbería
- **Gestión de citas automatizada**
- **Agente IA especializado** en servicios de barbería
- **Integración con Google Calendar**
- **Confirmaciones automáticas** por WhatsApp

### Integración DeepSeek + Google Calendar
- **Ejemplos de configuración** IA + calendario
- **Plantillas reutilizables**

## 🌐 Configuración de Nginx

### 🔧 Ambiente Local (Desarrollo)

#### 1. Instalar Nginx (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install nginx
```

#### 2. Configurar host local
```bash
# Agregar entrada al archivo hosts
sudo echo "127.0.0.1 n8n.local" >> /etc/hosts
```

#### 3. Configurar Nginx
```bash
# Copiar configuración local
sudo cp nginx.conf.local /etc/nginx/sites-available/n8n-local

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/n8n-local /etc/nginx/sites-enabled/

# Verificar configuración
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

#### 4. Acceder localmente
- **URL**: http://n8n.local
- **n8n**: Se proxy hacia http://localhost:5678

### 🚀 Ambiente Producción (VPS)

#### 1. Preparar VPS
```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Nginx
sudo apt install nginx

# Instalar Certbot para SSL
sudo apt install certbot python3-certbot-nginx
```

#### 2. Configurar DNS
```bash
# Apuntar dominio a IP del VPS
# Ejemplo en proveedor DNS:
# A record: n8nflowautomat.com -> tu-ip-vps
# CNAME: www.n8nflowautomat.com -> n8nflowautomat.com
```

#### 3. Configurar Nginx para producción
```bash
# Copiar configuración de producción
sudo cp nginx.conf /etc/nginx/sites-available/n8n-production

# Editar dominio si es necesario
sudo nano /etc/nginx/sites-available/n8n-production
# Cambiar: server_name n8nflowautomat.com;

# Crear enlace simbólico
sudo ln -s /etc/nginx/sites-available/n8n-production /etc/nginx/sites-enabled/

# Desactivar sitio por defecto
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t
```

#### 4. Obtener certificados SSL
```bash
# Generar certificados SSL con Let's Encrypt
sudo certbot --nginx -d n8nflowautomat.com -d www.n8nflowautomat.com

# Verificar auto-renovación
sudo certbot renew --dry-run
```

#### 5. Configurar firewall
```bash
# Permitir tráfico HTTP/HTTPS
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw enable

# Verificar estado
sudo ufw status
```

#### 6. Reiniciar servicios
```bash
# Reiniciar Nginx
sudo systemctl restart nginx

# Verificar estado
sudo systemctl status nginx

# Iniciar servicios Docker
npm run start
```

### 📋 Configuraciones de Nginx

#### nginx.conf.local (Desarrollo)
```nginx
server {
    listen 80;
    server_name n8n.local;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Soporte WebSockets para n8n
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

#### nginx.conf (Producción)
```nginx
# HTTP (redirige a HTTPS)
server {
    listen 80;
    server_name n8nflowautomat.com;
    return 301 https://$server_name$request_uri;
}

# HTTPS
server {
    listen 443 ssl;
    server_name n8nflowautomat.com;

    ssl_certificate /etc/letsencrypt/live/n8nflowautomat.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/n8nflowautomat.com/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:5678;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Soporte WebSockets
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

### Variables de Producción
```bash
cp .env.prod .env
# Configurar URLs de producción
```

## 🔧 Desarrollo

### Añadir Nuevos Flujos
1. Crear directorio en `flows/NuevoProyecto/`
2. Exportar flujo desde n8n como JSON
3. Documentar prompts en archivo `.md`

### Personalizar Agente IA
1. Editar prompts en archivos `.md`
2. Configurar endpoints DeepSeek
3. Probar respuestas en n8n

## 🐛 Solución de Problemas

### Servicios no inician
```bash
npm run clean
npm run dev:fresh
```

### Problemas de permisos
```bash
sudo chown -R $USER:$USER ./data
```

### Logs de depuración
```bash
npm run logs:n8n
# Revisar errores específicos
```

## 📞 Soporte

- **Issues**: [GitHub Issues](enlace-a-issues)
- **Documentación**: Ver archivos en `/flows/`
- **Configuración**: Revisar `CLAUDE.md`

## 📄 Licencia

MIT License - Ver [LICENSE](LICENSE) para más detalles.

## 🤝 Contribuir

1. Fork del proyecto
2. Crear rama feature (`git checkout -b feature/nueva-funcionalidad`)
3. Commit cambios (`git commit -m 'Añadir nueva funcionalidad'`)
4. Push a la rama (`git push origin feature/nueva-funcionalidad`)
5. Abrir Pull Request

---

**Desarrollado por**: Kike
**Versión**: 1.0.0
**Stack**: n8n, Docker, PostgreSQL, Evolution API, DeepSeek AI, Nginx
# 🚀 Backend API - Sistema SaaS de Agendamiento

Backend Node.js para sistema SaaS multi-tenant de automatización de agendamiento con integración multi-canal.

## 📋 Características

- 🏢 **Multi-tenant** con aislamiento completo de datos
- 🔐 **Autenticación JWT** con middleware de tenant
- 🗄️ **PostgreSQL nativo** con consultas SQL optimizadas
- 📱 **Integración multi-canal** (WhatsApp, Telegram, SMS, etc.)
- 🤖 **Integración n8n** para automatización
- 📊 **APIs RESTful** con documentación Swagger
- 🧪 **Tests automatizados** con Jest
- 📈 **Logging estructurado** con Winston

## 🏗️ Arquitectura

```
src/
├── config/           # Configuración de BD, JWT, etc.
├── database/         # Pool de conexiones y queries
├── controllers/      # Lógica de controladores
├── services/         # Lógica de negocio
├── middleware/       # Auth, tenant, validación
├── routes/           # Definición de rutas API
├── utils/            # Utilidades generales
└── validators/       # Schemas de validación
```

## 🚀 Inicio Rápido

### 1. Instalar dependencias
```bash
npm install
```

### 2. Configurar variables de entorno
```bash
cp .env.example .env
# Editar .env con tus valores
```

### 3. Ejecutar en desarrollo
```bash
npm run dev
```

### 4. Ejecutar tests
```bash
npm test
```

## 📚 API Endpoints

### Autenticación
- `POST /api/v1/auth/login` - Login
- `POST /api/v1/auth/register` - Registro
- `GET /api/v1/auth/me` - Info usuario

### Citas
- `GET /api/v1/citas` - Listar citas
- `POST /api/v1/citas` - Crear cita
- `GET /api/v1/citas/:id` - Obtener cita
- `PUT /api/v1/citas/:id` - Actualizar cita

### Clientes
- `GET /api/v1/clientes` - Listar clientes
- `POST /api/v1/clientes` - Crear cliente
- `GET /api/v1/clientes/buscar` - Buscar por teléfono

### Disponibilidad
- `GET /api/v1/disponibilidad` - Consultar disponibilidad
- `POST /api/v1/disponibilidad/reservar` - Reservar franja

## 🔧 Scripts Disponibles

- `npm start` - Producción
- `npm run dev` - Desarrollo con nodemon
- `npm test` - Tests
- `npm run test:coverage` - Tests con coverage
- `npm run db:migrate` - Migraciones
- `npm run docs` - Generar documentación

## 🌐 Estructura Multi-Tenant

El sistema usa **Row Level Security (RLS)** para aislamiento automático:

```javascript
// Cada request configura el tenant automáticamente
await db.query('SET app.current_tenant_id = $1', [organizacion_id]);
```

## 📖 Documentación

- **Swagger UI**: `http://localhost:3000/api-docs`
- **Documentación técnica**: `./docs/`
- **Base de datos**: `../docs_base_datos_saas.md`
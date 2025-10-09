# Colección Bruno - SaaS Agendamiento API

Colección organizada por **flujos de negocio** para probar la API de forma coherente y secuencial.

## 📋 Estructura de Flujos

La colección está organizada por **orden del journey del cliente**, desde el registro inicial hasta las operaciones avanzadas:

### 1. 🏢 Onboarding - Auto-Registro (FLUJO INICIAL)
**Punto de entrada para clientes nuevos** - Auto-registro público sin intervención manual.
- **6 requests**: **Registro (público)** → Login (opcional) → Crear Profesional → Crear Servicio → Configurar Horarios → Verificar Setup
- **Endpoint clave**: `POST /api/v1/organizaciones/register` (sin autenticación)
- **Auth**: Token generado automáticamente en el registro (auto-login)
- **Variables guardadas**: `token`, `organizacionId`, `userId`, `profesionalId`, `servicioId`, `horarioId`
- **Características**:
  - ✅ Self-service signup (cliente se registra solo)
  - ✅ Crea organización + usuario admin + subscripción activa
  - ✅ Auto-login con JWT token
  - ✅ Plantillas de servicios según industria (opcional)
  - ✅ Rate limiting: 3 registros/15 min por IP
  - ✅ Patrón SaaS estándar (como Stripe, Slack, Shopify)
- **Propósito**: Llevar una organización de **0% → 100% operativa** sin intervención manual

---

### 2. 👥 Catálogo de Servicios
Gestión de profesionales y servicios de la organización (configuración post-onboarding).
- **5 requests**: Crear Profesional → Listar Profesionales → Crear Servicio → Listar Servicios → Ver Servicios de Profesional
- **Auth**: Bearer Token (del registro o login)
- **Variables guardadas**: `profesionalId`, `servicioId`
- **Características**:
  - Asociación automática de servicios a profesionales
  - Gestión de especialidades
  - Validación de precios y duraciones

---

### 3. 📆 Agendamiento Manual
Flujo completo de agendamiento desde el panel administrativo.
- **5 requests**: Crear Cliente → Verificar Disponibilidad → Crear Cita → Actualizar Estado → Cancelar Cita
- **Auth**: Bearer Token
- **Variables guardadas**: `clienteId`, `citaId`, `codigoCita`
- **Características**:
  - Código de cita auto-generado (formato: ORG001-20251008-001)
  - Prevención de double-booking
  - Estados de cita: pendiente → confirmada → en_curso → completada
  - **IMPORTANTE**: NO enviar `codigo_cita` al crear (auto-generado por trigger)

---

### 4. 🤖 Agendamiento IA WhatsApp
Endpoints para el sistema de IA conversacional (n8n + Evolution API).
- **6 requests**: Buscar Cliente → Crear Cliente WhatsApp → Consultar Disponibilidad → Crear Cita Automática → Modificar Cita → Cancelar Cita
- **Auth**: **SIN AUTENTICACIÓN** (validación por `organizacion_id`)
- **Variables guardadas**: `clienteId`, `codigoCita`
- **Características especiales**:
  - Todos los endpoints incluyen `organizacion_id` en body o query params
  - Endpoints exclusivos: `/api/v1/citas/automatica`
  - Flag `via_whatsapp: true` para identificar origen
  - Uso exclusivo de workflows n8n
  - RLS asegura aislamiento de datos

---

### 5. 🔐 Autenticación
Flujo de autenticación para **usuarios existentes** (login/logout/refresh).
- **4 requests**: Registro → Login → Refresh Token → Logout
- **Auth**: No requiere (excepto Logout)
- **Variables guardadas**: `token`, `refreshToken`, `userId`, `organizacionId`
- **Nota**: Para **nuevos clientes**, usar el flujo **1. Onboarding** en su lugar

## 🚀 Cómo usar

### 1. Seleccionar Environment

Selecciona el environment apropiado:
- **Local**: Desarrollo local (Node.js directo)
- **Docker**: Contenedores Docker
- **Production**: Producción (cuando esté desplegado)

### 2. Ejecutar Flujos Secuencialmente

**Para una nueva organización (Self-Service Signup)** ⭐ RECOMENDADO:
1. Ejecuta **`1. Onboarding - Auto-Registro > 1. Registro`** (público, sin auth)
   - Crea la organización automáticamente
   - Genera token y lo guarda en variables
   - ¡Ya estás logueado! Continúa con el paso 2
2. (Opcional) Ejecuta el resto del flujo **1. Onboarding** para configurar todo
   - 3. Crear Primer Profesional → 4. Crear Primer Servicio → 5. Configurar Horarios → 6. Verificar Setup
3. Ahora puedes usar cualquier otro flujo (2, 3, 4)

**Para testing rápido (organización existente)**:
1. Ejecuta solo `5. Autenticación > 2. Login` con credenciales existentes
2. Los tokens se guardarán y podrás usar cualquier endpoint

**Flujo recomendado para nuevos clientes**:
```
POST /organizaciones/register (público)
  ↓ (auto-login con token)
POST /profesionales
  ↓
POST /servicios
  ↓
POST /horarios/profesionales
  ↓
GET /organizaciones/:id (verificar setup completo)
```

### 3. Variables Automáticas

Los requests guardan automáticamente variables importantes:
- `token`: JWT access token (automático después del login)
- `refreshToken`: JWT refresh token
- `organizacionId`: ID de la organización activa
- `userId`: ID del usuario logueado
- `profesionalId`: Último profesional creado
- `servicioId`: Último servicio creado
- `clienteId`: Último cliente creado
- `citaId`: Última cita creada
- `codigoCita`: Código único de la última cita

## 📝 Notas Importantes

### Headers Automáticos

Todos los requests (excepto autenticación) incluyen automáticamente:
```
Authorization: Bearer {{token}}
```

Los endpoints para **super_admin** pueden incluir opcionalmente:
```
X-Organization-Id: {{organizacionId}}
```

### Patrones de Bruno

**Scripts para guardar variables**:
```javascript
// En la pestaña "Tests" de cada request
if (res.status === 200 || res.status === 201) {
  bru.setEnvVar("token", res.body.data.token);
  bru.setEnvVar("organizacionId", res.body.data.organizacion_id);
}
```

**Headers con variables**:
```
Authorization: Bearer {{token}}
X-Organization-Id: {{organizacionId}}
```

## 🔍 Troubleshooting

### Error 401 Unauthorized
- Verifica que el token esté guardado en las variables del environment
- Ejecuta nuevamente el login

### Error 403 Forbidden
- Tu rol no tiene permisos para esta acción
- Verifica el rol del usuario en `5. Autenticación > 2. Login` (respuesta incluye `rol`)

### Error 404 Not Found
- Verifica que las variables (profesionalId, servicioId, etc.) estén guardadas
- Ejecuta primero el flujo de creación correspondiente

## 🎯 Testing de Roles RBAC

Para probar diferentes roles, crea usuarios con roles distintos (cuando esté implementado el flujo de Administración) y luego:
1. Logout (`5. Autenticación > 4. Logout`)
2. Login con el nuevo usuario (`5. Autenticación > 2. Login`)
3. Intenta ejecutar operaciones (algunos deberían fallar según el rol)

**Roles disponibles**:
- `super_admin`: Acceso total a todas las organizaciones
- `propietario`: Acceso total a su organización
- `administrador`: Operaciones + lectura
- `usuario`: Operaciones básicas
- `solo_lectura`: Solo consultas

## 🔑 Diferencias Clave entre Flujos

### Agendamiento Manual (Flujo 3) vs IA WhatsApp (Flujo 4)

| Aspecto | Manual | IA WhatsApp |
|---------|--------|-------------|
| **Autenticación** | Bearer Token (JWT) | Sin auth (organizacion_id) |
| **Iniciador** | Staff de la organización | Cliente final |
| **Interfaz** | Panel administrativo | Conversación WhatsApp |
| **Endpoints** | `/api/v1/citas` | `/api/v1/citas/automatica` |
| **Validación** | Middleware auth + tenant | organizacion_id en payload |
| **Uso** | CRUD completo | Creación/modificación limitada |

### Códigos de Cita Auto-generados

Todos los flujos de agendamiento (Manual y IA) generan códigos únicos automáticamente:

```
Formato: ORG001-20251008-001
         │     │        └─ Secuencial del día
         │     └────────── Fecha YYYYMMDD
         └──────────────── Código de organización
```

**IMPORTANTE**: NUNCA enviar `codigo_cita` en el body al crear una cita. El trigger de base de datos lo genera automáticamente.

---

## 📚 API Reference

Referencia rápida de todos los endpoints disponibles en la API.

### 📍 Base URL

- **Local/Docker**: `http://localhost:3000`
- **Production**: `https://api.tudominio.com`

### 🏢 Flujo 1: Onboarding - Auto-Registro

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/organizaciones/register` | ❌ No | Auto-registro público (org + admin + token) |
| POST | `/api/v1/auth/login` | ❌ No | Login opcional (ya viene token del registro) |
| POST | `/api/v1/profesionales` | ✅ Bearer | Crear primer profesional |
| POST | `/api/v1/servicios` | ✅ Bearer | Crear primer servicio |
| POST | `/api/v1/horarios/profesionales` | ✅ Bearer | Configurar horarios |
| GET | `/api/v1/organizaciones/:id` | ✅ Bearer | Verificar setup completo |

**📖 Ver detalles**: `1. Onboarding - Auto-Registro/README.md`

### 👥 Flujo 2: Catálogo de Servicios

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/profesionales` | ✅ Bearer | Crear profesional |
| GET | `/api/v1/profesionales` | ✅ Bearer | Listar profesionales |
| GET | `/api/v1/profesionales/:id` | ✅ Bearer | Ver detalle profesional |
| PUT | `/api/v1/profesionales/:id` | ✅ Bearer | Actualizar profesional |
| DELETE | `/api/v1/profesionales/:id` | ✅ Bearer | Eliminar profesional |
| POST | `/api/v1/servicios` | ✅ Bearer | Crear servicio + asociar profesionales |
| GET | `/api/v1/servicios` | ✅ Bearer | Listar servicios |
| GET | `/api/v1/servicios/:id` | ✅ Bearer | Ver detalle servicio |
| PUT | `/api/v1/servicios/:id` | ✅ Bearer | Actualizar servicio |
| DELETE | `/api/v1/servicios/:id` | ✅ Bearer | Eliminar servicio |
| GET | `/api/v1/servicios/profesionales/:profesional_id/servicios` | ✅ Bearer | Servicios de profesional |

### 📆 Flujo 3: Agendamiento Manual

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/clientes` | ✅ Bearer | Crear cliente |
| GET | `/api/v1/clientes` | ✅ Bearer | Listar clientes |
| GET | `/api/v1/clientes/:id` | ✅ Bearer | Ver detalle cliente |
| PUT | `/api/v1/clientes/:id` | ✅ Bearer | Actualizar cliente |
| GET | `/api/v1/citas/disponibilidad` | ✅ Bearer | Consultar slots disponibles |
| POST | `/api/v1/citas` | ✅ Bearer | Crear cita (código auto-generado) |
| GET | `/api/v1/citas` | ✅ Bearer | Listar citas |
| GET | `/api/v1/citas/:id` | ✅ Bearer | Ver detalle cita |
| PUT | `/api/v1/citas/:id` | ✅ Bearer | Actualizar cita |
| PATCH | `/api/v1/citas/:codigo/estado` | ✅ Bearer | Cambiar estado cita |
| DELETE | `/api/v1/citas/:codigo` | ✅ Bearer | Cancelar cita |

### 🤖 Flujo 4: Agendamiento IA WhatsApp

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| GET | `/api/v1/clientes/buscar-telefono` | ❌ No | Buscar cliente (+ `organizacion_id` query) |
| POST | `/api/v1/clientes` | ❌ No | Crear cliente (+ `organizacion_id` body) |
| GET | `/api/v1/citas/disponibilidad` | ❌ No | Consultar disponibilidad (+ `organizacion_id` query) |
| POST | `/api/v1/citas/automatica` | ❌ No | Crear cita vía IA (+ `organizacion_id` body) |
| PUT | `/api/v1/citas/automatica/:codigo` | ❌ No | Modificar cita (+ `organizacion_id` body) |
| DELETE | `/api/v1/citas/automatica/:codigo` | ❌ No | Cancelar cita (+ `organizacion_id` query) |

**Nota**: Todos los endpoints sin auth requieren `organizacion_id` en query o body.

### 🔐 Flujo 5: Autenticación

| Método | Endpoint | Auth | Descripción |
|--------|----------|------|-------------|
| POST | `/api/v1/auth/register` | ❌ No | Registro (requiere org existente) |
| POST | `/api/v1/auth/login` | ❌ No | Login (retorna token + refreshToken) |
| POST | `/api/v1/auth/refresh` | ❌ No | Renovar access token |
| POST | `/api/v1/auth/logout` | ✅ Bearer | Cerrar sesión |
| GET | `/api/v1/auth/me` | ✅ Bearer | Info del usuario logueado |
| PUT | `/api/v1/auth/profile` | ✅ Bearer | Actualizar perfil |
| POST | `/api/v1/auth/change-password` | ✅ Bearer | Cambiar contraseña |

### 📊 Formatos de Respuesta

**Success (200, 201)**:
```json
{
  "success": true,
  "data": { ... },
  "message": "Operación exitosa"
}
```

**Error (4xx, 5xx)**:
```json
{
  "success": false,
  "message": "Descripción del error",
  "errors": [
    {
      "field": "email",
      "message": "El email ya está registrado"
    }
  ]
}
```

### ⚠️ Códigos de Error

| Código | Significado | Causa Común |
|--------|-------------|-------------|
| 400 | Bad Request | Body inválido, parámetros faltantes |
| 401 | Unauthorized | Token expirado o inválido |
| 403 | Forbidden | Rol sin permisos (RBAC) |
| 404 | Not Found | Recurso no existe |
| 409 | Conflict | Email/teléfono duplicado |
| 422 | Validation Error | Joi schema violation |
| 500 | Server Error | Error interno (ver logs) |

### 🔑 Query Parameters Comunes

```
?organizacion_id=X              → Para endpoints sin auth (Flujo 4)
?profesional_id=X               → Filtrar por profesional
?servicio_id=Y                  → Filtrar por servicio
?fecha=YYYY-MM-DD               → Filtrar por fecha
?telefono=+5491112345678        → Buscar por teléfono
?activo=true                    → Filtrar activos
```

### 📅 Formato de Fechas

- **Query params**: `YYYY-MM-DD` (ej: `2025-10-15`)
- **Body (timestamps)**: ISO 8601 (ej: `2025-10-15T10:00:00-03:00`)

### 🔐 Autenticación

**Bearer Token (Flujos 1-3, 5)**:
```
Authorization: Bearer {token}
```

**Sin Autenticación (Flujo 4 - IA WhatsApp)**:
Incluir `organizacion_id` en query o body.

### 📝 Notas Técnicas

**RLS (Row Level Security)**:
- Todos los endpoints autenticados usan RLS automático
- No es necesario filtrar por `organizacion_id` en queries

**Código de Cita Auto-generado**:
- **NUNCA** enviar `codigo_cita` al crear cita
- Formato: `ORG001-20251008-001`

**Estados de Cita**:
`pendiente` → `confirmada` → `en_curso` → `completada`

También posibles: `cancelada`, `no_asistio`

---

## 📊 Estado del Proyecto

- **Backend**: Production Ready ✅
- **Tests**: 464/464 passing (100%) ✅
- **Multi-tenant**: RLS activo ✅
- **IA WhatsApp**: Operativo ✅
- **Self-Service Signup**: Implementado ✅
- **Colección Bruno**: 5 flujos organizados
  - ✅ **Flujo 1**: Onboarding - Auto-Registro (público)
  - ✅ **Flujo 2**: Catálogo de Servicios
  - ✅ **Flujo 3**: Agendamiento Manual
  - ✅ **Flujo 4**: Agendamiento IA WhatsApp
  - ✅ **Flujo 5**: Autenticación

## 📝 Flujos Futuros (Expansión)

- **Flujo 6**: Gestión Avanzada de Horarios
- **Flujo 7**: Gestión de Clientes
- **Flujo 8**: Administración y RBAC
- **Flujo 9**: Reportes y Métricas
- **Flujo 10**: Configuración de Organización

---

**Versión**: 1.0
**Última actualización**: 08 Octubre 2025

# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 18 Noviembre 2025

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend API** | ✅ Operativo | 26 controllers (incluye marketplace), RLS multi-tenant |
| **Frontend React** | ✅ Operativo | React 18 + Vite 7, 15 hooks personalizados (incluye marketplace) |
| **Base de Datos** | ✅ Optimizada | 29 tablas (2 particionadas), RLS reforzado |
| **Sistema Comisiones** | ✅ Operativo | Trigger automático, 12 endpoints, Dashboard + Reportes |
| **Marketplace** | 🟢 98% Completo | Backend ✅ + Frontend ✅ (Agendamiento Público con disponibilidad real-time) |
| **Sistema IA** | ✅ Operativo | Telegram + WhatsApp, prevención de alucinaciones |
| **Suscripciones MP** | ✅ Operativo | Trial 14 días + Checkout Pro |
| **Sistema Email** | ✅ Operativo | AWS SES + nodemailer, templates HTML |
| **Deployment** | ✅ Listo | Hostinger VPS + Docker Compose |

---

## 🛠 Stack Técnico

### Frontend
- React 18 + Vite 7 + Tailwind CSS 3
- Zustand (2 stores) + TanStack Query
- React Hook Form + Zod
- Axios (auto-refresh JWT)

### Backend
- Node.js + Express.js
- JWT (1h access + 7d refresh)
- Joi schemas + Winston logs
- Jest + Supertest (29 test suites)

### Base de Datos
- PostgreSQL 17 con **pg_cron** (Dockerfile personalizado)
- **Particionamiento por Fecha** (Range en `citas` y `eventos_sistema`)
- Row Level Security (37 políticas: 29 core + 8 marketplace)
- 293 índices + 29 triggers + 51 funciones PL/pgSQL
- 4 jobs automáticos pg_cron

### IA Conversacional
- n8n workflows + Telegram Bot API + WhatsApp Business Cloud API
- DeepSeek Chat + PostgreSQL Chat Memory (RLS) + Redis Anti-flood
- MCP Server (6 tools) + JWT multi-tenant

---

## 📝 Comandos Esenciales

### Desarrollo
```bash
npm run dev              # Levantar stack completo (8 contenedores)
npm run logs             # Ver logs en tiempo real
npm run test:backend     # Ejecutar 602 tests
npm run status           # Estado de contenedores
npm run clean            # Limpiar todo
```

### Producción
```bash
bash deploy.sh deploy    # Deployment VPS completo
bash deploy.sh update    # Git pull + rebuild + restart
bash deploy.sh backup    # Backup PostgreSQL
```

---

## 🏗 Arquitectura

### Backend - Módulos Principales

**Core (5):** auth, usuarios, organizaciones, planes, subscripciones
**Negocio (7):** profesionales, servicios, clientes, horarios-profesionales, tipos-profesional, tipos-bloqueo
**Operaciones (4):** citas (modular), bloqueos-horarios, disponibilidad, comisiones
**Marketplace (1):** perfiles, reseñas, analytics (GDPR-compliant) 🆕
**Pagos (2):** webhooks, pagos (Mercado Pago)
**IA (1):** chatbots (Telegram/WhatsApp)
**Admin (1):** superadmin (gestión global + sync MP)

**Arquitectura Modular de Citas:**
- **3 Controllers**: base, operacional (confirmar/cancelar/reagendar), recordatorios (+ 1 index proxy)
- **7 Archivos de Models**: base, operacional, recordatorios, helpers, cita-servicio, cita-servicio.queries, index

### Middleware Stack (7 middlewares)

**Orden obligatorio (Requests Autenticados)**:
`auth.authenticateToken` → `tenant.setTenantContext` → **`subscription`** → `rateLimiting` → `validation` → `asyncHandler`

**Orden para Requests Públicos (API Marketplace)**:
`auth.optionalAuth` → `tenant.setTenantContextFromQuery` → `rateLimiting` → `validation` → `asyncHandler`

**Middlewares Disponibles:**
- `auth.js` - JWT + verificación roles + **optionalAuth** (permite requests sin token)
- `tenant.js` - RLS context multi-tenant
  - `setTenantContext` - Extrae organizacionId de JWT (requests autenticados)
  - **`setTenantContextFromQuery`** 🆕 - Extrae organizacion_id de query params (requests públicos)
- **`subscription.js`** - **Validación límites del plan** (profesionales, servicios, citas)
- `rateLimiting.js` - Rate limiting por rol
- `validation.js` - Joi schemas
- `asyncHandler.js` - Manejo async/await

**⚠️ CRÍTICO**: Todos los middlewares creados en archivos individuales DEBEN estar exportados en `middleware/index.js`

### Servicios (12 archivos)

**Principales (9):**
- `mercadopago.service.js` - Integración completa MP (suscripciones + planes + sync)
- `emailService.js` - Envío emails transaccionales (AWS SES + nodemailer)
- `n8nService.js` - Workflows n8n
- `n8nCredentialService.js` - Credenciales chatbots
- `n8nGlobalCredentialsService.js` - Credenciales DeepSeek
- `n8nMcpCredentialsService.js` - Credenciales MCP server
- `tokenBlacklistService.js` - Blacklist JWT
- `configService.js` - Configuración sistema
- `platformValidators/` (subcarpeta con 2 validadores)

**Email (3 archivos adicionales):**
- `email/transporter.js` - Singleton nodemailer con pool
- `email/templates/passwordReset.js` - Template HTML recuperación

### Utilidades Críticas

**`rlsContextManager.js` (v2.0)** - **USAR SIEMPRE** para queries multi-tenant
- `RLSContextManager.query(orgId, async (db) => {...})`
- `RLSContextManager.transaction(orgId, async (db) => {...})`
- `RLSContextManager.withBypass(async (db) => {...})` - Para JOINs multi-tabla

**`helpers.js` - 8 Clases Helper:**
1. ResponseHelper
2. ValidationHelper
3. DateHelper
4. CodeGenerator
5. SanitizeHelper
6. PaginationHelper
7. ErrorHelper
8. OrganizacionHelper

---

### Frontend

**Estructura:**
- **15 Hooks personalizados** para gestión de estado (TanStack Query)
- **80+ Componentes** organizados por módulo (ui, dashboard, citas, clientes, comisiones, marketplace, etc.)
- **31 Páginas** con routing protegido por rol (incluye 3 comisiones + 3 marketplace)
- **Onboarding de 3 pasos** (negocio → plan → cuenta admin)

**Componentes Clave:**
- `SetupChecklist.jsx` - Guía configuración inicial (auto-oculta al completar)
- `TrialStatusWidget.jsx` - Trial counter + activación MP
- `CitaFormModal.jsx` - Creación/edición con múltiples servicios
- `BloqueoFormModal.jsx` - Gestión bloqueos con validación bidireccional
- `ConfigurarChatbotModal.jsx` - Config Telegram/WhatsApp

---

### Base de Datos

**29 Tablas Principales:**

| Categoría | Tablas |
|-----------|--------|
| **Core** | organizaciones, usuarios, planes_subscripcion |
| **Catálogos** | tipos_profesional, tipos_bloqueo, marketplace_categorias |
| **Negocio** | profesionales, servicios, clientes, servicios_profesionales, horarios_profesionales |
| **Operaciones** | citas ⚡, citas_servicios, bloqueos_horarios, metricas_uso_organizacion |
| **Comisiones** | configuracion_comisiones, comisiones_profesionales, historial_configuracion_comisiones |
| **Marketplace** 🆕 | marketplace_perfiles, marketplace_reseñas, marketplace_analytics |
| **Chatbots** | chatbot_config, chatbot_credentials |
| **Pagos MP** | subscripciones, historial_subscripciones, metodos_pago, pagos |
| **Sistema** | eventos_sistema ⚡, eventos_sistema_archivo, configuracion_sistema |

**⚡ Particionamiento:**
- **citas** por `fecha_cita` (mensual) - Mejora 10x+ queries históricas
- **eventos_sistema** por `creado_en` (mensual) - Mejora 100x+ queries antiguas
- Gestión automática con pg_cron (4 jobs: mantenimiento, archivado, vacuum)

**Catálogos Dinámicos:**
- **33 tipos profesional** organizados por 11 industrias + custom
- **9 tipos bloqueo** (vacaciones, feriado, mantenimiento, etc.) + custom

**ENUMs:**
- `rol_usuario`: super_admin, admin, propietario, empleado, cliente, bot
- `estado_cita`: pendiente, confirmada, en_curso, completada, cancelada, no_asistio

---

## 🤖 Sistema de Chatbots IA

### Plataformas Soportadas
- **Telegram Bot API** - BotFather token-based
- **WhatsApp Business Cloud API** - Meta Graph API v18.0

### MCP Server - 6 Tools
1. `listarServicios` - Catálogo con precios
2. **`verificarDisponibilidad`** - Horarios libres + **`excluir_cita_id`** para reagendamiento
3. `buscarCliente` - Por teléfono o nombre
4. `buscarCitasCliente` - Historial para reagendamiento
5. `crearCita` - Creación validada (múltiples servicios)
6. `reagendarCita` - Modificar citas existentes

### Características Críticas
- ✅ **Prevención de alucinaciones**: System prompt obliga a verificar disponibilidad real antes de sugerir horarios
- ✅ **Reagendamiento inteligente**: Parámetro `excluir_cita_id` evita auto-bloqueo de citas
- ✅ System Prompt agnóstico de industria
- ✅ Multi-tenant seguro (JWT + RLS + Chat Memory separada)
- ✅ Anti-flood Redis (20s)
- ✅ Multi-plataforma (Telegram + WhatsApp)

### Arquitectura Chat Memory
- **Base de datos separada**: `chat_memories_db` (independiente de workflows)
- **Tabla**: `n8n_chat_histories` - Preserva conversaciones incluso tras eliminar workflows
- **Persistencia**: Historial completo por cliente + organización con RLS
- **Eliminación workflows**: Solo borra ejecuciones técnicas, NO conversaciones

**Acceso**: Rol `admin` o `propietario` | **URL**: `/chatbots`

---

## 📧 Sistema de Emails Transaccionales

### Proveedor y Stack
- **Producción**: AWS SES (us-east-1) - $0.10/1,000 emails (primeros 62k gratis)
- **Desarrollo**: Gmail SMTP (localhost)
- **Librería**: nodemailer con pool de conexiones
- **Templates**: HTML responsivos con alternativa plain text

### Configuración por Entorno

**Variables SMTP (en docker-compose):**
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`
- `FRONTEND_URL` - **Crítico** para construir URLs en emails

**Archivos .env:**
- `.env.dev` y `.env.prod.local` → Gmail (localhost)
- `.env.prod` → AWS SES (VPS producción)

### Emails Implementados
1. **Recuperación de contraseña** - Template HTML con link 1h expiración
   - Remitente: `SaaS Agendamiento <noreply@n8nflowautomat.com>`
   - Ruta: `/auth/reset-password/:token`
   - Servicio: `emailService.enviarRecuperacionPassword()`

### Hosting (Hostinger VPS)
- ✅ Puerto 587 abierto por defecto (STARTTLS)
- ✅ Puerto 465 disponible (SSL/TLS alternativa)
- ⚠️ Puerto 25 limitado a 5 emails/min (no usar)

**Nota**: Configuración de AWS SES requiere validación de dominio DNS y credenciales IAM

---

## 🔄 Validación de Disponibilidad y Reagendamiento

### Algoritmo de Solapamiento
**Función crítica**: `haySolapamientoHorario(inicio1, fin1, inicio2, fin2)`
```javascript
// Algoritmo: i1 < f2 && f1 > i2
// ⚠️ IMPORTANTE: Touching borders (14:00 == 14:00) NO se consideran solapamiento
```
**Ubicación**: `backend/app/utils/cita-validacion.util.js`

### Validación Bidireccional
**Crear Bloqueo** → Valida contra citas existentes (pendiente/confirmada)
- Error 409 si hay conflicto con mensaje formateado en español
- Formato: `• CODIGO - Cliente el DD/MM/YYYY de HH:MM a HH:MM`
- **Ubicación**: `backend/app/database/bloqueos-horarios.model.js`

**Crear Cita** → Valida contra bloqueos existentes
- Rechaza si hay solapamiento con bloqueo activo
- **Ubicación**: `backend/app/database/cita.operacional.model.js`

### Parámetro `excluir_cita_id` (Reagendamiento)
**Problema resuelto**: Al reagendar, la cita actual bloqueaba los slots que se iban a liberar.

**Solución**: Parámetro opcional en `verificarDisponibilidad`:
- **Schema**: `disponibilidad.schemas.js` - Validación Joi
- **Controller**: `disponibilidad.controller.js` - Pasa parámetro al model
- **Model**: `disponibilidad.model.js` - Filtra cita excluida del análisis
- **MCP Tool**: `verificarDisponibilidad.js` - Acepta y pasa parámetro
- **System Prompt**: Instruye al chatbot a SIEMPRE usarlo al reagendar

**Uso en Chatbot**:
```javascript
verificarDisponibilidad({
  servicios_ids: [1, 2],
  fecha: "15/11/2025",
  hora: "14:00",
  excluir_cita_id: 123  // ⚠️ CRÍTICO - ID de la cita que se está reagendando
})
```

---

## 🌐 API Pública para Marketplace (Nov 2025)

### Contexto Multi-Tenant sin Autenticación

**Problema**: El marketplace público necesita acceder a datos de organizaciones sin requerir autenticación del usuario.

**Solución**: Middleware `setTenantContextFromQuery` que establece contexto RLS desde parámetros de query.

### Middleware Crítico: `setTenantContextFromQuery`

**Ubicación**: `backend/app/middleware/tenant.js` (líneas 459-537)

**Funcionalidad**:
1. Extrae `organizacion_id` de query parameters
2. Valida que la organización existe y está activa
3. Establece contexto RLS usando `set_config('app.bypass_rls', 'true')`
4. Asigna `req.tenant.organizacionId` y `req.tenant.plan`
5. **Limpia bypass RLS** en finally para seguridad

**⚠️ CRÍTICO**: Este middleware DEBE estar exportado en `middleware/index.js` (línea 33):
```javascript
tenant: {
  setTenantContext: tenant.setTenantContext,
  setTenantContextFromQuery: tenant.setTenantContextFromQuery, // ← NECESARIO
  // ...
}
```

### Patrón de Middleware Condicional

**Ubicación**: `backend/app/routes/api/v1/disponibilidad.js`

```javascript
router.get(
  '/',
  auth.optionalAuth,  // ✅ Permite requests con y sin token
  (req, res, next) => {
    // Si está autenticado → usa tenant context normal
    if (req.user) {
      return tenant.setTenantContext(req, res, next);
    }
    // Si NO está autenticado → usa tenant context desde query
    else {
      return tenant.setTenantContextFromQuery(req, res, next);
    }
  },
  rateLimiting.apiRateLimit,
  validation.validate(disponibilidadSchemas.consultar),
  DisponibilidadController.consultar
);
```

### Soporte en Controller

**Ubicación**: `backend/app/controllers/disponibilidad.controller.js`

**Cambio clave**:
```javascript
static consultar = asyncHandler(async (req, res) => {
  // Detectar si es request público o autenticado
  const esPublico = !req.user;
  const rol = esPublico ? 'cliente' : req.user.rol;

  // Procesar servicios_ids (soporta array o número único)
  let servicioIdFinal = null;
  if (servicios_ids) {
    servicioIdFinal = Array.isArray(servicios_ids)
      ? parseInt(servicios_ids[0])
      : parseInt(servicios_ids);
  }
  // ...
});
```

### Transformación de Datos Frontend

**Ubicación**: `frontend/src/hooks/useMarketplace.js` (líneas 214-269)

**Problema**: Backend retorna estructura anidada, frontend espera estructura plana.

**Backend retorna**:
```javascript
{
  disponibilidad_por_fecha: [{
    fecha: "2025-11-25",
    profesionales: [{
      profesional_id: 1,
      slots: [{ hora: "09:00:00", disponible: true }]
    }]
  }]
}
```

**Frontend necesita**:
```javascript
{
  dias: [{
    fecha: "2025-11-25",
    slots_disponibles: [{ hora: "09:00", disponible: true }]
  }]
}
```

**Solución**: Hook `useDisponibilidadPublica` transforma automáticamente:
```javascript
export function useDisponibilidadPublica(organizacionId, params = {}) {
  return useQuery({
    queryKey: ['disponibilidad-publica', organizacionId, params],
    queryFn: async () => {
      const response = await marketplaceApi.consultarDisponibilidadPublica({
        organizacion_id: organizacionId,
        ...params
      });

      // Transformar respuesta
      return {
        ...backendData,
        dias: backendData.disponibilidad_por_fecha?.map((fecha) => ({
          fecha: fecha.fecha,
          slots_disponibles: fecha.profesionales?.flatMap((prof) =>
            prof.slots
              ?.filter((slot) => slot.disponible)
              .map((slot) => ({
                hora: slot.hora.substring(0, 5), // "09:00:00" -> "09:00"
                disponible: slot.disponible,
                profesional_id: prof.profesional_id,
              }))
          ),
        })),
      };
    },
    enabled: !!organizacionId && !!params.fecha &&
             Array.isArray(params.servicios_ids) && params.servicios_ids.length > 0,
  });
}
```

### Características Críticas

✅ **RLS Seguro**: Usa bypass temporal pero solo para validar organización activa
✅ **Rol cliente por defecto**: Requests públicos tienen permisos limitados
✅ **Validación dual**: Schema Joi acepta tanto `servicios_ids` (array) como `servicio_id` (single)
✅ **Limpieza automática**: Finally block garantiza que bypass RLS se desactiva
✅ **Cache inteligente**: React Query con staleTime 30s para reducir llamadas

### Troubleshooting

**Error: "tenant.setTenantContextFromQuery is not a function"**
- **Causa**: Middleware definido en tenant.js pero NO exportado en middleware/index.js
- **Solución**: Agregar a exports en middleware/index.js línea 33

**React Query no ejecuta**
- **Causa**: `enabled` condition incorrecta (arrays vacíos son truthy)
- **Solución**: Verificar longitud del array: `params.servicios_ids.length > 0`

**Slots muestran "0 min"**
- **Causa**: Backend puede retornar `duracion_minutos` o `duracion`
- **Solución**: Verificar ambos campos en componente

---

## 👑 Panel Super Administrador

**Acceso**: Rol `super_admin` | **URL**: `/superadmin/*` | **Setup**: `POST /api/v1/setup/create-superadmin`

**Funcionalidades:**
- Dashboard métricas globales
- Gestión organizaciones (suspender/reactivar/cambiar plan)
- Edición planes (precios/límites/estado)
- **Sincronización manual planes con Mercado Pago**

### Sincronización Planes MP
**Endpoint**: `POST /api/v1/superadmin/planes/sync-mercadopago`
- Verifica existencia en MP → asocia o crea nuevos
- UI con estado visual (sincronizado ✅ / no sincronizado ⚠️)

---

## 💳 Sistema de Suscripciones (Mercado Pago)

**Flujo**: Onboarding → Trial 14 días → Activación pago (Checkout Pro)

**Características:**
- ✅ Trial automático + contador en Dashboard
- ✅ Checkout Pro con `init_point` (sin `preapproval_plan_id`)
- ✅ Validación automática de límites en middleware `subscription`
- ✅ Sincronización manual desde Super Admin

---

## 💵 Sistema de Comisiones (NUEVO - Nov 2025)

**Estado**: ✅ **Sistema Completo y Operativo** (BD + Backend + Frontend)
**Validado**: 2 citas completadas con comisiones generadas automáticamente

### Funcionamiento

**Cálculo 100% Automático**: Trigger PostgreSQL `calcular_comision_cita()` se dispara cuando una cita cambia a estado `completada`. Calcula la comisión, genera detalle JSONB por servicio, e inserta en `comisiones_profesionales` con estado `pendiente`.

**Tipos de Comisión:**
- `porcentaje` - % del precio del servicio (0-100%)
- `monto_fijo` - Cantidad fija por cita
- `mixto` - Automático cuando cita tiene servicios con diferentes tipos

**Configuración (Prioridad):**
1. **Específica**: `servicio_id = X` → Solo ese servicio
2. **Global**: `servicio_id = NULL` → Todos los servicios del profesional (fallback)

### Endpoints Backend

```javascript
// Dashboard (3)
GET  /api/v1/comisiones/dashboard              // Métricas + gráficas
GET  /api/v1/comisiones/estadisticas           // Stats básicas
GET  /api/v1/comisiones/grafica/por-dia        // Datos Chart.js

// Configuración (4)
POST   /api/v1/comisiones/configuracion        // Crear/actualizar
GET    /api/v1/comisiones/configuracion        // Listar
DELETE /api/v1/comisiones/configuracion/:id    // Eliminar
GET    /api/v1/comisiones/configuracion/historial // Auditoría

// Consultas y Pagos (4)
GET   /api/v1/comisiones/profesional/:id       // Por profesional
GET   /api/v1/comisiones/periodo               // Por fechas (reportes)
PATCH /api/v1/comisiones/:id/pagar             // Marcar como pagada
GET   /api/v1/comisiones/:id                   // Detalle individual

// Reportes (1)
GET /api/v1/comisiones/reporte                 // Generar reporte
```

### Rutas Frontend

```javascript
/comisiones                   // Dashboard con Chart.js (Bar graph)
/comisiones/configuracion     // CRUD configuración por profesional/servicio
/comisiones/reportes          // Filtros + exportación CSV/JSON + detalle JSONB
```

**Acceso**: Rol `admin` o `propietario`

### Arquitectura

**Backend (11 archivos):**
```
controllers/comisiones/  → 3 controllers (configuracion, comisiones, estadisticas)
database/comisiones/     → 3 models (configuracion, comisiones, reportes)
routes/api/v1/comisiones.js
schemas/comisiones.schemas.js
__tests__/endpoints/comisiones.test.js
```

**Frontend (13 archivos):**
```
pages/comisiones/      → 3 páginas (Dashboard, Configuración, Reportes)
components/comisiones/ → 9 componentes (Modals, Tables, Filtros, Export)
hooks/useComisiones.js → 11 hooks TanStack Query
```

**Base de Datos:**
```
configuracion_comisiones            → Config por profesional/servicio
comisiones_profesionales            → Registro automático (FK compuesta a citas particionadas)
historial_configuracion_comisiones  → Auditoría de cambios
```

### Ejemplo Real (Validado)

```javascript
// Configuración: 15% global del profesional
// Cita completada: $150 (1 servicio)

// Comisión generada automáticamente:
{
  monto_base: 150.00,
  tipo_comision: "porcentaje",
  valor_comision: 15.00,
  monto_comision: 22.50,  // 150 * 0.15
  estado_pago: "pendiente",
  detalle_servicios: [{
    servicio_id: 1,
    nombre: "Corte",
    precio: 150.00,
    tipo_comision: "porcentaje",
    valor_comision: 15.00,
    comision_calculada: 22.50
  }]
}
```

### Características Críticas

- ✅ **Trigger automático** con bypass RLS para operaciones de sistema
- ✅ **JSONB `detalle_servicios`** con breakdown completo por servicio
- ✅ **RLS multi-tenant**: Admin ve todo, empleado solo sus comisiones
- ✅ **Índice GIN** en JSONB para búsquedas analíticas rápidas
- ✅ **Auditoría completa**: Historial de cambios con usuario modificador
- ✅ **Validación bidireccional**: Joi (backend) + Zod (frontend)
- ✅ **Anti-duplicados**: Trigger valida existencia antes de insertar

### Notas Importantes

- **NO usar `JSON.parse()`** en frontend: PostgreSQL JSONB ya retorna objetos parseados
- **Middleware `subscription`** en POST configuración: Valida límites del plan
- **Arquitectura modular**: Sigue patrón de `citas/` (3 controllers separados)
- **11 hooks TanStack Query** con sanitización de parámetros y cache inteligente

---

## 🛍️ Marketplace de Clientes (Nov 2025)

**Estado**: 🟢 **98% Completado** - Backend ✅ + Frontend ✅ (Todos los módulos funcionales)

### Funcionalidad

**Directorio Público SEO-optimizado** para que negocios publiquen su perfil y capturen clientes:
- ✅ Búsqueda por ciudad + categoría + rating
- ✅ Perfil público con servicios, profesionales, reseñas, ubicación
- ✅ **Agendamiento público con verificación de disponibilidad en tiempo real** (sin registro previo - crea cliente automáticamente)
- ✅ Sistema de reseñas 5 estrellas (solo clientes con cita `completada`)
- ✅ Analytics GDPR-compliant (IPs hasheadas SHA256)
- ✅ Panel Super Admin para gestión de perfiles marketplace

### Backend ✅ (100% Completo)

**15 Endpoints** (3 públicos + 12 privados):
```javascript
// Públicos (sin auth)
GET  /marketplace/perfiles/buscar              // Directorio con filtros
GET  /marketplace/perfiles/slug/:slug          // Perfil público
POST /marketplace/analytics                    // Tracking (fire-and-forget)

// Privados (admin/propietario)
POST/PUT /marketplace/perfiles                 // CRUD perfil
GET      /marketplace/perfiles/:id/estadisticas// Analytics del perfil
POST     /marketplace/resenas                  // Crear reseña (cliente)
POST/PATCH /marketplace/resenas/:id/...        // Responder/moderar (admin)

// Super Admin (pendiente frontend)
PATCH /marketplace/perfiles/:id/activar        // Activar/desactivar perfil
DELETE /marketplace/analytics/limpiar          // Limpiar analytics antiguos
```

**Arquitectura:** 3 controllers + 3 models + schemas Joi

### Frontend ✅ (98% Completado)

**Plan detallado:** `docs/PLAN_FRONTEND_MARKETPLACE.md`

**✅ Completado (5 de 5 flujos principales):**

1. **Panel Admin** (100%)
   - `MiMarketplacePage` - 3 tabs: Perfil, Reseñas, Analytics
   - `PerfilFormulario` - CRUD con modo Vista/Edición
   - `ListaReseñas` - Gestión de reseñas con respuestas y moderación
   - `AnalyticsDashboard` - Métricas de visibilidad
   - `CrearPerfilMarketplaceModal` - Wizard 3 pasos
   - `MarketplaceActivationCard` - CTA en Dashboard

2. **Directorio Público** (100%)
   - `DirectorioMarketplacePage` (`/marketplace`) - Hero + búsqueda + filtros
   - `DirectorioFiltros` - Sidebar sticky (ciudad, categoría, rating)
   - `DirectorioGrid` - Grid responsivo + paginación
   - `NegocioCard` - Tarjeta con imagen, rating, ubicación

3. **Perfil Público** (100%)
   - `PerfilPublicoPage` (`/:slug`) - Tabs: Servicios | Profesionales | Reseñas | Ubicación
   - `SEOHead` - Meta tags (Open Graph + Schema.org LocalBusiness)
   - `MapaUbicacion` - Google Maps embebido
   - `ReseñasSection` + `ReseñaCard` - Lista pública de reseñas
   - `ServicioCard` + `ProfesionalCard` - Tarjetas de servicios y profesionales

4. **Agendamiento Público** (100%) 🆕
   - `AgendarPublicoPage` (`/agendar/:slug`) - Stepper 4 pasos con validación
   - `SelectorServiciosPublico` - Multi-selección con cálculo automático duración/precio
   - `SelectorFechaHoraPublico` - **Verificación de disponibilidad en tiempo real** con grid de slots
   - `FormularioClientePublico` - Captura datos para creación automática de cliente
   - `ConfirmacionCitaPublico` - Resumen final y confirmación

5. **Panel Super Admin Marketplace** (100%) 🆕
   - `MarketplaceGestion.jsx` - Tabla con todos los perfiles (activos/inactivos)
   - Activar/desactivar perfiles desde Super Admin
   - Hook: `useSuperAdminMarketplace.js` con 3 queries

**✅ Hooks y API:**
- `useMarketplace.js` - **8 queries + 6 mutations** (incluye `useDisponibilidadPublica` y `useCrearCitaPublica`)
- `useSuperAdminMarketplace.js` - 3 queries para gestión de perfiles
- `marketplaceApi` - 17 endpoints implementados (incluye `consultarDisponibilidadPublica`)
- Sanitización automática, invalidación de queries, manejo de errores

**✅ Componentes Reutilizables (11):**
- `EstrellaRating` - Sistema 5 estrellas (readonly + editable, medias estrellas)
- `SEOHead`, `MapaUbicacion`, `NegocioCard`, `ReseñaCard`, `ServicioCard`, `ProfesionalCard`
- `SelectorServiciosPublico`, `SelectorFechaHoraPublico`, `FormularioClientePublico`, `ConfirmacionCitaPublico`

**⏳ Pendiente (2%):**
1. **Multimedia con MinIO** - 6-8h (Opcional pero recomendado)
   - MinIO S3-compatible storage (Docker)
   - Backend: MinioService + upload middleware + controller
   - Frontend: ImageUploader (react-dropzone) + GaleriaFotos
   - Soporte: Logo (500x500), Portada (1920x600), Galería (6x 800x600)
   - Procesamiento: Sharp (resize, compress, WebP conversion)

### Base de Datos ✅

**4 Tablas:**
- `marketplace_perfiles` - Perfil público (slug único, meta SEO)
- `marketplace_reseñas` - Reseñas validadas (1 por cita completada)
- `marketplace_analytics` - Tracking eventos (IPs hasheadas SHA256)
- `marketplace_categorias` - 10 categorías base

**24 Índices especializados** - GIN full-text search + geográficos
**8 Políticas RLS** - Acceso público + multi-tenant seguro

### Características Críticas

✅ **SEO-Ready**: Meta tags, slugs únicos, Schema.org LocalBusiness
✅ **GDPR-Compliant**: IPs hasheadas en backend antes de almacenar
✅ **Reseñas Validadas**: Solo clientes con cita `completada`, 1 reseña por cita
✅ **Analytics Fire-and-Forget**: Tracking asíncrono no bloqueante
✅ **Multi-tenant Seguro**: RLS isolation completo

### Archivos Críticos

**Backend:**
- `routes/api/v1/marketplace.js` - 15 endpoints
- `controllers/marketplace/` - 3 controllers (perfiles, resenas, analytics)
- `database/marketplace/` - 3 models con RLS
- `schemas/marketplace.schemas.js` - 8 schemas Joi

**Frontend:**
- `pages/marketplace/` - 3 páginas (MiMarketplacePage, DirectorioMarketplacePage, PerfilPublicoPage)
- `components/marketplace/` - 15 componentes (incluye wizard, formularios, cards, filtros)
- `components/dashboard/MarketplaceActivationCard.jsx` - CTA activación
- `hooks/useMarketplace.js` - 7 queries + 5 mutations
- `services/api/endpoints.js` - marketplaceApi (15 endpoints)

**Base de Datos:**
- `sql/marketplace/` - 6 archivos (tablas, índices, RLS, funciones, triggers, datos iniciales)

---

## 🔒 Seguridad Multi-Tenant (RLS)

### RBAC - Permisos por Rol

| Rol | Permisos |
|-----|----------|
| **super_admin** | Acceso TOTAL + gestión planes/organizaciones |
| **admin/propietario** | CRUD completo en su organización |
| **empleado** | READ servicios/profesionales, CRUD citas/clientes |
| **bot** | READ + CRUD citas |

**RLS activo** en todas las tablas multi-tenant (29 políticas core + 8 marketplace)

### Política de Contraseñas (100% Homologada)

**Requisitos OBLIGATORIOS:**
- Mínimo 8 caracteres
- Al menos 1 mayúscula (A-Z)
- Al menos 1 minúscula (a-z)
- Al menos 1 número (0-9)
- ✅ Caracteres especiales: **OPCIONALES** (mejoran score)
- ✅ Caracteres internacionales: **PERMITIDOS** (ñ, é, ü, etc.)

**Validación Frontend:**
- Regex: `PATTERNS.PASSWORD` → `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/`
- Schema Zod: `passwordValidation` (validations.js)
- Indicador visual: `PasswordStrengthIndicator.jsx` (llama al backend)

**Validación Backend:**
- Schema Joi: `PASSWORD_STRONG_PATTERN` → `/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/`
- Evaluador de fortaleza: `passwordHelper.js` (score 0-120, niveles muy débil → muy fuerte)

**Aplicado en:** Onboarding, reset password, change password, setup inicial, registro usuarios

---

## ⚡ Reglas Críticas

### Backend
1. **RLS SIEMPRE** - Usar `RLSContextManager.query()` o `.transaction()`
2. **NO filtrar por organizacion_id** - Controllers confían en RLS
3. **NO enviar auto-generados** - `codigo_cita`, `codigo_bloqueo`, `created_at`, `organizacion_id`
4. **asyncHandler obligatorio** - En todas las routes
5. **Validar límites del plan** - Middleware `subscription` lo hace automáticamente
6. **Bulk operations** - Pre-validar límites ANTES de crear (1-50 items)
7. **Reagendamiento** - SIEMPRE usar `excluir_cita_id` en `verificarDisponibilidad`
8. **Variables docker-compose** - `FRONTEND_URL` DEBE estar en prod.yml y prod.local.yml
9. **Marketplace Analytics** - Hash IPs en BACKEND antes de almacenar (SHA256)
10. **Exports de middleware** - SIEMPRE exportar en `middleware/index.js` (ej: setTenantContextFromQuery)
11. **API pública** - Usar `auth.optionalAuth` + middleware condicional basado en `req.user`

### Frontend
1. **Sanitizar opcionales** - Joi rechaza `""`, usar `undefined`
2. **Invalidar queries** - Tras mutaciones: `queryClient.invalidateQueries()`
3. **Limpiar cache** - Login/Logout: `queryClient.clear()`
4. **Vite HMR** - Si falla: `docker restart front` + hard refresh

---

## 🎯 Características Destacadas

### 1. Múltiples Servicios por Cita
- Tabla M:N `citas_servicios` permite 1-10 servicios por cita
- Cálculo automático de duración total + precio
- Soportado en backend, MCP y chatbots

### 2. Bulk Operations Transaccionales
- Profesionales y Servicios: 1-50 items con pre-validación de límites
- ACID garantizado (rollback completo en error)
- Endpoints: `POST /api/v1/{profesionales|servicios}/bulk-create`

### 3. Búsqueda Fuzzy de Clientes
- Trigram similarity + normalización telefónica (índices GIN)
- Tolerancia a typos para mejorar UX

### 4. Setup Checklist Inteligente
- 4 pasos esenciales: profesionales → horarios → servicios → asignaciones
- Estado calculado en tiempo real desde PostgreSQL
- Auto-oculta al completar + CTAs directos
- **Endpoint**: `GET /api/v1/organizaciones/:id/setup-progress`

### 5. Auto-generación de Códigos
- Triggers PostgreSQL: `codigo_cita`, `codigo_bloqueo`
- **⚠️ NUNCA enviar estos campos** en requests POST/PUT

### 6. Sistema de Comisiones Automático
- Trigger PostgreSQL calcula comisiones al completar citas
- JSONB `detalle_servicios` con breakdown por servicio
- Dashboard con Chart.js + reportes CSV/JSON
- **⚠️ NO usar `JSON.parse()`** en frontend: JSONB ya viene parseado

### 7. Marketplace Público SEO-Optimizado (98% Completo)
- ✅ Directorio con búsqueda por ciudad + categoría + rating
- ✅ Perfiles públicos con slug único `{ciudad}-{timestamp36}`
- ✅ Sistema de reseñas validadas (solo citas completadas)
- ✅ Analytics GDPR-compliant con IPs hasheadas SHA256
- ✅ Panel Admin completo (CRUD perfil, gestión reseñas, analytics)
- ✅ Panel Super Admin para activar/desactivar perfiles
- ✅ **Agendamiento público con disponibilidad en tiempo real** (sin autenticación)

### 8. API Pública con Contexto Multi-Tenant (Nov 2025)
- Middleware `setTenantContextFromQuery` para requests sin autenticación
- Patrón de middleware condicional basado en `req.user`
- Transformación automática de datos backend ↔ frontend
- Soporte dual para `servicios_ids` (array) y `servicio_id` (single)
- Cache inteligente con React Query (staleTime 30s)

---

## 📚 Archivos Críticos

### Backend - Core
- `utils/rlsContextManager.js` - RLS Manager v2.0 (**USAR SIEMPRE**)
- `utils/helpers.js` - 8 clases helper (Response, Validation, Date, etc.)
- `utils/passwordHelper.js` - **Evaluador fortaleza contraseña** (homologado)
- `utils/cita-validacion.util.js` - **Algoritmo solapamiento horarios**
- `middleware/subscription.js` - Validación límites del plan

### Backend - Email
- `services/emailService.js` - Servicio principal envío emails
- `services/email/transporter.js` - Singleton nodemailer con pool
- `services/email/templates/passwordReset.js` - Template HTML recuperación

### Backend - Disponibilidad y Validación
- **`database/disponibilidad.model.js`** - Verificación slots + parámetro `excluir_cita_id`
- **`controllers/disponibilidad.controller.js`** - Endpoint disponibilidad
- **`schemas/disponibilidad.schemas.js`** - Validación Joi con `excluir_cita_id`
- **`database/bloqueos-horarios.model.js`** - Validación bidireccional citas ↔ bloqueos
- `database/cita.operacional.model.js` - Validación contra bloqueos

### Backend - Chatbots
- **`controllers/chatbot.controller.js`** - System prompt + prevención alucinaciones
- `services/mercadopago.service.js` - Integración MP completa

### Backend - Comisiones
- **`routes/api/v1/comisiones.js`** - 12 endpoints (dashboard, configuración, pagos, reportes)
- `controllers/comisiones/` - 3 controllers modulares (configuracion, comisiones, estadisticas)
- `database/comisiones/` - 3 models (configuracion, comisiones, reportes)
- `schemas/comisiones.schemas.js` - 8 schemas Joi con validaciones
- **`sql/schema/02-functions.sql`** - Trigger `calcular_comision_cita()` (línea 824)

### Backend - Middleware y API Pública (Nov 2025)
- **`middleware/tenant.js`** - **setTenantContextFromQuery** (líneas 459-537) para API pública
- **`middleware/index.js`** - ⚠️ CRÍTICO: Exportar setTenantContextFromQuery (línea 33)
- **`routes/api/v1/disponibilidad.js`** - Middleware condicional (auth.optionalAuth)
- **`controllers/disponibilidad.controller.js`** - Soporte requests públicos (esPublico flag)
- **`schemas/disponibilidad.schemas.js`** - Validación dual servicios_ids/servicio_id

### Backend - Marketplace (100%)
- **`routes/api/v1/marketplace.js`** - 17 endpoints (3 públicos + 12 privados + 2 super admin)
- `controllers/marketplace/` - 3 controllers (perfiles, resenas, analytics)
- `database/marketplace/` - 3 models con RLS
- `schemas/marketplace.schemas.js` - 8 schemas Joi

### Frontend - Marketplace (98%)
- `pages/marketplace/` - 4 páginas (MiMarketplacePage, DirectorioMarketplacePage, PerfilPublicoPage, **AgendarPublicoPage**)
- `components/marketplace/agendamiento/` - **4 componentes stepper** (SelectorServiciosPublico, **SelectorFechaHoraPublico**, FormularioClientePublico, ConfirmacionCitaPublico)
- `components/marketplace/` - 15+ componentes (wizard, formularios, cards, filtros)
- `components/dashboard/MarketplaceActivationCard.jsx` - CTA activación
- **`hooks/useMarketplace.js`** - **8 queries + 6 mutations** (incluye **useDisponibilidadPublica** con transformación de datos)
- **`hooks/useSuperAdminMarketplace.js`** - 3 queries para panel super admin
- `pages/superadmin/MarketplaceGestion.jsx` - Panel Super Admin marketplace

### Frontend - Componentes Clave
- `components/dashboard/SetupChecklist.jsx` - Guía configuración inicial
- `components/dashboard/TrialStatusWidget.jsx` - Trial + activación MP
- `components/bloqueos/BloqueoFormModal.jsx` - Validación bidireccional
- `components/citas/CitaFormModal.jsx` - Múltiples servicios
- `components/comisiones/` - 9 componentes (Dashboard, Reportes, Config, Modals)
- **`hooks/useComisiones.js`** - 11 hooks TanStack Query

### MCP Server
- **`tools/verificarDisponibilidad.js`** - Parámetro `excluir_cita_id`

---

## 🔧 Troubleshooting

### "Organización no encontrada" en queries
**Causa**: JOINs multi-tabla sin RLS context
**Solución**: Usar `RLSContextManager.withBypass()` para queries con JOINs

### Backend 400 "field is not allowed to be empty"
**Causa**: Joi rechaza strings vacíos `""`
**Solución**: Sanitizar a `undefined`: `email: data.email?.trim() || undefined`

### Vite HMR no detecta cambios
**Solución**: `docker restart front` → esperar 5-10s → Ctrl+Shift+R

### Chatbot sugiere horarios ocupados
**Causa**: No llama `verificarDisponibilidad` sin parámetro `hora` para obtener slots reales
**Solución**: System prompt actualizado obliga a verificar antes de sugerir (Steps 3B/4B)

### Reagendamiento rechazado incorrectamente
**Causa**: Cita actual bloquea los slots que se van a liberar
**Solución**: Usar parámetro `excluir_cita_id` en `verificarDisponibilidad`

### Marketplace - Login intermitente después de reset de contraseña
**Causa**: `RLSHelper.withRole('login_context')` no reconocido por RLS, solo funciona con residual `bypass_rls` en pool
**Solución**: Usar `RLSHelper.withLoginEmail(db, email, callback)` que establece `app.login_email`

### Marketplace - Tracking analytics no registra eventos
**Causa**: IPs no hasheadas o falta política SELECT en `marketplace_analytics`
**Solución**: Hash SHA256 en backend + agregar política SELECT pública para FORCE RLS

### API Pública - "tenant.setTenantContextFromQuery is not a function"
**Causa**: Middleware definido en tenant.js pero NO exportado en middleware/index.js
**Solución**: Agregar export en middleware/index.js línea 33
**⚠️ MUY IMPORTANTE**: Siempre reiniciar contenedor backend después de modificar exports

### API Pública - React Query no ejecuta
**Causa**: Condition `enabled` incorrecta (arrays vacíos son truthy en JS)
**Solución**: Verificar longitud: `Array.isArray(params.servicios_ids) && params.servicios_ids.length > 0`

### Disponibilidad Pública - Slots muestran "0 min"
**Causa**: Backend puede retornar `duracion_minutos` (nuevo) o `duracion` (legacy)
**Solución**: Verificar ambos campos: `servicio.duracion_minutos || servicio.duracion`

---

**Versión**: 21.0 - **Marketplace 98% Completado**
**Última actualización**: 18 Noviembre 2025 (Sesión 2)
**Estado**: ✅ Production Ready + Marketplace Completo (Backend + Frontend + API Pública)

**Cambios en esta sesión:**
- ✅ Implementado agendamiento público con disponibilidad en tiempo real
- ✅ Middleware `setTenantContextFromQuery` para API pública sin autenticación
- ✅ Patrón de middleware condicional (auth.optionalAuth)
- ✅ Transformación automática de datos backend ↔ frontend
- ✅ Verificado Panel Super Admin Marketplace (ya existía)

**Pendiente (2% restante):**
- ⏳ Multimedia con MinIO (6-8h) - Logo, Portada, Galería 6 imágenes
  - Docker: MinIO + auto-init bucket
  - Backend: MinioService + upload middleware + controller
  - Frontend: ImageUploader (react-dropzone) + GaleriaFotos
  - Processing: Sharp (resize, compress, WebP)

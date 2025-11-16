# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 14 Noviembre 2025

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend API** | ✅ Operativo | 20 controllers, validación bidireccional citas/bloqueos |
| **Frontend React** | ✅ Operativo | React 18 + Vite 7, 13 hooks personalizados |
| **Base de Datos** | ✅ Optimizada | 25 tablas (2 particionadas), RLS multi-tenant |
| **Sistema Comisiones** | 🔵 BD Completa | Trigger automático, 3 tablas, 11 índices (Backend pendiente) |
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
- Row Level Security (29 políticas - incluye comisiones)
- 269 índices + 25 triggers + 48 funciones PL/pgSQL
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
**Operaciones (4):** citas (modular), bloqueos-horarios, disponibilidad, **comisiones** 🆕
**Pagos (2):** webhooks, pagos (Mercado Pago)
**IA (1):** chatbots (Telegram/WhatsApp)
**Admin (1):** superadmin (gestión global + sync MP)

**Arquitectura Modular de Citas:**
- **3 Controllers**: base, operacional (confirmar/cancelar/reagendar), recordatorios (+ 1 index proxy)
- **7 Archivos de Models**: base, operacional, recordatorios, helpers, cita-servicio, cita-servicio.queries, index

### Middleware Stack (7 middlewares)

**Orden obligatorio**: `auth` → `tenant.setTenantContext` → **`subscription`** → `rateLimiting` → `validation` → `asyncHandler`

- `auth.js` - JWT + verificación roles
- `tenant.js` - RLS context multi-tenant
- **`subscription.js`** - **Validación límites del plan** (profesionales, servicios, citas)
- `rateLimiting.js` - Rate limiting por rol
- `validation.js` - Joi schemas
- `asyncHandler.js` - Manejo async/await

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
- **13 Hooks personalizados** para gestión de estado (TanStack Query)
- **56 Componentes** organizados por módulo (ui, dashboard, citas, clientes, etc.)
- **25 Páginas** con routing protegido por rol
- **Onboarding de 3 pasos** (negocio → plan → cuenta admin)

**Componentes Clave:**
- `SetupChecklist.jsx` - Guía configuración inicial (auto-oculta al completar)
- `TrialStatusWidget.jsx` - Trial counter + activación MP
- `CitaFormModal.jsx` - Creación/edición con múltiples servicios
- `BloqueoFormModal.jsx` - Gestión bloqueos con validación bidireccional
- `ConfigurarChatbotModal.jsx` - Config Telegram/WhatsApp

---

### Base de Datos

**25 Tablas Principales:**

| Categoría | Tablas |
|-----------|--------|
| **Core** | organizaciones, usuarios, planes_subscripcion |
| **Catálogos** | tipos_profesional, tipos_bloqueo |
| **Negocio** | profesionales, servicios, clientes, servicios_profesionales, horarios_profesionales |
| **Operaciones** | citas ⚡, citas_servicios, bloqueos_horarios, metricas_uso_organizacion |
| **Comisiones** 🆕 | configuracion_comisiones, comisiones_profesionales, historial_configuracion_comisiones |
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

**Estado**: 🔵 Fase 1 Completada (BD) | ⚪ Fase 2 Pendiente (Backend/Frontend)

### Arquitectura

**Cálculo Automático**: Trigger PostgreSQL se dispara cuando cita cambia a estado `completada`

**Tipos de Comisión:**
- `porcentaje` - % del precio del servicio (0-100%)
- `monto_fijo` - Cantidad fija por cita
- `mixto` - Combinación (cita con múltiples servicios)

**Configuración:**
- **Global**: `servicio_id = NULL` → Aplica a todos los servicios del profesional
- **Específica**: `servicio_id = X` → Solo para ese servicio (sobrescribe global)

### Tablas Implementadas (3)

```sql
configuracion_comisiones          -- CRUD configuración
comisiones_profesionales          -- Registro automático (trigger)
historial_configuracion_comisiones -- Auditoría de cambios
```

### Trigger `calcular_comision_cita()`

```sql
1. Se dispara: AFTER UPDATE cuando estado → 'completada'
2. Obtiene servicios de la cita (JOIN citas_servicios)
3. Para cada servicio:
   - Busca config específica (profesional + servicio)
   - Si no existe → busca config global (servicio_id=NULL)
   - Calcula comisión según tipo
4. Suma total + genera JSON detalle
5. INSERT en comisiones_profesionales (estado='pendiente')
```

### Ejemplo de Cálculo

```javascript
// Cita completada: $200 (Corte Premium)
// Configuración: 15% global del profesional

// Resultado automático:
{
  monto_base: 200.00,
  tipo_comision: "porcentaje",
  valor_comision: 15.00,
  monto_comision: 30.00,  // Calculado: 200 * 0.15
  detalle_servicios: [{
    servicio_id: 1,
    nombre: "Corte Premium",
    precio: 200.00,
    tipo_comision: "porcentaje",
    valor_comision: 15.00,
    comision_calculada: 30.00
  }],
  estado_pago: "pendiente"
}
```

### Características Clave

- ✅ **FK compuesta** a tabla particionada: `(cita_id, fecha_cita)`
- ✅ **Índice GIN** en `detalle_servicios` (búsqueda JSONB)
- ✅ **Índice crítico**: `idx_citas_servicios_cita_id` (performance trigger)
- ✅ **RLS multi-tenant**: Admin ve todo, empleado solo sus comisiones
- ✅ **Auditoría completa**: Historial de cambios en configuración

### Ubicación en Código

```
sql/schema/06-operations-tables.sql   → 3 tablas (+125 líneas)
sql/schema/07-indexes.sql             → 11 índices (+200 líneas)
sql/schema/02-functions.sql           → 3 funciones PL/pgSQL (+280 líneas)
sql/schema/09-triggers.sql            → 4 triggers (+60 líneas)
sql/schema/08-rls-policies.sql        → 4 políticas RLS (+85 líneas)
```

### Pendiente (Fase 2-3)

**Backend API** (36h):
- Controllers modulares: `configuracion`, `comisiones`, `estadisticas`
- 8 endpoints RESTful (CRUD + reportes + dashboard)
- Models con RLSContextManager

**Frontend UI** (42h):
- Dashboard con Chart.js
- Configuración por profesional/servicio
- Reportes con exportación Excel/PDF
- 4 hooks personalizados TanStack Query

---

## 🔒 Seguridad Multi-Tenant (RLS)

### RBAC - Permisos por Rol

| Rol | Permisos |
|-----|----------|
| **super_admin** | Acceso TOTAL + gestión planes/organizaciones |
| **admin/propietario** | CRUD completo en su organización |
| **empleado** | READ servicios/profesionales, CRUD citas/clientes |
| **bot** | READ + CRUD citas |

**15 Políticas RLS** activas en todas las tablas multi-tenant

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

### Frontend - Componentes Clave
- `components/dashboard/SetupChecklist.jsx` - Guía configuración inicial
- `components/dashboard/TrialStatusWidget.jsx` - Trial + activación MP
- `components/bloqueos/BloqueoFormModal.jsx` - Validación bidireccional
- `components/citas/CitaFormModal.jsx` - Múltiples servicios

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

---

**Versión**: 17.0 - **Validación Bidireccional + Reagendamiento Inteligente**
**Última actualización**: 13 Noviembre 2025
**Estado**: ✅ Production Ready + AI-Optimized

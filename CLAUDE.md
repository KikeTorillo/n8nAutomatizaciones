# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 13 Noviembre 2025

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend API** | ✅ Operativo | 19 módulos, validación bidireccional citas/bloqueos |
| **Frontend React** | ✅ Operativo | React 19 + Vite 7, 13 hooks personalizados |
| **Base de Datos** | ✅ Optimizada | 21 tablas (2 particionadas), RLS multi-tenant |
| **Sistema IA** | ✅ Operativo | Telegram + WhatsApp, prevención de alucinaciones |
| **Suscripciones MP** | ✅ Operativo | Trial 14 días + Checkout Pro |
| **Deployment** | ✅ Listo | Docker Compose + scripts automatizados |

---

## 🛠 Stack Técnico

### Frontend
- React 19 + Vite 7 + Tailwind CSS 3
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
- Row Level Security (15 políticas)
- 67 índices + 13 triggers + 43 funciones PL/pgSQL (8 de mantenimiento)
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
**Operaciones (3):** citas (modular), bloqueos-horarios, disponibilidad
**Pagos (2):** webhooks, pagos (Mercado Pago)
**IA (1):** chatbots (Telegram/WhatsApp)
**Admin (1):** superadmin (gestión global + sync MP)

**Arquitectura Modular de Citas:**
- **3 Controllers**: base, operacional (confirmar/cancelar/reagendar), recordatorios
- **7 Models**: base, operacional, recordatorios, helpers, cita-servicio, queries

### Middleware Stack (7 middlewares)

**Orden obligatorio**: `auth` → `tenant.setTenantContext` → **`subscription`** → `rateLimiting` → `validation` → `asyncHandler`

- `auth.js` - JWT + verificación roles
- `tenant.js` - RLS context multi-tenant
- **`subscription.js`** - **Validación límites del plan** (profesionales, servicios, citas)
- `rateLimiting.js` - Rate limiting por rol
- `validation.js` - Joi schemas
- `asyncHandler.js` - Manejo async/await

### Servicios (8 archivos)

- `mercadopago.service.js` - Integración completa MP (suscripciones + planes + sync)
- `n8nService.js` - Workflows n8n
- `n8nCredentialService.js` - Credenciales chatbots
- `n8nGlobalCredentialsService.js` - Credenciales DeepSeek
- `n8nMcpCredentialsService.js` - Credenciales MCP server
- `platformValidators/` - Validadores Telegram/WhatsApp
- `tokenBlacklistService.js` - Blacklist JWT
- `configService.js` - Configuración sistema

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
- **53+ Componentes** organizados por módulo (ui, dashboard, citas, clientes, etc.)
- **24 Páginas** con routing protegido por rol
- **Onboarding de 3 pasos** (negocio → plan → cuenta admin)

**Componentes Clave:**
- `SetupChecklist.jsx` - Guía configuración inicial (auto-oculta al completar)
- `TrialStatusWidget.jsx` - Trial counter + activación MP
- `CitaFormModal.jsx` - Creación/edición con múltiples servicios
- `BloqueoFormModal.jsx` - Gestión bloqueos con validación bidireccional
- `ChatbotConfigModal.jsx` - Config Telegram/WhatsApp

---

### Base de Datos

**21 Tablas Principales:**

| Categoría | Tablas |
|-----------|--------|
| **Core** | organizaciones, usuarios, planes_subscripcion |
| **Catálogos** | tipos_profesional, tipos_bloqueo |
| **Negocio** | profesionales, servicios, clientes, servicios_profesionales, horarios_profesionales |
| **Operaciones** | citas ⚡, citas_servicios, bloqueos_horarios |
| **Chatbots** | chatbot_config, chatbot_credentials |
| **Pagos MP** | subscripciones, historial_subscripciones, metodos_pago, pagos |
| **Sistema** | eventos_sistema ⚡, eventos_sistema_archivo, metricas_uso_organizacion |

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

## 🔒 Seguridad Multi-Tenant (RLS)

### RBAC - Permisos por Rol

| Rol | Permisos |
|-----|----------|
| **super_admin** | Acceso TOTAL + gestión planes/organizaciones |
| **admin/propietario** | CRUD completo en su organización |
| **empleado** | READ servicios/profesionales, CRUD citas/clientes |
| **bot** | READ + CRUD citas |

**15 Políticas RLS** activas en todas las tablas multi-tenant

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
- `utils/cita-validacion.util.js` - **Algoritmo solapamiento horarios**
- `middleware/subscription.js` - Validación límites del plan

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

# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 6 Noviembre 2025

| Componente | Estado | Métricas Reales |
|------------|--------|-----------------|
| **Backend API** | ✅ Operativo | 19 módulos, 602 tests (556 passing, 92.4%) |
| **Frontend React** | ✅ Operativo | 52 componentes, 13 hooks, 24 páginas |
| **Base de Datos** | ✅ Optimizada | 21 tablas (2 particionadas), 15 RLS policies |
| **⚡ Particionamiento** | ✅ Operativo | Range partitioning mensual + pg_cron (4 jobs) |
| **Sistema IA** | ✅ Operativo | Telegram + WhatsApp + MCP (6 tools) |
| **Panel Super Admin** | ✅ Operativo | Gestión org/planes + Sincronización MP |
| **Suscripciones MP** | ✅ Operativo | Trial 14 días + Checkout Pro |
| **Deployment** | ✅ Listo | Scripts dev/prod + 8 servicios Docker |

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

### Backend - 19 Módulos

| # | Módulo | Características |
|---|--------|-----------------|
| 1 | auth | JWT + password recovery + setup inicial |
| 2 | usuarios | Gestión usuarios + RBAC |
| 3 | organizaciones | Multi-tenancy + trial 14 días |
| 4 | tipos-profesional | 33 tipos sistema + custom (dinámico) |
| 5 | tipos-bloqueo | 9 tipos sistema + custom (dinámico) |
| 6 | profesionales | CRUD + bulk operations (1-50 items) |
| 7 | servicios | CRUD + bulk operations (1-50 items) |
| 8 | clientes | Búsqueda fuzzy (trigram + GIN) |
| 9 | horarios-profesionales | Disponibilidad semanal |
| 10 | **citas** | Múltiples servicios + **arquitectura modular** |
| 11 | bloqueos-horarios | Bloqueos temporales |
| 12 | disponibilidad | Verificación horarios libres |
| 13 | planes | Catálogo planes |
| 14 | subscripciones | Trial + activación pago MP |
| 15 | chatbots | IA multi-plataforma (Telegram/WhatsApp) |
| 16 | webhooks | Webhooks Mercado Pago |
| 17 | pagos | Gestión pagos MP |
| 18 | superadmin | Panel administración global + sync MP |
| 19 | setup | Inicialización sistema (super_admin) |

**Arquitectura Modular de Citas:**
- **3 Controllers**: base (CRUD), operacional (confirmar/cancelar/reagendar), recordatorios
- **7 Models**: base, operacional, recordatorios, helpers, cita-servicio + queries

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

**13 Hooks Personalizados:**
`useAuth`, `useCitas`, `useClientes`, `useBloqueos`, `useProfesionales`, `useServicios`, `useHorarios`, `useEstadisticas`, `useTiposProfesional`, `useTiposBloqueo`, `useChatbots`, `useSuperAdmin`, `useToast`

**Nota:** Gestión de suscripciones usa `useQuery` directo (no hook separado)

**52 Componentes** organizados en:
- `ui/` (8) - Button, Input, Select, Modal, Toast, etc.
- `dashboard/` (5) - StatCard, TrialStatusWidget, CitasDelDia, etc. + **Widget Chatbots inline**
- `citas/` (10) - Forms, modals, calendarios
- `clientes/` (5) - Lista, forms, walk-in
- `profesionales/` (5) - CRUD + horarios + servicios
- `servicios/` (2)
- `bloqueos/` (6)
- `chatbots/` (4) - Config multi-plataforma
- `superadmin/` (3)
- Otros (4)

**24 Páginas** distribuidas en:
- Auth (3), Onboarding (4), Dashboard (1), Citas (1), Clientes (3), Profesionales (1), Servicios (1), Bloqueos (1), Chatbots (1), Suscripción (2), Super Admin (5), Landing (1), Setup (1)

**Onboarding Flow - 3 Steps:**
1. `Step1_BusinessInfo.jsx` - Información del negocio
2. `Step2_PlanSelection.jsx` - Selección plan (con trial)
3. `Step3_AccountSetup.jsx` - Cuenta administrador

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

**⚡ Tablas Particionadas (Range Partitioning Mensual):**
- **citas**: Particionada por `fecha_cita` - Mejora 10x+ en queries históricas
- **eventos_sistema**: Particionada por `creado_en` - Mejora 100x+ en queries antiguas
- 18 particiones pre-creadas (2025-2026)
- Gestión automática via pg_cron

**Tipos Dinámicos:**
- **33 tipos profesional** (sistema) - Organizados por 11 industrias
- **9 tipos bloqueo** (sistema) - vacaciones, feriado, mantenimiento, etc.
- Custom por organización

**ENUMs Principales:**
- `rol_usuario`: super_admin, admin, propietario, empleado, cliente, bot
- `estado_cita`: pendiente, confirmada, en_curso, completada, cancelada, no_asistio
- `industria_tipo`: 11 opciones (barberia, salon_belleza, consultorio_medico, etc.)
- `plan_tipo`: trial, basico, profesional, custom

**Funciones de Mantenimiento Particiones (8):**
```sql
-- Gestión básica
SELECT * FROM listar_particiones();
SELECT * FROM crear_particiones_futuras_citas(6);
SELECT * FROM eliminar_particiones_antiguas(24);

-- Todo en uno
SELECT * FROM mantener_particiones(6, 24);

-- Monitoreo
SELECT * FROM ver_estado_jobs_mantenimiento();
```

**4 Jobs Automáticos (pg_cron):**
1. **mantenimiento-particiones-mensual** - Día 1, 00:30 - Crear futuras + eliminar antiguas
2. **archivado-eventos-mensual** - Día 2, 01:00 - Archivar >12 meses
3. **archivado-citas-trimestral** - Día 1 trimestre, 02:00 - Archivar >24 meses
4. **vacuum-particiones-semanal** - Domingos, 03:00 - Optimizar almacenamiento

---

## 🤖 Sistema de Chatbots IA

### Plataformas Soportadas
- **Telegram Bot API** - BotFather token-based
- **WhatsApp Business Cloud API** - Meta Graph API v18.0

### MCP Server - 6 Tools
1. `listarServicios` - Catálogo con precios
2. `verificarDisponibilidad` - Horarios libres (1-10 servicios)
3. `buscarCliente` - Por teléfono o nombre
4. `buscarCitasCliente` - Historial para reagendamiento
5. `crearCita` - Creación validada (múltiples servicios)
6. `reagendarCita` - Modificar citas existentes

### Características
- ✅ System Prompt agnóstico de industria
- ✅ Creación automática (n8n workflow + credential + webhook con rollback)
- ✅ Multi-tenant seguro (JWT + RLS + Chat Memory)
- ✅ Anti-flood Redis (20s)
- ✅ Widget inline en Dashboard (vista rápida + gestión)
- ✅ Multi-plataforma (Telegram + WhatsApp en misma org)

**Acceso**: Rol `admin` o `propietario` | **URL**: `/chatbots`

---

## 👑 Panel Super Administrador

**Acceso**: Rol `super_admin` | **URL**: `/superadmin/*` | **Setup**: `POST /api/v1/setup/create-superadmin`

**Funcionalidades:**
- Dashboard métricas globales
- Gestión organizaciones (suspender/reactivar/cambiar plan)
- Edición planes (precios/límites/estado)
- **Sincronización manual planes con Mercado Pago**

### Sincronización Manual Planes MP

**Endpoint**: `POST /api/v1/superadmin/planes/sync-mercadopago`

**Lógica inteligente:**
1. Si plan tiene `mp_plan_id`: verifica que exista y esté activo en MP
2. Si está inactivo/cancelado: lo recrea automáticamente
3. Si NO tiene `mp_plan_id`: busca por nombre → asocia o crea nuevo

**UI**: Estado visual (sincronizado ✅ / no sincronizado ⚠️ / N/A)

---

## 💳 Sistema de Suscripciones (Mercado Pago)

### Flujo
1. **Onboarding** → Selección plan + Creación cuenta
2. **Trial gratuito** → 14 días (planes Básico/Professional), ilimitado (Custom)
3. **Activación pago** → Checkout Pro (init_point) → Pago recurrente

### Componentes Clave

**Backend:**
- `subscripciones.controller.js` - Trial + activación
- `mercadopago.service.js` - Integración completa + sync planes
- `subscription.middleware.js` - Validación límites del plan

**Frontend:**
- `TrialStatusWidget.jsx` - Contador días + botón activar (en Dashboard)
- `ActivarSuscripcion.jsx` - Redirect a Checkout Pro MP

### Características
- ✅ Trial automático (14 días)
- ✅ Checkout Pro con init_point
- ✅ Sincronización manual desde Super Admin
- ✅ Suscripciones sin plan asociado (evita limitación sandbox)
- ✅ Validación automática de límites en middleware

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

### Frontend
1. **Sanitizar opcionales** - Joi rechaza `""`, usar `undefined`
2. **Invalidar queries** - Tras mutaciones: `queryClient.invalidateQueries()`
3. **Limpiar cache** - Login/Logout: `queryClient.clear()`
4. **Vite HMR** - Si falla: `docker restart front` + hard refresh

---

## 🎯 Características Destacadas

### 1. Bulk Operations Transaccionales
- Profesionales y Servicios: 1-50 items por request
- ACID garantizado (rollback completo en error)
- Pre-validación de límites del plan
- Endpoints: `POST /api/v1/{profesionales|servicios}/bulk-create`

### 2. Búsqueda Fuzzy Avanzada
- Clientes: Trigram similarity + normalización telefónica
- Índices GIN para alta performance
- Tolerancia a typos

### 3. Múltiples Servicios por Cita
- Tabla M:N `citas_servicios`
- Backend/MCP: 1-10 servicios por cita
- Cálculo automático duración total + precio

### 4. Auto-generación de Códigos
- Triggers PostgreSQL generan automáticamente
- `codigo_cita`, `codigo_bloqueo`
- **NO enviar** en requests

### 5. Tipos Dinámicos por Industria
- 33 tipos profesional + custom
- Filtrado automático por industria seleccionada
- UI adaptativa según tipo de negocio

---

## 📚 Archivos Críticos

### Backend
- `utils/rlsContextManager.js` - RLS Manager v2.0 (**USAR SIEMPRE**)
- `utils/helpers.js` - 8 clases helper
- `middleware/subscription.js` - Validación límites del plan
- `services/mercadopago.service.js` - MP completo + sync planes
- `controllers/chatbot.controller.js` - System prompt agnóstico
- `database/cita.*.model.js` - Arquitectura modular (7 archivos)

### Frontend
- `services/api/client.js` - Axios + auto-refresh JWT
- `components/dashboard/TrialStatusWidget.jsx` - Trial + activación
- `pages/onboarding/steps/Step2_PlanSelection.jsx` - Selección plan

### Base de Datos
- `sql/schema/06-operations-tables.sql` - Tabla `citas` PARTICIONADA
- `sql/schema/15-maintenance-functions.sql` - 8 funciones mantenimiento
- `sql/schema/18-pg-cron-setup.sql` - 4 jobs automáticos
- `Dockerfile.postgres` - PostgreSQL 17 + pg_cron

---

## 🔧 Troubleshooting

### "Organización no encontrada" en queries
**Solución**: Usar `RLSContextManager.withBypass()` para JOINs multi-tabla

### Backend 400 "field is not allowed to be empty"
**Solución**: Sanitizar a `undefined`: `email: data.email?.trim() || undefined`

### Vite HMR no detecta cambios
**Solución**: `docker restart front` → esperar 5-10s → Ctrl+Shift+R

### Mercado Pago: "card_token_id is required"
**Solución**: Usar `crearSuscripcionConInitPoint()` sin `preapproval_plan_id`
**Archivo**: `backend/app/services/mercadopago.service.js:259`

### Mercado Pago: Planes duplicados
**Solución**: Filtrar solo `status === 'active'` en `buscarPlanPorNombre()`
**Archivo**: `backend/app/services/mercadopago.service.js:178`

### Mercado Pago: SDK `PreApprovalPlan.get()` no funciona
**Solución**: Usar `search()` + filtrar por ID
**Archivo**: `backend/app/services/mercadopago.service.js:142`

---

**Versión**: 15.0 - **Arquitectura Documentada (Real State)**
**Última actualización**: 6 Noviembre 2025
**Estado**: ✅ Production Ready + Performance Optimized

# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 31 Octubre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ Operativo | 14 módulos, 545 tests (100%) |
| **Frontend React** | ✅ Operativo | 50 componentes, 13 hooks |
| **Base de Datos** | ✅ Operativo | 20 tablas, 24 RLS policies |
| **Sistema IA** | ✅ Operativo | n8n + DeepSeek + MCP Server |
| **MCP Server** | ✅ Operativo | 6 tools, JSON-RPC 2.0, JWT multi-tenant |
| **Panel Super Admin** | ✅ Operativo | Dashboard, gestión org/planes, edición planes |
| **Bulk Operations** | ✅ Operativo | Creación transaccional de Profesionales y Servicios |
| **Deployment** | ✅ Listo | Scripts bash dev/prod |

---

## 🛠 Stack Técnico

### Frontend
- React 19 + Vite 7 + Tailwind CSS 3
- Zustand + TanStack Query
- React Hook Form + Zod
- Axios (auto-refresh JWT)

### Backend
- Node.js + Express.js
- JWT (7d access + 30d refresh)
- Joi schemas + Winston logs
- Jest + Supertest (545 tests, 100%)

### Base de Datos
- PostgreSQL 17 Alpine
- Row Level Security (24 políticas)
- 165 índices + 30 triggers + 38 funciones PL/pgSQL

### IA Conversacional
- n8n workflows (15 nodos)
- Telegram Bot API
- DeepSeek (modelo IA)
- PostgreSQL Chat Memory (RLS)
- Redis Anti-flood (20s debouncing)
- MCP Server (6 tools)

---

## 📝 Comandos Esenciales

### Desarrollo (npm)

```bash
npm run dev              # Levantar stack completo
npm run logs             # Ver logs
npm run test:backend     # 545 tests
npm run status           # Ver estado
npm run clean            # Limpiar contenedores
```

### Producción Local (testing)

```bash
bash deploy.local.sh deploy    # Deployment completo
bash deploy.local.sh restart   # Reiniciar servicios
bash deploy.local.sh logs      # Ver logs
```

### VPS (producción real)

```bash
bash deploy.sh deploy    # Deployment completo
bash deploy.sh update    # Git pull + rebuild + restart
bash deploy.sh backup    # Backup BD
```

---

## 🏗 Arquitectura

### Backend - 14 Módulos

1. **auth** - JWT + password recovery
2. **usuarios** - Gestión usuarios + RBAC
3. **organizaciones** - Multi-tenancy
4. **tipos-profesional** - Tipos dinámicos (33 sistema + custom)
5. **tipos-bloqueo** - Tipos bloqueo dinámicos
6. **profesionales** - Prestadores servicios
7. **servicios** - Catálogo servicios
8. **clientes** - Base clientes (búsqueda fuzzy)
9. **horarios-profesionales** - Disponibilidad semanal
10. **citas** - Agendamiento (múltiples servicios por cita)
11. **bloqueos-horarios** - Bloqueos temporales
12. **planes** - Planes y suscripciones
13. **chatbots** - Chatbots IA multi-plataforma
14. **superadmin** - Panel administración global (métricas, organizaciones, planes)

**Helpers Críticos:**
- `RLSContextManager` (v2.0) - **USAR SIEMPRE** para queries multi-tenant
- `helpers.js` - 8 clases helper (ResponseHelper, ValidationHelper, etc.)

### Frontend - 13 Hooks Personalizados

`useAuth`, `useCitas`, `useClientes`, `useBloqueos`, `useProfesionales`, `useServicios`, `useHorarios`, `useEstadisticas`, `useTiposProfesional`, `useTiposBloqueo`, `useChatbots`, `useSuperAdmin`, `useToast`

### Base de Datos - 20 Tablas

**Core:** organizaciones, usuarios, planes_subscripcion
**Catálogos:** tipos_profesional, tipos_bloqueo
**Negocio:** profesionales, servicios, clientes, servicios_profesionales, horarios_profesionales
**Operaciones:** citas, citas_servicios, bloqueos_horarios
**Chatbots:** chatbot_config, chatbot_credentials
**Sistema:** eventos_sistema, subscripciones, metricas_uso_organizacion

**ENUMs principales:**
- `rol_usuario`: super_admin, admin, propietario, empleado, cliente, bot
- `estado_cita`: pendiente, confirmada, en_curso, completada, cancelada, no_asistio

---

## 🤖 Sistema de Chatbots IA

### MCP Server - 6 Tools

1. **listarServicios** - Lista servicios activos con precios
2. **verificarDisponibilidad** - Verifica horarios libres (soporta múltiples servicios)
3. **buscarCliente** - Busca clientes por teléfono o nombre
4. **buscarCitasCliente** - Busca citas de un cliente por teléfono (para reagendamiento)
5. **crearCita** - Crea citas validadas (soporta múltiples servicios)
6. **reagendarCita** - Reagenda citas existentes

### Características Clave

- ✅ **System Prompt Dinámico** - Generado por organización en `_generarSystemPrompt()`
- ✅ **Creación Automática** - Sin intervención manual + webhooks + rollback en errores
- ✅ **Multi-tenant Seguro** - JWT + RLS + Chat Memory persistente
- ✅ **Anti-flood** - Redis debouncing (20s)
- ✅ **Conversacional** - Múltiples servicios por cita + reagendamiento

---

## 👑 Panel Super Administrador

**Acceso**: Rol `super_admin` | **URL**: `/superadmin/*` | **Setup**: `POST /api/v1/setup/create-superadmin` (one-time)

### Funcionalidades

- ✅ **Dashboard** - Métricas globales (orgs activas, usuarios, citas, revenue, trials, morosas)
- ✅ **Gestión Organizaciones** - Suspender, reactivar, cambiar plan, filtros avanzados
- ✅ **Gestión Planes** - Edición completa (nombre, descripción, precios, límites, estado)
- ✅ **Visualización Límites** - Tarjetas de planes muestran límites de profesionales, servicios, clientes y citas/mes

### Endpoints

- `GET /api/v1/superadmin/dashboard` - Métricas globales
- `GET /api/v1/superadmin/organizaciones` - Listar con filtros
- `GET /api/v1/superadmin/planes` - Listar planes
- `PUT /api/v1/superadmin/planes/:id` - Actualizar plan

---

## 🔒 Seguridad Multi-Tenant (RLS)

### Stack de Middleware
Orden obligatorio: `auth` → `tenant.setTenantContext` → `rateLimiting` → `validation` → `asyncHandler`

### Patrón RLS en Models
- **Query simple**: `RLSContextManager.query(orgId, async (db) => {...})`
- **Transacción**: `RLSContextManager.transaction(orgId, async (db) => {...})`
- **Bypass** (JOINs multi-tabla): `RLSContextManager.withBypass(async (db) => {...})`

### RBAC - Permisos por Rol

**super_admin**: Acceso TOTAL + gestión planes/organizaciones
**admin/propietario**: CRUD completo en su organización
**empleado**: READ servicios/profesionales, CRUD citas/clientes
**bot**: READ + CRUD citas

---

## ⚡ Reglas Críticas

### Backend
1. **RLS en Models** - SIEMPRE usar `RLSContextManager.query()` o `.transaction()`
2. **NO filtrar por organizacion_id** - Controllers confían en RLS
3. **NO enviar campos auto-generados** - `codigo_cita`, `created_at`, `organizacion_id`
4. **Usar asyncHandler** - Para async/await en routes
5. **Bulk Operations** - Pre-validar límites del plan ANTES de crear

### Frontend
1. **Sanitizar opcionales** - Joi rechaza `""`, usar `undefined`
2. **Invalidar queries** - Tras mutaciones: `queryClient.invalidateQueries()`
3. **Limpiar cache** - Login/Logout: `queryClient.clear()`
4. **Vite HMR** - Si no detecta cambios: `docker restart front`

---

## 🎯 Características Clave

### 1. Tipos Dinámicos
Sistema híbrido: 33 tipos sistema + custom por organización. Filtrado automático por industria.

### 2. Auto-generación de Códigos
Triggers generan automáticamente: `codigo_cita` ("ORG001-20251021-001"), `codigo_bloqueo`.
**NO enviar estos campos** en requests.

### 3. Búsqueda Fuzzy
Clientes: Trigram similarity + normalización telefónica + índices GIN.

### 4. Múltiples Servicios por Cita
Tabla `citas_servicios` (M:N). Backend/MCP soportan 1-10 servicios por cita.

### 5. Bulk Operations (Transaccional)

**Profesionales y Servicios** soportan creación masiva con garantías ACID:

```javascript
// POST /api/v1/profesionales/bulk-create
// POST /api/v1/servicios/bulk-create

{
  "profesionales": [/* 1-50 items */],  // o
  "servicios": [/* 1-50 items */]
}
```

**Características:**
- ✅ Pre-validación de límites del plan ANTES de crear
- ✅ Transaccional (ALL or NONE) - PostgreSQL garantiza atomicidad
- ✅ Validación de nombres duplicados (batch + DB)
- ✅ 1 request vs N requests (más rápido y eficiente)
- ✅ HTTP 403 si excede límite del plan
- ✅ HTTP 201 con total de registros creados

**Endpoints:**
- `backend/app/routes/api/v1/profesionales.js:75-85` - Bulk-create profesionales
- `backend/app/routes/api/v1/servicios.js:78-88` - Bulk-create servicios

**Uso en Onboarding:**
- `Step5_Professionals.jsx` - Crea profesionales al finalizar paso
- `Step6_Services.jsx` - Crea servicios al finalizar paso

---

## 📋 Checklist Nuevos Módulos

### Backend
- [ ] Routes: Stack middleware (auth → tenant → rateLimit → validation)
- [ ] Controller: `asyncHandler` + `ResponseHelper`
- [ ] Model: `RLSContextManager.query()`
- [ ] Schema: Joi modular
- [ ] Tests: Min 10 tests (unit + integration + multi-tenant)

### Frontend
- [ ] Página: React Query (loading/error/success)
- [ ] Forms: React Hook Form + Zod + sanitización
- [ ] Hook: Custom hook con React Query
- [ ] API: Endpoints en `services/api/endpoints.js`

---

## 📚 Archivos Críticos

### Backend
- `utils/rlsContextManager.js` - RLS Manager v2.0 (**USAR SIEMPRE**)
- `utils/helpers.js` - ResponseHelper, ValidationHelper, etc.
- `controllers/chatbot.controller.js` - System prompt dinámico
- `controllers/superadmin.controller.js` - Panel super admin
- `routes/api/v1/profesionales.js` - Bulk-create profesionales (línea 75)
- `routes/api/v1/servicios.js` - Bulk-create servicios (línea 78)
- `database/profesional.model.js` - Método `crearBulk()`
- `database/servicio.model.js` - Método `crearBulk()`

### Frontend
- `services/api/client.js` - Axios + auto-refresh JWT
- `pages/onboarding/steps/Step5_Professionals.jsx` - Onboarding profesionales
- `pages/onboarding/steps/Step6_Services.jsx` - Onboarding servicios
- `pages/superadmin/*.jsx` - Panel super admin

### Base de Datos
- `sql/schema/08-rls-policies.sql` - 24 políticas RLS
- `sql/schema/09-triggers.sql` - Auto-generación códigos

---

## 🔧 Troubleshooting

### "Organización no encontrada" en queries
**Causa**: JOINs multi-tabla necesitan bypass RLS
**Solución**: Usar `RLSContextManager.withBypass()`

### Backend 400 "field is not allowed to be empty"
**Causa**: Joi no acepta cadenas vacías `""`
**Solución**: Sanitizar a `undefined`: `email: data.email?.trim() || undefined`

### Vite HMR no detecta cambios
**Síntomas**: Modificas archivo pero no se refleja en navegador
**Solución**: `docker restart front` → esperar 5-10s → hard refresh (Ctrl+Shift+R)
**Nota**: Más común en `/pages/superadmin/`

---

**Versión**: 11.1
**Última actualización**: 31 Octubre 2025
**Estado**: ✅ Production Ready + Bulk Operations

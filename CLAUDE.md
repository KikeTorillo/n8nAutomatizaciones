# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## 🎯 Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## 📊 Estado Actual

**Actualizado**: 3 Noviembre 2025

| Componente | Estado | Métricas |
|------------|--------|----------|
| **Backend API** | ✅ Operativo | 15 módulos, 545 tests (100%) |
| **Frontend React** | ✅ Operativo | 55+ componentes, 14 hooks |
| **Base de Datos** | ✅ Operativo | 21 tablas, 24 RLS policies |
| **Sistema IA** | ✅ Operativo | Telegram + WhatsApp Business + MCP |
| **MCP Server** | ✅ Operativo | 6 tools, JWT multi-tenant |
| **Panel Super Admin** | ✅ Operativo | Gestión org/planes + Sincronización MP |
| **Suscripciones MP** | ✅ Operativo | Trial 14 días + Checkout Pro |
| **Gestión Chatbots** | ✅ Operativo | Dashboard + CRUD multi-plataforma |
| **Deployment** | ✅ Listo | Scripts dev/prod |

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
- n8n workflows (15 nodos) + Telegram Bot API + WhatsApp Business Cloud API
- DeepSeek Chat + PostgreSQL Chat Memory (RLS) + Redis Anti-flood
- MCP Server (6 tools) + JWT autenticación multi-tenant

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

### Backend - 15 Módulos

1. **auth** - JWT + password recovery
2. **usuarios** - Gestión usuarios + RBAC
3. **organizaciones** - Multi-tenancy + trial 14 días
4. **tipos-profesional** - Tipos dinámicos (33 sistema + custom)
5. **tipos-bloqueo** - Tipos bloqueo dinámicos
6. **profesionales** - Prestadores servicios
7. **servicios** - Catálogo servicios
8. **clientes** - Base clientes (búsqueda fuzzy)
9. **horarios-profesionales** - Disponibilidad semanal
10. **citas** - Agendamiento (múltiples servicios por cita)
11. **bloqueos-horarios** - Bloqueos temporales
12. **planes** - Catálogo planes + sincronización MP
13. **subscripciones** - Gestión suscripciones + activación pago
14. **chatbots** - Chatbots IA multi-plataforma
15. **superadmin** - Panel administración global

**Helpers Críticos:**
- `RLSContextManager` (v2.0) - **USAR SIEMPRE** para queries multi-tenant
- `helpers.js` - 8 clases helper (ResponseHelper, ValidationHelper, etc.)

### Frontend - 14 Hooks Personalizados

`useAuth`, `useCitas`, `useClientes`, `useBloqueos`, `useProfesionales`, `useServicios`, `useHorarios`, `useEstadisticas`, `useTiposProfesional`, `useTiposBloqueo`, `useSubscripciones`, `useChatbots`, `useSuperAdmin`, `useToast`

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

### Plataformas Soportadas
- **Telegram Bot API** - BotFather token-based
- **WhatsApp Business Cloud API** - Meta Graph API v18.0

### MCP Server - 6 Tools
1. **listarServicios** - Catálogo con precios
2. **verificarDisponibilidad** - Horarios libres (1-10 servicios)
3. **buscarCliente** - Por teléfono o nombre
4. **buscarCitasCliente** - Historial para reagendamiento
5. **crearCita** - Creación validada (múltiples servicios)
6. **reagendarCita** - Modificar citas existentes

### Gestión de Chatbots
- **Acceso**: Rol `admin` o `propietario` | **URL**: `/chatbots`
- **Dashboard Widget** - Vista rápida de bots activos
- **CRUD Completo** - Crear, activar/desactivar, eliminar
- **Configuración** - Disponible desde onboarding Y dashboard
- **Multi-plataforma** - Telegram y WhatsApp en misma organización

### Características Clave
- ✅ **System Prompt Agnóstico** - Genérico para cualquier industria (no asume tipo de negocio)
- ✅ **Creación Automática** - n8n workflow + credential + webhook (rollback en errores)
- ✅ **Multi-tenant Seguro** - JWT + RLS + Chat Memory persistente
- ✅ **Anti-flood** - Redis debouncing (20s)
- ✅ **Conversacional** - Múltiples servicios/cita + reagendamiento + nombres exactos de servicios

---

## 👑 Panel Super Administrador

**Acceso**: Rol `super_admin` | **URL**: `/superadmin/*` | **Setup**: `POST /api/v1/setup/create-superadmin`

**Funcionalidades**:
- Dashboard métricas globales
- Gestión organizaciones (suspender/reactivar/cambiar plan)
- Edición planes (precios/límites/estado)
- **Sincronización manual de planes con Mercado Pago** (`/superadmin/planes/mercadopago`)

### Sincronización Manual de Planes MP

**Endpoint**: `POST /api/v1/superadmin/planes/sync-mercadopago`

**Características**:
- ✅ Sincronización inteligente (verifica planes existentes antes de crear)
- ✅ Detección de planes cancelados/inactivos (los recrea automáticamente)
- ✅ Búsqueda por nombre para evitar duplicados
- ✅ Validación de precio > $0 (MP no permite planes gratis)
- ✅ Sincronización individual o masiva
- ✅ UI con estado visual (sincronizado/no sincronizado/N/A)

**Lógica de sincronización**:
1. Si plan tiene `mp_plan_id`: verifica que exista y esté activo en MP
2. Si plan tiene `mp_plan_id` pero está inactivo: lo recrea
3. Si NO tiene `mp_plan_id`: busca plan existente por nombre → asocia o crea nuevo

---

## 💳 Sistema de Suscripciones (Mercado Pago)

### Flujo de Suscripción

1. **Onboarding** → Selección plan + Creación cuenta
2. **Trial gratuito** → 14 días automático (planes Basic/Professional)
3. **Activación pago** → Checkout Pro (init_point) → Pago recurrente

### Componentes Clave

**Backend:**
- `subscripciones.controller.js` - `obtenerActual()`, `obtenerEstadoTrial()`, `activarPago()`
- `subscripcion.model.js` - Queries RLS para tabla `subscripciones`
- `mercadopago.service.js` - Integración completa MP + sincronización planes
- `superadmin.controller.js` - `sincronizarPlanesConMercadoPago()` (manual desde UI)

**Frontend:**
- `TrialStatusWidget.jsx` - Contador días restantes + botón activación
- `ActivarSuscripcion.jsx` - Página activación con redirect a MP
- `GestionPlanes.jsx` - UI sincronización manual de planes
- `useSubscripciones.js` - Hook gestión estado suscripción

### Características

✅ **Trial Automático:** 14 días para Basic/Professional, ilimitado para Free/Custom
✅ **Checkout Pro (init_point):** Usuario completa pago en sitio MP
✅ **Sincronización Manual:** Control total desde panel Super Admin
✅ **Suscripciones sin Plan:** Usa `auto_recurring` directamente (evita limitación SDK)

### ⚠️ Limitaciones Mercado Pago

**Sandbox:**
- ❌ **NO permite** suscripciones con `preapproval_plan_id` + `init_point`
- ❌ **Conflicto países**: Email registrado en país diferente al merchant
- ❌ **URLs localhost**: Requiere URLs públicas para `back_url`
- ✅ **Solución**: Crear sin plan asociado, define `auto_recurring` manualmente

**Producción:**
- ✅ Todas las limitaciones sandbox desaparecen
- ✅ Tarjetas reales funcionan correctamente
- ✅ URLs localhost reemplazadas por dominio real

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

### 1. Sistema de Suscripciones + Trial
- Trial gratuito 14 días (automático en planes de pago)
- Widget trial en Dashboard (contador días + activación)
- Checkout Pro Mercado Pago (init_point)
- Sincronización manual de planes desde Super Admin
- Suscripciones sin plan asociado (evita limitación sandbox)

### 2. Gestión de Chatbots IA
- Multi-plataforma: Telegram + WhatsApp Business en misma org
- System Prompt agnóstico de industria
- Widget en Dashboard con vista rápida de bots activos
- Configuración desde onboarding (opcional)

### 3. Tipos Dinámicos
33 tipos sistema + custom por organización. Filtrado automático por industria.

### 4. Auto-generación de Códigos
Triggers generan: `codigo_cita`, `codigo_bloqueo`. **NO enviar** en requests.

### 5. Búsqueda Fuzzy
Clientes: Trigram similarity + normalización telefónica + índices GIN.

### 6. Múltiples Servicios por Cita
Tabla `citas_servicios` (M:N). Backend/MCP: 1-10 servicios/cita.

### 7. Bulk Operations (Transaccional)
Profesionales y Servicios: creación masiva (1-50 items), ACID garantizado, pre-validación límites plan, 1 request vs N requests.

**Endpoints**: `POST /api/v1/profesionales/bulk-create`, `POST /api/v1/servicios/bulk-create`
**Uso**: Onboarding Steps 5 y 6 (profesionales y servicios)

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
- `utils/helpers.js` - ResponseHelper, ValidationHelper
- `services/mercadopago.service.js` - Integración MP completa (suscripciones + planes)
- `controllers/subscripciones.controller.js` - Trial + activación pago
- `controllers/superadmin.controller.js` - `sincronizarPlanesConMercadoPago()` + gestión global
- `controllers/chatbot.controller.js` - System prompt agnóstico
- `database/{profesional,servicio}.model.js` - Método `crearBulk()`

### Frontend
- `services/api/client.js` - Axios + auto-refresh JWT
- `hooks/useSubscripciones.js` - Estado trial + suscripción
- `hooks/useSuperAdmin.js` - Gestión Super Admin + sincronización planes
- `components/dashboard/TrialStatusWidget.jsx` - Contador trial + botón activar
- `pages/subscripcion/ActivarSuscripcion.jsx` - Redirect a Checkout Pro
- `pages/superadmin/GestionPlanes.jsx` - UI sincronización manual de planes
- `pages/onboarding/steps/Step2_PlanSelection.jsx` - Selección plan con trial
- `pages/onboarding/steps/Step{5,6}_*.jsx` - Profesionales/Servicios (bulk)

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

### Chatbots no aparecen en Dashboard/Lista
**Causa**: Hook `useChatbots` retorna estructura incorrecta
**Solución**: Hook debe devolver `response.data.data` completo (contiene `{ chatbots: [...], paginacion: {...} }`)
**Evitar**: NO transformar a `{ chatbots: response.data.data }` - ya viene con esa estructura

### Mercado Pago: "Cannot operate between different countries"
**Causa**: Email del usuario ya registrado en MP en otro país diferente al access token
**Solución**: Usar email diferente que NO esté registrado en MP o esté en mismo país
**Nota**: Limitación de plataforma MP, no del código

### Mercado Pago: "card_token_id is required" al crear suscripción
**Causa**: Intentar crear suscripción con `preapproval_plan_id` + `init_point` (no soportado)
**Solución**: Usar `crearSuscripcionConInitPoint()` que crea sin plan asociado usando `auto_recurring`
**Archivo**: `backend/app/services/mercadopago.service.js:259`

### Mercado Pago: "Invalid value for back_url"
**Causa**: Sandbox no acepta URLs localhost
**Solución**: Código automáticamente usa `https://www.mercadopago.com.mx` para localhost
**Archivo**: `backend/app/controllers/subscripciones.controller.js:252`

### Mercado Pago: Planes duplicados en sincronización
**Causa**: `buscarPlanPorNombre()` buscaba entre TODOS los planes (activos + inactivos)
**Solución**: Filtrar solo planes con `status === 'active'` antes de buscar
**Archivo**: `backend/app/services/mercadopago.service.js:178` (`buscarPlanPorNombre()`)

### Mercado Pago: Plan no se recrea después de eliminarlo en MP
**Causa**: Al eliminar un plan en MP web, el `status` cambia a 'cancelled' pero el plan sigue existiendo. `obtenerPlan()` lo encontraba y lo marcaba como válido
**Solución**: Verificar `status === 'active'` en `obtenerPlan()` y lanzar error si no está activo
**Archivo**: `backend/app/services/mercadopago.service.js:142` (`obtenerPlan()`)

### Mercado Pago: SDK `PreApprovalPlan.get()` no funciona
**Causa**: Bug del SDK - el método `get()` retorna error "template with id undefined"
**Solución**: Usar `search()` + filtrar por ID en lugar de `get()`
**Archivo**: `backend/app/services/mercadopago.service.js:142` (`obtenerPlan()`)

---

**Versión**: 13.0
**Última actualización**: 3 Noviembre 2025
**Estado**: ✅ Production Ready

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
| **Frontend React** | ✅ Operativo | 52 componentes, 13 hooks |
| **Base de Datos** | ✅ Operativo | 20 tablas, 24 RLS policies |
| **Sistema IA** | ✅ Operativo | Telegram + WhatsApp Business + MCP |
| **MCP Server** | ✅ Operativo | 6 tools, JWT multi-tenant |
| **Panel Super Admin** | ✅ Operativo | Gestión org/planes |
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

**Funcionalidades**: Dashboard métricas globales, gestión organizaciones (suspender/reactivar/cambiar plan), edición planes (precios/límites/estado)

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

### 1. Gestión de Chatbots IA
- Acceso desde Dashboard y Onboarding (puede saltarse)
- Multi-plataforma: Telegram + WhatsApp Business en misma org
- System Prompt agnóstico de industria (genérico)
- Widget en Dashboard con vista rápida de bots activos

### 2. Tipos Dinámicos
33 tipos sistema + custom por organización. Filtrado automático por industria.

### 3. Auto-generación de Códigos
Triggers generan: `codigo_cita`, `codigo_bloqueo`. **NO enviar** en requests.

### 4. Búsqueda Fuzzy
Clientes: Trigram similarity + normalización telefónica + índices GIN.

### 5. Múltiples Servicios por Cita
Tabla `citas_servicios` (M:N). Backend/MCP: 1-10 servicios/cita.

### 6. Bulk Operations (Transaccional)
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
- `controllers/chatbot.controller.js` - System prompt agnóstico + `_generarSystemPrompt()`
- `controllers/superadmin.controller.js` - Panel super admin
- `database/{profesional,servicio}.model.js` - Método `crearBulk()` (bulk operations)

### Frontend
- `services/api/client.js` - Axios + auto-refresh JWT
- `hooks/useChatbots.js` - **IMPORTANTE**: devuelve `response.data.data` completo
- `pages/chatbots/ChatbotsPage.jsx` - CRUD chatbots + widget Dashboard
- `components/chatbots/ConfigurarChatbotModal.jsx` - Reutiliza componentes onboarding
- `pages/onboarding/steps/Step{5,6,7}_*.jsx` - Profesionales (bulk), Servicios (bulk), Chatbots (opcional)

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

---

**Versión**: 11.2
**Última actualización**: 31 Octubre 2025
**Estado**: ✅ Production Ready

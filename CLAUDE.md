# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## Estado Actual del Proyecto

**Última verificación**: 30 Noviembre 2025

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend API** | ✅ | 40 controllers, 249 endpoints, 52 models |
| **Frontend React** | ✅ | 108 componentes, 47 páginas, 28 hooks |
| **Super Admin** | ✅ | Usuario plataforma SIN organización, panel `/superadmin/*` |
| **Registro Simplificado** | ✅ | 7 campos + email activación + auto-login |
| **App Home / Launcher** | ✅ | Grid 12 apps, badges, accesos rápidos |
| **Clientes (Core)** | ✅ | Módulo independiente, ClienteSelector POS |
| **Sistema Invitaciones** | ✅ | Token 64-char, email auto, vinculación profesional-usuario |
| **Base de Datos** | ✅ | 24 módulos SQL, 54 tablas, 3 particionadas, 93 RLS, 86 funciones |
| **Chatbots IA** | ✅ | 8 MCP tools, Telegram + WhatsApp, n8n workflows |
| **Marketplace** | ✅ | Agendamiento público sin auth, analytics |
| **Inventario** | ✅ | ABC, alertas, órdenes compra, kardex |
| **POS** | ✅ | Ticket PDF térmico, vendedor auto-asignado |
| **Comisiones** | ✅ | Configuración por profesional, reportes |
| **Configuración Hub** | ✅ | Mi Negocio, Módulos, Apariencia (próximamente) |

---

## Stack Técnico

### Frontend
- React 18 + Vite 7 + Tailwind CSS 3
- Zustand (2 stores) + TanStack Query (28 hooks)
- React Hook Form + Zod
- Axios (auto-refresh JWT)

### Backend
- Node.js + Express.js
- JWT (1h access + 7d refresh) + Token blacklist (Redis)
- Joi schemas (23 archivos)
- Winston logs
- 8 middlewares centralizados

### Base de Datos
- PostgreSQL 17 con pg_cron
- Particionamiento: citas, eventos_sistema, movimientos_inventario
- Row Level Security (93 políticas)
- 86 funciones PL/pgSQL
- 54 tablas en 24 módulos

### IA Conversacional
- Telegram Bot API + WhatsApp Business Cloud API
- OpenRouter (Qwen3-32B) / DeepSeek Chat (fallback)
- PostgreSQL Chat Memory (RLS)
- n8n workflows dinámicos + MCP Server (8 tools)
- Anti-flood Redis + Debouncing 10s

---

## Arquitectura del Backend

### Distribución por Módulo

| Módulo | Controllers | Models | Endpoints | Descripción |
|--------|-------------|--------|-----------|-------------|
| **Core** | 12 | 8 | 76 | Auth, usuarios, organizaciones, suscripciones, ubicaciones |
| **Agendamiento** | 12 | 14 | 79 | Citas, profesionales, servicios, horarios, chatbots |
| **Inventario** | 7 | 7 | 48 | Productos, categorías, proveedores, alertas, órdenes compra |
| **Marketplace** | 3 | 3 | 16 | Perfiles públicos, reseñas, analytics |
| **POS** | 2 | 2 | 13 | Ventas, ticket PDF, reportes |
| **Comisiones** | 3 | 3 | 12 | Cálculo, configuración, reportes |
| **Recordatorios** | 1 | 1 | 5 | Recordatorios de citas |
| **Total** | **40** | **52** | **249** | |

### Middlewares (8 archivos)

| Middleware | Funciones Exportadas | Descripción |
|------------|---------------------|-------------|
| `auth.js` | 7 | JWT, roles, optionalAuth, refreshToken |
| `tenant.js` | 8 | RLS context, multi-tenant, bypass super_admin |
| `subscription.js` | 4 | Verificar plan activo, límites |
| `modules.js` | 4 | Verificar módulos activos |
| `validation.js` | 7 | Joi validation, sanitización XSS |
| `rateLimiting.js` | 9 | Rate limit por IP, usuario, org |
| `asyncHandler.js` | 1 | Wrapper errores async |
| `index.js` | - | Exports centralizados |

---

## Arquitectura del Frontend

### Distribución por Área

| Área | Componentes | Páginas | Descripción |
|------|-------------|---------|-------------|
| Marketplace | 18 | 4 | Perfiles, reseñas, agendamiento público |
| Inventario | 12 | 7 | Productos, kardex, órdenes compra |
| Citas | 11 | 1 | Calendario, modales, filtros |
| Comisiones | 9 | 3 | Dashboard, reportes, configuración |
| POS | 8 | 4 | Venta, carrito, reportes |
| Dashboard | 7 | 1 | Widgets, estadísticas |
| Bloqueos | 6 | 1 | Calendario de bloqueos |
| Profesionales | 5 | 1 | Gestión, horarios |
| Clientes | 4 | 3 | CRUD, walk-in |
| Chatbots | 4 | 1 | Telegram, WhatsApp config |
| Auth | 3 | 6 | Login, registro, activación |
| Super Admin | 3 | 5 | Panel administración plataforma |
| Configuración | - | 3 | Hub, Mi Negocio, Módulos |
| UI Common | 10 | - | Botones, modales, inputs |
| **Total** | **108** | **47** | |

### Hooks Principales (28)

| Categoría | Hooks |
|-----------|-------|
| Core | useAuth, useModulos, useAccesoModulo |
| Agendamiento | useCitas, useProfesionales, useServicios, useHorarios, useBloqueos |
| Clientes | useClientes |
| Inventario | useInventario, useProductos, useCategorias, useProveedores, useOrdenesCompra |
| POS | usePOS, useVentas |
| Marketplace | useMarketplace |
| Comisiones | useComisiones |
| Chatbots | useChatbots |
| Super Admin | useSuperAdmin, useSuperAdminMarketplace |
| Utilidades | useToast, useAppNotifications, useUbicaciones, useEstadisticas, useRecordatorios |

---

## Comandos Esenciales

```bash
npm run dev              # Stack completo (8 contenedores)
npm run logs             # Logs en tiempo real
npm run test:backend     # Tests Jest
npm run clean            # Limpiar todo
```

---

## Navegación Frontend

### Agendamiento (tabs)
```
/citas → /bloqueos → /recordatorios
```
Componente: `AgendamientoNavTabs.jsx`

### Configuración (hub con cards)
```
/configuracion (hub)
  ├── /configuracion/negocio (Mi Negocio)
  ├── /configuracion/modulos (Módulos)
  └── /configuracion/apariencia (próximamente)
```

### Módulos Opcionales (6)
Todos incluidos en suscripción, sin precios individuales:
- Sistema de Agendamiento
- Gestión de Inventario
- Sistema de Comisiones
- Punto de Venta
- Marketplace Público
- Chatbots IA

**Nota**: Core del Sistema está oculto para usuarios (siempre activo internamente).

---

## Flujos de Registro

### Setup Inicial (Primera vez)
```
/setup → crear super_admin (sin org) → auto-login → /superadmin/dashboard
```

**Archivos**:
- `frontend/src/pages/setup/InitialSetup.jsx`
- `backend/app/modules/core/routes/setup.js` (create-superadmin, unified-setup)

**Importante**: Super admin NO tiene organización (usuario de plataforma).

### Registro Nuevo Usuario (Público)
```
/registro → 7 campos → email activación → /activar-cuenta/:token → crear password → auto-login → /home
```

**Archivos**:
- `frontend/src/pages/auth/RegistroPage.jsx`
- `frontend/src/pages/auth/ActivarCuentaPage.jsx`
- `backend/app/modules/core/controllers/auth.controller.js` (registrarSimplificado, activarCuenta)

### Invitación Profesional (Admin invita empleado)
```
Admin crea profesional → email invitación → /registro-invitacion/:token → crear password → auto-login → /home
```

**Archivos**:
- `frontend/src/pages/auth/RegistroInvitacionPage.jsx`
- `backend/app/modules/core/controllers/invitaciones.controller.js`

---

## Orden de Middleware (CRÍTICO)

### Requests Autenticados
```
auth.authenticateToken → tenant.setTenantContext → controller
```

### Requests Públicos
```
auth.optionalAuth → tenant.setTenantContextFromQuery → controller
```

**Regla**: Todo middleware DEBE estar exportado en `middleware/index.js`

---

## Reglas Críticas de Desarrollo

### Backend
1. **RLS SIEMPRE** - `RLSContextManager.query()` o `.transaction()`
2. **withBypass** - Solo para JOINs multi-tabla
3. **asyncHandler** - Obligatorio en todas las routes
4. **Exports middleware** - Todo en `middleware/index.js`

### Frontend
1. **Sanitizar opcionales** - Joi rechaza `""`, usar `undefined`
2. **Invalidar queries** - Tras mutaciones: `queryClient.invalidateQueries()`
3. **Limpiar cache** - Login/Logout: `queryClient.clear()`

### RLS Variable
- **Usar**: `app.current_tenant_id`
- **NO usar**: `app.current_organization_id` (legacy)

---

## Seguridad

### Roles RBAC
| Rol | Org | Permisos |
|-----|-----|----------|
| super_admin | NULL | Usuario plataforma, panel `/superadmin/*`, bypass middlewares |
| admin/propietario | Requerida | CRUD completo en su org |
| empleado | Requerida | Solo módulos en `modulos_acceso` |
| bot | Requerida | READ + CRUD citas (MCP) |

**Nota**: Solo `super_admin` puede tener `organizacion_id = NULL`. Constraint en `01-tablas-core.sql`.

### Middlewares y Super Admin
Los siguientes middlewares hacen bypass para `super_admin`:
- `tenant.js` - No requiere contexto de tenant
- `subscription.js` - No valida suscripción
- `modules.js` - Tiene acceso a todos los módulos

### Contraseñas
- Mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número
- Validación: Frontend Zod + Backend Joi

---

## MCP Tools (8)

| Tool | Descripción | Endpoint Backend |
|------|-------------|------------------|
| listarServicios | Catálogo con precios y duración | `GET /api/v1/servicios` |
| verificarDisponibilidad | Slots libres + `excluir_cita_id` | `GET /api/v1/disponibilidad` |
| buscarCliente | Por teléfono o nombre (auto-detect) | `GET /api/v1/clientes/buscar` |
| buscarCitasCliente | Historial del cliente | `GET /api/v1/citas?cliente_id=X` |
| crearCita | Múltiples servicios, auto-crea cliente | `POST /api/v1/citas` |
| reagendarCita | Validación disponibilidad | `POST /api/v1/citas/:id/reagendar` |
| modificarServiciosCita | Cambiar servicios sin mover fecha | `PUT /api/v1/citas/:id` |
| confirmarCita | Marcar cita como confirmada | `PATCH /api/v1/citas/:id/confirmar-asistencia` |

### Arquitectura MCP

```
Usuario (Telegram/WhatsApp)
    ↓
n8n Workflow (Trigger + Anti-flood Redis + Debouncing 10s)
    ↓
AI Agent (OpenRouter Qwen3-32B / DeepSeek)
    ↓
MCP Server (JSON-RPC 2.0 + JWT 180d)
    ↓
Backend API (RLS context por org)
    ↓
PostgreSQL (políticas RLS)
```

**Archivos clave**:
- `backend/mcp-server/index.js` - Servidor MCP
- `backend/mcp-server/tools/*.js` - 8 herramientas
- `backend/app/flows/generator/workflowGenerator.js` - Factory workflows
- `backend/app/utils/mcpTokenGenerator.js` - JWT MCP

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | Usar `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar a `undefined` |
| Vite HMR no detecta cambios | `docker restart front` + Ctrl+Shift+R |
| RLS policy violation | Verificar `app.current_tenant_id` en política SQL |
| Chatbot no responde | Verificar workflow activo en n8n, revisar logs |
| MCP tool falla | Verificar JWT válido (180d), revisar `mcp-server` logs |
| `showToast is not a function` | useToast retorna `{ success, error, warning, info }`, no `showToast` |

---

## Archivos Críticos

### Core
- `utils/rlsContextManager.js` - RLS Manager
- `utils/helpers.js` - 8 clases helper
- `middleware/index.js` - EXPORTS centralizados

### Registro/Activación
- `modules/core/models/activacion.model.js` - CRUD activaciones
- `modules/core/controllers/auth.controller.js` - Endpoints registro
- `frontend/src/pages/auth/RegistroPage.jsx` - Formulario 7 campos
- `frontend/src/pages/auth/ActivarCuentaPage.jsx` - Crear contraseña

### Invitaciones
- `modules/core/models/invitacion.model.js` - CRUD
- `modules/core/controllers/invitaciones.controller.js` - Endpoints
- `frontend/src/pages/auth/RegistroInvitacionPage.jsx` - Aceptar invitación

### Super Admin (sin organización)
- `modules/core/routes/setup.js` - Endpoints setup inicial
- `frontend/src/pages/setup/InitialSetup.jsx` - Formulario setup
- `frontend/src/components/superadmin/SuperAdminLayout.jsx` - Layout panel
- `middleware/tenant.js` - Bypass para super_admin
- `middleware/subscription.js` - Bypass para super_admin
- `middleware/modules.js` - Bypass para super_admin
- `sql/nucleo/01-tablas-core.sql` - Constraint `organizacion_id IS NOT NULL OR rol = 'super_admin'`

### Chatbots IA
- `backend/mcp-server/` - Servidor MCP completo
- `modules/agendamiento/controllers/chatbot.controller.js` - Orquestación (1062 LOC)
- `modules/agendamiento/models/chatbot-config.model.js` - CRUD chatbots
- `app/flows/generator/` - Generador dinámico workflows
- `app/utils/mcpTokenGenerator.js` - JWT para MCP

### Configuración
- `frontend/src/pages/configuracion/ConfiguracionPage.jsx` - Hub de configuración
- `frontend/src/pages/configuracion/NegocioPage.jsx` - Datos de la organización
- `frontend/src/pages/configuracion/ModulosPage.jsx` - Activación de módulos
- `frontend/src/pages/configuracion/RecordatoriosPage.jsx` - Config recordatorios (parte de Agendamiento)
- `frontend/src/components/agendamiento/AgendamientoNavTabs.jsx` - Tabs Citas/Bloqueos/Recordatorios

---

## Estructura SQL

### Módulos Principales (24 carpetas)

| Módulo | Archivos | Tablas | RLS | Descripción |
|--------|----------|--------|-----|-------------|
| nucleo | 10 | 7 | 8 | Core: orgs, usuarios, planes, subscripciones |
| agendamiento | 5 | 1 | 1 | Profesionales, horarios |
| citas | 6 | 2 | 3 | Citas (particionada), citas_servicios |
| inventario | 11 | 8 | 31 | Productos, movimientos (particionada), órdenes |
| marketplace | 6 | 4 | 9 | Perfiles públicos, reseñas |
| pos | 5 | 2 | 8 | Ventas, detalles |
| comisiones | 5 | 3 | 4 | Comisiones, configuración |
| auditoria | 7 | 2 | 1 | Eventos (particionada), logs |
| chatbots | 4 | 2 | 4 | Configuración, memoria |
| **Total** | **110** | **54** | **93** | |

### Tablas Particionadas (3)

| Tabla | Módulo | Partición | Descripción |
|-------|--------|-----------|-------------|
| citas | citas | RANGE (fecha_cita) mensual | Alta volumetría |
| eventos_sistema | auditoria | RANGE (creado_en) mensual | Auditoría |
| movimientos_inventario | inventario | RANGE (creado_en) mensual | Trazabilidad |

---

**Versión**: 33.0 | **Actualizado**: 30 Nov 2025 | **Estado**: ✅ Production Ready

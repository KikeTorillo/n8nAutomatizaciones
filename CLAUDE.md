# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Visión del Proyecto

**Plataforma SaaS Multi-Tenant** para automatización de agendamiento empresarial con **IA Conversacional** (Telegram, WhatsApp).

---

## Estado Actual del Proyecto

**Última verificación**: 28 Noviembre 2025

| Componente | Estado | Notas |
|------------|--------|-------|
| **Backend API** | ✅ | 40 controllers, 230+ endpoints, 34 models |
| **Frontend React** | ✅ | 108 componentes, 47 páginas, 24 hooks |
| **Registro Simplificado** | ✅ | 7 campos + email activación + auto-login |
| **App Home / Launcher** | ✅ | Grid 12 apps, badges, accesos rápidos |
| **Clientes (Core)** | ✅ | Módulo independiente, ClienteSelector POS |
| **Sistema Invitaciones** | ✅ | Token 64-char, email auto, vinculación profesional-usuario |
| **Base de Datos** | ✅ | 19 módulos SQL, 3 tablas particionadas, 93 RLS |
| **Chatbots IA** | ✅ | 7 MCP tools, Telegram + WhatsApp |
| **Marketplace** | ✅ | Agendamiento público sin auth |
| **Inventario** | ✅ | ABC, alertas, órdenes compra |
| **POS** | ✅ | Ticket PDF térmico, vendedor auto-asignado |

---

## Stack Técnico

### Frontend
- React 18 + Vite 7 + Tailwind CSS 3
- Zustand (2 stores) + TanStack Query (24 hooks)
- React Hook Form + Zod
- Axios (auto-refresh JWT)

### Backend
- Node.js + Express.js
- JWT (1h access + 7d refresh) + Token blacklist
- Joi schemas (20 archivos)
- Winston logs

### Base de Datos
- PostgreSQL 17 con pg_cron
- Particionamiento: citas, eventos_sistema, movimientos_inventario
- Row Level Security (93 políticas)

### IA Conversacional
- Telegram Bot API + WhatsApp Business Cloud API
- DeepSeek Chat + PostgreSQL Chat Memory (RLS)
- n8n workflows + MCP Server (7 tools)

---

## Comandos Esenciales

```bash
npm run dev              # Stack completo (8 contenedores)
npm run logs             # Logs en tiempo real
npm run test:backend     # Tests Jest
npm run clean            # Limpiar todo
```

---

## Flujos de Registro

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
| Rol | Permisos |
|-----|----------|
| super_admin | CRUD en su org + panel `/superadmin/*` |
| admin/propietario | CRUD completo en su org |
| empleado | Solo módulos en `modulos_acceso` |
| bot | READ + CRUD citas (MCP) |

### Contraseñas
- Mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número
- Validación: Frontend Zod + Backend Joi

---

## MCP Tools (7)

| Tool | Descripción |
|------|-------------|
| listarServicios | Catálogo con precios |
| verificarDisponibilidad | Slots + `excluir_cita_id` |
| buscarCliente | Por teléfono o nombre |
| buscarCitasCliente | Historial cliente |
| crearCita | Múltiples servicios |
| reagendarCita | Validación disponibilidad |
| modificarServiciosCita | Cambiar servicios |

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | Usar `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar a `undefined` |
| Vite HMR no detecta cambios | `docker restart front` + Ctrl+Shift+R |
| RLS policy violation | Verificar `app.current_tenant_id` en política SQL |

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

---

**Versión**: 29.0 | **Actualizado**: 28 Nov 2025 | **Estado**: ✅ Production Ready

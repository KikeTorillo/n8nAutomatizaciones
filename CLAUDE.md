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
| **Backend API** | ✅ | 40 controllers, 230+ endpoints, 33 models |
| **Frontend React** | ✅ | 101 componentes, 44 páginas, 24 hooks |
| **App Home / Launcher** | ✅ | Grid 10 apps, badges, accesos rápidos |
| **Sistema Invitaciones** | ✅ | Token 64-char, email auto, vinculación profesional-usuario |
| **Base de Datos** | ✅ | 19 módulos SQL, 3 tablas particionadas, 76+ RLS |
| **Chatbots IA** | ✅ | 7 MCP tools, Telegram + WhatsApp |
| **Marketplace** | ✅ | Agendamiento público sin auth |
| **Inventario** | ✅ | ABC, alertas, órdenes compra |
| **POS** | 85% | Falta: Ticket PDF, Vendedor UI |
| **Email & Pagos** | ✅ | AWS SES, Mercado Pago |

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
- Row Level Security (76+ políticas)
- 235+ índices, 47+ triggers

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

## Sistema de Invitaciones (Nov 2025)

### Flujo Completo
1. Admin crea profesional con email obligatorio
2. Se genera invitación automáticamente (token 64 chars, expira 7 días)
3. Se envía email con URL de registro
4. Profesional accede a `/aceptar-invitacion/:token`
5. Crea cuenta (rol=empleado) y queda vinculado automáticamente

### Arquitectura
```
profesionales
├── usuario_id (FK → usuarios, nullable)
├── modulos_acceso (JSONB)
│   ├── agendamiento: true/false
│   ├── pos: true/false
│   └── inventario: true/false
└── email (requerido para invitación)

invitaciones_profesionales
├── token (64 chars hex, único)
├── profesional_id (FK)
├── email
├── estado (pendiente/aceptada/expirada/cancelada)
└── expira_en (default 7 días)
```

### Endpoints Invitaciones
| Endpoint | Descripción |
|----------|-------------|
| `POST /api/v1/invitaciones` | Crear invitación (auto al crear profesional) |
| `GET /api/v1/invitaciones/validar/:token` | Validar token (público) |
| `POST /api/v1/invitaciones/aceptar` | Aceptar y crear usuario (público) |
| `POST /api/v1/invitaciones/:id/reenviar` | Reenviar invitación |
| `DELETE /api/v1/invitaciones/:id` | Cancelar invitación |

### Experiencia Empleado
- Login redirige a `/home` (no a módulo específico)
- Solo ve apps según `modulos_acceso` del profesional vinculado
- NO ve widgets de suscripción ni "Plan Pro"
- Apps con `adminOnly: true` ocultas para empleados

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
5. **IPs Analytics** - Hashear SHA256 antes de almacenar

### Frontend
1. **Sanitizar opcionales** - Joi rechaza `""`, usar `undefined`
2. **Invalidar queries** - Tras mutaciones: `queryClient.invalidateQueries()`
3. **Limpiar cache** - Login/Logout: `queryClient.clear()`
4. **Arrays en enabled** - `array.length > 0` (arrays vacíos son truthy)

### RLS Variable
- **Usar**: `app.current_tenant_id`
- **NO usar**: `app.current_organization_id` (legacy)

---

## Seguridad

### Roles RBAC
| Rol | Permisos |
|-----|----------|
| super_admin | Acceso total + gestión planes |
| admin/propietario | CRUD completo en su org |
| empleado | Solo módulos en `modulos_acceso` |
| bot | READ + CRUD citas (MCP) |

### Contraseñas
- Mínimo 8 chars, 1 mayúscula, 1 minúscula, 1 número
- Especiales opcionales (mejoran score)
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
| Invitación "email ya registrado" | El email ya existe como usuario |

---

## Archivos Críticos

### Core
- `utils/rlsContextManager.js` - RLS Manager
- `utils/helpers.js` - 8 clases helper
- `middleware/index.js` - EXPORTS centralizados

### Invitaciones
- `sql/negocio/06-invitaciones.sql` - Tabla + RLS
- `modules/core/models/invitacion.model.js` - CRUD
- `modules/core/controllers/invitaciones.controller.js` - Endpoints
- `routes/api/v1/invitaciones.js` - Rutas

### Empleados
- `modules/core/controllers/modulos.controller.js` - Filtrado por rol
- `frontend/src/pages/home/AppHomePage.jsx` - UI filtrada
- `frontend/src/pages/auth/Login.jsx` - Redirect a /home

---

## Métricas

| Área | Cantidad |
|------|----------|
| Controllers | 40 |
| Endpoints | 230+ |
| Models | 33 |
| Componentes React | 101 |
| Hooks TanStack | 24 |
| Políticas RLS | 76+ |
| Tests | 30 archivos |
| Contenedores Docker | 8 |

---

**Versión**: 25.0 | **Actualizado**: 28 Nov 2025 | **Estado**: ✅ Production Ready

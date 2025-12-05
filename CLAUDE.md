# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

**Plataforma ERP SaaS Multi-Tenant** para el mercado latinoamericano con **IA Conversacional** integrada (Telegram, WhatsApp).

---

## Estado Actual

**Última verificación**: 5 Diciembre 2025

| Componente | Métricas |
|------------|----------|
| **Backend** | 48 controllers, 44 models, ~301 endpoints, 20 servicios |
| **Frontend** | 112 componentes, 52 páginas, 30 hooks, 2 stores |
| **SQL** | 61 tablas, 99 políticas RLS, 96 funciones, 67 triggers |
| **MCP Server** | 8 herramientas (JSON-RPC 2.0) |

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 7, Tailwind CSS 3, Zustand, TanStack Query, Zod |
| **Backend** | Node.js, Express.js, JWT (1h access/7d refresh), Joi, Winston, Redis |
| **Database** | PostgreSQL 17, pg_cron, RLS multi-tenant, particionamiento mensual |
| **IA** | OpenRouter (Qwen3-32B), n8n workflows, MCP Server |
| **Storage** | MinIO (S3-compatible) |
| **Infra** | Docker Compose |

---

## Comandos

```bash
npm run dev              # Stack completo
npm run logs             # Logs tiempo real
docker restart front     # Aplicar cambios frontend
docker restart back      # Aplicar cambios backend
```

**Nota**: HMR NO funciona en Docker. Siempre reiniciar contenedor + Ctrl+Shift+R.

---

## Módulos Backend (10)

| Módulo | Controllers | Descripción |
|--------|-------------|-------------|
| **core** | 12 | Auth, usuarios, organizaciones, suscripciones, ubicaciones, pagos |
| **agendamiento** | 12 | Citas, profesionales, servicios, horarios, disponibilidad, chatbots |
| **inventario** | 7 | Productos, categorías, proveedores, alertas, órdenes compra |
| **eventos-digitales** | 7 | Eventos, invitados, mesa de regalos, felicitaciones, plantillas |
| **pos** | 2 | Ventas, reportes, ticket PDF térmico |
| **comisiones** | 3 | Cálculo, configuración, reportes |
| **marketplace** | 3 | Perfiles públicos, reseñas, analytics |
| **storage** | 1 | Archivos MinIO, upload/delete, presigned URLs |
| **recordatorios** | 1 | Recordatorios de citas automáticos |

---

## Middlewares (9)

| Archivo | Función Principal |
|---------|-------------------|
| `auth.js` | JWT, roles, optionalAuth, refreshToken |
| `tenant.js` | RLS context multi-tenant, bypass super_admin |
| `subscription.js` | Plan activo, límites recursos |
| `modules.js` | Módulos activos por organización |
| `validation.js` | Joi validation, sanitización XSS |
| `rateLimiting.js` | Rate limit por IP/usuario/org/plan |
| `storage.js` | Multer config, validación archivos |
| `asyncHandler.js` | Wrapper errores async |
| `index.js` | Exports centralizados + composiciones |

**Orden de Middleware**:
```
# Autenticados
auth.authenticateToken → tenant.setTenantContext → controller

# Públicos
auth.optionalAuth → tenant.setTenantContextFromQuery → controller
```

---

## Frontend - Componentes Principales

| Área | Qty | Descripción |
|------|-----|-------------|
| marketplace | 15 | Perfiles, reseñas, agendamiento público, mapa |
| inventario | 12 | Productos, kardex, órdenes compra (4 subcomponentes) |
| citas | 10 | Calendario día/mes, modales, filtros |
| comisiones | 9 | Dashboard, reportes, configuración |
| pos | 8 | Venta, carrito, cliente selector, devoluciones |
| ui | 8 | Button, Modal, Input, Select, Toast, ConfirmDialog |
| dashboard | 7 | Widgets, estadísticas, setup checklist |
| bloqueos | 6 | Calendario, modales, filtros |
| profesionales | 5 | Gestión, horarios, servicios, stats |

---

## Hooks por Módulo (30)

**Core**: useAuth, useModulos, useAccesoModulo, useToast, useUbicaciones
**Agendamiento**: useCitas, useProfesionales, useServicios, useHorarios, useBloqueos, useTiposBloqueo, useTiposProfesional, useRecordatorios
**Inventario**: useInventario, useProductos, useCategorias, useProveedores, useOrdenesCompra
**Otros**: usePOS, useVentas, useClientes, useComisiones, useMarketplace, useChatbots, useStorage, useEventosDigitales, useSuperAdmin, useEstadisticas

---

## Roles y Seguridad

| Rol | Organización | Permisos |
|-----|--------------|----------|
| `super_admin` | NULL | Plataforma completa, bypass middlewares |
| `admin/propietario` | Requerida | CRUD completo en su org |
| `empleado` | Requerida | Solo módulos en `modulos_acceso` |
| `bot` | Requerida | READ + CRUD citas (MCP) |

---

## MCP Server (Chatbots IA)

```
Usuario (Telegram/WhatsApp)
    ↓
n8n Workflow (Anti-flood Redis + Debouncing 10s)
    ↓
AI Agent (OpenRouter Qwen3-32B)
    ↓
MCP Server (JSON-RPC 2.0 + JWT 180d)
    ↓
Backend API → PostgreSQL (RLS)
```

### Tools (8)

| Tool | Descripción |
|------|-------------|
| listarServicios | Catálogo con precios y duración |
| verificarDisponibilidad | Slots libres (soporta múltiples servicios) |
| buscarCliente | Por teléfono, nombre o sender |
| buscarCitasCliente | Historial del cliente |
| crearCita | Múltiples servicios, auto-crea cliente |
| reagendarCita | Validación disponibilidad |
| modificarServiciosCita | Cambiar servicios sin mover fecha |
| confirmarCita | Marcar cita confirmada |

**Características**: Auto-detección Telegram/WhatsApp, normalización de fechas/horas variadas, soporte 1-10 servicios por cita.

---

## Servicios Backend (20)

| Servicio | Descripción |
|----------|-------------|
| configService | Config centralizada con cache (TTL 60s) |
| emailService | SMTP con templates (reset, activación, invitación) |
| mercadopago.service | Integración pagos MercadoPago |
| n8nService | Gestión workflows n8n |
| n8nCredentialService | Credenciales Telegram/WhatsApp |
| n8nMcpCredentialsService | JWT tokens MCP (180d) |
| ticketPDF.service | Tickets térmicos 80mm |
| tokenBlacklistService | Blacklist JWT con Redis |
| storage/* | MinIO client, image processor, validator |

---

## Estructura SQL

| Módulo | Tablas | Descripción |
|--------|--------|-------------|
| nucleo | 8 | Organizaciones, usuarios, planes, suscripciones |
| negocio | 5 | Profesionales, clientes, servicios |
| citas | 2 | Citas (particionada), citas_servicios |
| inventario | 8 | Productos, movimientos (particionada), órdenes |
| pos | 2 | Ventas, items |
| comisiones | 3 | Config, profesionales, historial |
| marketplace | 4 | Perfiles, reseñas, analytics, categorías |
| eventos-digitales | 6 | Eventos, invitados, mesa regalos, felicitaciones |
| chatbots | 2 | Config, credenciales |
| auditoria | 2 | Eventos (particionada), archivo |

**Tablas Particionadas**: citas, eventos_sistema, movimientos_inventario (RANGE mensual)

---

## Reglas de Desarrollo

### Backend
1. **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
2. **withBypass**: Solo para JOINs multi-tabla
3. **asyncHandler**: Obligatorio en todas las routes
4. **Variable RLS**: Usar `app.current_tenant_id`

### Frontend
1. **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
2. **Invalidar queries**: Tras mutaciones `queryClient.invalidateQueries()`
3. **Limpiar cache**: Login/Logout `queryClient.clear()`

### Mobile-First
```jsx
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
<Button className="w-full sm:w-auto">
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| RLS policy violation | Verificar `app.current_tenant_id` |
| MCP tool falla | Verificar JWT (180d), logs mcp-server |

---

## Archivos Clave

**Backend**: `utils/rlsContextManager.js`, `middleware/index.js`
**Auth**: `modules/core/controllers/auth.controller.js`
**MCP**: `backend/mcp-server/tools/`, `app/utils/mcpTokenGenerator.js`
**Storage**: `services/storage/`, `modules/storage/`

---

**Versión**: 36.0 | **Actualizado**: 5 Dic 2025 | **Estado**: Production Ready

# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

**Plataforma ERP SaaS Multi-Tenant** para el mercado latinoamericano con **IA Conversacional** integrada (Telegram, WhatsApp).

**Módulos**: POS, Inventario, Agendamiento, Clientes, Comisiones, Marketplace, Storage (MinIO)

---

## Estado Actual

**Última verificación**: 4 Diciembre 2025

| Componente | Métricas |
|------------|----------|
| **Backend** | 41 controllers, 38 models, ~274 endpoints |
| **Frontend** | 112 componentes, 47 páginas, 29 hooks |
| **SQL** | 63 tablas, 94 políticas RLS, 88 funciones |
| **Middlewares** | 9 archivos |
| **MCP Server** | 8 herramientas |
| **Storage** | MinIO integrado (85%) |

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 7, Tailwind CSS 3, Zustand (2 stores), TanStack Query, Zod |
| **Backend** | Node.js, Express.js, JWT (1h access/7d refresh), Joi, Winston, Redis |
| **Database** | PostgreSQL 17, pg_cron, RLS, particionamiento |
| **IA** | OpenRouter (Qwen3-32B), n8n workflows, MCP Server |
| **Storage** | MinIO (S3-compatible) |
| **Infra** | Docker Compose (9 contenedores) |

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

## Arquitectura Backend

### Módulos

| Módulo | Descripción |
|--------|-------------|
| **core** | Auth, usuarios, organizaciones, suscripciones, ubicaciones |
| **agendamiento** | Citas, profesionales, servicios, horarios, disponibilidad |
| **inventario** | Productos, categorías, proveedores, alertas, órdenes compra |
| **pos** | Ventas, ticket PDF térmico |
| **comisiones** | Cálculo, configuración, reportes |
| **marketplace** | Perfiles públicos, reseñas, analytics |
| **storage** | Archivos MinIO, upload/delete, presigned URLs |
| **chatbots** | Configuración Telegram/WhatsApp, MCP integration |
| **recordatorios** | Recordatorios de citas automáticos |

### Middlewares (9)

| Archivo | Función Principal |
|---------|-------------------|
| `auth.js` | JWT, roles, optionalAuth, refreshToken |
| `tenant.js` | RLS context, multi-tenant, bypass super_admin |
| `subscription.js` | Plan activo, límites recursos |
| `modules.js` | Módulos activos |
| `validation.js` | Joi validation, sanitización XSS |
| `rateLimiting.js` | Rate limit por IP/usuario/org |
| `storage.js` | Multer config, validación archivos |
| `asyncHandler.js` | Wrapper errores async |
| `index.js` | Exports centralizados + composiciones |

### Orden de Middleware

```
# Autenticados
auth.authenticateToken → tenant.setTenantContext → controller

# Públicos
auth.optionalAuth → tenant.setTenantContextFromQuery → controller
```

---

## Arquitectura Frontend

### Componentes por Área

| Área | Componentes | Descripción |
|------|-------------|-------------|
| marketplace | 19 | Perfiles, reseñas, agendamiento público |
| inventario | 12 | Productos, kardex, órdenes |
| citas | 10 | Calendario, modales |
| comisiones | 9 | Dashboard, reportes |
| pos | 8 | Venta, carrito |
| ui | 8 | Botones, modales, inputs |
| dashboard | 7 | Widgets, estadísticas |
| bloqueos | 6 | Calendario bloqueos |
| profesionales | 5 | Gestión, horarios |
| clientes/chatbots | 4 c/u | CRUD, config |
| storage | 3 | FileUploader, FileList, StorageUsage |
| auth/servicios/superadmin | 3 c/u | Login, CRUD, panel |

### Hooks Principales (29)

**Core**: useAuth, useModulos, useAccesoModulo, useToast
**Agendamiento**: useCitas, useProfesionales, useServicios, useHorarios, useBloqueos, useRecordatorios
**Inventario**: useInventario, useProductos, useCategorias, useProveedores, useOrdenesCompra
**Otros**: usePOS, useVentas, useClientes, useComisiones, useMarketplace, useChatbots, useStorage

---

## Roles y Seguridad

| Rol | Organización | Permisos |
|-----|--------------|----------|
| `super_admin` | NULL | Plataforma completa, bypass middlewares |
| `admin/propietario` | Requerida | CRUD completo en su org |
| `empleado` | Requerida | Solo módulos en `modulos_acceso` |
| `bot` | Requerida | READ + CRUD citas (MCP) |

**Constraint**: Solo `super_admin` puede tener `organizacion_id = NULL`.

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

### Tools

| Tool | Descripción |
|------|-------------|
| listarServicios | Catálogo con precios y duración |
| verificarDisponibilidad | Slots libres |
| buscarCliente | Por teléfono o nombre |
| buscarCitasCliente | Historial del cliente |
| crearCita | Múltiples servicios, auto-crea cliente |
| reagendarCita | Validación disponibilidad |
| modificarServiciosCita | Cambiar servicios sin mover fecha |
| confirmarCita | Marcar cita confirmada |

---

## Storage (MinIO)

**Estado**: 85% implementado

### Módulos Integrados

- Organizaciones (logos)
- Profesionales (fotos)
- Productos (imágenes)
- Servicios (imágenes)
- Clientes (fotos)
- Marketplace (logo, portada, galería)

### Endpoints

```
POST   /api/v1/storage/upload          # Subir archivo
DELETE /api/v1/storage/:id             # Eliminar
GET    /api/v1/storage/files           # Listar
GET    /api/v1/storage/usage           # Uso almacenamiento
GET    /api/v1/storage/presigned/:id   # URL firmada
```

### Frontend

```javascript
import { useUploadArchivo } from '@/hooks/useStorage';

const uploadMutation = useUploadArchivo();
const resultado = await uploadMutation.mutateAsync({
  file,
  folder: 'productos',
  isPublic: true
});
```

---

## Reglas de Desarrollo

### Backend

1. **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
2. **withBypass**: Solo para JOINs multi-tabla
3. **asyncHandler**: Obligatorio en todas las routes
4. **Exports**: Todo middleware en `middleware/index.js`
5. **Variable RLS**: Usar `app.current_tenant_id` (NO `app.current_organization_id`)

### Frontend

1. **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
2. **Invalidar queries**: Tras mutaciones `queryClient.invalidateQueries()`
3. **Limpiar cache**: Login/Logout `queryClient.clear()`

### Mobile-First

```jsx
// Headers
<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

// Grids
<div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">

// Botones
<Button className="w-full sm:w-auto">
```

---

## Estructura SQL

| Carpeta | Contenido |
|---------|-----------|
| nucleo | Organizaciones, usuarios, planes, suscripciones |
| agendamiento | Profesionales, horarios |
| citas | Citas (particionada), citas_servicios |
| inventario | Productos, movimientos (particionada), órdenes |
| pos | Ventas, detalles |
| comisiones | Comisiones, configuración |
| marketplace | Perfiles, reseñas |
| chatbots | Configuración, memoria |
| auditoria | Eventos (particionada), logs |
| storage | archivos_storage, límites |

**Particionadas**: citas, eventos_sistema, movimientos_inventario (RANGE mensual)

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| RLS policy violation | Verificar `app.current_tenant_id` |
| Chatbot no responde | Verificar workflow n8n, revisar logs |
| MCP tool falla | Verificar JWT (180d), logs mcp-server |

---

## Archivos Clave

**Backend Core**: `utils/rlsContextManager.js`, `middleware/index.js`
**Auth**: `modules/core/controllers/auth.controller.js`
**MCP**: `backend/mcp-server/`, `app/utils/mcpTokenGenerator.js`
**Storage**: `services/storage/`, `modules/storage/`, `middleware/storage.js`

---

**Versión**: 35.0 | **Actualizado**: 4 Dic 2025 | **Estado**: Production Ready

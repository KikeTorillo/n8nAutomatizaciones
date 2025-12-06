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
| **Backend** | 51 controllers, 48 models, 385 endpoints, 11 módulos |
| **Frontend** | 118 componentes, 59 páginas, 31 hooks, 2 stores |
| **SQL** | 78 tablas, 113 políticas RLS, 120 funciones, 80 triggers |
| **MCP Server** | 8 herramientas JSON-RPC 2.0 |

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

## Módulos Backend (11)

| Módulo | Controllers | Descripción |
|--------|-------------|-------------|
| **core** | 12 | Auth, usuarios, organizaciones, suscripciones, ubicaciones, pagos |
| **agendamiento** | 12 | Citas, profesionales, servicios, horarios, disponibilidad, chatbots |
| **inventario** | 7 | Productos, categorías, proveedores, alertas, órdenes compra |
| **eventos-digitales** | 7 | Eventos, invitados, mesa de regalos, felicitaciones, plantillas |
| **contabilidad** | 3 | Cuentas contables, asientos, reportes SAT México |
| **pos** | 2 | Ventas, reportes, ticket PDF térmico |
| **comisiones** | 3 | Cálculo, configuración, reportes |
| **marketplace** | 3 | Perfiles públicos, reseñas, analytics |
| **storage** | 1 | Archivos MinIO, upload/delete, presigned URLs |
| **recordatorios** | 1 | Recordatorios de citas automáticos |

---

## Middlewares

| Archivo | Función |
|---------|---------|
| `auth.js` | JWT, roles, optionalAuth, refreshToken |
| `tenant.js` | RLS context multi-tenant, bypass super_admin |
| `subscription.js` | Plan activo, límites recursos |
| `modules.js` | Módulos activos por organización |
| `validation.js` | Joi validation, sanitización XSS |
| `rateLimiting.js` | Rate limit por IP/usuario/org/plan |
| `storage.js` | Multer config, validación archivos |
| `asyncHandler.js` | Wrapper errores async |

**Orden**: `auth.authenticateToken → tenant.setTenantContext → controller`

---

## Roles y Seguridad

| Rol | Permisos |
|-----|----------|
| `super_admin` | Plataforma completa, bypass middlewares, org NULL |
| `admin/propietario` | CRUD completo en su organización |
| `empleado` | Solo módulos en `modulos_acceso` |
| `bot` | READ + CRUD citas (MCP) |

---

## MCP Server (Chatbots IA)

```
Usuario (Telegram/WhatsApp) → n8n Workflow → AI Agent (Qwen3-32B) → MCP Server → Backend API
```

**Tools**: listarServicios, verificarDisponibilidad, buscarCliente, buscarCitasCliente, crearCita, reagendarCita, modificarServiciosCita, confirmarCita

**Características**: Auto-detección Telegram/WhatsApp, normalización fechas/horas, 1-10 servicios por cita, auto-creación de clientes.

---

## Estructura SQL por Módulo

| Módulo | Tablas | Descripción |
|--------|--------|-------------|
| nucleo | 8 | Organizaciones, usuarios, planes, suscripciones |
| negocio | 7 | Profesionales, clientes, servicios |
| contabilidad | 9 | Cuentas, asientos, pólizas, catálogo SAT |
| inventario | 10 | Productos, movimientos, órdenes compra |
| eventos-digitales | 6 | Eventos, invitados, mesa regalos |
| citas | 6 | Citas (particionada), servicios |
| catalogos | 6 | Estados, ciudades, industrias |
| marketplace | 4 | Perfiles, reseñas, analytics |
| auditoria | 3 | Eventos sistema (particionada) |
| comisiones | 3 | Config, historial |
| pos | 2 | Ventas, items |

**Tablas Particionadas**: citas, eventos_sistema (RANGE mensual)

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo para JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en todas las routes
- **Variable RLS**: `app.current_tenant_id`

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Limpiar cache**: `queryClient.clear()` en Login/Logout

### Mobile-First
```jsx
<div className="flex flex-col sm:flex-row gap-4">
<Button className="w-full sm:w-auto">
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | Usar `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| RLS policy violation | Verificar `app.current_tenant_id` |
| MCP tool falla | Verificar JWT (180d), logs mcp-server |

---

## Archivos Clave

| Área | Archivos |
|------|----------|
| **RLS** | `app/utils/rlsContextManager.js` |
| **Middlewares** | `app/middleware/index.js` |
| **Auth** | `modules/core/controllers/auth.controller.js` |
| **MCP Tools** | `mcp-server/tools/*.js` |
| **Storage** | `services/storage/` |

---

**Versión**: 37.0 | **Actualizado**: 5 Dic 2025 | **Estado**: Production Ready

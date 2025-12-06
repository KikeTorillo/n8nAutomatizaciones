# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

**Plataforma ERP SaaS Multi-Tenant** para el mercado latinoamericano con **IA Conversacional** integrada (Telegram, WhatsApp).

---

## Memoria Persistente (Cipher)

Tienes acceso a **Cipher** via MCP para memoria persistente del proyecto. **ÚSALO SIEMPRE**:

- **Guardar información**: Cuando descubras algo importante (bugs, decisiones, patrones), usa `ask_cipher` para almacenarlo
- **Consultar contexto**: Antes de responder preguntas sobre el proyecto, consulta `ask_cipher` para obtener contexto relevante
- **Actualizar estado**: Después de cambios significativos, actualiza la memoria con el nuevo estado

---

## Estado Actual

**Última verificación**: 6 Diciembre 2025

| Componente | Métricas |
|------------|----------|
| **Backend** | 55 controllers, 50 models, 350 endpoints, 12 módulos |
| **Frontend** | 112 componentes, 86 páginas, 32 hooks, 2 stores |
| **SQL** | 72 tablas, 122 políticas RLS, 120 funciones, 79 triggers |
| **MCP Server** | 8 herramientas JSON-RPC 2.0 |

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 7, Tailwind CSS 3, Zustand, TanStack Query, Zod |
| **Backend** | Node.js, Express.js, JWT (1h access/7d refresh), Joi, Winston |
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

## Módulos Backend (12)

| Módulo | Controllers | Descripción |
|--------|-------------|-------------|
| **core** | 12 | Auth, usuarios, organizaciones, suscripciones, ubicaciones, pagos, webhooks |
| **agendamiento** | 13 | Citas (base, operacional, recordatorios), profesionales, servicios, horarios, chatbots |
| **inventario** | 8 | Productos, categorías, proveedores, alertas, órdenes compra, movimientos, reportes |
| **eventos-digitales** | 7 | Eventos, invitados, mesa de regalos, felicitaciones, plantillas, público |
| **contabilidad** | 4 | Cuentas contables, asientos, reportes SAT México |
| **website** | 5 | Páginas, bloques, configuración, público |
| **pos** | 2 | Ventas, reportes |
| **comisiones** | 3 | Cálculo, configuración, estadísticas |
| **marketplace** | 3 | Perfiles públicos, reseñas, analytics |
| **storage** | 1 | Archivos MinIO, presigned URLs |
| **recordatorios** | 1 | Recordatorios citas automáticos |

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

---

## Tablas Particionadas (4)

| Tabla | Particionamiento |
|-------|------------------|
| `citas` | RANGE (fecha_cita) |
| `eventos_sistema` | RANGE (creado_en) |
| `asientos_contables` | RANGE (fecha) |
| `movimientos_inventario` | RANGE (creado_en) |

Mantenimiento automático con **pg_cron** (creación mensual).

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
| **RLS** | `backend/app/utils/rlsContextManager.js` |
| **Middlewares** | `backend/app/middleware/index.js` |
| **Auth** | `backend/app/modules/core/controllers/auth.controller.js` |
| **MCP Tools** | `backend/mcp-server/tools/*.js` |
| **Stores** | `frontend/src/store/authStore.js`, `onboardingStore.js` |

---

**Versión**: 39.0 | **Actualizado**: 6 Dic 2025

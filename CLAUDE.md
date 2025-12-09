# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para el mercado latinoamericano con IA Conversacional integrada.

---

## Memoria Persistente (Cipher)

Tienes acceso a **Cipher** via MCP para memoria persistente. **ÚSALO SIEMPRE**:
- **Guardar**: Cuando descubras bugs, decisiones arquitectónicas o patrones importantes
- **Consultar**: Antes de responder preguntas sobre el proyecto
- **Actualizar**: Después de cambios significativos

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18, Vite 7, Tailwind CSS 3, Zustand 5, TanStack Query 5, Zod 4 |
| **Backend** | Node.js, Express 4, JWT, Joi, Winston |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **IA** | OpenRouter (Qwen3-32B), n8n workflows, MCP Server |
| **Storage** | MinIO (S3-compatible) |
| **Infra** | Docker Compose |

---

## Métricas del Proyecto

| Área | Cantidad |
|------|----------|
| **Backend** | 56 controllers, 52 models, ~117 endpoints, 12 módulos |
| **Frontend** | 115 componentes, 88 páginas, 32 hooks, 2 stores |
| **SQL** | 82 tablas, 123 políticas RLS, 120 funciones, 80 triggers |
| **MCP Server** | 8 herramientas para chatbots IA |

---

## Módulos del Sistema

| Módulo | Descripción |
|--------|-------------|
| **core** | Auth, usuarios, organizaciones, suscripciones, pagos |
| **agendamiento** | Citas, profesionales, servicios, horarios, chatbots |
| **inventario** | Productos, categorías, proveedores, alertas, órdenes compra |
| **eventos-digitales** | Invitaciones, invitados, mesas, QR check-in, seating chart |
| **contabilidad** | Cuentas contables, asientos, reportes SAT México |
| **website** | Páginas, bloques, configuración pública |
| **pos** | Ventas, reportes |
| **comisiones** | Cálculo, configuración, estadísticas |
| **marketplace** | Perfiles públicos, reseñas, analytics |
| **storage** | Archivos MinIO, presigned URLs |
| **recordatorios** | Recordatorios automáticos de citas |

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

## Middlewares (orden de ejecución)

```
auth.authenticateToken → tenant.setTenantContext → controller
```

| Middleware | Función |
|------------|---------|
| `auth.js` | JWT, roles, optionalAuth, refreshToken |
| `tenant.js` | RLS context multi-tenant, bypass super_admin |
| `subscription.js` | Plan activo, límites recursos |
| `modules.js` | Módulos activos por organización |
| `validation.js` | Joi validation, sanitización XSS |
| `rateLimiting.js` | Rate limit por IP/usuario/org/plan |

---

## Roles

| Rol | Permisos |
|-----|----------|
| `super_admin` | Plataforma completa, bypass middlewares |
| `admin/propietario` | CRUD completo en su organización |
| `empleado` | Solo módulos en `modulos_acceso` |
| `bot` | READ + CRUD citas (MCP) |

---

## MCP Server (Chatbots IA)

```
Usuario (Telegram/WhatsApp) → n8n → AI Agent (Qwen3-32B) → MCP Server → Backend API
```

**Tools**: listarServicios, verificarDisponibilidad, buscarCliente, buscarCitasCliente, crearCita, reagendarCita, modificarServiciosCita, confirmarCita

---

## Tablas Particionadas

| Tabla | Particionamiento |
|-------|------------------|
| `citas` | RANGE (fecha_cita) |
| `eventos_sistema` | RANGE (creado_en) |
| `asientos_contables` | RANGE (fecha) |
| `movimientos_inventario` | RANGE (creado_en) |

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

---

## Estructura de Archivos

```
backend/app/
├── modules/           # 12 módulos de negocio
│   └── [modulo]/
│       ├── controllers/
│       ├── models/
│       ├── routes/
│       └── schemas/
├── middleware/        # 9 middlewares
├── utils/             # RLSContextManager, helpers
└── routes/api/v1/     # Router principal

frontend/src/
├── components/        # 115 componentes reutilizables
├── pages/             # 88 páginas (22 secciones)
├── hooks/             # 32 hooks custom
├── store/             # Zustand (auth, onboarding)
└── services/api/      # Endpoints centralizados

sql/
├── [modulo]/          # 26 carpetas de módulos
│   ├── 01-tablas.sql
│   ├── 02-rls-policies.sql
│   └── 03-indices.sql
└── setup/             # Inicialización
```

---

**Actualizado**: 9 Diciembre 2025

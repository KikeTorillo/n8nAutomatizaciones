# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

---

## Memoria Persistente (Cipher)

Usar **Cipher** via MCP:
- **Guardar**: Bugs, decisiones arquitectónicas, patrones
- **Consultar**: Antes de responder preguntas del proyecto
- **Actualizar**: Después de cambios significativos

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, Zustand 5, TanStack Query 5 |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **IA** | OpenRouter (DeepSeek), n8n workflows, MCP Server |

---

## Servicios Docker

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| backend | 3000 | API Express |
| frontend | 8080 | React + Vite |
| postgres | 5432 | PostgreSQL 17 + pg_cron |
| redis | 6379 | Cache y cola n8n |
| mcp-server | 3100 | Tools para AI Agent |
| n8n-main | 5678 | Orquestador workflows |
| minio | 9000/9001 | Object storage |
| qdrant | 6333 | Vector DB |

---

## Capacidades Arquitectónicas

### Workflows de Aprobación
Sistema de aprobaciones para órdenes de compra basado en límites por rol.
- Motor: `backend/app/modules/workflows/services/workflow.engine.js`
- UI: `frontend/src/pages/aprobaciones/AprobacionesPage.jsx`
- Tablas: `workflow_definiciones`, `workflow_instancias`, `workflow_historial`

### Gestión de Módulos
11 módulos activables/desactivables por organización con validación de dependencias.
- Controller: `backend/app/modules/core/controllers/modulos.controller.js`
- Dependencias: pos→inventario, marketplace→agendamiento, chatbots→agendamiento

### Permisos Normalizados
65+ permisos con override por usuario/sucursal. Reemplaza `modulos_acceso` legacy.
- Tablas: `permisos_catalogo`, `permisos_rol`, `permisos_usuario_sucursal`
- Función SQL: `tiene_permiso(usuario_id, sucursal_id, codigo_permiso)`
- API: `/api/v1/permisos/verificar/:codigo`

### Multi-Moneda
Soporte para MXN, COP, USD con conversión en tiempo real.
- Hook: `frontend/src/hooks/useCurrency.js`
- Tablas: `monedas`, `tasas_cambio`, `precios_producto_moneda`, `precios_servicio_moneda`
- POS muestra equivalente USD debajo del total

---

## Comandos

```bash
# Stack
npm run dev              # Levantar todo
npm run logs:all         # Logs backend + frontend + mcp

# Desarrollo
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend

# Base de datos
npm run db:connect       # psql directo
npm run clean:data       # Reset completo (DESTRUCTIVO)
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

---

## Arquitectura

### Middlewares
```
auth.authenticateToken → tenant.setTenantContext → controller
```

### Roles
| Rol | Descripción |
|-----|-------------|
| `super_admin` | Bypass RLS, acceso total plataforma |
| `admin/propietario` | CRUD completo en su organización |
| `empleado` | Permisos via `permisos_usuario_sucursal` |
| `bot` | READ + CRUD citas (MCP) |

### MCP Server (8 tools)
```
Usuario → Telegram/WhatsApp → n8n → AI Agent → MCP Server → Backend API
```

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en routes

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (nunca blue, indigo, purple) - primario: `#753572`
- **Formularios móviles**: Usar `Drawer` (no Modal) - bug iOS Safari

### Componentes UI
| Componente | Uso |
|------------|-----|
| `Drawer` | Formularios (bottom sheet) |
| `Modal` | Confirmaciones y visualización |
| `ConfirmDialog` | Acciones destructivas |

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |

---

## Estructura

```
backend/app/
├── modules/        # 13 módulos (workflows, permisos incluidos)
├── middleware/     # 9 middlewares
└── utils/          # RLSContextManager, RLSHelper, logger

frontend/src/
├── components/     # 130+ componentes
├── pages/          # 100+ páginas
├── hooks/          # 35+ hooks (useCurrency, useWorkflows, usePermisos)
└── store/          # authStore, themeStore

sql/
├── nucleo/         # Permisos, monedas, core
├── workflows/      # Sistema de aprobaciones
└── 18 módulos      # 130+ archivos SQL
```

---

**Actualizado**: 23 Diciembre 2025

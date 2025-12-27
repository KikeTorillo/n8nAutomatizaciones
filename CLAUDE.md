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
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron (particionamiento automático) |
| **IA** | OpenRouter (DeepSeek), Ollama (embeddings), Qdrant (vector search), n8n workflows |

---

## Servicios Docker (11 contenedores)

| Servicio | Puerto | Descripción |
|----------|--------|-------------|
| backend | 3000 | API Express |
| frontend | 8080 | React + Vite |
| postgres | 5432 | PostgreSQL 17 + pg_cron |
| redis | 6379 | Cache, tokens blacklist, cola n8n |
| mcp-server | 3100 | Tools para AI Agent |
| n8n-main | 5678 | Orquestador workflows (UI) |
| n8n-worker | - | Worker (concurrencia=20) |
| minio | 9000/9001 | Object storage S3 |
| qdrant | 6333 | Vector DB (embeddings) |
| ollama | 11434 | LLM local |
| pgadmin | 8001 | Administración BD |

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

## Conexión a Base de Datos

**SIEMPRE usar estos comandos exactos** (no adivinar credenciales):

```bash
# Conexión principal (usar SIEMPRE este)
docker exec -it postgres_db psql -U admin -d postgres

# Listar tablas
\dt

# Describir tabla
\d nombre_tabla

# Salir
\q
```

### Credenciales
| Usuario | Password | Base de Datos | Uso |
|---------|----------|---------------|-----|
| `admin` | `sQCJg3erpXk8CXoB47Si3qOKlYLyCkem` | `postgres` | Admin general |
| `saas_app` | `saas_secure_K7mN9pQ2vX8sL4wE` | `postgres` | App backend (RLS) |
| `n8n_app` | `n8n_secure_R5jB7nM3kF9hP6zY` | `n8n_db` | Workflows n8n |

### Bases de Datos
- `postgres` - BD principal SaaS (125+ tablas)
- `n8n_db` - Workflows y ejecuciones n8n
- `chat_memories_db` - Memorias de conversaciones IA

### Consultas Frecuentes
```sql
-- Usuarios del sistema
SELECT id, email, rol, organizacion_id FROM usuarios;

-- Organizaciones activas
SELECT id, nombre, estado FROM organizaciones WHERE activo = true;

-- Permisos de un usuario
SELECT * FROM permisos_usuario_sucursal WHERE usuario_id = X;

-- Productos con stock
SELECT id, nombre, stock_actual FROM productos WHERE organizacion_id = X;
```

---

## Arquitectura

### Chain de Middlewares
```
auth.authenticateToken → tenant.setTenantContext → [permisos] → controller
```

### Middlewares (11)
`asyncHandler`, `auth`, `tenant`, `permisos`, `rateLimiting`, `subscription`, `validation`, `modules`, `storage`, `onboarding`

### Roles
| Rol | Descripción |
|-----|-------------|
| `super_admin` | Bypass RLS, acceso total plataforma |
| `propietario/admin` | CRUD completo en su organización |
| `empleado` | Permisos vía `permisos_usuario_sucursal` |
| `bot` | READ + CRUD citas (MCP) |

### RLS (Row Level Security)
```javascript
// 80% de casos - gestión automática
await RLSContextManager.query(orgId, async (db) => { ... });

// 20% de casos - control fino
await RLSHelper.withRole(db, 'login_context', async () => { ... });

// Solo JOINs multi-tabla o super_admin
await RLSContextManager.withBypass(async (db) => { ... });
```

### Permisos Normalizados (86 códigos)
- Tablas: `permisos_catalogo` → `permisos_rol` → `permisos_usuario_sucursal` (override)
- SQL: `tiene_permiso(usuario_id, sucursal_id, codigo_permiso)`
- API: `/api/v1/permisos/verificar/:codigo`
- Cache: 5 min en memoria

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **withBypass**: Solo JOINs multi-tabla o super_admin
- **asyncHandler**: Obligatorio en routes
- **Validación**: Joi schemas en cada endpoint

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (nunca blue, indigo, purple) - primario: `#753572`

### Componentes UI
| Componente | Uso |
|------------|-----|
| `Drawer` | Formularios móviles (bottom sheet) - iOS Safari compatible |
| `Modal` | Confirmaciones y visualización |
| `ConfirmDialog` | Acciones destructivas |

---

## Módulos Backend (20)

| Módulo | Controllers | Descripción |
|--------|-------------|-------------|
| **core** | 13 | Auth, usuarios, organizaciones, planes, webhooks, superadmin |
| **inventario** | 12 | Productos, OC, movimientos, valoración FIFO/AVCO, números serie |
| **eventos-digitales** | 9 | Eventos, invitados, galerías, plantillas |
| **agendamiento** | 6 | Citas, horarios, disponibilidad |
| **pos** | 3 | Punto de venta, carrito, métodos pago |
| **workflows** | 2 | Motor de aprobaciones configurable |
| **permisos** | 2 | Sistema normalizado 86 permisos |
| *+13 más* | - | comisiones, contabilidad, marketplace, chatbots, etc. |

**Totales**: 78 controllers, 69 models, 68 routes, 41 schemas Joi

---

## Capacidades Clave

### Workflows de Aprobación
Sistema para órdenes de compra basado en límites por rol.
- Motor: `backend/app/modules/workflows/services/workflow.engine.js`
- Tablas: `workflow_definiciones`, `workflow_instancias`, `workflow_historial`

### Inventario Completo
- **Valoración**: FIFO, LIFO, Promedio Ponderado
- **Números Serie/Lotes**: Tracking individual de productos
- **WMS Básico**: Ubicaciones (Zona → Pasillo → Nivel)
- **Órdenes Compra**: Flujo Borrador → Enviada → Recibida
- **Particionamiento**: `movimientos_inventario` particionado por mes (pg_cron)

### Multi-Moneda
MXN, COP, USD con conversión en tiempo real.
- Hook: `useCurrency.js`
- Tablas: `monedas`, `tasas_cambio`, `precios_*_moneda`

### Multi-Tenancy
- RLS enforced a nivel PostgreSQL
- 124+ políticas RLS activas
- Context: `current_tenant_id`, `current_user_id`, `current_user_role`

---

## Estructura

```
backend/app/
├── modules/        # 20 módulos (78 controllers)
├── middleware/     # 11 middlewares
├── services/       # 15 servicios globales (email, n8n, storage, etc.)
├── utils/          # 9 utils (RLSContextManager, helpers, tokens)
└── core/           # ModuleRegistry, RouteLoader (auto-discovery)

frontend/src/
├── components/     # 147 componentes (25 categorías)
├── pages/          # 114 páginas (27 categorías)
├── hooks/          # 45 hooks especializados
├── store/          # 4 stores Zustand (auth, theme, sucursal, onboarding)
└── services/api/   # 39 endpoints agrupados

sql/
├── 32 directorios  # 173 archivos SQL
├── Particionadas   # citas, movimientos_inventario, eventos_sistema, asientos_contables
└── Tablas          # 125+ tablas con RLS
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| API inventario NS/Lotes | Usar `inventarioApi`, no `ordenesCompraApi` |

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| Alta | 2FA/MFA, Permisos CRUD granular |
| Media | Auditoría cambios, Contratos laborales |
| Baja | App móvil, API Keys por usuario |

---

**Actualizado**: 26 Diciembre 2025

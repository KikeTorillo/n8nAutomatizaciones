# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

---

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

---

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, Zustand 5, TanStack Query 5, React Hook Form + Zod |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **IA** | OpenRouter, Ollama (embeddings), Qdrant (vector search), n8n workflows |

---

## Comandos Esenciales

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

## Base de Datos

```bash
# Conexión (SIEMPRE usar este)
docker exec -it postgres_db psql -U admin -d postgres
```

| Usuario | Base de Datos | Uso |
|---------|---------------|-----|
| `admin` | `postgres` | Admin general |
| `saas_app` | `postgres` | App backend (RLS) |
| `n8n_app` | `n8n_db` | Workflows n8n |

---

## Arquitectura

### Middlewares Chain
```
auth.authenticateToken → tenant.setTenantContext → [permisos] → controller
```

### Roles
| Rol | Descripción |
|-----|-------------|
| `super_admin` | Bypass RLS, acceso total |
| `propietario/admin` | CRUD completo en su organización |
| `empleado` | Permisos vía `permisos_usuario_sucursal` |

### RLS (Row Level Security)
```javascript
// 80% de casos
await RLSContextManager.query(orgId, async (db) => { ... });

// Solo JOINs multi-tabla o super_admin
await RLSContextManager.withBypass(async (db) => { ... });
```

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **asyncHandler**: Obligatorio en routes
- **Validación**: Joi schemas en cada endpoint
- **Contraseñas**: Usar `passwordSchemas` de `schemas/shared/passwords.schema.js`
- **SQL seguro**: NUNCA interpolar variables, siempre `$1`, `$2`

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (primario: `#753572`)
- **Formularios**: React Hook Form + Zod
- **Teléfono México**: Regex `/^[1-9]\d{9}$/` (10 dígitos, no empieza con 0)
- **Hooks CRUD**: Usar `createCRUDHooks` de `@/hooks/factories` (ver patrón abajo)

### Componentes UI (Atomic Design)

```
components/ui/
├── atoms/      # Button, Input, Badge, Label, LoadingSpinner
├── molecules/  # Pagination, StatCard, Toast, SearchInput, EmptyState
├── organisms/  # Modal, Drawer, DataTable, ConfirmDialog
└── templates/  # BasePageLayout, ModuleGuard, ListadoCRUDPage
```

### Patrón ListadoCRUDPage

Para páginas CRUD estándar (reduce ~60% código):

```jsx
import { ListadoCRUDPage } from '@/components/ui';

const COLUMNS = [...];
const INITIAL_FILTERS = { busqueda: '' };
const mapFormData = (data) => ({ entidad: data, mode: data ? 'edit' : 'create' });

export default function MiEntidadPage() {
  return (
    <ListadoCRUDPage
      title="Mi Entidad"
      icon={IconComponent}
      PageLayout={MiPageLayout}
      useListQuery={useMiEntidad}
      useDeleteMutation={useEliminarMiEntidad}
      dataKey="entidades"
      columns={COLUMNS}
      FormDrawer={MiFormDrawer}
      mapFormData={mapFormData}
      initialFilters={INITIAL_FILTERS}
      rowActions={(row, handlers) => <RowActions row={row} {...handlers} />}
      extraModals={{ modal1: { component: Modal1, mapData: (d) => ({ data: d }) }}}
      renderBeforeTable={({ items }) => <CustomComponent items={items} />}
    />
  );
}
```

**NO usar para**: TreeViews jerárquicos (Categorías, Departamentos)

### Patrón createCRUDHooks

Para hooks CRUD estandarizados (reduce ~70% código por archivo):

```javascript
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

const sanitize = createSanitizer([
  'campo_texto',
  { name: 'foreign_key_id', type: 'id' },
  { name: 'campo_numerico', type: 'number' },
]);

const hooks = createCRUDHooks({
  name: 'entidad',
  namePlural: 'entidades',
  api: miApi,
  baseKey: 'entidades',
  apiMethods: { list: 'listar', get: 'obtener', create: 'crear', update: 'actualizar', delete: 'eliminar' },
  sanitize,
  invalidateOnCreate: ['entidades', 'otras-queries'],
  errorMessages: { create: { 409: 'Ya existe' }, delete: { 409: 'Tiene dependencias' } },
  staleTime: STALE_TIMES.SEMI_STATIC,
  responseKey: 'entidades',
});

export const useEntidades = hooks.useList;
export const useEntidad = hooks.useDetail;
export const useCrearEntidad = hooks.useCreate;
export const useActualizarEntidad = hooks.useUpdate;
export const useEliminarEntidad = hooks.useDelete;
```

**Referencia**: `hooks/inventario/useProveedores.js`

---

## Stores Zustand (5)

| Store | Estado Principal | Notas |
|-------|-----------------|-------|
| **authStore** | user, accessToken, isAuthenticated | localStorage |
| **sucursalStore** | sucursalActiva, sucursalesDisponibles | localStorage |
| **themeStore** | theme, resolvedTheme | localStorage |
| **onboardingStore** | formData, registroEnviado, emailEnviado | Usa `partialize` (excluye organizacion_id) |
| **permisosStore** | permisos[], cache 5min | localStorage |

---

## Módulos Principales

| Módulo | Descripción |
|--------|-------------|
| **Agendamiento** | Citas, horarios, servicios, bloqueos |
| **Inventario** | Productos, variantes, NS/Lotes, OC, WMS, valoración |
| **POS** | Ventas, cupones, promociones, sesiones caja |
| **Clientes** | CRM, etiquetas, crédito |
| **Profesionales** | Vista detalle con 7 tabs, edición inline |
| **Vacaciones** | Solicitudes, políticas, saldos |
| **Workflows** | Motor aprobaciones multi-nivel |

**Totales**: 24 módulos backend, 94 controllers, 92 hooks frontend

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| "Rendered fewer hooks" | Mover returns condicionales DESPUÉS de hooks |
| Error 400 con `verificarPermiso` | Enviar `sucursal_id` en body |

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | 2FA/MFA |
| **Alta** | Integraciones Carriers (DHL, FedEx) |
| **Media** | Kitting/BOM |
| **Media** | Facturación CFDI |

---

**Actualizado**: 18 Enero 2026 - Agregado patrón createCRUDHooks

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
- **ParseHelper**: Usar para parseo de query params (ver patrón abajo)
- **BaseCrudController**: Usar para controllers CRUD simples (ver patrón abajo)

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

### Patrón useSucursalContext

Para hooks que dependen de sucursal_id (obtiene automáticamente de store si no se pasa):

```javascript
import { useSucursalContext } from '@/hooks/factories';

// Uso simple - resuelve sucursalId automáticamente
const sucursalId = useSucursalContext(paramSucursalId);

// En queries
export function useMisItems(sucursalIdParam) {
  const sucursalId = useSucursalContext(sucursalIdParam);
  return useQuery({
    queryKey: ['mis-items', sucursalId],
    queryFn: () => api.listar(sucursalId),
    enabled: !!sucursalId,
  });
}
```

**Referencia**: `hooks/factories/createSucursalContextHook.js`

### Patrón Fragmentación de Hooks (>400 LOC)

Para hooks grandes, fragmentar en estructura modular:

```
hooks/almacen/operaciones-almacen/
├── constants.js   # Query keys, tipos, estados, labels
├── queries.js     # useQuery hooks (lectura)
├── mutations.js   # useMutation hooks (escritura)
├── manager.js     # Hook combinado que orquesta todo
└── index.js       # Barrel exports
```

```javascript
// constants.js
export const ENTIDAD_KEYS = {
  all: ['entidad'],
  list: (params) => ['entidad', 'list', params],
  detail: (id) => ['entidad', 'detail', id],
};

// index.js (barrel)
export { ENTIDAD_KEYS } from './constants';
export { useEntidades, useEntidad } from './queries';
export { useCrearEntidad, useActualizarEntidad } from './mutations';
export { useEntidadManager } from './manager';
```

**Referencia**: `hooks/almacen/operaciones-almacen/`

### TanStack Query - Optimizaciones

```javascript
// 1. exact:true en invalidaciones específicas
queryClient.invalidateQueries({
  queryKey: ['sucursal-matriz'],
  exact: true  // Solo invalida esta key exacta
});

// 2. keepPreviousData en listados (evita flash de loading)
useQuery({
  queryKey: ['items', params],
  queryFn: () => api.listar(params),
  placeholderData: keepPreviousData,  // TanStack Query v5
});

// 3. Optimistic updates en mutations
useMutation({
  mutationFn: api.marcarLeida,
  onMutate: async (id) => {
    await queryClient.cancelQueries({ queryKey: ['alertas'] });
    const previous = queryClient.getQueryData(['alertas']);
    queryClient.setQueryData(['alertas'], (old) =>
      old?.map(a => a.id === id ? { ...a, leida: true } : a)
    );
    return { previous };
  },
  onError: (err, id, context) => {
    queryClient.setQueryData(['alertas'], context.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['alertas'] });
  },
});
```

### Patrón ParseHelper (Backend)

Para parseo seguro y consistente de query params en controllers:

```javascript
const { ParseHelper } = require('../../../utils/helpers');

// Parseo individual
const activo = ParseHelper.parseBoolean(req.query.activo);      // 'true' → true, undefined → null
const id = ParseHelper.parseInt(req.query.id);                   // '42' → 42, 'abc' → null
const ids = ParseHelper.parseIntArray(req.query.ids);            // '1,2,3' → [1, 2, 3]

// Paginación estandarizada
const { page, limit, offset } = ParseHelper.parsePagination(req.query, { maxLimit: 100 });

// Parseo completo con schema
const filtros = ParseHelper.parseFilters(req.query, {
  activo: 'boolean',
  categoria_id: 'int',
  busqueda: 'string'
});
```

**Referencia**: `utils/helpers/ParseHelper.js`

### Patrón BaseCrudController (Backend)

Para controllers CRUD simples (~20 líneas vs ~150):

```javascript
const { createCrudController } = require('../../../utils/BaseCrudController');
const MiModel = require('../models/mi.model');

module.exports = createCrudController({
  Model: MiModel,
  resourceName: 'MiEntidad',
  resourceNamePlural: 'mis entidades',
  filterSchema: { activo: 'boolean', tipo: 'string' },
  allowedOrderFields: ['nombre', 'creado_en']
});
```

**Extender con métodos adicionales**:
```javascript
const base = createCrudController({...});
module.exports = {
  ...base,
  miMetodoCustom: asyncHandler(async (req, res) => { ... })
};
```

**Referencia**: `utils/BaseCrudController.js`, `catalogos/controllers/ubicaciones-trabajo.controller.js`

### Patrón ORDER BY Seguro (Backend)

**SIEMPRE** usar whitelist para ORDER BY dinámico:

```javascript
// ✅ CORRECTO - whitelist
const CAMPOS_PERMITIDOS = ['nombre', 'creado_en', 'precio'];
const ordenSeguro = CAMPOS_PERMITIDOS.includes(filtros.orden) ? filtros.orden : 'creado_en';
const direccionSegura = filtros.direccion?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
const query = `SELECT * FROM tabla ORDER BY ${ordenSeguro} ${direccionSegura}`;

// ❌ INCORRECTO - SQL injection vulnerable
const query = `SELECT * FROM tabla ORDER BY ${req.query.orden}`;
```

---

## Stores Zustand (5)

| Store | Estado Principal | Notas |
|-------|-----------------|-------|
| **authStore** | user, accessToken, isAuthenticated | localStorage |
| **sucursalStore** | sucursalActiva, sucursalesDisponibles | localStorage |
| **themeStore** | theme, resolvedTheme | localStorage |
| **onboardingStore** | formData, registroEnviado, emailEnviado | Usa `partialize` (excluye organizacion_id) |
| **permisosStore** | permisos[], cache 5min | localStorage |

### Selectores Zustand (OBLIGATORIO)

**SIEMPRE** usar selectores exportados para evitar re-renders innecesarios:

```javascript
// sucursalStore - selectores disponibles
import { useSucursalStore, selectSucursalActiva, selectGetSucursalId } from '@/store/sucursalStore';

// CORRECTO - usa selector
const sucursalActiva = useSucursalStore(selectSucursalActiva);
const getSucursalId = useSucursalStore(selectGetSucursalId);

// INCORRECTO - causa re-renders en cualquier cambio del store
const sucursalActiva = useSucursalStore((state) => state.sucursalActiva);
```

**Selectores disponibles por store**:
- `sucursalStore`: `selectSucursalActiva`, `selectSucursalesDisponibles`, `selectGetSucursalId`
- `authStore`: `selectUser`, `selectIsAuthenticated`, `selectAccessToken`
- `themeStore`: `selectTheme`, `selectResolvedTheme`

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

**Actualizado**: 18 Enero 2026 - Patrones backend (ParseHelper, BaseCrudController, ORDER BY seguro)

# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, TypeScript, Zustand 5, TanStack Query 5 |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17 (DB: `postgres`, User: `admin`), RLS multi-tenant, pg_cron |
| **Pagos** | MercadoPago (Preapproval API) |

## Comandos Esenciales

```bash
npm run dev              # Levantar todo (docker-compose up)
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

**Contenedores**: `back`, `front`, `postgres_db`, `redis`, `minio_storage`, `pgadmin`

## Arquitectura

### Backend (`backend/app/modules/`)

Módulos autocontenidos con `manifest.json`: auth, core, agendamiento, inventario, pos, website, eventos-digitales, suscripciones-negocio.

**Formato de respuesta** (ResponseHelper):
```json
{ "success": true, "data": <payload>, "message": "...", "timestamp": "..." }
```
Axios: `response.data` = objeto completo → `response.data.data` = payload real.

### Frontend (`frontend/src/`)

```
src/
├── components/
│   ├── ui/                 # Atomic Design (TS): atoms, molecules, organisms, templates
│   ├── editor-framework/   # Framework editores (Website + Invitaciones)
│   └── shared/             # Componentes cross-módulo (UnsplashPicker, AddToCalendar, InvitacionDinamica)
├── constants/              # colors.ts, entityStates.js
├── features/               # Módulos autocontenidos (auth con authStore.ts)
├── hooks/
│   ├── factories/          # createCRUDHooks, createStatusMutationHook, createSearchHook
│   ├── config/             # errorHandlerFactory.ts, queryKeys.ts, queryConfig.js
│   └── <dominio>/          # Hooks por módulo, algunos con subcarpetas (pos/lealtad/, pos/ventas/)
├── lib/                    # params.ts (sanitizeParams), uiConstants/ (.ts con as const)
├── pages/<módulo>/         # Páginas + components/ específicos del módulo
├── services/api/modules/   # APIs tipadas (.ts)
├── store/                  # Stores globales (TS): permisosStore, onboardingStore, createEditorStore
└── types/entities/         # Entity types: cita, cliente, producto, venta, usuario, sucursal, profesional...
```

### Editor Framework (`components/editor-framework/`)

Dos modos: **Bloques** (lista vertical, Website) y **Posición Libre** (X/Y estilo Wix, Invitaciones).

- **Store factory**: `createEditorStore(options)` — Zustand + temporal (undo/redo) + subscribeWithSelector + persist opcional. Exporta `EditorState`, `EditorBloque`, `EditorSelectors`.
- **Hooks**: `useEditorBlockHandlers`, `useArrayItemHandlers`.
- **Common blocks**: `common-blocks/canvas/` — 5 renderers compartidos (Video, Countdown, Separador, Galeria, Texto).
- **Config por módulo**: `blockConfig.jsx`, `invitacionBlocks.jsx`, `themeConfig.js`.

### Modelo de Suscripciones (Dogfooding)

Todas las orgs se suscriben a planes de Nexo Team (org 1) vía `dogfoodingService.js`.

**LimitesHelper** busca SOLO por `organizacion_vinculada_id`:
```sql
WHERE sub.cliente_id IN (SELECT id FROM clientes WHERE organizacion_vinculada_id = $1)
```

### Middlewares Chain
```
auth.authenticateToken → tenant.setTenantContext → tenant.verifyTenantActive → suscripcionActiva → [permisos] → controller
```
Para rutas con `:eventoId`: agregar `requireEvento` después de middlewares comunes.

### RLS (Row Level Security)
```javascript
await RLSContextManager.query(orgId, async (db) => { ... });      // 80% casos
await RLSContextManager.withBypass(async (db) => { ... });        // JOINs, super_admin
```

## Sistema RBAC

| Nivel | Rol | Capacidades |
|-------|-----|-------------|
| 100 | super_admin | Bypass RLS, cross-org |
| 90 | admin | Gestión completa org |
| 80 | propietario | Dashboard/Configuración |
| 10-79 | empleado/supervisor | Operaciones |

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **asyncHandler**: Inline en controllers (`static método = asyncHandler(async (req, res) => {...})`)
- **SQL seguro**: NUNCA interpolar, siempre `$1`, `$2`
- **organizacionId**: Siempre `req.tenant.organizacionId` (no `req.user.organizacion_id`)

### Frontend
- **JSX**: Archivos con JSX DEBEN tener extensión `.jsx`/`.tsx` (Vite lo requiere)
- **TypeScript**: UI components, APIs, hooks, stores y factories son `.ts`/`.tsx`
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Focus**: Usar `focus-visible:` (no `focus:`) para outline/ring en componentes UI. Excepción: `focus:bg-*` en items de menú (mouse+keyboard)
- **Colores**: Importar de `constants/colors.ts` (`BRAND_COLORS`, `TAG_COLORS`). En CSS usar `primary-*` / `var(--color-primary-500)`. NO hardcodear hex.
- **React.memo**: Obligatorio en componentes de lista/tabla
- **Sanitizar**: Joi rechaza `""`, usar `sanitizeParams()` de `lib/params.ts`
- **Desacoplamiento**: Módulos NO importan entre sí. Código compartido va en `editor-framework/` o `components/shared/`. Usar bridges en `shared/` para re-exports cross-módulo
- **Query keys**: Centralizar en `hooks/config/queryKeys.ts`. NO definir keys locales en hooks individuales

## Patrones Frontend

### Factories (hooks/)

```typescript
// CRUD completo — genera useList, useDetail, useCreate, useUpdate, useDelete
const hooks = createCRUDHooks<Entidad>({
  name: 'entidad', namePlural: 'entidades',
  api: miApi, baseKey: 'entidades',
  apiMethods: { list: 'listar', get: 'obtener', create: 'crear', update: 'actualizar', delete: 'eliminar' },
  sanitize: createSanitizer(['campo1', { name: 'campo_id', type: 'id' }]),
});

// Mutaciones de estado
const useCancelar = createStatusMutationHook({
  mutationFn: ({ id }) => miApi.cancelar(id),
  queryKey: 'entidades', successMessage: 'Cancelado', entityName: 'Entidad',
});

// Búsqueda con debounce
const useBuscar = createSearchHook<Entidad>({ key: 'entidades', searchFn: miApi.buscar });
```

### Error Handling (hooks/config/errorHandlerFactory.ts)

```typescript
// Toda mutation debe tener onError — estandarizado con factory
onError: createCRUDErrorHandler('create', 'Producto', { 409: 'Ya existe' })
```

### Templates
- **ListadoCRUDPage**: Template CRUD genérica. Lógica extraída a `useListadoCRUDState.ts`
- **useListadoCRUDState**: Paginación, filtros, modales, query, export CSV, delete, handlers, columnas

### Overlays
- **FormDrawer** (`organisms/FormDrawer.tsx`): Drawer + form + footer estándar
- **useFormDrawer**: open/close + RHF + mutations + toast
- **useDeleteConfirmation**: confirmDelete + deleteConfirmProps
- **useDisclosure**: Estado boolean open/close

### Backend - BaseCrudController
```javascript
module.exports = createCrudController({ Model: MiModel, resourceName: 'MiEntidad', filterSchema: { activo: 'boolean' } });
```

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` con `sanitizeParams()` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| JSX parse error en Vite | Renombrar archivo a `.jsx`/`.tsx` |
| "Sin plan (X/X)" al crear recurso | Verificar `planes_suscripcion_org.limites` tiene el campo |
| TS: `response.data.data` no existe | Backend wraps en `{ data: T }` → usar `(response.data as any).data` |
| TS: Zustand middleware `set` overloads | En factories usar `_set: any` + `const set = _set as SetFn` |

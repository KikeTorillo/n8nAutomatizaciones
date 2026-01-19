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
- **asyncHandler**: Obligatorio en routes y controllers
- **Validación**: Joi schemas con `fields` compartidos
- **SQL seguro**: NUNCA interpolar variables, siempre `$1`, `$2`
- **ORDER BY**: Whitelist obligatoria (ver patrón abajo)

### Frontend

- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (primario: `#753572`)
- **Formularios**: React Hook Form + Zod

### Componentes UI (Atomic Design)

```
components/ui/
├── atoms/      # Button, Input, Badge, Label, LoadingSpinner
├── molecules/  # Pagination, StatCard, Toast, SearchInput, EmptyState (con React.memo)
├── organisms/  # Modal, Drawer, DataTable, ConfirmDialog, StatCardGrid, SmartButtons
│   ├── icon-picker/      # IconPicker modularizado
│   ├── state-nav-tabs/   # StateNavTabs modularizado
│   └── filters/          # AdvancedFilterPanel, FilterChip, etc.
└── templates/  # BasePageLayout, ModuleGuard, ListadoCRUDPage
```

**Optimizaciones aplicadas (Ene 2026):**
- `React.memo` en: StatCard, StatCardGrid, SearchInput, Pagination
- Componentes modulares en subcarpetas con barrel exports directos

---

## Patrones Backend

### Fields Compartidos (Joi)

Usar `fields` de `schemas/shared/common-fields.schema.js` para validaciones repetidas:

```javascript
const { fields } = require('../../../schemas/shared');

const schema = Joi.object({
  nombre: fields.nombre.required(),      // 2-150 chars, trim
  email: fields.email,                   // email válido, lowercase
  telefono: fields.telefono,             // 10 dígitos México
  rfc: fields.rfc,                       // RFC mexicano
  color: fields.colorHex,                // #RRGGBB
  precio: fields.precio,                 // >= 0, 2 decimales
  activo: fields.activo,                 // boolean, default true
});
```

**Campos disponibles**: `nombre`, `descripcion`, `codigo`, `email`, `telefono`, `telefonoGenerico`, `rfc`, `codigoPostal`, `codigoMoneda`, `url`, `precio`, `porcentaje`, `cantidad`, `fecha`, `hora`, `activo`, `colorHex`, `icono`, `orden`, `metadata`, `tags`

**Campos de dirección (v2.1)**: `calle`, `colonia`, `ciudad`, `estado`, `direccion` (objeto completo)

**Precio multi-moneda (v2.1)**: `precioMoneda`, `preciosMultiMoneda`

```javascript
// Ejemplo dirección
const schema = Joi.object({
  ...fields.direccion,  // Incluye calle, colonia, ciudad, estado_id, codigo_postal, pais_id
});

// Ejemplo multi-moneda
const schema = Joi.object({
  precios: fields.preciosMultiMoneda,  // Array de { moneda, precio, precio_compra, etc. }
});
```

### ParseHelper

```javascript
const { ParseHelper } = require('../../../utils/helpers');

const activo = ParseHelper.parseBoolean(req.query.activo);
const { page, limit, offset } = ParseHelper.parsePagination(req.query);
const filtros = ParseHelper.parseFilters(req.query, {
  activo: 'boolean',
  categoria_id: 'int'
});
```

### BaseCrudController

Para controllers CRUD simples (~20 líneas):

```javascript
const { createCrudController } = require('../../../utils/BaseCrudController');

module.exports = createCrudController({
  Model: MiModel,
  resourceName: 'MiEntidad',
  filterSchema: { activo: 'boolean' },
  allowedOrderFields: ['nombre', 'creado_en']
});
```

### ErrorHelper

```javascript
const { ErrorHelper } = require('../../../utils/helpers');

const recurso = await Model.buscarPorId(id);
ErrorHelper.throwIfNotFound(recurso, 'Producto');  // 404 automático
ErrorHelper.throwValidation('Campo requerido');    // 400
ErrorHelper.throwConflict('SKU duplicado');        // 409
```

### Otros Helpers Disponibles

**ValidationHelper** - Validaciones de negocio:
```javascript
const { ValidationHelper } = require('../../../utils/helpers');

ValidationHelper.isValidEmail('user@example.com');  // true
ValidationHelper.isValidRFC('XAXX010101000');       // true
ValidationHelper.isValidPhone('5512345678');        // true
```

**SanitizeHelper** - Limpieza de datos:
```javascript
const { SanitizeHelper } = require('../../../utils/helpers');

SanitizeHelper.sanitizeString(input);       // trim, quitar caracteres peligrosos
SanitizeHelper.sanitizeFilename(name);      // seguro para sistema de archivos
SanitizeHelper.sanitizeForSql(input);       // escapar para SQL (preferir $1, $2)
```

**DateHelper** - Manejo de fechas:
```javascript
const { DateHelper } = require('../../../utils/helpers');

DateHelper.formatDate(date, 'YYYY-MM-DD');  // formato personalizado
DateHelper.toMexicoTimezone(date);          // convertir a zona horaria MX
DateHelper.diffInDays(date1, date2);        // diferencia en días
```

### ORDER BY Seguro

```javascript
// ✅ CORRECTO - whitelist
const CAMPOS_PERMITIDOS = ['nombre', 'creado_en'];
const ordenSeguro = CAMPOS_PERMITIDOS.includes(orden) ? orden : 'creado_en';

// ❌ INCORRECTO - SQL injection
const query = `ORDER BY ${req.query.orden}`;
```

### Optimización N+1 con unnest

Para INSERT múltiple en 1 query:

```javascript
// En lugar de loop con N queries
await db.query(`
  INSERT INTO items (combo_id, producto_id, cantidad)
  SELECT $1, unnest($2::int[]), unnest($3::int[])
`, [comboId, productosIds, cantidades]);
```

### RedisClientFactory (v2.1)

Factory centralizado para clientes Redis. Evita duplicación de código de conexión:

```javascript
const RedisClientFactory = require('../services/RedisClientFactory');

// Obtener cliente (DB 3=blacklist, 4=permisos, 5=cache)
const client = await RedisClientFactory.getClient(4, 'MiServicio');

if (client) {
  await client.set('key', 'value');
} else {
  // Fallback en memoria
  const fallback = RedisClientFactory.getFallbackStore('MiServicio');
  fallback.set('key', { value, timestamp: Date.now() });
}

// Para Pub/Sub (requiere cliente separado)
const subscriber = await RedisClientFactory.createSubscriber(4, 'MiPubSub');
```

---

## Patrones Frontend

### createCRUDHooks

```javascript
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

const sanitize = createSanitizer(['campo_texto', { name: 'id', type: 'id' }]);

const hooks = createCRUDHooks({
  name: 'entidad',
  api: miApi,
  baseKey: 'entidades',
  sanitize,
  usePreviousData: true, // Evita flash de loading en paginación
});

export const useEntidades = hooks.useList;
export const useCrearEntidad = hooks.useCreate;
```

### Queries con sucursalId

Queries que verifican permisos requieren `sucursalId`:

```javascript
const getSucursalId = useSucursalStore(selectGetSucursalId);
const sucursalId = getSucursalId();

useQuery({
  queryKey: ['entidades', sucursalId],
  queryFn: () => api.listar({ sucursalId }),
  enabled: !!sucursalId, // No ejecutar sin sucursal
});
```

### ListadoCRUDPage

Para páginas CRUD estándar (reduce ~60% código):

```jsx
<ListadoCRUDPage
  title="Entidades"
  useListQuery={useEntidades}
  useDeleteMutation={useEliminarEntidad}
  columns={COLUMNS}
  FormDrawer={FormDrawer}
/>
```

### ConfigPageHeader

Para páginas de configuración con header consistente:

```jsx
import { ConfigPageHeader } from '@/components/configuracion';

<ConfigPageHeader
  title="Mi Página"
  subtitle="Descripción breve"
  icon={Settings}
  maxWidth="max-w-5xl"
  actions={<Button>Acción</Button>}
/>
```

### Selectores Zustand

```javascript
// ✅ CORRECTO - usa selector exportado
const sucursalActiva = useSucursalStore(selectSucursalActiva);

// ❌ INCORRECTO - causa re-renders
const sucursalActiva = useSucursalStore(state => state.sucursalActiva);
```

---

## Stores Zustand

| Store | Estado Principal |
|-------|-----------------|
| **authStore** | user, accessToken, isAuthenticated |
| **sucursalStore** | sucursalActiva, sucursalesDisponibles |
| **themeStore** | theme, resolvedTheme |
| **permisosStore** | permisos[], cache 5min |

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| "Rendered fewer hooks" | Mover returns condicionales DESPUÉS de hooks |

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | 2FA/MFA |
| **Alta** | Integraciones Carriers (DHL, FedEx) |
| **Media** | Kitting/BOM |
| **Media** | Facturación CFDI |

---

## Changelog Reciente

### Ene 2026 - Auditoría Backend v2.1

**Correcciones de seguridad:**
- ✅ Eliminado `sanitizeInput()` - middleware inseguro que daba falsa protección
- ✅ Corregido RLSContextManager cleanup - ahora limpia TODAS las variables RLS (incluyendo `bypass_rls`)

**Infraestructura:**
- ✅ Creado `RedisClientFactory` - centraliza conexiones Redis, evita duplicación ~120 líneas
- Refactorizados `permisosCacheService` y `tokenBlacklistService` para usar factory

**Schemas Joi:**
- ✅ Agregados campos de dirección: `calle`, `colonia`, `ciudad`, `estado`, `direccion`
- ✅ Agregados campos multi-moneda: `precioMoneda`, `preciosMultiMoneda`

### Ene 2026 - Mejoras Frontend v2.2

**Optimizaciones de rendimiento:**
- `React.memo` agregado a: StatCard, StatCardGrid, SearchInput, Pagination
- Memoización de columnas con `useMemo` en páginas de listado

**Migraciones ConfigPageHeader:**
- ModulosPage, MonedasPage, NegocioPage, PermisosPage

**Limpieza Atomic Design:**
- Eliminados re-exports innecesarios (IconPicker.jsx, StateNavTabs.jsx en raíz)
- Barrel exports actualizados para importar directo desde subcarpetas modulares

---

**Actualizado**: 18 Enero 2026 - Auditoría Backend v2.1

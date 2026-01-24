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

### Roles (Sistema Dinámico v2.1 - FASE 7 Completada)

Sistema de roles dinámicos por organización. Cada org puede crear roles personalizados.
**IMPORTANTE:** El tipo ENUM `rol_usuario` fue eliminado. Solo usar `rol_id` y `rol_codigo`.

| Campo | Descripción |
|-------|-------------|
| `nivel_jerarquia` | 1-100 (100=super, 80=admin, 50=gerente, 10=empleado) |
| `bypass_permisos` | TRUE = no verifica permisos granulares |
| `es_rol_sistema` | TRUE = rol global (super_admin, bot) |

**Roles de sistema (organizacion_id = NULL):**
- `super_admin` (nivel 100): Bypass RLS, acceso total
- `bot` (nivel 5): Acceso automatizado limitado

**Roles por defecto (creados en cada organización):**
- `propietario` (nivel 90): Dueño de la organización
- `admin` (nivel 80): Administrador con bypass_permisos
- `gerente` (nivel 50): Gestión de equipos
- `empleado` (nivel 10): Permisos vía RBAC

**Backend - RolHelper.js:**
```javascript
const { RolHelper } = require('../utils/helpers');

// Verificaciones
RolHelper.esSuperAdmin(user);           // nivel_jerarquia === 100
RolHelper.tieneBypassPermisos(user);    // bypass_permisos === true
RolHelper.esRolAdministrativo(user);    // nivel_jerarquia >= 80
RolHelper.puedeGestionarUsuario(gestor, objetivo);  // Por jerarquía
```

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
- **Alturas estandarizadas**: Todos los elementos de formulario usan `FORM_ELEMENT_HEIGHTS` (h-10 = 40px para size md)

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
| Query retorna vacío con filtros `null` | En modelos, usar `!= null` en vez de `!== undefined` para filtros opcionales |
| `X.map is not a function` en hooks | Verificar estructura: hooks con `transformList` retornan `{items, paginacion}`, no array |
| Query param no llega al controller | Joi elimina campos no declarados en schema. Verificar que todos los params estén en el schema |

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | 2FA/MFA |
| **Alta** | Integraciones Carriers (DHL, FedEx) |
| **Media** | Kitting/BOM |
| **Media** | Facturación CFDI |

---

## Plan de Pruebas

Documento completo en `/docs/PLAN_PRUEBAS_INTEGRAL.md`

**Estado actual (Semana 6 completada):**
| Módulo | Estado |
|--------|--------|
| Clientes (CRM) | ✅ Probado y corregido |
| Agendamiento/Citas | ✅ Probado (UI homologada) |
| Servicios/Profesionales | ✅ Probado y corregido |
| Inventario | ✅ Probado y corregido |
| Comisiones | ✅ Probado y corregido |
| POS | ✅ Probado y corregido |
| Contabilidad, Sucursales, Ausencias | ✅ Probado y corregido |
| Chatbots IA | ⏳ CRUD OK (conversación pendiente final) |
| Configuración + Workflows | ✅ Probado y corregido (CFG-001/002/003) |
| **RBAC (Permisos)** | ✅ Corregido (SEC-001) |
| **Suscripciones-Negocio** | ✅ E2E Validado (Checkout + Webhooks MP) |

---

## Changelog

### 24 Ene 2026 - MercadoPago E2E Validado + Limpieza Legacy ✅

**Flujo completo de pago con MercadoPago funcionando.**

**Limpieza realizada:**
- Eliminadas variables de entorno legacy (`MERCADOPAGO_ACCESS_TOKEN`, `MERCADOPAGO_SANDBOX_ACCESS_TOKEN`, etc.)
- Eliminados archivos legacy: `config/mercadopago.js`, `routes/api/v1/mercadopago.js`, `mercadopago.api.js`
- Credenciales ahora solo en `conectores_pago_org` (encriptadas AES-256-GCM)

**Configuración MercadoPago:**
```env
# Solo estas variables necesarias
MERCADOPAGO_ENVIRONMENT=sandbox
MERCADOPAGO_TEST_PAYER_EMAIL=test_user_xxx@testuser.com
CREDENTIAL_ENCRYPTION_KEY=<64_chars_hex>
```

**Webhooks:** Configurar en panel MP del Test User Vendedor (Modo productivo, NO Modo de prueba).

**Documentación completa:** `/docs/PLAN_DOGFOODING_NEXO_TEAM.md`

---

### 24 Ene 2026 - FASE 14: Homologación Módulo Suscripciones ✅

**Homologación del módulo suscripciones-negocio con convenciones del proyecto.**

**Cambios en SuscripcionDetailPage:**
- ✅ Usa `BackButton` en lugar de botón manual con ArrowLeft
- ✅ Usa `ViewTabs` en lugar de tabs manuales
- ✅ Usa `LoadingSpinner` en lugar de spinner manual
- ✅ Tab activo en URL con `useSearchParams` (antes en estado local)
- ✅ Tabs con iconos (`User`, `Receipt`, `Clock`)

**Cambios en SuscripcionesListPage:**
- ✅ Usa `SearchInput` en lugar de input manual
- ✅ Usa `navigate()` en lugar de `window.location.href`

**Cambios en PagosPage:**
- ✅ Usa `SearchInput` en `renderFilters`

**Fixes adicionales:**
- `molecules/index.js`: Removido export incorrecto de `SmartButtons` (está en organisms/)

**Páginas ya homologadas (usan `ListadoCRUDPage`):**
- `PlanesPage` ✅
- `CuponesPage` ✅
- `ConectoresPage` ✅

---

### 24 Ene 2026 - FASE 13: Auditoría UI Frontend ✅ COMPLETADO

**Optimización de componentes UI - Fixes críticos y centralización de estilos.**

**FASE 1 - Fixes Críticos:**

| Archivo | Cambio |
|---------|--------|
| `molecules/index.js` | Eliminado export incorrecto de NavDropdown |
| `molecules/ThemeToggle.jsx` | Agregado `React.memo` |
| `molecules/SkeletonTable.jsx` | Agregado `React.memo` a 3 componentes |
| `molecules/Breadcrumb.jsx` | Agregado `React.memo` |

**FASE 2 - Nuevas Constantes UI:**

| Archivo | Exports |
|---------|---------|
| `uiConstants/progress.js` | `PROGRESS_BAR_COLORS`, `PROGRESS_TEXT_COLORS`, `PROGRESS_BAR_SIZES`, `PROGRESS_THRESHOLD_PRESETS`, `getProgressColorByThreshold()` |
| `uiConstants/tabs.js` | `TAB_CONTAINER_STYLES`, `TAB_NAV_STYLES`, `TAB_BUTTON_STYLES`, `TAB_ICON_STYLES`, `getTabButtonStyles()`, `getTabIconStyles()` |
| `uiConstants/filters.js` | `FILTER_PANEL_*`, `FILTER_TOGGLE_BUTTON_STYLES`, `FILTER_COUNT_BADGE`, `FILTER_CHECKBOX_STYLES`, `FILTER_SELECT_STYLES`, `FILTER_SECTION_TITLE`, `FILTER_GRID_LAYOUTS`, `getFilterToggleStyles()` |
| `uiConstants/variants.js` | `TOAST_EXTENDED_VARIANTS`, `TOAST_CONTAINER_STYLES` |

**Uso de constantes:**
```javascript
import {
  PROGRESS_BAR_COLORS,
  getProgressColorByThreshold,
  getTabButtonStyles,
  getFilterToggleStyles,
  TOAST_EXTENDED_VARIANTS,
} from '@/lib/uiConstants';

// Progress bar
const color = getProgressColorByThreshold(percentage, thresholds, colors);
<div className={PROGRESS_BAR_COLORS[color]} />

// Tabs
<button className={getTabButtonStyles(isActive)} />

// Filtros
<button className={getFilterToggleStyles(isOpen)} />

// Toast
const variant = TOAST_EXTENDED_VARIANTS[type];
<div className={cn(variant.bg, variant.border)} />
```

**Componentes actualizados para usar constantes:**
- `molecules/ProgressBar.jsx`
- `molecules/ViewTabs.jsx`
- `molecules/Toast.jsx`
- `organisms/filters/FilterSection.jsx`
- `organisms/filters/AdvancedFilterPanel.jsx`

---

### 24 Ene 2026 - Fix Polling MercadoPago + RLS Bypass ✅ COMPLETADO

**Problema:** El polling de suscripciones encontraba las pendientes pero no podía activarlas.

**Causa raíz:**
1. Los planes pertenecen a Nexo Team (org 1)
2. Las suscripciones pertenecen a clientes (org N)
3. La policy RLS de UPDATE no tenía bypass, bloqueando actualizaciones cross-org

**Solución:**
1. Agregado bypass a policy `suscripciones_update_own`
2. Nuevos métodos en modelo: `cambiarEstadoBypass()`, `procesarCobroExitosoBypass()`
3. Polling y webhooks ahora usan métodos bypass

**Archivos modificados:**
- `sql/suscripciones-negocio/01-tablas.sql` - Policy UPDATE con bypass
- `backend/.../models/suscripciones.model.js` - Métodos bypass
- `backend/.../jobs/polling-suscripciones.job.js` - Usa métodos bypass
- `backend/.../controllers/webhooks.controller.js` - Usa métodos bypass

**Resultado:** 10 suscripciones activadas automáticamente vía polling.

---

### 23 Ene 2026 - FASE 12: Auditoría UI Components ✅

**Optimización de componentes UI para preparación como librería reutilizable.**

**FASE 1 - React.memo agregado a 21 componentes:**
| Carpeta | Componentes |
|---------|-------------|
| `organisms/` | DataTable, DataTableActions, DataTableActionButton, NavDropdown, FilterPanel, FilterChips, MobileNavSelector, GenericNavTabs, TreeNode, TreeView |
| `organisms/filters/` | AdvancedFilterPanel, FilterSection, FilterCheckbox, FilterSelect, SavedSearchList, SavedSearchModal, FilterInput, FilterSelectInput, FilterDateInput, FilterCheckboxInput, FilterPanelBase |

**FASE 2 - Nuevas constantes UI:**
- `uiConstants/inputs.js` - Estilos centralizados para inputs
- `uiConstants/spacing.js` - Escalas de espaciado (GAP, PADDING, MARGIN, SPACE_X, SPACE_Y)

```javascript
import { getInputBaseStyles, GAP, PADDING } from '@/lib/uiConstants';

// Estilos de input con/sin error
const inputStyles = getInputBaseStyles(hasError);

// Espaciado consistente
<div className={GAP.md}>...</div>  // gap-3 (12px)
```

**FASE 3 - Modal scroll lock mejorado:**
- Usa CSS class `.modal-open` en lugar de `style.overflow`
- Más robusto para nested modals y scroll restoration

**Archivos nuevos:**
- `frontend/src/lib/uiConstants/inputs.js`
- `frontend/src/lib/uiConstants/spacing.js`

**Archivos modificados (15):**
- Todos los organisms listados arriba
- `frontend/src/lib/uiConstants/index.js`
- `frontend/src/index.css`

---

### 23 Ene 2026 - Conectores Multi-Tenant + LimitesHelper ✅

**Sistema de conectores de pago multi-tenant.**

```javascript
// Obtener servicio MP para organización
const mpService = await MercadoPagoService.getForOrganization(organizacionId);

// Verificar límites de plan
const { LimitesHelper } = require('../../../utils/helpers');
await LimitesHelper.verificarLimiteOLanzar(organizacionId, 'sucursales', 1);
```

**Tabla:** `conectores_pago_org` (credenciales encriptadas AES-256-GCM)

---

### 22 Ene 2026 - Validación Dogfooding: Fixes Críticos ✅ COMPLETADO

**Auditoría y fixes críticos del sistema de cobros automáticos.**

**FASE 0 - Limpieza de Planes:**
- Eliminados planes legacy `basico` y `enterprise` de la BD
- Solo quedan 2 planes en producción: `trial` y `pro`

**FASE 1 - Bug Crítico Corregido:**
- `backend/.../models/pagos.model.js` - Agregado método `actualizar()` faltante
- Este método es requerido por `cobro.service.js` para guardar IDs del gateway (Stripe/MercadoPago)
- Sin este método, los cobros automáticos fallaban al intentar guardar `payment_intent_id`, `charge_id`, etc.

**FASE 2 - Mejoras de Robustez:**

1. **Matriz de transiciones de estado** (`suscripciones.model.js`):
   ```javascript
   SuscripcionesModel.TRANSICIONES_VALIDAS = {
       'trial': ['activa', 'cancelada', 'vencida', 'pendiente_pago'],
       'pendiente_pago': ['activa', 'cancelada', 'vencida'],
       'activa': ['pausada', 'cancelada', 'vencida', 'suspendida'],
       'pausada': ['activa', 'cancelada'],
       'cancelada': [], // Estado final
       'vencida': ['activa', 'suspendida'],
       'suspendida': ['activa', 'cancelada']
   };
   ```
   - `cambiarEstado()` ahora valida transiciones antes de aplicar
   - Intentar transición inválida retorna error 400

2. **Descuentos recurrentes** (`cobro.service.js`):
   - `_calcularMontoCobro()` ahora considera `duracion_descuento`:
     - `'siempre'`: Descuento permanente en todos los cobros
     - `'meses'`: Descuento por X meses (verifica `meses_activo < meses_duracion`)
     - `'una_vez'`: Solo primer pago (no aplica en cobros recurrentes)

**Archivos modificados:**
- `backend/app/modules/suscripciones-negocio/models/pagos.model.js` (+55 líneas)
- `backend/app/modules/suscripciones-negocio/models/suscripciones.model.js` (+25 líneas)
- `backend/app/modules/suscripciones-negocio/services/cobro.service.js` (refactor método)

---

### 23 Ene 2026 - FASE 7: Limpieza Sistema de Roles ✅ COMPLETADO

**Eliminación completa del sistema legacy de roles ENUM.**

**Cambios SQL:**
- `sql/core/fundamentos/02-tipos-enums-core.sql` - Tipo `rol_usuario` ENUM eliminado
- `sql/nucleo/01-tablas-core.sql` - Columna `rol` eliminada, `rol_id NOT NULL`
- `sql/nucleo/16-tabla-roles.sql` - Vista `v_usuarios_con_rol` sin `rol_enum`

**Cambios Backend:**
- `backend/app/modules/core/models/usuario.model.js`:
  - `crear()`: Solo inserta `rol_id`, no `rol`
  - `cambiarRol()`: Actualiza `rol_id` por código de rol
  - `autenticar()`: `usuarioSeguro` sin campos `rol` y `bypass_permisos`
  - `generarTokens()`: JWT solo tiene `rolId`, no `rol`
  - Todas las queries usan JOIN con `roles` para obtener `rol_codigo`
- `backend/app/middleware/auth.js`:
  - Solo verifica `decoded.rolId` en tokens
  - `req.user` sin campo `rol` legacy
  - `requireRole()` y `requireAdminRole()` usan solo sistema dinámico
- `backend/app/middleware/permisos.js`:
  - Bypass solo por `bypass_permisos`, no por `rol === 'super_admin'`

**Cambios Frontend:**
- `frontend/src/store/authStore.js`:
  - Selectores nuevos: `selectRolCodigo`, `selectNivelJerarquia`, `selectRolNombre`
  - `selectIsAdminValue` usa `nivel_jerarquia >= 80`
  - `createSelectHasRole()` usa `rol_codigo`
- `frontend/src/components/auth/ProtectedRoute.jsx`:
  - `NIVEL_MINIMO_POR_ROL` reemplaza `ROLE_HIERARCHY`
  - `hasRoleAccess()` usa `user.nivel_jerarquia` del backend
- Todos los componentes: `user?.rol` → `user?.rol_codigo` o `user?.nivel_jerarquia`

**Respuesta de login FINAL:**
```javascript
{
  rol_id: 12,
  rol_codigo: 'propietario',    // Para lógica de negocio
  rol_nombre: 'Propietario',    // Para mostrar en UI
  nivel_jerarquia: 80           // Para guards de rutas
  // SIN: rol (ENUM), bypass_permisos
}
```

**IMPORTANTE:** Ejecutar `npm run clean:data` para levantar BD desde cero.

---

### 22 Ene 2026 - Dogfooding COMPLETO ✅ (Fases 2, 5, 6)

**Todas las fases de dogfooding completadas:**
- Fase 2: Auto-vincular orgs como clientes (optimizado INSERT directo)
- Fase 5: SuperAdmin Dashboard + Métricas SaaS
- Fase 6: Pago suscripción → Actualizar plan org

**Archivos modificados:**
- `backend/app/config/constants.js` (NUEVO) - Constantes centralizadas
- `backend/app/modules/clientes/models/cliente.model.js` - INSERT incluye `organizacion_vinculada_id`
- `backend/app/services/dogfoodingService.js` - Eliminado UPDATE extra (vinculación directa)
- `backend/app/services/dogfoodingService.js` - Usa `NEXO_TEAM_ORG_ID` importada
- `backend/app/modules/core/controllers/superadmin.controller.js` - Usa constante importada
- `backend/app/modules/core/models/organizacion.model.js` - Usa constante importada
- `backend/app/modules/suscripciones-negocio/models/suscripciones.model.js` - Método `actualizarOrgVinculadaAlActivar()`
- `backend/app/constants/organizacion.constants.js` - Agregados `plan_actual`, `modulos_activos`

**Constantes disponibles:**
```javascript
const { NEXO_TEAM_ORG_ID, FEATURE_TO_MODULO, MODULOS_BASE } = require('../config/constants');
// NEXO_TEAM_ORG_ID = process.env.NEXO_TEAM_ORG_ID || 1
```

**Flujo activación suscripción:**
Cuando una suscripción trial se convierte en activa (cobro exitoso), automáticamente:
1. Obtiene `organizacion_vinculada_id` del cliente
2. Mapea `features[]` del plan → `modulos_activos`
3. Actualiza `plan_actual` y `modulos_activos` de la org vinculada

---

### 22 Ene 2026 - Módulo Suscripciones-Negocio ✅ COMPLETADO

**Módulo completo de gestión de suscripciones SaaS.**

Ver detalles completos en: `/docs/PLAN_DOGFOODING_NEXO_TEAM.md`

**Resumen:**
- Eliminación sistema viejo (Fase 0)
- Backend: 5 tablas, 8 funciones métricas, 7 rutas, 2 cron jobs
- Frontend: 7 páginas, hooks CRUD, componentes Chart.js
- Validación E2E: CRUD Planes funcional

**Mapeo campos críticos:**
| Frontend | Backend |
|----------|---------|
| `precio` | `precio_mensual` |
| `dias_prueba` | `dias_trial` |
| `caracteristicas[]` | `features[]` |

---

### 21 Ene 2026 - Sistema de Roles Dinámicos (ROLES-001) ✅

Sistema de roles dinámicos por organización. Ver sección "Roles" arriba para uso.

**Endpoints API:**
- `GET/POST/PUT/DELETE /api/v1/roles` - CRUD roles
- `GET/PUT /api/v1/roles/:id/permisos` - Gestión permisos
- `POST /api/v1/roles/:id/copiar-permisos` - Copiar de otro rol

**FASE 7 COMPLETADA** (23 Ene 2026): Columna `rol` ENUM eliminada.

---

### 21 Ene 2026 - Bug Seguridad RBAC (SEC-001) ✅

18 permisos de escritura tenían `valor_default = true`. Corregido a `false`.

---

### Semana 4-6 (19-21 Ene 2026) - Bugs Corregidos

| Bug ID | Módulo | Problema | Archivo |
|--------|--------|----------|---------|
| CFG-001 | Departamentos | Función SQL sin columnas | `sql/organizacion/04-funciones.sql` |
| CFG-002 | Monedas | Tasa como string | `monedas.model.js:223` |
| CFG-003 | Festivos | Falta fecha_fin_recurrencia | `feriados-latam.js:186` |
| AUS-004 | Ausencias | Triple anidación data | `useAusencias.js` |
| CTB-001 | Contabilidad | Columna codigo_sat | `cuentas.model.js` |
| CTB-002 | Contabilidad | RLS policies | Políticas simplificadas |
| COM-002 | Comisiones | Filtro origen | `comisiones.schemas.js` |

---

### Ene 2026 - Backend v2.1 / Frontend v2.2

- `RedisClientFactory` centralizado
- `React.memo` en componentes de paginación
- `FORM_ELEMENT_HEIGHTS` estandarizado (h-10 = 40px)
- Migraciones a `ListadoCRUDPage`

---

**Actualizado**: 24 Enero 2026 (MercadoPago E2E validado + Limpieza legacy)

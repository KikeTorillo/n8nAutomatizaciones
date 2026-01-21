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

---

## Changelog

### 21 Ene 2026 - Bug Seguridad RBAC (SEC-001) ✅ CORREGIDO

**SEC-001 - Sistema RBAC inefectivo (CRÍTICO) - CORREGIDO:**
- **Problema:** 18 permisos tenían `valor_default = true` en tabla `permisos_catalogo`
- **Solución:** Cambiado `valor_default` a `false` en todos los permisos de escritura/operación
- **Archivos:** `sql/nucleo/13-datos-permisos.sql`
- **Estado:** ✅ CORREGIDO

**Permisos corregidos (18):**
- POS: `pos.crear_ventas`, `pos.abrir_caja`, `pos.cerrar_caja`, `pos.gestionar_caja`, `pos.ver_historial`, `pos.reimprimir_tickets`, `pos.canjear_puntos`, `pos.ver_puntos_cliente`
- Agendamiento: `agendamiento.crear_citas`, `agendamiento.editar_citas`, `agendamiento.completar_citas`
- Clientes: `clientes.crear`, `clientes.editar`, `clientes.ver_historial`
- Otros: `inventario.ver_productos`, `contabilidad.ver_cuentas`, `profesionales.ver`, `reportes.exportar`

**Permisos que mantienen `valor_default = true` (solo lectura):**
- `acceso.agendamiento`, `acceso.clientes` - Acceso básico a módulos
- `clientes.ver` - Solo ver listado
- `reportes.ver_ventas`, `reportes.ver_citas` - Solo lectura reportes

### 21 Ene 2026 - Bugs Semana 6 Corregidos (CFG-001, CFG-002, CFG-003)

**CFG-001 - Departamentos corregido:**
- Función SQL `get_arbol_departamentos` no retornaba columnas `codigo`, `descripcion`, `activo`
- Actualizada función en `sql/organizacion/04-funciones.sql` para incluir campos faltantes
- Frontend: `preparePayload` cambiado `|| undefined` a `|| null` para código/descripción
- **Archivos:** `sql/organizacion/04-funciones.sql`, `DepartamentosPage.jsx:93-96`

**CFG-002 - Monedas calculadora corregido:**
- PostgreSQL retorna `tasa` como string (tipo numeric)
- Agregado `parseFloat(tasa.tasa)` en la respuesta de conversión
- **Archivo:** `monedas.model.js:223`

**CFG-003 - Días Festivos corregido:**
- Faltaba `fecha_fin_recurrencia` para feriados con `es_recurrente: true`
- Constraint SQL requiere: `es_recurrente = true AND fecha_fin_recurrencia IS NOT NULL`
- Agregado `fecha_fin_recurrencia: feriado.fijo ? \`${anio + 10}-12-31\` : null`
- Invalidación de queries usaba formato viejo: cambiado a `{ queryKey: ['bloqueos'] }`
- **Archivos:** `feriados-latam.js:186`, `DiasFestivosPage.jsx:127`

### 21 Ene 2026 - Semana 6 Configuración + RBAC (UI Explorada)

**Módulos probados:**
- **Configuración General (Mi Negocio):** Logo, info general, tipo negocio, contacto, regional, POS config
- **Usuarios:** CRUD funcional, vincular con profesional
- **Permisos RBAC:** 95+ permisos organizados por categorías, UI de toggles funcional
- **Workflows:** Editor visual BPMN con drag-drop, 1 workflow de aprobación OC
- **Módulos:** 10 módulos con dependencias, toggles funcionales
- **Departamentos, Puestos, Categorías:** CRUD funcional con jerarquías

**Pendiente:** Validación funcional RBAC (probar con usuario limitado que permisos realmente bloqueen)

### 21 Ene 2026 - Fix Historial/Calendario Ausencias (Semana 5)

**Bug AUS-004 (BUG-021) corregido:**
- Historial "Mis Ausencias" y Calendario mostraban 0 ausencias aunque había 6 días en trámite
- **Causa:** Hooks accedían a `data.data` esperando array, pero estructura real era `data.data.data` (triple anidación por wrapper API)
- **Archivos:** `useAusencias.js`, `vacaciones/queries.js`

### 21 Ene 2026 - Semana 4 Pruebas Completadas

**Módulo Contabilidad - 2 bugs corregidos:**
- **CTB-001**: `cuentas.model.js` usaba columna `codigo_sat` inexistente → Cambiado a `codigo_agrupador`
- **CTB-002**: Políticas RLS de `cuentas_contables` verificaban `app.current_role` que RLSContextManager no configura → Simplificadas a solo verificar `app.current_tenant_id`

**Módulo Sucursales:** Probado CRUD, detalle, transferencias (límite Trial funciona correctamente)

**Módulo Ausencias:** Probado solicitud vacaciones, calendario, dashboard

### 21 Ene 2026 - Fix Filtros Comisiones

**Bug COM-002 corregido:**
- Schema Joi `metricasDashboard` no incluía campo `origen` → Joi lo eliminaba de `req.query`
- Agregado campo `origen` a schemas `metricasDashboard` y nuevo `graficaPorDia`
- Archivos: `comisiones.schemas.js`, `comisiones.js` (routes), `estadisticas.controller.js`, `reportes.model.js`

### 19 Ene 2026 - Estandarización UI Componentes

**FORM_ELEMENT_HEIGHTS centralizado:**
- Nueva constante en `sizes.js`: sm=36px, md=40px, lg=48px, xl=56px
- Componentes actualizados: Button, Input, Select, SearchInput, MultiSelect
- Fix anchos en CitaFormDrawer: Controllers envueltos en `<div className="flex-1">`

### 19 Ene 2026 - Pruebas Módulo Clientes

**3 bugs UX corregidos:**
- `ClienteDetailPage.jsx`: Eliminado stats duplicados del header (solo quedan en SmartButtons)
- `useEtiquetasClientes.js`: Fix invalidación cache con tipos string/number para clienteId

### 20 Ene 2026 - Auditoría Integral

**Bugs críticos corregidos:**
- `etiquetas.map is not a function`: Hooks con `transformList` retornan `{items, paginacion}`, no array
- Filtros booleanos `null`: Cambio `!== undefined` → `!= null` en 9 modelos

**Módulos validados:** Clientes, Inventario, Servicios, Contabilidad, Sucursales

### Ene 2026 - Backend v2.1 / Frontend v2.2

- Eliminado `sanitizeInput()` middleware inseguro
- `RedisClientFactory` centralizado
- `React.memo` en componentes de paginación
- Migraciones a `ListadoCRUDPage`

---

**Actualizado**: 21 Enero 2026 (Sesión 24.2 - Bugs CFG-001/002/003 corregidos)

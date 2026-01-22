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

### Roles (Sistema Dinámico v2.0)

Sistema de roles dinámicos por organización. Cada org puede crear roles personalizados.

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

---

## Changelog

### 22 Ene 2026 - Fase 0: Eliminación Sistema Suscripciones V1 ✅ COMPLETADO

**Objetivo:**
Eliminar sistema antiguo basado en límites (profesionales, clientes, etc.) para implementar modelo simple: $249/usuario/mes (Pro), trial 14 días, sin límites de recursos.

**Archivos SQL modificados (7 archivos):**
- `sql/nucleo/01-tablas-core.sql` - `plan_actual` ENUM → VARCHAR(20)
- `sql/nucleo/03-indices.sql` - Eliminados 18 índices deprecated (líneas 102-183)
- `sql/nucleo/04-rls-policies.sql` - Eliminadas políticas RLS + fix sintaxis (líneas 165-270)
- `sql/nucleo/06-triggers.sql` - Eliminados triggers viejos
- `sql/nucleo/08-funciones-modulos.sql` - Funciones actualizadas (acceso ilimitado)
- `sql/setup/03-grant-permissions.sql` - Eliminado ALTER TABLE metricas_uso_organizacion
- `init-data.sh` - Comentados 5 archivos deprecated en ejecución

**Frontend:**
- `frontend/src/services/api/modules/index.js` - Eliminado import subscripcionesApi

**Sistema eliminado:**
- **4 Tablas:** `planes_subscripcion`, `subscripciones`, `metricas_uso_organizacion`, `historial_subscripciones`
- **4 Funciones:** `verificar_limite_plan()`, `tiene_caracteristica_habilitada()`, `actualizar_metricas_uso()`, `registrar_cambio_subscripcion()`
- **2 ENUMs:** `plan_tipo`, `estado_subscripcion`

**Impacto:**
- ✅ Sistema sin límites de recursos (todo ilimitado)
- ✅ Funciones `tiene_modulo_activo()` y `obtener_modulos_activos()` retornan TRUE/todos los módulos
- ✅ Código comentado deprecated completamente eliminado

**Estado:** ✅ FASE 0 completada

---

### 22 Ene 2026 - Fase 3: Módulo Suscripciones-Negocio (Backend) ✅ COMPLETADO

**Objetivo:**
Crear módulo completo de gestión de suscripciones SaaS que Nexo Team usa internamente y ofrece a clientes.

**SQL (2 archivos, ~1,500 líneas):**
- `sql/suscripciones-negocio/01-tablas.sql` - 5 tablas + 18 índices + 15 políticas RLS
- `sql/suscripciones-negocio/02-funciones-metricas.sql` - 8 funciones SaaS

**Tablas creadas:**
```sql
✅ planes_suscripcion_org      -- Planes por organización
✅ suscripciones_org           -- Suscripciones de clientes
✅ pagos_suscripcion           -- Historial de pagos
✅ cupones_suscripcion         -- Cupones de descuento
✅ webhooks_suscripcion        -- Webhooks recibidos
```

**Funciones métricas SaaS:**
```sql
✅ calcular_mrr(org_id, fecha)           -- Monthly Recurring Revenue
✅ calcular_arr(org_id, fecha)           -- Annual Recurring Revenue
✅ calcular_churn_rate(org_id, mes)      -- Tasa de cancelación
✅ calcular_ltv(org_id)                  -- Lifetime Value
✅ calcular_tasa_crecimiento_mrr()       -- Crecimiento MRR
✅ obtener_suscriptores_por_estado()     -- Distribución por estado
✅ obtener_top_planes()                  -- Planes más vendidos
✅ obtener_ingresos_por_periodo()        -- Análisis temporal
```

**Backend (23 archivos, ~5,200 líneas):**
- **Models (5 archivos):** `planes.model.js`, `suscripciones.model.js`, `pagos.model.js`, `cupones.model.js`, `metricas.model.js`
- **Controllers (6 archivos):** `planes`, `suscripciones`, `pagos`, `cupones`, `metricas`, `webhooks`
- **Routes (6 archivos):** Rutas RESTful con auth + tenant + validation
- **Services (4 archivos):** `cobro.service.js`, `stripe.service.js`, `mercadopago.service.js`, `notificaciones.service.js`
- **Cron Jobs (2 archivos):** `procesar-cobros.job.js` (6AM), `verificar-trials.job.js` (7AM)
- **Schemas:** `suscripciones.schemas.js` con 20+ validaciones Joi
- **Manifest:** `manifest.json` con metadata, pricing, features

**Endpoints registrados (7 rutas):**
```
✅ /api/v1/suscripciones-negocio/planes
✅ /api/v1/suscripciones-negocio/suscripciones
✅ /api/v1/suscripciones-negocio/pagos
✅ /api/v1/suscripciones-negocio/cupones
✅ /api/v1/suscripciones-negocio/metricas
✅ /api/v1/suscripciones-negocio/webhooks/stripe
✅ /api/v1/suscripciones-negocio/webhooks/mercadopago
```

**Correcciones aplicadas:**
- Imports corregidos: `express-async-handler` → `asyncHandler` del middleware
- Validation: `validate` → destructuring de `validation`
- Permisos: `verificarPermisosDinamicos` → `verificarPermiso`
- Manifest: Array routes → Objeto con rutas nombradas
- Índices SQL: Agregado `IF NOT EXISTS` a 18 CREATE INDEX

**Verificación:**
- ✅ PostgreSQL: 216 tablas (5 de suscripciones-negocio)
- ✅ Backend: 7 rutas registradas, 2 cron jobs activos
- ✅ Frontend: Vite server running (port 8080)

**Pendiente (Semana 3-4):**
- ⏳ Frontend - API Client (~350 líneas)
- ⏳ Frontend - Hooks (~500 líneas)
- ⏳ Frontend - UI Completa (7 páginas + componentes)

**Estado:** ✅ BACKEND COMPLETADO | ⏳ FRONTEND PENDIENTE

---

### 21 Ene 2026 - Sistema de Roles Dinámicos (ROLES-001) ✅ IMPLEMENTADO

**Migración de ENUM a Tabla Dinámica:**
Permite que cada organización cree roles personalizados (ej: "Recepcionista", "Gerente de Turno").

**Archivos SQL creados:**
- `sql/nucleo/16-tabla-roles.sql` - Tabla roles, triggers, migración de datos
- `sql/nucleo/17-funciones-permisos-v2.sql` - Funciones actualizadas para usar rol_id

**Backend creado:**
- `backend/app/utils/helpers/RolHelper.js` - Helper centralizado para verificaciones de rol
- `backend/app/modules/core/models/roles.model.js` - Modelo CRUD completo
- `backend/app/modules/core/controllers/roles.controller.js` - Controller con endpoints
- `backend/app/modules/core/routes/roles.js` - Rutas RESTful
- `backend/app/modules/core/schemas/roles.schemas.js` - Validaciones Joi

**Backend modificado:**
- `backend/app/middleware/auth.js` - Carga rol_id, rol_codigo, nivel_jerarquia, bypass_permisos en req.user
- `backend/app/middleware/permisos.js` - Usa bypass_permisos para saltar verificación

**Frontend creado:**
- `frontend/src/services/api/modules/roles.api.js` - Cliente API
- `frontend/src/hooks/sistema/useRoles.js` - React Query hooks
- `frontend/src/pages/configuracion/RolesPage.jsx` - UI CRUD completa

**Campos clave de tabla roles:**
| Campo | Descripción |
|-------|-------------|
| `codigo` | Identificador único ('admin', 'recepcionista') |
| `organizacion_id` | NULL = rol de sistema |
| `nivel_jerarquia` | 1-100 para comparaciones jerárquicas |
| `bypass_permisos` | TRUE = salta verificación de permisos |
| `puede_crear_usuarios` | Permite gestionar usuarios |
| `puede_modificar_permisos` | Permite editar permisos |

**Endpoints API:**
- `GET /api/v1/roles` - Listar roles de la organización
- `POST /api/v1/roles` - Crear rol personalizado
- `PUT /api/v1/roles/:id` - Editar rol
- `DELETE /api/v1/roles/:id` - Eliminar rol (si no tiene usuarios)
- `GET /api/v1/roles/:id/permisos` - Obtener permisos del rol
- `PUT /api/v1/roles/:id/permisos` - Actualizar permisos (batch)
- `POST /api/v1/roles/:id/copiar-permisos` - Copiar permisos de otro rol

**Compatibilidad backward:**
- Columnas `rol` (ENUM) y `rol_id` (FK) coexisten durante transición
- `auth.js` prioriza `rol_id` si existe, fallback a ENUM
- FASE 7 (pendiente): DROP de columna `rol` y tipo ENUM cuando migración completa

**Estado:** ✅ FASES 1-6 completadas, FASE 7 (cleanup) pendiente de ejecutar en producción

---

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

**Actualizado**: 22 Enero 2026 (Sesión 24.4 - Módulo Suscripciones-Negocio Backend + Fase 0 Completada)

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

## Arquitectura

### Middlewares Chain
```
auth.authenticateToken → tenant.setTenantContext → tenant.verifyTenantActive → suscripcionActiva.verificarSuscripcionActiva → [permisos] → controller
```

### Sistema de Suscripciones (Ene 2026)

| Estado | Acceso | Comportamiento |
|--------|--------|----------------|
| `trial`, `activa`, `pendiente_pago` | Completo | Todas las operaciones |
| `grace_period`, `vencida` | Limitado | Solo lectura (GET) |
| `suspendida`, `cancelada` | Bloqueado | Redirect a /planes |

**Bypasses:** Nexo Team (org 1), SuperAdmin (nivel >= 100), rutas exentas (`/login`, `/planes`, `/checkout`, `/mi-plan`, `/setup`)

### Roles (Sistema Dinámico)

| Campo | Descripción |
|-------|-------------|
| `nivel_jerarquia` | 1-100 (100=super, 80=admin, 50=gerente, 10=empleado) |
| `bypass_permisos` | TRUE = no verifica permisos granulares |

**IMPORTANTE:** Solo usar `rol_id` y `rol_codigo` (ENUM eliminado).

```javascript
const { RolHelper } = require('../utils/helpers');
RolHelper.esSuperAdmin(user);           // nivel_jerarquia === 100
RolHelper.esRolAdministrativo(user);    // nivel_jerarquia >= 80
```

### RLS (Row Level Security)
```javascript
// 80% de casos
await RLSContextManager.query(orgId, async (db) => { ... });

// JOINs multi-tabla, super_admin, o webhooks cross-org
await RLSContextManager.withBypass(async (db) => { ... });
```

---

## Reglas de Desarrollo

### Backend

- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **asyncHandler**: Obligatorio en routes y controllers
- **Validación**: Joi schemas con `fields` compartidos
- **SQL seguro**: NUNCA interpolar variables, siempre `$1`, `$2`
- **ORDER BY**: Whitelist obligatoria

### Frontend

- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Invalidar queries**: `queryClient.invalidateQueries()` tras mutaciones
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (primario: `#753572`)
- **React.memo**: Usar en componentes de lista/tabla

### Componentes UI (Atomic Design)

```
components/ui/
├── atoms/      # Button, Input, Badge, Label, LoadingSpinner
├── molecules/  # Pagination, StatCard, Toast, SearchInput, EmptyState
├── organisms/  # Modal, Drawer, DataTable, ConfirmDialog, filters/
└── templates/  # BasePageLayout, ModuleGuard, ListadoCRUDPage
```

---

## Patrones Backend

### Fields Compartidos (Joi)

```javascript
const { fields } = require('../../../schemas/shared');

const schema = Joi.object({
  nombre: fields.nombre.required(),
  email: fields.email,
  telefono: fields.telefono,
  precio: fields.precio,
  activo: fields.activo,
});
```

### Helpers Principales

```javascript
const { ParseHelper, ErrorHelper, RolHelper } = require('../../../utils/helpers');

// Parsing
const { page, limit, offset } = ParseHelper.parsePagination(req.query);
const activo = ParseHelper.parseBoolean(req.query.activo);

// Errores
ErrorHelper.throwIfNotFound(recurso, 'Producto');  // 404
ErrorHelper.throwValidation('Campo requerido');    // 400
ErrorHelper.throwConflict('SKU duplicado');        // 409
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

---

## Patrones Frontend

### createCRUDHooks

```javascript
import { createCRUDHooks, createSanitizer } from '@/hooks/factories';

const hooks = createCRUDHooks({
  name: 'entidad',
  api: miApi,
  baseKey: 'entidades',
  usePreviousData: true,
});

export const useEntidades = hooks.useList;
export const useCrearEntidad = hooks.useCreate;
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

### Selectores Zustand

```javascript
// ✅ CORRECTO
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
| `X.map is not a function` | Verificar estructura: `{items, paginacion}` no array |

---

## Módulo Suscripciones-Negocio

### Arquitectura Billing

```
Nexo Team (org 1) ─── VENDOR
    └── Clientes CRM ←── Organizaciones (organizacion_vinculada_id)
            └── Suscripciones → Al activarse actualiza org.plan_actual
```

**Strategy Pattern:** `PlatformBillingStrategy` (Nexo→Orgs) vs `CustomerBillingStrategy` (Org→Clientes)

### Configuración MercadoPago

Credenciales en `conectores_pago_org` (encriptadas AES-256-GCM).

```env
MERCADOPAGO_ENVIRONMENT=sandbox
CREDENTIAL_ENCRYPTION_KEY=<64_chars_hex>
```

**Webhooks:** Configurar en Test User Vendedor > Modo productivo:
- Eventos: `payments`, `subscription_preapproval`, `subscription_authorized_payment`

### Jobs pg_cron

| Job | Horario | Función |
|-----|---------|---------|
| `suscripciones-grace-period` | 01:00 | Mover a grace_period (7 días sin pago) |
| `suscripciones-suspender` | 02:00 | Suspender grace_period vencido |
| `suscripciones-trials-expirados` | 03:00 | Procesar trials expirados |

**Documentación completa:** `/docs/PLAN_DOGFOODING_NEXO_TEAM.md`

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | Dunning emails (secuencia recordatorios pago) |
| **Alta** | Razón de cancelación obligatoria |
| **Alta** | 2FA/MFA |
| **Media** | Prorrateo en cambios de plan |
| **Media** | Facturación CFDI |
| **Media** | Integraciones Carriers (DHL, FedEx) |

---

## Estado de Pruebas

| Módulo | Estado |
|--------|--------|
| Clientes, Agendamiento, Servicios | ✅ |
| Inventario, Comisiones, POS | ✅ |
| Contabilidad, Sucursales, Ausencias | ✅ |
| RBAC, Configuración, Workflows | ✅ |
| **Suscripciones-Negocio** | ✅ E2E (Checkout, Webhooks, Upgrade/Downgrade) |
| Chatbots IA | ⏳ CRUD OK (conversación pendiente) |

**Próximo:** Validar cancelación de suscripción + crear segunda org de prueba

---

## Changelog Resumido

### 24 Ene 2026 - Sistema Suscripciones Completo

- **Grace Period + Restricción de Acceso**: Middleware `suscripcionActiva.js`, `SubscriptionGuard.jsx`, jobs pg_cron
- **Fix Webhooks MP**: Maneja `status: "processed"`, búsqueda cross-org, actualiza pago existente
- **Strategy Pattern Checkout**: `PlatformBillingStrategy` para dogfooding Nexo→Orgs
- **UI Cleanup**: Eliminadas cards redundantes de navegación, solo KPIs en dashboard

### 23 Ene 2026 - Conectores + Auditoría UI

- **Conectores Multi-Tenant**: `conectores_pago_org` con credenciales encriptadas
- **React.memo**: Agregado a 21+ componentes
- **uiConstants**: Nuevos módulos (inputs, spacing, progress, tabs, filters)

### 22 Ene 2026 - Dogfooding + Roles Dinámicos

- **Sistema Roles v2.1**: ENUM eliminado, solo `rol_id`/`rol_codigo`
- **Auto-vinculación**: Orgs como clientes de Nexo Team
- **Activación suscripción**: Actualiza `plan_actual` y `modulos_activos` de org

### 21 Ene 2026 - Módulo Suscripciones-Negocio

- Backend: 5 tablas, métricas SQL, endpoints CRUD
- Frontend: 7 páginas, hooks, componentes Chart.js
- MercadoPago: Preapproval + Webhooks

---

**Actualizado**: 24 Enero 2026

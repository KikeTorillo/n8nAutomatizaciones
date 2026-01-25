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
npm run dev              # Levantar todo
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

---

## Arquitectura

### Middlewares Chain
```
auth.authenticateToken → tenant.setTenantContext → tenant.verifyTenantActive → suscripcionActiva.verificarSuscripcionActiva → [permisos] → controller
```

### RLS (Row Level Security)
```javascript
// 80% de casos - aislamiento por organización
await RLSContextManager.query(orgId, async (db) => { ... });

// JOINs multi-tabla, super_admin, o webhooks cross-org
await RLSContextManager.withBypass(async (db) => { ... });
```

---

## Sistema RBAC (Roles y Permisos)

### Arquitectura de Jerarquías

```
┌─────────┬────────────────────┬───────────────────────────────────────┐
│ Nivel   │ Rol Default        │ Capacidades                           │
├─────────┼────────────────────┼───────────────────────────────────────┤
│ 100     │ super_admin        │ Acceso TOTAL, bypass RLS, cross-org   │
│ 90      │ admin              │ Gestión completa de la organización   │
│ 80      │ propietario        │ Operaciones completas del negocio     │
│ 50-79   │ (personalizado)    │ Gerentes, supervisores                │
│ 10      │ empleado           │ Operaciones básicas                   │
│ 5       │ cliente            │ Autoservicio (ver sus datos)          │
│ 1       │ bot                │ Automatizaciones con permisos mínimos │
└─────────┴────────────────────┴───────────────────────────────────────┘
```

### Reglas Fundamentales

1. **Solo usar `rol_id` y `rol_codigo`** - ENUM eliminado, sistema 100% dinámico
2. **Protección jerárquica**: Solo puedes gestionar usuarios con nivel inferior al tuyo
3. **Bypass de permisos**: Solo `super_admin` (nivel 100) tiene `bypass_permisos = TRUE`
4. **Roles por organización**: Cada org tiene sus propios roles (excepto `super_admin`, `bot`)
5. **Permisos automáticos**: Al crear un rol, se asignan permisos default según nivel

### Uso en Backend

```javascript
const { RolHelper } = require('../utils/helpers');

// Verificaciones principales
RolHelper.esSuperAdmin(user);           // nivel_jerarquia === 100
RolHelper.esRolAdministrativo(user);    // nivel_jerarquia >= 80
RolHelper.tieneBypassPermisos(user);    // bypass_permisos === true
RolHelper.puedeGestionarUsuario(gestor, objetivo);  // gestor.nivel > objetivo.nivel

// En middleware de permisos
RolHelper.tieneNivelMinimo(user, 50);   // nivel >= 50
RolHelper.puedeModificarPermisos(user); // puede_modificar_permisos === true
```

### Flujo de Verificación de Acceso

```
1. Usuario hace request
2. auth.authenticateToken → extrae user del JWT
3. Si user.bypass_permisos === true → PERMITIR (solo super_admin)
4. Si no → verificar permiso específico en permisos_rol
5. Si tiene override en permisos_usuario → usar override
6. Retornar PERMITIR o DENEGAR
```

### Tablas Clave

| Tabla | Propósito |
|-------|-----------|
| `roles` | Catálogo de roles (por org o sistema) |
| `permisos_catalogo` | Definición de permisos disponibles |
| `permisos_rol` | Permisos asignados a cada rol |
| `permisos_usuario` | Overrides específicos por usuario |

### APIs de Roles

```
GET    /api/v1/roles                    # Listar roles de la org
POST   /api/v1/roles                    # Crear rol personalizado
PUT    /api/v1/roles/:id                # Actualizar rol
DELETE /api/v1/roles/:id                # Eliminar rol
GET    /api/v1/roles/:id/permisos       # Ver permisos del rol
PUT    /api/v1/roles/:id/permisos/:pid  # Actualizar un permiso
POST   /api/v1/roles/:id/copiar-permisos # Copiar de otro rol
```

---

## Sistema de Suscripciones

### Estados y Acceso

| Estado | Acceso | Comportamiento |
|--------|--------|----------------|
| `trial`, `activa`, `pendiente_pago` | Completo | Todas las operaciones |
| `grace_period`, `vencida` | Limitado | Solo lectura (GET) |
| `suspendida`, `cancelada` | Bloqueado | Redirect a /planes |

**Bypasses:** Nexo Team (org 1), SuperAdmin (nivel >= 100), rutas exentas

### Arquitectura Billing

```
Nexo Team (org 1) ─── VENDOR (PlatformBillingStrategy)
    └── Organizaciones ←── Clientes CRM (organizacion_vinculada_id)
            └── Suscripciones → Al activarse actualiza org.plan_actual
```

---

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **asyncHandler**: Obligatorio en routes y controllers
- **Validación**: Joi schemas con `fields` compartidos
- **SQL seguro**: NUNCA interpolar variables, siempre `$1`, `$2`

### Frontend
- **Sanitizar opcionales**: Joi rechaza `""`, usar `undefined`
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (primario: `#753572`)
- **React.memo**: Usar en componentes de lista/tabla

### Componentes UI (Atomic Design)

```
components/ui/
├── atoms/      # Button, Input, Badge, ToggleSwitch
├── molecules/  # StatCard, Toast, EmptyState, FilterFields
├── organisms/  # Modal, Drawer, DataTable, Pagination, SearchFilterBar
└── templates/  # BasePageLayout, ModuleGuard, ListadoCRUDPage
```

---

## Patrones Principales

### Backend - BaseCrudController

```javascript
const { createCrudController } = require('../../../utils/BaseCrudController');

module.exports = createCrudController({
  Model: MiModel,
  resourceName: 'MiEntidad',
  filterSchema: { activo: 'boolean' },
  allowedOrderFields: ['nombre', 'creado_en']
});
```

### Frontend - createCRUDHooks

```javascript
import { createCRUDHooks } from '@/hooks/factories';

const hooks = createCRUDHooks({
  name: 'entidad',
  api: miApi,
  baseKey: 'entidades',
});

export const useEntidades = hooks.useList;
export const useCrearEntidad = hooks.useCreate;
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| `X.map is not a function` | Verificar estructura: `{items, paginacion}` no array |

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | Pruebas E2E de RBAC con usuario profesional |
| **Alta** | Dunning emails (recordatorios de pago) |
| **Media** | 2FA/MFA |
| **Media** | Prorrateo en cambios de plan |

---

## Documentación Adicional

- **Plan de Validación**: `/docs/PLAN_VALIDACION_SISTEMA.md`
- **Cuentas de Prueba**: Ver documento de validación

---

**Actualizado**: 25 Enero 2026

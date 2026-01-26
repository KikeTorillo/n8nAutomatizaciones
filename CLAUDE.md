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
| **Pagos** | MercadoPago (Preapproval API) |
| **IA** | OpenRouter, Ollama (embeddings), Qdrant (vector search), n8n workflows |

---

## Comandos Esenciales

```bash
npm run dev              # Levantar todo (docker-compose up)
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo (user: admin)
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

## Sistema RBAC

| Nivel | Rol | Capacidades |
|-------|-----|-------------|
| 100 | super_admin | Acceso TOTAL, bypass RLS, cross-org |
| 90 | admin | Gestión completa de la organización |
| 50-79 | (personalizado) | Gerentes, supervisores |
| 10 | empleado | Operaciones básicas |
| 5 | cliente | Autoservicio |
| 1 | bot | Automatizaciones |

```javascript
const { RolHelper } = require('../utils/helpers');
RolHelper.esSuperAdmin(user);           // nivel === 100
RolHelper.esRolAdministrativo(user);    // nivel >= 90
RolHelper.puedeGestionarUsuario(gestor, objetivo);  // gestor.nivel > objetivo.nivel
```

---

## Sistema de Suscripciones

### Estados y Acceso

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa`, `pendiente_pago` | ✅ Completo | Normal / Banner info |
| `grace_period` | ⚠️ Solo GET | Banner rojo urgente |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect a `/planes` |

### Bypasses
- `organizacion_id === 1` (Nexo Team)
- `nivel_jerarquia >= 100` (SuperAdmin)
- Rutas exentas: `/auth/*`, `/planes/*`, `/health`

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
- **React.memo**: Obligatorio en componentes de lista/tabla y sus items
- **Cache invalidation**: Siempre usar `refetchType: 'active'`

```javascript
// ✅ Correcto
queryClient.invalidateQueries({ queryKey: ['productos'], refetchType: 'active' });

// ❌ Incorrecto (refetch innecesario de queries inactivas)
queryClient.invalidateQueries({ queryKey: ['productos'] });
```

### Componentes UI (Atomic Design)

```
components/ui/
├── atoms/      # Button, Input, Badge, ToggleSwitch
├── molecules/  # StatCard, Toast, EmptyState, FilterFields
├── organisms/  # Modal, Drawer, DataTable, Pagination
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

const crudHooks = createCRUDHooks({
  name: 'entidad',
  namePlural: 'entidades',
  api: miApi,
  baseKey: 'entidades',
  apiMethods: {
    list: 'listar',
    get: 'obtenerPorId',
    create: 'crear',
    update: 'actualizar',
    delete: 'eliminar',
  },
  staleTime: STALE_TIMES.SEMI_STATIC,
});

export const useEntidades = crudHooks.useList;
export const useEntidad = crudHooks.useDetail;
export const useCrearEntidad = crudHooks.useCreate;
```

---

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| `X.map is not a function` | Verificar estructura: `{items, paginacion}` no array |
| Rate limit bloqueando | `docker exec redis redis-cli FLUSHALL` |

---

## Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | Definir UX de `/planes` (landing vs app) |
| **Media** | Prorrateo en cambios de plan |
| **Baja** | 2FA/MFA |

---

**Actualizado**: 25 Enero 2026

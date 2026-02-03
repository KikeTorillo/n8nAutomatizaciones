# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, Zustand 5, TanStack Query 5, React Hook Form + Zod |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **Pagos** | MercadoPago (Preapproval API) |
| **IA** | OpenRouter, Ollama (embeddings), Qdrant (vector search), n8n workflows |

## Comandos Esenciales

```bash
npm run dev              # Levantar todo (docker-compose up)
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo (user: admin)
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

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

## Sistema RBAC

| Nivel | Rol | Capacidades |
|-------|-----|-------------|
| 100 | super_admin | Acceso TOTAL, bypass RLS, cross-org |
| 90 | admin | Gestión completa de la organización |
| 80 | propietario | Gestión alta, acceso a Dashboard/Configuración |
| 50-79 | supervisor | Gestión de equipo (aprueba vacaciones, registra incapacidades) |
| 10 | empleado | Operaciones básicas |
| 5 | cliente | Autoservicio |

```javascript
const { RolHelper } = require('../utils/helpers');
RolHelper.esSuperAdmin(user);           // nivel === 100
RolHelper.esRolAdministrativo(user);    // nivel >= 90
```

## Sistema de Suscripciones

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa`, `pendiente_pago` | ✅ Completo | Normal |
| `grace_period` | ⚠️ Solo GET | Banner urgente |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect `/planes` |

**Bypasses**: `organizacion_id === 1`, `nivel_jerarquia >= 100`, rutas `/auth/*`, `/planes/*`

### Sincronización de Módulos
```javascript
// Al editar entitlements, respeta preferencias del usuario:
// - Módulos NUEVOS → se activan por defecto
// - Módulos existentes → mantienen estado actual (respeta si usuario desactivó)
// - Módulos que salen del plan → se eliminan
ModulosSyncService.sincronizarPorPlan(planId);
```

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
- **React.memo**: Obligatorio en componentes de lista/tabla
- **Cache invalidation**: `queryClient.invalidateQueries({ queryKey: [...], refetchType: 'active' })`

### Componentes UI (Atomic Design)
```
components/ui/
├── atoms/      # Button, Input, Badge, ToggleSwitch
├── molecules/  # StatCard, ViewTabs, EmptyState, FilterFields
├── organisms/  # Modal, Drawer, DataTable, StateNavTabs
└── templates/  # BasePageLayout, ModuleGuard, ListadoCRUDPage
```

## Patrones Principales

### Backend - BaseCrudController
```javascript
module.exports = createCrudController({
  Model: MiModel,
  resourceName: 'MiEntidad',
  filterSchema: { activo: 'boolean' },
  allowedOrderFields: ['nombre', 'creado_en']
});
```

### Frontend - createCRUDHooks
```javascript
const crudHooks = createCRUDHooks({
  name: 'entidad', namePlural: 'entidades',
  api: miApi, baseKey: 'entidades',
  staleTime: STALE_TIMES.SEMI_STATIC,
});
export const useEntidades = crudHooks.useList;
```

### Navegación con Dropdowns (StateNavTabs)
```javascript
// Tabs con grupos para crear dropdowns en desktop
const tabs = [
  { id: 'mis-items', label: 'Mis Items', icon: User },
  { id: 'equipo-a', label: 'Sección A', icon: IconA },
  { id: 'equipo-b', label: 'Sección B', icon: IconB },
];
const groups = [
  { icon: Users, label: 'Mi Equipo', tabIds: ['equipo-a', 'equipo-b'] },
];
<StateNavTabs tabs={tabs} groups={groups} activeTab={activeTab} onTabChange={setTab} />
```

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| `X.map is not a function` | Verificar estructura: `{items, paginacion}` |

## Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | Website Builder - AI Site Generator |
| **Media** | Stripe Gateway completo |
| **Baja** | 2FA/MFA |

---

**Actualizado**: 2 Febrero 2026

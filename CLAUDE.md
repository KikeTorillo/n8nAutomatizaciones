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

### Jerarquía de Niveles

| Nivel | Rol | Capacidades |
|-------|-----|-------------|
| 100 | super_admin | Acceso TOTAL, bypass RLS, cross-org |
| 90 | admin | Gestión completa de la organización |
| 50-79 | (personalizado) | Gerentes, supervisores |
| 10 | empleado | Operaciones básicas |
| 5 | cliente | Autoservicio |
| 1 | bot | Automatizaciones |

### Reglas Clave

- **Solo `rol_id` y `rol_codigo`** - ENUM eliminado, sistema dinámico
- **Protección jerárquica**: Solo gestionar usuarios con nivel inferior
- **Bypass**: Solo `super_admin` (nivel 100) tiene `bypass_permisos = TRUE`

### Backend - RolHelper

```javascript
const { RolHelper } = require('../utils/helpers');

RolHelper.esSuperAdmin(user);           // nivel === 100
RolHelper.esRolAdministrativo(user);    // nivel >= 90
RolHelper.puedeGestionarUsuario(gestor, objetivo);  // gestor.nivel > objetivo.nivel
```

---

## Sistema de Suscripciones

### Arquitectura Billing

```
Nexo Team (org 1) ─── VENDOR
    └── Organizaciones ←── Clientes CRM (organizacion_vinculada_id)
            └── Suscripciones → org.plan_actual
```

### Estados y Acceso

| Estado | Acceso | UX |
|--------|--------|-----|
| `trial`, `activa`, `pendiente_pago` | ✅ Completo | Normal / Banner info |
| `grace_period` | ⚠️ Solo GET | Banner rojo urgente |
| `pausada`, `suspendida`, `cancelada` | ❌ Bloqueado | Redirect a `/planes` |

### Bypasses del Middleware

- `organizacion_id === 1` (Nexo Team)
- `nivel_jerarquia >= 100` (SuperAdmin)
- Rutas exentas: `/auth/*`, `/planes/*`, `/health`

### Cobros Recurrentes (MercadoPago Preapproval)

**MercadoPago cobra automáticamente** cada período:

```
Checkout → Usuario acepta Preapproval → MP guarda tarjeta
                                              ↓
                                    MP cobra cada mes (automático)
                                              ↓
                                    Webhook "authorized_payment"
                                              ↓
                                    Tu sistema actualiza estado
```

**Nota:** Aplica tanto para Nexo Team como clientes con sus propias credenciales MP.

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
| Rate limit bloqueando | `docker exec redis redis-cli FLUSHALL` |

---

## Gaps Pendientes

| Prioridad | Feature |
|-----------|---------|
| **Alta** | Definir UX de `/planes` (landing vs app) |
| **Media** | Prorrateo en cambios de plan |
| **Baja** | 2FA/MFA |

---

## Documentación

- **Plan de Validación**: `/docs/PLAN_VALIDACION_SISTEMA.md`
- **Cuentas de Prueba**: Ver documento de validación

---

**Actualizado**: 25 Enero 2026

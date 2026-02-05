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
| **IA** | OpenRouter, n8n workflows |

## Comandos Esenciales

```bash
npm run dev              # Levantar todo (docker-compose up)
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo (user: admin)
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

## Arquitectura Modular

### Backend (`backend/app/modules/`)

Cada módulo es autocontenido con `manifest.json`:

```
modules/
├── auth/           # Autenticación (prioridad -10, carga primero)
├── core/           # Usuarios, roles, organizaciones
├── agendamiento/   # Citas, horarios, servicios
├── inventario/     # Productos, stock, movimientos
├── pos/            # Punto de venta
├── website/        # Website builder
└── ...
```

**Estructura de un módulo:**
```
modules/mi-modulo/
├── controllers/
├── models/
├── routes/
├── schemas/
├── services/
└── manifest.json
```

### Frontend (`frontend/src/`)

```
src/
├── features/       # Módulos autocontenidos (auth, etc.)
├── components/
│   ├── ui/         # Atomic Design (atoms, molecules, organisms)
│   └── editor-framework/  # Framework reutilizable para editores
├── hooks/          # Hooks por dominio
├── pages/          # Páginas por módulo
└── store/          # Stores globales (createEditorStore factory)
```

### Editor Framework (`components/editor-framework/`)

Framework compartido para editores de bloques (Invitaciones, Website Builder):

```javascript
// Hooks principales
import {
  useAutosave,      // Autosave con debounce y detección de conflictos
  useDndHandlers,   // Drag & drop genérico para bloques
  useBlockSelection,
  useInlineEditing,
} from '@/components/editor-framework';

// Layout responsive
import {
  EditorLayoutProvider,  // Context para responsive (isMobile, isTablet)
  EditorHeader,          // Header con navegación y publicación
  EditorToolbar,         // Undo/redo, breakpoints, zoom
  BlockPalette,          // Paleta de bloques arrastrables
} from '@/components/editor-framework';

// Store factory con undo/redo
import { createEditorStore } from '@/store/createEditorStore';
```

**Patrón de uso**: El context del editor (ej: `InvitacionEditorContext`) expone estado centralizado (`tema`, `zoom`, `breakpoint`) y usa hooks del framework para lógica reutilizable.

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
| 50-79 | supervisor | Gestión de equipo |
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

### Feature Modules (Frontend)
```javascript
// Importar desde barrel export
import { useAuthStore, authApi, ProtectedRoute } from '@/features/auth';

// Re-exports disponibles en ubicaciones legacy
import { useAuthStore } from '@/store';
import { authApi } from '@/services/api/modules';
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
| **Alta** | Website Builder (reutilizar editor-framework) |
| **Media** | Stripe Gateway completo |
| **Baja** | 2FA/MFA |

---

**Actualizado**: 4 Febrero 2026

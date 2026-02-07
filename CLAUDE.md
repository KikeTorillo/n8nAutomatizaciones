# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, TypeScript, Zustand 5, TanStack Query 5 |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17 (DB: `postgres`, User: `admin`), RLS multi-tenant, pg_cron |
| **Pagos** | MercadoPago (Preapproval API) |

## Comandos Esenciales

```bash
npm run dev              # Levantar todo (docker-compose up)
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

**Contenedores**: `back`, `front`, `postgres_db`, `redis`, `minio_storage`, `pgadmin`

## Arquitectura

### Backend (`backend/app/modules/`)

Módulos autocontenidos con `manifest.json`: auth, core, agendamiento, inventario, pos, website, eventos-digitales, suscripciones-negocio.

### Frontend (`frontend/src/`)

```
src/
├── components/
│   ├── ui/                 # Atomic Design (TypeScript): atoms, molecules, organisms
│   ├── editor-framework/   # Framework editores compartido (ver sección abajo)
│   └── shared/             # Componentes compartidos entre módulos
│       └── media/          # UnsplashPicker (UnsplashModal, UnsplashGrid, useUnsplashSearch)
├── features/               # Módulos autocontenidos (auth)
├── hooks/                  # Hooks por dominio + factories (createCRUDHooks)
├── pages/                  # Páginas por módulo
├── types/                  # Tipos TypeScript (ui.d.ts, organisms.d.ts)
└── store/                  # Stores globales
```

### Editor Framework (`components/editor-framework/`)

Framework compartido entre Website e Invitaciones. Soporta dos modos:
- **Bloques**: Lista vertical arrastrables (useBlockEditor, useDndHandlers, BlockPalette)
- **Posición Libre**: Secciones con elementos X/Y estilo Wix (FreePositionCanvas, createFreePositionStore)

**Paneles unificados** (genéricos, parametrizados por props):
- `ThemeEditorPanel` — Editor de colores/fuentes
- `TemplateGalleryPanel` — Panel compacto para sidebar
- `TemplateGalleryModal` — Modal fullscreen con render props

**Hooks compartidos**:
- `useEditorBlockHandlers` — 6 handlers + DnD para contexts de editor
- `useArrayItemHandlers` — add/remove/change para editores con listas

**Config por módulo** (constantes + previews, extensión `.jsx`):
- `pages/website/config/blockConfig.jsx` — previews registrados en previewRegistry
- `pages/eventos-digitales/editor/config/invitacionBlocks.jsx` — ídem
- `pages/*/config/themeConfig.js` — constantes de tema

### Modelo de Suscripciones (Dogfooding)

Todas las organizaciones se suscriben a planes de Nexo Team (org 1) vía dogfooding:

```
Org 1 (Nexo Team) → crea planes en planes_suscripcion_org
                   → dogfoodingService crea cliente con organizacion_vinculada_id = org_nueva
                   → crea suscripcion_org con organizacion_id=1, cliente_id=cliente_vinculado
```

**LimitesHelper** busca suscripción SOLO por dogfooding:
```sql
WHERE sub.cliente_id IN (SELECT id FROM clientes WHERE organizacion_vinculada_id = $1)
```
NO usar `sub.organizacion_id = $1` — eso matchea suscripciones de clientes de la org, no la suscripción de la org misma.

### Middlewares Chain
```
auth.authenticateToken → tenant.setTenantContext → tenant.verifyTenantActive → suscripcionActiva → [permisos] → controller
```

Para rutas con `:eventoId`: agregar `requireEvento` después de middlewares comunes.

### RLS (Row Level Security)
```javascript
await RLSContextManager.query(orgId, async (db) => { ... });      // 80% casos
await RLSContextManager.withBypass(async (db) => { ... });        // JOINs, super_admin
```

## Sistema RBAC

| Nivel | Rol | Capacidades |
|-------|-----|-------------|
| 100 | super_admin | Bypass RLS, cross-org |
| 90 | admin | Gestión completa org |
| 80 | propietario | Dashboard/Configuración |
| 10-79 | empleado/supervisor | Operaciones |

## Reglas de Desarrollo

### Backend
- **RLS SIEMPRE**: `RLSContextManager.query()` o `.transaction()`
- **asyncHandler**: Inline en controllers (`static método = asyncHandler(async (req, res) => {...})`)
- **SQL seguro**: NUNCA interpolar, siempre `$1`, `$2`
- **organizacionId**: Siempre `req.tenant.organizacionId` (no `req.user.organizacion_id`)

### Frontend
- **JSX**: Archivos con JSX DEBEN tener extensión `.jsx`/`.tsx` (Vite lo requiere)
- **TypeScript**: UI components en `/components/ui/` son `.tsx`
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*`, usar `var(--color-primary-500)` en vez de hardcodear `#753572`
- **React.memo**: Obligatorio en componentes de lista/tabla
- **Sanitizar**: Joi rechaza `""`, usar `undefined`
- **Desacoplamiento**: Módulos NO importan entre sí. Código compartido va en `editor-framework/` o `components/shared/`

## Patrones

### Backend - BaseCrudController
```javascript
module.exports = createCrudController({
  Model: MiModel,
  resourceName: 'MiEntidad',
  filterSchema: { activo: 'boolean' }
});
```

### Frontend - createCRUDHooks
```javascript
const crudHooks = createCRUDHooks({
  name: 'entidad', namePlural: 'entidades',
  api: miApi, baseKey: 'entidades'
});
```

### Frontend - Overlays
- **FormDrawer** (`organisms/FormDrawer.tsx`): Drawer + form + footer estándar
- **useFormDrawer** (`hooks/utils/useFormDrawer.ts`): open/close + RHF + mutations + toast
- **useDisclosure** (`hooks/utils/useDisclosure.ts`): Estado boolean open/close

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |
| JSX parse error en Vite | Renombrar archivo a `.jsx`/`.tsx` |
| "Sin plan (X/X)" al crear recurso | Verificar que `planes_suscripcion_org.limites` tiene el campo del recurso |

---

**Actualizado**: 7 Febrero 2026

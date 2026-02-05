# CLAUDE.md

**IMPORTANTE**: Toda la comunicación debe ser en español.

## Nexo - Sistema de Gestión Empresarial

Plataforma ERP SaaS Multi-Tenant para LATAM con IA Conversacional.

## Stack Técnico

| Capa | Tecnologías |
|------|-------------|
| **Frontend** | React 18.3, Vite 7.1, Tailwind 3.4, TypeScript, Zustand 5, TanStack Query 5 |
| **Backend** | Node.js 18+, Express 4.18, JWT, Joi 17, Winston 3 |
| **Database** | PostgreSQL 17, RLS multi-tenant, pg_cron |
| **Pagos** | MercadoPago (Preapproval API) |

## Comandos Esenciales

```bash
npm run dev              # Levantar todo (docker-compose up)
docker restart back      # Aplicar cambios backend
docker restart front     # Aplicar cambios frontend
npm run db:connect       # psql directo (user: admin)
```

**Nota**: HMR NO funciona en Docker. Reiniciar contenedor + Ctrl+Shift+R.

## Arquitectura

### Backend (`backend/app/modules/`)

Módulos autocontenidos con `manifest.json`: auth, core, agendamiento, inventario, pos, website, eventos-digitales.

### Frontend (`frontend/src/`)

```
src/
├── components/
│   ├── ui/                 # Atomic Design (TypeScript): atoms, molecules, organisms
│   ├── editor-framework/   # Framework editores compartido (ver sección abajo)
│   └── shared/             # Componentes compartidos entre módulos
│       └── media/          # UnsplashPicker (UnsplashModal, UnsplashGrid, useUnsplashSearch)
├── features/               # Módulos autocontenidos (auth)
├── hooks/                  # Hooks por dominio
├── pages/                  # Páginas por módulo
├── types/                  # Tipos TypeScript (ui.d.ts, organisms.d.ts)
└── store/                  # Stores globales
```

### Editor Framework (`components/editor-framework/`)

Framework compartido entre Website e Invitaciones. Soporta dos modos:
- **Bloques**: Lista vertical de bloques arrastrables (useBlockEditor, useDndHandlers, BlockPalette)
- **Posición Libre**: Secciones con elementos X/Y estilo Wix (FreePositionCanvas, createFreePositionStore)

**Paneles unificados** (genéricos, parametrizados por props):
- `ThemeEditorPanel` — Editor de colores/fuentes (Website: 4 colores + 2 fuentes, Invitaciones: 2 colores)
- `TemplateGalleryPanel` — Panel compacto para sidebar
- `TemplateGalleryModal` — Modal fullscreen con render props para cards/preview

**Wrappers por módulo** (data fetching + lógica específica):
- `WebsiteTemplateGallery` → `pages/website/components/`
- `InvitacionTemplateGallery` → `pages/eventos-digitales/editor/components/`

**Config de tema por módulo** (constantes compartidas Sidebar↔Drawers):
- `pages/website/config/themeConfig.js`
- `pages/eventos-digitales/editor/config/themeConfig.js`

### Middlewares Chain
```
auth.authenticateToken → tenant.setTenantContext → tenant.verifyTenantActive → suscripcionActiva → [permisos] → controller
```

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
- **asyncHandler**: Obligatorio en routes y controllers
- **SQL seguro**: NUNCA interpolar, siempre `$1`, `$2`

### Frontend
- **TypeScript**: UI components en `/components/ui/` son `.tsx`
- **Dark mode**: Siempre variantes `dark:` en Tailwind
- **Colores**: Solo `primary-*` (primario: `#753572`)
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

## Troubleshooting

| Error | Solución |
|-------|----------|
| "Organización no encontrada" | `RLSContextManager.withBypass()` |
| "field not allowed to be empty" | Sanitizar `""` a `undefined` |
| Cambios no se reflejan | `docker restart <contenedor>` + Ctrl+Shift+R |

---

**Actualizado**: 5 Febrero 2026

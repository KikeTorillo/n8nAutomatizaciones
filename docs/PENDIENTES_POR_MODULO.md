# Pendientes por Módulo

**Actualizado**: 15 Enero 2026

---

## Auditoría Frontend - Estado

### Componentes UI Creados
| Componente | Ubicación |
|------------|-----------|
| SearchInput | `components/ui/SearchInput.jsx` |
| DataTable | `components/ui/DataTable.jsx` |
| FilterPanel | `components/ui/FilterPanel.jsx` |
| StatCard/StatCardGrid | `components/ui/StatCard.jsx` |
| ProgressBar | `components/ui/ProgressBar.jsx` |
| **BasePageLayout** | `components/ui/BasePageLayout.jsx` ✨ |
| **GenericNavTabs** | `components/ui/GenericNavTabs.jsx` ✨ |
| **MobileNavSelector** | `components/ui/MobileNavSelector.jsx` ✨ |

### Componentes Configuración (Nuevos) ✨
| Componente | Ubicación | Función |
|------------|-----------|---------|
| ConfigPageHeader | `components/configuracion/ConfigPageHeader.jsx` | Header con BackButton, título, icono, acciones |
| ConfigSearchBar | `components/configuracion/ConfigSearchBar.jsx` | Input búsqueda + filtros dinámicos |
| ConfigEmptyState | `components/configuracion/ConfigEmptyState.jsx` | Estado vacío con modo filtrado |
| ConfigCrudDrawer | `components/configuracion/ConfigCrudDrawer.jsx` | Drawer wrapper con form estandarizado |

### Modales Extraídos
| Modal | Ubicación |
|-------|-----------|
| IniciarConteoModal | `components/inventario/conteos/modales/` ✨ |
| CompletarConteoModal | `components/inventario/conteos/modales/` ✨ |
| AplicarAjustesModal | `components/inventario/conteos/modales/` ✨ |
| CancelarConteoModal | `components/inventario/conteos/modales/` ✨ |
| CuentaFormModal | `components/contabilidad/CuentaFormModal.jsx` ✨ |

### Hooks Creados
| Hook | Ubicación |
|------|-----------|
| useCrudHandlers | `hooks/useCrudHandlers.js` |
| useModalManager | `hooks/useModalManager.js` |
| useExportCSV | `hooks/useExportCSV.js` |
| **useConfigCrud** | `hooks/useConfigCrud.js` ✨ | CRUD centralizado para configuración |

### Constantes Centralizadas
| Archivo | Contenido |
|---------|-----------|
| entityStates.js | `constants/entityStates.js` - Estados/colores por entidad |

---

## Refactorizaciones Completadas

### Sprint 15 Enero 2026 (Sesión 4) - Configuración ✨
**Refactorización completa del módulo de Configuración**:

**Componentes genéricos creados** (`components/configuracion/`):
| Componente | Líneas | Función |
|------------|--------|---------|
| ConfigPageHeader | 65 | Header con BackButton, título, subtítulo, icono, acciones |
| ConfigSearchBar | 55 | Input de búsqueda + filtros select dinámicos |
| ConfigEmptyState | 50 | Estado vacío con modo filtrado/sin filtrar |
| ConfigCrudDrawer | 75 | Drawer wrapper con form y botones estandarizados |
| index.js | 5 | Exports centralizados |

**Hook creado** (`hooks/useConfigCrud.js`):
- 180 líneas de lógica CRUD centralizada
- Modal management (form, delete)
- Form con React Hook Form
- Mutations (create, update, delete)
- Filtrado con filterFn personalizable
- preparePayload y prepareEditValues

**Páginas refactorizadas**:
| Página | Antes | Después | Reducción |
|--------|-------|---------|-----------|
| CategoriasPage | 500 | 430 | -14% |
| PuestosPage | 465 | 379 | -18% |
| DepartamentosPage | 462 | 364 | -21% |
| UsuariosPage | 489 | 385 | -21% |
| WorkflowsListPage | 465 | 348 | -25% |
| DiasFestivosPage | 439 | 425 | -3% |
| **Total** | **2,820** | **2,331** | **-17%** |

**Correcciones de navegación**:
- NegocioPage: `/home` → `/configuracion`
- ModulosPage: `/home` → `/configuracion`
- ConfigPageHeader: Link → BackButton (consistencia visual)

**Todas las páginas ahora usan BackButton estándar hacia `/configuracion`**

---

### Sprint 15 Enero 2026 (Sesión 2) - Eventos-Digitales ✨
**Reorganización completa del módulo**:
- Creada carpeta `components/eventos-digitales/` con subcarpetas:
  - `decorativos/` - ElementosTematicos
  - `galeria/` - GaleriaCompartida
  - `seating/` - SeatingChartEditor, MesaVisual, InvitadoChip
  - `tabs/` - InvitadosTab, CheckinTab, UbicacionesTab, RegalosTab, FelicitacionesTab
  - `publico/` - Componentes de secciones para página pública

**Nuevos componentes creados**:
| Componente | Líneas | Función |
|------------|--------|---------|
| EventoAnimations.css | 75 | CSS de animaciones extraído |
| EventoCountdown.jsx | 70 | Countdown reutilizable |
| EventoUbicaciones.jsx | 110 | Sección de ubicaciones |
| EventoRegalos.jsx | 85 | Mesa de regalos |
| EventoFelicitaciones.jsx | 140 | Libro de firmas |
| EventoRSVP.jsx | 268 | Formulario de confirmación |

**Integración completada** (Sesión 3):
| Archivo | Antes | Después | Cambio |
|---------|-------|---------|--------|
| EventoPublicoPage.jsx | 1,436 | 890 | **-38%** (546 líneas menos) |
| Componentes movidos | 0 | 10 | Estructura correcta |
| Componentes nuevos | 0 | 6 | ~750 líneas reutilizables |

**Secciones reemplazadas**:
- EventoUbicaciones: ~95 líneas inline → 7 líneas
- EventoRegalos: ~70 líneas inline → 7 líneas
- EventoFelicitaciones: ~126 líneas inline → 10 líneas
- EventoRSVP: ~226 líneas inline → 14 líneas

### Sprint 15 Enero 2026 (Sesión 1) ✨
| Archivo | Antes | Después | Reducción |
|---------|-------|---------|-----------|
| InventarioPageLayout | 69 | 32 | -54% |
| ProfesionalesPageLayout | 69 | 32 | -54% |
| ClientesPageLayout | 69 | 32 | -54% |
| AgendamientoPageLayout | 69 | 32 | -54% |
| ProfesionalesNavTabs | 175 | 26 | -85% |
| ClientesNavTabs | 175 | 26 | -85% |
| AgendamientoNavTabs | 172 | 26 | -85% |
| InventarioNavTabs | 242 | 83 | -66% |
| ConteoDetallePage | 775 | 715 | -8% (4 modales extraídos) |
| CuentasContablesPage | 662 | 525 | -21% (modal + cleanup) |

**Impacto total Sprint**: ~1,400 líneas reorganizadas/extraídas

### Sprints Anteriores
| Archivo | Reducción | Componentes Extraídos |
|---------|-----------|----------------------|
| VentaPOSPage | -70% | POSHeader, POSProductsSection |
| EventoDetailPage | -77% | 5 tabs en `pages/eventos-digitales/tabs/` |
| AsientosContablesPage | -46% | 2 modales en `components/contabilidad/` |
| LealtadPage | - | 3 tabs en `pages/pos/tabs/` |
| ReporteVentasDiariasPage | - | Migrado a StatCardGrid |
| CuponesPage | - | Migrado a StatCardGrid |
| CombosPage | - | Migrado a useCrudHandlers |
| DropshipPage | - | ConfirmDialog (reemplazó confirm()) |
| GaleriaCompartida | - | ConfirmDialog (reemplazó confirm()) |
| OrdenesCompraPage | - | ConfirmDialog (reemplazó Modal inline) |

---

## Pendientes Auditoría (Siguiente Sesión)

### Alta Prioridad
| Tarea | Impacto |
|-------|---------|
| ~~Crear BasePageLayout~~ | ✅ Completado |
| ~~Crear GenericNavTabs~~ | ✅ Completado |
| ~~Extraer modales CuentasContablesPage~~ | ✅ Completado |
| ~~Extraer modales ConteoDetallePage~~ | ✅ Completado |

### Media Prioridad
| Tarea | Impacto |
|-------|---------|
| Migrar 10 páginas a useFilters | Reemplaza useState manual |
| Extraer tabs ConsignaPage | 3 tabs inline (~300 líneas) |
| ~~Reorganizar Eventos-Digitales~~ | ✅ Completado |
| ~~Integrar componentes publico/ en EventoPublicoPage~~ | ✅ Completado |

### Archivos Grandes Pendientes
| Archivo | Líneas | Acción Sugerida |
|---------|--------|-----------------|
| ~~EventoPublicoPage~~ | ~~1,374~~ 890 | ✅ Refactorizado |
| ~~CategoriasPage~~ | ~~500~~ 430 | ✅ Refactorizado |
| ~~PuestosPage~~ | ~~465~~ 379 | ✅ Refactorizado |
| ~~DepartamentosPage~~ | ~~462~~ 364 | ✅ Refactorizado |
| ~~UsuariosPage~~ | ~~489~~ 385 | ✅ Refactorizado |
| ~~WorkflowsListPage~~ | ~~465~~ 348 | ✅ Refactorizado |
| ProductosPage | ~1200 | Extraer modales de variantes/atributos |
| ClienteDetailPage | ~900 | Extraer tabs a archivos separados |
| ProfesionalDetailPage | ~800 | Ya usa tabs, revisar modales |

### Módulos por Prioridad (Auditoría)
| Módulo | Estado | Próxima Acción |
|--------|--------|----------------|
| **Eventos-Digitales** | 🟢 Completado | - |
| **Configuración** | 🟢 Completado | 6 páginas refactorizadas, 4 componentes + 1 hook creados |
| **Contabilidad** | 🟡 Media | Ya tiene CuentaFormModal, revisar ReportesPage |
| **POS** | 🟡 Media | Consolidar Promociones + Cupones |
| **Clientes** | 🟡 Media | ClienteDetailPage tiene tabs dispersos |
| **Inventario** | 🟡 Media | ProductosPage ~1200 líneas, extraer modales |
| **Profesionales** | 🟡 Media | ProfesionalDetailPage ~800 líneas, revisar modales |

---

## Patrones Establecidos

### BasePageLayout
Usar para todos los módulos principales. Props:
```jsx
<BasePageLayout
  moduleTitle="Inventario"
  moduleDescription="Gestiona productos..."
  navTabs={<InventarioNavTabs />}
  sectionIcon={Package}
  sectionTitle="Productos"
  sectionSubtitle="150 productos"
  actions={<Button>Nuevo</Button>}
>
  {children}
</BasePageLayout>
```

### GenericNavTabs
Dos modos de uso:
```jsx
// Modo flat (tabs simples)
<GenericNavTabs items={NAV_ITEMS} defaultPath="/profesionales" />

// Modo grouped (dropdowns)
<GenericNavTabs groups={NAV_GROUPS} defaultPath="/inventario/productos" />
```

### Estructura Eventos-Digitales
```
components/eventos-digitales/
├── decorativos/     # PatronFondo, StickersDecorativos, etc.
├── galeria/         # GaleriaCompartida
├── seating/         # SeatingChartEditor, MesaVisual, InvitadoChip
├── tabs/            # Tabs del detalle (Invitados, Checkin, etc.)
├── publico/         # Secciones para página pública
│   ├── EventoAnimations.css
│   ├── EventoCountdown.jsx
│   ├── EventoUbicaciones.jsx
│   ├── EventoRegalos.jsx
│   ├── EventoFelicitaciones.jsx
│   └── EventoRSVP.jsx
└── index.js         # Exports centralizados
```

### Componentes Configuración
```jsx
// ConfigPageHeader - Header estándar para páginas de configuración
<ConfigPageHeader
  title="Categorías"
  subtitle="Especialidades, niveles y certificaciones"
  icon={Tag}
  maxWidth="max-w-4xl"
  actions={<Button onClick={handleNew}>Nueva</Button>}
/>

// ConfigSearchBar - Búsqueda + filtros
<ConfigSearchBar
  value={searchTerm}
  onChange={setSearchTerm}
  placeholder="Buscar..."
  filters={[
    { name: 'tipo', value: filtroTipo, onChange: setFiltroTipo, options: TIPOS, placeholder: 'Todos' }
  ]}
/>

// ConfigEmptyState - Estado vacío
<ConfigEmptyState
  icon={Tag}
  title="No hay categorías"
  description="Crea tu primera categoría"
  actionLabel="Crear"
  onAction={handleNew}
  isFiltered={!!searchTerm}
/>

// ConfigCrudDrawer - Drawer para formularios CRUD
<ConfigCrudDrawer
  isOpen={isOpen('form')}
  onClose={() => closeModal('form')}
  title={isEditing ? 'Editar' : 'Nuevo'}
  onSubmit={handleSubmit}
  isLoading={isSubmitting}
  isEditing={isEditing}
>
  <Input label="Nombre" {...register('nombre')} />
</ConfigCrudDrawer>
```

### Hook useConfigCrud
```jsx
const {
  searchTerm, setSearchTerm,
  filters, setFilter,
  filteredItems,
  isOpen, closeModal, getModalData,
  handleNew, handleEdit, handleDelete, confirmDelete,
  form, handleSubmit, isSubmitting, isEditing,
} = useConfigCrud({
  items: categorias,
  defaultValues: { nombre: '', tipo: 'general' },
  createMutation, updateMutation, deleteMutation,
  filterFn: (item, { searchTerm, filters }) => { /* custom logic */ },
  toastMessages: { created: 'Creado', updated: 'Actualizado', deleted: 'Eliminado' },
  preparePayload: (data) => ({ ...data, nombre: data.nombre.trim() }),
  prepareEditValues: (item) => ({ nombre: item.nombre || '' }),
});
```

### Estructura Configuración
```
components/configuracion/
├── ConfigPageHeader.jsx    # Header con BackButton
├── ConfigSearchBar.jsx     # Búsqueda + filtros
├── ConfigEmptyState.jsx    # Estado vacío
├── ConfigCrudDrawer.jsx    # Drawer formulario
└── index.js                # Exports

hooks/
└── useConfigCrud.js        # Lógica CRUD centralizada
```

---

## Backlog Features

### Seguridad
- [ ] 2FA/MFA (Alta)
- [ ] API Keys por usuario (Baja)

### Agendamiento
- [ ] Pagos Anticipados (Alta)
- [ ] Sync Google/Outlook (Alta)
- [ ] Widget Embebible (Media)

### Inventario
- [ ] Integraciones Carriers DHL/FedEx (Alta)
- [ ] Kitting/BOM (Media)

### Facturación
- [ ] CFDI 4.0 México (Baja)

### RRHH
- [ ] Nómina México (Alta)

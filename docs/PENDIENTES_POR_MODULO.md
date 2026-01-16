# Auditoría de Homologación por Módulo

**Actualizado**: 16 Enero 2026

---

## Regla Importante

**ANTES de crear un nuevo componente, verificar que no exista uno similar:**

1. Revisar `components/ui/` para componentes genéricos
2. Revisar `components/[modulo]/` para componentes específicos
3. Revisar los hooks en `hooks/`

---

## Estado por Módulo

### 1. Inventario ✅ COMPLETADO

| Página | Estado | Notas |
|--------|--------|-------|
| ProductosPage | ✅ | DataTable + AdvancedFilterPanel |
| ProductoFormModal | ✅ | **Refactorizado**: 1042→403 líneas, tabs extraídos a `producto-form/` |
| CategoriasPage | ✅ | TreeView reutilizable |
| ProveedoresPage | ✅ | DataTable + FilterPanel |
| MovimientosPage | ✅ | DataTable + FilterPanel + Pagination |
| ConteosPage | ✅ | DataTable + StatCardGrid |
| OrdenesCompraPage | ✅ | DataTable + SmartButtons |
| ReordenPage | ✅ | Cards con ConfirmDialog |
| DropshipPage | ✅ | DataTable + StatCard |
| ConsignaPage | ✅ | 3 DataTables + StatCard |
| OperacionesAlmacenPage | ✅ | Kanban + StatCardGrid |
| BatchPickingPage | ✅ | Cards + StatCardGrid |
| AlertasPage | ✅ | Cards + FilterPanel + Pagination |
| UbicacionesAlmacenPage | ✅ | TreeView reutilizable |
| NumerosSeriesPage | ✅ | DataTable + StatCardGrid |
| RutasOperacionPage | ✅ | DataTable |
| AjustesMasivosPage | ✅ | SkeletonCard + StatCardGrid |
| AjusteMasivoDetallePage | ✅ | DataTable (migrado de HTML table) |
| CombosPage | ✅ | Cards |

**Componentes creados en auditoría:**
- `components/ui/TreeNode.jsx` - TreeView, TreeNode, useTreeExpansion
- `components/inventario/producto-form/` - 6 archivos (schemas + 4 tabs + index)

---

### 2. POS ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| VentaPOSPage | ⬜ |
| HistorialVentasPage | ⬜ |
| SesionesCajaPage | ⬜ |
| CuponesPage | ⬜ |
| PromocionesPage | ⬜ |

---

### 3. Agendamiento ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| CitasPage | ⬜ |
| ServiciosPage | ⬜ |
| HorariosPage | ⬜ |

---

### 4. Profesionales ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| ProfesionalesPage | ⬜ |
| ProfesionalDetailPage | ⬜ |

---

### 5. Clientes ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| ClientesPage | ⬜ |
| ClienteDetailPage | ⬜ |

---

### 6. Configuración ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| ConfiguracionPage | ⬜ |
| UsuariosPage | ⬜ |
| WorkflowDesignerPage | ⬜ |

---

## Componentes UI Disponibles

### Layouts
- `BasePageLayout`, `InventarioPageLayout`, `AgendamientoPageLayout`

### Datos
- `DataTable` - Tablas con sorting, acciones, responsive
- `TreeView` / `TreeNode` - Árboles jerárquicos (nuevo)
- `EmptyState`, `SkeletonTable`, `SkeletonCard`, `Pagination`

### Filtros
- `FilterPanel` - Filtros colapsables
- `AdvancedFilterPanel` - Filtros con búsquedas guardadas
- `SearchInput`, `SmartButtons`

### Modales
- `Drawer` - Formularios móviles
- `Modal` - Visualización
- `ConfirmDialog` - Acciones destructivas (soporta children)

### Estadísticas
- `StatCard`, `StatCardGrid`

---

## Hooks Principales

| Hook | Uso |
|------|-----|
| `useModalManager` | Gestionar múltiples modales |
| `useTreeExpansion` | Estado expansión árboles (nuevo) |
| `useExportCSV` | Exportar datos a CSV |
| `useToast` | Notificaciones |

---

## Backlog Features

### Alta Prioridad
- [ ] 2FA/MFA
- [ ] Integraciones Carriers (DHL/FedEx)

### Media Prioridad
- [ ] Kitting/BOM
- [ ] CFDI 4.0 México
- [ ] Sync Google/Outlook Calendar

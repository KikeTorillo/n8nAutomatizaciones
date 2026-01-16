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

24 páginas homologadas. Ver `components/inventario/producto-form/` para patrón de formularios con tabs.

---

### 2. POS ✅ COMPLETADO

| Página | Estado | Notas |
|--------|--------|-------|
| VentaPOSPage | ✅ | Grid visual + Carrito |
| VentasListPage | ✅ | DataTable + Filtros |
| PromocionesPage | ✅ | DataTable + useFilters + formulario con tabs |
| CuponesPage | ✅ | DataTable + useFilters + CuponStatsModal con tabs |
| LealtadPage | ✅ | Compacto |
| CorteCajaPage | ✅ | Reportes |
| ReporteVentasDiariasPage | ✅ | Reportes |
| CustomerDisplayPage | ✅ | Pantalla cliente |

**Componentes creados:**
- `POSPageLayout.jsx` - Layout wrapper para POS
- `promocion-form/` - schemas.js + 3 tabs (General, Tipo, Condiciones)
- `PromocionFormDrawer.jsx` - Drawer con tabs
- `PromocionStatsModal.jsx` - Estadísticas de promoción
- `CuponStatsModal.jsx` - Estadísticas con tabs (Stats/Historial)

---

### 3. Configuración ✅ COMPLETADO

| Página | Estado |
|--------|--------|
| ConfiguracionPage | ✅ |
| UsuariosPage | ✅ |
| RolesPage | ✅ |
| WorkflowDesignerPage | ✅ |

---

### 4. Agendamiento ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| CitasPage | ⬜ |
| ServiciosPage | ⬜ |
| HorariosPage | ⬜ |

---

### 5. Profesionales ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| ProfesionalesPage | ⬜ |
| ProfesionalDetailPage | ⬜ |

---

### 6. Clientes ⬜ PENDIENTE

| Página | Estado |
|--------|--------|
| ClientesPage | ⬜ |
| ClienteDetailPage | ⬜ |

---

## Componentes UI Disponibles

### Layouts
- `BasePageLayout`, `InventarioPageLayout`, `POSPageLayout`, `AgendamientoPageLayout`

### Datos
- `DataTable` - Tablas con sorting, acciones, responsive
- `TreeView` / `TreeNode` - Árboles jerárquicos
- `EmptyState`, `SkeletonTable`, `SkeletonCard`, `Pagination`

### Filtros
- `AdvancedFilterPanel` - Filtros con búsquedas guardadas
- `SearchInput`, `SmartButtons`

### Modales
- `Drawer` - Formularios móviles
- `Modal` - Visualización
- `ConfirmDialog` - Acciones destructivas

### Estadísticas
- `StatCard`, `StatCardGrid`

---

## Hooks Principales

| Hook | Uso |
|------|-----|
| `useModalManager` | Gestionar múltiples modales |
| `useFilters` | Estado de filtros con debounce y persistencia |
| `useTreeExpansion` | Estado expansión árboles |
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

# Pendientes por Módulo

**Actualizado**: 14 Enero 2026

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

### Hooks Creados
| Hook | Ubicación |
|------|-----------|
| useCrudHandlers | `hooks/useCrudHandlers.js` |
| useModalManager | `hooks/useModalManager.js` |
| useExportCSV | `hooks/useExportCSV.js` |

### Constantes Centralizadas
| Archivo | Contenido |
|---------|-----------|
| entityStates.js | `constants/entityStates.js` - Estados/colores por entidad |

---

## Refactorizaciones Completadas

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
| Crear BasePageLayout | Unifica 6 layouts duplicados (~400 líneas) |
| Crear GenericNavTabs | Unifica 5 navtabs duplicados (~500 líneas) |
| Extraer modales CuentasContablesPage | ~130 líneas inline |

### Media Prioridad
| Tarea | Impacto |
|-------|---------|
| Migrar 10 páginas a useFilters | Reemplaza useState manual |
| Extraer tabs ConsignaPage | 3 tabs inline (~300 líneas) |
| Extraer modales ConteoDetallePage | 5 modales, 8 useState |

### Archivos Grandes Pendientes
| Archivo | Líneas | Acción Sugerida |
|---------|--------|-----------------|
| ProductosPage | ~1200 | Extraer modales de variantes/atributos |
| ClienteDetailPage | ~900 | Extraer tabs a archivos separados |
| ProfesionalDetailPage | ~800 | Ya usa tabs, revisar modales |

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

# Plan de Revisión - Módulo Inventario

## Estado Actual

**Migración a InventarioPageLayout**: ✅ Completada (21/21 páginas)

Todas las páginas del módulo usan el layout estándar con:
- Header del módulo (BackButton, título "Inventario", descripción)
- InventarioNavTabs (5 dropdowns: Catálogo, Movimientos, Operaciones, Almacén, Reportes)
- Header de sección (icono, título, subtítulo, acciones)
- Container consistente (max-w-7xl)

---

## Siguiente Sesión: Auditoría UX/UI Detallada

### Objetivo
Revisar cada tab del módulo Inventario para validar UX/UI y aplicar mejores prácticas.

### Checklist por Página

#### Catálogo
| Página | Revisar |
|--------|---------|
| Productos | Filtros, tabla, acciones, modal detalle |
| Categorías | Árbol jerárquico, colores, drag & drop |
| Proveedores | Formulario, campos RFC, términos comerciales |

#### Movimientos
| Página | Revisar |
|--------|---------|
| Kardex | Timeline, filtros por fecha, exportación |
| Ajustes CSV | Upload, validación, feedback errores |
| Transferencias | Flujo estados, confirmaciones |

#### Operaciones
| Página | Revisar |
|--------|---------|
| Órdenes Compra | SmartButtons, flujo aprobación, recepción NS/Lotes |
| Conteos | Proceso conteo, diferencias, ajustes |
| Reorden | Reglas automáticas, alertas |
| Picking | Lista operaciones, estados |
| Wave Pick | Selección múltiple, agrupación |

#### Almacén
| Página | Revisar |
|--------|---------|
| Configuración | Settings generales, métodos valoración |
| Ubicaciones | Jerarquía Zona→Pasillo→Nivel, visual |
| NS/Lotes | Tracking, vencimientos, búsqueda |
| Rutas | Configuración rutas, etapas |
| Consigna | Acuerdos, seguimiento |
| Dropship | Proveedores directos, órdenes |

#### Reportes
| Página | Revisar |
|--------|---------|
| Valoración | Tabs FIFO/LIFO/Promedio, gráficos |
| Alertas | Tipos alerta, acciones rápidas |
| Histórico | Snapshots, comparativas |
| Listas Precios | Multi-lista, rangos, aplicación |

### Criterios de Evaluación

- [ ] **Consistencia visual**: Colores, espaciado, tipografía
- [ ] **Mobile-first**: Responsive en todos los breakpoints
- [ ] **Dark mode**: Correcto en todos los elementos
- [ ] **Loading states**: SkeletonTable/SkeletonCard apropiados
- [ ] **Empty states**: EmptyState con acción clara
- [ ] **Feedback usuario**: Toast en acciones, confirmaciones destructivas
- [ ] **Accesibilidad**: Labels, focus, contraste
- [ ] **Performance**: Paginación server-side, lazy loading

---

## Componentes Disponibles

| Componente | Uso |
|------------|-----|
| `InventarioPageLayout` | Layout wrapper (ya implementado) |
| `StatCardGrid` | Métricas rápidas |
| `EmptyState` | Sin datos |
| `SkeletonTable` | Loading tablas |
| `Pagination` | Paginación server-side |
| `AdvancedFilterPanel` | Filtros avanzados |
| `useFilters` + `useSavedFilters` | Gestión filtros con persistencia |

---

*Última actualización: 9 Enero 2026*

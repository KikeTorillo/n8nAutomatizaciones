# Plan de Optimización - Módulo Servicios

**Fecha:** 8 Enero 2026
**Estado:** Pendiente de implementación

---

## Resumen Ejecutivo

| Métrica | Valor |
|---------|-------|
| **Archivos del módulo** | 6 |
| **Componentes UI utilizados** | 13 |
| **Componentes UI no utilizados** | 3 (Badge, Pagination, useModalManager) |
| **Mejoras identificadas** | 5 |
| **Ahorro estimado total** | ~285 LOC |

---

## Archivos del Módulo

| Archivo | Ruta | LOC aprox |
|---------|------|-----------|
| ServiciosPage.jsx | `frontend/src/pages/servicios/` | ~550 |
| ServiciosList.jsx | `frontend/src/components/servicios/` | ~320 |
| ServicioFormModal.jsx | `frontend/src/components/servicios/` | ~850 |
| ProfesionalesServicioModal.jsx | `frontend/src/components/servicios/` | ~400 |
| ServiciosEditor.jsx | `frontend/src/pages/website/components/blocks/` | ~200 |
| ServiciosPublico.jsx | `frontend/src/pages/public/components/blocks/` | ~150 |

---

## Mejoras a Implementar

### 1. Usar componente Badge (ALTA)

**Archivo:** `frontend/src/components/servicios/ServiciosList.jsx`
**Líneas aproximadas:** 115-167
**Ahorro estimado:** ~50 LOC

**Situación actual:** Badges inline para categoría, duración y estado.

```jsx
// ANTES (repetido 3 veces con variantes)
<span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-400">
  {servicio.categoria}
</span>
```

**Implementación:**
```jsx
// DESPUÉS
import Badge from '@/components/ui/Badge';

<Badge variant="primary" size="sm">{servicio.categoria}</Badge>
<Badge variant="info" size="sm">{formatDuration(servicio.duracion_minutos)}</Badge>
<Badge variant={servicio.activo ? 'success' : 'default'} size="sm">
  {servicio.activo ? 'Activo' : 'Inactivo'}
</Badge>
```

---

### 2. Usar componente Pagination (ALTA)

**Archivo:** `frontend/src/components/servicios/ServiciosList.jsx`
**Líneas aproximadas:** 231-310
**Ahorro estimado:** ~70 LOC

**Situación actual:** Paginación custom con lógica de ellipsis inline.

**Implementación:**
```jsx
// DESPUÉS
import { Pagination } from '@/components/ui/Pagination';

<Pagination
  pagination={{
    page: paginacion.page,
    limit: paginacion.limit,
    total: paginacion.total,
    totalPages: paginacion.totalPages,
    hasNext: paginacion.hasNext,
    hasPrev: paginacion.hasPrev,
  }}
  onPageChange={onPageChange}
/>
```

---

### 3. Usar useModalManager (ALTA)

**Archivo:** `frontend/src/pages/servicios/ServiciosPage.jsx`
**Líneas aproximadas:** 23-38 (estados) + handlers
**Ahorro estimado:** ~35 LOC

**Situación actual:** 7 estados individuales para modales.

```jsx
// ANTES
const [isModalOpen, setIsModalOpen] = useState(false);
const [modalMode, setModalMode] = useState('create');
const [servicioSeleccionado, setServicioSeleccionado] = useState(null);
const [isProfesionalesModalOpen, setIsProfesionalesModalOpen] = useState(false);
const [servicioParaProfesionales, setServicioParaProfesionales] = useState(null);
const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
const [servicioAEliminar, setServicioAEliminar] = useState(null);
```

**Implementación:**
```jsx
// DESPUÉS
import { useModalManager } from '@/hooks/useModalManager';

const {
  openModal,
  closeModal,
  isOpen,
  getModalData,
  getModalProps,
} = useModalManager({
  formulario: { isOpen: false, data: null, mode: 'create' },
  profesionales: { isOpen: false, data: null },
  eliminar: { isOpen: false, data: null },
});

// Uso
openModal('formulario', servicio, { mode: 'edit' });
closeModal('formulario');
isOpen('eliminar');
getModalData('profesionales');
```

---

### 4. Extraer ServiciosFilters (MEDIA)

**Archivo:** `frontend/src/pages/servicios/ServiciosPage.jsx`
**Líneas aproximadas:** 229-316
**Ahorro estimado:** ~80 LOC

**Situación actual:** Panel de filtros inline con 4 selects.

**Implementación:** Crear componente `ServiciosFilters.jsx` similar a `CitaFilters.jsx`.

```jsx
// Nuevo archivo: frontend/src/components/servicios/ServiciosFilters.jsx
function ServiciosFilters({ filtros, onFiltrosChange, categorias, onLimpiarFiltros }) {
  // ... lógica de filtros
}
```

---

### 5. Usar Alert para advertencias (MEDIA)

**Archivo:** `frontend/src/pages/servicios/ServiciosPage.jsx`
**Líneas aproximadas:** 343-407
**Ahorro estimado:** ~50 LOC

**Situación actual:** Alerta inline para servicios sin profesionales.

**Implementación:** Usar componente `Alert` existente o crear patrón reutilizable.

---

## Orden de Implementación Recomendado

```
1. Badge en ServiciosList.jsx (15 min)
   └─ Importar Badge, reemplazar 3 badges inline

2. Pagination en ServiciosList.jsx (20 min)
   └─ Importar Pagination, eliminar ~80 líneas de paginación custom

3. useModalManager en ServiciosPage.jsx (30 min)
   └─ Importar hook, reemplazar 7 estados, actualizar handlers y modales

4. [Opcional] ServiciosFilters (45 min)
   └─ Crear nuevo componente, extraer lógica de filtros

5. [Opcional] Alert para advertencias (20 min)
   └─ Refactorizar alerta inline
```

---

## Checklist de Implementación

- [ ] **Badge en ServiciosList.jsx**
  - [ ] Importar componente Badge
  - [ ] Reemplazar badge de categoría
  - [ ] Reemplazar badge de duración
  - [ ] Reemplazar badge de estado (activo/inactivo)
  - [ ] Probar en navegador

- [ ] **Pagination en ServiciosList.jsx**
  - [ ] Importar componente Pagination
  - [ ] Eliminar lógica de paginación custom
  - [ ] Adaptar props al formato esperado
  - [ ] Probar navegación entre páginas

- [ ] **useModalManager en ServiciosPage.jsx**
  - [ ] Importar hook useModalManager
  - [ ] Definir configuración inicial de modales
  - [ ] Actualizar handlers (handleNuevo, handleEditar, handleEliminar, etc.)
  - [ ] Actualizar props de Modal, Drawer
  - [ ] Probar apertura/cierre de todos los modales

- [ ] **ServiciosFilters (opcional)**
  - [ ] Crear archivo ServiciosFilters.jsx
  - [ ] Extraer JSX de filtros
  - [ ] Definir props necesarias
  - [ ] Importar en ServiciosPage.jsx

- [ ] **Alert (opcional)**
  - [ ] Evaluar si usar componente Alert existente
  - [ ] Refactorizar alerta inline

---

## Resultado Esperado

| Métrica | Antes | Después |
|---------|-------|---------|
| LOC en ServiciosList.jsx | ~320 | ~200 |
| LOC en ServiciosPage.jsx | ~550 | ~430 |
| Estados de modales | 7 individuales | 1 centralizado |
| Badges inline | 3 | 0 |
| Paginación custom | 1 (~80 LOC) | 0 |

**Reducción total estimada:** ~285 LOC (mejoras alta prioridad: ~155 LOC)

---

## Notas

- El módulo ya usa correctamente: StatCardGrid, ViewTabs, EmptyState, SkeletonTable, BackButton
- La validación con Zod y React Hook Form está bien implementada
- El manejo de precios multi-moneda está bien estructurado
- Dark mode implementado en todos los componentes

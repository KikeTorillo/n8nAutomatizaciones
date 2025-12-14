# Plan de Migración: Modal a Drawer

## Resumen

Migrar los modales con formularios al nuevo componente `Drawer` (bottom sheet) para mejorar la experiencia en dispositivos móviles, especialmente en iOS donde el teclado virtual causa problemas con modales centrados.

## Criterios de Migración

| Tipo de Modal | Acción | Razón |
|---------------|--------|-------|
| **Formularios** | ✅ Migrar a Drawer | Múltiples inputs, teclado virtual |
| **Confirmaciones** | ❌ Mantener Modal/ConfirmDialog | Sin inputs, interacción simple |
| **Visualización/Detalle** | ❌ Mantener Modal | Solo lectura, sin inputs |

---

## Modales a Migrar (Formularios)

### Prioridad Alta (Uso frecuente en móvil)

| # | Archivo | Componente | Complejidad |
|---|---------|------------|-------------|
| 1 | ~~`ServicioFormModal.jsx`~~ | Crear/Editar Servicio | ✅ **COMPLETADO** |
| 2 | ~~`ProfesionalFormModal.jsx`~~ | Crear/Editar Profesional | ✅ **COMPLETADO** |
| 3 | ~~`CitaFormModal.jsx`~~ | Crear/Editar Cita | ✅ **COMPLETADO** |
| 4 | ~~`WalkInModal.jsx`~~ | Cliente Walk-in | ✅ **COMPLETADO** |
| 5 | ~~`ProductoFormModal.jsx`~~ | Crear/Editar Producto | ✅ **COMPLETADO** |
| 6 | ~~`BloqueoFormModal.jsx`~~ | Crear Bloqueo | ✅ **COMPLETADO** |

### Prioridad Media

| # | Archivo | Componente | Complejidad |
|---|---------|------------|-------------|
| 7 | ~~`HorariosProfesionalModal.jsx`~~ | Configurar Horarios | ✅ **COMPLETADO** |
| 8 | ~~`ConfigurarChatbotModal.jsx`~~ | Configurar Chatbot | ✅ **COMPLETADO** |
| 9 | ~~`ConfigComisionModal.jsx`~~ | Configurar Comisión | ✅ **COMPLETADO** |
| 10 | ~~`CategoriaFormModal.jsx`~~ | Crear/Editar Categoría | ✅ **COMPLETADO** |
| 11 | ~~`ProveedorFormModal.jsx`~~ | Crear/Editar Proveedor | ✅ **COMPLETADO** |
| 12 | ~~`AjustarStockModal.jsx`~~ | Ajustar Stock | ✅ **COMPLETADO** |
| 13 | ~~`OrdenCompraFormModal.jsx`~~ | Crear Orden Compra | ✅ **COMPLETADO** |

### Prioridad Baja (Menos uso móvil)

| # | Archivo | Componente | Complejidad |
|---|---------|------------|-------------|
| 14 | ~~`EditarPlanModal.jsx`~~ | Editar Plan (Super Admin) | ✅ **COMPLETADO** |
| 15 | ~~`BulkProductosModal.jsx`~~ | Carga Masiva | ✅ **COMPLETADO** |
| 16 | ~~`ServiciosProfesionalModal.jsx`~~ | Asignar Servicios | ✅ **COMPLETADO** |
| 17 | ~~`ProfesionalesServicioModal.jsx`~~ | Asignar Profesionales | ✅ **COMPLETADO** |
| 18 | ~~`RegistrarPagoModal.jsx`~~ | Registrar Pago OC | ✅ **COMPLETADO** |
| 19 | ~~`RecibirMercanciaModal.jsx`~~ | Recibir Mercancía | ✅ **COMPLETADO** |
| 20 | ~~`OrdenCompraFormModal.jsx`~~ | Crear Orden Compra | ✅ **COMPLETADO** |

---

## Modales a Mantener (Sin migración)

### Confirmaciones (Usar ConfirmDialog)
- `ConfirmarReagendarModal.jsx`
- `MarcarComoPagadaModal.jsx`
- `CancelarVentaModal.jsx`
- `CompletarCitaModal.jsx`
- `NoShowModal.jsx`

### Visualización/Detalle (Solo lectura)
- `CitaDetailModal.jsx`
- `BloqueoDetailModal.jsx`
- `VentaDetalleModal.jsx`
- `OrdenCompraDetalleModal.jsx`
- `KardexModal.jsx`
- `HistorialCambiosModal.jsx`

### Selección (Checkboxes sin texto)
- `MetodoPagoModal.jsx`
- `DevolverItemsModal.jsx`

### Modales en Páginas (Inline modals)
- `ServiciosPage.jsx` - Modal de filtros
- `CitasPage.jsx` - Modal de filtros
- `ProfesionalesPage.jsx` - Modal inline
- `CuentasContablesPage.jsx` - Formulario cuenta
- `AsientosContablesPage.jsx` - Formulario asiento
- Otras páginas con modales inline

---

## Pasos de Migración por Componente

### 1. Cambiar imports
```jsx
// Antes
import Modal from '@/components/ui/Modal';

// Después
import Drawer from '@/components/ui/Drawer';
```

### 2. Cambiar componente wrapper
```jsx
// Antes
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="Título"
  maxWidth="lg"
>
  {/* contenido */}
</Modal>

// Después
<Drawer
  isOpen={isOpen}
  onClose={onClose}
  title="Título"
  subtitle="Descripción opcional"
>
  {/* contenido */}
</Drawer>
```

### 3. Ajustes de layout (si necesario)
- Quitar `maxWidth` (Drawer usa ancho completo)
- El footer se queda dentro del children
- Verificar scroll en contenido largo

---

## Checklist por Componente

```
[ ] Cambiar import Modal → Drawer
[ ] Actualizar props (quitar maxWidth, agregar subtitle si aplica)
[ ] Probar en desktop
[ ] Probar en iOS Safari
[ ] Probar en Android Chrome
[ ] Verificar teclado virtual
[ ] Verificar scroll del contenido
[ ] Commit
```

---

## Orden de Ejecución Sugerido

### Fase 1: Modales Críticos ✅ COMPLETADA
1. ~~ServicioFormModal~~ ✅
2. ~~ProfesionalFormModal~~ ✅
3. ~~CitaFormModal~~ ✅
4. ~~WalkInModal~~ ✅
5. ~~ProductoFormModal~~ ✅
6. ~~BloqueoFormModal~~ ✅

### Fase 2: Inventario ✅ COMPLETADA
7. ~~CategoriaFormModal~~ ✅
8. ~~ProveedorFormModal~~ ✅
9. ~~AjustarStockModal~~ ✅

### Fase 3: Configuración ✅ COMPLETADA
10. ~~HorariosProfesionalModal~~ ✅
11. ~~ConfigurarChatbotModal~~ ✅
12. ~~ConfigComisionModal~~ ✅

### Fase 4: Avanzados ✅ COMPLETADA
13. ~~OrdenCompraFormModal~~ ✅
14. ~~BulkProductosModal~~ ✅
15. ~~EditarPlanModal~~ ✅
16. ~~ServiciosProfesionalModal~~ ✅
17. ~~ProfesionalesServicioModal~~ ✅
18. ~~RegistrarPagoModal~~ ✅
19. ~~RecibirMercanciaModal~~ ✅

---

## Notas Técnicas

### Componente Drawer
- Ubicación: `frontend/src/components/ui/Drawer.jsx`
- Basado en: [Vaul](https://vaul.emilkowal.ski/)
- Features:
  - Manejo automático de teclado iOS/Android
  - Gesto drag-to-close
  - Handle visual para arrastrar
  - Scroll interno del contenido

### Props del Drawer
```typescript
{
  isOpen: boolean,      // Estado abierto/cerrado
  onClose: () => void,  // Callback al cerrar
  title?: string,       // Título en el header
  subtitle?: string,    // Subtítulo opcional
  children: ReactNode   // Contenido del drawer
}
```

### Z-Index
- Drawer overlay: `z-40`
- Drawer content: `z-50`
- Toasts: `z-[100]` (siempre visibles sobre drawer)

---

## Fecha de Creación
14 de Diciembre 2025

## Estado
✅ COMPLETADO - 19/19 modales migrados (Todas las fases completadas)

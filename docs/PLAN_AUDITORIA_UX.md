# Plan de Auditoría UX - Nexo

## Objetivo

Garantizar consistencia visual y de experiencia de usuario entre todos los módulos del sistema.

---

## Módulos Auditados

### ✅ Inventario (9 Ene 2026)

**21 páginas migradas a InventarioPageLayout**

- InventarioNavTabs (5 grupos, 20 submódulos)
- EmptyState, Exportación CSV, StatCardGrid, ViewTabs
- Tooltips aria-label, IconPicker Categorías

**Pendientes:** Checkbox selección múltiple, Timeline visual Kardex

---

### ✅ Profesionales (9 Ene 2026)

**3 páginas migradas a ProfesionalesPageLayout**

- ProfesionalesNavTabs (Lista, Organigrama, Onboarding)
- Vista detalle con 7 tabs agrupados en dropdowns
- MisComisionesSection en CompensacionTab

---

### ✅ Agendamiento (9 Ene 2026)

**2 páginas migradas a AgendamientoPageLayout**

- AgendamientoNavTabs (Citas, Recordatorios)
- ViewTabs (Lista/Calendario), StatCardGrid

---

### ✅ Ausencias (9 Ene 2026)

**1 página con navegación unificada**

- MobileAusenciasSelector + TabDropdown desktop
- Exportación CSV por tab

---

### ✅ Comisiones (9 Ene 2026)

**Enfoque híbrido**

- Módulo admin `/comisiones` (config, reportes, pago masivo)
- `MisComisionesSection` integrado en Profesionales > Compensación

---

### ✅ Clientes (9 Ene 2026)

**3 páginas migradas a ClientesPageLayout**

- ClientesNavTabs (Lista, Etiquetas, Oportunidades)
- Vista 360° con 4 tabs: General, Historial, Documentos, Oportunidades
- StatCardGrid, ViewTabs, Exportación CSV, filtros multi-etiqueta
- Sistema completo: etiquetas, timeline, documentos MinIO, pipeline B2B
- **Pipeline Kanban** con drag & drop (@dnd-kit) - ViewTabs Lista/Kanban
- **Importación CSV** modal 3 pasos (Subir, Mapear, Confirmar)

---

### ✅ POS (9 Ene 2026)

**4 páginas con patrones específicos**

- Historial: StatCardGrid, Exportación CSV
- Nueva Venta: Diseño pantalla dividida
- Corte de Caja y Reportes

---

## Patrones Establecidos

### Layout Estándar
```
Header módulo (BackButton + título + descripción)
    ↓
NavTabs (tabs desktop / dropdown mobile)
    ↓
Header sección (icono + título + acciones)
    ↓
Contenido (max-w-7xl)
```

### Componentes Reutilizables

| Componente | Uso |
|------------|-----|
| `[Módulo]PageLayout` | Wrapper por módulo |
| `[Módulo]NavTabs` | Navegación con mobile dropdown |
| `StatCardGrid` | Métricas rápidas |
| `ViewTabs` | Cambio vista (Cards/Tabla/Calendario) |
| `EmptyState` | Sin datos + acción |
| `Drawer` | Formularios móviles |
| `ConfirmDialog` | Acciones destructivas |

### Hooks

| Hook | Uso |
|------|-----|
| `useModalManager` | Múltiples modales |
| `useSimpleModal` | Modal único |

---

## Decisiones Arquitectónicas

### CRM: Extender Clientes (no módulo separado)

| Aspecto | Beneficio |
|---------|-----------|
| UX Unificada | Cliente ve todo en un lugar |
| Sin duplicación | No hay clientes en 2 módulos |
| Soporta B2C + B2B | Citas + Oportunidades |

### Fortalezas sobre Odoo

- Integración Telegram/WhatsApp nativa
- Marketing opt-in (GDPR/LFPDPPP)
- Búsqueda fuzzy por teléfono con IA
- Walk-in flow para atención sin cita

---

## Próximo Paso: Auditoría Comparativa POS

### 🔍 Investigación Odoo POS vs Nexo POS

**Objetivo:** Identificar áreas de oportunidad y gaps funcionales comparando el módulo POS de Odoo 19 con Nexo POS.

**Alcance de la investigación:**

| Área | Aspectos a evaluar |
|------|-------------------|
| **Flujo de venta** | Velocidad, pasos, atajos de teclado |
| **Métodos de pago** | Efectivo, tarjeta, split, propinas |
| **Gestión de productos** | Búsqueda, variantes, combos, modificadores |
| **Descuentos** | Por producto, globales, cupones, promociones |
| **Devoluciones** | Flujo, parciales, cambios |
| **Clientes** | Registro rápido, historial, lealtad |
| **Inventario** | Sincronización, alertas stock |
| **Reportes** | Ventas, cajeros, productos, horarios |
| **Hardware** | Impresoras, cajón, lector códigos, báscula |
| **Offline** | Funcionamiento sin conexión |
| **Multi-sucursal** | Precios, stock, permisos por ubicación |
| **UX/UI** | Diseño táctil, accesibilidad, dark mode |

**Credenciales Odoo:**
- URL: http://localhost:8069
- Usuario: admin / admin

**Entregable:** Documento `COMPARATIVA_POS_ODOO_NEXO.md` con:
- Matriz de funcionalidades
- Screenshots comparativos
- Recomendaciones priorizadas
- Estimación de esfuerzo

---

## Pendientes Globales (Baja Prioridad)

| Módulo | Tarea | Complejidad |
|--------|-------|-------------|
| Inventario | Checkbox selección múltiple | Media |
| Inventario | Timeline visual Kardex | Baja |
| Clientes | Merge duplicados | Media |
| Clientes | Segmentos guardados | Media |

---

*Última actualización: 9 Enero 2026*

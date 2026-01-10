# Plan de Auditoría UX - Nexo

## Objetivo

Garantizar consistencia visual y de experiencia de usuario entre todos los módulos del sistema.

---

## Módulos Auditados

### ✅ Inventario (9 Enero 2026)

**21 páginas migradas a InventarioPageLayout**

- EmptyState con acción, Exportación CSV, Tabs en ProductoFormModal
- Tooltips aria-label, IconPicker Categorías, Indicador stock bajo

**Pendientes baja prioridad:** Checkbox selección múltiple, Timeline visual en Kardex

---

### ✅ Profesionales (9 Enero 2026)

**3 páginas migradas a ProfesionalesPageLayout**

- ProfesionalesNavTabs (Lista, Organigrama, Onboarding)
- TabDropdown en detalle profesional (5 elementos, sin scroll)
- MisComisionesSection en CompensacionTab
- Exportación CSV, aria-labels, StatCardGrid

**Estructura tabs detalle:** General | Trabajo | Perfil ▼ | Compensación | Gestión ▼

---

### ✅ Agendamiento (9 Enero 2026)

**2 páginas migradas a AgendamientoPageLayout**

- CitasPage y RecordatoriosPage con layout consistente
- ViewTabs (Lista/Calendario), StatCardGrid, Exportación CSV

---

### ✅ Ausencias (9 Enero 2026)

**1 página con navegación unificada**

- MobileAusenciasSelector + TabDropdown desktop
- Exportación CSV por tab

**Estructura desktop:** Mis Ausencias | Mi Equipo | Tipos ▼ | Calendario | Configuración

---

### ✅ Comisiones (9 Enero 2026)

**Enfoque híbrido implementado**

- Módulo admin `/comisiones` existente (config, reportes, pago masivo)
- `MisComisionesSection.jsx` en CompensacionTab de Profesionales

---

### ✅ Clientes (9-10 Enero 2026)

**Vista 360° completa con 4 tabs**

- StatCardGrid, ViewTabs (Tabla/Tarjetas), Exportación CSV
- Sistema de etiquetas con colores y filtro multi-etiqueta
- Timeline de actividades (citas + ventas + notas unificados)
- Sistema de documentos con upload MinIO
- Sistema de tareas asignables con prioridades
- Pipeline de oportunidades B2B

---

### ✅ POS (9 Enero 2026)

**4 páginas con patrones UX específicos**

- Historial: StatCardGrid, Exportación CSV, aria-labels
- Nueva Venta: Diseño específico (pantalla dividida)
- Corte de Caja y Reportes: Ya implementados

---

## Patrones Establecidos

### Layout Estándar
```
Header módulo (BackButton + título + descripción)
    ↓
Navegación (tabs desktop / dropdown mobile)
    ↓
Header sección (icono + título + acciones)
    ↓
Contenido (max-w-7xl)
```

### Componentes UI Reutilizables

| Componente | Uso |
|------------|-----|
| `[Módulo]PageLayout` | Wrapper por módulo |
| `[Módulo]NavTabs` | Navegación con mobile dropdown |
| `TabDropdown` | Agrupar tabs en dropdown (desktop) |
| `MobileNavSelector` | Dropdown selector (mobile) |
| `StatCardGrid` | Métricas rápidas |
| `ViewTabs` | Cambio vista (Cards/Tabla/Calendario) |
| `EmptyState` | Sin datos + acción |
| `Drawer` | Formularios móviles |
| `ConfirmDialog` | Acciones destructivas |

### Hooks Reutilizables

| Hook | Uso |
|------|-----|
| `useModalManager` | Múltiples modales |
| `useSimpleModal` | Modal único |

---

## Implementación Clientes - Resumen

### Estructura de Tabs Actual

```
┌─────────────────────────────────────────────────────────────────┐
│  [General] [Historial] [Documentos] [Oportunidades]             │
├─────────────────────────────────────────────────────────────────┤
│  - Navegación por URL: ?tab=general|historial|documentos|oportunidades
│  - Smart Buttons: Citas, Gastado, Ventas POS, Última Visita     │
│  - Etiquetas editables inline en header                         │
└─────────────────────────────────────────────────────────────────┘
```

### Archivos SQL

| Archivo | Contenido |
|---------|-----------|
| `sql/clientes/01-tablas.sql` | Tabla clientes con dirección estructurada, tipo persona/empresa |
| `sql/clientes/04-etiquetas.sql` | Sistema etiquetas con colores |
| `sql/clientes/05-actividades.sql` | Timeline, tareas, función `get_cliente_timeline()` |
| `sql/clientes/06-documentos.sql` | Documentos con integración MinIO |
| `sql/clientes/07-oportunidades.sql` | Pipeline B2B, etapas, funciones estadísticas |

### Componentes Frontend

**Tabs:**
- `ClienteGeneralTab.jsx` - Info contacto, dirección, datos fiscales
- `ClienteTimelineTab.jsx` - Timeline unificado + QuickNoteInput + TareaDrawer
- `ClienteDocumentosTab.jsx` - Lista documentos + DocumentoUploadDrawer
- `ClienteOportunidadesTab.jsx` - Pipeline B2B + OportunidadFormDrawer

**Componentes compartidos:**
- `ClienteEtiquetasEditor.jsx` - Edición inline de etiquetas
- `ClienteTimeline.jsx`, `TimelineItem.jsx`, `QuickNoteInput.jsx`
- `EtiquetasBadges.jsx`, `EtiquetasSelector.jsx`, `EtiquetaFormModal.jsx`
- `OportunidadFormDrawer.jsx`, `DocumentoUploadDrawer.jsx`, `TareaDrawer.jsx`

### Hooks

| Hook | Descripción |
|------|-------------|
| `useClientes` | CRUD clientes, estadísticas |
| `useEtiquetasClientes` | CRUD etiquetas |
| `useClienteActividades` | Timeline, notas, tareas |
| `useClienteDocumentos` | Upload/download documentos |
| `useOportunidades` | Pipeline B2B, etapas, estadísticas |

---

## Pendientes Opcionales (Baja Prioridad)

| Tarea | Módulo |
|-------|--------|
| Vista Pipeline Kanban con drag & drop | Oportunidades |
| Página `/oportunidades` independiente | Oportunidades |
| Contactos relacionados (empresa → personas) | Clientes |
| Checkbox selección múltiple (batch actions) | Inventario |
| Timeline visual en Kardex | Inventario |

---

## Decisiones Arquitectónicas

### CRM: Extender Clientes (no módulo separado)

**Justificación:** Basado en análisis de competencia (Odoo, Mindbody, Fresha, Vagaro, Zenoti), se decidió extender el módulo Clientes en lugar de crear CRM separado.

| Aspecto | Beneficio |
|---------|-----------|
| UX Unificada | Cliente ve todo en un lugar |
| Sin duplicación | No hay clientes en 2 módulos |
| Soporta B2C + B2B | Citas (servicios) + Oportunidades (corporativo) |
| Alineación vertical | Similar a Mindbody, Fresha |

### Fortalezas de Nexo sobre Odoo

- Integración Telegram/WhatsApp nativa
- Marketing opt-in (GDPR/LFPDPPP)
- Campos médicos (alergias, notas)
- Búsqueda fuzzy por teléfono con IA
- Walk-in flow para atención sin cita

---

## Historial

| Fecha | Módulo | Resultado |
|-------|--------|-----------|
| 8 Ene 2026 | Agendamiento | ✅ Completado |
| 9 Ene 2026 | Inventario | ✅ Completado |
| 9 Ene 2026 | Profesionales | ✅ Completado |
| 9 Ene 2026 | Ausencias | ✅ Completado |
| 9 Ene 2026 | Comisiones | ✅ Enfoque híbrido |
| 9 Ene 2026 | Clientes UX | ✅ StatCardGrid, ViewTabs, CSV |
| 9 Ene 2026 | POS | ✅ Historial mejorado |
| 9 Ene 2026 | Clientes Fase 1-3 | ✅ Tipo, dirección, etiquetas |
| 10 Ene 2026 | Clientes Fase 4 | ✅ Timeline, Documentos, Tabs, Tareas |
| 10 Ene 2026 | Clientes Fase 5 | ✅ Oportunidades B2B (validado en browser) |

---

*Última actualización: 10 Enero 2026*

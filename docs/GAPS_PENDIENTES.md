# Gaps Pendientes por Módulo

**Actualizado**: 8 Enero 2026

---

## Resumen Ejecutivo

| Prioridad | Cantidad | Estado |
|-----------|:--------:|--------|
| Alta | 6 | Pendiente |
| Media | 7 | Pendiente |
| Baja | 7 | Pendiente |
| **Total** | **20** | |

### Auditoría Frontend

| Fase | Descripción | Estado |
|------|-------------|--------|
| P1 | Bugs críticos y modales | ✅ |
| P2 | Optimización y PropTypes | ✅ |
| P3 | ExpandableCrudSection | ✅ |
| P4 | Console Warnings | ✅ |

**Resultado**: ~500 LOC eliminadas, 5 componentes refactorizados, 0 console warnings

---

## Correcciones Recientes (8 Ene 2026)

| Fix | Archivo | Descripción |
|-----|---------|-------------|
| Maximum update depth | `CitaFormModal.jsx` | Guard `isOpen` en useEffect de cálculo de totales |
| button dentro de button | `DocumentosEmpleadoSection.jsx` | Reestructurar header con wrapper div |
| div dentro de p | `EditableField.jsx` | Cambiar `<p>` a `<div>` para displayValue |
| defaultProps deprecation | 9 archivos | Migrar a valores por defecto en destructuración |

---

## Alta Prioridad

| Gap | Módulo | Impacto |
|-----|--------|---------|
| **Pagos Anticipados** | Agendamiento | Reduce no-shows 40-60%, MercadoPago integrado |
| **Sync Google/Outlook** | Agendamiento | Evita doble-reserva, estándar industria |
| **Contratos múltiples** | RRHH | Historial laboral con renovaciones |
| **Nómina México** | RRHH | IMSS, ISR, CFDI recibos |
| **Aprobaciones Paralelas** | Workflows | IT+Finanzas simultáneo |
| **2FA/MFA** | Seguridad | TOTP, SMS, cumplimiento SOC2 |

---

## Media Prioridad

| Gap | Módulo | Impacto |
|-----|--------|---------|
| Widget Embebible | Agendamiento | Captación externa web |
| Lista de Espera | Agendamiento | Notificar disponibilidad |
| Dashboard Métricas/SLAs | Workflows | Tiempo promedio, tasa aprobación |
| Aprobación vía Email | Workflows | UX ejecutivos |
| Webhooks N8N | Workflows | Automatización bidireccional |
| Auditoría detallada | Inventario | Trazabilidad completa |
| Kitting/BOM | Inventario | Ensambles, listas materiales |

---

## Baja Prioridad

| Gap | Módulo |
|-----|--------|
| Reservas Grupales | Agendamiento |
| Evaluaciones 360° | RRHH |
| Reclutamiento | RRHH |
| Templates Predefinidos | Workflows |
| AI Detección Anomalías | Workflows |
| API Keys por usuario | Seguridad |
| CFDI 4.0 | Facturación |

---

## Revisión Funcional Completada (8 Ene 2026)

### Agendamiento - Citas ✅

| Componente | Estado | Notas |
|------------|--------|-------|
| CitasPage | ✅ | useModalManager, StatCardGrid, ViewTabs |
| CitaFormModal | ✅ | RHF + Zod, validación medianoche, Round-Robin |
| CancelarCitaModal | ✅ | PropTypes completos, dark mode |
| CitasList | ✅ | Skeleton, EmptyState, soporte multi-servicio |
| CitaDetailModal | ✅ | Acciones por estado, timestamps |
| CalendarioMensual | ✅ | Navegación, crear desde día |
| Recurrencia | ✅ | Preview, creación masiva, conflictos |

### Agendamiento - Bloqueos ✅

| Componente | Estado | Notas |
|------------|--------|-------|
| BloqueosPage | ✅ | ViewTabs (todos/profesionales/organizacionales/calendario) |
| BloqueoFormModal | ✅ | Tipos dinámicos API, protección vacaciones |
| BloqueosList | ✅ | Skeleton, filtros, acciones |

### Profesionales ✅

| Área | Estado | Notas |
|------|--------|-------|
| GeneralTab | ✅ | Foto con upload MinIO, edición inline |
| EditableField | ✅ | Fix: `<div>` en lugar de `<p>` (DOM warning) |
| ExpandableCrudSection | ✅ | Nuevo componente reutilizable |
| EducacionFormalSection | ✅ | Refactorizado con ExpandableCrudSection |
| ExperienciaLaboralSection | ✅ | Refactorizado con ExpandableCrudSection |
| HabilidadesSection | ✅ | Refactorizado con ExpandableCrudSection |
| CuentasBancariasSection | ✅ | Refactorizado con ExpandableCrudSection |
| DocumentosEmpleadoSection | ✅ | Fix: button dentro de button |

### Vacaciones ✅

| Componente | Estado | Notas |
|------------|--------|-------|
| CalendarioEquipoVacaciones | ✅ | Expansión rangos multi-día |
| FiltrosCalendarioVacaciones | ✅ | Filtros por estado/departamento |

### Transversal ✅

| Área | Estado | Notas |
|------|--------|-------|
| Dark mode | ✅ | Todas las clases `dark:` aplicadas |
| Mobile/Responsive | ✅ | Drawers iOS Safari compatible |
| Validaciones | ✅ | Zod schemas, edge cases cubiertos |

---

## Próximo Paso

Todos los módulos revisados están funcionando correctamente. **Siguiente prioridad**: Implementar un gap de alta prioridad.

### Gaps Recomendados para Iniciar

| Gap | Razón | Complejidad |
|-----|-------|-------------|
| **2FA/MFA** | Seguridad crítica, prerequisito para pagos | Media |
| **Pagos Anticipados** | ROI inmediato, MercadoPago ya integrado | Media-Alta |
| **Widget Embebible** | Captación clientes, bajo acoplamiento | Media |

---

## Componentes Reutilizables

| Componente | Ubicación | Uso |
|------------|-----------|-----|
| `ExpandableCrudSection` | `components/ui/` | Secciones CRUD expandibles |
| `CancelarCitaModal` | `components/citas/` | Modal cancelación de citas |
| `useModalManager` | `hooks/` | Gestión de múltiples modales |

---

## Fortalezas Actuales

| Feature | Ventaja Competitiva |
|---------|---------------------|
| Multi-servicio por cita | Salones/spas |
| Walk-in nativo | Cola sin cita previa |
| Chatbots IA | Telegram/WhatsApp |
| Citas Recurrentes | Preview antes de crear |
| Round-Robin configurable | Drag & drop por servicio |
| Incapacidades IMSS | Prórrogas integradas |

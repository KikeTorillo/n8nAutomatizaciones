# Análisis Comparativo: Módulo Agendamiento Nexo vs Competencia

**Fecha**: 7 de Enero 2026
**Versión**: 2.3
**Última actualización**: Citas Recurrentes - Testing E2E completado

---

## Resumen Ejecutivo

Análisis del módulo de agendamiento de Nexo vs **Odoo 19 Appointments**, **Calendly**, **Acuity Scheduling**, **Cal.com** y otros líderes.

**Estado actual**: 8.5/10 (subió de 8 tras implementar Citas Recurrentes)

---

## 1. Matriz Comparativa de Funcionalidades

### Leyenda
- ✅ Implementado | ⚠️ Parcial | ❌ No disponible

### 1.1 Agendamiento y Disponibilidad

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Reserva de citas online | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-servicio por cita | ✅ | ❌ | ❌ | ✅ | ❌ |
| Walk-in (sin cita previa) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Horarios por profesional | ✅ | ✅ | ✅ | ✅ | ✅ |
| **Buffer time (prep/limpieza)** | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bloqueos (vacaciones, etc.) | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| **Filtros por origen bloqueo** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Protección bloqueos auto-generados** | ✅ | ✅ | N/A | N/A | N/A |
| Citas recurrentes | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| Reservas grupales | ❌ | ✅ | ✅ | ✅ | ✅ |
| Lista de espera (waitlist) | ❌ | ❌ | ❌ | ✅ | ❌ |

### 1.2 Asignación y Automatización

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Selección manual | ✅ | ✅ | ✅ | ✅ | ✅ |
| Auto-asignación básica | ⚠️ | ✅ | ❌ | ❌ | ✅ |
| Round-robin | ❌ | ✅ | ✅ | ❌ | ✅ |
| Por habilidades/servicios | ✅ | ✅ | ❌ | ✅ | ⚠️ |

### 1.3 Notificaciones

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Recordatorios SMS | ✅ | ✅ | ⚠️ | ✅ | ⚠️ |
| Recordatorios WhatsApp | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| Chatbots IA | ✅ | ❌ | ❌ | ❌ | ❌ |
| Email (vía n8n) | ⚠️ | ✅ | ✅ | ✅ | ✅ |

### 1.4 Integraciones

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Sync Google Calendar | ❌ | ✅ | ✅ | ✅ | ✅ |
| Sync Outlook | ❌ | ✅ | ✅ | ✅ | ✅ |
| Videoconferencia | ❌ | ✅ | ✅ | ✅ | ✅ |
| Widget embebible | ❌ | ✅ | ✅ | ✅ | ✅ |
| Webhooks | ✅ | ✅ | ✅ | ✅ | ✅ |
| Pago anticipado | ❌ | ✅ | ✅ | ✅ | ✅ |

### 1.5 Gestión HR/Empleados

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| **Días festivos configurables** | ✅ | ✅ | ❌ | ❌ | ❌ |
| **Catálogo feriados LATAM** | ✅ | ⚠️ | ❌ | ❌ | ❌ |
| **Tab Ausencias en profesional** | ✅ | ✅ | N/A | N/A | N/A |
| **Portal Mi Perfil (autoservicio)** | ✅ | ✅ | N/A | N/A | N/A |
| Módulo Vacaciones integrado | ✅ | ✅ | ❌ | ❌ | ❌ |

---

## 2. Fortalezas Exclusivas de Nexo

| Feature | Ventaja Competitiva |
|---------|---------------------|
| **Multi-servicio por cita** | Salones/spas (corte + tintura + peinado) |
| **Walk-in nativo** | Cola de espera para negocios con alto tráfico |
| **Chatbots IA** | Agendamiento por Telegram/WhatsApp con LLM |
| **Calificaciones bidireccionales** | Profesional califica cliente post-servicio |
| **Catálogo feriados LATAM** | MX, CO, AR, CL, PE pre-configurados |
| **RLS + Particionamiento** | Multi-tenancy y performance enterprise |
| **Citas Recurrentes con Preview** | Visualización de disponibilidad antes de crear serie |

---

## 3. Gaps Pendientes (Priorizado)

### Alta Prioridad
| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| Sync Google/Outlook | Evita doble-reserva | 8-12 días |
| Pagos Anticipados (Stripe) | Reduce no-shows | 5-7 días |

### Media Prioridad
| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| Lista de Espera | Optimización agenda | 4-6 días |
| Reservas Grupales | Clases/talleres | 6-8 días |
| Round-Robin | Equipos grandes | 3-4 días |
| Widget Embebible | Captación clientes | 4-5 días |

### Baja Prioridad
| Gap | Notas |
|-----|-------|
| Videoconferencia | Zoom/Meet integration |
| Depósitos parciales | Solo Acuity lo tiene |
| HIPAA compliance | Sector salud específico |

---

## 4. Implementaciones Completadas (Fase 0)

### Enero 2026

| Feature | Estado | Archivos Clave |
|---------|--------|----------------|
| **Buffer Time (Query + Command)** | ✅ | `disponibilidad.model.js`, `cita.helpers.model.js` |
| **UI Bloqueos mejorada** | ✅ | `BloqueosPage.jsx`, `BloqueosList.jsx` |
| **Días Festivos + LATAM** | ✅ | `DiasFestivosPage.jsx`, `feriados-latam.js` |
| **Tab Ausencias** | ✅ | `AusenciasTab.jsx` |
| **Mi Perfil (Autoservicio)** | ✅ | `MiPerfilPage.jsx` |
| **Citas Recurrentes** | ✅ | Ver detalle abajo |

### Detalle Buffer Time (7 Ene 2026)
Validación consistente en patrón CQS:
- **Query**: `DisponibilidadModel` calcula slots disponibles con buffer
- **Command**: `CitaHelpersModel.validarConflictoHorario()` bloquea citas que invaden buffer
- Mensaje de error incluye detalle: "(incluye X min prep. + Y min limpieza)"

### Detalle Mi Perfil
Portal autoservicio para empleados:
- Acceso condicional: solo usuarios con `profesional_id`
- Widgets: vacaciones, ausencias, acciones rápidas

### Detalle Citas Recurrentes (7 Ene 2026) - COMPLETO

#### Arquitectura
Sistema completo de series de citas con patrón CQS:

| Capa | Archivos | Descripción |
|------|----------|-------------|
| **SQL** | `sql/citas/01-tablas-citas.sql` | Campos: `cita_serie_id`, `es_cita_recurrente`, `numero_en_serie`, `total_en_serie`, `patron_recurrencia` |
| **Schemas** | `cita.schemas.js` | Validación Joi: `crearCitaRecurrenteSchema`, `previewRecurrenciaSchema` |
| **Utils** | `recurrencia.util.js` (NUEVO) | Funciones: `generarFechasRecurrentes()`, `calcularSiguienteFecha()` |
| **Model** | `cita.base.model.js` | Métodos: `crearRecurrente()`, `obtenerSerie()`, `cancelarSerie()`, `previewRecurrencia()` |
| **Model Index** | `models/citas/index.js` | Proxy de los 4 métodos |
| **Controller** | `cita.base.controller.js` | Endpoints: `crearRecurrente`, `obtenerSerie`, `cancelarSerie`, `previewRecurrencia` |
| **Controller Index** | `controllers/citas/index.js` | Proxy de los 4 endpoints |
| **Routes** | `routes/citas.js` | Rutas: `POST /recurrente`, `GET /serie/:serieId`, `DELETE /serie/:serieId`, `POST /preview-recurrencia` |
| **API Frontend** | `endpoints.js` | Métodos: `crearCitaRecurrente()`, `obtenerSerie()`, `cancelarSerie()`, `previewRecurrencia()` |
| **Hooks** | `useCitas.js` | Hooks: `useCrearCitaRecurrente()`, `useObtenerSerie()`, `useCancelarSerie()`, `usePreviewRecurrencia()` |
| **UI** | `CitaFormModal.jsx` | Toggle recurrencia, configuración patrón, preview disponibilidad |

#### Funcionalidades
- **Patrones soportados**: Semanal, Quincenal, Mensual
- **Días específicos**: Selección de días de la semana (ej: solo Lunes y Miércoles)
- **Terminación**: Por cantidad (2-52 citas) o por fecha específica
- **Preview**: Consulta de disponibilidad antes de crear la serie
- **Validación inteligente**: Omite automáticamente fechas con conflictos (bloqueos, citas existentes, fuera de horario)
- **Auditoría**: Registro de creación/cancelación de series

#### Prueba E2E Exitosa (7 Ene 2026)
```
POST /api/v1/citas/preview-recurrencia
→ 4 fechas disponibles: 2026-01-13, 01-20, 01-27, 02-03 (100% disponibilidad)

POST /api/v1/citas/recurrente
→ 4 citas creadas:
   - ORG001-20260113-001 (serie #1)
   - ORG001-20260120-001 (serie #2)
   - ORG001-20260127-001 (serie #3)
   - ORG001-20260203-001 (serie #4)

UI: "Pendientes: 4" visible en dashboard de citas
```

#### Estadísticas de Implementación
| Métrica | Valor |
|---------|-------|
| Archivos modificados | 14 |
| Líneas agregadas | ~1,760 |
| Archivos nuevos | 1 (`recurrencia.util.js`) |
| Endpoints nuevos | 4 |
| Hooks nuevos | 4 |

---

## 5. Roadmap Actualizado

### Q1 2026 (Siguiente)
| Semana | Feature | Prioridad | Estado |
|--------|---------|-----------|--------|
| 1 | Citas Recurrentes | Alta | ✅ Completado |
| 2-3 | Pagos Anticipados (Stripe) | Alta | Pendiente |
| 4-5 | Lista de Espera | Alta | Pendiente |
| 6-7 | Widget Embebible | Media | Pendiente |
| 8-9 | Sync Google/Outlook | Alta | Pendiente |

### Q2 2026
| Feature | Prioridad |
|---------|-----------|
| Round-Robin mejorado | Media |
| Reservas Grupales | Media |
| Videoconferencia | Baja |

---

## 6. Métricas de Código

### Módulo Agendamiento - Backend
| Componente | Cantidad |
|------------|----------|
| Controllers | 10 |
| Models | 8 |
| Routes | 5 |
| Schemas | 4 |
| Utils | 2 |

### Módulo Agendamiento - Frontend
| Componente | Cantidad |
|------------|----------|
| Páginas | 8 |
| Componentes | 15+ |
| Hooks | 6 |

---

## 7. Conclusiones

**Mejoras desde v1.0:**
- Buffer time completo: Query (disponibilidad) + Command (creación) sincronizados
- Arquitectura modular de ausencias (patrón Odoo)
- Portal Mi Perfil para empleados
- Catálogo feriados LATAM único en el mercado
- **Citas Recurrentes: series semanales, quincenales, mensuales con preview de disponibilidad**

**Ventajas vs Competencia:**
- Único con preview de disponibilidad antes de crear serie recurrente
- Omite automáticamente fechas no disponibles (Calendly/Cal.com fallan silenciosamente)
- UI integrada en el mismo modal de creación de cita (no requiere navegación adicional)

**Próximo foco:** Pagos anticipados y lista de espera para cerrar gaps vs Acuity/Cal.com

---

**Documento actualizado**: 7 de Enero 2026
**Próxima revisión**: Fin Q1 2026

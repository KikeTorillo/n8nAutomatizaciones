# Análisis Comparativo: Módulo Agendamiento Nexo vs Competencia

**Fecha**: 6 de Enero 2026
**Versión**: 2.0
**Última actualización**: Fase 0 completada + Mi Perfil implementado

---

## Resumen Ejecutivo

Análisis del módulo de agendamiento de Nexo vs **Odoo 19 Appointments**, **Calendly**, **Acuity Scheduling**, **Cal.com** y otros líderes.

**Estado actual**: 8/10 (subió de 7.5 tras Fase 0)

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
| Citas recurrentes | ❌ | ❌ | ⚠️ | ✅ | ✅ |
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

---

## 3. Gaps Pendientes (Priorizado)

### Alta Prioridad
| Gap | Impacto | Esfuerzo |
|-----|---------|----------|
| Citas Recurrentes | Retención clientes | 5-8 días |
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
| **Buffer Time** | ✅ | `ServicioFormModal.jsx`, `disponibilidad.model.js` |
| **UI Bloqueos mejorada** | ✅ | `BloqueosPage.jsx`, `BloqueosList.jsx` |
| **Días Festivos + LATAM** | ✅ | `DiasFestivosPage.jsx`, `feriados-latam.js` |
| **Tab Ausencias** | ✅ | `AusenciasTab.jsx` |
| **Mi Perfil (Autoservicio)** | ✅ | `MiPerfilPage.jsx` |

### Detalle Mi Perfil
Portal autoservicio para empleados (similar a Odoo Employee Self Service):
- Acceso condicional: solo usuarios con `profesional_id`
- Widgets: vacaciones, ausencias, acciones rápidas
- Links a: Vacaciones, Mi Calendario, Mis Citas

---

## 5. Roadmap Actualizado

### Q1 2026 (Siguiente)
| Semana | Feature | Prioridad |
|--------|---------|-----------|
| 1-2 | Pagos Anticipados (Stripe) | Alta |
| 3-4 | Citas Recurrentes | Alta |
| 5-6 | Lista de Espera | Alta |
| 7-8 | Widget Embebible | Media |

### Q2 2026
| Feature | Prioridad |
|---------|-----------|
| Google/Outlook Sync | Alta |
| Round-Robin mejorado | Media |
| Reservas Grupales | Media |

---

## 6. Conclusiones

**Mejoras desde v1.0:**
- Buffer time ahora funcional en cálculo de disponibilidad
- Arquitectura modular de ausencias (patrón Odoo)
- Portal Mi Perfil para empleados
- Catálogo feriados LATAM único en el mercado

**Próximo foco:** Pagos anticipados y citas recurrentes para cerrar gaps vs Acuity/Cal.com

---

**Documento actualizado**: 6 de Enero 2026
**Próxima revisión**: Fin Q1 2026

# Gaps Pendientes por Módulo

**Actualizado**: 8 Enero 2026

---

## Resumen Ejecutivo

| Módulo | Alta | Media | Baja | Total |
|--------|:----:|:-----:|:----:|:-----:|
| Agendamiento | 2 | 2 | 1 | 5 |
| Profesionales/RRHH | 2 | 0 | 2 | 4 |
| Workflows | 1 | 3 | 2 | 6 |
| Seguridad | 1 | 0 | 1 | 2 |
| Inventario | 0 | 2 | 0 | 2 |
| Facturación | 0 | 0 | 1 | 1 |
| **Total** | **6** | **7** | **7** | **20** |

---

## Alta Prioridad

### Agendamiento

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Pagos Anticipados** | Reduce no-shows 40-60% | MercadoPago integrado, depósitos 20/50/100% |
| **Sync Google/Outlook** | Evita doble-reserva | Standard en competencia (Calendly, Cal.com) |

### Profesionales/RRHH

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Contratos múltiples** | Historial laboral completo | Empleados con renovaciones/cambios de puesto |
| **Nómina México** | Cumplimiento legal | IMSS, ISR, CFDI recibos de nómina |

### Workflows

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Aprobaciones Paralelas** | OC IT+Finanzas simultáneo | Hoy solo secuencial (1 aprobador activo) |

### Seguridad

| Gap | Impacto | Notas |
|-----|---------|-------|
| **2FA/MFA** | Cumplimiento SOC2/ISO | TOTP, SMS, autenticadores |

---

## Media Prioridad

### Agendamiento

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Widget Embebible** | Captación externa | Incrustar calendario en sitio web cliente |
| **Lista de Espera** | Optimización agenda | Notificar cuando hay disponibilidad |

### Workflows

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Dashboard Métricas/SLAs** | Visibilidad operativa | Tiempo promedio, tasa aprobación, compliance |
| **Aprobación vía Email** | UX ejecutivos | Aprobar/rechazar sin entrar al sistema |
| **Webhooks N8N** | Automatización externa | Integrar workflows con n8n bidireccional |

### Inventario

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Auditoría detallada** | Trazabilidad cambios | Quién cambió qué, cuándo, valor anterior |
| **Kitting/BOM** | Manufactura básica | Ensambles, listas de materiales |

---

## Baja Prioridad

### Agendamiento

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Reservas Grupales** | Clases/talleres | Múltiples asistentes por slot |

### Profesionales/RRHH

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Evaluaciones 360°** | Feedback desempeño | Autoevaluación + pares + supervisor |
| **Reclutamiento** | Ciclo completo RRHH | Vacantes, candidatos, proceso selección |

### Workflows

| Gap | Impacto | Notas |
|-----|---------|-------|
| **Templates Predefinidos** | Onboarding rápido | OC básica, multinivel, gastos, vacaciones |
| **AI Detección Anomalías** | Auto-aprobación inteligente | DeepSeek evalúa riesgo → sugiere acción |

### Seguridad

| Gap | Impacto | Notas |
|-----|---------|-------|
| **API Keys por usuario** | Integraciones externas | Tokens con scopes, rotación automática |

### Facturación

| Gap | Impacto | Notas |
|-----|---------|-------|
| **CFDI 4.0** | Facturación electrónica MX | Timbrado, complementos, cancelación |

---

## Próximo Paso: Auditoría Frontend

### Objetivo
Análisis detallado de los módulos **Agendamiento** y **Profesionales** en el frontend.

### Alcance

| Área | Verificar |
|------|-----------|
| **Componentes reutilizables** | Identificar duplicación de código entre módulos |
| **Consistencia UI** | Mismo patrón para modales, formularios, tablas, filtros |
| **Buenas prácticas** | React Hook Form + Zod, hooks custom, separación de concerns |
| **Optimización** | Memoización, lazy loading, queries eficientes |

### Entregables
- [ ] Inventario de componentes actuales por módulo
- [ ] Lista de componentes a crear/extraer
- [ ] Refactors necesarios para consistencia
- [ ] Recomendaciones de optimización

---

## Roadmap Features

1. **Sprint inmediato**: Pagos Anticipados (alto impacto, MercadoPago ya integrado)
2. **Q1 2026**: Sync calendarios + 2FA/MFA
3. **Q2 2026**: Workflows paralelos + Dashboard métricas

---

## Fortalezas Actuales (vs Competencia)

| Feature | Ventaja |
|---------|---------|
| Multi-servicio por cita | Salones/spas (corte + tintura + peinado) |
| Walk-in nativo | Cola de espera sin cita previa |
| Chatbots IA | Agendamiento por Telegram/WhatsApp |
| Citas Recurrentes | Preview antes de crear serie |
| Round-Robin configurable | Drag & drop por servicio |
| Incapacidades IMSS | Prórrogas, integración bloqueos |


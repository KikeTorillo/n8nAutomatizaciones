# Análisis Comparativo: Módulo Agendamiento Nexo vs Competencia

**Fecha**: 7 de Enero 2026
**Versión**: 3.0
**Estado**: 9/10 - Features core completados

---

## 1. Matriz Comparativa

### Leyenda
- ✅ Implementado | ⚠️ Parcial | ❌ No disponible

### 1.1 Agendamiento y Disponibilidad

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| Reserva de citas online | ✅ | ✅ | ✅ | ✅ | ✅ |
| Multi-servicio por cita | ✅ | ❌ | ❌ | ✅ | ❌ |
| Walk-in (sin cita previa) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Horarios por profesional | ✅ | ✅ | ✅ | ✅ | ✅ |
| Buffer time | ✅ | ✅ | ✅ | ✅ | ✅ |
| Bloqueos | ✅ | ✅ | ⚠️ | ✅ | ✅ |
| Citas recurrentes | ✅ | ❌ | ⚠️ | ✅ | ✅ |
| Round-Robin | ✅ | ✅ | ✅ | ❌ | ✅ |
| **Reservas grupales** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Lista de espera** | ❌ | ❌ | ❌ | ✅ | ❌ |

### 1.2 Integraciones

| Funcionalidad | Nexo | Odoo 19 | Calendly | Acuity | Cal.com |
|--------------|:----:|:-------:|:--------:|:------:|:-------:|
| **Sync Google/Outlook** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Widget embebible** | ❌ | ✅ | ✅ | ✅ | ✅ |
| **Pago anticipado** | ❌ | ✅ | ✅ | ✅ | ✅ |
| Recordatorios WhatsApp | ✅ | ⚠️ | ❌ | ⚠️ | ❌ |
| Chatbots IA | ✅ | ❌ | ❌ | ❌ | ❌ |

---

## 2. Fortalezas Exclusivas de Nexo

| Feature | Ventaja Competitiva |
|---------|---------------------|
| Multi-servicio por cita | Salones/spas (corte + tintura + peinado) |
| Walk-in nativo | Cola de espera para negocios con alto tráfico |
| Chatbots IA | Agendamiento por Telegram/WhatsApp con LLM |
| Catálogo feriados LATAM | MX, CO, AR, CL, PE pre-configurados |
| Round-Robin personalizable | Drag & drop por servicio |
| Citas Recurrentes con Preview | Visualización antes de crear serie |

---

## 3. Gaps Pendientes (Roadmap)

| Prioridad | Feature | Impacto | Complejidad |
|-----------|---------|---------|-------------|
| **Alta** | Pagos Anticipados (MercadoPago) | Reduce no-shows 40-60% | Alta |
| **Alta** | Sync Google/Outlook | Evita doble-reserva | Media |
| Media | Widget Embebible | Captación clientes externos | Media |
| Media | Lista de Espera | Optimización de agenda | Media |
| Baja | Reservas Grupales | Clases/talleres | Alta |

---

## 4. Próximo Foco

**Pagos Anticipados** - Integración con MercadoPago existente para:
- Depósitos configurables por servicio (20%, 50%, 100%)
- Reducción de no-shows
- Tabla `depositos_citas` con tracking de pagos

---

**Documento actualizado**: 7 de Enero 2026 (v3.0)

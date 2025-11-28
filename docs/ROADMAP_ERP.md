# Roadmap ERP para PYMES México

**Versión**: 6.0
**Última actualización**: 28 Noviembre 2025

---

## Estado Actual del Proyecto

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Core** (Auth, Orgs, Planes) | 100% | Multi-tenant RLS, JWT, RBAC |
| **App Home / Launcher** | 100% | Grid 10 apps, badges, accesos rápidos |
| **Profesionales-Usuario** | 100% | Invitaciones, modulos_acceso, empleados |
| **Agendamiento** | 100% | Particionado, múltiples servicios por cita |
| **Recordatorios** | 100% | pg_cron + HTTP, Telegram/WhatsApp |
| **Comisiones** | 100% | Trigger automático, dashboard, reportes |
| **Marketplace** | 95% | Directorio público, agendamiento sin auth |
| **Inventario** | 100% | CRUD, ABC, alertas, órdenes compra |
| **POS** | 85% | Ventas, devoluciones, corte caja |
| **Chatbots** | 100% | MCP Server (7 tools), Telegram + WhatsApp |
| **Contabilidad/CFDI** | 0% | Fase futura |

---

## Ventajas Competitivas vs Odoo

| Aspecto | Este Proyecto | Odoo |
|---------|---------------|------|
| **Precio** | ~$12 USD/usuario | $25 USD/usuario |
| **CFDI** | Nativo (próximo) | Plugin terceros |
| **IA WhatsApp** | Nativo | No existe |
| **Implementación** | Autoservicio | $5,000-$50,000 USD |
| **UX** | React moderna | Compleja |

---

## Roadmap - PENDIENTES

### Fase 1: Completar POS

#### 1.1 Ticket PDF (térmica 58/80mm)

**Archivos a crear:**
| Archivo | Descripción |
|---------|-------------|
| `backend/app/services/ticketPDF.service.js` | Generador PDFKit |
| `backend/app/controllers/pos/ticket.controller.js` | Endpoint `/api/v1/pos/ventas/:id/ticket` |
| `frontend/src/components/pos/TicketPreview.jsx` | Vista previa del ticket |

**Esfuerzo**: 15-20 horas

#### 1.2 Vendedor en POS

- Ya implementado: `profesional_id` en `ventas_pos`
- Ya implementado: `modulos_acceso.pos` para control de acceso
- Pendiente: UI selector/auto-asignación en frontend POS

**Esfuerzo**: 4-6 horas

---

### Fase 2: Mejoras Marketplace

| Mejora | Prioridad | Esfuerzo |
|--------|-----------|----------|
| SEO Técnico (sitemap, robots, Schema.org) | Alta | 3 días |
| Horarios visuales en perfil | Alta | 2 días |
| Galería mejorada (lightbox, drag) | Alta | 3 días |
| Filtro por servicios | Media | 2 días |
| Widget embebible iframe | Media | 3 días |

**Esfuerzo total**: 20-30 horas

---

### Fase 3: Contabilidad + CFDI (Futuro)

**Complejidad**: Alta - 160-264 horas

**Sub-fases:**
1. Catálogos SAT + UI datos fiscales (40h)
2. Generación XML sin timbrado - sandbox (60h)
3. Integración PAC sandbox (40h)
4. Producción + certificación (60h)

---

## Referencia Técnica

### MCP Tools (7 operativos)

| Tool | Descripción |
|------|-------------|
| `listarServicios` | Catálogo con precios |
| `verificarDisponibilidad` | Slots libres + excluir_cita_id |
| `buscarCliente` | Por teléfono o nombre |
| `buscarCitasCliente` | Historial del cliente |
| `crearCita` | Múltiples servicios |
| `reagendarCita` | Con validación disponibilidad |
| `modificarServiciosCita` | Cambiar servicios |

### Optimizaciones Arquitectónicas

**Alta Prioridad - BaseController genérico**
```javascript
// Patrón repetido 171 veces - potencial reducción 40% boilerplate
const organizacionId = req.tenant.organizacionId;
const item = await Model.obtenerPorId(id, organizacionId);
if (!item) return ResponseHelper.error(res, 'No encontrado', 404);
```

---

## Resumen Esfuerzo Pendiente

| Fase | Módulo | Esfuerzo | Prioridad |
|------|--------|----------|-----------|
| 1.1 | Ticket PDF (POS) | 15-20h | Media |
| 1.2 | Vendedor UI (POS) | 4-6h | Media |
| 2 | Mejoras Marketplace | 20-30h | Baja |
| 3 | CFDI + Contabilidad | 160-264h | Futura |

**Total corto plazo**: ~40-56 horas

---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 6.0 | 28 Nov 2025 | Fase Profesional-Usuario 100% completada (invitaciones, empleados, modulos_acceso) |
| 5.0 | 27 Nov 2025 | Limpieza: eliminadas fases completadas |
| 4.0 | 27 Nov 2025 | Órdenes de Compra completado |

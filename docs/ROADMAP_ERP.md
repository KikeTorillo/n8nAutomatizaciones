# Roadmap ERP para PYMES México

**Versión**: 10.0
**Última actualización**: 28 Noviembre 2025

---

## Estado Actual del Proyecto

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Core** (Auth, Orgs, Planes, Clientes) | 100% | Multi-tenant RLS, JWT, RBAC, CRM |
| **Super Admin Model** | 100% | Org propia + panel `/superadmin/*` |
| **App Home / Launcher** | 100% | Grid 11 apps, badges, accesos rápidos |
| **Profesionales-Usuario** | 100% | Invitaciones, modulos_acceso, empleados |
| **Agendamiento** | 100% | Particionado, múltiples servicios por cita |
| **Recordatorios** | 100% | pg_cron + HTTP, Telegram/WhatsApp |
| **Comisiones** | 100% | Trigger automático, dashboard, reportes |
| **Marketplace** | 95% | Directorio público, agendamiento sin auth |
| **Inventario** | 100% | CRUD, ABC, alertas, órdenes compra |
| **POS** | 98% | Ventas, Ticket PDF, ClienteSelector, corte caja |
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

### Fase 1: POS (98% Completado)

#### 1.1 Ticket PDF ✅ COMPLETADO
- `ticketPDF.service.js` (367 líneas) - Soporte 58mm/80mm
- `GET /api/v1/pos/ventas/:id/ticket`
- Descarga e impresión en `VentaDetalleModal.jsx`

#### 1.2 Vendedor en POS ✅ AUTO-ASIGNADO
- Backend auto-asigna `profesional_id` del usuario vinculado
- Badge visual "Vendedor: X" (solo lectura)
- Decisión de diseño: 1 usuario = 1 vendedor

---

### Fase 2: Vista 360° del Cliente (CRM)

**Objetivo**: Tabs con historial completo en ClienteDetailPage.

| Tab | Contenido | Endpoint |
|-----|-----------|----------|
| Resumen | Datos + stats | GET `/clientes/:id/estadisticas` |
| Citas | Historial | GET `/citas?cliente_id=X` |
| Compras | Historial POS | GET `/pos/ventas?cliente_id=X` |

**Esfuerzo**: 8-12 horas

---

### Fase 3: Mejoras Marketplace

| Mejora | Prioridad | Esfuerzo |
|--------|-----------|----------|
| SEO Técnico (sitemap, robots, Schema.org) | Alta | 3 días |
| Horarios visuales en perfil | Alta | 2 días |
| Galería mejorada (lightbox, drag) | Alta | 3 días |
| Filtro por servicios | Media | 2 días |
| Widget embebible iframe | Media | 3 días |

**Esfuerzo total**: 20-30 horas

---

### Fase 4: Contabilidad + CFDI (Futuro)

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
| 1 | POS | ✅ Completado | - |
| 2 | Vista 360° CRM | 8-12h | Alta |
| 3 | Mejoras Marketplace | 20-30h | Media |
| 4 | CFDI + Contabilidad | 160-264h | Futura |

**Total corto plazo**: ~38-42 horas

---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 10.0 | 28 Nov 2025 | POS 98% ✅ (Ticket PDF completado, vendedor auto-asignado) |
| 9.0 | 28 Nov 2025 | Super Admin Model ✅ (org propia, NO acceso cross-tenant, app Admin Plataforma) |
| 8.0 | 28 Nov 2025 | Clientes como Módulo Core ✅ completado (migración backend, ClienteSelector POS, app independiente) |
| 7.0 | 28 Nov 2025 | Análisis arquitectónico Clientes (patrón Odoo/Salesforce) |
| 6.0 | 28 Nov 2025 | Profesional-Usuario 100% (invitaciones, empleados, modulos_acceso) |
| 5.0 | 27 Nov 2025 | Limpieza fases completadas |
| 4.0 | 27 Nov 2025 | Órdenes de Compra completado |

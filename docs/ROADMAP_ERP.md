# Roadmap ERP para PYMES México

**Versión**: 4.0
**Última actualización**: 27 Noviembre 2025

---

## Estado Actual del Proyecto

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Core** (Auth, Orgs, Planes) | 100% | Multi-tenant con RLS, JWT, RBAC |
| **Agendamiento** (Citas, Profesionales) | 100% | Particionado, múltiples servicios por cita |
| **Recordatorios** | 95% | pg_cron + HTTP, Telegram/WhatsApp, inyección memoria chat |
| **Comisiones** | 100% | Trigger automático, dashboard, reportes |
| **Marketplace** | 95% | Directorio público, agendamiento sin auth, SEO básico |
| **Inventario** | 100% | CRUD, ABC, alertas, órdenes de compra, recepciones |
| **POS** | 88% | Ventas, devoluciones, corte caja. Falta: Ticket PDF |
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

## Roadmap de Desarrollo

### Fase 1: Recordatorios - COMPLETADO (95%)

**Implementado:**
- Tablas: `configuracion_recordatorios`, `historial_recordatorios`
- RLS con bypass para jobs cross-tenant
- Job pg_cron cada 5 minutos con extensión HTTP
- Inyección automática en `n8n_chat_histories` para contexto del chatbot
- Servicios Telegram/WhatsApp
- Selección automática de campo contacto (telegram_chat_id vs whatsapp_phone)

**Pendiente:**
- MCP Tool `confirmarCita` (endpoint ya existe)
- UI configuración en frontend

---

### Fase 2: Completar POS e Inventario

#### Inventario - Órdenes de Compra - COMPLETADO (100%)

**Implementado (27 Nov 2025):**

**Base de Datos (4 archivos SQL):**
- `08-ordenes-compra-tablas.sql` - 3 tablas: ordenes_compra, ordenes_compra_items, ordenes_compra_recepciones
- `09-ordenes-compra-indices.sql` - 12 índices optimizados
- `10-ordenes-compra-rls.sql` - 6 políticas RLS multi-tenant
- `11-ordenes-compra-funciones.sql` - 5 funciones + 4 triggers

**Backend:**
- `ordenes-compra.model.js` - Modelo con RLSContextManager
- `ordenes-compra.controller.js` - 8 endpoints (CRUD + recepciones + pagos)
- `ordenes-compra.schemas.js` - Validación Joi completa
- Integrado en rutas `/api/v1/inventario/ordenes-compra/*`

**Frontend:**
- `OrdenesCompraPage.jsx` - Página principal con filtros y estadísticas
- `OrdenCompraFormModal.jsx` - Crear/editar órdenes con múltiples productos
- `OrdenCompraDetalleModal.jsx` - Ver detalle completo
- `RecibirMercanciaModal.jsx` - Registrar recepciones parciales/completas
- `RegistrarPagoModal.jsx` - Registrar pagos
- `useOrdenesCompra.js` - Hook TanStack Query (6 queries + 6 mutations)

**Funcionalidades:**
- Ciclo de vida: borrador → enviada → parcial/recibida | cancelada
- Recepciones parciales con tracking de lotes
- Totales automáticos (subtotal, descuento, impuestos, total)
- Control de pagos con saldo pendiente
- Filtros por estado, proveedor, fechas
- Dashboard con estadísticas

---

#### POS - Faltante: Ticket PDF (térmica 58/80mm)

- Servicio PDFKit para generar tickets
- Formatos 58mm (~164 puntos) y 80mm (~226 puntos)
- Header con datos del negocio, items, totales

**Esfuerzo estimado**: 15-20 horas

---

### Fase 3: Mejoras Marketplace

| Mejora | Prioridad | Esfuerzo |
|--------|-----------|----------|
| SEO Técnico (sitemap, robots, Schema.org) | Alta | 3 días |
| Horarios visuales en perfil | Alta | 2 días |
| Galería mejorada (lightbox, drag) | Alta | 3 días |
| Filtro por servicios | Media | 2 días |
| Widget embebible iframe | Media | 3 días |
| Compartir en redes sociales | Baja | 1 día |

**NO implementar** (fuera de scope): Editor drag-and-drop, CMS, blog, e-commerce

---

### Fase 4: Contabilidad + CFDI (Futuro)

**Complejidad**: Alta - 160-264 horas

**Sub-fases recomendadas:**
1. Catálogos SAT + UI datos fiscales (40h)
2. Generación XML sin timbrado - sandbox (60h)
3. Integración PAC sandbox (Finkok/Facturama) (40h)
4. Producción + certificación (60h)

**Riesgos:**
- Certificados CSD por organización (almacenamiento encriptado)
- Cancelación CFDI 4.0 (workflow complejo)
- Complementos de pago (lógica para pagos parciales)

---

## Arquitectura del Sistema de Recordatorios

```
pg_cron (*/5 min)
    │
    ▼
HTTP POST → /internal/recordatorios/procesar
    │
    ▼
RecordatorioService.procesarBatch()
    │
    ├─ 1. Obtener citas pendientes (bypass RLS)
    │
    ├─ 2. Construir mensaje con plantilla
    │
    ├─ 3. Inyectar en n8n_chat_histories ← CRÍTICO para contexto IA
    │
    ├─ 4. Enviar (Telegram API / WhatsApp Cloud API)
    │
    └─ 5. Marcar cita.recordatorio_enviado = TRUE
```

**Cuando cliente responde:**
- Chatbot recibe mensaje
- Postgres Chat Memory lee contexto (incluye recordatorio)
- AI Agent entiende que es respuesta a recordatorio
- Usa MCP tools para confirmar/reagendar

---

## MCP Tools Actuales

| Tool | Estado | Descripción |
|------|--------|-------------|
| `listarServicios` | Operativo | Catálogo con precios |
| `verificarDisponibilidad` | Operativo | Slots libres + excluir_cita_id |
| `buscarCliente` | Operativo | Por teléfono o nombre |
| `buscarCitasCliente` | Operativo | Historial del cliente |
| `crearCita` | Operativo | Múltiples servicios |
| `reagendarCita` | Operativo | Con validación disponibilidad |
| `modificarServiciosCita` | Operativo | Cambiar servicios |
| `confirmarCita` | **PENDIENTE** | Endpoint existe, falta wrapper MCP |

---

## Optimizaciones Arquitectónicas Identificadas

### Alta Prioridad

**BaseController genérico** - Reducir ~40% boilerplate
```javascript
// Patrón repetido 171 veces:
const organizacionId = req.tenant.organizacionId;
const item = await Model.obtenerPorId(id, organizacionId);
if (!item) return ResponseHelper.error(res, 'No encontrado', 404);
```

### Media Prioridad

**QueryParser helper** - Parsing estandarizado de filtros
**Access Control Layer** - Strategy pattern para diferentes modelos de negocio (SaaS vs pago único)

---

## Estructura SQL Actual

| Módulo | Archivos | Tablas | Estado |
|--------|----------|--------|--------|
| core | 3 | extensiones, enums, funciones | 100% |
| nucleo | 8 | organizaciones, usuarios, planes | 100% |
| catalogos | 8 | ubicaciones, tipos | 100% |
| negocio | 5 | profesionales, servicios, clientes | 100% |
| citas | 6 | citas (particionada), citas_servicios | 100% |
| bloqueos | 6 | bloqueos_horarios | 100% |
| comisiones | 5 | config, historial, trigger | 100% |
| marketplace | 6 | perfiles, reseñas, analytics | 100% |
| inventario | 11 | productos, movimientos, órdenes compra | 100% |
| pos | 5 | ventas, items | 88% |
| pagos | 4 | métodos, Mercado Pago | 100% |
| chatbots | 4 | config, credentials | 100% |
| auditoria | 7 | eventos (particionado) | 100% |
| mantenimiento | 6 | sistema, pg_cron jobs | 100% |
| recordatorios | 4 | config, historial, pg_cron | 95% |

---

## Dependencias Críticas

### Dockerfile PostgreSQL Personalizado
```dockerfile
FROM postgres:17

RUN apt-get update && apt-get install -y \
    postgresql-17-cron \
    postgresql-17-http \  # Extensión para HTTP desde pg_cron
    && rm -rf /var/lib/apt/lists/*

RUN echo "shared_preload_libraries = 'pg_cron'" >> /usr/share/postgresql/postgresql.conf.sample && \
    echo "cron.database_name = 'postgres'" >> /usr/share/postgresql/postgresql.conf.sample
```

### RLS Bypass para Jobs Cross-Tenant

Las siguientes tablas requieren policy de bypass para el job de recordatorios:
- `clientes` - `clientes_system_bypass`
- `organizaciones` - `organizaciones_system_bypass`
- `profesionales` - Ya incluido en `tenant_isolation_profesionales`
- `servicios` - `servicios_system_bypass`
- `configuracion_recordatorios` - `configuracion_recordatorios_system_bypass`
- `historial_recordatorios` - `historial_recordatorios_system_bypass`

Activación: `SET app.bypass_rls = 'true'`

---

## Resumen de Esfuerzo Pendiente

| Fase | Módulo | Esfuerzo | Prioridad |
|------|--------|----------|-----------|
| 1 | MCP confirmarCita + UI config | 6-10h | Alta |
| 2 | ~~Órdenes de compra~~ | ~~20-30h~~ | ✅ COMPLETADO |
| 2 | Ticket PDF | 15-20h | Media |
| 3 | Mejoras Marketplace | 20-30h | Baja |
| 4 | CFDI + Contabilidad | 160-264h | Futura |

**Total pendiente corto plazo**: ~40-60 horas

---

## Historial de Cambios

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 4.0 | 27 Nov 2025 | Órdenes de Compra completado (100%), Inventario al 100% |
| 3.0 | 26 Nov 2025 | Recordatorios 95%, análisis arquitectónico |
| 2.0 | 24 Nov 2025 | Comisiones, Marketplace, POS operativos |

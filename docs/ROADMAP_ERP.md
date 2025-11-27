# Roadmap ERP para PYMES México

**Versión**: 3.0
**Última actualización**: 26 Noviembre 2025

---

## Estado Actual del Proyecto

| Módulo | Estado | Descripción |
|--------|--------|-------------|
| **Core** (Auth, Orgs, Planes) | 100% | Multi-tenant con RLS, JWT, RBAC |
| **Agendamiento** (Citas, Profesionales) | 100% | Particionado, múltiples servicios por cita |
| **Recordatorios** | 95% | pg_cron + HTTP, Telegram/WhatsApp, inyección memoria chat |
| **Comisiones** | 100% | Trigger automático, dashboard, reportes |
| **Marketplace** | 95% | Directorio público, agendamiento sin auth, SEO básico |
| **Inventario** | 85% | CRUD completo, ABC, alertas. Falta: Órdenes de compra |
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

#### Inventario - Faltante: Órdenes de Compra

```sql
-- Propuesta de tablas
CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),
    folio VARCHAR(20) NOT NULL,  -- OC-2025-0001
    estado VARCHAR(20) DEFAULT 'borrador',
    -- Estados: borrador, enviada, parcial, recibida, cancelada
    fecha_orden DATE DEFAULT CURRENT_DATE,
    fecha_entrega_esperada DATE,
    subtotal DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ordenes_compra_items (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id INTEGER REFERENCES productos(id),
    cantidad_ordenada INTEGER NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0,
    precio_unitario DECIMAL(10,2) NOT NULL
);
```

**Esfuerzo estimado**: 20-30 horas

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
| inventario | 7 | productos, movimientos (particionado) | 85% |
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
| 2 | Órdenes de compra | 20-30h | Media |
| 2 | Ticket PDF | 15-20h | Media |
| 3 | Mejoras Marketplace | 20-30h | Baja |
| 4 | CFDI + Contabilidad | 160-264h | Futura |

**Total pendiente corto plazo**: ~60-90 horas

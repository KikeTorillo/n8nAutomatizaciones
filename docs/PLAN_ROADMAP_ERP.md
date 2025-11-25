# Plan de Desarrollo: Roadmap ERP para PYMES México

**Fecha**: 25 Noviembre 2025
**Versión**: 2.2 (Análisis arquitectónico + starterkit)
**Última actualización**: 25 Noviembre 2025
**Análisis competitivo**: vs Odoo

---

## Resumen Ejecutivo

Este documento define el roadmap de desarrollo para evolucionar de una plataforma de agendamiento a un **ERP completo para PYMES México**, compitiendo con Odoo mediante:

- **Precio 50% menor** (~$12 USD vs $25 USD/usuario/mes)
- **IA Conversacional nativa** (WhatsApp/Telegram)
- **CFDI nativo** para cumplimiento fiscal mexicano
- **UX moderna** vs la complejidad de Odoo
- **Onboarding instantáneo** vs semanas de implementación

---

## Prioridades de Desarrollo

1. **Completar Agendamiento** - Sistema de recordatorios con IA
2. **Validar POS e Inventario** - Funcionalidades faltantes
3. **Marketplace** - Mejoras SEO y UX
4. **Siguiente Módulo: Contabilidad** - CFDI + Contabilidad básica

---

## Fase 1: Sistema de Recordatorios con IA Conversacional

### Estado Actual: ~35-40% Implementado

**Lo que YA existe:**
- Campos en tabla `citas`: `recordatorio_enviado`, `fecha_recordatorio`, `confirmacion_requerida`
- Índice optimizado `idx_citas_recordatorios_pendientes`
- 2 endpoints: `GET /citas/recordatorios` y `PATCH /citas/:codigo/recordatorio-enviado`
- Model y Controller básicos (`cita.recordatorios.controller.js`, `cita.recordatorios.model.js`)
- Hook frontend: `useEnviarRecordatorio()` (en `useCitas.js:450`)
- **Endpoint confirmar cita**: `PATCH /api/v1/citas/:id/confirmar-asistencia` ✅

**Lo que FALTA (crítico):**
- Tablas de configuración e historial
- Servicio de envío con inyección en memoria del chat
- MCP tool `confirmarCita`
- Job pg_cron automatizado
- UI de configuración

---

### 1.1 Arquitectura del Sistema

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    SISTEMA DE RECORDATORIOS - ARQUITECTURA                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ⚠️  REQUISITO: La organización DEBE tener chatbot configurado              │
│      Sin chatbot activo = Sin recordatorios                                  │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  FASE 1: PROGRAMACIÓN Y ENVÍO                                               │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  pg_cron (*/5 min)                                                          │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  SELECT citas pendientes de recordatorio                            │    │
│  │  JOIN chatbot_config (para obtener credentials)                     │    │
│  │  WHERE chatbot.activo = TRUE  ← Solo orgs con chatbot               │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                  │                                          │
│                                  ▼                                          │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Backend: RecordatorioService.procesarBatch()                       │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                      │    │
│  │  Para cada recordatorio:                                            │    │
│  │                                                                      │    │
│  │  1. CONSTRUIR MENSAJE PERSONALIZADO                                 │    │
│  │     "Hola {cliente}! Te recordamos tu cita en {negocio}:            │    │
│  │      📅 {fecha} a las {hora}                                        │    │
│  │      ✂️ Servicios: {servicios}                                      │    │
│  │      Responde SI para confirmar o escríbeme si necesitas cambiar."  │    │
│  │                                                                      │    │
│  │  2. INYECTAR EN MEMORIA DEL CHAT (n8n_chat_histories)  ← CRÍTICO   │    │
│  │     INSERT INTO n8n_chat_histories (session_id, message)            │    │
│  │     VALUES (sender, '{"type":"ai","content":"..."}')                │    │
│  │                                                                      │    │
│  │  3. ENVIAR MENSAJE VÍA API (credentials del chatbot del negocio)   │    │
│  │     IF telegram → Telegram Bot API (bot_token del negocio)          │    │
│  │     IF whatsapp → WhatsApp Cloud API (phone_id del negocio)         │    │
│  │                                                                      │    │
│  │  4. REGISTRAR EN HISTORIAL                                          │    │
│  │     UPDATE citas SET recordatorio_enviado = TRUE                    │    │
│  │     INSERT INTO historial_recordatorios (...)                       │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
│  ══════════════════════════════════════════════════════════════════════════ │
│  FASE 2: CLIENTE RESPONDE → CHATBOT CON CONTEXTO                            │
│  ══════════════════════════════════════════════════════════════════════════ │
│                                                                              │
│  Cliente responde: "SI" o "Quiero cambiar mi cita"                          │
│       │                                                                      │
│       ▼                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Workflow Chatbot Existente (mismo bot/número)                      │    │
│  │  ─────────────────────────────────────────────────────────────────  │    │
│  │                                                                      │    │
│  │  Telegram Trigger → recibe mensaje del cliente                      │    │
│  │       │                                                              │    │
│  │       ▼                                                              │    │
│  │  Postgres Chat Memory → LEE la memoria                              │    │
│  │       │                                                              │    │
│  │       │  Memoria contiene:                                          │    │
│  │       │  [AI] "Te recordamos tu cita para CORTE DE CABELLO..."     │    │
│  │       │  [Human] "SI"  ← mensaje actual                             │    │
│  │       │                                                              │    │
│  │       ▼                                                              │    │
│  │  AI Agent → ENTIENDE EL CONTEXTO                                    │    │
│  │       │                                                              │    │
│  │       │  "El último mensaje que envié fue un recordatorio.          │    │
│  │       │   El cliente respondió 'SI'. Esto es una confirmación."     │    │
│  │       │                                                              │    │
│  │       ▼                                                              │    │
│  │  MCP Tools:                                                         │    │
│  │    SI respuesta = confirmación:                                     │    │
│  │      → buscarCitasCliente(sender)                                   │    │
│  │      → confirmarCita(cita_id)  ← NUEVO TOOL                        │    │
│  │                                                                      │    │
│  │    SI respuesta = quiere cambiar:                                   │    │
│  │      → buscarCitasCliente(sender)                                   │    │
│  │      → verificarDisponibilidad(...)                                 │    │
│  │      → reagendarCita(...)                                           │    │
│  │                                                                      │    │
│  │       ▼                                                              │    │
│  │  Respuesta: "✅ Perfecto! Tu cita está confirmada."                │    │
│  │                                                                      │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

### 1.2 Estructura de la Memoria del Chat (n8n_chat_histories)

El sistema usa **Postgres Chat Memory** de n8n con LangChain. La tabla tiene esta estructura:

```sql
-- Tabla creada automáticamente por n8n
CREATE TABLE n8n_chat_histories (
    id SERIAL PRIMARY KEY,
    session_id VARCHAR(255) NOT NULL,   -- sender (teléfono o chat_id)
    message JSONB NOT NULL              -- Mensaje serializado LangChain
);
```

**Formato del campo `message` (JSONB):**

```json
// Mensaje del AI (recordatorio)
{
    "type": "ai",
    "content": "Te recordamos tu cita para CORTE DE CABELLO mañana 26/11 a las 10:00...",
    "additional_kwargs": {},
    "tool_calls": [],
    "response_metadata": {},
    "id": null
}

// Mensaje del usuario (respuesta)
{
    "type": "human",
    "content": "SI",
    "additional_kwargs": {},
    "id": null
}
```

**Inyección desde Backend:**

```javascript
// backend/app/modules/recordatorios/services/recordatorioService.js

async inyectarEnMemoriaChat(sender, mensajeRecordatorio) {
    const query = `
        INSERT INTO n8n_chat_histories (session_id, message)
        VALUES ($1, $2)
    `;

    const mensajeAI = {
        type: "ai",
        content: mensajeRecordatorio,
        additional_kwargs: {},
        tool_calls: [],
        response_metadata: {},
        id: null
    };

    await db.query(query, [sender, JSON.stringify(mensajeAI)]);
}
```

---

### 1.3 Tabla de Configuración de Recordatorios

```sql
-- sql/recordatorios/01-tablas.sql

CREATE TABLE configuracion_recordatorios (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Activación
    habilitado BOOLEAN DEFAULT TRUE,

    -- Tiempos (múltiples recordatorios)
    recordatorio_1_horas INTEGER DEFAULT 24,      -- 24h antes
    recordatorio_1_activo BOOLEAN DEFAULT TRUE,
    recordatorio_2_horas INTEGER DEFAULT 2,       -- 2h antes
    recordatorio_2_activo BOOLEAN DEFAULT FALSE,

    -- Plantillas personalizables
    plantilla_mensaje TEXT DEFAULT 'Hola {{cliente_nombre}}! 👋

Te recordamos tu cita en {{negocio_nombre}}:
📅 {{fecha}} a las {{hora}}
✂️ Servicios: {{servicios}}
💰 Total: ${{precio}}

Responde SI para confirmar o escríbeme si necesitas cambiar algo.',

    -- Ventana horaria (no enviar de noche)
    hora_inicio TIME DEFAULT '08:00',
    hora_fin TIME DEFAULT '21:00',

    -- Reintentos
    max_reintentos INTEGER DEFAULT 3,

    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uk_config_recordatorios_org UNIQUE(organizacion_id)
);

-- Historial de envíos
CREATE TABLE historial_recordatorios (
    id BIGSERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    cita_id INTEGER NOT NULL,

    -- Detalles del envío
    canal VARCHAR(20) NOT NULL,  -- 'telegram', 'whatsapp'
    sender VARCHAR(50) NOT NULL,  -- ID del chat o teléfono
    mensaje_enviado TEXT NOT NULL,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',
    -- Estados: 'pendiente', 'enviado', 'fallido', 'confirmado'

    error_mensaje TEXT,
    intento_numero INTEGER DEFAULT 1,

    -- Respuesta del cliente (si aplica)
    respuesta_cliente TEXT,
    fecha_respuesta TIMESTAMPTZ,

    -- Timestamps
    programado_para TIMESTAMPTZ NOT NULL,
    enviado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_historial_recordatorios_pendientes
ON historial_recordatorios(programado_para)
WHERE estado = 'pendiente';

CREATE INDEX idx_historial_recordatorios_org
ON historial_recordatorios(organizacion_id, creado_en DESC);
```

---

### 1.4 MCP Tool: confirmarCita

**El endpoint ya existe:** `PATCH /api/v1/citas/:id/confirmar-asistencia`

Solo necesitamos crear el wrapper MCP:

```javascript
// backend/mcp-server/tools/confirmarCita.js

const Joi = require('joi');
const { createApiClient } = require('../utils/apiClient');
const logger = require('../utils/logger');

const inputSchema = {
    type: 'object',
    properties: {
        cita_id: {
            type: 'number',
            description: 'ID de la cita a confirmar',
        },
    },
    required: ['cita_id'],
};

const joiSchema = Joi.object({
    cita_id: Joi.number().integer().positive().required(),
});

async function execute(args, jwtToken) {
    try {
        if (!jwtToken) {
            return {
                success: false,
                message: 'Token JWT no proporcionado.',
                data: null,
            };
        }

        const { error, value } = joiSchema.validate(args);
        if (error) {
            return {
                success: false,
                message: `Error de validación: ${error.details[0].message}`,
                data: null,
            };
        }

        const apiClient = createApiClient(jwtToken);

        // Usar endpoint existente
        const response = await apiClient.patch(
            `/api/v1/citas/${value.cita_id}/confirmar-asistencia`,
            {}
        );

        const resultado = response.data.data || response.data;

        logger.info(`✅ Cita ${value.cita_id} confirmada exitosamente`);

        return {
            success: true,
            message: 'Cita confirmada exitosamente. El cliente ha confirmado su asistencia.',
            data: {
                cita_id: resultado.id || value.cita_id,
                codigo_cita: resultado.codigo_cita,
                estado: 'confirmada',
                confirmada_en: new Date().toISOString(),
            },
        };

    } catch (error) {
        logger.error('[confirmarCita] Error:', error.message);

        if (error.response?.status === 400) {
            return {
                success: false,
                message: error.response.data?.mensaje || 'No se puede confirmar esta cita.',
                data: null,
            };
        }

        if (error.response?.status === 404) {
            return {
                success: false,
                message: 'Cita no encontrada.',
                data: null,
            };
        }

        return {
            success: false,
            message: `Error al confirmar cita: ${error.message}`,
            data: null,
        };
    }
}

module.exports = {
    name: 'confirmarCita',
    description: 'Confirma la asistencia del cliente a una cita. Cambia el estado de "pendiente" a "confirmada". Solo puede confirmar citas en estado "pendiente". Usar cuando el cliente responde afirmativamente a un recordatorio.',
    inputSchema,
    execute,
};
```

---

### 1.5 Backend Service: RecordatorioService

```javascript
// backend/app/modules/recordatorios/services/recordatorioService.js

class RecordatorioService {

    /**
     * Obtiene recordatorios pendientes de envío
     * Solo para organizaciones con chatbot activo
     */
    async obtenerPendientes(limite = 100) {
        const query = `
            SELECT
                c.id as cita_id,
                c.fecha_cita,
                c.hora_inicio,
                c.precio_total,
                cl.nombre as cliente_nombre,
                cl.telefono as cliente_telefono,
                o.nombre as negocio_nombre,
                cc.plataforma,
                cc.config_plataforma,
                cr.plantilla_mensaje
            FROM citas c
            JOIN clientes cl ON c.cliente_id = cl.id
            JOIN organizaciones o ON c.organizacion_id = o.id
            JOIN chatbot_config cc ON c.organizacion_id = cc.organizacion_id
            JOIN configuracion_recordatorios cr ON c.organizacion_id = cr.organizacion_id
            WHERE c.estado IN ('pendiente', 'confirmada')
              AND c.recordatorio_enviado = FALSE
              AND c.fecha_cita - INTERVAL '1 hour' * cr.recordatorio_1_horas <= NOW()
              AND c.fecha_cita > NOW()
              AND cc.activo = TRUE
              AND cc.deleted_at IS NULL
              AND cr.habilitado = TRUE
              AND CURRENT_TIME BETWEEN cr.hora_inicio AND cr.hora_fin
            ORDER BY c.fecha_cita ASC
            LIMIT $1
        `;

        return await db.query(query, [limite]);
    }

    /**
     * Procesa un batch de recordatorios
     */
    async procesarBatch(recordatorios) {
        const resultados = [];

        for (const rec of recordatorios) {
            try {
                // 1. Construir mensaje
                const mensaje = this.construirMensaje(rec);

                // 2. Determinar sender (chat_id o teléfono)
                const sender = this.obtenerSender(rec);

                // 3. Inyectar en memoria del chat
                await this.inyectarEnMemoriaChat(sender, mensaje);

                // 4. Enviar mensaje
                const enviado = await this.enviarMensaje(rec, mensaje);

                // 5. Registrar resultado
                await this.registrarEnvio(rec, mensaje, enviado);

                resultados.push({ cita_id: rec.cita_id, success: true });

            } catch (error) {
                logger.error(`Error procesando recordatorio cita ${rec.cita_id}:`, error);
                resultados.push({ cita_id: rec.cita_id, success: false, error: error.message });
            }
        }

        return resultados;
    }

    /**
     * Inyecta el mensaje de recordatorio en la memoria del chat
     * para que el AI Agent tenga contexto cuando el cliente responda
     */
    async inyectarEnMemoriaChat(sender, mensaje) {
        const query = `
            INSERT INTO n8n_chat_histories (session_id, message)
            VALUES ($1, $2)
        `;

        const mensajeAI = {
            type: "ai",
            content: mensaje,
            additional_kwargs: {},
            tool_calls: [],
            response_metadata: {},
            id: null
        };

        await db.query(query, [sender, JSON.stringify(mensajeAI)]);
    }

    /**
     * Envía el mensaje usando las credentials del chatbot del negocio
     */
    async enviarMensaje(recordatorio, mensaje) {
        const { plataforma, config_plataforma } = recordatorio;
        const credentials = JSON.parse(config_plataforma);

        if (plataforma === 'telegram') {
            return await this.enviarTelegram(credentials.bot_token, recordatorio.chat_id, mensaje);
        } else if (plataforma === 'whatsapp') {
            return await this.enviarWhatsApp(credentials, recordatorio.cliente_telefono, mensaje);
        }

        throw new Error(`Plataforma ${plataforma} no soportada`);
    }
}
```

---

### 1.6 Job pg_cron

> ⚠️ **DEPENDENCIA**: Requiere extensión `pg_net` para HTTP desde PostgreSQL.
> Alternativa: Usar cron del sistema operativo o n8n Schedule Trigger.

```sql
-- sql/mantenimiento/06-pg-cron.sql (agregar)

-- Verificar extensión pg_net
CREATE EXTENSION IF NOT EXISTS pg_net;

SELECT cron.schedule(
    'procesar-recordatorios',
    '*/5 * * * *',  -- Cada 5 minutos
    $$
    SELECT net.http_post(
        'http://backend:3000/internal/recordatorios/procesar',
        '{}',
        'application/json'
    );
    $$
);
```

---

### 1.7 Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `sql/recordatorios/01-tablas.sql` | CREAR | 2 tablas nuevas |
| `sql/recordatorios/02-indices.sql` | CREAR | Índices optimizados |
| `sql/recordatorios/03-rls.sql` | CREAR | Políticas RLS |
| `sql/mantenimiento/06-pg-cron.sql` | MODIFICAR | Agregar job |
| `backend/app/modules/recordatorios/services/recordatorioService.js` | CREAR | Lógica principal |
| `backend/app/modules/recordatorios/services/telegramService.js` | CREAR | Envío Telegram |
| `backend/app/modules/recordatorios/services/whatsappService.js` | CREAR | Envío WhatsApp |
| `backend/app/modules/recordatorios/controllers/recordatorios.controller.js` | CREAR | Endpoints |
| `backend/app/modules/recordatorios/routes/recordatorios.js` | CREAR | Rutas |
| `backend/mcp-server/tools/confirmarCita.js` | CREAR | MCP Tool |
| `backend/mcp-server/tools/index.js` | MODIFICAR | Registrar tool |
| `frontend/src/pages/configuracion/RecordatoriosPage.jsx` | CREAR | UI config |
| `frontend/src/hooks/useRecordatoriosConfig.js` | CREAR | Queries + mutations |

---

## Fase 2: Validar y Completar POS e Inventario

### 2.1 Inventario - Estado: ~85%

**Funcionalidades existentes:** 33 endpoints, 5 tablas (`categorias_productos`, `proveedores`, `productos`, `movimientos_inventario`, `alertas_inventario`), análisis ABC, alertas automáticas

**Funcionalidades faltantes:**

| Funcionalidad | Prioridad | Esfuerzo |
|---------------|-----------|----------|
| **Órdenes de Compra** | Alta | 1 semana |
| Exportación CSV/Excel reportes | Media | 3 días |
| Validación RFC proveedores | Baja | 2 días |
| Generación códigos de barras | Baja | 3 días |

**Implementar Órdenes de Compra:**
```sql
-- sql/inventario/ordenes-compra/01-tablas.sql
CREATE TABLE ordenes_compra (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),

    folio VARCHAR(20) NOT NULL,  -- OC-2025-0001
    estado VARCHAR(20) DEFAULT 'borrador',
    -- Estados: borrador, enviada, parcial, recibida, cancelada

    fecha_orden DATE DEFAULT CURRENT_DATE,
    fecha_entrega_esperada DATE,
    fecha_recepcion DATE,

    subtotal DECIMAL(12,2) DEFAULT 0,
    impuestos DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,

    notas TEXT,

    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ordenes_compra_items (
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id),

    cantidad_ordenada INTEGER NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0,

    precio_unitario DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_ordenada * precio_unitario) STORED,

    creado_en TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 POS - Estado: ~88%

**Funcionalidades existentes:** 11 endpoints activos (`routes/pos.js`), ventas, corte de caja, **devoluciones** ✅

> ⚠️ **NOTA**: Las devoluciones YA ESTÁN IMPLEMENTADAS en `routes/pos.js:164-173`

**Funcionalidades faltantes:**

| Funcionalidad | Prioridad | Esfuerzo |
|---------------|-----------|----------|
| **Ticket PDF (térmica 58/80mm)** | Alta | 1 semana |
| Comisiones por venta POS | Media | 3 días |
| Descuento por cliente VIP | Baja | 2 días |

**Implementar Ticket PDF:**
```javascript
// backend/app/modules/pos/services/ticket.service.js
const PDFDocument = require('pdfkit');

class TicketService {
    async generarTicket(ventaId, formato = '80mm') {
        const venta = await this.obtenerVentaCompleta(ventaId);

        const anchos = {
            '58mm': 164,  // 58mm = ~164 puntos
            '80mm': 226   // 80mm = ~226 puntos
        };

        const doc = new PDFDocument({
            size: [anchos[formato], 'auto'],
            margin: 10
        });

        // Header
        doc.fontSize(12).text(venta.organizacion.nombre, { align: 'center' });
        doc.fontSize(8).text(venta.organizacion.direccion, { align: 'center' });
        // ... resto de implementación

        return doc;
    }
}
```

### Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `sql/inventario/ordenes-compra/01-tablas.sql` | CREAR | Órdenes de compra |
| `backend/app/modules/inventario/controllers/ordenes-compra.controller.js` | CREAR | CRUD |
| `backend/app/modules/pos/services/ticket.service.js` | CREAR | Generación PDF |
| `frontend/src/pages/inventario/OrdenesCompraPage.jsx` | CREAR | UI |
| `frontend/src/components/pos/TicketPreview.jsx` | CREAR | Preview ticket |

---

## Fase 3: Marketplace - Mejoras (~95% completo)

### Análisis Competitivo: Marketplace vs Odoo Website

| Tu Marketplace | Odoo Website |
|----------------|--------------|
| Directorio de negocios | CMS/Website builder |
| Agendamiento público | E-commerce |
| Reseñas validadas | Blog + páginas libres |
| "Google Maps + Calendly" | "Wix + Shopify" |

**Conclusión**: Son productos **COMPLETAMENTE DIFERENTES**. No intentar convertir Marketplace en website builder.

### Mejoras Recomendadas

**Prioridad Alta:**

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| SEO Técnico | Sitemap.xml, robots.txt, Schema.org LocalBusiness | 3 días |
| Horarios visuales | UI para definir horarios de atención en perfil | 2 días |
| Galería mejorada | Lightbox, ordenamiento drag-and-drop | 3 días |

**Prioridad Media:**

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| Compartir redes | Botones compartir perfil en WhatsApp/Facebook | 1 día |
| Filtro por servicios | Buscar "corte de cabello guadalajara" | 2 días |
| Widget embebible | `<iframe>` para sitios externos | 3 días |
| Fotos en reseñas | Subir imágenes con reseña | 2 días |

### NO Implementar (fuera de scope)

- Editor drag-and-drop
- Páginas libres
- Blog
- E-commerce/carrito
- Temas personalizables

---

## Fase 4: Módulo Contabilidad + CFDI

> ⚠️ **COMPLEJIDAD ALTA**: Este módulo requiere ~160-264 horas de desarrollo.
> Se recomienda dividir en sub-fases incrementales.

### Riesgos Críticos a Considerar

| Riesgo | Severidad | Mitigación |
|--------|-----------|------------|
| Certificados CSD por organización | Alta | Almacenamiento encriptado BYTEA + gestión de vigencia |
| Validación RFC en tiempo real | Alta | Cache local + validación periódica SAT |
| Actualizaciones catálogos SAT | Media | Job pg_cron para sincronización mensual |
| Cancelación CFDI 4.0 | Alta | Workflow complejo con motivos obligatorios |
| Complementos de pago | Alta | Lógica separada para pagos parciales |

### Sub-fases Recomendadas

1. **4.1a**: Catálogos SAT + UI captura datos fiscales (40h)
2. **4.1b**: Generación XML sin timbrado - modo sandbox (60h)
3. **4.1c**: Integración PAC sandbox (Finkok/Facturama) (40h)
4. **4.1d**: Producción + certificación (60h)

### 4.1 Facturación CFDI - CRÍTICO para México

**Estructura del módulo:**

```
backend/app/modules/facturacion/
├── manifest.json
├── controllers/
│   ├── facturas.controller.js      # CRUD facturas
│   ├── cfdi.controller.js          # Timbrado, cancelación
│   └── catalogos.controller.js     # Catálogos SAT
├── models/
│   ├── facturas.model.js
│   ├── cfdi.model.js
│   └── catalogos.model.js
├── services/
│   ├── pac.service.js              # Integración Finkok/Facturama
│   └── xml.service.js              # Generación XML CFDI 4.0
├── routes/
│   └── facturacion.routes.js
└── schemas/
    └── facturacion.schemas.js
```

**Tablas SQL principales:**

```sql
-- Catálogos SAT
CREATE TABLE sat_uso_cfdi (...);
CREATE TABLE sat_forma_pago (...);
CREATE TABLE sat_metodo_pago (...);
CREATE TABLE sat_regimen_fiscal (...);

-- Datos fiscales
CREATE TABLE datos_fiscales_emisor (...);
CREATE TABLE datos_fiscales_cliente (...);

-- Facturas
CREATE TABLE facturas (...);
CREATE TABLE facturas_conceptos (...);
CREATE TABLE facturas_complementos_pago (...);
```

### 4.2 Contabilidad Básica

**Tablas:**
- `cuentas_contables` - Catálogo de cuentas (NIF México simplificado)
- `polizas` - Pólizas contables
- `polizas_movimientos` - Movimientos de póliza
- `balanza_comprobacion` - Vista para reportes

---

## Resumen de Roadmap

| Fase | Módulo | Estado Actual | Objetivo | Esfuerzo Est. | Componentes Clave |
|------|--------|---------------|----------|---------------|-------------------|
| 1 | Recordatorios | ~35-40% | 100% | 20-30h | Inyección memoria chat, MCP confirmarCita |
| 2 | POS + Inventario | 85-88% | 100% | 40-60h | Órdenes compra, Ticket PDF |
| 3 | Marketplace | ~92% | 100% | 20-30h | SEO técnico, Widget embebible |
| 4 | CFDI + Contabilidad | 0% | MVP | 160-264h | PAC, XML CFDI 4.0, Certificados CSD |

---

## Comparativa vs Odoo

### Ventajas Competitivas

| Aspecto | Tu Proyecto | Odoo |
|---------|-------------|------|
| **Precio** | ~$12 USD/usuario | $25 USD/usuario |
| **CFDI** | Nativo (próximo) | Plugin de terceros |
| **IA WhatsApp** | Nativo | No existe |
| **Implementación** | Autoservicio | $5,000-$50,000 USD |
| **Soporte** | Local México | Quejas frecuentes |
| **UX** | Moderna (React) | Compleja |

### Diferenciadores Únicos (moat defensible)

1. **IA Conversacional Nativa** - WhatsApp Business API para atención y ventas
2. **CFDI Integrado** - Facturación electrónica sin plugins externos
3. **Precio Agresivo** - 50% menor que Odoo con funcionalidad equivalente
4. **Onboarding Instantáneo** - Sin implementadores, sin costos ocultos
5. **Marketplace B2C** - Tus clientes te encuentran (Odoo no tiene esto)

---

## MCP Tools - Estado Actual

| Tool | Estado | Descripción |
|------|--------|-------------|
| `listarServicios` | ✅ Existe | Catálogo con precios |
| `verificarDisponibilidad` | ✅ Existe | Slots libres |
| `buscarCliente` | ✅ Existe | Por teléfono/nombre |
| `buscarCitasCliente` | ✅ Existe | Historial del cliente |
| `crearCita` | ✅ Existe | Creación validada |
| `reagendarCita` | ✅ Existe | Modificar citas |
| `modificarServiciosCita` | ✅ Existe | Cambiar servicios |
| `confirmarCita` | ❌ **CREAR** | Confirmar asistencia |

---

## Archivos Críticos Existentes

### Recordatorios (base existente)
- `backend/app/modules/agendamiento/models/citas/cita.recordatorios.model.js`
- `backend/app/modules/agendamiento/controllers/citas/cita.recordatorios.controller.js`
- `sql/citas/01-tablas-citas.sql` (campos recordatorio_*)

### Endpoint Confirmar Cita (YA EXISTE)
- `backend/app/modules/agendamiento/routes/citas.js:171` → `PATCH /:id/confirmar-asistencia`
- `backend/app/modules/agendamiento/controllers/citas/cita.base.controller.js:155`
- `backend/app/modules/agendamiento/models/citas/cita.base.model.js:737`

### POS
- `sql/pos/01-tablas.sql`
- `backend/app/modules/pos/controllers/ventas.controller.js`
- `frontend/src/pages/pos/VentaPOSPage.jsx`

### Inventario
- `sql/inventario/01-tablas.sql`
- `backend/app/modules/inventario/controllers/`
- `frontend/src/pages/inventario/`

### Marketplace
- `sql/marketplace/01-tablas-marketplace.sql`
- `backend/app/modules/marketplace/controllers/`
- `frontend/src/pages/marketplace/`

---

## Análisis Arquitectónico: Optimización y Desacoplamiento

> **Contexto**: Análisis realizado para evaluar viabilidad de usar el proyecto como starterkit ERP.

### Métricas del Código Actual

| Métrica | Valor | Observación |
|---------|-------|-------------|
| Endpoints HTTP | ~200 | Handlers `async (req, res)` |
| Usos `req.tenant.organizacionId` | 171 | Patrón repetido en controllers |
| Usos `RLSContextManager` | 309 | Bien adoptado en models |
| Usos `ResponseHelper` | 406 | Consistente en todo el backend |
| Hooks TanStack Query | 296 | `useQuery`/`useMutation` en frontend |
| Controllers | ~35 clases | Patrón consistente |
| Models | ~30 clases | Todos usan RLS |

### ✅ Patrones Bien Implementados

1. **RLSContextManager** - Abstracción sólida para multi-tenancy
   - Gestión automática de conexiones y transacciones
   - Limpieza de contexto en `finally` (previene contaminación del pool)
   - Métodos claros: `query()`, `transaction()`, `withBypass()`

2. **ResponseHelper** - Respuestas HTTP estandarizadas
   - Consistente en 406 usos
   - Incluye timestamp, pagination, error codes

3. **Estructura modular por dominio**
   ```
   modules/
   ├── core/        # Auth, organizaciones, planes (CORE)
   ├── agendamiento/# Citas, profesionales (TEMPLATE)
   ├── inventario/  # Productos, stock (TEMPLATE)
   ├── pos/         # Ventas (TEMPLATE)
   └── marketplace/ # Perfiles públicos (TEMPLATE)
   ```

4. **Frontend con TanStack Query**
   - 296 hooks bien organizados
   - Invalidación de cache correcta
   - staleTime configurado por tipo de dato

### ⚠️ Redundancias Identificadas

#### 1. Boilerplate en Controllers (ALTA PRIORIDAD)

```javascript
// Patrón repetido en TODOS los controllers:
static obtenerPorId = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const organizacionId = req.tenant.organizacionId;  // ← 171 veces
    const item = await Model.obtenerPorId(parseInt(id), organizacionId);
    if (!item) return ResponseHelper.error(res, 'No encontrado', 404);
    return ResponseHelper.success(res, item, 'Obtenido');
});
```

**Solución propuesta**: BaseController con métodos genéricos

```javascript
// utils/BaseController.js (NUEVO)
class BaseController {
    constructor(model, resourceName) {
        this.model = model;
        this.resourceName = resourceName;
    }

    obtenerPorId = asyncHandler(async (req, res) => {
        const id = parseInt(req.params.id);
        const orgId = req.tenant.organizacionId;
        const item = await this.model.obtenerPorId(id, orgId);
        if (!item) return ResponseHelper.notFound(res, `${this.resourceName} no encontrado`);
        return ResponseHelper.success(res, item);
    });

    // crear, actualizar, eliminar, listar genéricos...
}
```

#### 2. Parsing de Query Params (MEDIA PRIORIDAD)

```javascript
// Repetido en múltiples controllers:
const filtros = {
    activo: req.query.activo === 'true' || req.query.activo === true,
    categoria_id: req.query.categoria_id ? parseInt(req.query.categoria_id) : undefined,
    busqueda: req.query.busqueda || undefined,
    limit: req.query.limit ? parseInt(req.query.limit) : 50,
    offset: req.query.offset ? parseInt(req.query.offset) : 0
};
```

**Solución propuesta**: QueryParser helper

```javascript
// utils/queryParser.js (NUEVO)
class QueryParser {
    static parse(query, schema) {
        return Object.entries(schema).reduce((acc, [key, config]) => {
            const value = query[key];
            if (value === undefined) return acc;

            if (config.type === 'boolean') acc[key] = value === 'true' || value === true;
            else if (config.type === 'int') acc[key] = parseInt(value);
            else acc[key] = value;
            return acc;
        }, {});
    }
}
```

### 🔧 Acoplamiento a Resolver (Nivel 9 del Refactor)

El `middleware/subscription.js` tiene **lógica hardcodeada** que impide reutilización:

```javascript
// ❌ ACTUAL - Acoplado a SaaS recurrente:
const tiposValidos = ['profesionales', 'servicios', 'citas_mes'...]; // Hardcoded
if (subscription.estado === 'trial')...  // Específico de modelo recurrente
if (subscription.estado === 'morosa')... // No aplica a pago único
```

**Solución (ya documentada en PLAN_REFACTOR)**: Strategy Pattern

```javascript
// ✅ OBJETIVO - Access Control agnóstico:
// CORE: middleware/access-control.js
AccessControlMiddleware.checkAccess(accessStrategy)  // Dependency injection

// TEMPLATE: config/access-rules.config.js
class SubscriptionAccessStrategy { verifyAccess() } // SaaS recurrente
class PackageAccessStrategy { verifyAccess() }      // Pago único
```

### 📊 Clasificación de Archivos: CORE vs TEMPLATE

| Capa | CORE (Reutilizable) | TEMPLATE (Específico) |
|------|---------------------|----------------------|
| **Middleware** | auth, tenant, validation, rateLimiting | subscription.js ⚠️ |
| **Utils** | RLSContextManager, helpers, logger | cita-validacion.util.js |
| **Models** | usuario, organizacion, planes | citas, profesionales, productos |
| **SQL** | core/, nucleo/ | agendamiento/, pos/, inventario/ |

### 🎯 Recomendaciones de Optimización

| Prioridad | Acción | Impacto | Esfuerzo |
|-----------|--------|---------|----------|
| **Alta** | Crear BaseController genérico | Reduce ~40% boilerplate | 8h |
| **Alta** | Completar Access Control Layer (Nivel 9) | Habilita starterkit | 15h |
| **Media** | QueryParser para filtros comunes | Reduce duplicación | 4h |
| **Media** | Extraer subscripcion.model a template | Desacopla CORE | 6h |
| **Baja** | ErrorHandler centralizado | Mejora debugging | 4h |
| **Baja** | Documentar API con Swagger/OpenAPI | DX mejorada | 12h |

### 📁 Estructura Objetivo para Starterkit

```
backend/app/
├── core/                           # 100% REUTILIZABLE
│   ├── middleware/
│   │   ├── access-control.js       # Strategy pattern (nuevo)
│   │   ├── auth.js
│   │   ├── tenant.js
│   │   └── validation.js
│   ├── utils/
│   │   ├── rlsContextManager.js
│   │   ├── BaseController.js       # (nuevo)
│   │   ├── QueryParser.js          # (nuevo)
│   │   └── helpers.js
│   └── models/
│       ├── usuario.model.js
│       ├── organizacion.model.js
│       └── planes.model.js         # Con JSONB genérico
│
└── templates/
    ├── scheduling-saas/            # Este proyecto
    │   ├── config/access-rules.js
    │   ├── middleware/subscription.js
    │   ├── models/subscripcion.model.js
    │   └── modules/
    │       ├── agendamiento/
    │       ├── comisiones/
    │       └── marketplace/
    │
    └── invitaciones-digitales/     # Futuro proyecto
        ├── config/access-rules.js  # Pago único
        ├── models/paquete.model.js
        └── modules/invitaciones/
```

---

## Fuentes de Investigación

- [Odoo Pricing Guide 2025](https://www.brainvire.com/insights/odoo-erp-implementation-cost/)
- [Odoo Official Pricing](https://www.odoo.com/pricing)
- [LangChain PostgresChatMessageHistory](https://api.python.langchain.com/en/latest/chat_message_histories/langchain_postgres.chat_message_histories.PostgresChatMessageHistory.html)
- [n8n Postgres Chat Memory Docs](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memorypostgreschat/)
- [LangChain Messages Documentation](https://docs.langchain.com/oss/python/langchain/messages)

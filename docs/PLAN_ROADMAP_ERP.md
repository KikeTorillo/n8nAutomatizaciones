# Plan de Desarrollo: Roadmap ERP para PYMES México

**Fecha**: 25 Noviembre 2025
**Versión**: 1.0
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

1. **Completar Agendamiento** - Sistema de recordatorios
2. **Validar POS e Inventario** - Funcionalidades faltantes
3. **Marketplace** - No compite con Website de Odoo (son productos diferentes)
4. **Siguiente Módulo: Contabilidad** - CFDI + Contabilidad básica

---

## Fase 1: Completar Sistema de Recordatorios (Agendamiento)

### Estado Actual: 50% Implementado

**Lo que YA existe:**
- Campos en tabla `citas`: `recordatorio_enviado`, `fecha_recordatorio`, `confirmacion_requerida`
- Índice optimizado `idx_citas_recordatorios_pendientes`
- 2 endpoints: `GET /citas/recordatorios` y `PATCH /citas/:codigo/recordatorio-enviado`
- Model y Controller básicos
- Hooks frontend: `useEnviarRecordatorio()`, `useRecordatorios()`

**Lo que FALTA (crítico):**

### 1.1 Tabla de Configuración de Recordatorios
```sql
-- sql/agendamiento/recordatorios/01-tablas.sql
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

    -- Canales
    canal_whatsapp BOOLEAN DEFAULT TRUE,
    canal_email BOOLEAN DEFAULT FALSE,
    canal_sms BOOLEAN DEFAULT FALSE,

    -- Plantillas
    plantilla_whatsapp TEXT DEFAULT 'Hola {{cliente_nombre}}, te recordamos tu cita para {{servicios}} el {{fecha}} a las {{hora}} en {{negocio_nombre}}. Confirma respondiendo SI.',
    plantilla_email TEXT,

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
    cita_id INTEGER NOT NULL,
    fecha_cita DATE NOT NULL,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),

    -- Tipo de recordatorio
    numero_recordatorio INTEGER DEFAULT 1,  -- 1 = primer recordatorio, 2 = segundo

    -- Canal y estado
    canal VARCHAR(20) NOT NULL,  -- 'whatsapp', 'email', 'sms'
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente',  -- 'pendiente', 'enviado', 'fallido', 'confirmado'

    -- Detalles
    mensaje_enviado TEXT,
    respuesta_cliente TEXT,
    codigo_error VARCHAR(100),
    intento_numero INTEGER DEFAULT 1,

    -- Timestamps
    programado_para TIMESTAMPTZ NOT NULL,
    enviado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    FOREIGN KEY (cita_id, fecha_cita) REFERENCES citas(id, fecha_cita) ON DELETE CASCADE
);

CREATE INDEX idx_historial_recordatorios_pendientes
ON historial_recordatorios(programado_para)
WHERE estado = 'pendiente';
```

### 1.2 Job Automático pg_cron
```sql
-- sql/mantenimiento/06-pg-cron.sql (agregar)
SELECT cron.schedule(
    'enviar-recordatorios',
    '*/5 * * * *',  -- Cada 5 minutos
    $$
    SELECT enviar_recordatorios_pendientes();
    $$
);
```

### 1.3 Función de Envío
```sql
-- sql/agendamiento/recordatorios/04-funciones.sql
CREATE OR REPLACE FUNCTION enviar_recordatorios_pendientes()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    v_record RECORD;
BEGIN
    -- Obtener recordatorios pendientes dentro de ventana horaria
    FOR v_record IN
        SELECT hr.*, c.cliente_id, cl.telefono, cl.email, cl.nombre as cliente_nombre,
               o.nombre as negocio_nombre
        FROM historial_recordatorios hr
        JOIN citas c ON hr.cita_id = c.id AND hr.fecha_cita = c.fecha_cita
        JOIN clientes cl ON c.cliente_id = cl.id
        JOIN organizaciones o ON hr.organizacion_id = o.id
        JOIN configuracion_recordatorios cr ON hr.organizacion_id = cr.organizacion_id
        WHERE hr.estado = 'pendiente'
          AND hr.programado_para <= NOW()
          AND CURRENT_TIME BETWEEN cr.hora_inicio AND cr.hora_fin
          AND hr.intento_numero <= cr.max_reintentos
        ORDER BY hr.programado_para
        LIMIT 100
    LOOP
        -- Marcar como procesando (evita duplicados)
        UPDATE historial_recordatorios
        SET estado = 'procesando'
        WHERE id = v_record.id;

        -- El envío real se hace vía n8n webhook o API
        v_count := v_count + 1;
    END LOOP;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;
```

### 1.4 Integración n8n/WhatsApp

**Workflow n8n para recordatorios:**
1. Webhook recibe lista de recordatorios pendientes
2. Para cada recordatorio:
   - Si canal = 'whatsapp': Enviar vía WhatsApp Business API
   - Si canal = 'email': Enviar vía AWS SES
3. Callback al backend con resultado
4. Actualizar `historial_recordatorios.estado`

**Endpoints nuevos backend:**
```javascript
// POST /api/v1/citas/recordatorios/procesar
// Llamado por pg_cron o n8n - Retorna lista de recordatorios a enviar

// POST /api/v1/citas/recordatorios/callback
// Recibe resultado de envío de n8n - Actualiza historial_recordatorios
```

### 1.5 UI Frontend

**Páginas nuevas:**
- `ConfiguracionRecordatoriosPage.jsx` - Configurar tiempos, canales, plantillas
- Agregar tab en `ConfiguracionPage.jsx`

**Componentes:**
- `PlantillaRecordatorioEditor.jsx` - Editor con variables {{cliente_nombre}}, {{fecha}}, etc.
- `HistorialRecordatoriosModal.jsx` - Ver historial de envíos por cita

### Archivos a Crear/Modificar

| Archivo | Acción | Descripción |
|---------|--------|-------------|
| `sql/agendamiento/recordatorios/01-tablas.sql` | CREAR | 2 tablas nuevas |
| `sql/agendamiento/recordatorios/02-indices.sql` | CREAR | Índices optimizados |
| `sql/agendamiento/recordatorios/03-rls.sql` | CREAR | Políticas RLS |
| `sql/agendamiento/recordatorios/04-funciones.sql` | CREAR | Función envío |
| `sql/mantenimiento/06-pg-cron.sql` | MODIFICAR | Agregar job |
| `backend/app/modules/agendamiento/models/recordatorios.model.js` | CREAR | CRUD + lógica |
| `backend/app/modules/agendamiento/controllers/recordatorios.controller.js` | CREAR | Endpoints |
| `backend/app/modules/agendamiento/routes/recordatorios.js` | CREAR | 6 rutas |
| `frontend/src/pages/configuracion/RecordatoriosPage.jsx` | CREAR | UI config |
| `frontend/src/hooks/useRecordatorios.js` | CREAR | Queries + mutations |

### Estimación: 2-3 semanas

---

## Fase 2: Validar y Completar POS e Inventario

### 2.1 Inventario - Estado: 95%

**Funcionalidades faltantes:**

| Funcionalidad | Prioridad | Esfuerzo |
|---------------|-----------|----------|
| Exportación CSV/Excel reportes | Alta | 3 días |
| Órdenes de Compra | Media | 1 semana |
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
    estado VARCHAR(20) DEFAULT 'borrador',  -- borrador, enviada, parcial, recibida, cancelada

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

### 2.2 POS - Estado: 85%

**Funcionalidades faltantes:**

| Funcionalidad | Prioridad | Esfuerzo |
|---------------|-----------|----------|
| Ticket PDF (térmica 58/80mm) | Alta | 1 semana |
| Comisiones por venta POS | Alta | 3 días |
| Devoluciones con nota crédito | Media | 4 días |
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
        doc.text(`Tel: ${venta.organizacion.telefono}`, { align: 'center' });

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
| `backend/app/modules/pos/routes/pos.js` | MODIFICAR | Endpoint ticket |
| `frontend/src/pages/inventario/OrdenesCompraPage.jsx` | CREAR | UI |
| `frontend/src/components/pos/TicketPreview.jsx` | CREAR | Preview ticket |

### Estimación: 2 semanas

---

## Fase 3: Marketplace - Mejoras (NO Website Builder)

### Análisis Competitivo: Marketplace vs Odoo Website

| Tu Marketplace | Odoo Website |
|----------------|--------------|
| Directorio de negocios | CMS/Website builder |
| Agendamiento público | E-commerce |
| Reseñas validadas | Blog + páginas libres |
| "Google Maps + Calendly" | "Wix + Shopify" |

**Conclusión**: Son productos **COMPLETAMENTE DIFERENTES**. No intentar convertir Marketplace en website builder.

### Mejoras Recomendadas al Marketplace

**Prioridad Alta:**

| Mejora | Descripción | Esfuerzo |
|--------|-------------|----------|
| SEO Técnico | Sitemap.xml, robots.txt, Schema.org LocalBusiness | 3 días |
| Horarios visuales | UI para definir horarios de atención en perfil | 2 días |
| Galería mejorada | Lightbox, ordenamiento drag-and-drop | 3 días |
| Analytics dashboard | Gráficos conversión, comparación períodos | 4 días |

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

### Estimación: 2 semanas

---

## Fase 4: Módulo Contabilidad + CFDI

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

### Archivos a Crear

| Archivo | Descripción |
|---------|-------------|
| `sql/facturacion/01-tablas.sql` | 8 tablas CFDI |
| `sql/facturacion/02-catalogos-sat.sql` | Catálogos precargados |
| `sql/facturacion/03-indices.sql` | Índices |
| `sql/facturacion/04-rls.sql` | Políticas RLS |
| `sql/facturacion/05-funciones.sql` | Generar folio, etc. |
| `sql/contabilidad/01-tablas.sql` | Cuentas, pólizas |
| `backend/app/modules/facturacion/` | Módulo completo |
| `backend/app/modules/contabilidad/` | Módulo básico |
| `frontend/src/pages/facturacion/` | UI facturación |
| `frontend/src/pages/contabilidad/` | UI contabilidad |

### Estimación: 6-8 semanas

---

## Resumen de Roadmap

| Fase | Módulo | Estado Actual | Objetivo | Tiempo |
|------|--------|---------------|----------|--------|
| 1 | Recordatorios | 50% | 100% | 2-3 semanas |
| 2 | POS + Inventario | 85-95% | 100% | 2 semanas |
| 3 | Marketplace | 90% | 100% | 2 semanas |
| 4 | CFDI + Contabilidad | 0% | MVP | 6-8 semanas |

**Total estimado: 12-15 semanas (3-4 meses)**

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

## Archivos Críticos Existentes

### Recordatorios (base existente)
- `backend/app/modules/agendamiento/models/citas/cita.recordatorios.model.js`
- `backend/app/modules/agendamiento/controllers/citas/cita.recordatorios.controller.js`
- `sql/citas/01-tablas-citas.sql` (campos recordatorio_*)

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

## Próximos Pasos Inmediatos

1. **Semana 1-2**: Implementar sistema de recordatorios completo
2. **Semana 3**: Ticket PDF para POS
3. **Semana 4**: Órdenes de compra para Inventario
4. **Semana 5-6**: SEO y mejoras Marketplace
5. **Semana 7+**: Iniciar módulo CFDI

---

## Fuentes de Investigación

- [Odoo Pricing Guide 2025](https://www.brainvire.com/insights/odoo-erp-implementation-cost/)
- [Odoo Official Pricing](https://www.odoo.com/pricing)
- [Odoo Reviews - TrustPilot](https://www.trustpilot.com/review/odoo.com)
- [Odoo Reviews - Software Advice](https://www.softwareadvice.com/crm/odoo-profile/reviews/)
- [Vertical SaaS Strategy - SingleGrain](https://www.singlegrain.com/saas/vertical-saas/)
- [Verticalization of Everything - NFX](https://www.nfx.com/post/verticalization-of-everything)

-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - TABLAS
-- Descripción: Sistema de ventas con múltiples métodos de pago y tickets
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: ventas_pos
-- Descripción: Registro de ventas del punto de venta con estados y pagos
-- ============================================================================
CREATE TABLE IF NOT EXISTS ventas_pos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- Sucursal donde se realiza la venta

    -- 📝 INFORMACIÓN DE VENTA
    folio VARCHAR(50) NOT NULL, -- Auto-generado: POS-2025-0001
    tipo_venta VARCHAR(20) DEFAULT 'directa' CHECK (tipo_venta IN (
        'directa',      -- Venta directa en mostrador
        'cita',         -- Asociada a cita (productos vendidos durante servicio)
        'apartado',     -- Cliente aparta productos (paga después)
        'cotizacion'    -- Cotización (no afecta inventario aún)
    )),

    -- 🔗 RELACIONES
    cliente_id INTEGER REFERENCES clientes(id),
    cita_id INTEGER, -- FK a citas (tabla particionada - sin FK formal, se valida en backend)
    profesional_id INTEGER REFERENCES profesionales(id), -- Quien atendió/vendió
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id), -- Quien registró la venta

    -- 💰 TOTALES
    subtotal DECIMAL(10, 2) NOT NULL DEFAULT 0,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(10, 2) DEFAULT 0,
    impuestos DECIMAL(10, 2) DEFAULT 0, -- IVA u otros impuestos
    total DECIMAL(10, 2) NOT NULL,

    -- 💳 PAGO
    metodo_pago VARCHAR(30) CHECK (metodo_pago IN (
        'efectivo',
        'tarjeta',         -- Tarjeta manual (sin terminal)
        'transferencia',
        'qr',              -- QR de Mercado Pago
        'mixto'            -- Combinación de métodos
    )),
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN (
        'pendiente',
        'pagado',
        'parcial',
        'cancelado'
    )),
    monto_pagado DECIMAL(10, 2) DEFAULT 0,
    monto_pendiente DECIMAL(10, 2),

    -- 🔗 INTEGRACIÓN CON PAGOS
    pago_id INTEGER REFERENCES pagos(id), -- Tabla existente del sistema

    -- 📝 METADATA
    notas TEXT,
    ticket_url VARCHAR(500), -- URL del PDF del ticket generado
    estado VARCHAR(20) DEFAULT 'completada' CHECK (estado IN (
        'cotizacion',          -- Solo cotización, no afecta stock
        'apartado',            -- Cliente apartó productos
        'completada',          -- Venta completada y stock descontado
        'cancelada',           -- Venta cancelada (revierte stock)
        'devolucion_parcial',  -- Devolución de algunos items
        'devolucion_total'     -- Devolución completa
    )),

    -- 🚚 DROPSHIPPING (Dic 2025)
    es_dropship BOOLEAN DEFAULT false,       -- Indica si tiene items dropship
    direccion_envio TEXT,                    -- Direccion de envio del cliente
    requiere_oc_dropship BOOLEAN DEFAULT false, -- Indica si requiere generar OC dropship

    -- 🎯 LEALTAD (Ene 2026)
    puntos_canjeados INTEGER DEFAULT 0,      -- Puntos canjeados por descuento
    descuento_puntos DECIMAL(10, 2) DEFAULT 0, -- Descuento en $ por puntos canjeados

    -- 📅 TIMESTAMPS
    fecha_venta TIMESTAMPTZ DEFAULT NOW(),
    fecha_apartado DATE, -- Si tipo_venta = apartado
    fecha_vencimiento_apartado DATE, -- Fecha límite para completar apartado
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, folio),
    CHECK (total >= 0),
    CHECK (subtotal >= 0),
    CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    CHECK (descuento_monto >= 0),
    CHECK (impuestos >= 0),
    CHECK (monto_pagado >= 0),
    CHECK (monto_pagado <= total),
    CHECK (monto_pendiente = total - monto_pagado),
    CHECK (
        descuento_monto = 0 OR descuento_porcentaje = 0
    ), -- Solo un tipo de descuento a la vez
    CHECK (
        (tipo_venta = 'apartado' AND fecha_apartado IS NOT NULL AND fecha_vencimiento_apartado IS NOT NULL) OR
        (tipo_venta != 'apartado')
    )
);

COMMENT ON TABLE ventas_pos IS 'Registro de ventas del punto de venta con soporte para múltiples métodos de pago';
COMMENT ON COLUMN ventas_pos.folio IS 'Folio único auto-generado formato: POS-YYYY-####';
COMMENT ON COLUMN ventas_pos.tipo_venta IS 'Tipo de venta: directa (mostrador), cita (durante servicio), apartado, cotización';
COMMENT ON COLUMN ventas_pos.estado IS 'Estado de la venta: completada (stock descontado), cancelada (stock revertido), etc.';
COMMENT ON COLUMN ventas_pos.estado_pago IS 'Estado del pago: pendiente, pagado, parcial, cancelado';
COMMENT ON COLUMN ventas_pos.monto_pendiente IS 'Calculado automáticamente: total - monto_pagado';
COMMENT ON COLUMN ventas_pos.ticket_url IS 'URL del ticket PDF generado (se genera después de completar venta)';
COMMENT ON COLUMN ventas_pos.cita_id IS 'Referencia a cita si venta ocurrió durante un servicio (sin FK por particionamiento)';

-- ============================================================================
-- TABLA: ventas_pos_items
-- Descripción: Items (productos) de cada venta con precios y descuentos
-- ============================================================================
CREATE TABLE IF NOT EXISTS ventas_pos_items (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    venta_pos_id INTEGER NOT NULL REFERENCES ventas_pos(id) ON DELETE CASCADE,

    -- 📦 PRODUCTO
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    variante_id INTEGER, -- FK a variantes_producto (si aplica)
    numero_serie_id INTEGER, -- FK a numeros_serie (si aplica) - Dic 2025
    nombre_producto VARCHAR(200) NOT NULL, -- Snapshot del nombre (no cambia si renombran producto)
    sku VARCHAR(50), -- Snapshot del SKU

    -- 📊 CANTIDAD Y PRECIOS
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    descuento_porcentaje DECIMAL(5, 2) DEFAULT 0,
    descuento_monto DECIMAL(10, 2) DEFAULT 0,
    precio_final DECIMAL(10, 2) NOT NULL, -- precio_unitario - descuento_monto
    subtotal DECIMAL(10, 2) NOT NULL, -- cantidad * precio_final

    -- 💼 COMISIONES
    aplica_comision BOOLEAN DEFAULT true, -- Si genera comisión para el vendedor

    -- 📝 METADATA
    notas TEXT, -- Notas específicas del item (ej: "Cliente pidió sin fragancia")

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (precio_unitario > 0),
    CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    CHECK (descuento_monto >= 0),
    CHECK (descuento_monto <= precio_unitario),
    CHECK (precio_final = precio_unitario - descuento_monto),
    CHECK (subtotal = cantidad * precio_final),
    CHECK (
        descuento_monto = 0 OR descuento_porcentaje = 0
    ) -- Solo un tipo de descuento a la vez
);

COMMENT ON TABLE ventas_pos_items IS 'Items (productos) de cada venta con snapshot de datos y cálculos';
COMMENT ON COLUMN ventas_pos_items.nombre_producto IS 'Snapshot del nombre - no cambia si renombran el producto';
COMMENT ON COLUMN ventas_pos_items.precio_unitario IS 'Precio al momento de la venta (viene de listas_precios o precio_venta base)';
COMMENT ON COLUMN ventas_pos_items.precio_final IS 'Precio después de descuentos por item';
COMMENT ON COLUMN ventas_pos_items.subtotal IS 'Total del item: cantidad × precio_final';
COMMENT ON COLUMN ventas_pos_items.aplica_comision IS 'Indica si este item genera comisión para el vendedor';

-- ============================================================================
-- NOTA: FKs diferidos (numero_serie_id, variante_id)
-- Se crean en sql/pos/06-foreign-keys.sql después de inventario avanzado
-- ============================================================================

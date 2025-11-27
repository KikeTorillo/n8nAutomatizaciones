-- ============================================================================
-- MÓDULO: INVENTARIO - ÓRDENES DE COMPRA (TABLAS)
-- Descripción: Gestión de órdenes de compra a proveedores
-- Versión: 1.0
-- Fecha: 27 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: ordenes_compra
-- Descripción: Cabecera de órdenes de compra a proveedores
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_compra (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📝 INFORMACIÓN DE ORDEN
    folio VARCHAR(20) NOT NULL,  -- Auto-generado: OC-YYYY-####
    proveedor_id INTEGER NOT NULL REFERENCES proveedores(id),

    -- 📊 ESTADO DEL CICLO DE COMPRA
    estado VARCHAR(20) DEFAULT 'borrador' CHECK (estado IN (
        'borrador',     -- En edición, no enviada
        'enviada',      -- Enviada al proveedor, esperando entrega
        'parcial',      -- Recepción parcial de productos
        'recibida',     -- Completamente recibida
        'cancelada'     -- Cancelada
    )),

    -- 📅 FECHAS CLAVE
    fecha_orden DATE DEFAULT CURRENT_DATE,
    fecha_entrega_esperada DATE,
    fecha_recepcion DATE,  -- Fecha de última recepción

    -- 💰 TOTALES (calculados por trigger)
    subtotal DECIMAL(12,2) DEFAULT 0,
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0,
    descuento_monto DECIMAL(12,2) DEFAULT 0,
    impuestos DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) DEFAULT 0,

    -- 💳 TÉRMINOS DE PAGO
    dias_credito INTEGER DEFAULT 0,  -- Heredado del proveedor o personalizado
    fecha_vencimiento_pago DATE,     -- fecha_recepcion + dias_credito
    estado_pago VARCHAR(20) DEFAULT 'pendiente' CHECK (estado_pago IN (
        'pendiente',
        'parcial',
        'pagado'
    )),
    monto_pagado DECIMAL(12,2) DEFAULT 0,

    -- 🔗 RELACIONES
    usuario_id INTEGER REFERENCES usuarios(id),  -- Quien creó la orden

    -- 📝 METADATA
    notas TEXT,
    referencia_proveedor VARCHAR(100),  -- Número de orden del proveedor

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    enviada_en TIMESTAMPTZ,
    cancelada_en TIMESTAMPTZ,

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, folio),
    CHECK (subtotal >= 0),
    CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),
    CHECK (descuento_monto >= 0),
    CHECK (impuestos >= 0),
    CHECK (total >= 0),
    CHECK (dias_credito >= 0),
    CHECK (monto_pagado >= 0),
    CHECK (monto_pagado <= total),
    CHECK (
        descuento_monto = 0 OR descuento_porcentaje = 0
    )  -- Solo un tipo de descuento
);

COMMENT ON TABLE ordenes_compra IS 'Órdenes de compra a proveedores con seguimiento de recepción y pago';
COMMENT ON COLUMN ordenes_compra.folio IS 'Folio único auto-generado: OC-YYYY-####';
COMMENT ON COLUMN ordenes_compra.estado IS 'Ciclo: borrador → enviada → parcial/recibida | cancelada';
COMMENT ON COLUMN ordenes_compra.dias_credito IS 'Días de crédito para pago (heredado del proveedor por defecto)';
COMMENT ON COLUMN ordenes_compra.referencia_proveedor IS 'Número de orden o factura del proveedor';

-- ============================================================================
-- TABLA: ordenes_compra_items
-- Descripción: Items (productos) de cada orden de compra
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_compra_items (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,

    -- 📦 PRODUCTO (snapshot al momento de crear)
    producto_id INTEGER NOT NULL REFERENCES productos(id),
    nombre_producto VARCHAR(200) NOT NULL,  -- Snapshot del nombre
    sku VARCHAR(50),                         -- Snapshot del SKU
    unidad_medida VARCHAR(20) DEFAULT 'unidad',

    -- 📊 CANTIDADES
    cantidad_ordenada INTEGER NOT NULL CHECK (cantidad_ordenada > 0),
    cantidad_recibida INTEGER DEFAULT 0 CHECK (cantidad_recibida >= 0),
    cantidad_pendiente INTEGER GENERATED ALWAYS AS (cantidad_ordenada - cantidad_recibida) STORED,

    -- 💰 PRECIOS
    precio_unitario DECIMAL(10,2) NOT NULL CHECK (precio_unitario > 0),
    subtotal DECIMAL(12,2) GENERATED ALWAYS AS (cantidad_ordenada * precio_unitario) STORED,

    -- 📊 ESTADO DEL ITEM
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',    -- Sin recibir nada
        'parcial',      -- Recibido parcialmente
        'completo',     -- Completamente recibido
        'cancelado'     -- Item cancelado
    )),

    -- 🗓️ INFORMACIÓN DE RECEPCIÓN
    fecha_ultima_recepcion TIMESTAMPTZ,
    fecha_vencimiento DATE,  -- Para productos perecederos
    lote VARCHAR(50),        -- Número de lote recibido

    -- 📝 NOTAS
    notas TEXT,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (cantidad_recibida <= cantidad_ordenada)
);

COMMENT ON TABLE ordenes_compra_items IS 'Items de órdenes de compra con tracking de cantidades recibidas';
COMMENT ON COLUMN ordenes_compra_items.nombre_producto IS 'Snapshot del nombre - no cambia si renombran el producto';
COMMENT ON COLUMN ordenes_compra_items.cantidad_pendiente IS 'Calculado automáticamente: ordenada - recibida';
COMMENT ON COLUMN ordenes_compra_items.subtotal IS 'Calculado automáticamente: cantidad_ordenada × precio_unitario';
COMMENT ON COLUMN ordenes_compra_items.lote IS 'Número de lote para trazabilidad del producto';

-- ============================================================================
-- TABLA: ordenes_compra_recepciones
-- Descripción: Historial de recepciones parciales de cada orden
-- ============================================================================
CREATE TABLE IF NOT EXISTS ordenes_compra_recepciones (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    orden_compra_id INTEGER NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    orden_compra_item_id INTEGER NOT NULL REFERENCES ordenes_compra_items(id) ON DELETE CASCADE,

    -- 📦 RECEPCIÓN
    cantidad_recibida INTEGER NOT NULL CHECK (cantidad_recibida > 0),
    precio_unitario_real DECIMAL(10,2),  -- Si el precio cambió

    -- 🗓️ INFORMACIÓN DEL LOTE
    fecha_vencimiento DATE,
    lote VARCHAR(50),

    -- 🔗 TRAZABILIDAD
    movimiento_inventario_id INTEGER,  -- FK a movimientos_inventario (sin constraint por partición)
    usuario_id INTEGER REFERENCES usuarios(id),

    -- 📝 NOTAS
    notas TEXT,

    -- 📅 TIMESTAMP
    recibido_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ordenes_compra_recepciones IS 'Historial de recepciones parciales para auditoría y trazabilidad';
COMMENT ON COLUMN ordenes_compra_recepciones.precio_unitario_real IS 'Precio real si difiere del precio ordenado';
COMMENT ON COLUMN ordenes_compra_recepciones.movimiento_inventario_id IS 'Referencia al movimiento de inventario generado';

-- ============================================================================
-- FIN: TABLAS DE ÓRDENES DE COMPRA
-- ============================================================================

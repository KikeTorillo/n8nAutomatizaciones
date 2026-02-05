-- ====================================================================
-- MÓDULO PRECIOS: LISTAS DE PRECIOS
-- ====================================================================
-- Sistema de listas de precios para gestión avanzada de precios
-- por cliente, cantidad y moneda.
--
-- Fase 5 - Diciembre 2025
--
-- CONTENIDO:
-- * listas_precios - Listas de precios configurables por organización
-- * listas_precios_items - Reglas de precio dentro de cada lista
--
-- DEPENDENCIAS:
-- * nucleo (organizaciones, monedas)
-- * inventario (productos, categorias_productos)
-- * clientes
-- ====================================================================

-- ====================================================================
-- TABLA: listas_precios
-- ====================================================================
-- Listas de precios configurables por organización.
-- Ejemplos: MENUDEO, MAYOREO, VIP, DISTRIBUIDOR
-- ====================================================================

CREATE TABLE listas_precios (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN BÁSICA
    codigo VARCHAR(20) NOT NULL,              -- 'MENUDEO', 'MAYOREO', 'VIP'
    nombre VARCHAR(100) NOT NULL,             -- 'Lista Menudeo', 'Precio Mayoreo'
    descripcion TEXT,

    -- 💰 CONFIGURACIÓN
    moneda VARCHAR(3) NOT NULL DEFAULT 'MXN' REFERENCES monedas(codigo),
    es_default BOOLEAN DEFAULT FALSE,         -- Lista por defecto para nuevos clientes

    -- Descuento global (opcional) - aplica a toda la lista
    descuento_global_pct DECIMAL(5,2) DEFAULT 0,

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 🗑️ SOFT DELETE
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_descuento_global_rango CHECK (descuento_global_pct >= 0 AND descuento_global_pct <= 100),
    CONSTRAINT chk_codigo_length CHECK (char_length(codigo) >= 2),
    CONSTRAINT chk_nombre_length CHECK (char_length(nombre) >= 2)
);

-- Código único por organización (solo registros no eliminados - permite reutilizar códigos tras soft delete)
CREATE UNIQUE INDEX uq_lista_precios_codigo_org
ON listas_precios(organizacion_id, codigo)
WHERE eliminado_en IS NULL;

-- Solo una lista default por organización (constraint parcial)
CREATE UNIQUE INDEX idx_lista_precios_default_unica
ON listas_precios(organizacion_id)
WHERE es_default = TRUE AND eliminado_en IS NULL;

-- Comentarios
COMMENT ON TABLE listas_precios IS 'Listas de precios configurables por organización (Menudeo, Mayoreo, VIP, etc.)';
COMMENT ON COLUMN listas_precios.codigo IS 'Código único dentro de la organización (ej: MAYOREO, VIP)';
COMMENT ON COLUMN listas_precios.es_default IS 'TRUE = lista por defecto para clientes sin lista asignada. Solo una por org.';
COMMENT ON COLUMN listas_precios.descuento_global_pct IS 'Descuento porcentual aplicado a todos los productos de esta lista';
COMMENT ON COLUMN listas_precios.moneda IS 'Moneda base de la lista. Los precios se expresan en esta moneda.';

-- ====================================================================
-- TABLA: listas_precios_items
-- ====================================================================
-- Reglas de precio por producto/categoría/cantidad dentro de una lista.
-- Permite definir precios escalonados por cantidad (mayoreo).
-- ====================================================================

CREATE TABLE listas_precios_items (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    lista_precio_id INTEGER NOT NULL REFERENCES listas_precios(id) ON DELETE CASCADE,

    -- 🎯 APLICACIÓN (producto específico, categoría, o global)
    -- Si ambos son NULL, aplica a todos los productos
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias_productos(id) ON DELETE CASCADE,

    -- 📦 REGLA DE CANTIDAD (para descuentos por volumen)
    cantidad_minima INTEGER DEFAULT 1,        -- Desde qué cantidad aplica
    cantidad_maxima INTEGER,                  -- Hasta qué cantidad (NULL = sin límite)

    -- 💰 PRECIO (una de las dos opciones)
    precio_fijo DECIMAL(12,2),                -- Precio fijo para esta regla
    descuento_pct DECIMAL(5,2),               -- O porcentaje de descuento sobre precio base

    -- 🔢 PRIORIDAD (mayor número = mayor prioridad)
    prioridad INTEGER DEFAULT 0,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    -- Debe tener precio_fijo O descuento_pct (no ambos, no ninguno)
    CONSTRAINT chk_precio_o_descuento CHECK (
        (precio_fijo IS NOT NULL AND descuento_pct IS NULL) OR
        (precio_fijo IS NULL AND descuento_pct IS NOT NULL)
    ),
    CONSTRAINT chk_precio_fijo_positivo CHECK (precio_fijo IS NULL OR precio_fijo >= 0),
    CONSTRAINT chk_descuento_rango CHECK (descuento_pct IS NULL OR (descuento_pct >= 0 AND descuento_pct <= 100)),
    CONSTRAINT chk_cantidad_minima CHECK (cantidad_minima >= 1),
    CONSTRAINT chk_cantidad_maxima CHECK (cantidad_maxima IS NULL OR cantidad_maxima >= cantidad_minima)
);

-- Comentarios
COMMENT ON TABLE listas_precios_items IS 'Reglas de precio por producto/categoría/cantidad dentro de una lista';
COMMENT ON COLUMN listas_precios_items.producto_id IS 'Producto específico. NULL = aplica a categoría o a todos';
COMMENT ON COLUMN listas_precios_items.categoria_id IS 'Categoría de productos. NULL = aplica a producto específico o a todos';
COMMENT ON COLUMN listas_precios_items.cantidad_minima IS 'Cantidad mínima para aplicar esta regla (ej: 10 para precio mayoreo)';
COMMENT ON COLUMN listas_precios_items.cantidad_maxima IS 'Cantidad máxima. NULL = sin límite superior';
COMMENT ON COLUMN listas_precios_items.precio_fijo IS 'Precio absoluto para esta regla. Mutuamente exclusivo con descuento_pct';
COMMENT ON COLUMN listas_precios_items.descuento_pct IS 'Descuento sobre precio base. Mutuamente exclusivo con precio_fijo';
COMMENT ON COLUMN listas_precios_items.prioridad IS 'Mayor prioridad gana cuando múltiples reglas coinciden. Default: 0';

-- ====================================================================
-- ÍNDICES PARA RENDIMIENTO
-- ====================================================================

-- Índices para listas_precios
CREATE INDEX idx_listas_precios_org ON listas_precios(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX idx_listas_precios_moneda ON listas_precios(organizacion_id, moneda) WHERE activo = TRUE AND eliminado_en IS NULL;
CREATE INDEX idx_listas_precios_activas ON listas_precios(organizacion_id) WHERE activo = TRUE AND eliminado_en IS NULL;

-- Índices para listas_precios_items (búsqueda eficiente de precios)
CREATE INDEX idx_listas_items_lista ON listas_precios_items(lista_precio_id);
CREATE INDEX idx_listas_items_producto ON listas_precios_items(lista_precio_id, producto_id) WHERE producto_id IS NOT NULL;
CREATE INDEX idx_listas_items_categoria ON listas_precios_items(lista_precio_id, categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX idx_listas_items_cantidad ON listas_precios_items(lista_precio_id, cantidad_minima);
CREATE INDEX idx_listas_items_prioridad ON listas_precios_items(lista_precio_id, prioridad DESC);

-- Índice compuesto para resolución de precio
CREATE INDEX idx_listas_items_resolucion ON listas_precios_items(
    lista_precio_id,
    producto_id,
    categoria_id,
    cantidad_minima,
    prioridad DESC
);

-- ====================================================================
-- TRIGGERS
-- ====================================================================

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION trigger_listas_precios_updated()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_listas_precios_updated
    BEFORE UPDATE ON listas_precios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_listas_precios_updated();

CREATE TRIGGER trg_listas_items_updated
    BEFORE UPDATE ON listas_precios_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_listas_precios_updated();

-- ====================================================================
-- FIN: TABLAS DE LISTAS DE PRECIOS
-- ====================================================================

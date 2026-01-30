-- ============================================================================
-- MÓDULO: INVENTARIO - TABLAS
-- Descripción: Gestión de productos, categorías, proveedores y movimientos
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: categorias_productos
-- Descripción: Categorías jerárquicas de productos (ej: Cabello > Shampoo > Anticaída)
-- ============================================================================
CREATE TABLE IF NOT EXISTS categorias_productos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🏷️ INFORMACIÓN
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    categoria_padre_id INTEGER REFERENCES categorias_productos(id) ON DELETE SET NULL,

    -- 🎨 PRESENTACIÓN
    icono VARCHAR(50), -- Nombre del icono (ej: 'scissors', 'bottle')
    color VARCHAR(7), -- Hex color (ej: '#FF5733')
    orden INTEGER DEFAULT 0, -- Para ordenamiento manual

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT true,

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, nombre),
    CHECK (color IS NULL OR color ~ '^#[0-9A-F]{6}$'), -- Validar formato hex
    CHECK (orden >= 0),
    CHECK (categoria_padre_id IS NULL OR categoria_padre_id != id) -- No puede ser su propio padre
);

COMMENT ON TABLE categorias_productos IS 'Categorías jerárquicas de productos con soporte para subcategorías';
COMMENT ON COLUMN categorias_productos.categoria_padre_id IS 'Permite crear jerarquías: Categoría > Subcategoría';
COMMENT ON COLUMN categorias_productos.orden IS 'Orden de visualización (menor número = mayor prioridad)';

-- ============================================================================
-- TABLA: proveedores
-- Descripción: Proveedores de productos con historial de compras
-- ============================================================================
CREATE TABLE IF NOT EXISTS proveedores (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🏢 INFORMACIÓN BÁSICA
    nombre VARCHAR(200) NOT NULL,
    razon_social VARCHAR(200),
    rfc VARCHAR(13), -- México RFC

    -- 📞 CONTACTO
    telefono VARCHAR(20),
    email VARCHAR(255),
    sitio_web VARCHAR(255),

    -- 📍 DIRECCIÓN (Normalizada con catálogos - Nov 2025)
    direccion TEXT,
    ciudad_id INTEGER REFERENCES ciudades(id) ON DELETE SET NULL,
    estado_id INTEGER REFERENCES estados(id) ON DELETE SET NULL,
    pais_id INTEGER REFERENCES paises(id) ON DELETE SET NULL,
    codigo_postal VARCHAR(10),

    -- 💼 TÉRMINOS COMERCIALES
    dias_credito INTEGER DEFAULT 0, -- Días de crédito que otorga (0 = contado)
    dias_entrega_estimados INTEGER, -- Tiempo estimado de entrega en días
    monto_minimo_compra DECIMAL(10, 2), -- Monto mínimo para pedidos

    -- 📝 NOTAS
    notas TEXT,

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT true,

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, nombre),
    CHECK (dias_credito >= 0),
    CHECK (dias_entrega_estimados IS NULL OR dias_entrega_estimados > 0),
    CHECK (monto_minimo_compra IS NULL OR monto_minimo_compra >= 0)
);

COMMENT ON TABLE proveedores IS 'Proveedores de productos con información comercial y términos de compra';
COMMENT ON COLUMN proveedores.dias_credito IS 'Días de crédito otorgados (0 = pago de contado)';
COMMENT ON COLUMN proveedores.dias_entrega_estimados IS 'Tiempo promedio de entrega en días';

-- ============================================================================
-- TABLA: productos
-- Descripción: Catálogo de productos con control de stock y precios
-- ============================================================================
CREATE TABLE IF NOT EXISTS productos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = producto global, con valor = producto exclusivo de sucursal

    -- 📦 INFORMACIÓN BÁSICA
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    sku VARCHAR(50), -- Stock Keeping Unit (código interno)
    codigo_barras VARCHAR(50), -- EAN13, Code128, etc.

    -- 🔗 RELACIONES
    categoria_id INTEGER REFERENCES categorias_productos(id) ON DELETE SET NULL,
    proveedor_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,

    -- 💰 PRECIOS (Dic 2025: precio_mayoreo eliminado, usar listas_precios)
    precio_compra DECIMAL(10, 2) DEFAULT 0, -- Costo de adquisición
    precio_venta DECIMAL(10, 2) NOT NULL, -- Precio base de venta al público

    -- 📊 STOCK
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5, -- Alerta cuando stock <= stock_minimo
    stock_maximo INTEGER DEFAULT 100, -- Stock objetivo máximo
    unidad_medida VARCHAR(20) DEFAULT 'unidad', -- unidad, kg, litro, caja, etc.

    -- ⚖️ DIMENSIONES FÍSICAS (Dic 2025 - Landed Costs)
    peso DECIMAL(10, 4), -- Peso en kg (para landed costs y envíos)
    volumen DECIMAL(10, 4), -- Volumen en m³ (para landed costs y envíos)
    peso_unidad VARCHAR(10) DEFAULT 'kg', -- Unidad de peso (kg, lb, g)
    volumen_unidad VARCHAR(10) DEFAULT 'm3', -- Unidad de volumen (m3, cm3, l)

    -- 🔔 ALERTAS
    alerta_stock_minimo BOOLEAN DEFAULT true, -- Enviar alerta cuando stock <= stock_minimo

    -- 🗓️ VENCIMIENTO
    es_perecedero BOOLEAN DEFAULT false, -- Si tiene fecha de vencimiento
    dias_vida_util INTEGER, -- Días de vida útil después de compra

    -- ⚙️ CONFIGURACIÓN
    permite_venta BOOLEAN DEFAULT true, -- Se puede vender en POS
    permite_uso_servicio BOOLEAN DEFAULT true, -- Se puede usar en servicios

    -- 🔄 AUTO-GENERACIÓN OC (Dic 2025 - Fase 2)
    auto_generar_oc BOOLEAN DEFAULT false, -- Generar OC automáticamente cuando stock <= stock_minimo
    cantidad_oc_sugerida INTEGER DEFAULT 50, -- Cantidad sugerida para OC automática
    lead_time_dias INTEGER DEFAULT 7, -- Días de entrega del proveedor (para reabastecimiento)

    -- 🔢 NÚMEROS DE SERIE (Dic 2025 - Fase 5)
    requiere_numero_serie BOOLEAN DEFAULT false, -- Requiere tracking por número de serie

    -- 📝 NOTAS
    notas TEXT,

    -- 🖼️ IMAGEN (Dic 2025 - Storage MinIO)
    imagen_url TEXT, -- URL de la imagen del producto

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT true,

    -- 🎨 VARIANTES (Dic 2025)
    tiene_variantes BOOLEAN DEFAULT false, -- Si tiene variantes con stock independiente

    -- 🚚 RUTA DE ABASTECIMIENTO (Dic 2025)
    ruta_preferida VARCHAR(20) DEFAULT 'normal' CHECK (ruta_preferida IN ('normal', 'dropship', 'fabricar')),
    -- normal = stock propio, dropship = proveedor envía directo, fabricar = producción interna

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, sku),
    UNIQUE(organizacion_id, codigo_barras),
    CHECK (precio_compra >= 0),
    CHECK (precio_venta > 0),
    CHECK (stock_actual >= 0),
    CHECK (stock_minimo >= 0),
    CHECK (stock_maximo >= stock_minimo),
    CHECK (dias_vida_util IS NULL OR dias_vida_util > 0)
);

COMMENT ON TABLE productos IS 'Catálogo de productos con control de stock, precios y alertas automáticas';
COMMENT ON COLUMN productos.sku IS 'Stock Keeping Unit - código interno único del producto';
COMMENT ON COLUMN productos.codigo_barras IS 'Código de barras estándar (EAN13, Code128, etc.)';
COMMENT ON COLUMN productos.stock_actual IS 'Cantidad actual en inventario (nunca puede ser negativo)';
COMMENT ON COLUMN productos.stock_minimo IS 'Genera alerta cuando stock <= este valor';
COMMENT ON COLUMN productos.es_perecedero IS 'Indica si el producto tiene fecha de vencimiento';

-- ============================================================================
-- TABLA: movimientos_inventario (PARTICIONADA POR MES)
-- Descripción: Registro de todos los movimientos de stock (entradas/salidas)
-- Particionamiento: Por rango de creado_en (mensual) para mejor performance
-- ============================================================================
CREATE TABLE IF NOT EXISTS movimientos_inventario (
    -- 🔑 IDENTIFICACIÓN (PK compuesta para particionamiento)
    id SERIAL,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- Sucursal donde ocurre el movimiento
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- 📋 TIPO DE MOVIMIENTO
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        -- ENTRADAS (cantidad positiva)
        'entrada_compra',          -- Compra a proveedor
        'entrada_devolucion',      -- Devolución de cliente
        'entrada_ajuste',          -- Ajuste manual positivo
        'transferencia_entrada',   -- Entrada por transferencia entre sucursales

        -- SALIDAS (cantidad negativa)
        'salida_venta',            -- Venta en POS
        'salida_uso_servicio',     -- Usado en cita/servicio
        'salida_merma',            -- Producto dañado/vencido
        'salida_robo',             -- Robo
        'salida_devolucion',       -- Devolución a proveedor
        'salida_ajuste',           -- Ajuste manual negativo
        'transferencia_salida'     -- Salida por transferencia entre sucursales
    )),

    -- 📊 CANTIDAD
    cantidad INTEGER NOT NULL CHECK (cantidad != 0),
    stock_antes INTEGER NOT NULL, -- Stock antes del movimiento
    stock_despues INTEGER NOT NULL, -- Stock después del movimiento

    -- 💰 VALOR
    costo_unitario DECIMAL(10, 2), -- Costo al momento del movimiento
    valor_total DECIMAL(10, 2), -- cantidad * costo_unitario

    -- 🔗 RELACIONES
    proveedor_id INTEGER REFERENCES proveedores(id),
    venta_pos_id INTEGER, -- FK diferido a ventas_pos (ver al final del archivo)
    cita_id INTEGER, -- Sin FK (citas es particionada por fecha_cita) - se valida en backend
    variante_id INTEGER, -- FK diferido a variantes_producto (ver al final del archivo)
    usuario_id INTEGER REFERENCES usuarios(id),

    -- 📝 METADATA
    referencia VARCHAR(100), -- Número de factura, orden de compra, etc.
    motivo TEXT,
    fecha_vencimiento DATE, -- Para productos perecederos
    lote VARCHAR(50), -- Número de lote del producto

    -- 📍 UBICACIONES (Fase 0 - Consolidación Stock)
    ubicacion_origen_id INTEGER,   -- FK diferido a ubicaciones_almacen (ver al final del archivo)
    ubicacion_destino_id INTEGER,  -- FK diferido a ubicaciones_almacen (ver al final del archivo)

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- 🔑 PRIMARY KEY COMPUESTA (requerida para particionamiento)
    PRIMARY KEY (id, creado_en),

    -- ✅ CONSTRAINTS
    CHECK (
        (tipo_movimiento LIKE 'entrada%' AND cantidad > 0) OR
        (tipo_movimiento LIKE 'salida%' AND cantidad < 0) OR
        (tipo_movimiento = 'transferencia_entrada' AND cantidad > 0) OR
        (tipo_movimiento = 'transferencia_salida' AND cantidad < 0)
    ),
    CHECK (stock_despues = stock_antes + cantidad),
    CHECK (stock_despues >= 0), -- El stock nunca puede ser negativo
    CHECK (costo_unitario IS NULL OR costo_unitario >= 0),
    CHECK (valor_total IS NULL OR valor_total >= 0)
) PARTITION BY RANGE (creado_en);

COMMENT ON TABLE movimientos_inventario IS 'Registro completo de movimientos de inventario (kardex). PARTICIONADA por mes para mejor performance en queries históricos.';
COMMENT ON COLUMN movimientos_inventario.cantidad IS 'Positivo para entradas, negativo para salidas';
COMMENT ON COLUMN movimientos_inventario.stock_antes IS 'Stock del producto antes de este movimiento';
COMMENT ON COLUMN movimientos_inventario.stock_despues IS 'Stock del producto después de este movimiento (= stock_antes + cantidad)';
COMMENT ON COLUMN movimientos_inventario.tipo_movimiento IS 'Tipo de movimiento: entrada_* (positivo) o salida_* (negativo)';
COMMENT ON COLUMN movimientos_inventario.referencia IS 'Número de factura, orden de compra u otro documento de respaldo';

-- ============================================================================
-- PARTICIONES DINÁMICAS: movimientos_inventario
-- ============================================================================
-- Crea particiones dinámicamente basadas en la fecha actual.
-- NO usa fechas hardcodeadas para evitar obsolescencia.
-- pg_cron mantiene particiones futuras automáticamente.
-- ============================================================================

DO $$
DECLARE
    v_inicio TIMESTAMPTZ;
    v_fin TIMESTAMPTZ;
    v_nombre VARCHAR;
    v_mes INTEGER;
BEGIN
    -- Crear particiones para los próximos 7 meses (actual + 6)
    FOR v_mes IN 0..6 LOOP
        v_inicio := DATE_TRUNC('month', NOW() + (v_mes || ' months')::INTERVAL);
        v_fin := DATE_TRUNC('month', NOW() + ((v_mes + 1) || ' months')::INTERVAL);
        v_nombre := 'movimientos_inventario_' || TO_CHAR(v_inicio, 'YYYY_MM');

        -- Solo crear si no existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = v_nombre AND n.nspname = 'public'
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF movimientos_inventario FOR VALUES FROM (%L) TO (%L)',
                v_nombre, v_inicio, v_fin
            );
            RAISE NOTICE '✅ Partición creada: % [% - %)', v_nombre, v_inicio, v_fin;
        END IF;
    END LOOP;
END $$;

-- ============================================================================
-- TABLA: alertas_inventario
-- Descripción: Alertas automáticas generadas por triggers (stock bajo, vencimientos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS alertas_inventario (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- 🔔 TIPO DE ALERTA
    tipo_alerta VARCHAR(30) NOT NULL CHECK (tipo_alerta IN (
        'stock_minimo',         -- Stock <= stock_minimo
        'stock_agotado',        -- Stock = 0
        'proximo_vencimiento',  -- Producto próximo a vencer (7 días)
        'vencido',              -- Producto ya vencido
        'sin_movimiento'        -- Sin movimientos en 90+ días
    )),

    -- 📝 MENSAJE
    mensaje TEXT NOT NULL,
    nivel VARCHAR(20) NOT NULL CHECK (nivel IN ('info', 'warning', 'critical')),

    -- 📊 ESTADO
    leida BOOLEAN DEFAULT false,
    leida_por INTEGER REFERENCES usuarios(id),
    leida_en TIMESTAMPTZ,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW()

    -- ✅ CONSTRAINTS
    -- NOTA: El constraint UNIQUE se crea como índice en 02-indices.sql usando función IMMUTABLE
);

COMMENT ON TABLE alertas_inventario IS 'Alertas automáticas de inventario generadas por triggers del sistema';
COMMENT ON COLUMN alertas_inventario.tipo_alerta IS 'Tipo de alerta que determina la urgencia y acción requerida';
COMMENT ON COLUMN alertas_inventario.nivel IS 'Nivel de criticidad: info (informativo), warning (atención), critical (urgente)';
-- NOTA: COMMENT sobre constraint UNIQUE ahora está en 02-indices.sql

-- ============================================================================
-- FUNCIÓN AUXILIAR: extraer_fecha_immutable
-- Descripción: Función IMMUTABLE para extraer DATE de TIMESTAMPTZ
-- Uso: Permite crear índices únicos con expresiones de fecha
-- ============================================================================
CREATE OR REPLACE FUNCTION extraer_fecha_immutable(ts TIMESTAMPTZ)
RETURNS DATE AS $$
    SELECT ts::DATE;
$$ LANGUAGE SQL IMMUTABLE;

COMMENT ON FUNCTION extraer_fecha_immutable IS 'Función IMMUTABLE para extraer DATE de TIMESTAMPTZ - usada en índice único idx_alertas_unique_tipo_dia';

-- ============================================================================
-- TABLA: configuracion_inventario
-- Descripción: Configuración del módulo de inventario por organización
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion_inventario (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE UNIQUE,

    -- 📊 VALORACIÓN
    metodo_valoracion VARCHAR(20) DEFAULT 'promedio' CHECK (metodo_valoracion IN ('fifo', 'lifo', 'promedio')),

    -- ⚙️ CONFIGURACIÓN GENERAL
    permitir_stock_negativo BOOLEAN DEFAULT false,
    alerta_stock_minimo BOOLEAN DEFAULT true,
    dias_alerta_vencimiento INTEGER DEFAULT 30,

    -- 🚚 DROPSHIPPING (Dic 2025)
    dropship_auto_generar_oc BOOLEAN DEFAULT true, -- true = genera OC automáticamente, false = manual

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE configuracion_inventario IS 'Configuración del módulo de inventario por organización';
COMMENT ON COLUMN configuracion_inventario.metodo_valoracion IS 'Método de valoración: FIFO, LIFO o Promedio Ponderado';
COMMENT ON COLUMN configuracion_inventario.dropship_auto_generar_oc IS 'Si true, genera OC automáticamente al vender producto dropship';

-- ============================================================================
-- NOTA: FK DIFERIDOS MOVIDOS A inventario/35-foreign-keys-diferidos.sql
-- ============================================================================
-- Los siguientes FKs requieren tablas de otros módulos que se crean después:
-- - fk_movimientos_variante → variantes_producto (archivo 20)
-- - fk_movimientos_ubicacion_origen → ubicaciones_almacen (archivo 13)
-- - fk_movimientos_ubicacion_destino → ubicaciones_almacen (archivo 13)
-- - fk_movimientos_venta_pos → ventas_pos (pos/01-tablas.sql)
-- ============================================================================

-- ============================================================================
-- FIN: TABLAS DE INVENTARIO
-- ============================================================================

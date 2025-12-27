-- ============================================================================
-- MODULO: INVENTARIO - VALORACION FIFO/AVCO
-- Descripcion: Sistema de valoracion de inventario con metodos contables
-- Version: 1.0
-- Fecha: 26 Diciembre 2025
-- Gap: Valoracion FIFO/AVCO (Alta Prioridad)
-- ============================================================================

-- ============================================================================
-- TABLA: configuracion_valoracion
-- Descripcion: Metodo de valoracion preferido por organizacion
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion_valoracion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Metodo de valoracion
    metodo_valoracion VARCHAR(20) NOT NULL DEFAULT 'promedio'
        CHECK (metodo_valoracion IN ('fifo', 'avco', 'promedio')),

    -- Configuracion adicional
    incluir_gastos_envio BOOLEAN DEFAULT false, -- Incluir gastos de envio en costo
    redondeo_decimales INTEGER DEFAULT 2 CHECK (redondeo_decimales BETWEEN 0 AND 6),

    -- Auditoria
    actualizado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Una configuracion por organizacion
    UNIQUE(organizacion_id)
);

COMMENT ON TABLE configuracion_valoracion IS 'Configuracion del metodo de valoracion de inventario por organizacion';
COMMENT ON COLUMN configuracion_valoracion.metodo_valoracion IS 'fifo=First In First Out, avco=Average Cost, promedio=Precio compra simple';

-- RLS para configuracion_valoracion
ALTER TABLE configuracion_valoracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "configuracion_valoracion_org" ON configuracion_valoracion
    FOR ALL
    USING (organizacion_id = current_setting('app.current_organization_id', true)::INTEGER);

-- Indice
CREATE INDEX IF NOT EXISTS idx_config_valoracion_org ON configuracion_valoracion(organizacion_id);

-- ============================================================================
-- FUNCION: calcular_costo_fifo
-- Descripcion: Calcula el costo unitario FIFO para un producto
-- Logica: Asigna costos de las entradas mas antiguas primero
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_costo_fifo(
    p_producto_id INTEGER,
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    costo_unitario_fifo NUMERIC(12,4),
    valor_total_fifo NUMERIC(12,2),
    stock_valorado INTEGER,
    capas_inventario JSONB
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_stock_restante INTEGER;
    v_costo_total NUMERIC(12,4) := 0;
    v_capas JSONB := '[]'::JSONB;
    rec RECORD;
BEGIN
    -- Obtener stock actual del producto
    SELECT stock_actual INTO v_stock_actual
    FROM productos
    WHERE id = p_producto_id
    AND organizacion_id = p_organizacion_id;

    IF v_stock_actual IS NULL OR v_stock_actual <= 0 THEN
        RETURN QUERY SELECT
            0::NUMERIC(12,4),
            0::NUMERIC(12,2),
            0::INTEGER,
            '[]'::JSONB;
        RETURN;
    END IF;

    v_stock_restante := v_stock_actual;

    -- Recorrer entradas desde la mas antigua
    -- Acumulando hasta cubrir el stock actual
    FOR rec IN (
        SELECT
            mi.id,
            mi.cantidad,
            COALESCE(mi.costo_unitario, 0) as costo,
            mi.creado_en,
            mi.referencia,
            mi.lote
        FROM movimientos_inventario mi
        WHERE mi.producto_id = p_producto_id
        AND mi.organizacion_id = p_organizacion_id
        AND (p_sucursal_id IS NULL OR mi.sucursal_id = p_sucursal_id)
        AND mi.tipo_movimiento IN ('entrada_compra', 'entrada_devolucion', 'entrada_ajuste')
        AND mi.cantidad > 0
        ORDER BY mi.creado_en ASC
    ) LOOP
        IF v_stock_restante <= 0 THEN
            EXIT;
        END IF;

        -- Cuantas unidades tomar de esta capa
        DECLARE
            v_unidades_capa INTEGER;
        BEGIN
            v_unidades_capa := LEAST(rec.cantidad, v_stock_restante);
            v_costo_total := v_costo_total + (v_unidades_capa * rec.costo);

            -- Agregar capa al JSON
            v_capas := v_capas || jsonb_build_object(
                'fecha', rec.creado_en,
                'cantidad', v_unidades_capa,
                'costo_unitario', rec.costo,
                'valor_capa', v_unidades_capa * rec.costo,
                'referencia', rec.referencia,
                'lote', rec.lote
            );

            v_stock_restante := v_stock_restante - v_unidades_capa;
        END;
    END LOOP;

    -- Si aun hay stock sin valorar (entradas sin costo), usar precio_compra
    IF v_stock_restante > 0 THEN
        DECLARE
            v_precio_compra NUMERIC;
        BEGIN
            SELECT precio_compra INTO v_precio_compra
            FROM productos WHERE id = p_producto_id;

            v_costo_total := v_costo_total + (v_stock_restante * COALESCE(v_precio_compra, 0));

            v_capas := v_capas || jsonb_build_object(
                'fecha', NULL,
                'cantidad', v_stock_restante,
                'costo_unitario', v_precio_compra,
                'valor_capa', v_stock_restante * COALESCE(v_precio_compra, 0),
                'referencia', 'Stock inicial sin movimiento',
                'lote', NULL
            );
        END;
    END IF;

    RETURN QUERY SELECT
        CASE WHEN v_stock_actual > 0
            THEN (v_costo_total / v_stock_actual)::NUMERIC(12,4)
            ELSE 0::NUMERIC(12,4)
        END,
        v_costo_total::NUMERIC(12,2),
        v_stock_actual,
        v_capas;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_costo_fifo IS 'Calcula costo FIFO: primeras entradas son las primeras en valorarse para el stock actual';

-- ============================================================================
-- FUNCION: calcular_costo_avco
-- Descripcion: Calcula el costo promedio ponderado (Average Cost)
-- Logica: Promedio ponderado de todos los costos de entrada
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_costo_avco(
    p_producto_id INTEGER,
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    costo_unitario_avco NUMERIC(12,4),
    valor_total_avco NUMERIC(12,2),
    stock_valorado INTEGER,
    total_entradas INTEGER,
    detalle_calculo JSONB
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_suma_valores NUMERIC(12,4) := 0;
    v_suma_cantidades INTEGER := 0;
    v_costo_promedio NUMERIC(12,4);
BEGIN
    -- Obtener stock actual
    SELECT stock_actual INTO v_stock_actual
    FROM productos
    WHERE id = p_producto_id
    AND organizacion_id = p_organizacion_id;

    IF v_stock_actual IS NULL OR v_stock_actual <= 0 THEN
        RETURN QUERY SELECT
            0::NUMERIC(12,4),
            0::NUMERIC(12,2),
            0::INTEGER,
            0::INTEGER,
            '{}'::JSONB;
        RETURN;
    END IF;

    -- Calcular suma ponderada de entradas
    SELECT
        COALESCE(SUM(cantidad * COALESCE(costo_unitario, 0)), 0),
        COALESCE(SUM(cantidad), 0)
    INTO v_suma_valores, v_suma_cantidades
    FROM movimientos_inventario
    WHERE producto_id = p_producto_id
    AND organizacion_id = p_organizacion_id
    AND (p_sucursal_id IS NULL OR sucursal_id = p_sucursal_id)
    AND tipo_movimiento IN ('entrada_compra', 'entrada_devolucion', 'entrada_ajuste')
    AND cantidad > 0
    AND costo_unitario IS NOT NULL
    AND costo_unitario > 0;

    -- Si no hay entradas con costo, usar precio_compra
    IF v_suma_cantidades = 0 THEN
        SELECT precio_compra INTO v_costo_promedio
        FROM productos WHERE id = p_producto_id;

        v_costo_promedio := COALESCE(v_costo_promedio, 0);
    ELSE
        v_costo_promedio := v_suma_valores / v_suma_cantidades;
    END IF;

    RETURN QUERY SELECT
        v_costo_promedio::NUMERIC(12,4),
        (v_stock_actual * v_costo_promedio)::NUMERIC(12,2),
        v_stock_actual,
        v_suma_cantidades,
        jsonb_build_object(
            'suma_valores', v_suma_valores,
            'suma_cantidades', v_suma_cantidades,
            'formula', 'costo_promedio = suma(cantidad * costo) / suma(cantidad)'
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_costo_avco IS 'Calcula costo AVCO: promedio ponderado de todos los costos de entrada';

-- ============================================================================
-- FUNCION: calcular_valor_inventario_metodo
-- Descripcion: Calcula valor total del inventario usando el metodo especificado
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_valor_inventario_metodo(
    p_organizacion_id INTEGER,
    p_metodo VARCHAR(20) DEFAULT NULL, -- Si NULL, usa configuracion de la org
    p_categoria_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    metodo_usado VARCHAR(20),
    total_productos BIGINT,
    total_unidades BIGINT,
    valor_total NUMERIC(12,2),
    valor_promedio_simple NUMERIC(12,2), -- Comparacion con metodo simple
    diferencia NUMERIC(12,2),
    porcentaje_diferencia NUMERIC(5,2)
) AS $$
DECLARE
    v_metodo VARCHAR(20);
    v_valor_metodo NUMERIC(12,2) := 0;
    v_valor_simple NUMERIC(12,2) := 0;
    v_total_productos BIGINT := 0;
    v_total_unidades BIGINT := 0;
    rec RECORD;
BEGIN
    -- Determinar metodo a usar
    IF p_metodo IS NOT NULL THEN
        v_metodo := p_metodo;
    ELSE
        SELECT metodo_valoracion INTO v_metodo
        FROM configuracion_valoracion
        WHERE organizacion_id = p_organizacion_id;

        v_metodo := COALESCE(v_metodo, 'promedio');
    END IF;

    -- Calcular valor por producto segun metodo
    FOR rec IN (
        SELECT id, stock_actual, precio_compra
        FROM productos
        WHERE organizacion_id = p_organizacion_id
        AND activo = true
        AND eliminado_en IS NULL
        AND stock_actual > 0
        AND (p_categoria_id IS NULL OR categoria_id = p_categoria_id)
    ) LOOP
        v_total_productos := v_total_productos + 1;
        v_total_unidades := v_total_unidades + rec.stock_actual;

        -- Valor simple (promedio)
        v_valor_simple := v_valor_simple + (rec.stock_actual * COALESCE(rec.precio_compra, 0));

        -- Valor segun metodo
        DECLARE
            v_valor_prod NUMERIC(12,2);
        BEGIN
            IF v_metodo = 'fifo' THEN
                SELECT valor_total_fifo INTO v_valor_prod
                FROM calcular_costo_fifo(rec.id, p_organizacion_id, p_sucursal_id);
                v_valor_metodo := v_valor_metodo + COALESCE(v_valor_prod, rec.stock_actual * COALESCE(rec.precio_compra, 0));
            ELSIF v_metodo = 'avco' THEN
                SELECT valor_total_avco INTO v_valor_prod
                FROM calcular_costo_avco(rec.id, p_organizacion_id, p_sucursal_id);
                v_valor_metodo := v_valor_metodo + COALESCE(v_valor_prod, rec.stock_actual * COALESCE(rec.precio_compra, 0));
            ELSE
                v_valor_metodo := v_valor_metodo + (rec.stock_actual * COALESCE(rec.precio_compra, 0));
            END IF;
        END;
    END LOOP;

    RETURN QUERY SELECT
        v_metodo,
        v_total_productos,
        v_total_unidades,
        v_valor_metodo,
        v_valor_simple,
        (v_valor_metodo - v_valor_simple)::NUMERIC(12,2),
        CASE WHEN v_valor_simple > 0
            THEN ((v_valor_metodo - v_valor_simple) / v_valor_simple * 100)::NUMERIC(5,2)
            ELSE 0::NUMERIC(5,2)
        END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_valor_inventario_metodo IS 'Calcula valor total del inventario usando FIFO, AVCO o Promedio';

-- ============================================================================
-- FUNCION: comparar_metodos_valoracion
-- Descripcion: Compara los 3 metodos de valoracion para un producto o inventario
-- ============================================================================
CREATE OR REPLACE FUNCTION comparar_metodos_valoracion(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER DEFAULT NULL -- Si NULL, compara todo el inventario
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre_producto VARCHAR(200),
    stock_actual INTEGER,
    valor_promedio NUMERIC(12,2),
    valor_fifo NUMERIC(12,2),
    valor_avco NUMERIC(12,2),
    diferencia_fifo_promedio NUMERIC(12,2),
    diferencia_avco_promedio NUMERIC(12,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nombre,
        p.stock_actual,
        (p.stock_actual * p.precio_compra)::NUMERIC(12,2) as v_promedio,
        (SELECT valor_total_fifo FROM calcular_costo_fifo(p.id, p_organizacion_id))::NUMERIC(12,2),
        (SELECT valor_total_avco FROM calcular_costo_avco(p.id, p_organizacion_id))::NUMERIC(12,2),
        ((SELECT valor_total_fifo FROM calcular_costo_fifo(p.id, p_organizacion_id)) -
         (p.stock_actual * p.precio_compra))::NUMERIC(12,2),
        ((SELECT valor_total_avco FROM calcular_costo_avco(p.id, p_organizacion_id)) -
         (p.stock_actual * p.precio_compra))::NUMERIC(12,2)
    FROM productos p
    WHERE p.organizacion_id = p_organizacion_id
    AND p.activo = true
    AND p.eliminado_en IS NULL
    AND p.stock_actual > 0
    AND (p_producto_id IS NULL OR p.id = p_producto_id)
    ORDER BY p.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION comparar_metodos_valoracion IS 'Compara valoracion FIFO vs AVCO vs Promedio para productos';

-- ============================================================================
-- FUNCION: obtener_capas_inventario_fifo
-- Descripcion: Obtiene las capas de inventario detalladas para FIFO
-- Util para reportes y trazabilidad
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_capas_inventario_fifo(
    p_producto_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    orden INTEGER,
    fecha_entrada TIMESTAMPTZ,
    cantidad_original INTEGER,
    cantidad_disponible INTEGER,
    costo_unitario NUMERIC(12,2),
    valor_capa NUMERIC(12,2),
    referencia VARCHAR(100),
    lote VARCHAR(50),
    proveedor VARCHAR(200)
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_stock_restante INTEGER;
    v_orden INTEGER := 0;
    rec RECORD;
BEGIN
    SELECT stock_actual INTO v_stock_actual
    FROM productos
    WHERE id = p_producto_id AND organizacion_id = p_organizacion_id;

    v_stock_restante := COALESCE(v_stock_actual, 0);

    FOR rec IN (
        SELECT
            mi.cantidad as cant_original,
            COALESCE(mi.costo_unitario, 0) as costo,
            mi.creado_en,
            mi.referencia as ref,
            mi.lote as lote_num,
            prov.nombre as proveedor_nombre
        FROM movimientos_inventario mi
        LEFT JOIN proveedores prov ON prov.id = mi.proveedor_id
        WHERE mi.producto_id = p_producto_id
        AND mi.organizacion_id = p_organizacion_id
        AND mi.tipo_movimiento IN ('entrada_compra', 'entrada_devolucion', 'entrada_ajuste')
        AND mi.cantidad > 0
        ORDER BY mi.creado_en ASC
    ) LOOP
        IF v_stock_restante <= 0 THEN
            EXIT;
        END IF;

        v_orden := v_orden + 1;

        DECLARE
            v_cantidad_disp INTEGER;
        BEGIN
            v_cantidad_disp := LEAST(rec.cant_original, v_stock_restante);

            RETURN QUERY SELECT
                v_orden,
                rec.creado_en,
                rec.cant_original,
                v_cantidad_disp,
                rec.costo::NUMERIC(12,2),
                (v_cantidad_disp * rec.costo)::NUMERIC(12,2),
                rec.ref,
                rec.lote_num,
                rec.proveedor_nombre;

            v_stock_restante := v_stock_restante - v_cantidad_disp;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_capas_inventario_fifo IS 'Detalla las capas de inventario FIFO con trazabilidad';

-- ============================================================================
-- INSERT: Configuracion por defecto para organizaciones existentes
-- ============================================================================
INSERT INTO configuracion_valoracion (organizacion_id, metodo_valoracion)
SELECT id, 'promedio'
FROM organizaciones
WHERE id NOT IN (SELECT organizacion_id FROM configuracion_valoracion)
ON CONFLICT (organizacion_id) DO NOTHING;

-- ============================================================================
-- FIN: VALORACION INVENTARIO FIFO/AVCO
-- ============================================================================

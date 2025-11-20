-- ============================================================================
-- MÓDULO: INVENTARIO - FUNCIONES PL/pgSQL
-- Descripción: Funciones para reportes, análisis y operaciones de inventario
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: extraer_fecha_immutable
-- Descripción: Función IMMUTABLE para extraer DATE de TIMESTAMPTZ
-- Uso: Permite crear índices con expresiones de fecha
-- ============================================================================
CREATE OR REPLACE FUNCTION extraer_fecha_immutable(ts TIMESTAMPTZ)
RETURNS DATE AS $$
    SELECT ts::DATE;
$$ LANGUAGE SQL IMMUTABLE;

COMMENT ON FUNCTION extraer_fecha_immutable IS 'Función IMMUTABLE para extraer DATE de TIMESTAMPTZ - usada en índices únicos';

-- ============================================================================
-- FUNCIÓN: calcular_valor_inventario
-- Descripción: Calcula el valor total del inventario (compra y venta)
-- Uso: SELECT * FROM calcular_valor_inventario(1);
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_valor_inventario(org_id INTEGER)
RETURNS TABLE (
    total_productos BIGINT,
    total_unidades BIGINT,
    valor_compra DECIMAL(10, 2),
    valor_venta DECIMAL(10, 2),
    margen_potencial DECIMAL(10, 2),
    porcentaje_margen DECIMAL(5, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_productos,
        SUM(stock_actual)::BIGINT AS total_unidades,
        SUM(stock_actual * precio_compra) AS valor_compra,
        SUM(stock_actual * precio_venta) AS valor_venta,
        SUM(stock_actual * (precio_venta - precio_compra)) AS margen_potencial,
        CASE
            WHEN SUM(stock_actual * precio_compra) > 0 THEN
                (SUM(stock_actual * (precio_venta - precio_compra)) / SUM(stock_actual * precio_compra) * 100)::DECIMAL(5, 2)
            ELSE 0
        END AS porcentaje_margen
    FROM productos
    WHERE organizacion_id = org_id
    AND activo = true
    AND stock_actual > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_valor_inventario IS 'Calcula el valor total del inventario en términos de compra, venta y margen potencial';

-- ============================================================================
-- FUNCIÓN: analisis_abc_productos
-- Descripción: Clasificación ABC de productos según ingresos generados (Pareto)
-- Uso: SELECT * FROM analisis_abc_productos(1, '2025-01-01', '2025-12-31');
-- ============================================================================
CREATE OR REPLACE FUNCTION analisis_abc_productos(
    org_id INTEGER,
    fecha_desde DATE,
    fecha_hasta DATE
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre_producto VARCHAR(200),
    categoria VARCHAR(100),
    total_vendido BIGINT,
    ingresos_generados DECIMAL(10, 2),
    porcentaje_ingresos DECIMAL(5, 2),
    porcentaje_acumulado DECIMAL(5, 2),
    clasificacion VARCHAR(1)
) AS $$
BEGIN
    RETURN QUERY
    WITH ventas_producto AS (
        SELECT
            vpi.producto_id,
            p.nombre,
            cp.nombre AS categoria,
            SUM(vpi.cantidad) AS total_vendido,
            SUM(vpi.subtotal) AS ingresos
        FROM ventas_pos_items vpi
        JOIN productos p ON p.id = vpi.producto_id
        LEFT JOIN categorias_productos cp ON cp.id = p.categoria_id
        JOIN ventas_pos vp ON vp.id = vpi.venta_pos_id
        WHERE vp.organizacion_id = org_id
        AND vp.fecha_venta BETWEEN fecha_desde AND fecha_hasta
        AND vp.estado = 'completada'
        GROUP BY vpi.producto_id, p.nombre, cp.nombre
    ),
    total_ingresos AS (
        SELECT SUM(ingresos) AS total FROM ventas_producto
    ),
    con_porcentaje AS (
        SELECT
            vp.producto_id,
            vp.nombre,
            vp.categoria,
            vp.total_vendido,
            vp.ingresos,
            (vp.ingresos / ti.total * 100)::DECIMAL(5, 2) AS porcentaje,
            SUM(vp.ingresos / ti.total * 100) OVER (
                ORDER BY vp.ingresos DESC
                ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
            )::DECIMAL(5, 2) AS acumulado
        FROM ventas_producto vp
        CROSS JOIN total_ingresos ti
        WHERE ti.total > 0
        ORDER BY vp.ingresos DESC
    )
    SELECT
        cp.producto_id,
        cp.nombre::VARCHAR(200),
        cp.categoria::VARCHAR(100),
        cp.total_vendido,
        cp.ingresos,
        cp.porcentaje,
        cp.acumulado,
        CASE
            WHEN cp.acumulado <= 80 THEN 'A' -- 80% de ingresos
            WHEN cp.acumulado <= 95 THEN 'B' -- Siguiente 15%
            ELSE 'C'                          -- Último 5%
        END::VARCHAR(1) AS clasificacion
    FROM con_porcentaje cp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION analisis_abc_productos IS 'Análisis ABC (Pareto) de productos: A=80% ingresos, B=15%, C=5%';

-- ============================================================================
-- FUNCIÓN: calcular_rotacion_inventario
-- Descripción: Calcula días promedio de rotación del inventario
-- Uso: SELECT * FROM calcular_rotacion_inventario(1, '2025-01-01', '2025-12-31');
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_rotacion_inventario(
    org_id INTEGER,
    fecha_desde DATE,
    fecha_hasta DATE
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre_producto VARCHAR(200),
    stock_actual INTEGER,
    unidades_vendidas BIGINT,
    dias_periodo INTEGER,
    rotacion_promedio DECIMAL(10, 2),
    dias_inventario DECIMAL(10, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id AS producto_id,
        p.nombre AS nombre_producto,
        p.stock_actual,
        COALESCE(SUM(ABS(mi.cantidad)), 0)::BIGINT AS unidades_vendidas,
        (fecha_hasta - fecha_desde)::INTEGER AS dias_periodo,
        CASE
            WHEN p.stock_actual > 0 THEN
                (COALESCE(SUM(ABS(mi.cantidad)), 0) / p.stock_actual)::DECIMAL(10, 2)
            ELSE 0
        END AS rotacion_promedio,
        CASE
            WHEN COALESCE(SUM(ABS(mi.cantidad)), 0) > 0 THEN
                ((fecha_hasta - fecha_desde) * p.stock_actual / COALESCE(SUM(ABS(mi.cantidad)), 0))::DECIMAL(10, 2)
            ELSE NULL
        END AS dias_inventario
    FROM productos p
    LEFT JOIN movimientos_inventario mi ON mi.producto_id = p.id
        AND mi.tipo_movimiento = 'salida_venta'
        AND mi.creado_en BETWEEN fecha_desde AND fecha_hasta
    WHERE p.organizacion_id = org_id
    AND p.activo = true
    GROUP BY p.id, p.nombre, p.stock_actual
    ORDER BY dias_inventario DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_rotacion_inventario IS 'Calcula días promedio de rotación: menores días = mayor rotación (bueno)';

-- ============================================================================
-- FUNCIÓN: productos_sin_movimiento
-- Descripción: Encuentra productos sin movimientos en X días
-- Uso: SELECT * FROM productos_sin_movimiento(1, 90);
-- ============================================================================
CREATE OR REPLACE FUNCTION productos_sin_movimiento(
    org_id INTEGER,
    dias INTEGER DEFAULT 90
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR(200),
    categoria VARCHAR(100),
    stock_actual INTEGER,
    valor_inventario DECIMAL(10, 2),
    dias_sin_movimiento INTEGER,
    ultimo_movimiento TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH ultimo_mov AS (
        SELECT
            mi.producto_id,
            MAX(mi.creado_en) AS fecha_ultimo
        FROM movimientos_inventario mi
        WHERE mi.organizacion_id = org_id
        GROUP BY mi.producto_id
    )
    SELECT
        p.id AS producto_id,
        p.nombre,
        cp.nombre::VARCHAR(100) AS categoria,
        p.stock_actual,
        (p.stock_actual * p.precio_compra) AS valor_inventario,
        EXTRACT(DAY FROM NOW() - COALESCE(um.fecha_ultimo, p.creado_en))::INTEGER AS dias_sin_movimiento,
        COALESCE(um.fecha_ultimo, p.creado_en) AS ultimo_movimiento
    FROM productos p
    LEFT JOIN categorias_productos cp ON cp.id = p.categoria_id
    LEFT JOIN ultimo_mov um ON um.producto_id = p.id
    WHERE p.organizacion_id = org_id
    AND p.activo = true
    AND p.stock_actual > 0
    AND (
        um.fecha_ultimo IS NULL
        OR um.fecha_ultimo < NOW() - (dias || ' days')::INTERVAL
    )
    ORDER BY dias_sin_movimiento DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION productos_sin_movimiento IS 'Identifica productos sin movimientos en X días (candidatos para descuento o eliminación)';

-- ============================================================================
-- NOTA: generar_folio_venta() fue ELIMINADA de aquí
-- Razón: Función DUPLICADA - Solo debe existir en sql/pos/04-funciones.sql
-- La función genera folios para ventas_pos (tabla del módulo POS)
-- ============================================================================

-- ============================================================================
-- FIN: FUNCIONES DE INVENTARIO
-- ============================================================================

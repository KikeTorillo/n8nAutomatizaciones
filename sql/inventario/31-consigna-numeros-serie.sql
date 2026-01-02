-- ============================================================================
-- MODULO: INVENTARIO - CONSIGNA CON NUMEROS DE SERIE
-- Descripcion: Soporte para numeros de serie en productos de consigna
-- Version: 1.0
-- Fecha: 31 Diciembre 2025
-- Gap: Productos con NS en consigna no podian venderse
-- NOTA: La funcion registrar_numero_serie ya incluye soporte para consigna
--       en el archivo 15-numeros-serie.sql (parametro p_acuerdo_consigna_id)
-- ============================================================================

-- ============================================================================
-- PASO 1: Agregar columna acuerdo_consigna_id a numeros_serie
-- ============================================================================
ALTER TABLE numeros_serie
ADD COLUMN IF NOT EXISTS acuerdo_consigna_id INTEGER REFERENCES acuerdos_consigna(id) ON DELETE SET NULL;

COMMENT ON COLUMN numeros_serie.acuerdo_consigna_id IS 'ID del acuerdo de consigna si el NS proviene de consigna (NULL si viene de OC normal)';

-- Indice para buscar NS por acuerdo de consigna
CREATE INDEX IF NOT EXISTS idx_ns_consigna ON numeros_serie(acuerdo_consigna_id)
WHERE acuerdo_consigna_id IS NOT NULL;

-- ============================================================================
-- PASO 2: Funcion para obtener NS disponibles de consigna
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_ns_disponibles_consigna(
    p_organizacion_id INTEGER,
    p_acuerdo_id INTEGER,
    p_producto_id INTEGER
)
RETURNS TABLE (
    id INTEGER,
    numero_serie VARCHAR(100),
    lote VARCHAR(50),
    fecha_vencimiento DATE,
    sucursal_nombre VARCHAR(200),
    ubicacion_codigo VARCHAR(50),
    costo_unitario NUMERIC(12,2),
    dias_en_stock INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ns.id,
        ns.numero_serie,
        ns.lote,
        ns.fecha_vencimiento,
        s.nombre AS sucursal_nombre,
        ua.codigo AS ubicacion_codigo,
        ns.costo_unitario,
        (CURRENT_DATE - ns.fecha_entrada::DATE)::INTEGER AS dias_en_stock
    FROM numeros_serie ns
    LEFT JOIN sucursales s ON s.id = ns.sucursal_id
    LEFT JOIN ubicaciones_almacen ua ON ua.id = ns.ubicacion_id
    WHERE ns.organizacion_id = p_organizacion_id
      AND ns.acuerdo_consigna_id = p_acuerdo_id
      AND ns.producto_id = p_producto_id
      AND ns.estado = 'disponible'
    ORDER BY ns.fecha_vencimiento ASC NULLS LAST, ns.fecha_entrada ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_ns_disponibles_consigna IS 'Lista NS disponibles de un producto en consigna (FEFO)';

-- ============================================================================
-- FIN: CONSIGNA CON NUMEROS DE SERIE
-- ============================================================================

-- ============================================================================
-- STOCK PROYECTADO - Nexo ERP
-- Fecha: 27 Diciembre 2025
-- Descripción: Funciones para calcular stock proyectado considerando OC pendientes
-- ============================================================================

-- Limpiar objetos existentes
DROP VIEW IF EXISTS v_alertas_con_stock_proyectado CASCADE;
DROP FUNCTION IF EXISTS calcular_stock_proyectado(INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS producto_necesita_reabastecimiento(INTEGER, INTEGER, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS obtener_alertas_con_proyeccion(INTEGER, TEXT, TEXT, BOOLEAN, BOOLEAN) CASCADE;

-- ============================================================================
-- FUNCIÓN: calcular_stock_proyectado
-- Descripción: Calcula el stock proyectado de un producto considerando:
--   - Stock actual
--   - OC pendientes (enviadas o parciales)
--   - Reservas activas
-- Retorna: stock_proyectado = stock_actual + oc_pendientes - reservas_activas
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_stock_proyectado(
    p_producto_id INTEGER,
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    producto_id INTEGER,
    stock_actual INTEGER,
    oc_pendientes INTEGER,
    reservas_activas INTEGER,
    stock_proyectado INTEGER,
    tiene_oc_pendiente BOOLEAN,
    oc_pendiente_folio TEXT
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_oc_pendientes INTEGER;
    v_reservas_activas INTEGER;
    v_tiene_oc BOOLEAN;
    v_folio TEXT;
BEGIN
    -- Obtener stock actual del producto
    SELECT COALESCE(p.stock_actual, 0)::INTEGER INTO v_stock_actual
    FROM productos p
    WHERE p.id = p_producto_id
      AND p.organizacion_id = p_organizacion_id
      AND (p_sucursal_id IS NULL OR p.sucursal_id = p_sucursal_id OR p.sucursal_id IS NULL);

    IF v_stock_actual IS NULL THEN
        v_stock_actual := 0;
    END IF;

    -- Obtener cantidad pendiente de OC
    SELECT
        COALESCE(SUM(oci.cantidad_pendiente), 0)::INTEGER,
        (SELECT oc2.folio
         FROM ordenes_compra oc2
         JOIN ordenes_compra_items oci2 ON oci2.orden_compra_id = oc2.id
         WHERE oci2.producto_id = p_producto_id
           AND oc2.organizacion_id = p_organizacion_id
           AND oc2.estado IN ('enviada', 'parcial', 'borrador', 'pendiente_aprobacion')
           AND oci2.estado IN ('pendiente', 'parcial')
         ORDER BY oc2.creado_en DESC
         LIMIT 1)
    INTO v_oc_pendientes, v_folio
    FROM ordenes_compra_items oci
    JOIN ordenes_compra oc ON oc.id = oci.orden_compra_id
    WHERE oci.producto_id = p_producto_id
      AND oc.organizacion_id = p_organizacion_id
      AND oc.estado IN ('enviada', 'parcial', 'borrador', 'pendiente_aprobacion')
      AND oci.estado IN ('pendiente', 'parcial');

    IF v_oc_pendientes IS NULL THEN
        v_oc_pendientes := 0;
    END IF;

    v_tiene_oc := v_oc_pendientes > 0;

    -- Obtener reservas activas
    SELECT COALESCE(SUM(r.cantidad), 0)::INTEGER INTO v_reservas_activas
    FROM reservas_stock r
    WHERE r.producto_id = p_producto_id
      AND r.organizacion_id = p_organizacion_id
      AND r.estado = 'activa'
      AND (r.expira_en IS NULL OR r.expira_en > NOW())
      AND (p_sucursal_id IS NULL OR r.sucursal_id = p_sucursal_id);

    IF v_reservas_activas IS NULL THEN
        v_reservas_activas := 0;
    END IF;

    -- Retornar resultado
    RETURN QUERY SELECT
        p_producto_id,
        v_stock_actual,
        v_oc_pendientes,
        v_reservas_activas,
        (v_stock_actual + v_oc_pendientes - v_reservas_activas)::INTEGER,
        v_tiene_oc,
        v_folio;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION calcular_stock_proyectado IS
'Calcula el stock proyectado considerando OC pendientes y reservas activas.
Usado para determinar si realmente se necesita generar una nueva OC.';

-- ============================================================================
-- FUNCIÓN: producto_necesita_reabastecimiento
-- Descripción: Determina si un producto necesita reabastecimiento basado en
--              stock proyectado (no stock actual)
-- Retorna: TRUE si stock_proyectado < stock_minimo
-- ============================================================================
CREATE OR REPLACE FUNCTION producto_necesita_reabastecimiento(
    p_producto_id INTEGER,
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock_minimo INTEGER;
    v_stock_proyectado INTEGER;
BEGIN
    -- Obtener stock mínimo del producto
    SELECT stock_minimo INTO v_stock_minimo
    FROM productos
    WHERE id = p_producto_id AND organizacion_id = p_organizacion_id;

    IF v_stock_minimo IS NULL THEN
        RETURN FALSE;
    END IF;

    -- Calcular stock proyectado
    SELECT sp.stock_proyectado INTO v_stock_proyectado
    FROM calcular_stock_proyectado(p_producto_id, p_organizacion_id, p_sucursal_id) sp;

    RETURN COALESCE(v_stock_proyectado, 0) < v_stock_minimo;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION producto_necesita_reabastecimiento IS
'Determina si un producto necesita reabastecimiento basado en stock proyectado.
Considera OC pendientes para evitar duplicación de órdenes.';

-- ============================================================================
-- VISTA: v_alertas_con_stock_proyectado
-- Descripción: Vista de alertas enriquecida con información de stock proyectado
-- ============================================================================
CREATE OR REPLACE VIEW v_alertas_con_stock_proyectado AS
SELECT
    a.id,
    a.organizacion_id,
    a.producto_id,
    a.tipo_alerta,
    a.mensaje,
    a.nivel,
    a.leida,
    a.leida_por,
    a.leida_en,
    a.creado_en,
    p.nombre AS nombre_producto,
    p.sku,
    p.stock_actual,
    p.stock_minimo,
    p.stock_maximo,
    p.proveedor_id,
    prov.nombre AS proveedor_nombre,
    sp.oc_pendientes,
    sp.reservas_activas,
    sp.stock_proyectado,
    sp.tiene_oc_pendiente,
    sp.oc_pendiente_folio,
    -- Determinar si aún necesita acción basado en stock proyectado
    CASE
        WHEN a.tipo_alerta IN ('stock_minimo', 'stock_agotado')
             AND sp.stock_proyectado >= p.stock_minimo THEN FALSE
        ELSE TRUE
    END AS necesita_accion
FROM alertas_inventario a
JOIN productos p ON p.id = a.producto_id
LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
LEFT JOIN LATERAL calcular_stock_proyectado(a.producto_id, a.organizacion_id, NULL) sp ON TRUE;

COMMENT ON VIEW v_alertas_con_stock_proyectado IS
'Vista de alertas con información de stock proyectado para determinar si aún requieren acción.';

-- ============================================================================
-- FUNCIÓN: obtener_alertas_con_proyeccion
-- Descripción: Obtiene alertas con información de stock proyectado
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_alertas_con_proyeccion(
    p_organizacion_id INTEGER,
    p_tipo_alerta TEXT DEFAULT NULL,
    p_nivel TEXT DEFAULT NULL,
    p_leida BOOLEAN DEFAULT NULL,
    p_solo_necesitan_accion BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id INTEGER,
    organizacion_id INTEGER,
    producto_id INTEGER,
    tipo_alerta VARCHAR(30),
    mensaje TEXT,
    nivel VARCHAR(20),
    leida BOOLEAN,
    leida_por INTEGER,
    leida_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ,
    nombre_producto VARCHAR(255),
    sku VARCHAR(100),
    stock_actual INTEGER,
    stock_minimo INTEGER,
    stock_maximo INTEGER,
    proveedor_id INTEGER,
    proveedor_nombre VARCHAR(255),
    oc_pendientes INTEGER,
    reservas_activas INTEGER,
    stock_proyectado INTEGER,
    tiene_oc_pendiente BOOLEAN,
    oc_pendiente_folio TEXT,
    necesita_accion BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.organizacion_id,
        v.producto_id,
        v.tipo_alerta,
        v.mensaje,
        v.nivel,
        v.leida,
        v.leida_por,
        v.leida_en,
        v.creado_en,
        v.nombre_producto,
        v.sku,
        v.stock_actual,
        v.stock_minimo,
        v.stock_maximo,
        v.proveedor_id,
        v.proveedor_nombre,
        v.oc_pendientes,
        v.reservas_activas,
        v.stock_proyectado,
        v.tiene_oc_pendiente,
        v.oc_pendiente_folio,
        v.necesita_accion
    FROM v_alertas_con_stock_proyectado v
    WHERE v.organizacion_id = p_organizacion_id
      AND (p_tipo_alerta IS NULL OR v.tipo_alerta = p_tipo_alerta)
      AND (p_nivel IS NULL OR v.nivel = p_nivel)
      AND (p_leida IS NULL OR v.leida = p_leida)
      AND (NOT p_solo_necesitan_accion OR v.necesita_accion = TRUE)
    ORDER BY
        CASE v.nivel
            WHEN 'critical' THEN 1
            WHEN 'warning' THEN 2
            ELSE 3
        END,
        v.leida ASC,
        v.creado_en DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_alertas_con_proyeccion IS
'Obtiene alertas con información de stock proyectado y filtros opcionales.';

-- ============================================================================
-- FIN: Stock Proyectado
-- ============================================================================

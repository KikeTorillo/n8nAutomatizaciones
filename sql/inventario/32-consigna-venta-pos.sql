-- ============================================================================
-- MODULO: INVENTARIO - CONSIGNA VENTA POS
-- Descripcion: Trigger para registrar movimiento de consigna al vender en POS
-- Version: 1.0
-- Fecha: 1 Enero 2026
-- Gap: Ventas de consigna no crean movimientos_consigna
-- ============================================================================

-- ============================================================================
-- PASO 1: Funcion del trigger
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_venta_consigna_pos()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_acuerdo_id INTEGER;
    v_stock_consigna_id INTEGER;
    v_precio_consigna NUMERIC(12,2);
    v_sucursal_id INTEGER;
    v_organizacion_id INTEGER;
    v_usuario_id INTEGER;
    v_estado VARCHAR(20);
BEGIN
    -- Obtener datos de la venta padre
    SELECT estado, sucursal_id, organizacion_id, usuario_id
    INTO v_estado, v_sucursal_id, v_organizacion_id, v_usuario_id
    FROM ventas_pos
    WHERE id = NEW.venta_pos_id;

    -- Solo procesar si la venta esta completada
    -- (evitar procesar cotizaciones)
    IF v_estado != 'completada' THEN
        RETURN NEW;
    END IF;

    -- CASO 1: Producto con numero de serie de consigna
    IF NEW.numero_serie_id IS NOT NULL THEN
        -- Verificar si el NS viene de consigna
        SELECT ns.acuerdo_consigna_id
        INTO v_acuerdo_id
        FROM numeros_serie ns
        WHERE ns.id = NEW.numero_serie_id;

        IF v_acuerdo_id IS NOT NULL THEN
            -- Obtener stock_consigna_id y precio
            SELECT sc.id, acp.precio_consigna
            INTO v_stock_consigna_id, v_precio_consigna
            FROM stock_consigna sc
            JOIN acuerdos_consigna_productos acp
                ON acp.acuerdo_id = sc.acuerdo_id
                AND acp.producto_id = sc.producto_id
                AND (acp.variante_id = sc.variante_id OR (acp.variante_id IS NULL AND sc.variante_id IS NULL))
            WHERE sc.acuerdo_id = v_acuerdo_id
              AND sc.producto_id = NEW.producto_id
              AND sc.sucursal_id = v_sucursal_id
            LIMIT 1;

            -- Registrar movimiento (cantidad=1 para NS)
            IF v_stock_consigna_id IS NOT NULL THEN
                PERFORM registrar_movimiento_consigna(
                    v_organizacion_id,      -- p_organizacion_id
                    v_acuerdo_id,           -- p_acuerdo_id
                    NEW.producto_id,        -- p_producto_id
                    NEW.variante_id,        -- p_variante_id
                    v_sucursal_id,          -- p_sucursal_id
                    NULL,                   -- p_ubicacion_id
                    'venta',                -- p_tipo
                    1,                      -- p_cantidad (1 por NS)
                    v_precio_consigna,      -- p_precio_unitario
                    NEW.venta_pos_id,       -- p_venta_pos_id
                    NEW.id,                 -- p_venta_pos_item_id
                    NEW.numero_serie_id,    -- p_numero_serie_id
                    NULL,                   -- p_lote
                    'Venta POS automatica', -- p_notas
                    v_usuario_id            -- p_usuario_id
                );
            END IF;
        END IF;

    -- CASO 2: Producto sin NS pero en consigna (por cantidad)
    ELSE
        -- Buscar si el producto tiene stock en consigna activa
        SELECT sc.id, sc.acuerdo_id, acp.precio_consigna
        INTO v_stock_consigna_id, v_acuerdo_id, v_precio_consigna
        FROM stock_consigna sc
        JOIN acuerdos_consigna ac ON ac.id = sc.acuerdo_id
        JOIN acuerdos_consigna_productos acp
            ON acp.acuerdo_id = sc.acuerdo_id
            AND acp.producto_id = sc.producto_id
            AND (acp.variante_id = sc.variante_id OR (acp.variante_id IS NULL AND sc.variante_id IS NULL))
        WHERE sc.producto_id = NEW.producto_id
          AND (sc.variante_id = NEW.variante_id OR (sc.variante_id IS NULL AND NEW.variante_id IS NULL))
          AND sc.sucursal_id = v_sucursal_id
          AND sc.organizacion_id = v_organizacion_id
          AND ac.estado = 'activo'
          AND sc.cantidad_disponible > 0
        ORDER BY sc.cantidad_disponible DESC
        LIMIT 1;

        IF v_stock_consigna_id IS NOT NULL THEN
            PERFORM registrar_movimiento_consigna(
                v_organizacion_id,      -- p_organizacion_id
                v_acuerdo_id,           -- p_acuerdo_id
                NEW.producto_id,        -- p_producto_id
                NEW.variante_id,        -- p_variante_id
                v_sucursal_id,          -- p_sucursal_id
                NULL,                   -- p_ubicacion_id
                'venta',                -- p_tipo
                NEW.cantidad,           -- p_cantidad
                v_precio_consigna,      -- p_precio_unitario
                NEW.venta_pos_id,       -- p_venta_pos_id
                NEW.id,                 -- p_venta_pos_item_id
                NULL,                   -- p_numero_serie_id
                NULL,                   -- p_lote
                'Venta POS automatica', -- p_notas
                v_usuario_id            -- p_usuario_id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION registrar_venta_consigna_pos() IS
    'Funcion trigger que registra movimiento de consigna al vender producto en consignacion desde POS';

-- ============================================================================
-- PASO 2: Crear trigger
-- ============================================================================
DROP TRIGGER IF EXISTS trg_venta_consigna_pos ON ventas_pos_items;
CREATE TRIGGER trg_venta_consigna_pos
    AFTER INSERT ON ventas_pos_items
    FOR EACH ROW
    EXECUTE FUNCTION registrar_venta_consigna_pos();

COMMENT ON TRIGGER trg_venta_consigna_pos ON ventas_pos_items IS
    'Registra movimiento de consigna automaticamente al vender producto en consignacion';

-- ============================================================================
-- FIN: CONSIGNA VENTA POS
-- ============================================================================

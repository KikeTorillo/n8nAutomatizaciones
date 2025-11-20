-- ============================================================================
-- MÓDULO: INVENTARIO - TRIGGERS
-- Descripción: Triggers automáticos para alertas y validaciones
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- TRIGGER 1: Generar alertas automáticas de inventario
-- Se ejecuta DESPUÉS de INSERT en movimientos_inventario
-- ============================================================================

CREATE OR REPLACE FUNCTION verificar_alertas_inventario()
RETURNS TRIGGER AS $$
DECLARE
    producto RECORD;
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener información del producto
    SELECT * INTO producto
    FROM productos
    WHERE id = NEW.producto_id;

    -- Alerta: Stock mínimo
    IF producto.stock_actual <= producto.stock_minimo
       AND producto.alerta_stock_minimo
       AND producto.activo THEN

        INSERT INTO alertas_inventario (
            organizacion_id,
            producto_id,
            tipo_alerta,
            mensaje,
            nivel
        ) VALUES (
            producto.organizacion_id,
            producto.id,
            'stock_minimo',
            'El producto "' || producto.nombre || '" tiene stock bajo (' || producto.stock_actual || ' unidades). Stock mínimo: ' || producto.stock_minimo,
            'warning'
        )
        ON CONFLICT (producto_id, tipo_alerta, (extraer_fecha_immutable(creado_en))) DO NOTHING;
    END IF;

    -- Alerta: Stock agotado
    IF producto.stock_actual = 0 AND producto.activo THEN
        INSERT INTO alertas_inventario (
            organizacion_id,
            producto_id,
            tipo_alerta,
            mensaje,
            nivel
        ) VALUES (
            producto.organizacion_id,
            producto.id,
            'stock_agotado',
            'El producto "' || producto.nombre || '" está AGOTADO (0 unidades)',
            'critical'
        )
        ON CONFLICT (producto_id, tipo_alerta, (extraer_fecha_immutable(creado_en))) DO NOTHING;
    END IF;

    -- Alerta: Próximo a vencer (solo si es perecedero)
    IF producto.es_perecedero
       AND NEW.fecha_vencimiento IS NOT NULL
       AND NEW.fecha_vencimiento BETWEEN CURRENT_DATE AND (CURRENT_DATE + INTERVAL '7 days')
       AND producto.activo THEN

        INSERT INTO alertas_inventario (
            organizacion_id,
            producto_id,
            tipo_alerta,
            mensaje,
            nivel
        ) VALUES (
            producto.organizacion_id,
            producto.id,
            'proximo_vencimiento',
            'El producto "' || producto.nombre || '" (lote: ' || COALESCE(NEW.lote, 'N/A') || ') vence el ' || TO_CHAR(NEW.fecha_vencimiento, 'DD/MM/YYYY'),
            'warning'
        )
        ON CONFLICT (producto_id, tipo_alerta, (extraer_fecha_immutable(creado_en))) DO NOTHING;
    END IF;

    -- Alerta: Ya vencido
    IF producto.es_perecedero
       AND NEW.fecha_vencimiento IS NOT NULL
       AND NEW.fecha_vencimiento < CURRENT_DATE
       AND producto.activo THEN

        INSERT INTO alertas_inventario (
            organizacion_id,
            producto_id,
            tipo_alerta,
            mensaje,
            nivel
        ) VALUES (
            producto.organizacion_id,
            producto.id,
            'vencido',
            'El producto "' || producto.nombre || '" (lote: ' || COALESCE(NEW.lote, 'N/A') || ') está VENCIDO desde el ' || TO_CHAR(NEW.fecha_vencimiento, 'DD/MM/YYYY'),
            'critical'
        )
        ON CONFLICT (producto_id, tipo_alerta, (extraer_fecha_immutable(creado_en))) DO NOTHING;
    END IF;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION verificar_alertas_inventario IS 'Genera alertas automáticas de stock bajo, agotado, vencimientos';

CREATE TRIGGER trigger_verificar_alertas
    AFTER INSERT ON movimientos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION verificar_alertas_inventario();

COMMENT ON TRIGGER trigger_verificar_alertas ON movimientos_inventario IS 'Genera alertas automáticas después de cada movimiento de inventario';

-- ============================================================================
-- TRIGGER 2: Actualizar timestamp en productos
-- Se ejecuta ANTES de UPDATE
-- ============================================================================

CREATE OR REPLACE FUNCTION actualizar_timestamp_producto()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_timestamp_producto
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_producto();

COMMENT ON TRIGGER trigger_actualizar_timestamp_producto ON productos IS 'Actualiza actualizado_en automáticamente en cada UPDATE';

-- ============================================================================
-- TRIGGER 3: Actualizar timestamp en categorías
-- ============================================================================

CREATE TRIGGER trigger_actualizar_timestamp_categoria
    BEFORE UPDATE ON categorias_productos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_producto();

COMMENT ON TRIGGER trigger_actualizar_timestamp_categoria ON categorias_productos IS 'Actualiza actualizado_en automáticamente';

-- ============================================================================
-- TRIGGER 4: Actualizar timestamp en proveedores
-- ============================================================================

CREATE TRIGGER trigger_actualizar_timestamp_proveedor
    BEFORE UPDATE ON proveedores
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_producto();

COMMENT ON TRIGGER trigger_actualizar_timestamp_proveedor ON proveedores IS 'Actualiza actualizado_en automáticamente';

-- ============================================================================
-- FIN: TRIGGERS DE INVENTARIO
-- ============================================================================

-- Nota sobre rendimiento:
-- - El trigger verificar_alertas se ejecuta en CADA movimiento de inventario
-- - ON CONFLICT evita duplicados (máximo 1 alerta por tipo por día)
-- - Las alertas se generan solo para productos activos
-- - Los timestamps se actualizan automáticamente en productos, categorías y proveedores

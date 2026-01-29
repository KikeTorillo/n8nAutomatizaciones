-- ============================================================================
-- MÓDULO: INVENTARIO - CONSOLIDACIÓN DE STOCK
-- Descripción: Unifica fuentes de verdad del stock (Fase 0)
-- Versión: 1.0
-- Fecha: Enero 2026
-- ============================================================================
-- PROBLEMA RESUELTO:
--   Antes: 3 fuentes de verdad NO sincronizadas
--     1. productos.stock_actual       → Usado por POS, movimientos
--     2. stock_sucursales             → Usado por transferencias
--     3. stock_ubicaciones            → WMS aislado
--
--   Ahora: 1 fuente de verdad
--     stock_ubicaciones (ÚNICA FUENTE)
--          ↓ trigger sincroniza
--     productos.stock_actual (CALCULADO)
-- ============================================================================

-- ============================================================================
-- VISTA: v_stock_consolidado
-- Descripción: Stock agregado por producto/sucursal desde stock_ubicaciones
-- ============================================================================
CREATE OR REPLACE VIEW v_stock_consolidado AS
SELECT
    su.organizacion_id,
    u.sucursal_id,
    su.producto_id,
    SUM(su.cantidad) as cantidad_total,
    COUNT(DISTINCT su.ubicacion_id) as total_ubicaciones,
    MIN(su.fecha_entrada) as primera_entrada,
    MAX(su.actualizado_en) as ultima_actualizacion
FROM stock_ubicaciones su
JOIN ubicaciones_almacen u ON u.id = su.ubicacion_id
WHERE su.cantidad > 0
GROUP BY su.organizacion_id, u.sucursal_id, su.producto_id;

COMMENT ON VIEW v_stock_consolidado IS 'Stock agregado por producto/sucursal desde stock_ubicaciones';

-- ============================================================================
-- FUNCIÓN: crear_ubicacion_default_sucursal
-- Descripción: Crea ubicación default para una sucursal si no existe
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_ubicacion_default_sucursal(
    p_sucursal_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_ubicacion_id INTEGER;
BEGIN
    -- Buscar ubicación default existente
    SELECT id INTO v_ubicacion_id
    FROM ubicaciones_almacen
    WHERE sucursal_id = p_sucursal_id
      AND es_default = true
      AND activo = true;

    IF v_ubicacion_id IS NULL THEN
        INSERT INTO ubicaciones_almacen (
            organizacion_id, sucursal_id, codigo, nombre,
            tipo, nivel, es_default, activo
        ) VALUES (
            p_organizacion_id, p_sucursal_id, 'DEFAULT',
            'Stock General', 'bin', 1, true, true
        )
        RETURNING id INTO v_ubicacion_id;
    END IF;

    RETURN v_ubicacion_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_ubicacion_default_sucursal IS 'Obtiene o crea ubicación default de una sucursal';

-- ============================================================================
-- FUNCIÓN: obtener_ubicacion_usuario (Enero 2026)
-- Descripción: Obtiene ubicación para un usuario según sus permisos asignados
-- Flujo de resolución:
-- 1. Buscar ubicación default del usuario en la sucursal
-- 2. Si no tiene default, buscar cualquier ubicación permitida
-- 3. Fallback: ubicación default de sucursal (comportamiento legacy)
-- NOTA: Esta función debe estar ANTES de registrar_movimiento_con_ubicacion
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_ubicacion_usuario(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_organizacion_id INTEGER,
    p_tipo_operacion VARCHAR(20) DEFAULT 'despachar' -- 'recibir' o 'despachar'
)
RETURNS INTEGER AS $$
DECLARE
    v_ubicacion_id INTEGER;
BEGIN
    -- 1. Buscar ubicación default del usuario en esta sucursal
    SELECT uu.ubicacion_id INTO v_ubicacion_id
    FROM usuarios_ubicaciones uu
    JOIN ubicaciones_almacen ua ON ua.id = uu.ubicacion_id
    WHERE uu.usuario_id = p_usuario_id
      AND ua.sucursal_id = p_sucursal_id
      AND uu.es_default = true
      AND uu.activo = true
      AND ua.activo = true
      AND CASE
          WHEN p_tipo_operacion = 'recibir' THEN uu.puede_recibir
          ELSE uu.puede_despachar
          END = true;

    -- 2. Si no tiene default, buscar cualquier ubicación permitida
    IF v_ubicacion_id IS NULL THEN
        SELECT uu.ubicacion_id INTO v_ubicacion_id
        FROM usuarios_ubicaciones uu
        JOIN ubicaciones_almacen ua ON ua.id = uu.ubicacion_id
        WHERE uu.usuario_id = p_usuario_id
          AND ua.sucursal_id = p_sucursal_id
          AND uu.activo = true
          AND ua.activo = true
          AND CASE
              WHEN p_tipo_operacion = 'recibir' THEN uu.puede_recibir
              ELSE uu.puede_despachar
              END = true
        LIMIT 1;
    END IF;

    -- 3. Fallback: ubicación default de sucursal (comportamiento legacy)
    IF v_ubicacion_id IS NULL THEN
        v_ubicacion_id := crear_ubicacion_default_sucursal(p_sucursal_id, p_organizacion_id);
    END IF;

    RETURN v_ubicacion_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_ubicacion_usuario IS 'Obtiene ubicación del usuario para operaciones o fallback a default de sucursal';

-- ============================================================================
-- FUNCIÓN: sincronizar_stock_producto
-- Descripción: Sincroniza productos.stock_actual desde stock_ubicaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION sincronizar_stock_producto(p_producto_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_stock_total INTEGER;
BEGIN
    SELECT COALESCE(SUM(su.cantidad), 0) INTO v_stock_total
    FROM stock_ubicaciones su
    WHERE su.producto_id = p_producto_id;

    UPDATE productos
    SET stock_actual = v_stock_total,
        actualizado_en = NOW()
    WHERE id = p_producto_id;

    RETURN v_stock_total;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION sincronizar_stock_producto IS 'Sincroniza stock_actual de un producto desde stock_ubicaciones';

-- ============================================================================
-- TRIGGER: Sincronizar stock al modificar stock_ubicaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_sincronizar_stock_producto()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM sincronizar_stock_producto(OLD.producto_id);
        RETURN OLD;
    ELSE
        PERFORM sincronizar_stock_producto(NEW.producto_id);
        -- Si cambió el producto (raro pero posible)
        IF TG_OP = 'UPDATE' AND OLD.producto_id != NEW.producto_id THEN
            PERFORM sincronizar_stock_producto(OLD.producto_id);
        END IF;
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sincronizar_stock ON stock_ubicaciones;
CREATE TRIGGER trg_sincronizar_stock
    AFTER INSERT OR UPDATE OR DELETE ON stock_ubicaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_sincronizar_stock_producto();

-- ============================================================================
-- FUNCIÓN: registrar_movimiento_con_ubicacion
-- Descripción: Registra movimiento Y actualiza stock_ubicaciones atómicamente
-- Ene 2026: Agregado p_variante_id para soporte de variantes de producto
-- Ene 2026: Resolución de ubicación basada en usuario (usuarios_ubicaciones)
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_movimiento_con_ubicacion(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER,
    p_tipo_movimiento VARCHAR(30),
    p_cantidad INTEGER,
    p_sucursal_id INTEGER,
    p_ubicacion_id INTEGER DEFAULT NULL,
    p_lote VARCHAR(50) DEFAULT NULL,
    p_fecha_vencimiento DATE DEFAULT NULL,
    p_referencia VARCHAR(100) DEFAULT NULL,
    p_motivo TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL,
    p_costo_unitario DECIMAL(10,2) DEFAULT NULL,
    p_proveedor_id INTEGER DEFAULT NULL,
    p_venta_pos_id INTEGER DEFAULT NULL,
    p_cita_id INTEGER DEFAULT NULL,
    p_variante_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_ubicacion_id INTEGER;
    v_stock_antes INTEGER;
    v_stock_despues INTEGER;
    v_movimiento_id INTEGER;
    v_valor_total DECIMAL(10,2);
    v_tipo_operacion VARCHAR(20);
BEGIN
    -- Obtener ubicación: prioridad usuario > default sucursal
    IF p_ubicacion_id IS NULL THEN
        -- Determinar tipo de operación basado en cantidad
        IF p_cantidad > 0 THEN
            v_tipo_operacion := 'recibir';
        ELSE
            v_tipo_operacion := 'despachar';
        END IF;

        -- Si hay usuario, intentar obtener su ubicación asignada
        IF p_usuario_id IS NOT NULL THEN
            v_ubicacion_id := obtener_ubicacion_usuario(p_usuario_id, p_sucursal_id, p_organizacion_id, v_tipo_operacion);
        ELSE
            -- Fallback: ubicación default de sucursal
            v_ubicacion_id := crear_ubicacion_default_sucursal(p_sucursal_id, p_organizacion_id);
        END IF;
    ELSE
        v_ubicacion_id := p_ubicacion_id;
    END IF;

    -- Obtener stock actual (de variante si existe, sino del producto)
    IF p_variante_id IS NOT NULL THEN
        SELECT COALESCE(stock_actual, 0) INTO v_stock_antes
        FROM variantes_producto WHERE id = p_variante_id;
    ELSE
        SELECT COALESCE(stock_actual, 0) INTO v_stock_antes
        FROM productos WHERE id = p_producto_id;
    END IF;

    v_stock_despues := v_stock_antes + p_cantidad;

    -- Validar stock no negativo
    IF v_stock_despues < 0 THEN
        RAISE EXCEPTION 'Stock insuficiente para producto %. Actual: %, Solicitado: %',
            p_producto_id, v_stock_antes, ABS(p_cantidad);
    END IF;

    -- Calcular valor total
    v_valor_total := ABS(p_cantidad) * COALESCE(p_costo_unitario, 0);

    -- Insertar movimiento
    INSERT INTO movimientos_inventario (
        organizacion_id, sucursal_id, producto_id, variante_id, tipo_movimiento,
        cantidad, stock_antes, stock_despues,
        ubicacion_origen_id, ubicacion_destino_id,
        lote, fecha_vencimiento,
        referencia, motivo, usuario_id, costo_unitario,
        valor_total, proveedor_id, venta_pos_id, cita_id
    ) VALUES (
        p_organizacion_id, p_sucursal_id, p_producto_id, p_variante_id, p_tipo_movimiento,
        p_cantidad, v_stock_antes, v_stock_despues,
        CASE WHEN p_cantidad < 0 THEN v_ubicacion_id ELSE NULL END,
        CASE WHEN p_cantidad > 0 THEN v_ubicacion_id ELSE NULL END,
        p_lote, p_fecha_vencimiento,
        p_referencia, p_motivo, p_usuario_id, p_costo_unitario,
        v_valor_total, p_proveedor_id, p_venta_pos_id, p_cita_id
    )
    RETURNING id INTO v_movimiento_id;

    -- Actualizar stock_ubicaciones
    -- NOTA: Usamos COALESCE(lote, '') para manejar NULL correctamente
    -- PostgreSQL trata cada NULL como valor distinto en UNIQUE constraints
    IF p_cantidad > 0 THEN
        -- Entrada: agregar a ubicación
        INSERT INTO stock_ubicaciones (
            organizacion_id, ubicacion_id, producto_id, cantidad,
            lote, fecha_vencimiento
        ) VALUES (
            p_organizacion_id, v_ubicacion_id, p_producto_id, p_cantidad,
            COALESCE(p_lote, ''), p_fecha_vencimiento
        )
        ON CONFLICT (ubicacion_id, producto_id, (COALESCE(lote, '')))
        DO UPDATE SET
            cantidad = stock_ubicaciones.cantidad + EXCLUDED.cantidad,
            actualizado_en = NOW();
    ELSE
        -- Salida: restar de ubicación
        UPDATE stock_ubicaciones
        SET cantidad = cantidad + p_cantidad,  -- p_cantidad ya es negativo
            actualizado_en = NOW()
        WHERE ubicacion_id = v_ubicacion_id
          AND producto_id = p_producto_id
          AND COALESCE(lote, '') = COALESCE(p_lote, '');

        -- Limpiar registros con cantidad <= 0
        DELETE FROM stock_ubicaciones
        WHERE ubicacion_id = v_ubicacion_id
          AND producto_id = p_producto_id
          AND COALESCE(lote, '') = COALESCE(p_lote, '')
          AND cantidad <= 0;
    END IF;

    -- Sincronizar stock de variante si aplica (el trigger solo sincroniza productos)
    IF p_variante_id IS NOT NULL THEN
        UPDATE variantes_producto
        SET stock_actual = v_stock_despues,
            actualizado_en = NOW()
        WHERE id = p_variante_id;
    END IF;

    -- El trigger trg_sincronizar_stock actualizará productos.stock_actual

    RETURN v_movimiento_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION registrar_movimiento_con_ubicacion IS 'Registra movimiento de inventario con ubicación y sincroniza stock atómicamente';

-- ============================================================================
-- TRIGGER: Crear ubicación default al crear sucursal
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_crear_ubicacion_default_sucursal()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo si la sucursal está activa
    IF NEW.activo = true THEN
        PERFORM crear_ubicacion_default_sucursal(NEW.id, NEW.organizacion_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_crear_ubicacion_default ON sucursales;
CREATE TRIGGER trg_crear_ubicacion_default
    AFTER INSERT ON sucursales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_crear_ubicacion_default_sucursal();

-- ============================================================================
-- FIX: Índice UNIQUE para manejar NULL en lote correctamente
-- Problema: ON CONFLICT no funciona cuando lote=NULL porque PostgreSQL
-- trata cada NULL como valor distinto en constraints UNIQUE
-- Solución: Índice UNIQUE con COALESCE(lote, '')
-- ============================================================================

-- Eliminar constraint existente si existe
ALTER TABLE stock_ubicaciones
DROP CONSTRAINT IF EXISTS stock_ubicaciones_ubicacion_id_producto_id_lote_key;

-- Crear índice UNIQUE que trate NULL como string vacío
DROP INDEX IF EXISTS idx_stock_ubicaciones_unique_coalesce;
CREATE UNIQUE INDEX idx_stock_ubicaciones_unique_coalesce
ON stock_ubicaciones (ubicacion_id, producto_id, COALESCE(lote, ''));

-- ============================================================================
-- FIN: CONSOLIDACIÓN DE STOCK
-- ============================================================================

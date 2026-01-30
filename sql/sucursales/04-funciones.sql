-- ====================================================================
-- MODULO SUCURSALES: FUNCIONES
-- ====================================================================
-- Funciones de utilidad para gestión de sucursales.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCION: generar_codigo_sucursal
-- ====================================================================
-- Genera código único para sucursal: SUC-001, SUC-002, etc.
-- ====================================================================
CREATE OR REPLACE FUNCTION generar_codigo_sucursal(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_contador INTEGER;
    v_codigo VARCHAR(20);
BEGIN
    -- Contar sucursales existentes
    SELECT COUNT(*) + 1 INTO v_contador
    FROM sucursales
    WHERE organizacion_id = p_organizacion_id;

    -- Generar código
    v_codigo := 'SUC-' || LPAD(v_contador::TEXT, 3, '0');

    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_codigo_sucursal IS 'Genera código único para nueva sucursal (SUC-001, SUC-002, etc.)';

-- ====================================================================
-- FUNCION: generar_codigo_transferencia
-- ====================================================================
-- Genera código único para transferencia: TRF-20251217-001
-- ====================================================================
CREATE OR REPLACE FUNCTION generar_codigo_transferencia(p_organizacion_id INTEGER)
RETURNS VARCHAR(30) AS $$
DECLARE
    v_contador INTEGER;
    v_fecha VARCHAR(8);
    v_codigo VARCHAR(30);
BEGIN
    -- Fecha actual en formato YYYYMMDD
    v_fecha := TO_CHAR(NOW(), 'YYYYMMDD');

    -- Contar transferencias del día
    SELECT COUNT(*) + 1 INTO v_contador
    FROM transferencias_stock
    WHERE organizacion_id = p_organizacion_id
    AND DATE(creado_en) = CURRENT_DATE;

    -- Generar código
    v_codigo := 'TRF-' || v_fecha || '-' || LPAD(v_contador::TEXT, 3, '0');

    RETURN v_codigo;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_codigo_transferencia IS 'Genera código único para transferencia (TRF-YYYYMMDD-NNN)';

-- ====================================================================
-- FUNCION: obtener_sucursal_matriz
-- ====================================================================
-- Retorna el ID de la sucursal matriz de una organización.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_sucursal_matriz(p_organizacion_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_sucursal_id INTEGER;
BEGIN
    SELECT id INTO v_sucursal_id
    FROM sucursales
    WHERE organizacion_id = p_organizacion_id
    AND es_matriz = TRUE
    LIMIT 1;

    RETURN v_sucursal_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_sucursal_matriz IS 'Retorna ID de la sucursal matriz de una organización';

-- ====================================================================
-- FUNCION: obtener_sucursales_usuario
-- ====================================================================
-- Retorna los IDs de sucursales asignadas a un usuario.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_sucursales_usuario(p_usuario_id INTEGER)
RETURNS INTEGER[] AS $$
DECLARE
    v_sucursales INTEGER[];
BEGIN
    SELECT ARRAY_AGG(sucursal_id) INTO v_sucursales
    FROM usuarios_sucursales
    WHERE usuario_id = p_usuario_id
    AND activo = TRUE;

    RETURN COALESCE(v_sucursales, ARRAY[]::INTEGER[]);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_sucursales_usuario IS 'Retorna array de IDs de sucursales asignadas a un usuario';

-- ====================================================================
-- FUNCION: obtener_ubicacion_usuario (Enero 2026)
-- ====================================================================
-- Obtiene la ubicación para un usuario según sus permisos asignados.
-- Flujo de resolución:
-- 1. Buscar ubicación default del usuario en la sucursal
-- 2. Si no tiene default, buscar cualquier ubicación permitida
-- 3. Fallback: ubicación default de sucursal (comportamiento legacy)
-- ====================================================================
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

-- ====================================================================
-- TRIGGER: Asignar ubicación default al asignar usuario a sucursal
-- ====================================================================
-- Auto-asigna la ubicación default de la sucursal al usuario cuando
-- se le asigna a una nueva sucursal.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_asignar_ubicacion_default_usuario()
RETURNS TRIGGER AS $$
DECLARE
    v_ubicacion_id INTEGER;
    v_organizacion_id INTEGER;
BEGIN
    -- Solo si se activa la asignación
    IF NEW.activo = true THEN
        -- Obtener organizacion_id de la sucursal
        SELECT organizacion_id INTO v_organizacion_id
        FROM sucursales
        WHERE id = NEW.sucursal_id;

        -- Obtener ubicación default de la sucursal
        SELECT id INTO v_ubicacion_id
        FROM ubicaciones_almacen
        WHERE sucursal_id = NEW.sucursal_id
          AND es_default = true
          AND activo = true;

        IF v_ubicacion_id IS NOT NULL THEN
            INSERT INTO usuarios_ubicaciones (
                organizacion_id, usuario_id, ubicacion_id, es_default, activo
            )
            SELECT v_organizacion_id, NEW.usuario_id, v_ubicacion_id, true, true
            WHERE NOT EXISTS (
                SELECT 1 FROM usuarios_ubicaciones
                WHERE usuario_id = NEW.usuario_id AND ubicacion_id = v_ubicacion_id
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_asignar_ubicacion_usuario ON usuarios_sucursales;
CREATE TRIGGER trg_asignar_ubicacion_usuario
    AFTER INSERT OR UPDATE ON usuarios_sucursales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_asignar_ubicacion_default_usuario();

COMMENT ON FUNCTION trigger_asignar_ubicacion_default_usuario IS 'Auto-asigna ubicación default de sucursal al usuario cuando se le asigna a la sucursal';

-- ====================================================================
-- NOTA (Enero 2026): Funciones legacy de stock_sucursales ELIMINADAS
-- ====================================================================
-- Las siguientes funciones fueron eliminadas porque usaban stock_sucursales:
-- - obtener_stock_sucursal()
-- - obtener_stock_total_producto()
-- - validar_stock_transferencia()
--
-- La nueva arquitectura usa:
-- - stock_ubicaciones como única fuente de verdad
-- - v_stock_consolidado para consultas de stock
-- - registrar_movimiento_con_ubicacion() para todas las operaciones
-- Ver: sql/inventario/33-consolidacion-stock.sql
-- ====================================================================

-- ====================================================================
-- FUNCION: procesar_envio_transferencia
-- ====================================================================
-- Procesa el envío de una transferencia: resta stock de origen.
-- Usa registrar_movimiento_con_ubicacion para sincronizar stock_ubicaciones.
-- Ene 2026: Soporta ubicación específica por item (WMS)
-- ====================================================================
CREATE OR REPLACE FUNCTION procesar_envio_transferencia(p_transferencia_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_transferencia RECORD;
    v_ubicacion_id INTEGER;
BEGIN
    -- Obtener datos de la transferencia
    SELECT * INTO v_transferencia
    FROM transferencias_stock
    WHERE id = p_transferencia_id;

    -- Procesar cada item
    FOR v_item IN
        SELECT
            producto_id,
            cantidad_enviada,
            ubicacion_origen_id,
            lote
        FROM transferencias_stock_items
        WHERE transferencia_id = p_transferencia_id
    LOOP
        -- Usar ubicación específica del item o default de sucursal
        IF v_item.ubicacion_origen_id IS NOT NULL THEN
            v_ubicacion_id := v_item.ubicacion_origen_id;
        ELSE
            v_ubicacion_id := crear_ubicacion_default_sucursal(
                v_transferencia.sucursal_origen_id,
                v_transferencia.organizacion_id
            );
        END IF;

        -- Registrar movimiento de salida con ubicación
        PERFORM registrar_movimiento_con_ubicacion(
            v_transferencia.organizacion_id,
            v_item.producto_id,
            'transferencia_salida',
            -v_item.cantidad_enviada,  -- Negativo = salida
            v_transferencia.sucursal_origen_id,
            v_ubicacion_id,
            v_item.lote,  -- lote del item
            NULL,  -- fecha_vencimiento
            v_transferencia.codigo,  -- referencia
            'Transferencia a sucursal destino',
            v_transferencia.usuario_envia_id,
            NULL,  -- costo_unitario
            NULL,  -- proveedor_id
            NULL,  -- venta_pos_id
            NULL   -- cita_id
        );
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION procesar_envio_transferencia IS 'Procesa envío de transferencia: resta stock de sucursal origen via stock_ubicaciones. Soporta ubicación específica por item.';

-- ====================================================================
-- FUNCION: procesar_recepcion_transferencia
-- ====================================================================
-- Procesa la recepción de una transferencia: suma stock a destino.
-- Usa registrar_movimiento_con_ubicacion para sincronizar stock_ubicaciones.
-- Ene 2026: Soporta ubicación específica por item (WMS)
-- ====================================================================
CREATE OR REPLACE FUNCTION procesar_recepcion_transferencia(p_transferencia_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_transferencia RECORD;
    v_ubicacion_id INTEGER;
    v_cantidad INTEGER;
BEGIN
    -- Obtener datos de la transferencia
    SELECT * INTO v_transferencia
    FROM transferencias_stock
    WHERE id = p_transferencia_id;

    -- Procesar cada item
    FOR v_item IN
        SELECT
            producto_id,
            cantidad_enviada,
            cantidad_recibida,
            ubicacion_destino_id,
            lote
        FROM transferencias_stock_items
        WHERE transferencia_id = p_transferencia_id
    LOOP
        -- Usar ubicación específica del item o default de sucursal
        IF v_item.ubicacion_destino_id IS NOT NULL THEN
            v_ubicacion_id := v_item.ubicacion_destino_id;
        ELSE
            v_ubicacion_id := crear_ubicacion_default_sucursal(
                v_transferencia.sucursal_destino_id,
                v_transferencia.organizacion_id
            );
        END IF;

        -- Usar cantidad_recibida si existe (permite merma)
        v_cantidad := COALESCE(v_item.cantidad_recibida, v_item.cantidad_enviada);

        -- Registrar movimiento de entrada con ubicación
        PERFORM registrar_movimiento_con_ubicacion(
            v_transferencia.organizacion_id,
            v_item.producto_id,
            'transferencia_entrada',
            v_cantidad,  -- Positivo = entrada
            v_transferencia.sucursal_destino_id,
            v_ubicacion_id,
            v_item.lote,  -- lote del item
            NULL,  -- fecha_vencimiento
            v_transferencia.codigo,  -- referencia
            'Recepción de transferencia',
            v_transferencia.usuario_recibe_id,
            NULL,  -- costo_unitario
            NULL,  -- proveedor_id
            NULL,  -- venta_pos_id
            NULL   -- cita_id
        );
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION procesar_recepcion_transferencia IS 'Procesa recepción de transferencia: suma stock a sucursal destino via stock_ubicaciones. Soporta ubicación específica por item.';

-- ====================================================================
-- FIN: FUNCIONES DE SUCURSALES
-- ====================================================================

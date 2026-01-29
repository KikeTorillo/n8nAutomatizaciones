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
-- FUNCION: obtener_stock_sucursal
-- ====================================================================
-- Retorna el stock de un producto en una sucursal específica.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_stock_sucursal(
    p_producto_id INTEGER,
    p_sucursal_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_cantidad INTEGER;
BEGIN
    SELECT cantidad INTO v_cantidad
    FROM stock_sucursales
    WHERE producto_id = p_producto_id
    AND sucursal_id = p_sucursal_id;

    RETURN COALESCE(v_cantidad, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_stock_sucursal IS 'Retorna stock de un producto en una sucursal. 0 si no existe registro.';

-- ====================================================================
-- FUNCION: obtener_stock_total_producto
-- ====================================================================
-- Retorna el stock total de un producto sumando todas las sucursales.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_stock_total_producto(p_producto_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COALESCE(SUM(cantidad), 0) INTO v_total
    FROM stock_sucursales
    WHERE producto_id = p_producto_id;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_stock_total_producto IS 'Retorna stock total de un producto sumando todas las sucursales';

-- ====================================================================
-- FUNCION: validar_stock_transferencia
-- ====================================================================
-- Valida que haya stock suficiente para una transferencia.
-- Retorna TRUE si hay stock suficiente, FALSE si no.
-- ====================================================================
CREATE OR REPLACE FUNCTION validar_stock_transferencia(
    p_producto_id INTEGER,
    p_sucursal_origen_id INTEGER,
    p_cantidad INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock_actual INTEGER;
BEGIN
    v_stock_actual := obtener_stock_sucursal(p_producto_id, p_sucursal_origen_id);
    RETURN v_stock_actual >= p_cantidad;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION validar_stock_transferencia IS 'Valida stock suficiente para transferencia. TRUE = OK, FALSE = insuficiente.';

-- ====================================================================
-- FUNCION: procesar_envio_transferencia
-- ====================================================================
-- Procesa el envío de una transferencia: resta stock de origen.
-- Usa registrar_movimiento_con_ubicacion para sincronizar stock_ubicaciones.
-- ====================================================================
CREATE OR REPLACE FUNCTION procesar_envio_transferencia(p_transferencia_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_transferencia RECORD;
    v_ubicacion_origen INTEGER;
BEGIN
    -- Obtener datos de la transferencia
    SELECT * INTO v_transferencia
    FROM transferencias_stock
    WHERE id = p_transferencia_id;

    -- Obtener ubicación default de origen
    v_ubicacion_origen := crear_ubicacion_default_sucursal(
        v_transferencia.sucursal_origen_id,
        v_transferencia.organizacion_id
    );

    -- Procesar cada item
    FOR v_item IN
        SELECT producto_id, cantidad_enviada
        FROM transferencias_stock_items
        WHERE transferencia_id = p_transferencia_id
    LOOP
        -- Registrar movimiento de salida con ubicación
        PERFORM registrar_movimiento_con_ubicacion(
            v_transferencia.organizacion_id,
            v_item.producto_id,
            'transferencia_salida',
            -v_item.cantidad_enviada,  -- Negativo = salida
            v_transferencia.sucursal_origen_id,
            v_ubicacion_origen,
            NULL,  -- lote
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

COMMENT ON FUNCTION procesar_envio_transferencia IS 'Procesa envío de transferencia: resta stock de sucursal origen via stock_ubicaciones';

-- ====================================================================
-- FUNCION: procesar_recepcion_transferencia
-- ====================================================================
-- Procesa la recepción de una transferencia: suma stock a destino.
-- Usa registrar_movimiento_con_ubicacion para sincronizar stock_ubicaciones.
-- ====================================================================
CREATE OR REPLACE FUNCTION procesar_recepcion_transferencia(p_transferencia_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_transferencia RECORD;
    v_ubicacion_destino INTEGER;
    v_cantidad INTEGER;
BEGIN
    -- Obtener datos de la transferencia
    SELECT * INTO v_transferencia
    FROM transferencias_stock
    WHERE id = p_transferencia_id;

    -- Obtener ubicación default de destino
    v_ubicacion_destino := crear_ubicacion_default_sucursal(
        v_transferencia.sucursal_destino_id,
        v_transferencia.organizacion_id
    );

    -- Procesar cada item
    FOR v_item IN
        SELECT producto_id, cantidad_enviada, cantidad_recibida
        FROM transferencias_stock_items
        WHERE transferencia_id = p_transferencia_id
    LOOP
        -- Usar cantidad_recibida si existe (permite merma)
        v_cantidad := COALESCE(v_item.cantidad_recibida, v_item.cantidad_enviada);

        -- Registrar movimiento de entrada con ubicación
        PERFORM registrar_movimiento_con_ubicacion(
            v_transferencia.organizacion_id,
            v_item.producto_id,
            'transferencia_entrada',
            v_cantidad,  -- Positivo = entrada
            v_transferencia.sucursal_destino_id,
            v_ubicacion_destino,
            NULL,  -- lote
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

COMMENT ON FUNCTION procesar_recepcion_transferencia IS 'Procesa recepción de transferencia: suma stock a sucursal destino via stock_ubicaciones';

-- ====================================================================
-- FIN: FUNCIONES DE SUCURSALES
-- ====================================================================

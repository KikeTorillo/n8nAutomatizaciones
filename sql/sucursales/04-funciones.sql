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
-- ====================================================================
CREATE OR REPLACE FUNCTION procesar_envio_transferencia(p_transferencia_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_sucursal_origen_id INTEGER;
BEGIN
    -- Obtener sucursal origen
    SELECT sucursal_origen_id INTO v_sucursal_origen_id
    FROM transferencias_stock
    WHERE id = p_transferencia_id;

    -- Restar stock de origen para cada item
    FOR v_item IN
        SELECT producto_id, cantidad_enviada
        FROM transferencias_stock_items
        WHERE transferencia_id = p_transferencia_id
    LOOP
        -- Validar stock
        IF NOT validar_stock_transferencia(v_item.producto_id, v_sucursal_origen_id, v_item.cantidad_enviada) THEN
            RAISE EXCEPTION 'Stock insuficiente para producto ID %', v_item.producto_id;
        END IF;

        -- Restar stock
        UPDATE stock_sucursales
        SET cantidad = cantidad - v_item.cantidad_enviada,
            actualizado_en = NOW()
        WHERE producto_id = v_item.producto_id
        AND sucursal_id = v_sucursal_origen_id;
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION procesar_envio_transferencia IS 'Procesa envío de transferencia: resta stock de sucursal origen';

-- ====================================================================
-- FUNCION: procesar_recepcion_transferencia
-- ====================================================================
-- Procesa la recepción de una transferencia: suma stock a destino.
-- ====================================================================
CREATE OR REPLACE FUNCTION procesar_recepcion_transferencia(p_transferencia_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_item RECORD;
    v_sucursal_destino_id INTEGER;
BEGIN
    -- Obtener sucursal destino
    SELECT sucursal_destino_id INTO v_sucursal_destino_id
    FROM transferencias_stock
    WHERE id = p_transferencia_id;

    -- Sumar stock a destino para cada item
    FOR v_item IN
        SELECT producto_id, COALESCE(cantidad_recibida, cantidad_enviada) as cantidad
        FROM transferencias_stock_items
        WHERE transferencia_id = p_transferencia_id
    LOOP
        -- Insertar o actualizar stock
        INSERT INTO stock_sucursales (producto_id, sucursal_id, cantidad)
        VALUES (v_item.producto_id, v_sucursal_destino_id, v_item.cantidad)
        ON CONFLICT (producto_id, sucursal_id)
        DO UPDATE SET
            cantidad = stock_sucursales.cantidad + EXCLUDED.cantidad,
            actualizado_en = NOW();
    END LOOP;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION procesar_recepcion_transferencia IS 'Procesa recepción de transferencia: suma stock a sucursal destino';

-- ====================================================================
-- FIN: FUNCIONES DE SUCURSALES
-- ====================================================================

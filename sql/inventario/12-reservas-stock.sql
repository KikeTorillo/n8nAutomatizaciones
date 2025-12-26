-- ============================================================================
-- MÓDULO: INVENTARIO - RESERVAS DE STOCK
-- Descripción: Sistema para evitar sobreventa en ventas concurrentes
-- Versión: 1.0
-- Fecha: 26 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: reservas_stock
-- Descripción: Reservas temporales de stock para evitar sobreventa
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservas_stock (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,

    -- PRODUCTO
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    -- ORIGEN DE LA RESERVA
    tipo_origen VARCHAR(30) NOT NULL CHECK (tipo_origen IN (
        'venta_pos',        -- Venta en curso en POS
        'orden_venta',      -- Orden de venta confirmada
        'cita_servicio',    -- Cita que consume productos
        'transferencia'     -- Transferencia en preparación
    )),
    origen_id INTEGER,      -- FK dinámica según tipo (venta_pos_id, cita_id, etc.)

    -- EXPIRACIÓN
    expira_en TIMESTAMPTZ NOT NULL,  -- Liberar automáticamente si no se confirma

    -- ESTADO
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN (
        'activa',       -- Reserva vigente
        'confirmada',   -- Stock descontado, reserva completada
        'expirada',     -- Tiempo agotado sin confirmar
        'cancelada'     -- Cancelada manualmente
    )),

    -- AUDITORÍA
    usuario_id INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    confirmada_en TIMESTAMPTZ,

    -- CONSTRAINTS
    CHECK (confirmada_en IS NULL OR estado IN ('confirmada'))
);

COMMENT ON TABLE reservas_stock IS 'Reservas temporales de stock para evitar sobreventa en ventas concurrentes';
COMMENT ON COLUMN reservas_stock.tipo_origen IS 'Origen de la reserva: venta_pos, orden_venta, cita_servicio, transferencia';
COMMENT ON COLUMN reservas_stock.expira_en IS 'Timestamp de expiración - la reserva se libera automáticamente después de este tiempo';
COMMENT ON COLUMN reservas_stock.estado IS 'Estado: activa (vigente), confirmada (completada), expirada (timeout), cancelada';

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice principal para búsqueda de reservas activas por producto
CREATE INDEX IF NOT EXISTS idx_reservas_stock_producto_activas
    ON reservas_stock(producto_id, sucursal_id)
    WHERE estado = 'activa';

-- Índice para job de expiración
CREATE INDEX IF NOT EXISTS idx_reservas_stock_expiracion
    ON reservas_stock(expira_en)
    WHERE estado = 'activa';

-- Índice para búsqueda por origen
CREATE INDEX IF NOT EXISTS idx_reservas_stock_origen
    ON reservas_stock(tipo_origen, origen_id);

-- Índice para organización (RLS)
CREATE INDEX IF NOT EXISTS idx_reservas_stock_org
    ON reservas_stock(organizacion_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE reservas_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas_stock FORCE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY reservas_stock_select ON reservas_stock
    FOR SELECT
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política INSERT
CREATE POLICY reservas_stock_insert ON reservas_stock
    FOR INSERT
    WITH CHECK (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política UPDATE
CREATE POLICY reservas_stock_update ON reservas_stock
    FOR UPDATE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política DELETE
CREATE POLICY reservas_stock_delete ON reservas_stock
    FOR DELETE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCIÓN: stock_disponible
-- Descripción: Calcula stock disponible (real - reservado)
-- ============================================================================
CREATE OR REPLACE FUNCTION stock_disponible(
    p_producto_id INTEGER,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_stock_actual INTEGER;
    v_reservado INTEGER;
BEGIN
    -- Obtener stock actual
    IF p_sucursal_id IS NULL THEN
        SELECT stock_actual INTO v_stock_actual
        FROM productos
        WHERE id = p_producto_id;
    ELSE
        SELECT COALESCE(cantidad, 0) INTO v_stock_actual
        FROM stock_sucursales
        WHERE producto_id = p_producto_id
        AND sucursal_id = p_sucursal_id;
    END IF;

    -- Obtener total reservado activo
    SELECT COALESCE(SUM(cantidad), 0) INTO v_reservado
    FROM reservas_stock
    WHERE producto_id = p_producto_id
    AND (p_sucursal_id IS NULL OR sucursal_id = p_sucursal_id)
    AND estado = 'activa'
    AND expira_en > NOW();

    RETURN GREATEST(COALESCE(v_stock_actual, 0) - v_reservado, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stock_disponible IS 'Calcula stock disponible = stock_actual - reservas_activas';

-- ============================================================================
-- FUNCIÓN: crear_reserva_stock
-- Descripción: Crea una reserva de stock validando disponibilidad
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_reserva_stock(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER,
    p_cantidad INTEGER,
    p_tipo_origen VARCHAR(30),
    p_origen_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL,
    p_minutos_expiracion INTEGER DEFAULT 15
)
RETURNS INTEGER AS $$
DECLARE
    v_disponible INTEGER;
    v_reserva_id INTEGER;
BEGIN
    -- Validar stock disponible
    v_disponible := stock_disponible(p_producto_id, p_sucursal_id);

    IF v_disponible < p_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente. Disponible: %, Solicitado: %', v_disponible, p_cantidad;
    END IF;

    -- Crear reserva
    INSERT INTO reservas_stock (
        organizacion_id,
        sucursal_id,
        producto_id,
        cantidad,
        tipo_origen,
        origen_id,
        expira_en,
        usuario_id
    ) VALUES (
        p_organizacion_id,
        p_sucursal_id,
        p_producto_id,
        p_cantidad,
        p_tipo_origen,
        p_origen_id,
        NOW() + (p_minutos_expiracion || ' minutes')::INTERVAL,
        p_usuario_id
    ) RETURNING id INTO v_reserva_id;

    RETURN v_reserva_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_reserva_stock IS 'Crea una reserva de stock validando disponibilidad. Retorna ID de reserva.';

-- ============================================================================
-- FUNCIÓN: confirmar_reserva_stock
-- Descripción: Confirma una reserva y descuenta el stock real
-- ============================================================================
CREATE OR REPLACE FUNCTION confirmar_reserva_stock(
    p_reserva_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_reserva RECORD;
BEGIN
    -- Obtener y bloquear reserva
    SELECT * INTO v_reserva
    FROM reservas_stock
    WHERE id = p_reserva_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva no encontrada: %', p_reserva_id;
    END IF;

    IF v_reserva.estado != 'activa' THEN
        RAISE EXCEPTION 'Reserva no está activa. Estado actual: %', v_reserva.estado;
    END IF;

    IF v_reserva.expira_en < NOW() THEN
        -- Marcar como expirada
        UPDATE reservas_stock SET estado = 'expirada' WHERE id = p_reserva_id;
        RAISE EXCEPTION 'Reserva expirada';
    END IF;

    -- Descontar stock del producto
    UPDATE productos
    SET stock_actual = stock_actual - v_reserva.cantidad,
        actualizado_en = NOW()
    WHERE id = v_reserva.producto_id;

    -- Si hay sucursal, también descontar de stock_sucursales
    IF v_reserva.sucursal_id IS NOT NULL THEN
        UPDATE stock_sucursales
        SET cantidad = cantidad - v_reserva.cantidad
        WHERE producto_id = v_reserva.producto_id
        AND sucursal_id = v_reserva.sucursal_id;
    END IF;

    -- Marcar reserva como confirmada
    UPDATE reservas_stock
    SET estado = 'confirmada',
        confirmada_en = NOW()
    WHERE id = p_reserva_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION confirmar_reserva_stock IS 'Confirma una reserva y descuenta el stock real del producto';

-- ============================================================================
-- FUNCIÓN: cancelar_reserva_stock
-- Descripción: Cancela una reserva liberando el stock
-- ============================================================================
CREATE OR REPLACE FUNCTION cancelar_reserva_stock(
    p_reserva_id INTEGER
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reservas_stock
    SET estado = 'cancelada'
    WHERE id = p_reserva_id
    AND estado = 'activa';

    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cancelar_reserva_stock IS 'Cancela una reserva activa liberando el stock';

-- ============================================================================
-- FUNCIÓN: expirar_reservas_vencidas
-- Descripción: Marca como expiradas las reservas vencidas (para pg_cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION expirar_reservas_vencidas()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE reservas_stock
    SET estado = 'expirada'
    WHERE estado = 'activa'
    AND expira_en < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expirar_reservas_vencidas IS 'Marca como expiradas las reservas vencidas. Ejecutar via pg_cron cada 5 minutos.';

-- ============================================================================
-- JOB pg_cron: Expirar reservas cada 5 minutos
-- NOTA: Requiere extensión pg_cron habilitada
-- ============================================================================
DO $block$
BEGIN
    -- Verificar si pg_cron está disponible
    IF EXISTS (
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) THEN
        -- Eliminar job existente si existe (ignorar error si no existe)
        BEGIN
            PERFORM cron.unschedule('expirar-reservas-stock');
        EXCEPTION WHEN OTHERS THEN
            -- Job no existe, continuar
            NULL;
        END;
        -- Crear nuevo job
        PERFORM cron.schedule(
            'expirar-reservas-stock',
            '*/5 * * * *',
            'SELECT expirar_reservas_vencidas()'
        );
        RAISE NOTICE 'pg_cron job "expirar-reservas-stock" programado cada 5 minutos';
    ELSE
        RAISE NOTICE 'pg_cron no está disponible. El job de expiración de reservas no fue programado.';
        RAISE NOTICE 'Para expirar reservas manualmente, ejecutar: SELECT expirar_reservas_vencidas();';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al programar pg_cron job: %. Las reservas expirarán mediante la validación en tiempo de confirmación.', SQLERRM;
END $block$;

COMMENT ON FUNCTION expirar_reservas_vencidas IS 'Marca como expiradas las reservas vencidas. Ejecutar via pg_cron cada 5 minutos o manualmente.';

-- ============================================================================
-- FIN: RESERVAS DE STOCK
-- ============================================================================

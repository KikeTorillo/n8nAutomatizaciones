-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - PAGOS SPLIT
-- Descripción: Soporte para múltiples métodos de pago en una sola venta
-- Versión: 1.0
-- Fecha: 10 Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: venta_pagos
-- Descripción: Registro de pagos individuales para cada venta (pago split)
-- ============================================================================
CREATE TABLE IF NOT EXISTS venta_pagos (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    venta_pos_id INTEGER NOT NULL REFERENCES ventas_pos(id) ON DELETE CASCADE,

    -- 💳 INFORMACIÓN DEL PAGO
    metodo_pago VARCHAR(30) NOT NULL CHECK (metodo_pago IN (
        'efectivo',
        'tarjeta_debito',
        'tarjeta_credito',
        'transferencia',
        'qr_mercadopago',
        'cuenta_cliente'    -- Fiado/Crédito
    )),
    monto DECIMAL(10, 2) NOT NULL CHECK (monto > 0),

    -- 💵 SOLO PARA EFECTIVO
    monto_recibido DECIMAL(10, 2),   -- Cuánto entregó el cliente
    cambio DECIMAL(10, 2) DEFAULT 0, -- Cambio devuelto

    -- 📝 REFERENCIA EXTERNA
    referencia VARCHAR(100),          -- # autorización, # transferencia, etc.
    pago_id INTEGER REFERENCES pagos(id), -- Integración con sistema de pagos

    -- 👤 USUARIO QUE REGISTRÓ
    usuario_id INTEGER REFERENCES usuarios(id),

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (
        (metodo_pago = 'efectivo' AND monto_recibido IS NOT NULL AND monto_recibido >= monto) OR
        (metodo_pago != 'efectivo' AND monto_recibido IS NULL)
    ),
    CHECK (cambio >= 0),
    CHECK (cambio = COALESCE(monto_recibido, 0) - monto OR cambio = 0)
);

COMMENT ON TABLE venta_pagos IS 'Pagos individuales para soporte de pago split (múltiples métodos por venta)';
COMMENT ON COLUMN venta_pagos.metodo_pago IS 'Método de pago: efectivo, tarjeta_debito, tarjeta_credito, transferencia, qr_mercadopago, cuenta_cliente';
COMMENT ON COLUMN venta_pagos.monto IS 'Monto del pago parcial';
COMMENT ON COLUMN venta_pagos.monto_recibido IS 'Solo efectivo: monto entregado por el cliente';
COMMENT ON COLUMN venta_pagos.cambio IS 'Solo efectivo: cambio devuelto (monto_recibido - monto)';
COMMENT ON COLUMN venta_pagos.referencia IS 'Referencia externa: # autorización, # transferencia, o ID crédito para cuenta_cliente';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_venta_pagos_venta_pos_id
    ON venta_pagos(venta_pos_id);

CREATE INDEX IF NOT EXISTS idx_venta_pagos_metodo_pago
    ON venta_pagos(metodo_pago);

CREATE INDEX IF NOT EXISTS idx_venta_pagos_creado_en
    ON venta_pagos(creado_en);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE venta_pagos ENABLE ROW LEVEL SECURITY;

-- Policy SELECT: Ver pagos de mi organización
CREATE POLICY venta_pagos_select_policy ON venta_pagos
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ventas_pos vp
            WHERE vp.id = venta_pagos.venta_pos_id
            AND vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- Policy INSERT: Insertar pagos en ventas de mi organización
CREATE POLICY venta_pagos_insert_policy ON venta_pagos
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ventas_pos vp
            WHERE vp.id = venta_pagos.venta_pos_id
            AND vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- Policy UPDATE: Actualizar pagos de mi organización
CREATE POLICY venta_pagos_update_policy ON venta_pagos
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM ventas_pos vp
            WHERE vp.id = venta_pagos.venta_pos_id
            AND vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- Policy DELETE: Eliminar pagos de mi organización
CREATE POLICY venta_pagos_delete_policy ON venta_pagos
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM ventas_pos vp
            WHERE vp.id = venta_pagos.venta_pos_id
            AND vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- FUNCIÓN: sincronizar_pagos_venta
-- Descripción: Sincroniza monto_pagado, monto_pendiente, estado_pago y
--              metodo_pago en ventas_pos cuando se modifica venta_pagos
-- ============================================================================
CREATE OR REPLACE FUNCTION sincronizar_pagos_venta()
RETURNS TRIGGER AS $$
DECLARE
    v_venta_pos_id INTEGER;
    v_total_pagado DECIMAL(10, 2);
    v_total_venta DECIMAL(10, 2);
    v_num_metodos INTEGER;
    v_metodo_unico VARCHAR(30);
    v_nuevo_estado_pago VARCHAR(20);
    v_nuevo_metodo_pago VARCHAR(30);
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Determinar ID de venta (funciona con INSERT, UPDATE y DELETE)
    v_venta_pos_id := COALESCE(NEW.venta_pos_id, OLD.venta_pos_id);

    -- Calcular total pagado de todos los pagos
    SELECT COALESCE(SUM(monto), 0)
    INTO v_total_pagado
    FROM venta_pagos
    WHERE venta_pos_id = v_venta_pos_id;

    -- Obtener total de la venta
    SELECT total
    INTO v_total_venta
    FROM ventas_pos
    WHERE id = v_venta_pos_id;

    -- Contar métodos de pago distintos
    SELECT COUNT(DISTINCT metodo_pago), MIN(metodo_pago)
    INTO v_num_metodos, v_metodo_unico
    FROM venta_pagos
    WHERE venta_pos_id = v_venta_pos_id;

    -- Determinar nuevo estado de pago
    IF v_total_pagado >= v_total_venta THEN
        v_nuevo_estado_pago := 'pagado';
    ELSIF v_total_pagado > 0 THEN
        v_nuevo_estado_pago := 'parcial';
    ELSE
        v_nuevo_estado_pago := 'pendiente';
    END IF;

    -- Determinar método de pago para ventas_pos
    IF v_num_metodos = 0 THEN
        v_nuevo_metodo_pago := NULL;
    ELSIF v_num_metodos = 1 THEN
        -- Solo un método: usar ese
        -- Mapear variantes de tarjeta a 'tarjeta'
        IF v_metodo_unico IN ('tarjeta_debito', 'tarjeta_credito') THEN
            v_nuevo_metodo_pago := 'tarjeta';
        ELSIF v_metodo_unico = 'qr_mercadopago' THEN
            v_nuevo_metodo_pago := 'qr';
        ELSIF v_metodo_unico = 'cuenta_cliente' THEN
            v_nuevo_metodo_pago := 'mixto'; -- Crédito se considera mixto para reportes
        ELSE
            v_nuevo_metodo_pago := v_metodo_unico;
        END IF;
    ELSE
        -- Múltiples métodos: mixto
        v_nuevo_metodo_pago := 'mixto';
    END IF;

    -- Actualizar ventas_pos
    UPDATE ventas_pos
    SET monto_pagado = v_total_pagado,
        monto_pendiente = v_total_venta - v_total_pagado,
        estado_pago = v_nuevo_estado_pago,
        metodo_pago = v_nuevo_metodo_pago,
        actualizado_en = NOW()
    WHERE id = v_venta_pos_id;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN COALESCE(NEW, OLD);
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION sincronizar_pagos_venta IS 'Sincroniza automáticamente monto_pagado, estado_pago y metodo_pago en ventas_pos';

-- ============================================================================
-- TRIGGER: Sincronizar pagos
-- ============================================================================
DROP TRIGGER IF EXISTS trigger_sincronizar_pagos_venta ON venta_pagos;

CREATE TRIGGER trigger_sincronizar_pagos_venta
    AFTER INSERT OR UPDATE OR DELETE ON venta_pagos
    FOR EACH ROW
    EXECUTE FUNCTION sincronizar_pagos_venta();

-- ============================================================================
-- FUNCIÓN: obtener_pagos_venta
-- Descripción: Obtener desglose de pagos de una venta
-- Uso: SELECT * FROM obtener_pagos_venta(123);
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_pagos_venta(p_venta_pos_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    metodo_pago VARCHAR(30),
    monto DECIMAL(10, 2),
    monto_recibido DECIMAL(10, 2),
    cambio DECIMAL(10, 2),
    referencia VARCHAR(100),
    creado_en TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        vp.id,
        vp.metodo_pago,
        vp.monto,
        vp.monto_recibido,
        vp.cambio,
        vp.referencia,
        vp.creado_en
    FROM venta_pagos vp
    WHERE vp.venta_pos_id = p_venta_pos_id
    ORDER BY vp.creado_en ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_pagos_venta IS 'Obtiene desglose de todos los pagos de una venta';

-- ============================================================================
-- FIN: PAGOS SPLIT PARA PUNTO DE VENTA
-- ============================================================================

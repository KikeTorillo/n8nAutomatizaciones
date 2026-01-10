-- ============================================================================
-- MÓDULO CLIENTES: CRÉDITO (FIADO)
-- Descripción: Sistema de crédito para clientes con tracking de movimientos
-- Versión: 1.0
-- Fecha: 10 Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: movimientos_credito_cliente
-- Descripción: Registro de todos los movimientos de crédito (cargos/abonos)
-- ============================================================================
CREATE TABLE IF NOT EXISTS movimientos_credito_cliente (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

    -- 📝 TIPO DE MOVIMIENTO
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'cargo',        -- Venta a crédito (aumenta saldo)
        'abono',        -- Pago del cliente (reduce saldo)
        'ajuste',       -- Ajuste manual (+ o -)
        'cancelacion'   -- Cancelación de venta (reduce saldo)
    )),

    -- 💰 MONTOS
    monto DECIMAL(12, 2) NOT NULL,              -- Siempre positivo
    saldo_anterior DECIMAL(12, 2) NOT NULL,     -- Saldo antes del movimiento
    saldo_nuevo DECIMAL(12, 2) NOT NULL,        -- Saldo después del movimiento

    -- 🔗 REFERENCIAS
    venta_pos_id INTEGER REFERENCES ventas_pos(id) ON DELETE SET NULL,
    venta_pago_id INTEGER REFERENCES venta_pagos(id) ON DELETE SET NULL,

    -- 📝 DESCRIPCIÓN
    descripcion TEXT,                           -- Descripción libre del movimiento

    -- 👤 USUARIO
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📅 FECHA DE VENCIMIENTO (solo para cargos)
    fecha_vencimiento DATE,                     -- Cuándo vence el crédito

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CHECK (monto > 0),
    CHECK (
        (tipo = 'cargo' AND saldo_nuevo = saldo_anterior + monto) OR
        (tipo IN ('abono', 'cancelacion') AND saldo_nuevo = saldo_anterior - monto) OR
        (tipo = 'ajuste')
    )
);

COMMENT ON TABLE movimientos_credito_cliente IS 'Historial de movimientos de crédito por cliente';
COMMENT ON COLUMN movimientos_credito_cliente.tipo IS 'Tipo: cargo (venta), abono (pago), ajuste (manual), cancelacion';
COMMENT ON COLUMN movimientos_credito_cliente.monto IS 'Monto del movimiento (siempre positivo)';
COMMENT ON COLUMN movimientos_credito_cliente.saldo_anterior IS 'Saldo del cliente antes de este movimiento';
COMMENT ON COLUMN movimientos_credito_cliente.saldo_nuevo IS 'Saldo del cliente después de este movimiento';
COMMENT ON COLUMN movimientos_credito_cliente.fecha_vencimiento IS 'Fecha de vencimiento del crédito (solo para cargos)';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_movimientos_credito_cliente_id
    ON movimientos_credito_cliente(cliente_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_credito_org_id
    ON movimientos_credito_cliente(organizacion_id);

CREATE INDEX IF NOT EXISTS idx_movimientos_credito_tipo
    ON movimientos_credito_cliente(tipo);

CREATE INDEX IF NOT EXISTS idx_movimientos_credito_venta
    ON movimientos_credito_cliente(venta_pos_id)
    WHERE venta_pos_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_credito_vencimiento
    ON movimientos_credito_cliente(fecha_vencimiento)
    WHERE tipo = 'cargo' AND fecha_vencimiento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_credito_creado
    ON movimientos_credito_cliente(creado_en);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE movimientos_credito_cliente ENABLE ROW LEVEL SECURITY;

-- Policy SELECT
CREATE POLICY movimientos_credito_select_policy ON movimientos_credito_cliente
    FOR SELECT
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- Policy INSERT
CREATE POLICY movimientos_credito_insert_policy ON movimientos_credito_cliente
    FOR INSERT
    WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- Policy UPDATE
CREATE POLICY movimientos_credito_update_policy ON movimientos_credito_cliente
    FOR UPDATE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- Policy DELETE
CREATE POLICY movimientos_credito_delete_policy ON movimientos_credito_cliente
    FOR DELETE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- FUNCIÓN: registrar_cargo_credito
-- Descripción: Registra un cargo a la cuenta del cliente (venta a crédito)
-- Uso: SELECT registrar_cargo_credito(org_id, cliente_id, monto, venta_id, usuario_id)
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_cargo_credito(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER,
    p_monto DECIMAL(12, 2),
    p_venta_pos_id INTEGER DEFAULT NULL,
    p_venta_pago_id INTEGER DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS movimientos_credito_cliente AS $$
DECLARE
    v_saldo_actual DECIMAL(12, 2);
    v_saldo_nuevo DECIMAL(12, 2);
    v_limite_credito DECIMAL(12, 2);
    v_permite_credito BOOLEAN;
    v_credito_suspendido BOOLEAN;
    v_dias_credito INTEGER;
    v_fecha_vencimiento DATE;
    v_movimiento movimientos_credito_cliente;
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener datos actuales del cliente con lock
    SELECT saldo_credito, limite_credito, permite_credito, credito_suspendido, dias_credito
    INTO v_saldo_actual, v_limite_credito, v_permite_credito, v_credito_suspendido, v_dias_credito
    FROM clientes
    WHERE id = p_cliente_id AND organizacion_id = p_organizacion_id
    FOR UPDATE;

    -- Validar que el cliente existe
    IF NOT FOUND THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'Cliente no encontrado: %', p_cliente_id;
    END IF;

    -- Validar que el cliente tiene crédito habilitado
    IF NOT v_permite_credito THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'El cliente % no tiene crédito habilitado', p_cliente_id;
    END IF;

    -- Validar que el crédito no está suspendido
    IF v_credito_suspendido THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'El crédito del cliente % está suspendido', p_cliente_id;
    END IF;

    -- Calcular nuevo saldo
    v_saldo_nuevo := v_saldo_actual + p_monto;

    -- Validar límite de crédito
    IF v_saldo_nuevo > v_limite_credito THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'El cargo de $% excede el límite de crédito. Disponible: $%, Límite: $%',
            p_monto,
            (v_limite_credito - v_saldo_actual),
            v_limite_credito;
    END IF;

    -- Calcular fecha de vencimiento
    v_fecha_vencimiento := CURRENT_DATE + v_dias_credito;

    -- Insertar movimiento
    INSERT INTO movimientos_credito_cliente (
        organizacion_id,
        cliente_id,
        tipo,
        monto,
        saldo_anterior,
        saldo_nuevo,
        venta_pos_id,
        venta_pago_id,
        descripcion,
        usuario_id,
        fecha_vencimiento
    ) VALUES (
        p_organizacion_id,
        p_cliente_id,
        'cargo',
        p_monto,
        v_saldo_actual,
        v_saldo_nuevo,
        p_venta_pos_id,
        p_venta_pago_id,
        COALESCE(p_descripcion, 'Venta a crédito'),
        p_usuario_id,
        v_fecha_vencimiento
    )
    RETURNING * INTO v_movimiento;

    -- Actualizar saldo en cliente
    UPDATE clientes
    SET saldo_credito = v_saldo_nuevo,
        actualizado_en = NOW()
    WHERE id = p_cliente_id;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN v_movimiento;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION registrar_cargo_credito IS 'Registra un cargo (venta) a la cuenta del cliente, validando límite y disponibilidad';

-- ============================================================================
-- FUNCIÓN: registrar_abono_credito
-- Descripción: Registra un abono (pago) a la cuenta del cliente
-- Uso: SELECT registrar_abono_credito(org_id, cliente_id, monto, descripcion, usuario_id)
-- ============================================================================
CREATE OR REPLACE FUNCTION registrar_abono_credito(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER,
    p_monto DECIMAL(12, 2),
    p_descripcion TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS movimientos_credito_cliente AS $$
DECLARE
    v_saldo_actual DECIMAL(12, 2);
    v_saldo_nuevo DECIMAL(12, 2);
    v_movimiento movimientos_credito_cliente;
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener saldo actual con lock
    SELECT saldo_credito
    INTO v_saldo_actual
    FROM clientes
    WHERE id = p_cliente_id AND organizacion_id = p_organizacion_id
    FOR UPDATE;

    -- Validar que el cliente existe
    IF NOT FOUND THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'Cliente no encontrado: %', p_cliente_id;
    END IF;

    -- Validar que el abono no excede el saldo
    IF p_monto > v_saldo_actual THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'El abono de $% excede el saldo pendiente de $%', p_monto, v_saldo_actual;
    END IF;

    -- Calcular nuevo saldo
    v_saldo_nuevo := v_saldo_actual - p_monto;

    -- Insertar movimiento
    INSERT INTO movimientos_credito_cliente (
        organizacion_id,
        cliente_id,
        tipo,
        monto,
        saldo_anterior,
        saldo_nuevo,
        descripcion,
        usuario_id
    ) VALUES (
        p_organizacion_id,
        p_cliente_id,
        'abono',
        p_monto,
        v_saldo_actual,
        v_saldo_nuevo,
        COALESCE(p_descripcion, 'Abono a cuenta'),
        p_usuario_id
    )
    RETURNING * INTO v_movimiento;

    -- Actualizar saldo en cliente
    UPDATE clientes
    SET saldo_credito = v_saldo_nuevo,
        actualizado_en = NOW()
    WHERE id = p_cliente_id;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN v_movimiento;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION registrar_abono_credito IS 'Registra un abono (pago) a la cuenta del cliente';

-- ============================================================================
-- FUNCIÓN: obtener_estado_credito_cliente
-- Descripción: Obtiene el estado de crédito de un cliente
-- Uso: SELECT * FROM obtener_estado_credito_cliente(org_id, cliente_id)
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_estado_credito_cliente(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER
)
RETURNS TABLE (
    cliente_id INTEGER,
    nombre VARCHAR(150),
    permite_credito BOOLEAN,
    limite_credito DECIMAL(12, 2),
    saldo_credito DECIMAL(12, 2),
    disponible DECIMAL(12, 2),
    dias_credito INTEGER,
    credito_suspendido BOOLEAN,
    credito_suspendido_motivo TEXT,
    total_cargos DECIMAL(12, 2),
    total_abonos DECIMAL(12, 2),
    movimientos_count BIGINT,
    ultimo_cargo TIMESTAMPTZ,
    ultimo_abono TIMESTAMPTZ,
    cargos_vencidos INTEGER,
    monto_vencido DECIMAL(12, 2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS cliente_id,
        c.nombre,
        c.permite_credito,
        c.limite_credito,
        c.saldo_credito,
        (c.limite_credito - c.saldo_credito) AS disponible,
        c.dias_credito,
        c.credito_suspendido,
        c.credito_suspendido_motivo,
        COALESCE(SUM(CASE WHEN m.tipo = 'cargo' THEN m.monto ELSE 0 END), 0) AS total_cargos,
        COALESCE(SUM(CASE WHEN m.tipo = 'abono' THEN m.monto ELSE 0 END), 0) AS total_abonos,
        COUNT(m.id) AS movimientos_count,
        MAX(CASE WHEN m.tipo = 'cargo' THEN m.creado_en END) AS ultimo_cargo,
        MAX(CASE WHEN m.tipo = 'abono' THEN m.creado_en END) AS ultimo_abono,
        -- Cargos vencidos (fecha_vencimiento < hoy y no abonados completamente)
        (
            SELECT COUNT(*)::INTEGER
            FROM movimientos_credito_cliente mc
            WHERE mc.cliente_id = c.id
            AND mc.tipo = 'cargo'
            AND mc.fecha_vencimiento < CURRENT_DATE
            AND mc.saldo_nuevo > 0
        ) AS cargos_vencidos,
        -- Monto vencido
        (
            SELECT COALESCE(SUM(mc.monto), 0)
            FROM movimientos_credito_cliente mc
            WHERE mc.cliente_id = c.id
            AND mc.tipo = 'cargo'
            AND mc.fecha_vencimiento < CURRENT_DATE
        ) AS monto_vencido
    FROM clientes c
    LEFT JOIN movimientos_credito_cliente m ON m.cliente_id = c.id
    WHERE c.id = p_cliente_id
    AND c.organizacion_id = p_organizacion_id
    GROUP BY c.id, c.nombre, c.permite_credito, c.limite_credito,
             c.saldo_credito, c.dias_credito, c.credito_suspendido,
             c.credito_suspendido_motivo;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_estado_credito_cliente IS 'Obtiene estado completo de crédito de un cliente con estadísticas';

-- ============================================================================
-- FUNCIÓN: listar_clientes_con_saldo
-- Descripción: Lista clientes con saldo pendiente de crédito
-- Uso: SELECT * FROM listar_clientes_con_saldo(org_id, solo_vencidos)
-- ============================================================================
CREATE OR REPLACE FUNCTION listar_clientes_con_saldo(
    p_organizacion_id INTEGER,
    p_solo_vencidos BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    cliente_id INTEGER,
    nombre VARCHAR(150),
    email VARCHAR(150),
    telefono VARCHAR(20),
    saldo_credito DECIMAL(12, 2),
    limite_credito DECIMAL(12, 2),
    dias_credito INTEGER,
    ultimo_cargo TIMESTAMPTZ,
    cargo_mas_antiguo DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id AS cliente_id,
        c.nombre,
        c.email,
        c.telefono,
        c.saldo_credito,
        c.limite_credito,
        c.dias_credito,
        (
            SELECT MAX(m.creado_en)
            FROM movimientos_credito_cliente m
            WHERE m.cliente_id = c.id AND m.tipo = 'cargo'
        ) AS ultimo_cargo,
        (
            SELECT MIN(m.fecha_vencimiento)
            FROM movimientos_credito_cliente m
            WHERE m.cliente_id = c.id AND m.tipo = 'cargo'
        ) AS cargo_mas_antiguo
    FROM clientes c
    WHERE c.organizacion_id = p_organizacion_id
    AND c.saldo_credito > 0
    AND c.eliminado_en IS NULL
    AND (
        NOT p_solo_vencidos OR
        EXISTS (
            SELECT 1 FROM movimientos_credito_cliente m
            WHERE m.cliente_id = c.id
            AND m.tipo = 'cargo'
            AND m.fecha_vencimiento < CURRENT_DATE
        )
    )
    ORDER BY c.saldo_credito DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION listar_clientes_con_saldo IS 'Lista clientes con saldo pendiente, opcionalmente solo los vencidos';

-- ============================================================================
-- FIN: SISTEMA DE CRÉDITO PARA CLIENTES
-- ============================================================================

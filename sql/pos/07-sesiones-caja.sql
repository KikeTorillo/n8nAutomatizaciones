-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - SESIONES DE CAJA
-- Descripción: Sistema de apertura/cierre de caja con movimientos de efectivo
-- Versión: 1.0
-- Fecha: 9 Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: sesiones_caja
-- Descripción: Registro de sesiones de caja por usuario/sucursal
-- ============================================================================
CREATE TABLE IF NOT EXISTS sesiones_caja (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),

    -- 📂 APERTURA
    fecha_apertura TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    monto_inicial DECIMAL(12,2) NOT NULL DEFAULT 0 CHECK (monto_inicial >= 0),
    nota_apertura TEXT,

    -- 📂 CIERRE
    fecha_cierre TIMESTAMPTZ,
    monto_final_sistema DECIMAL(12,2), -- Calculado: monto_inicial + ventas_efectivo + entradas - salidas
    monto_final_contado DECIMAL(12,2), -- Monto físico contado por usuario
    diferencia DECIMAL(12,2), -- monto_final_contado - monto_final_sistema (faltante/sobrante)
    nota_cierre TEXT,

    -- 📊 ESTADO
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'cerrada')),

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índice parcial único: solo una sesión abierta por usuario+sucursal
CREATE UNIQUE INDEX IF NOT EXISTS idx_sesiones_caja_unica_abierta
ON sesiones_caja(organizacion_id, sucursal_id, usuario_id)
WHERE estado = 'abierta';

COMMENT ON TABLE sesiones_caja IS 'Sesiones de caja con apertura/cierre formal y validación de diferencias';
COMMENT ON COLUMN sesiones_caja.monto_inicial IS 'Fondo de caja con el que se inicia la sesión';
COMMENT ON COLUMN sesiones_caja.monto_final_sistema IS 'Monto esperado calculado: inicial + ventas efectivo + entradas - salidas';
COMMENT ON COLUMN sesiones_caja.monto_final_contado IS 'Monto físico contado por el cajero al cierre';
COMMENT ON COLUMN sesiones_caja.diferencia IS 'Diferencia entre contado y sistema (+ sobrante, - faltante)';

-- ============================================================================
-- TABLA: movimientos_caja
-- Descripción: Entradas y salidas de efectivo durante sesión
-- ============================================================================
CREATE TABLE IF NOT EXISTS movimientos_caja (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    sesion_caja_id INTEGER NOT NULL REFERENCES sesiones_caja(id) ON DELETE CASCADE,

    -- 📊 MOVIMIENTO
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('entrada', 'salida')),
    monto DECIMAL(12,2) NOT NULL CHECK (monto > 0),
    motivo TEXT NOT NULL,

    -- 👤 USUARIO
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id),

    -- 📅 TIMESTAMP
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE movimientos_caja IS 'Entradas y salidas de efectivo durante una sesión de caja';
COMMENT ON COLUMN movimientos_caja.tipo IS 'entrada: dinero agregado, salida: dinero retirado';
COMMENT ON COLUMN movimientos_caja.motivo IS 'Razón del movimiento (ej: "Pago a proveedor", "Cambio de billete grande")';

-- ============================================================================
-- TABLA: desglose_billetes (opcional para cierre detallado)
-- Descripción: Desglose de denominaciones al cierre de caja
-- ============================================================================
CREATE TABLE IF NOT EXISTS desglose_billetes (
    id SERIAL PRIMARY KEY,
    sesion_caja_id INTEGER NOT NULL REFERENCES sesiones_caja(id) ON DELETE CASCADE,

    -- Billetes
    billetes_1000 INTEGER DEFAULT 0,
    billetes_500 INTEGER DEFAULT 0,
    billetes_200 INTEGER DEFAULT 0,
    billetes_100 INTEGER DEFAULT 0,
    billetes_50 INTEGER DEFAULT 0,
    billetes_20 INTEGER DEFAULT 0,

    -- Monedas
    monedas_10 INTEGER DEFAULT 0,
    monedas_5 INTEGER DEFAULT 0,
    monedas_2 INTEGER DEFAULT 0,
    monedas_1 INTEGER DEFAULT 0,
    monedas_050 INTEGER DEFAULT 0, -- 50 centavos

    -- Total calculado
    total_calculado DECIMAL(12,2) GENERATED ALWAYS AS (
        (billetes_1000 * 1000) +
        (billetes_500 * 500) +
        (billetes_200 * 200) +
        (billetes_100 * 100) +
        (billetes_50 * 50) +
        (billetes_20 * 20) +
        (monedas_10 * 10) +
        (monedas_5 * 5) +
        (monedas_2 * 2) +
        (monedas_1 * 1) +
        (monedas_050 * 0.50)
    ) STORED,

    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Solo un desglose por sesión
    UNIQUE(sesion_caja_id)
);

COMMENT ON TABLE desglose_billetes IS 'Desglose detallado de denominaciones al cierre de caja';
COMMENT ON COLUMN desglose_billetes.total_calculado IS 'Suma automática de todas las denominaciones';

-- ============================================================================
-- ÍNDICES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sesiones_caja_org ON sesiones_caja(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_sucursal ON sesiones_caja(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_usuario ON sesiones_caja(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_estado ON sesiones_caja(estado);
CREATE INDEX IF NOT EXISTS idx_sesiones_caja_fecha_apertura ON sesiones_caja(fecha_apertura);
CREATE INDEX IF NOT EXISTS idx_movimientos_caja_sesion ON movimientos_caja(sesion_caja_id);
CREATE INDEX IF NOT EXISTS idx_desglose_billetes_sesion ON desglose_billetes(sesion_caja_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE sesiones_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja ENABLE ROW LEVEL SECURITY;
ALTER TABLE desglose_billetes ENABLE ROW LEVEL SECURITY;

ALTER TABLE sesiones_caja FORCE ROW LEVEL SECURITY;
ALTER TABLE movimientos_caja FORCE ROW LEVEL SECURITY;
ALTER TABLE desglose_billetes FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: sesiones_caja
-- ============================================================================

CREATE POLICY sesiones_caja_select_policy ON sesiones_caja
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY sesiones_caja_insert_policy ON sesiones_caja
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY sesiones_caja_update_policy ON sesiones_caja
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY sesiones_caja_delete_policy ON sesiones_caja
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: movimientos_caja (via JOIN con sesiones_caja)
-- ============================================================================

CREATE POLICY movimientos_caja_select_policy ON movimientos_caja
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = movimientos_caja.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY movimientos_caja_insert_policy ON movimientos_caja
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = movimientos_caja.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY movimientos_caja_update_policy ON movimientos_caja
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = movimientos_caja.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY movimientos_caja_delete_policy ON movimientos_caja
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = movimientos_caja.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: desglose_billetes (via JOIN con sesiones_caja)
-- ============================================================================

CREATE POLICY desglose_billetes_select_policy ON desglose_billetes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = desglose_billetes.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY desglose_billetes_insert_policy ON desglose_billetes
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = desglose_billetes.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY desglose_billetes_update_policy ON desglose_billetes
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = desglose_billetes.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY desglose_billetes_delete_policy ON desglose_billetes
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM sesiones_caja
            WHERE sesiones_caja.id = desglose_billetes.sesion_caja_id
            AND sesiones_caja.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCIÓN: Calcular totales de sesión
-- Optimizada Ene 2026: Usa FK directo sesion_caja_id en lugar de rango fechas
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_totales_sesion(p_sesion_id INTEGER)
RETURNS TABLE (
    total_ventas_efectivo DECIMAL(12,2),
    total_entradas DECIMAL(12,2),
    total_salidas DECIMAL(12,2),
    monto_esperado DECIMAL(12,2)
) AS $$
DECLARE
    v_monto_inicial DECIMAL(12,2);
BEGIN
    -- Obtener monto inicial de la sesión
    SELECT monto_inicial
    INTO v_monto_inicial
    FROM sesiones_caja
    WHERE id = p_sesion_id;

    -- Total ventas en efectivo durante la sesión (usa FK directo - mucho más eficiente)
    SELECT COALESCE(SUM(
        CASE WHEN metodo_pago = 'efectivo' THEN monto_pagado ELSE 0 END
    ), 0)
    INTO total_ventas_efectivo
    FROM ventas_pos
    WHERE sesion_caja_id = p_sesion_id
    AND estado_pago IN ('pagado', 'parcial');

    -- Total entradas de efectivo
    SELECT COALESCE(SUM(monto), 0)
    INTO total_entradas
    FROM movimientos_caja
    WHERE sesion_caja_id = p_sesion_id AND tipo = 'entrada';

    -- Total salidas de efectivo
    SELECT COALESCE(SUM(monto), 0)
    INTO total_salidas
    FROM movimientos_caja
    WHERE sesion_caja_id = p_sesion_id AND tipo = 'salida';

    -- Monto esperado en caja
    monto_esperado := v_monto_inicial + total_ventas_efectivo + total_entradas - total_salidas;

    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_totales_sesion IS 'Calcula totales de sesión de caja usando FK directo sesion_caja_id';

-- ============================================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sesiones_caja_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_sesiones_caja_timestamp ON sesiones_caja;
CREATE TRIGGER trigger_update_sesiones_caja_timestamp
    BEFORE UPDATE ON sesiones_caja
    FOR EACH ROW
    EXECUTE FUNCTION update_sesiones_caja_timestamp();

-- ============================================================================
-- FK: ventas_pos.sesion_caja_id -> sesiones_caja.id
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'fk_ventas_pos_sesion_caja'
          AND table_name = 'ventas_pos'
    ) THEN
        ALTER TABLE ventas_pos
        ADD CONSTRAINT fk_ventas_pos_sesion_caja
        FOREIGN KEY (sesion_caja_id) REFERENCES sesiones_caja(id) ON DELETE SET NULL;

        RAISE NOTICE 'FK fk_ventas_pos_sesion_caja creado exitosamente';
    ELSE
        RAISE NOTICE 'FK fk_ventas_pos_sesion_caja ya existe';
    END IF;
END $$;

-- Índice para performance en consultas de sesión
CREATE INDEX IF NOT EXISTS idx_ventas_pos_sesion_caja
    ON ventas_pos(sesion_caja_id)
    WHERE sesion_caja_id IS NOT NULL;

-- ============================================================================
-- FIN: SESIONES DE CAJA
-- ============================================================================

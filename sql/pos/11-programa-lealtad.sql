-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - PROGRAMA DE LEALTAD
-- Descripción: Sistema de puntos de fidelización con niveles y canje
-- Versión: 1.0
-- Fecha: 10 Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: configuracion_lealtad
-- Descripción: Configuración del programa de lealtad por organización
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion_lealtad (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- CONFIGURACIÓN DE ACUMULACIÓN
    puntos_por_peso DECIMAL(10, 4) DEFAULT 1,     -- Puntos por cada $1 gastado
    monto_minimo_acumulacion DECIMAL(10, 2) DEFAULT 0, -- Mínimo para acumular
    redondeo_puntos VARCHAR(10) DEFAULT 'floor' CHECK (redondeo_puntos IN ('floor', 'ceil', 'round')),

    -- CONFIGURACIÓN DE CANJE
    puntos_por_peso_descuento INTEGER DEFAULT 100, -- Puntos requeridos por $1 de descuento
    minimo_puntos_canje INTEGER DEFAULT 100,       -- Mínimo de puntos para canjear
    maximo_descuento_porcentaje INTEGER DEFAULT 50, -- Max % del total que se puede pagar con puntos
    permitir_canje_parcial BOOLEAN DEFAULT true,

    -- CONFIGURACIÓN DE EXPIRACIÓN
    puntos_expiran BOOLEAN DEFAULT true,
    meses_expiracion INTEGER DEFAULT 12,          -- Meses hasta expiración (NULL = no expiran)

    -- RESTRICCIONES
    aplica_productos_con_descuento BOOLEAN DEFAULT false, -- Acumular en productos ya con descuento
    aplica_con_cupones BOOLEAN DEFAULT true,       -- Acumular si hay cupón aplicado
    categorias_excluidas_ids INTEGER[],            -- Categorías que no acumulan

    -- ESTADO
    activo BOOLEAN DEFAULT true,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id),
    CHECK (puntos_por_peso > 0),
    CHECK (puntos_por_peso_descuento > 0),
    CHECK (minimo_puntos_canje >= 0),
    CHECK (maximo_descuento_porcentaje > 0 AND maximo_descuento_porcentaje <= 100),
    CHECK (meses_expiracion IS NULL OR meses_expiracion > 0)
);

COMMENT ON TABLE configuracion_lealtad IS 'Configuración del programa de lealtad por organización';
COMMENT ON COLUMN configuracion_lealtad.puntos_por_peso IS 'Puntos que se otorgan por cada $1 gastado';
COMMENT ON COLUMN configuracion_lealtad.puntos_por_peso_descuento IS 'Cuántos puntos equivalen a $1 de descuento';
COMMENT ON COLUMN configuracion_lealtad.meses_expiracion IS 'Meses hasta que expiran los puntos (NULL = no expiran)';

-- ============================================================================
-- TABLA: niveles_lealtad
-- Descripción: Niveles de membresía con multiplicadores
-- ============================================================================
CREATE TABLE IF NOT EXISTS niveles_lealtad (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- INFORMACIÓN DEL NIVEL
    nombre VARCHAR(50) NOT NULL,                   -- Bronze, Silver, Gold, Platinum
    codigo VARCHAR(20) NOT NULL,                   -- BRONZE, SILVER, GOLD
    color VARCHAR(7),                              -- #CD7F32 (bronze), #C0C0C0 (silver), #FFD700 (gold)
    icono VARCHAR(50),                             -- Nombre del icono (medal, star, crown)

    -- REQUISITOS
    puntos_minimos INTEGER NOT NULL DEFAULT 0,     -- Puntos históricos para alcanzar nivel
    compras_minimas INTEGER,                       -- Número de compras mínimas (alternativo)

    -- BENEFICIOS
    multiplicador_puntos DECIMAL(3, 2) DEFAULT 1.0, -- 1.0 = normal, 1.5 = 50% más puntos
    descuento_adicional_porcentaje DECIMAL(5, 2) DEFAULT 0, -- Descuento extra por nivel
    envio_gratis BOOLEAN DEFAULT false,
    acceso_ventas_anticipadas BOOLEAN DEFAULT false,

    -- ORDEN
    orden INTEGER DEFAULT 0,                       -- 0 = nivel base, mayor = mejor nivel

    -- ESTADO
    activo BOOLEAN DEFAULT true,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, codigo),
    CHECK (puntos_minimos >= 0),
    CHECK (multiplicador_puntos > 0 AND multiplicador_puntos <= 5),
    CHECK (descuento_adicional_porcentaje >= 0 AND descuento_adicional_porcentaje <= 50)
);

COMMENT ON TABLE niveles_lealtad IS 'Niveles de membresía del programa de lealtad';
COMMENT ON COLUMN niveles_lealtad.multiplicador_puntos IS 'Multiplicador de puntos (1.5 = 50% más)';

-- ============================================================================
-- TABLA: puntos_cliente
-- Descripción: Saldo de puntos por cliente (vista agregada)
-- ============================================================================
CREATE TABLE IF NOT EXISTS puntos_cliente (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

    -- SALDO DE PUNTOS
    puntos_disponibles INTEGER NOT NULL DEFAULT 0,  -- Puntos que puede canjear
    puntos_acumulados_historico INTEGER NOT NULL DEFAULT 0, -- Total histórico acumulado
    puntos_canjeados_historico INTEGER NOT NULL DEFAULT 0,  -- Total histórico canjeado
    puntos_expirados_historico INTEGER NOT NULL DEFAULT 0,  -- Total que han expirado

    -- NIVEL DE MEMBRESÍA
    nivel_id INTEGER REFERENCES niveles_lealtad(id) ON DELETE SET NULL,
    nivel_calculado_en TIMESTAMPTZ,                -- Última vez que se recalculó el nivel

    -- PRÓXIMA EXPIRACIÓN
    proxima_expiracion_puntos INTEGER,             -- Cuántos puntos expiran pronto
    proxima_expiracion_fecha DATE,                 -- Cuándo expiran

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, cliente_id),
    CHECK (puntos_disponibles >= 0),
    CHECK (puntos_acumulados_historico >= 0),
    CHECK (puntos_canjeados_historico >= 0)
);

COMMENT ON TABLE puntos_cliente IS 'Saldo agregado de puntos por cliente';

-- ============================================================================
-- TABLA: transacciones_puntos
-- Descripción: Historial de todas las transacciones de puntos
-- ============================================================================
CREATE TABLE IF NOT EXISTS transacciones_puntos (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

    -- TIPO DE TRANSACCIÓN
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN (
        'acumulacion',      -- Puntos ganados por compra
        'canje',            -- Puntos usados como descuento
        'expiracion',       -- Puntos expirados
        'ajuste_manual',    -- Ajuste manual (admin)
        'bonus',            -- Puntos bonus (promoción, cumpleaños)
        'transferencia',    -- Transferencia entre clientes
        'cancelacion'       -- Reversión por cancelación de venta
    )),

    -- MONTO DE PUNTOS
    puntos INTEGER NOT NULL,                       -- Positivo = agrega, Negativo = resta
    puntos_antes INTEGER NOT NULL,                 -- Saldo antes de transacción
    puntos_despues INTEGER NOT NULL,               -- Saldo después de transacción

    -- REFERENCIA
    venta_pos_id INTEGER REFERENCES ventas_pos(id) ON DELETE SET NULL,
    monto_venta DECIMAL(10, 2),                    -- Monto de la venta (para acumulación)
    monto_descuento DECIMAL(10, 2),                -- Monto del descuento (para canje)

    -- METADATA
    descripcion VARCHAR(500),                      -- Descripción de la transacción
    referencia_externa VARCHAR(100),               -- Referencia a sistema externo

    -- EXPIRACIÓN (solo para acumulación)
    fecha_expiracion DATE,                         -- Cuándo expiran estos puntos

    -- AUDITORÍA
    creado_por INTEGER REFERENCES usuarios(id),

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    CHECK (puntos != 0)
);

COMMENT ON TABLE transacciones_puntos IS 'Historial completo de transacciones de puntos';
COMMENT ON COLUMN transacciones_puntos.puntos IS 'Positivo = suma, Negativo = resta';
COMMENT ON COLUMN transacciones_puntos.fecha_expiracion IS 'Solo aplica para tipo acumulación';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_puntos_cliente_org ON puntos_cliente(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_puntos_cliente_cliente ON puntos_cliente(cliente_id);
CREATE INDEX IF NOT EXISTS idx_puntos_cliente_nivel ON puntos_cliente(nivel_id);

CREATE INDEX IF NOT EXISTS idx_transacciones_puntos_org ON transacciones_puntos(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_puntos_cliente ON transacciones_puntos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_puntos_tipo ON transacciones_puntos(tipo);
CREATE INDEX IF NOT EXISTS idx_transacciones_puntos_venta ON transacciones_puntos(venta_pos_id) WHERE venta_pos_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_transacciones_puntos_fecha ON transacciones_puntos(creado_en);
CREATE INDEX IF NOT EXISTS idx_transacciones_puntos_expiracion ON transacciones_puntos(fecha_expiracion)
    WHERE tipo = 'acumulacion' AND fecha_expiracion IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_niveles_lealtad_org ON niveles_lealtad(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_niveles_lealtad_orden ON niveles_lealtad(organizacion_id, orden);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE configuracion_lealtad ENABLE ROW LEVEL SECURITY;
ALTER TABLE niveles_lealtad ENABLE ROW LEVEL SECURITY;
ALTER TABLE puntos_cliente ENABLE ROW LEVEL SECURITY;
ALTER TABLE transacciones_puntos ENABLE ROW LEVEL SECURITY;

-- CONFIGURACION_LEALTAD
CREATE POLICY configuracion_lealtad_select_policy ON configuracion_lealtad
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY configuracion_lealtad_insert_policy ON configuracion_lealtad
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY configuracion_lealtad_update_policy ON configuracion_lealtad
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY configuracion_lealtad_delete_policy ON configuracion_lealtad
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- NIVELES_LEALTAD
CREATE POLICY niveles_lealtad_select_policy ON niveles_lealtad
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY niveles_lealtad_insert_policy ON niveles_lealtad
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY niveles_lealtad_update_policy ON niveles_lealtad
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY niveles_lealtad_delete_policy ON niveles_lealtad
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- PUNTOS_CLIENTE
CREATE POLICY puntos_cliente_select_policy ON puntos_cliente
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY puntos_cliente_insert_policy ON puntos_cliente
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY puntos_cliente_update_policy ON puntos_cliente
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY puntos_cliente_delete_policy ON puntos_cliente
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- TRANSACCIONES_PUNTOS
CREATE POLICY transacciones_puntos_select_policy ON transacciones_puntos
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY transacciones_puntos_insert_policy ON transacciones_puntos
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY transacciones_puntos_update_policy ON transacciones_puntos
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY transacciones_puntos_delete_policy ON transacciones_puntos
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- FUNCIÓN: calcular_puntos_venta
-- Descripción: Calcula puntos a otorgar por una venta
-- ============================================================================
CREATE OR REPLACE FUNCTION calcular_puntos_venta(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER,
    p_monto_base DECIMAL(10, 2),
    p_tiene_cupon BOOLEAN DEFAULT false,
    p_items JSONB DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_config configuracion_lealtad;
    v_puntos_cliente puntos_cliente;
    v_nivel niveles_lealtad;
    v_puntos_base INTEGER;
    v_multiplicador DECIMAL(3, 2) := 1.0;
    v_puntos_finales INTEGER;
    v_monto_aplicable DECIMAL(10, 2);
BEGIN
    -- Obtener configuración
    SELECT * INTO v_config FROM configuracion_lealtad
    WHERE organizacion_id = p_organizacion_id AND activo = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('puntos', 0, 'error', 'PROGRAMA_NO_CONFIGURADO');
    END IF;

    -- Verificar si aplica con cupones
    IF p_tiene_cupon AND NOT v_config.aplica_con_cupones THEN
        RETURN jsonb_build_object('puntos', 0, 'razon', 'NO_APLICA_CON_CUPON');
    END IF;

    -- Calcular monto aplicable (excluyendo categorías si aplica)
    v_monto_aplicable := p_monto_base;
    -- TODO: Filtrar items de categorías excluidas si p_items proporcionado

    -- Verificar monto mínimo
    IF v_monto_aplicable < v_config.monto_minimo_acumulacion THEN
        RETURN jsonb_build_object('puntos', 0, 'razon', 'MONTO_INSUFICIENTE');
    END IF;

    -- Calcular puntos base
    v_puntos_base := (v_monto_aplicable * v_config.puntos_por_peso);

    -- Aplicar redondeo
    CASE v_config.redondeo_puntos
        WHEN 'floor' THEN v_puntos_base := FLOOR(v_puntos_base);
        WHEN 'ceil' THEN v_puntos_base := CEIL(v_puntos_base);
        ELSE v_puntos_base := ROUND(v_puntos_base);
    END CASE;

    -- Obtener nivel del cliente y multiplicador
    IF p_cliente_id IS NOT NULL THEN
        SELECT * INTO v_puntos_cliente
        FROM puntos_cliente
        WHERE cliente_id = p_cliente_id
        AND organizacion_id = p_organizacion_id;

        IF v_puntos_cliente.nivel_id IS NOT NULL THEN
            SELECT * INTO v_nivel FROM niveles_lealtad WHERE id = v_puntos_cliente.nivel_id;
            IF v_nivel.multiplicador_puntos IS NOT NULL THEN
                v_multiplicador := v_nivel.multiplicador_puntos;
            END IF;
        END IF;
    END IF;

    -- Calcular puntos finales
    v_puntos_finales := FLOOR(v_puntos_base * v_multiplicador);

    RETURN jsonb_build_object(
        'puntos', v_puntos_finales,
        'puntos_base', v_puntos_base,
        'multiplicador', v_multiplicador,
        'nivel', v_nivel.nombre,
        'monto_aplicable', v_monto_aplicable
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calcular_puntos_venta IS 'Calcula puntos que ganaría una venta según configuración';

-- ============================================================================
-- FUNCIÓN: acumular_puntos
-- Descripción: Registra puntos ganados por una venta
-- ============================================================================
CREATE OR REPLACE FUNCTION acumular_puntos(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER,
    p_venta_pos_id INTEGER,
    p_monto_venta DECIMAL(10, 2),
    p_puntos INTEGER,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS transacciones_puntos AS $$
DECLARE
    v_config configuracion_lealtad;
    v_puntos_actual INTEGER;
    v_transaccion transacciones_puntos;
    v_fecha_expiracion DATE;
BEGIN
    -- Obtener configuración
    SELECT * INTO v_config FROM configuracion_lealtad
    WHERE organizacion_id = p_organizacion_id;

    -- Calcular fecha de expiración
    IF v_config.puntos_expiran AND v_config.meses_expiracion IS NOT NULL THEN
        v_fecha_expiracion := CURRENT_DATE + (v_config.meses_expiracion || ' months')::INTERVAL;
    END IF;

    -- Obtener o crear registro de puntos del cliente
    INSERT INTO puntos_cliente (organizacion_id, cliente_id, puntos_disponibles, puntos_acumulados_historico)
    VALUES (p_organizacion_id, p_cliente_id, 0, 0)
    ON CONFLICT (organizacion_id, cliente_id) DO NOTHING;

    -- Obtener saldo actual
    SELECT puntos_disponibles INTO v_puntos_actual
    FROM puntos_cliente
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id
    FOR UPDATE;

    -- Registrar transacción
    INSERT INTO transacciones_puntos (
        organizacion_id, cliente_id, tipo, puntos,
        puntos_antes, puntos_despues,
        venta_pos_id, monto_venta,
        fecha_expiracion, creado_por
    ) VALUES (
        p_organizacion_id, p_cliente_id, 'acumulacion', p_puntos,
        v_puntos_actual, v_puntos_actual + p_puntos,
        p_venta_pos_id, p_monto_venta,
        v_fecha_expiracion, p_usuario_id
    )
    RETURNING * INTO v_transaccion;

    -- Actualizar saldo
    UPDATE puntos_cliente
    SET puntos_disponibles = puntos_disponibles + p_puntos,
        puntos_acumulados_historico = puntos_acumulados_historico + p_puntos,
        actualizado_en = NOW()
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id;

    -- Actualizar próxima expiración si aplica
    IF v_fecha_expiracion IS NOT NULL THEN
        UPDATE puntos_cliente
        SET proxima_expiracion_fecha = LEAST(COALESCE(proxima_expiracion_fecha, v_fecha_expiracion), v_fecha_expiracion),
            proxima_expiracion_puntos = CASE
                WHEN proxima_expiracion_fecha IS NULL OR v_fecha_expiracion < proxima_expiracion_fecha
                THEN p_puntos
                WHEN v_fecha_expiracion = proxima_expiracion_fecha
                THEN COALESCE(proxima_expiracion_puntos, 0) + p_puntos
                ELSE proxima_expiracion_puntos
            END
        WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id;
    END IF;

    RETURN v_transaccion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION acumular_puntos IS 'Registra puntos ganados por una venta';

-- ============================================================================
-- FUNCIÓN: validar_canje_puntos
-- Descripción: Valida si un canje es posible y calcula descuento
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_canje_puntos(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER,
    p_puntos_a_canjear INTEGER,
    p_total_venta DECIMAL(10, 2)
)
RETURNS JSONB AS $$
DECLARE
    v_config configuracion_lealtad;
    v_saldo_disponible INTEGER;
    v_descuento_calculado DECIMAL(10, 2);
    v_maximo_descuento DECIMAL(10, 2);
    v_puntos_maximos INTEGER;
BEGIN
    -- Obtener configuración
    SELECT * INTO v_config FROM configuracion_lealtad
    WHERE organizacion_id = p_organizacion_id AND activo = true;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valido', false, 'error', 'PROGRAMA_NO_CONFIGURADO');
    END IF;

    -- Obtener saldo del cliente
    SELECT puntos_disponibles INTO v_saldo_disponible
    FROM puntos_cliente
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id;

    IF v_saldo_disponible IS NULL OR v_saldo_disponible < p_puntos_a_canjear THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'PUNTOS_INSUFICIENTES',
            'disponibles', COALESCE(v_saldo_disponible, 0)
        );
    END IF;

    -- Verificar mínimo de canje
    IF p_puntos_a_canjear < v_config.minimo_puntos_canje THEN
        RETURN jsonb_build_object(
            'valido', false,
            'error', 'MINIMO_NO_ALCANZADO',
            'minimo', v_config.minimo_puntos_canje
        );
    END IF;

    -- Calcular descuento
    v_descuento_calculado := p_puntos_a_canjear::DECIMAL / v_config.puntos_por_peso_descuento;

    -- Aplicar máximo de descuento (% del total)
    v_maximo_descuento := p_total_venta * (v_config.maximo_descuento_porcentaje::DECIMAL / 100);

    -- Calcular puntos máximos canjeables
    v_puntos_maximos := FLOOR(v_maximo_descuento * v_config.puntos_por_peso_descuento);
    v_puntos_maximos := LEAST(v_puntos_maximos, v_saldo_disponible);

    IF v_descuento_calculado > v_maximo_descuento THEN
        v_descuento_calculado := v_maximo_descuento;
    END IF;

    RETURN jsonb_build_object(
        'valido', true,
        'puntos_a_canjear', LEAST(p_puntos_a_canjear, v_puntos_maximos),
        'descuento', v_descuento_calculado,
        'maximo_descuento', v_maximo_descuento,
        'puntos_maximos_canjeables', v_puntos_maximos,
        'saldo_restante', v_saldo_disponible - LEAST(p_puntos_a_canjear, v_puntos_maximos)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_canje_puntos IS 'Valida si un canje es posible y calcula el descuento';

-- ============================================================================
-- FUNCIÓN: canjear_puntos
-- Descripción: Ejecuta el canje de puntos en una venta
-- ============================================================================
CREATE OR REPLACE FUNCTION canjear_puntos(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER,
    p_venta_pos_id INTEGER,
    p_puntos INTEGER,
    p_descuento DECIMAL(10, 2),
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS transacciones_puntos AS $$
DECLARE
    v_puntos_actual INTEGER;
    v_transaccion transacciones_puntos;
BEGIN
    -- Obtener saldo actual con lock
    SELECT puntos_disponibles INTO v_puntos_actual
    FROM puntos_cliente
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id
    FOR UPDATE;

    IF v_puntos_actual < p_puntos THEN
        RAISE EXCEPTION 'Puntos insuficientes: disponibles %, solicitados %', v_puntos_actual, p_puntos;
    END IF;

    -- Registrar transacción
    INSERT INTO transacciones_puntos (
        organizacion_id, cliente_id, tipo, puntos,
        puntos_antes, puntos_despues,
        venta_pos_id, monto_descuento, creado_por
    ) VALUES (
        p_organizacion_id, p_cliente_id, 'canje', -p_puntos,
        v_puntos_actual, v_puntos_actual - p_puntos,
        p_venta_pos_id, p_descuento, p_usuario_id
    )
    RETURNING * INTO v_transaccion;

    -- Actualizar saldo
    UPDATE puntos_cliente
    SET puntos_disponibles = puntos_disponibles - p_puntos,
        puntos_canjeados_historico = puntos_canjeados_historico + p_puntos,
        actualizado_en = NOW()
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id;

    -- Actualizar descuento en la venta
    UPDATE ventas_pos
    SET descuento_monto = COALESCE(descuento_monto, 0) + p_descuento,
        total = subtotal - (COALESCE(descuento_monto, 0) + p_descuento) + COALESCE(impuestos, 0),
        monto_pendiente = subtotal - (COALESCE(descuento_monto, 0) + p_descuento) + COALESCE(impuestos, 0) - COALESCE(monto_pagado, 0),
        actualizado_en = NOW()
    WHERE id = p_venta_pos_id;

    RETURN v_transaccion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION canjear_puntos IS 'Ejecuta el canje de puntos aplicando descuento a la venta';

-- ============================================================================
-- FUNCIÓN: recalcular_nivel_cliente
-- Descripción: Recalcula el nivel de un cliente basado en puntos históricos
-- ============================================================================
CREATE OR REPLACE FUNCTION recalcular_nivel_cliente(
    p_organizacion_id INTEGER,
    p_cliente_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_puntos_historicos INTEGER;
    v_nivel_id INTEGER;
BEGIN
    -- Obtener puntos históricos
    SELECT puntos_acumulados_historico INTO v_puntos_historicos
    FROM puntos_cliente
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id;

    IF v_puntos_historicos IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obtener nivel correspondiente (el más alto que cumpla)
    SELECT id INTO v_nivel_id
    FROM niveles_lealtad
    WHERE organizacion_id = p_organizacion_id
    AND activo = true
    AND puntos_minimos <= v_puntos_historicos
    ORDER BY orden DESC
    LIMIT 1;

    -- Actualizar nivel del cliente
    UPDATE puntos_cliente
    SET nivel_id = v_nivel_id,
        nivel_calculado_en = NOW(),
        actualizado_en = NOW()
    WHERE organizacion_id = p_organizacion_id AND cliente_id = p_cliente_id;

    RETURN v_nivel_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION recalcular_nivel_cliente IS 'Recalcula y asigna nivel de membresía basado en puntos históricos';

-- ============================================================================
-- FUNCIÓN: expirar_puntos_vencidos
-- Descripción: Job para expirar puntos (ejecutar con pg_cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION expirar_puntos_vencidos()
RETURNS INTEGER AS $$
DECLARE
    v_cliente RECORD;
    v_puntos_expirar INTEGER;
    v_total_expirados INTEGER := 0;
BEGIN
    -- Buscar clientes con puntos por expirar
    FOR v_cliente IN
        SELECT DISTINCT t.organizacion_id, t.cliente_id, pc.puntos_disponibles
        FROM transacciones_puntos t
        JOIN puntos_cliente pc ON t.cliente_id = pc.cliente_id
            AND t.organizacion_id = pc.organizacion_id
        WHERE t.tipo = 'acumulacion'
        AND t.fecha_expiracion <= CURRENT_DATE
        AND t.fecha_expiracion > CURRENT_DATE - INTERVAL '1 day'
        AND pc.puntos_disponibles > 0
    LOOP
        -- Calcular puntos a expirar (simplificado: expira lo que corresponde al día)
        SELECT COALESCE(SUM(puntos), 0) INTO v_puntos_expirar
        FROM transacciones_puntos
        WHERE organizacion_id = v_cliente.organizacion_id
        AND cliente_id = v_cliente.cliente_id
        AND tipo = 'acumulacion'
        AND fecha_expiracion = CURRENT_DATE;

        v_puntos_expirar := LEAST(v_puntos_expirar, v_cliente.puntos_disponibles);

        IF v_puntos_expirar > 0 THEN
            -- Registrar expiración
            INSERT INTO transacciones_puntos (
                organizacion_id, cliente_id, tipo, puntos,
                puntos_antes, puntos_despues,
                descripcion
            ) VALUES (
                v_cliente.organizacion_id, v_cliente.cliente_id,
                'expiracion', -v_puntos_expirar,
                v_cliente.puntos_disponibles,
                v_cliente.puntos_disponibles - v_puntos_expirar,
                'Expiración automática de puntos'
            );

            -- Actualizar saldo
            UPDATE puntos_cliente
            SET puntos_disponibles = puntos_disponibles - v_puntos_expirar,
                puntos_expirados_historico = puntos_expirados_historico + v_puntos_expirar,
                actualizado_en = NOW()
            WHERE organizacion_id = v_cliente.organizacion_id
            AND cliente_id = v_cliente.cliente_id;

            v_total_expirados := v_total_expirados + v_puntos_expirar;
        END IF;
    END LOOP;

    RETURN v_total_expirados;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expirar_puntos_vencidos IS 'Job de expiración de puntos - ejecutar diariamente con pg_cron';

-- ============================================================================
-- FUNCIÓN: crear_niveles_default
-- Descripción: Crea niveles de lealtad por defecto para una organización
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_niveles_lealtad_default(p_organizacion_id INTEGER)
RETURNS void AS $$
BEGIN
    -- Verificar si ya existen niveles
    IF EXISTS (SELECT 1 FROM niveles_lealtad WHERE organizacion_id = p_organizacion_id) THEN
        RETURN;
    END IF;

    -- Crear niveles por defecto
    INSERT INTO niveles_lealtad (organizacion_id, nombre, codigo, color, icono, puntos_minimos, multiplicador_puntos, orden) VALUES
    (p_organizacion_id, 'Bronce', 'BRONZE', '#CD7F32', 'medal', 0, 1.0, 0),
    (p_organizacion_id, 'Plata', 'SILVER', '#C0C0C0', 'award', 500, 1.25, 1),
    (p_organizacion_id, 'Oro', 'GOLD', '#FFD700', 'star', 2000, 1.5, 2),
    (p_organizacion_id, 'Platino', 'PLATINUM', '#E5E4E2', 'crown', 5000, 2.0, 3);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_niveles_lealtad_default IS 'Crea niveles de lealtad por defecto (Bronce, Plata, Oro, Platino)';

-- ============================================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp_lealtad()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Aplicar triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_configuracion_lealtad_timestamp') THEN
        CREATE TRIGGER trg_configuracion_lealtad_timestamp
            BEFORE UPDATE ON configuracion_lealtad
            FOR EACH ROW
            EXECUTE FUNCTION trigger_actualizar_timestamp_lealtad();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_niveles_lealtad_timestamp') THEN
        CREATE TRIGGER trg_niveles_lealtad_timestamp
            BEFORE UPDATE ON niveles_lealtad
            FOR EACH ROW
            EXECUTE FUNCTION trigger_actualizar_timestamp_lealtad();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_puntos_cliente_timestamp') THEN
        CREATE TRIGGER trg_puntos_cliente_timestamp
            BEFORE UPDATE ON puntos_cliente
            FOR EACH ROW
            EXECUTE FUNCTION trigger_actualizar_timestamp_lealtad();
    END IF;
END $$;

-- ============================================================================
-- PROGRAMAR JOB DE EXPIRACIÓN (pg_cron)
-- Ejecutar a las 00:30 AM todos los días
-- ============================================================================
-- NOTA: Descomentar después de verificar que pg_cron está instalado
-- SELECT cron.schedule('expirar-puntos-lealtad', '30 0 * * *', 'SELECT expirar_puntos_vencidos()');

-- ============================================================================
-- FIN DEL ARCHIVO
-- ============================================================================

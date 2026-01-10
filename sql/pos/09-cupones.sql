-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - CUPONES DE DESCUENTO
-- Descripción: Sistema de cupones con validación y tracking de uso
-- Versión: 1.0
-- Fecha: 10 Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: cupones
-- Descripción: Catálogo de cupones de descuento
-- ============================================================================
CREATE TABLE IF NOT EXISTS cupones (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📝 INFORMACIÓN DEL CUPÓN
    codigo VARCHAR(50) NOT NULL,                  -- Código único (ej: DESCUENTO10, NAVIDAD2026)
    nombre VARCHAR(200) NOT NULL,                 -- Nombre descriptivo
    descripcion TEXT,                             -- Descripción detallada

    -- 💰 TIPO DE DESCUENTO
    tipo_descuento VARCHAR(20) NOT NULL CHECK (tipo_descuento IN (
        'porcentaje',     -- Descuento en %
        'monto_fijo'      -- Descuento en monto fijo
    )),
    valor DECIMAL(10, 2) NOT NULL CHECK (valor > 0),

    -- 📊 RESTRICCIONES DE MONTO
    monto_minimo DECIMAL(10, 2) DEFAULT 0,        -- Monto mínimo de compra para aplicar
    monto_maximo_descuento DECIMAL(10, 2),        -- Tope máximo del descuento (para %)

    -- 📅 VIGENCIA
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,                               -- NULL = sin fecha de expiración

    -- 🔢 LÍMITES DE USO
    usos_maximos INTEGER,                         -- NULL = sin límite
    usos_por_cliente INTEGER DEFAULT 1,           -- Máx usos por cliente
    usos_actuales INTEGER DEFAULT 0,              -- Contador de usos

    -- 🎯 RESTRICCIONES DE APLICACIÓN
    solo_primera_compra BOOLEAN DEFAULT FALSE,    -- Solo para primera compra del cliente
    categorias_ids INTEGER[],                     -- NULL = todas las categorías
    productos_ids INTEGER[],                      -- NULL = todos los productos

    -- ⚙️ ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    UNIQUE(organizacion_id, codigo),
    CHECK (valor > 0),
    CHECK (monto_minimo >= 0),
    CHECK (
        (tipo_descuento = 'porcentaje' AND valor <= 100) OR
        (tipo_descuento = 'monto_fijo')
    ),
    CHECK (
        fecha_fin IS NULL OR fecha_fin >= fecha_inicio
    ),
    CHECK (
        usos_maximos IS NULL OR usos_maximos > 0
    ),
    CHECK (usos_por_cliente > 0)
);

COMMENT ON TABLE cupones IS 'Catálogo de cupones de descuento con validaciones y límites';
COMMENT ON COLUMN cupones.codigo IS 'Código único del cupón (alfanumérico, case-insensitive)';
COMMENT ON COLUMN cupones.tipo_descuento IS 'Tipo: porcentaje (%) o monto_fijo ($)';
COMMENT ON COLUMN cupones.valor IS 'Valor del descuento (% o monto según tipo)';
COMMENT ON COLUMN cupones.monto_minimo IS 'Monto mínimo de compra para aplicar el cupón';
COMMENT ON COLUMN cupones.monto_maximo_descuento IS 'Tope máximo del descuento (solo para %)';
COMMENT ON COLUMN cupones.usos_maximos IS 'Límite de usos totales (NULL = ilimitado)';
COMMENT ON COLUMN cupones.usos_por_cliente IS 'Máximo de usos por cliente';
COMMENT ON COLUMN cupones.solo_primera_compra IS 'Si aplica solo en primera compra del cliente';
COMMENT ON COLUMN cupones.categorias_ids IS 'Array de IDs de categorías donde aplica (NULL = todas)';
COMMENT ON COLUMN cupones.productos_ids IS 'Array de IDs de productos donde aplica (NULL = todos)';

-- ============================================================================
-- TABLA: uso_cupones
-- Descripción: Registro de uso de cupones en ventas
-- ============================================================================
CREATE TABLE IF NOT EXISTS uso_cupones (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    cupon_id INTEGER NOT NULL REFERENCES cupones(id) ON DELETE CASCADE,
    venta_pos_id INTEGER NOT NULL REFERENCES ventas_pos(id) ON DELETE CASCADE,

    -- 👤 CLIENTE
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,

    -- 💰 DESCUENTO APLICADO
    subtotal_antes DECIMAL(10, 2) NOT NULL,       -- Subtotal antes del cupón
    descuento_aplicado DECIMAL(10, 2) NOT NULL,   -- Descuento real aplicado

    -- 📅 TIMESTAMPS
    aplicado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    UNIQUE(cupon_id, venta_pos_id),  -- Un cupón solo se usa una vez por venta
    CHECK (descuento_aplicado > 0)
);

COMMENT ON TABLE uso_cupones IS 'Registro de uso de cupones en ventas';
COMMENT ON COLUMN uso_cupones.subtotal_antes IS 'Subtotal de la venta antes de aplicar el cupón';
COMMENT ON COLUMN uso_cupones.descuento_aplicado IS 'Monto real del descuento aplicado';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_cupones_org_id ON cupones(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(organizacion_id, UPPER(codigo));
CREATE INDEX IF NOT EXISTS idx_cupones_activo ON cupones(activo) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_cupones_vigencia ON cupones(fecha_inicio, fecha_fin);

CREATE INDEX IF NOT EXISTS idx_uso_cupones_cupon ON uso_cupones(cupon_id);
CREATE INDEX IF NOT EXISTS idx_uso_cupones_venta ON uso_cupones(venta_pos_id);
CREATE INDEX IF NOT EXISTS idx_uso_cupones_cliente ON uso_cupones(cliente_id) WHERE cliente_id IS NOT NULL;

-- ============================================================================
-- RLS POLICIES - CUPONES
-- ============================================================================
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

CREATE POLICY cupones_select_policy ON cupones
    FOR SELECT
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY cupones_insert_policy ON cupones
    FOR INSERT
    WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY cupones_update_policy ON cupones
    FOR UPDATE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY cupones_delete_policy ON cupones
    FOR DELETE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- RLS POLICIES - USO_CUPONES
-- ============================================================================
ALTER TABLE uso_cupones ENABLE ROW LEVEL SECURITY;

CREATE POLICY uso_cupones_select_policy ON uso_cupones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM cupones c
            WHERE c.id = uso_cupones.cupon_id
            AND c.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY uso_cupones_insert_policy ON uso_cupones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM cupones c
            WHERE c.id = uso_cupones.cupon_id
            AND c.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY uso_cupones_delete_policy ON uso_cupones
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM cupones c
            WHERE c.id = uso_cupones.cupon_id
            AND c.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- FUNCIÓN: validar_cupon
-- Descripción: Valida si un cupón puede ser aplicado
-- Retorna: JSON con estado de validación y detalles
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_cupon(
    p_organizacion_id INTEGER,
    p_codigo VARCHAR(50),
    p_subtotal DECIMAL(10, 2),
    p_cliente_id INTEGER DEFAULT NULL,
    p_productos_ids INTEGER[] DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
    v_cupon cupones;
    v_usos_cliente INTEGER;
    v_tiene_compras BOOLEAN;
    v_descuento DECIMAL(10, 2);
    v_resultado JSON;
BEGIN
    -- Buscar cupón (case-insensitive)
    SELECT * INTO v_cupon
    FROM cupones
    WHERE organizacion_id = p_organizacion_id
    AND UPPER(codigo) = UPPER(p_codigo);

    -- Cupón no existe
    IF NOT FOUND THEN
        RETURN json_build_object(
            'valido', FALSE,
            'error', 'CUPON_NO_EXISTE',
            'mensaje', 'El cupón no existe'
        );
    END IF;

    -- Cupón inactivo
    IF NOT v_cupon.activo THEN
        RETURN json_build_object(
            'valido', FALSE,
            'error', 'CUPON_INACTIVO',
            'mensaje', 'El cupón está inactivo'
        );
    END IF;

    -- Cupón no ha iniciado
    IF v_cupon.fecha_inicio > CURRENT_DATE THEN
        RETURN json_build_object(
            'valido', FALSE,
            'error', 'CUPON_NO_VIGENTE',
            'mensaje', 'El cupón aún no está vigente'
        );
    END IF;

    -- Cupón expirado
    IF v_cupon.fecha_fin IS NOT NULL AND v_cupon.fecha_fin < CURRENT_DATE THEN
        RETURN json_build_object(
            'valido', FALSE,
            'error', 'CUPON_EXPIRADO',
            'mensaje', 'El cupón ha expirado'
        );
    END IF;

    -- Límite de usos totales alcanzado
    IF v_cupon.usos_maximos IS NOT NULL AND v_cupon.usos_actuales >= v_cupon.usos_maximos THEN
        RETURN json_build_object(
            'valido', FALSE,
            'error', 'CUPON_AGOTADO',
            'mensaje', 'El cupón ha alcanzado su límite de usos'
        );
    END IF;

    -- Monto mínimo no alcanzado
    IF p_subtotal < v_cupon.monto_minimo THEN
        RETURN json_build_object(
            'valido', FALSE,
            'error', 'MONTO_INSUFICIENTE',
            'mensaje', format('El monto mínimo de compra es $%s', v_cupon.monto_minimo),
            'monto_minimo', v_cupon.monto_minimo
        );
    END IF;

    -- Validaciones que requieren cliente
    IF p_cliente_id IS NOT NULL THEN
        -- Verificar usos por cliente
        SELECT COUNT(*) INTO v_usos_cliente
        FROM uso_cupones
        WHERE cupon_id = v_cupon.id
        AND cliente_id = p_cliente_id;

        IF v_usos_cliente >= v_cupon.usos_por_cliente THEN
            RETURN json_build_object(
                'valido', FALSE,
                'error', 'LIMITE_CLIENTE',
                'mensaje', 'Ya has usado este cupón el máximo de veces permitido'
            );
        END IF;

        -- Validar primera compra
        IF v_cupon.solo_primera_compra THEN
            SELECT EXISTS (
                SELECT 1 FROM ventas_pos
                WHERE cliente_id = p_cliente_id
                AND organizacion_id = p_organizacion_id
                AND estado = 'completada'
            ) INTO v_tiene_compras;

            IF v_tiene_compras THEN
                RETURN json_build_object(
                    'valido', FALSE,
                    'error', 'NO_PRIMERA_COMPRA',
                    'mensaje', 'Este cupón solo aplica para primera compra'
                );
            END IF;
        END IF;
    END IF;

    -- TODO: Validar restricciones de categorías y productos
    -- (requiere join con items del carrito, se implementa en backend)

    -- Calcular descuento
    IF v_cupon.tipo_descuento = 'porcentaje' THEN
        v_descuento := p_subtotal * (v_cupon.valor / 100);
        -- Aplicar tope máximo si existe
        IF v_cupon.monto_maximo_descuento IS NOT NULL AND v_descuento > v_cupon.monto_maximo_descuento THEN
            v_descuento := v_cupon.monto_maximo_descuento;
        END IF;
    ELSE
        v_descuento := v_cupon.valor;
        -- El descuento no puede ser mayor al subtotal
        IF v_descuento > p_subtotal THEN
            v_descuento := p_subtotal;
        END IF;
    END IF;

    -- Cupón válido
    RETURN json_build_object(
        'valido', TRUE,
        'cupon', json_build_object(
            'id', v_cupon.id,
            'codigo', v_cupon.codigo,
            'nombre', v_cupon.nombre,
            'tipo_descuento', v_cupon.tipo_descuento,
            'valor', v_cupon.valor,
            'monto_minimo', v_cupon.monto_minimo,
            'monto_maximo_descuento', v_cupon.monto_maximo_descuento
        ),
        'descuento_calculado', v_descuento,
        'subtotal_con_descuento', p_subtotal - v_descuento
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_cupon IS 'Valida un cupón y calcula el descuento aplicable';

-- ============================================================================
-- FUNCIÓN: aplicar_cupon
-- Descripción: Aplica un cupón a una venta y registra el uso
-- ============================================================================
CREATE OR REPLACE FUNCTION aplicar_cupon(
    p_cupon_id INTEGER,
    p_venta_pos_id INTEGER,
    p_cliente_id INTEGER DEFAULT NULL,
    p_subtotal_antes DECIMAL(10, 2) DEFAULT NULL
)
RETURNS uso_cupones AS $$
DECLARE
    v_cupon cupones;
    v_venta ventas_pos;
    v_descuento DECIMAL(10, 2);
    v_uso uso_cupones;
    v_subtotal DECIMAL(10, 2);
BEGIN
    -- ⚠️ CRÍTICO: Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener cupón con lock
    SELECT * INTO v_cupon
    FROM cupones
    WHERE id = p_cupon_id
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'Cupón no encontrado: %', p_cupon_id;
    END IF;

    -- Obtener venta
    SELECT * INTO v_venta
    FROM ventas_pos
    WHERE id = p_venta_pos_id;

    IF NOT FOUND THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'Venta no encontrada: %', p_venta_pos_id;
    END IF;

    -- Usar subtotal proporcionado o el de la venta
    v_subtotal := COALESCE(p_subtotal_antes, v_venta.subtotal);

    -- Calcular descuento
    IF v_cupon.tipo_descuento = 'porcentaje' THEN
        v_descuento := v_subtotal * (v_cupon.valor / 100);
        IF v_cupon.monto_maximo_descuento IS NOT NULL AND v_descuento > v_cupon.monto_maximo_descuento THEN
            v_descuento := v_cupon.monto_maximo_descuento;
        END IF;
    ELSE
        v_descuento := LEAST(v_cupon.valor, v_subtotal);
    END IF;

    -- Registrar uso del cupón
    INSERT INTO uso_cupones (
        cupon_id,
        venta_pos_id,
        cliente_id,
        subtotal_antes,
        descuento_aplicado
    ) VALUES (
        p_cupon_id,
        p_venta_pos_id,
        p_cliente_id,
        v_subtotal,
        v_descuento
    )
    RETURNING * INTO v_uso;

    -- Incrementar contador de usos del cupón
    UPDATE cupones
    SET usos_actuales = usos_actuales + 1,
        actualizado_en = NOW()
    WHERE id = p_cupon_id;

    -- Actualizar descuento en la venta
    UPDATE ventas_pos
    SET descuento_monto = COALESCE(descuento_monto, 0) + v_descuento,
        total = subtotal - (COALESCE(descuento_monto, 0) + v_descuento) + COALESCE(impuestos, 0),
        monto_pendiente = subtotal - (COALESCE(descuento_monto, 0) + v_descuento) + COALESCE(impuestos, 0) - COALESCE(monto_pagado, 0),
        actualizado_en = NOW()
    WHERE id = p_venta_pos_id;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN v_uso;
EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION aplicar_cupon IS 'Aplica un cupón a una venta y registra el uso';

-- ============================================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp_cupon()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_timestamp_cupon ON cupones;

CREATE TRIGGER trigger_actualizar_timestamp_cupon
    BEFORE UPDATE ON cupones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_cupon();

-- ============================================================================
-- FIN: CUPONES DE DESCUENTO
-- ============================================================================

-- ============================================================================
-- MODULO: PUNTO DE VENTA (POS) - PROMOCIONES AUTOMATICAS
-- Descripcion: Motor de promociones con reglas JSON flexibles
-- Version: 1.0
-- Fecha: 10 Enero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: promociones
-- Descripcion: Catalogo de promociones con reglas configurables
-- ============================================================================
CREATE TABLE IF NOT EXISTS promociones (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- INFORMACION DE LA PROMOCION
    codigo VARCHAR(50) NOT NULL,                  -- Codigo unico (ej: 2X1_BEBIDAS, HAPPY_HOUR)
    nombre VARCHAR(200) NOT NULL,                 -- Nombre descriptivo
    descripcion TEXT,                             -- Descripcion detallada

    -- TIPO DE PROMOCION
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'cantidad',          -- 2x1, 3x2, compra X lleva Y
        'porcentaje',        -- % de descuento sobre productos/carrito
        'monto_fijo',        -- $ de descuento fijo
        'precio_especial',   -- Precio fijo por producto
        'regalo'             -- Producto gratis con compra
    )),

    -- REGLAS JSON (motor flexible)
    -- Ejemplos por tipo:
    -- cantidad:       {"cantidad_requerida": 2, "cantidad_gratis": 1, "productos_ids": [1,2,3]}
    -- cantidad 3x2:   {"cantidad_requerida": 3, "paga": 2, "productos_ids": [1,2,3]}
    -- porcentaje:     {"descuento_porcentaje": 15, "categorias_ids": [5,6]}
    -- monto_fijo:     {"descuento_monto": 50, "monto_minimo": 300}
    -- precio_especial:{"producto_id": 10, "precio_especial": 99.99}
    -- regalo:         {"producto_trigger_id": 10, "cantidad_trigger": 1, "regalo_producto_id": 15, "regalo_cantidad": 1}
    reglas JSONB NOT NULL DEFAULT '{}',

    -- DESCUENTO A APLICAR (para tipos porcentaje/monto_fijo sin reglas especificas)
    valor_descuento DECIMAL(10, 2),

    -- VIGENCIA TEMPORAL
    fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
    fecha_fin DATE,                               -- NULL = sin fecha de expiracion
    hora_inicio TIME,                             -- NULL = todo el dia
    hora_fin TIME,
    dias_semana INTEGER[],                        -- {1,2,3,4,5} = L-V, NULL = todos (0=Dom, 6=Sab)

    -- PRIORIDAD Y EXCLUSIVIDAD
    prioridad INTEGER DEFAULT 0,                  -- Mayor = se evalua primero
    exclusiva BOOLEAN DEFAULT FALSE,              -- Si aplica, no se combinan otras promociones
    acumulable_cupones BOOLEAN DEFAULT TRUE,      -- Se puede combinar con cupones

    -- LIMITES DE USO
    usos_maximos INTEGER,                         -- NULL = sin limite
    usos_actuales INTEGER DEFAULT 0,              -- Contador de usos
    usos_por_cliente INTEGER,                     -- NULL = sin limite por cliente

    -- RESTRICCIONES DE APLICACION
    monto_minimo DECIMAL(10, 2) DEFAULT 0,        -- Monto minimo de compra
    monto_maximo_descuento DECIMAL(10, 2),        -- Tope maximo del descuento
    solo_primera_compra BOOLEAN DEFAULT FALSE,    -- Solo para primera compra del cliente
    sucursales_ids INTEGER[],                     -- NULL = todas las sucursales

    -- ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, codigo),
    CHECK (monto_minimo >= 0),
    CHECK (
        fecha_fin IS NULL OR fecha_fin >= fecha_inicio
    ),
    CHECK (
        usos_maximos IS NULL OR usos_maximos > 0
    ),
    CHECK (
        hora_inicio IS NULL OR hora_fin IS NULL OR hora_fin > hora_inicio
    )
);

COMMENT ON TABLE promociones IS 'Catalogo de promociones con motor de reglas JSON flexible';
COMMENT ON COLUMN promociones.codigo IS 'Codigo unico de la promocion (alfanumerico)';
COMMENT ON COLUMN promociones.tipo IS 'Tipo: cantidad (2x1), porcentaje, monto_fijo, precio_especial, regalo';
COMMENT ON COLUMN promociones.reglas IS 'Reglas JSON para evaluar y aplicar la promocion';
COMMENT ON COLUMN promociones.prioridad IS 'Prioridad de evaluacion (mayor = primero)';
COMMENT ON COLUMN promociones.exclusiva IS 'Si aplica esta promocion, no se combinan otras';
COMMENT ON COLUMN promociones.dias_semana IS 'Dias de la semana (0=Dom, 1=Lun, ..., 6=Sab)';

-- ============================================================================
-- TABLA: uso_promociones
-- Descripcion: Registro de uso de promociones en ventas
-- ============================================================================
CREATE TABLE IF NOT EXISTS uso_promociones (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    promocion_id INTEGER NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    venta_pos_id INTEGER NOT NULL REFERENCES ventas_pos(id) ON DELETE CASCADE,

    -- CLIENTE
    cliente_id INTEGER REFERENCES clientes(id) ON DELETE SET NULL,

    -- DETALLE DEL DESCUENTO
    productos_aplicados JSONB,                    -- [{producto_id, cantidad, descuento, detalle}]
    descuento_total DECIMAL(10, 2) NOT NULL,      -- Monto total del descuento

    -- TIMESTAMPS
    aplicado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(promocion_id, venta_pos_id),
    CHECK (descuento_total >= 0)
);

COMMENT ON TABLE uso_promociones IS 'Registro de uso de promociones en ventas';
COMMENT ON COLUMN uso_promociones.productos_aplicados IS 'Detalle de productos afectados por la promocion';
COMMENT ON COLUMN uso_promociones.descuento_total IS 'Monto total del descuento aplicado';

-- ============================================================================
-- INDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_promociones_org_id ON promociones(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_promociones_codigo ON promociones(organizacion_id, UPPER(codigo));
CREATE INDEX IF NOT EXISTS idx_promociones_activo ON promociones(activo) WHERE activo = TRUE;
CREATE INDEX IF NOT EXISTS idx_promociones_vigencia ON promociones(fecha_inicio, fecha_fin);
CREATE INDEX IF NOT EXISTS idx_promociones_tipo ON promociones(tipo);
CREATE INDEX IF NOT EXISTS idx_promociones_prioridad ON promociones(prioridad DESC);
CREATE INDEX IF NOT EXISTS idx_promociones_reglas ON promociones USING GIN(reglas);

CREATE INDEX IF NOT EXISTS idx_uso_promociones_promocion ON uso_promociones(promocion_id);
CREATE INDEX IF NOT EXISTS idx_uso_promociones_venta ON uso_promociones(venta_pos_id);
CREATE INDEX IF NOT EXISTS idx_uso_promociones_cliente ON uso_promociones(cliente_id) WHERE cliente_id IS NOT NULL;

-- ============================================================================
-- RLS POLICIES - PROMOCIONES
-- ============================================================================
ALTER TABLE promociones ENABLE ROW LEVEL SECURITY;

CREATE POLICY promociones_select_policy ON promociones
    FOR SELECT
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY promociones_insert_policy ON promociones
    FOR INSERT
    WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY promociones_update_policy ON promociones
    FOR UPDATE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY promociones_delete_policy ON promociones
    FOR DELETE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- RLS POLICIES - USO_PROMOCIONES
-- ============================================================================
ALTER TABLE uso_promociones ENABLE ROW LEVEL SECURITY;

CREATE POLICY uso_promociones_select_policy ON uso_promociones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM promociones p
            WHERE p.id = uso_promociones.promocion_id
            AND p.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY uso_promociones_insert_policy ON uso_promociones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM promociones p
            WHERE p.id = uso_promociones.promocion_id
            AND p.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY uso_promociones_delete_policy ON uso_promociones
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM promociones p
            WHERE p.id = uso_promociones.promocion_id
            AND p.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        )
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- FUNCION: evaluar_promocion_cantidad
-- Descripcion: Evalua promociones tipo cantidad (2x1, 3x2)
-- Uso interno del motor de promociones
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluar_promocion_cantidad(
    p_reglas JSONB,
    p_items JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_productos_ids INTEGER[];
    v_cantidad_requerida INTEGER;
    v_cantidad_gratis INTEGER;
    v_paga INTEGER;
    v_aplica BOOLEAN := FALSE;
    v_descuento DECIMAL(10, 2) := 0;
    v_detalle JSONB := '[]'::JSONB;
    v_item JSONB;
    v_cantidad_item INTEGER;
    v_precio_item DECIMAL(10, 2);
    v_sets_completos INTEGER;
    v_descuento_item DECIMAL(10, 2);
BEGIN
    -- Extraer parametros de reglas
    v_productos_ids := ARRAY(SELECT jsonb_array_elements_text(p_reglas->'productos_ids')::INTEGER);
    v_cantidad_requerida := COALESCE((p_reglas->>'cantidad_requerida')::INTEGER, 2);
    v_cantidad_gratis := COALESCE((p_reglas->>'cantidad_gratis')::INTEGER, 1);
    v_paga := (p_reglas->>'paga')::INTEGER;  -- Para formato 3x2

    -- Si es formato "paga" (ej: 3x2), calcular cantidad gratis
    IF v_paga IS NOT NULL THEN
        v_cantidad_gratis := v_cantidad_requerida - v_paga;
    END IF;

    -- Evaluar cada item del carrito
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Verificar si el producto aplica
        IF v_productos_ids IS NULL OR
           (v_item->>'producto_id')::INTEGER = ANY(v_productos_ids) OR
           (v_item->>'categoria_id')::INTEGER = ANY(
               ARRAY(SELECT jsonb_array_elements_text(p_reglas->'categorias_ids')::INTEGER)
           )
        THEN
            v_cantidad_item := (v_item->>'cantidad')::INTEGER;
            v_precio_item := (v_item->>'precio_unitario')::DECIMAL;

            -- Calcular cuantos sets completos hay
            v_sets_completos := v_cantidad_item / v_cantidad_requerida;

            IF v_sets_completos > 0 THEN
                v_aplica := TRUE;
                v_descuento_item := v_sets_completos * v_cantidad_gratis * v_precio_item;
                v_descuento := v_descuento + v_descuento_item;

                v_detalle := v_detalle || jsonb_build_object(
                    'producto_id', (v_item->>'producto_id')::INTEGER,
                    'sets_aplicados', v_sets_completos,
                    'cantidad_gratis', v_sets_completos * v_cantidad_gratis,
                    'descuento', v_descuento_item
                );
            END IF;
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'aplica', v_aplica,
        'descuento', v_descuento,
        'detalle', v_detalle
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCION: evaluar_promocion_porcentaje
-- Descripcion: Evalua promociones tipo porcentaje
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluar_promocion_porcentaje(
    p_reglas JSONB,
    p_items JSONB,
    p_subtotal DECIMAL(10, 2),
    p_monto_minimo DECIMAL(10, 2),
    p_monto_maximo_descuento DECIMAL(10, 2),
    p_valor_descuento DECIMAL(10, 2)
)
RETURNS JSONB AS $$
DECLARE
    v_descuento_porcentaje DECIMAL(5, 2);
    v_productos_ids INTEGER[];
    v_categorias_ids INTEGER[];
    v_aplica BOOLEAN := FALSE;
    v_descuento DECIMAL(10, 2) := 0;
    v_detalle JSONB := '[]'::JSONB;
    v_item JSONB;
    v_subtotal_aplicable DECIMAL(10, 2) := 0;
    v_descuento_item DECIMAL(10, 2);
BEGIN
    -- Extraer porcentaje de descuento
    v_descuento_porcentaje := COALESCE(
        (p_reglas->>'descuento_porcentaje')::DECIMAL,
        p_valor_descuento
    );

    -- Verificar monto minimo
    IF p_subtotal < p_monto_minimo THEN
        RETURN jsonb_build_object('aplica', FALSE, 'descuento', 0, 'detalle', '[]'::JSONB);
    END IF;

    -- Extraer restricciones
    v_productos_ids := ARRAY(SELECT jsonb_array_elements_text(p_reglas->'productos_ids')::INTEGER);
    v_categorias_ids := ARRAY(SELECT jsonb_array_elements_text(p_reglas->'categorias_ids')::INTEGER);

    -- Si no hay restricciones, aplicar a todo el carrito
    -- Nota: arrays vacios {} no son NULL, usar cardinality para verificar
    IF (v_productos_ids IS NULL OR cardinality(v_productos_ids) = 0)
       AND (v_categorias_ids IS NULL OR cardinality(v_categorias_ids) = 0) THEN
        v_aplica := TRUE;
        v_descuento := p_subtotal * (v_descuento_porcentaje / 100);
        v_detalle := jsonb_build_object(
            'tipo', 'carrito_completo',
            'porcentaje', v_descuento_porcentaje,
            'subtotal_aplicable', p_subtotal
        );
    ELSE
        -- Evaluar cada item
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
        LOOP
            IF (v_productos_ids IS NOT NULL AND (v_item->>'producto_id')::INTEGER = ANY(v_productos_ids)) OR
               (v_categorias_ids IS NOT NULL AND (v_item->>'categoria_id')::INTEGER = ANY(v_categorias_ids))
            THEN
                v_aplica := TRUE;
                v_descuento_item := ((v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::DECIMAL) * (v_descuento_porcentaje / 100);
                v_descuento := v_descuento + v_descuento_item;
                v_subtotal_aplicable := v_subtotal_aplicable + ((v_item->>'cantidad')::INTEGER * (v_item->>'precio_unitario')::DECIMAL);

                v_detalle := v_detalle || jsonb_build_object(
                    'producto_id', (v_item->>'producto_id')::INTEGER,
                    'descuento', v_descuento_item
                );
            END IF;
        END LOOP;
    END IF;

    -- Aplicar tope maximo
    IF p_monto_maximo_descuento IS NOT NULL AND v_descuento > p_monto_maximo_descuento THEN
        v_descuento := p_monto_maximo_descuento;
    END IF;

    RETURN jsonb_build_object(
        'aplica', v_aplica,
        'descuento', v_descuento,
        'detalle', v_detalle
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCION: evaluar_promocion_monto_fijo
-- Descripcion: Evalua promociones tipo monto fijo
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluar_promocion_monto_fijo(
    p_reglas JSONB,
    p_items JSONB,
    p_subtotal DECIMAL(10, 2),
    p_monto_minimo DECIMAL(10, 2),
    p_valor_descuento DECIMAL(10, 2)
)
RETURNS JSONB AS $$
DECLARE
    v_descuento_monto DECIMAL(10, 2);
BEGIN
    -- Verificar monto minimo
    IF p_subtotal < p_monto_minimo THEN
        RETURN jsonb_build_object('aplica', FALSE, 'descuento', 0, 'detalle', '[]'::JSONB);
    END IF;

    -- Extraer monto de descuento
    v_descuento_monto := COALESCE(
        (p_reglas->>'descuento_monto')::DECIMAL,
        p_valor_descuento
    );

    -- El descuento no puede ser mayor al subtotal
    IF v_descuento_monto > p_subtotal THEN
        v_descuento_monto := p_subtotal;
    END IF;

    RETURN jsonb_build_object(
        'aplica', TRUE,
        'descuento', v_descuento_monto,
        'detalle', jsonb_build_object(
            'tipo', 'monto_fijo',
            'monto', v_descuento_monto
        )
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================================================
-- FUNCION: evaluar_promociones_carrito
-- Descripcion: Motor principal - evalua todas las promociones aplicables
-- Retorna: JSON array con promociones que aplican y sus descuentos
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluar_promociones_carrito(
    p_organizacion_id INTEGER,
    p_items JSONB,                                -- [{producto_id, categoria_id, cantidad, precio_unitario}]
    p_subtotal DECIMAL(10, 2),
    p_cliente_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_promociones_aplicables JSONB := '[]'::JSONB;
    v_promo RECORD;
    v_resultado JSONB;
    v_aplica BOOLEAN;
    v_descuento DECIMAL(10, 2);
    v_detalle JSONB;
    v_usos_cliente INTEGER;
    v_tiene_compras BOOLEAN;
    v_dia_actual INTEGER;
    v_hora_actual TIME;
    v_promo_exclusiva_aplicada BOOLEAN := FALSE;
BEGIN
    -- Obtener dia y hora actual
    v_dia_actual := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER;
    v_hora_actual := CURRENT_TIME;

    -- Iterar promociones activas ordenadas por prioridad
    FOR v_promo IN
        SELECT * FROM promociones
        WHERE organizacion_id = p_organizacion_id
        AND activo = TRUE
        AND fecha_inicio <= CURRENT_DATE
        AND (fecha_fin IS NULL OR fecha_fin >= CURRENT_DATE)
        AND (hora_inicio IS NULL OR v_hora_actual >= hora_inicio)
        AND (hora_fin IS NULL OR v_hora_actual <= hora_fin)
        AND (dias_semana IS NULL OR v_dia_actual = ANY(dias_semana))
        AND (usos_maximos IS NULL OR usos_actuales < usos_maximos)
        AND (sucursales_ids IS NULL OR p_sucursal_id = ANY(sucursales_ids))
        ORDER BY prioridad DESC, id ASC
    LOOP
        -- Si ya aplico una promocion exclusiva, salir
        IF v_promo_exclusiva_aplicada THEN
            EXIT;
        END IF;

        -- Verificar limite por cliente
        IF p_cliente_id IS NOT NULL AND v_promo.usos_por_cliente IS NOT NULL THEN
            SELECT COUNT(*) INTO v_usos_cliente
            FROM uso_promociones
            WHERE promocion_id = v_promo.id
            AND cliente_id = p_cliente_id;

            IF v_usos_cliente >= v_promo.usos_por_cliente THEN
                CONTINUE;
            END IF;
        END IF;

        -- Verificar primera compra
        IF v_promo.solo_primera_compra AND p_cliente_id IS NOT NULL THEN
            SELECT EXISTS (
                SELECT 1 FROM ventas_pos
                WHERE cliente_id = p_cliente_id
                AND organizacion_id = p_organizacion_id
                AND estado = 'completada'
            ) INTO v_tiene_compras;

            IF v_tiene_compras THEN
                CONTINUE;
            END IF;
        END IF;

        -- Evaluar segun tipo de promocion
        CASE v_promo.tipo
            WHEN 'cantidad' THEN
                v_resultado := evaluar_promocion_cantidad(v_promo.reglas, p_items);

            WHEN 'porcentaje' THEN
                v_resultado := evaluar_promocion_porcentaje(
                    v_promo.reglas,
                    p_items,
                    p_subtotal,
                    v_promo.monto_minimo,
                    v_promo.monto_maximo_descuento,
                    v_promo.valor_descuento
                );

            WHEN 'monto_fijo' THEN
                v_resultado := evaluar_promocion_monto_fijo(
                    v_promo.reglas,
                    p_items,
                    p_subtotal,
                    v_promo.monto_minimo,
                    v_promo.valor_descuento
                );

            WHEN 'precio_especial' THEN
                -- TODO: Implementar precio especial
                v_resultado := jsonb_build_object('aplica', FALSE, 'descuento', 0, 'detalle', '[]'::JSONB);

            WHEN 'regalo' THEN
                -- TODO: Implementar regalo
                v_resultado := jsonb_build_object('aplica', FALSE, 'descuento', 0, 'detalle', '[]'::JSONB);

            ELSE
                v_resultado := jsonb_build_object('aplica', FALSE, 'descuento', 0, 'detalle', '[]'::JSONB);
        END CASE;

        -- Si aplica, agregar a resultados
        v_aplica := (v_resultado->>'aplica')::BOOLEAN;
        v_descuento := (v_resultado->>'descuento')::DECIMAL;

        IF v_aplica AND v_descuento > 0 THEN
            v_promociones_aplicables := v_promociones_aplicables || jsonb_build_object(
                'promocion_id', v_promo.id,
                'codigo', v_promo.codigo,
                'nombre', v_promo.nombre,
                'tipo', v_promo.tipo,
                'descuento', v_descuento,
                'detalle', v_resultado->'detalle',
                'exclusiva', v_promo.exclusiva,
                'acumulable_cupones', v_promo.acumulable_cupones
            );

            -- Marcar si es exclusiva
            IF v_promo.exclusiva THEN
                v_promo_exclusiva_aplicada := TRUE;
            END IF;
        END IF;
    END LOOP;

    RETURN v_promociones_aplicables;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION evaluar_promociones_carrito IS 'Motor de promociones: evalua todas las promociones aplicables a un carrito';

-- ============================================================================
-- FUNCION: aplicar_promocion
-- Descripcion: Aplica una promocion a una venta y registra el uso
-- ============================================================================
CREATE OR REPLACE FUNCTION aplicar_promocion(
    p_promocion_id INTEGER,
    p_venta_pos_id INTEGER,
    p_cliente_id INTEGER DEFAULT NULL,
    p_descuento_total DECIMAL(10, 2) DEFAULT 0,
    p_productos_aplicados JSONB DEFAULT NULL
)
RETURNS uso_promociones AS $$
DECLARE
    v_promo promociones;
    v_uso uso_promociones;
BEGIN
    -- Bypass RLS para operaciones de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Obtener promocion con lock
    SELECT * INTO v_promo
    FROM promociones
    WHERE id = p_promocion_id
    FOR UPDATE;

    IF NOT FOUND THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE EXCEPTION 'Promocion no encontrada: %', p_promocion_id;
    END IF;

    -- Registrar uso de la promocion
    INSERT INTO uso_promociones (
        promocion_id,
        venta_pos_id,
        cliente_id,
        productos_aplicados,
        descuento_total
    ) VALUES (
        p_promocion_id,
        p_venta_pos_id,
        p_cliente_id,
        p_productos_aplicados,
        p_descuento_total
    )
    RETURNING * INTO v_uso;

    -- Incrementar contador de usos
    UPDATE promociones
    SET usos_actuales = usos_actuales + 1,
        actualizado_en = NOW()
    WHERE id = p_promocion_id;

    -- Actualizar descuento en la venta
    UPDATE ventas_pos
    SET descuento_monto = COALESCE(descuento_monto, 0) + p_descuento_total,
        total = subtotal - (COALESCE(descuento_monto, 0) + p_descuento_total) + COALESCE(impuestos, 0),
        monto_pendiente = subtotal - (COALESCE(descuento_monto, 0) + p_descuento_total) + COALESCE(impuestos, 0) - COALESCE(monto_pagado, 0),
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

COMMENT ON FUNCTION aplicar_promocion IS 'Aplica una promocion a una venta y registra el uso';

-- ============================================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_timestamp_promocion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_actualizar_timestamp_promocion ON promociones;

CREATE TRIGGER trigger_actualizar_timestamp_promocion
    BEFORE UPDATE ON promociones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp_promocion();

-- ============================================================================
-- DATOS INICIALES: Promociones de ejemplo (comentadas)
-- Descomentar para testing
-- ============================================================================
/*
-- Ejemplo: 2x1 en bebidas
INSERT INTO promociones (
    organizacion_id, codigo, nombre, descripcion, tipo, reglas, fecha_inicio, activo
) VALUES (
    1,
    '2X1_BEBIDAS',
    '2x1 en Bebidas',
    'Compra 2 bebidas y paga solo 1',
    'cantidad',
    '{"cantidad_requerida": 2, "cantidad_gratis": 1, "categorias_ids": [5]}'::JSONB,
    CURRENT_DATE,
    TRUE
);

-- Ejemplo: 10% de descuento en compras mayores a $500
INSERT INTO promociones (
    organizacion_id, codigo, nombre, descripcion, tipo, reglas, monto_minimo, valor_descuento, fecha_inicio, activo
) VALUES (
    1,
    'DESC10_500',
    '10% en compras +$500',
    '10% de descuento en compras mayores a $500',
    'porcentaje',
    '{}'::JSONB,
    500.00,
    10.00,
    CURRENT_DATE,
    TRUE
);

-- Ejemplo: Happy Hour (14:00 - 16:00)
INSERT INTO promociones (
    organizacion_id, codigo, nombre, descripcion, tipo, reglas, hora_inicio, hora_fin, valor_descuento, fecha_inicio, activo
) VALUES (
    1,
    'HAPPY_HOUR',
    'Happy Hour',
    '20% de descuento de 14:00 a 16:00',
    'porcentaje',
    '{}'::JSONB,
    '14:00'::TIME,
    '16:00'::TIME,
    20.00,
    CURRENT_DATE,
    TRUE
);
*/

-- ============================================================================
-- FIN: PROMOCIONES AUTOMATICAS
-- ============================================================================

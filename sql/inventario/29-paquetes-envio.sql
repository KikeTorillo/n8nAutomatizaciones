-- ============================================================================
-- MODULO: INVENTARIO - PAQUETES DE ENVIO
-- Descripcion: Sistema de paquetes/bultos para etapa de empaque
-- Permite agrupar productos en bultos fisicos con tracking de peso,
-- dimensiones y contenido durante operaciones tipo 'empaque'
-- Version: 1.0
-- Fecha: 31 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: paquetes_envio
-- Descripcion: Paquetes/bultos creados durante empaque
-- ============================================================================
CREATE TABLE IF NOT EXISTS paquetes_envio (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- IDENTIFICACION
    folio VARCHAR(20) NOT NULL,  -- PKG-2025-0001
    operacion_id INTEGER NOT NULL REFERENCES operaciones_almacen(id) ON DELETE CASCADE,

    -- DIMENSIONES Y PESO
    peso_kg DECIMAL(10,3),
    largo_cm DECIMAL(10,2),
    ancho_cm DECIMAL(10,2),
    alto_cm DECIMAL(10,2),
    volumen_cm3 DECIMAL(12,2) GENERATED ALWAYS AS (
        CASE WHEN largo_cm IS NOT NULL AND ancho_cm IS NOT NULL AND alto_cm IS NOT NULL
             THEN largo_cm * ancho_cm * alto_cm
             ELSE NULL
        END
    ) STORED,

    -- TRACKING
    codigo_barras VARCHAR(50),
    tracking_carrier VARCHAR(100),
    carrier VARCHAR(50),  -- DHL, FedEx, Estafeta, etc.

    -- ESTADO
    estado VARCHAR(20) NOT NULL DEFAULT 'abierto' CHECK (estado IN (
        'abierto',      -- Se pueden agregar/quitar items
        'cerrado',      -- No mas modificaciones de items
        'etiquetado',   -- Se genero etiqueta
        'enviado',      -- Fue despachado
        'cancelado'     -- Cancelado
    )),

    -- NOTAS
    notas TEXT,

    -- AUDITORIA
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    cerrado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    cerrado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE paquetes_envio IS 'Paquetes/bultos fisicos creados durante operaciones de empaque';
COMMENT ON COLUMN paquetes_envio.folio IS 'Folio unico formato PKG-YYYY-NNNN';
COMMENT ON COLUMN paquetes_envio.operacion_id IS 'Operacion de empaque asociada';
COMMENT ON COLUMN paquetes_envio.volumen_cm3 IS 'Volumen calculado automaticamente (largo * ancho * alto)';

-- RLS
ALTER TABLE paquetes_envio ENABLE ROW LEVEL SECURITY;

CREATE POLICY paquetes_envio_select ON paquetes_envio FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY paquetes_envio_insert ON paquetes_envio FOR INSERT WITH CHECK (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY paquetes_envio_update ON paquetes_envio FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY paquetes_envio_delete ON paquetes_envio FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_paquetes_envio_org ON paquetes_envio(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_envio_operacion ON paquetes_envio(operacion_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_envio_estado ON paquetes_envio(organizacion_id, estado);
CREATE INDEX IF NOT EXISTS idx_paquetes_envio_codigo ON paquetes_envio(codigo_barras) WHERE codigo_barras IS NOT NULL;

-- ============================================================================
-- TABLA: paquetes_envio_items
-- Descripcion: Items contenidos en cada paquete
-- ============================================================================
CREATE TABLE IF NOT EXISTS paquetes_envio_items (
    id SERIAL PRIMARY KEY,
    paquete_id INTEGER NOT NULL REFERENCES paquetes_envio(id) ON DELETE CASCADE,

    -- REFERENCIA AL ITEM DE LA OPERACION
    operacion_item_id INTEGER NOT NULL REFERENCES operaciones_almacen_items(id) ON DELETE CASCADE,

    -- PRODUCTO (denormalizado para consultas rapidas)
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,
    numero_serie_id INTEGER REFERENCES numeros_serie(id) ON DELETE SET NULL,

    -- CANTIDAD
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    -- AUDITORIA
    agregado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    agregado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS (UNIQUE via indice funcional abajo)
    CONSTRAINT paquetes_envio_items_check CHECK (cantidad > 0)
);

-- Un item de operacion solo puede estar en un paquete (excepto si tiene NS diferente)
CREATE UNIQUE INDEX IF NOT EXISTS idx_paquetes_items_unique
ON paquetes_envio_items(paquete_id, operacion_item_id, COALESCE(numero_serie_id, 0));

COMMENT ON TABLE paquetes_envio_items IS 'Items de productos contenidos en cada paquete';
COMMENT ON COLUMN paquetes_envio_items.operacion_item_id IS 'Referencia al item de la operacion de empaque';
COMMENT ON COLUMN paquetes_envio_items.numero_serie_id IS 'Numero de serie especifico si aplica';

-- RLS (hereda de paquete padre via JOIN)
ALTER TABLE paquetes_envio_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY paquetes_items_select ON paquetes_envio_items FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM paquetes_envio p
        WHERE p.id = paquete_id
        AND (p.organizacion_id::text = current_setting('app.current_tenant_id', true)
             OR current_setting('app.bypass_rls', true) = 'true')
    )
);

CREATE POLICY paquetes_items_insert ON paquetes_envio_items FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM paquetes_envio p
        WHERE p.id = paquete_id
        AND (p.organizacion_id::text = current_setting('app.current_tenant_id', true)
             OR current_setting('app.bypass_rls', true) = 'true')
    )
);

CREATE POLICY paquetes_items_update ON paquetes_envio_items FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM paquetes_envio p
        WHERE p.id = paquete_id
        AND (p.organizacion_id::text = current_setting('app.current_tenant_id', true)
             OR current_setting('app.bypass_rls', true) = 'true')
    )
);

CREATE POLICY paquetes_items_delete ON paquetes_envio_items FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM paquetes_envio p
        WHERE p.id = paquete_id
        AND (p.organizacion_id::text = current_setting('app.current_tenant_id', true)
             OR current_setting('app.bypass_rls', true) = 'true')
    )
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_paquetes_items_paquete ON paquetes_envio_items(paquete_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_items_operacion ON paquetes_envio_items(operacion_item_id);
CREATE INDEX IF NOT EXISTS idx_paquetes_items_producto ON paquetes_envio_items(producto_id);

-- ============================================================================
-- FUNCION: generar_folio_paquete
-- Descripcion: Genera folio secuencial para paquetes PKG-YYYY-NNNN
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_paquete(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_year VARCHAR(4);
    v_seq INTEGER;
    v_folio VARCHAR(20);
BEGIN
    v_year := TO_CHAR(CURRENT_DATE, 'YYYY');

    -- Obtener siguiente secuencia para el anio
    SELECT COALESCE(MAX(
        CASE
            WHEN folio ~ ('^PKG-' || v_year || '-[0-9]+$')
            THEN CAST(SUBSTRING(folio FROM 10) AS INTEGER)
            ELSE 0
        END
    ), 0) + 1
    INTO v_seq
    FROM paquetes_envio
    WHERE organizacion_id = p_organizacion_id;

    v_folio := 'PKG-' || v_year || '-' || LPAD(v_seq::TEXT, 4, '0');

    RETURN v_folio;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_folio_paquete IS 'Genera folio secuencial PKG-YYYY-NNNN para paquetes de envio';

-- ============================================================================
-- FUNCION: obtener_items_disponibles_empaque
-- Descripcion: Obtiene items de una operacion que aun no estan empacados
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_items_disponibles_empaque(p_operacion_id INTEGER)
RETURNS TABLE (
    operacion_item_id INTEGER,
    producto_id INTEGER,
    producto_nombre VARCHAR(200),
    producto_sku VARCHAR(50),
    variante_id INTEGER,
    variante_nombre VARCHAR(100),
    cantidad_demandada INTEGER,
    cantidad_empacada BIGINT,
    cantidad_disponible BIGINT,
    numero_serie_id INTEGER,
    numero_serie VARCHAR(100)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        oi.id as operacion_item_id,
        oi.producto_id,
        p.nombre::VARCHAR(200) as producto_nombre,
        p.sku::VARCHAR(50) as producto_sku,
        oi.variante_id,
        vp.nombre::VARCHAR(100) as variante_nombre,
        oi.cantidad_demandada,
        COALESCE(SUM(pei.cantidad), 0)::BIGINT as cantidad_empacada,
        (oi.cantidad_demandada - COALESCE(SUM(pei.cantidad), 0))::BIGINT as cantidad_disponible,
        oi.numero_serie_id,
        ns.numero_serie::VARCHAR(100) as numero_serie
    FROM operaciones_almacen_items oi
    JOIN productos p ON p.id = oi.producto_id
    LEFT JOIN variantes_producto vp ON vp.id = oi.variante_id
    LEFT JOIN numeros_serie ns ON ns.id = oi.numero_serie_id
    LEFT JOIN paquetes_envio_items pei ON pei.operacion_item_id = oi.id
    LEFT JOIN paquetes_envio pe ON pe.id = pei.paquete_id AND pe.estado != 'cancelado'
    WHERE oi.operacion_id = p_operacion_id
      AND oi.estado != 'cancelado'
    GROUP BY oi.id, p.id, vp.id, ns.id
    HAVING (oi.cantidad_demandada - COALESCE(SUM(pei.cantidad), 0)) > 0
    ORDER BY p.nombre;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_items_disponibles_empaque IS 'Lista items pendientes de empacar en una operacion de empaque';

-- ============================================================================
-- FUNCION: validar_operacion_empaque
-- Descripcion: Valida que una operacion sea de tipo empaque y este activa
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_operacion_empaque(p_operacion_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_operacion RECORD;
BEGIN
    SELECT id, tipo_operacion, estado, organizacion_id
    INTO v_operacion
    FROM operaciones_almacen
    WHERE id = p_operacion_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('valido', false, 'error', 'Operacion no encontrada');
    END IF;

    IF v_operacion.tipo_operacion != 'empaque' THEN
        RETURN jsonb_build_object('valido', false, 'error', 'La operacion no es de tipo empaque');
    END IF;

    IF v_operacion.estado IN ('completada', 'cancelada') THEN
        RETURN jsonb_build_object('valido', false, 'error', 'La operacion ya esta finalizada');
    END IF;

    RETURN jsonb_build_object('valido', true, 'organizacion_id', v_operacion.organizacion_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCION: crear_paquete
-- Descripcion: Crea un nuevo paquete para una operacion de empaque
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_paquete(
    p_operacion_id INTEGER,
    p_usuario_id INTEGER,
    p_notas TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_validacion JSONB;
    v_organizacion_id INTEGER;
    v_folio VARCHAR(20);
    v_paquete_id INTEGER;
    v_codigo_barras VARCHAR(50);
BEGIN
    -- Validar operacion
    v_validacion := validar_operacion_empaque(p_operacion_id);
    IF NOT (v_validacion->>'valido')::BOOLEAN THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', v_validacion->>'error');
    END IF;

    v_organizacion_id := (v_validacion->>'organizacion_id')::INTEGER;

    -- Generar folio
    v_folio := generar_folio_paquete(v_organizacion_id);

    -- Generar codigo de barras simple (basado en folio)
    v_codigo_barras := REPLACE(v_folio, '-', '');

    -- Crear paquete
    INSERT INTO paquetes_envio (
        organizacion_id,
        folio,
        operacion_id,
        codigo_barras,
        notas,
        creado_por
    ) VALUES (
        v_organizacion_id,
        v_folio,
        p_operacion_id,
        v_codigo_barras,
        p_notas,
        p_usuario_id
    )
    RETURNING id INTO v_paquete_id;

    RETURN jsonb_build_object(
        'exito', true,
        'mensaje', 'Paquete creado exitosamente',
        'paquete_id', v_paquete_id,
        'folio', v_folio,
        'codigo_barras', v_codigo_barras
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('exito', false, 'mensaje', format('Error: %s', SQLERRM));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_paquete IS 'Crea un nuevo paquete vacio para una operacion de empaque';

-- ============================================================================
-- FUNCION: agregar_item_paquete
-- Descripcion: Agrega un item a un paquete
-- ============================================================================
CREATE OR REPLACE FUNCTION agregar_item_paquete(
    p_paquete_id INTEGER,
    p_operacion_item_id INTEGER,
    p_cantidad INTEGER,
    p_usuario_id INTEGER,
    p_numero_serie_id INTEGER DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_paquete RECORD;
    v_item RECORD;
    v_cantidad_disponible BIGINT;
    v_item_paquete_id INTEGER;
BEGIN
    -- Obtener paquete
    SELECT p.*, o.tipo_operacion
    INTO v_paquete
    FROM paquetes_envio p
    JOIN operaciones_almacen o ON o.id = p.operacion_id
    WHERE p.id = p_paquete_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Paquete no encontrado');
    END IF;

    IF v_paquete.estado != 'abierto' THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El paquete no esta abierto para modificaciones');
    END IF;

    -- Obtener item de la operacion
    SELECT * INTO v_item
    FROM operaciones_almacen_items
    WHERE id = p_operacion_item_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Item de operacion no encontrado');
    END IF;

    IF v_item.operacion_id != v_paquete.operacion_id THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El item no pertenece a la operacion del paquete');
    END IF;

    -- Calcular cantidad disponible
    SELECT (v_item.cantidad_demandada - COALESCE(SUM(pei.cantidad), 0))::BIGINT
    INTO v_cantidad_disponible
    FROM paquetes_envio_items pei
    JOIN paquetes_envio pe ON pe.id = pei.paquete_id AND pe.estado != 'cancelado'
    WHERE pei.operacion_item_id = p_operacion_item_id
      AND (p_numero_serie_id IS NULL OR pei.numero_serie_id IS NOT DISTINCT FROM p_numero_serie_id);

    IF v_cantidad_disponible IS NULL THEN
        v_cantidad_disponible := v_item.cantidad_demandada;
    END IF;

    IF p_cantidad > v_cantidad_disponible THEN
        RETURN jsonb_build_object(
            'exito', false,
            'mensaje', format('Cantidad excede disponible (%s disponibles)', v_cantidad_disponible)
        );
    END IF;

    -- Insertar item en paquete
    INSERT INTO paquetes_envio_items (
        paquete_id,
        operacion_item_id,
        producto_id,
        variante_id,
        numero_serie_id,
        cantidad,
        agregado_por
    ) VALUES (
        p_paquete_id,
        p_operacion_item_id,
        v_item.producto_id,
        v_item.variante_id,
        p_numero_serie_id,
        p_cantidad,
        p_usuario_id
    )
    RETURNING id INTO v_item_paquete_id;

    -- Actualizar timestamp del paquete
    UPDATE paquetes_envio SET actualizado_en = NOW() WHERE id = p_paquete_id;

    RETURN jsonb_build_object(
        'exito', true,
        'mensaje', 'Item agregado al paquete',
        'item_id', v_item_paquete_id
    );

EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('exito', false, 'mensaje', 'Este item ya esta en el paquete');
WHEN OTHERS THEN
    RETURN jsonb_build_object('exito', false, 'mensaje', format('Error: %s', SQLERRM));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION agregar_item_paquete IS 'Agrega un item de la operacion a un paquete';

-- ============================================================================
-- FUNCION: remover_item_paquete
-- Descripcion: Remueve un item de un paquete
-- ============================================================================
CREATE OR REPLACE FUNCTION remover_item_paquete(
    p_paquete_id INTEGER,
    p_item_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_paquete RECORD;
BEGIN
    -- Obtener paquete
    SELECT * INTO v_paquete
    FROM paquetes_envio
    WHERE id = p_paquete_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Paquete no encontrado');
    END IF;

    IF v_paquete.estado != 'abierto' THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El paquete no esta abierto para modificaciones');
    END IF;

    -- Eliminar item
    DELETE FROM paquetes_envio_items
    WHERE id = p_item_id AND paquete_id = p_paquete_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Item no encontrado en el paquete');
    END IF;

    -- Actualizar timestamp
    UPDATE paquetes_envio SET actualizado_en = NOW() WHERE id = p_paquete_id;

    RETURN jsonb_build_object('exito', true, 'mensaje', 'Item removido del paquete');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('exito', false, 'mensaje', format('Error: %s', SQLERRM));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION remover_item_paquete IS 'Remueve un item de un paquete abierto';

-- ============================================================================
-- FUNCION: cerrar_paquete
-- Descripcion: Cierra un paquete (no mas modificaciones)
-- ============================================================================
CREATE OR REPLACE FUNCTION cerrar_paquete(
    p_paquete_id INTEGER,
    p_usuario_id INTEGER
) RETURNS JSONB AS $$
DECLARE
    v_paquete RECORD;
    v_items_count INTEGER;
BEGIN
    -- Obtener paquete
    SELECT * INTO v_paquete
    FROM paquetes_envio
    WHERE id = p_paquete_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Paquete no encontrado');
    END IF;

    IF v_paquete.estado != 'abierto' THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El paquete no esta abierto');
    END IF;

    -- Verificar que tenga items
    SELECT COUNT(*) INTO v_items_count
    FROM paquetes_envio_items
    WHERE paquete_id = p_paquete_id;

    IF v_items_count = 0 THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El paquete no tiene items');
    END IF;

    -- Cerrar paquete
    UPDATE paquetes_envio SET
        estado = 'cerrado',
        cerrado_por = p_usuario_id,
        cerrado_en = NOW(),
        actualizado_en = NOW()
    WHERE id = p_paquete_id;

    RETURN jsonb_build_object(
        'exito', true,
        'mensaje', 'Paquete cerrado exitosamente',
        'items', v_items_count
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('exito', false, 'mensaje', format('Error: %s', SQLERRM));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cerrar_paquete IS 'Cierra un paquete para evitar modificaciones adicionales';

-- ============================================================================
-- FUNCION: cancelar_paquete
-- Descripcion: Cancela un paquete (libera los items)
-- ============================================================================
CREATE OR REPLACE FUNCTION cancelar_paquete(
    p_paquete_id INTEGER,
    p_motivo TEXT DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_paquete RECORD;
BEGIN
    -- Obtener paquete
    SELECT * INTO v_paquete
    FROM paquetes_envio
    WHERE id = p_paquete_id;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'Paquete no encontrado');
    END IF;

    IF v_paquete.estado = 'enviado' THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'No se puede cancelar un paquete enviado');
    END IF;

    IF v_paquete.estado = 'cancelado' THEN
        RETURN jsonb_build_object('exito', false, 'mensaje', 'El paquete ya esta cancelado');
    END IF;

    -- Cancelar paquete
    UPDATE paquetes_envio SET
        estado = 'cancelado',
        notas = CASE
            WHEN p_motivo IS NOT NULL
            THEN COALESCE(notas || E'\n', '') || 'Cancelado: ' || p_motivo
            ELSE notas
        END,
        actualizado_en = NOW()
    WHERE id = p_paquete_id;

    RETURN jsonb_build_object('exito', true, 'mensaje', 'Paquete cancelado');

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('exito', false, 'mensaje', format('Error: %s', SQLERRM));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cancelar_paquete IS 'Cancela un paquete y libera sus items';

-- ============================================================================
-- FUNCION: obtener_resumen_empaque
-- Descripcion: Resumen de progreso de empaque de una operacion
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_resumen_empaque(p_operacion_id INTEGER)
RETURNS JSONB AS $$
DECLARE
    v_resultado JSONB;
BEGIN
    SELECT jsonb_build_object(
        'operacion_id', p_operacion_id,
        'total_items_operacion', COALESCE(SUM(oi.cantidad_demandada), 0),
        'total_items_empacados', COALESCE(SUM(
            (SELECT COALESCE(SUM(pei.cantidad), 0)
             FROM paquetes_envio_items pei
             JOIN paquetes_envio pe ON pe.id = pei.paquete_id AND pe.estado != 'cancelado'
             WHERE pei.operacion_item_id = oi.id)
        ), 0),
        'total_items_pendientes', COALESCE(SUM(oi.cantidad_demandada), 0) - COALESCE(SUM(
            (SELECT COALESCE(SUM(pei.cantidad), 0)
             FROM paquetes_envio_items pei
             JOIN paquetes_envio pe ON pe.id = pei.paquete_id AND pe.estado != 'cancelado'
             WHERE pei.operacion_item_id = oi.id)
        ), 0),
        'paquetes', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', pe.id,
                'folio', pe.folio,
                'estado', pe.estado,
                'items_count', (SELECT COUNT(*) FROM paquetes_envio_items WHERE paquete_id = pe.id),
                'peso_kg', pe.peso_kg
            ) ORDER BY pe.folio)
            FROM paquetes_envio pe
            WHERE pe.operacion_id = p_operacion_id AND pe.estado != 'cancelado'
        )
    )
    INTO v_resultado
    FROM operaciones_almacen_items oi
    WHERE oi.operacion_id = p_operacion_id AND oi.estado != 'cancelado';

    RETURN COALESCE(v_resultado, jsonb_build_object(
        'operacion_id', p_operacion_id,
        'total_items_operacion', 0,
        'total_items_empacados', 0,
        'total_items_pendientes', 0,
        'paquetes', '[]'::jsonb
    ));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION obtener_resumen_empaque IS 'Obtiene resumen del progreso de empaque de una operacion';

-- ============================================================================
-- VISTA: v_paquetes_envio
-- Descripcion: Vista de paquetes con informacion de operacion
-- ============================================================================
CREATE OR REPLACE VIEW v_paquetes_envio AS
SELECT
    p.id,
    p.organizacion_id,
    p.folio,
    p.operacion_id,
    o.folio as operacion_folio,
    o.tipo_operacion,
    o.origen_tipo,
    o.origen_folio,
    p.peso_kg,
    p.largo_cm,
    p.ancho_cm,
    p.alto_cm,
    p.volumen_cm3,
    p.codigo_barras,
    p.tracking_carrier,
    p.carrier,
    p.estado,
    p.notas,
    p.creado_por,
    u.email as creado_por_email,
    p.cerrado_por,
    p.cerrado_en,
    p.creado_en,
    p.actualizado_en,
    (SELECT COUNT(*) FROM paquetes_envio_items WHERE paquete_id = p.id) as total_items,
    (SELECT COALESCE(SUM(cantidad), 0) FROM paquetes_envio_items WHERE paquete_id = p.id) as total_unidades
FROM paquetes_envio p
JOIN operaciones_almacen o ON o.id = p.operacion_id
LEFT JOIN usuarios u ON u.id = p.creado_por;

COMMENT ON VIEW v_paquetes_envio IS 'Vista de paquetes con informacion de operacion y conteos';

-- ============================================================================
-- GRANTS
-- ============================================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON paquetes_envio TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON paquetes_envio_items TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE paquetes_envio_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE paquetes_envio_items_id_seq TO saas_app;
GRANT SELECT ON v_paquetes_envio TO saas_app;

GRANT EXECUTE ON FUNCTION generar_folio_paquete(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_items_disponibles_empaque(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION validar_operacion_empaque(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION crear_paquete(INTEGER, INTEGER, TEXT) TO saas_app;
GRANT EXECUTE ON FUNCTION agregar_item_paquete(INTEGER, INTEGER, INTEGER, INTEGER, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION remover_item_paquete(INTEGER, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION cerrar_paquete(INTEGER, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION cancelar_paquete(INTEGER, TEXT) TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_resumen_empaque(INTEGER) TO saas_app;

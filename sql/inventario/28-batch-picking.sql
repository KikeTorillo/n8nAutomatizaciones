-- ============================================================================
-- MODULO: INVENTARIO - BATCH PICKING (Wave Picking)
-- Descripcion: Sistema de agrupacion de operaciones de picking para
-- procesamiento consolidado
-- Version: 1.0
-- Fecha: 31 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: batch_pickings
-- Descripcion: Lotes de picking para procesamiento consolidado
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_pickings (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- IDENTIFICACION
    folio VARCHAR(50) NOT NULL,
    nombre VARCHAR(100),
    descripcion TEXT,

    -- ESTADO
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (estado IN (
        'borrador',       -- Creado, agregando operaciones
        'confirmado',     -- Listo para procesar
        'en_proceso',     -- Siendo procesado
        'completado',     -- Todas las operaciones completadas
        'cancelado'       -- Cancelado
    )),

    -- ASIGNACION
    asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    prioridad INTEGER DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10),

    -- ESTADISTICAS (calculadas)
    total_operaciones INTEGER DEFAULT 0,
    total_items INTEGER DEFAULT 0,
    total_items_procesados INTEGER DEFAULT 0,
    total_productos_unicos INTEGER DEFAULT 0,

    -- FECHAS
    fecha_programada DATE,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,

    -- NOTAS
    notas TEXT,

    -- AUDITORIA
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE batch_pickings IS 'Lotes de picking para procesamiento consolidado (Wave Picking)';
COMMENT ON COLUMN batch_pickings.total_productos_unicos IS 'Cantidad de SKUs diferentes en el batch (para estimar tiempo)';

-- RLS
ALTER TABLE batch_pickings ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_pickings_select ON batch_pickings FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY batch_pickings_insert ON batch_pickings FOR INSERT WITH CHECK (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY batch_pickings_update ON batch_pickings FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY batch_pickings_delete ON batch_pickings FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_batch_pickings_org ON batch_pickings(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_batch_pickings_sucursal ON batch_pickings(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_batch_pickings_estado ON batch_pickings(estado);
CREATE INDEX IF NOT EXISTS idx_batch_pickings_asignado ON batch_pickings(asignado_a) WHERE asignado_a IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_batch_pickings_pendientes ON batch_pickings(sucursal_id, estado)
    WHERE estado IN ('borrador', 'confirmado', 'en_proceso');

-- ============================================================================
-- TABLA: batch_picking_operaciones
-- Descripcion: Relacion entre batch y operaciones de picking
-- ============================================================================
CREATE TABLE IF NOT EXISTS batch_picking_operaciones (
    id SERIAL PRIMARY KEY,
    batch_id INTEGER NOT NULL REFERENCES batch_pickings(id) ON DELETE CASCADE,
    operacion_id INTEGER NOT NULL REFERENCES operaciones_almacen(id) ON DELETE CASCADE,

    -- ORDEN DE PROCESAMIENTO
    orden INTEGER DEFAULT 0,  -- Orden sugerido (optimizado por ubicacion)

    -- ESTADO EN EL BATCH
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'en_proceso',
        'completado'
    )),

    -- TIMESTAMPS
    iniciado_en TIMESTAMPTZ,
    completado_en TIMESTAMPTZ,

    -- CONSTRAINTS
    UNIQUE(batch_id, operacion_id)
);

COMMENT ON TABLE batch_picking_operaciones IS 'Relacion entre batches y operaciones de picking';
COMMENT ON COLUMN batch_picking_operaciones.orden IS 'Orden de procesamiento optimizado por ubicacion';

-- RLS via join con batch
ALTER TABLE batch_picking_operaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY batch_op_select ON batch_picking_operaciones FOR SELECT USING (
    batch_id IN (
        SELECT id FROM batch_pickings
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY batch_op_insert ON batch_picking_operaciones FOR INSERT WITH CHECK (true);

CREATE POLICY batch_op_update ON batch_picking_operaciones FOR UPDATE USING (
    batch_id IN (
        SELECT id FROM batch_pickings
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY batch_op_delete ON batch_picking_operaciones FOR DELETE USING (
    batch_id IN (
        SELECT id FROM batch_pickings
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_batch_op_batch ON batch_picking_operaciones(batch_id);
CREATE INDEX IF NOT EXISTS idx_batch_op_operacion ON batch_picking_operaciones(operacion_id);
CREATE INDEX IF NOT EXISTS idx_batch_op_orden ON batch_picking_operaciones(batch_id, orden);

-- ============================================================================
-- FUNCION: generar_folio_batch
-- Descripcion: Genera folio unico para batch de picking
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_batch(p_organizacion_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_año VARCHAR(4);
    v_secuencia INTEGER;
    v_folio VARCHAR(50);
BEGIN
    v_año := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(folio FROM 'WAVE-' || v_año || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO v_secuencia
    FROM batch_pickings
    WHERE organizacion_id = p_organizacion_id
      AND folio LIKE 'WAVE-' || v_año || '-%';

    v_folio := 'WAVE-' || v_año || '-' || LPAD(v_secuencia::TEXT, 4, '0');

    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_folio_batch IS 'Genera folio secuencial para batches: WAVE-2025-0001';

-- ============================================================================
-- FUNCION: crear_batch_picking
-- Descripcion: Crea un batch de picking agrupando operaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_batch_picking(
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER,
    p_operacion_ids INTEGER[],
    p_nombre VARCHAR(100),
    p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_batch_id INTEGER;
    v_folio VARCHAR(50);
    v_operacion_id INTEGER;
    v_orden INTEGER := 0;
    v_total_operaciones INTEGER;
    v_total_items INTEGER;
    v_total_productos INTEGER;
BEGIN
    -- Validar que todas las operaciones son de picking y estan disponibles
    IF EXISTS (
        SELECT 1 FROM operaciones_almacen o
        WHERE o.id = ANY(p_operacion_ids)
          AND (o.tipo_operacion != 'picking' OR o.estado NOT IN ('borrador', 'asignada'))
    ) THEN
        RAISE EXCEPTION 'Todas las operaciones deben ser de tipo picking y estar disponibles';
    END IF;

    -- Validar que no estan en otro batch activo
    IF EXISTS (
        SELECT 1 FROM batch_picking_operaciones bpo
        JOIN batch_pickings bp ON bp.id = bpo.batch_id
        WHERE bpo.operacion_id = ANY(p_operacion_ids)
          AND bp.estado NOT IN ('completado', 'cancelado')
    ) THEN
        RAISE EXCEPTION 'Algunas operaciones ya pertenecen a otro batch activo';
    END IF;

    -- Generar folio
    v_folio := generar_folio_batch(p_organizacion_id);

    -- Crear batch
    INSERT INTO batch_pickings (
        organizacion_id,
        sucursal_id,
        folio,
        nombre,
        estado,
        creado_por
    ) VALUES (
        p_organizacion_id,
        p_sucursal_id,
        v_folio,
        COALESCE(p_nombre, 'Batch ' || v_folio),
        'borrador',
        p_usuario_id
    ) RETURNING id INTO v_batch_id;

    -- Agregar operaciones al batch (ordenadas por ubicacion de origen)
    FOR v_operacion_id IN
        SELECT o.id
        FROM operaciones_almacen o
        LEFT JOIN ubicaciones_almacen u ON u.id = o.ubicacion_origen_id
        WHERE o.id = ANY(p_operacion_ids)
        ORDER BY u.codigo NULLS LAST
    LOOP
        v_orden := v_orden + 1;

        INSERT INTO batch_picking_operaciones (
            batch_id,
            operacion_id,
            orden
        ) VALUES (
            v_batch_id,
            v_operacion_id,
            v_orden
        );
    END LOOP;

    -- Calcular estadisticas
    SELECT
        COUNT(DISTINCT bpo.operacion_id),
        COALESCE(SUM(oi.cantidad_demandada), 0),
        COUNT(DISTINCT oi.producto_id)
    INTO v_total_operaciones, v_total_items, v_total_productos
    FROM batch_picking_operaciones bpo
    JOIN operaciones_almacen_items oi ON oi.operacion_id = bpo.operacion_id
    WHERE bpo.batch_id = v_batch_id;

    -- Actualizar estadisticas del batch
    UPDATE batch_pickings
    SET total_operaciones = v_total_operaciones,
        total_items = v_total_items,
        total_productos_unicos = v_total_productos,
        actualizado_en = NOW()
    WHERE id = v_batch_id;

    RETURN v_batch_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_batch_picking IS 'Crea un batch agrupando operaciones de picking para procesamiento consolidado';

-- ============================================================================
-- FUNCION: obtener_lista_consolidada_batch
-- Descripcion: Obtiene lista consolidada de productos a recoger en un batch
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_lista_consolidada_batch(p_batch_id INTEGER)
RETURNS TABLE (
    producto_id INTEGER,
    producto_nombre VARCHAR(200),
    producto_sku VARCHAR(50),
    variante_id INTEGER,
    variante_nombre VARCHAR(200),
    ubicacion_id INTEGER,
    ubicacion_codigo VARCHAR(30),
    cantidad_total INTEGER,
    cantidad_procesada INTEGER,
    cantidad_pendiente INTEGER,
    operaciones_count INTEGER,
    operaciones JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id as producto_id,
        p.nombre as producto_nombre,
        p.sku as producto_sku,
        oi.variante_id,
        v.nombre as variante_nombre,
        COALESCE(oi.ubicacion_origen_id, o.ubicacion_origen_id) as ubicacion_id,
        u.codigo as ubicacion_codigo,
        SUM(oi.cantidad_demandada)::INTEGER as cantidad_total,
        SUM(oi.cantidad_procesada)::INTEGER as cantidad_procesada,
        SUM(oi.cantidad_demandada - oi.cantidad_procesada)::INTEGER as cantidad_pendiente,
        COUNT(DISTINCT o.id)::INTEGER as operaciones_count,
        jsonb_agg(DISTINCT jsonb_build_object(
            'operacion_id', o.id,
            'operacion_folio', o.folio,
            'item_id', oi.id,
            'cantidad_demandada', oi.cantidad_demandada,
            'cantidad_procesada', oi.cantidad_procesada
        )) as operaciones
    FROM batch_picking_operaciones bpo
    JOIN operaciones_almacen o ON o.id = bpo.operacion_id
    JOIN operaciones_almacen_items oi ON oi.operacion_id = o.id
    JOIN productos p ON p.id = oi.producto_id
    LEFT JOIN variantes_producto v ON v.id = oi.variante_id
    LEFT JOIN ubicaciones_almacen u ON u.id = COALESCE(oi.ubicacion_origen_id, o.ubicacion_origen_id)
    WHERE bpo.batch_id = p_batch_id
      AND oi.estado != 'cancelado'
    GROUP BY p.id, p.nombre, p.sku, oi.variante_id, v.nombre,
             COALESCE(oi.ubicacion_origen_id, o.ubicacion_origen_id), u.codigo
    ORDER BY u.codigo NULLS LAST, p.nombre;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_lista_consolidada_batch IS 'Lista consolidada de productos por ubicacion para picking eficiente';

-- ============================================================================
-- FUNCION: procesar_item_batch
-- Descripcion: Procesa un item del batch (distribuye cantidad entre operaciones)
-- ============================================================================
CREATE OR REPLACE FUNCTION procesar_item_batch(
    p_batch_id INTEGER,
    p_producto_id INTEGER,
    p_variante_id INTEGER,
    p_ubicacion_id INTEGER,
    p_cantidad INTEGER,
    p_usuario_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_restante INTEGER := p_cantidad;
    v_item RECORD;
    v_cantidad_aplicar INTEGER;
    v_items_actualizados INTEGER := 0;
BEGIN
    -- Procesar items pendientes de este producto en el batch
    FOR v_item IN
        SELECT oi.id, oi.operacion_id, oi.cantidad_demandada,
               oi.cantidad_procesada,
               (oi.cantidad_demandada - oi.cantidad_procesada) as pendiente
        FROM batch_picking_operaciones bpo
        JOIN operaciones_almacen o ON o.id = bpo.operacion_id
        JOIN operaciones_almacen_items oi ON oi.operacion_id = o.id
        WHERE bpo.batch_id = p_batch_id
          AND oi.producto_id = p_producto_id
          AND (oi.variante_id = p_variante_id OR (oi.variante_id IS NULL AND p_variante_id IS NULL))
          AND COALESCE(oi.ubicacion_origen_id, o.ubicacion_origen_id) = p_ubicacion_id
          AND oi.estado != 'completado'
        ORDER BY bpo.orden, oi.id
    LOOP
        EXIT WHEN v_restante <= 0;

        -- Calcular cuanto aplicar a este item
        v_cantidad_aplicar := LEAST(v_restante, v_item.pendiente);

        -- Actualizar item
        UPDATE operaciones_almacen_items
        SET cantidad_procesada = cantidad_procesada + v_cantidad_aplicar,
            estado = CASE
                WHEN cantidad_procesada + v_cantidad_aplicar >= cantidad_demandada THEN 'completado'
                ELSE 'en_proceso'
            END,
            procesado_por = p_usuario_id,
            procesado_en = NOW(),
            actualizado_en = NOW()
        WHERE id = v_item.id;

        v_restante := v_restante - v_cantidad_aplicar;
        v_items_actualizados := v_items_actualizados + 1;
    END LOOP;

    -- Actualizar estadisticas del batch
    UPDATE batch_pickings
    SET total_items_procesados = (
            SELECT COALESCE(SUM(oi.cantidad_procesada), 0)
            FROM batch_picking_operaciones bpo
            JOIN operaciones_almacen_items oi ON oi.operacion_id = bpo.operacion_id
            WHERE bpo.batch_id = p_batch_id
        ),
        actualizado_en = NOW()
    WHERE id = p_batch_id;

    RETURN jsonb_build_object(
        'exito', true,
        'cantidad_solicitada', p_cantidad,
        'cantidad_aplicada', p_cantidad - v_restante,
        'cantidad_sobrante', v_restante,
        'items_actualizados', v_items_actualizados,
        'mensaje', CASE
            WHEN v_restante > 0 THEN 'Cantidad excede lo pendiente. Sobrante: ' || v_restante
            ELSE 'Procesado correctamente'
        END
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION procesar_item_batch IS 'Procesa cantidad de un producto en batch, distribuyendo entre operaciones';

-- ============================================================================
-- FUNCION: iniciar_batch
-- Descripcion: Inicia el procesamiento de un batch
-- ============================================================================
CREATE OR REPLACE FUNCTION iniciar_batch(
    p_batch_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_batch batch_pickings;
BEGIN
    SELECT * INTO v_batch
    FROM batch_pickings
    WHERE id = p_batch_id;

    IF v_batch.id IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'Batch no encontrado');
    END IF;

    IF v_batch.estado NOT IN ('borrador', 'confirmado') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'Batch no puede iniciarse en estado: ' || v_batch.estado);
    END IF;

    -- Actualizar batch
    UPDATE batch_pickings
    SET estado = 'en_proceso',
        fecha_inicio = NOW(),
        asignado_a = COALESCE(asignado_a, p_usuario_id),
        actualizado_en = NOW()
    WHERE id = p_batch_id;

    -- Actualizar estado de operaciones incluidas
    UPDATE operaciones_almacen
    SET estado = 'en_proceso',
        fecha_inicio = COALESCE(fecha_inicio, NOW()),
        asignado_a = COALESCE(asignado_a, p_usuario_id),
        actualizado_en = NOW()
    WHERE id IN (
        SELECT operacion_id FROM batch_picking_operaciones WHERE batch_id = p_batch_id
    );

    RETURN jsonb_build_object(
        'exito', true,
        'mensaje', 'Batch iniciado correctamente'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION iniciar_batch IS 'Inicia el procesamiento de un batch y sus operaciones';

-- ============================================================================
-- FUNCION: completar_batch
-- Descripcion: Completa un batch y sus operaciones
-- ============================================================================
CREATE OR REPLACE FUNCTION completar_batch(
    p_batch_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_batch batch_pickings;
    v_operaciones_incompletas INTEGER;
BEGIN
    SELECT * INTO v_batch
    FROM batch_pickings
    WHERE id = p_batch_id;

    IF v_batch.id IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'Batch no encontrado');
    END IF;

    IF v_batch.estado != 'en_proceso' THEN
        RETURN jsonb_build_object('exito', false, 'error', 'Batch debe estar en proceso para completarse');
    END IF;

    -- Verificar si hay operaciones con items pendientes
    SELECT COUNT(*)
    INTO v_operaciones_incompletas
    FROM batch_picking_operaciones bpo
    JOIN operaciones_almacen_items oi ON oi.operacion_id = bpo.operacion_id
    WHERE bpo.batch_id = p_batch_id
      AND oi.estado NOT IN ('completado', 'cancelado');

    -- Actualizar estado de operaciones completadas
    UPDATE operaciones_almacen o
    SET estado = CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM operaciones_almacen_items oi
                WHERE oi.operacion_id = o.id
                  AND oi.estado NOT IN ('completado', 'cancelado')
            ) THEN 'completada'
            ELSE 'parcial'
        END,
        fecha_fin = CASE
            WHEN NOT EXISTS (
                SELECT 1 FROM operaciones_almacen_items oi
                WHERE oi.operacion_id = o.id
                  AND oi.estado NOT IN ('completado', 'cancelado')
            ) THEN NOW()
            ELSE NULL
        END,
        actualizado_en = NOW()
    WHERE o.id IN (
        SELECT operacion_id FROM batch_picking_operaciones WHERE batch_id = p_batch_id
    );

    -- Actualizar batch
    UPDATE batch_pickings
    SET estado = 'completado',
        fecha_fin = NOW(),
        actualizado_en = NOW()
    WHERE id = p_batch_id;

    -- Actualizar estados en batch_picking_operaciones
    UPDATE batch_picking_operaciones bpo
    SET estado = 'completado',
        completado_en = NOW()
    WHERE bpo.batch_id = p_batch_id;

    RETURN jsonb_build_object(
        'exito', true,
        'operaciones_completadas', (
            SELECT COUNT(*)
            FROM operaciones_almacen o
            WHERE o.id IN (SELECT operacion_id FROM batch_picking_operaciones WHERE batch_id = p_batch_id)
              AND o.estado = 'completada'
        ),
        'operaciones_parciales', (
            SELECT COUNT(*)
            FROM operaciones_almacen o
            WHERE o.id IN (SELECT operacion_id FROM batch_picking_operaciones WHERE batch_id = p_batch_id)
              AND o.estado = 'parcial'
        ),
        'mensaje', 'Batch completado'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION completar_batch IS 'Completa un batch y actualiza estado de sus operaciones';

-- ============================================================================
-- FUNCION: actualizar_totales_batch
-- Descripcion: Actualiza estadisticas del batch (trigger)
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_totales_batch()
RETURNS TRIGGER AS $$
DECLARE
    v_batch_id INTEGER;
BEGIN
    v_batch_id := COALESCE(NEW.batch_id, OLD.batch_id);

    UPDATE batch_pickings
    SET total_operaciones = (
            SELECT COUNT(*) FROM batch_picking_operaciones WHERE batch_id = v_batch_id
        ),
        total_items = (
            SELECT COALESCE(SUM(oi.cantidad_demandada), 0)
            FROM batch_picking_operaciones bpo
            JOIN operaciones_almacen_items oi ON oi.operacion_id = bpo.operacion_id
            WHERE bpo.batch_id = v_batch_id
        ),
        total_productos_unicos = (
            SELECT COUNT(DISTINCT oi.producto_id)
            FROM batch_picking_operaciones bpo
            JOIN operaciones_almacen_items oi ON oi.operacion_id = bpo.operacion_id
            WHERE bpo.batch_id = v_batch_id
        ),
        actualizado_en = NOW()
    WHERE id = v_batch_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar totales del batch
DROP TRIGGER IF EXISTS trg_actualizar_totales_batch ON batch_picking_operaciones;
CREATE TRIGGER trg_actualizar_totales_batch
    AFTER INSERT OR DELETE ON batch_picking_operaciones
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_batch();

-- ============================================================================
-- VISTA: v_batches_pendientes
-- Descripcion: Vista de batches pendientes con informacion resumida
-- ============================================================================
CREATE OR REPLACE VIEW v_batches_pendientes AS
SELECT
    bp.id,
    bp.folio,
    bp.nombre,
    bp.estado,
    bp.prioridad,
    bp.total_operaciones,
    bp.total_items,
    bp.total_items_procesados,
    bp.total_productos_unicos,
    ROUND((bp.total_items_procesados::DECIMAL / NULLIF(bp.total_items, 0)) * 100, 1) as porcentaje_completado,
    bp.sucursal_id,
    s.nombre as sucursal_nombre,
    bp.asignado_a,
    u.nombre as asignado_nombre,
    bp.fecha_programada,
    bp.fecha_inicio,
    bp.creado_en,
    bp.organizacion_id
FROM batch_pickings bp
JOIN sucursales s ON s.id = bp.sucursal_id
LEFT JOIN usuarios u ON u.id = bp.asignado_a
WHERE bp.estado NOT IN ('completado', 'cancelado');

COMMENT ON VIEW v_batches_pendientes IS 'Vista de batches de picking pendientes con estadisticas';

-- ============================================================================
-- FIN: BATCH PICKING
-- ============================================================================

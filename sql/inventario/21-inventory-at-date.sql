-- ============================================================================
-- INVENTORY AT DATE - Nexo ERP
-- Fecha: Diciembre 2025
-- Descripcion: Sistema de snapshots para consulta historica de inventario
-- ============================================================================

-- ============================================================================
-- TABLA: inventario_snapshots
-- Descripcion: Cabecera de snapshots diarios de inventario
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventario_snapshots (
    -- Identificacion
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Fecha del snapshot (una entrada por dia por organizacion)
    fecha_snapshot DATE NOT NULL,

    -- Metadata
    tipo VARCHAR(20) NOT NULL DEFAULT 'automatico' CHECK (tipo IN ('automatico', 'manual', 'cierre_mes')),
    descripcion TEXT,

    -- Totales calculados (para consultas rapidas)
    total_productos INTEGER NOT NULL DEFAULT 0,
    total_unidades BIGINT NOT NULL DEFAULT 0,
    valor_total DECIMAL(15, 2) NOT NULL DEFAULT 0,

    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'completo' CHECK (estado IN ('en_proceso', 'completo', 'error')),
    error_mensaje TEXT,

    -- Auditoria
    generado_por INTEGER REFERENCES usuarios(id),
    tiempo_generacion_ms INTEGER,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(organizacion_id, fecha_snapshot)
);

CREATE INDEX IF NOT EXISTS idx_snapshots_org_fecha ON inventario_snapshots(organizacion_id, fecha_snapshot DESC);
CREATE INDEX IF NOT EXISTS idx_snapshots_fecha ON inventario_snapshots(fecha_snapshot DESC);

COMMENT ON TABLE inventario_snapshots IS 'Cabecera de snapshots diarios de inventario para consulta historica';

-- ============================================================================
-- TABLA: inventario_snapshot_lineas
-- Descripcion: Detalle por producto de cada snapshot
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventario_snapshot_lineas (
    -- Identificacion
    id SERIAL PRIMARY KEY,
    snapshot_id INTEGER NOT NULL REFERENCES inventario_snapshots(id) ON DELETE CASCADE,

    -- Producto (snapshot de datos para evitar JOINs)
    producto_id INTEGER NOT NULL,
    producto_nombre VARCHAR(200) NOT NULL,
    producto_sku VARCHAR(50),
    categoria_id INTEGER,
    categoria_nombre VARCHAR(100),

    -- Stock al momento del snapshot
    stock_actual INTEGER NOT NULL,
    stock_minimo INTEGER,
    stock_maximo INTEGER,

    -- Reservas activas al momento
    reservas_activas INTEGER NOT NULL DEFAULT 0,

    -- Valoracion
    costo_unitario DECIMAL(10, 2) NOT NULL DEFAULT 0,

    -- Variante (si aplica)
    variante_id INTEGER,
    variante_nombre VARCHAR(200)
);

CREATE INDEX IF NOT EXISTS idx_snapshot_lineas_snapshot ON inventario_snapshot_lineas(snapshot_id);
CREATE INDEX IF NOT EXISTS idx_snapshot_lineas_producto ON inventario_snapshot_lineas(producto_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_snapshot_lineas_unique
    ON inventario_snapshot_lineas(snapshot_id, producto_id, COALESCE(variante_id, 0));

COMMENT ON TABLE inventario_snapshot_lineas IS 'Detalle de stock por producto en cada snapshot';

-- ============================================================================
-- RLS Policies
-- ============================================================================
ALTER TABLE inventario_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_snapshots FORCE ROW LEVEL SECURITY;
ALTER TABLE inventario_snapshot_lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventario_snapshot_lineas FORCE ROW LEVEL SECURITY;

-- Snapshots - SELECT
CREATE POLICY inventario_snapshots_select_policy ON inventario_snapshots
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Snapshots - INSERT
CREATE POLICY inventario_snapshots_insert_policy ON inventario_snapshots
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Snapshots - UPDATE
CREATE POLICY inventario_snapshots_update_policy ON inventario_snapshots
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Snapshots - DELETE
CREATE POLICY inventario_snapshots_delete_policy ON inventario_snapshots
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Lineas - Acceso via snapshot (hereda permisos)
CREATE POLICY inventario_snapshot_lineas_select_policy ON inventario_snapshot_lineas
    FOR SELECT
    USING (
        snapshot_id IN (
            SELECT id FROM inventario_snapshots
            WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY inventario_snapshot_lineas_insert_policy ON inventario_snapshot_lineas
    FOR INSERT
    WITH CHECK (
        snapshot_id IN (
            SELECT id FROM inventario_snapshots
            WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY inventario_snapshot_lineas_delete_policy ON inventario_snapshot_lineas
    FOR DELETE
    USING (
        snapshot_id IN (
            SELECT id FROM inventario_snapshots
            WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCION: generar_snapshot_inventario
-- Descripcion: Genera snapshot de inventario para una organizacion
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_snapshot_inventario(
    p_organizacion_id INTEGER,
    p_fecha DATE DEFAULT CURRENT_DATE,
    p_tipo VARCHAR(20) DEFAULT 'automatico',
    p_usuario_id INTEGER DEFAULT NULL,
    p_descripcion TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_snapshot_id INTEGER;
    v_inicio TIMESTAMPTZ;
    v_total_productos INTEGER := 0;
    v_total_unidades BIGINT := 0;
    v_valor_total DECIMAL(15, 2) := 0;
BEGIN
    v_inicio := clock_timestamp();

    -- Verificar si ya existe snapshot para esta fecha
    SELECT id INTO v_snapshot_id
    FROM inventario_snapshots
    WHERE organizacion_id = p_organizacion_id
      AND fecha_snapshot = p_fecha;

    IF v_snapshot_id IS NOT NULL THEN
        -- Eliminar snapshot existente para regenerar
        DELETE FROM inventario_snapshot_lineas WHERE snapshot_id = v_snapshot_id;
        DELETE FROM inventario_snapshots WHERE id = v_snapshot_id;
    END IF;

    -- Crear cabecera del snapshot
    INSERT INTO inventario_snapshots (
        organizacion_id,
        fecha_snapshot,
        tipo,
        descripcion,
        generado_por,
        estado
    ) VALUES (
        p_organizacion_id,
        p_fecha,
        p_tipo,
        COALESCE(p_descripcion, 'Snapshot ' || p_tipo || ' del ' || p_fecha),
        p_usuario_id,
        'en_proceso'
    )
    RETURNING id INTO v_snapshot_id;

    -- Insertar productos SIN variantes
    INSERT INTO inventario_snapshot_lineas (
        snapshot_id,
        producto_id,
        producto_nombre,
        producto_sku,
        categoria_id,
        categoria_nombre,
        stock_actual,
        stock_minimo,
        stock_maximo,
        reservas_activas,
        costo_unitario,
        variante_id,
        variante_nombre
    )
    SELECT
        v_snapshot_id,
        p.id,
        p.nombre,
        p.sku,
        p.categoria_id,
        c.nombre,
        p.stock_actual,
        p.stock_minimo,
        p.stock_maximo,
        COALESCE((
            SELECT SUM(r.cantidad)::INTEGER
            FROM reservas_stock r
            WHERE r.producto_id = p.id
              AND r.organizacion_id = p_organizacion_id
              AND r.estado = 'activa'
              AND (r.expira_en IS NULL OR r.expira_en > NOW())
        ), 0),
        COALESCE(p.precio_compra, 0),
        NULL,
        NULL
    FROM productos p
    LEFT JOIN categorias_productos c ON c.id = p.categoria_id
    WHERE p.organizacion_id = p_organizacion_id
      AND p.activo = true
      AND p.eliminado_en IS NULL
      AND p.tiene_variantes = false;

    -- Insertar variantes de productos
    INSERT INTO inventario_snapshot_lineas (
        snapshot_id,
        producto_id,
        producto_nombre,
        producto_sku,
        categoria_id,
        categoria_nombre,
        stock_actual,
        stock_minimo,
        stock_maximo,
        reservas_activas,
        costo_unitario,
        variante_id,
        variante_nombre
    )
    SELECT
        v_snapshot_id,
        p.id,
        p.nombre,
        v.sku,
        p.categoria_id,
        c.nombre,
        v.stock_actual,
        v.stock_minimo,
        v.stock_maximo,
        COALESCE((
            SELECT SUM(r.cantidad)::INTEGER
            FROM reservas_stock r
            WHERE r.variante_id = v.id
              AND r.organizacion_id = p_organizacion_id
              AND r.estado = 'activa'
              AND (r.expira_en IS NULL OR r.expira_en > NOW())
        ), 0),
        COALESCE(v.precio_compra, p.precio_compra, 0),
        v.id,
        v.nombre_variante
    FROM variantes_producto v
    JOIN productos p ON p.id = v.producto_id
    LEFT JOIN categorias_productos c ON c.id = p.categoria_id
    WHERE p.organizacion_id = p_organizacion_id
      AND p.activo = true
      AND p.eliminado_en IS NULL
      AND v.activo = true;

    -- Calcular totales
    SELECT
        COUNT(*)::INTEGER,
        COALESCE(SUM(stock_actual), 0)::BIGINT,
        COALESCE(SUM(stock_actual * costo_unitario), 0)
    INTO v_total_productos, v_total_unidades, v_valor_total
    FROM inventario_snapshot_lineas
    WHERE snapshot_id = v_snapshot_id;

    -- Actualizar cabecera con totales y tiempo
    UPDATE inventario_snapshots
    SET
        total_productos = v_total_productos,
        total_unidades = v_total_unidades,
        valor_total = v_valor_total,
        estado = 'completo',
        tiempo_generacion_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_inicio))::INTEGER
    WHERE id = v_snapshot_id;

    RETURN v_snapshot_id;

EXCEPTION
    WHEN OTHERS THEN
        IF v_snapshot_id IS NOT NULL THEN
            UPDATE inventario_snapshots
            SET
                estado = 'error',
                error_mensaje = SQLERRM,
                tiempo_generacion_ms = EXTRACT(MILLISECONDS FROM (clock_timestamp() - v_inicio))::INTEGER
            WHERE id = v_snapshot_id;
        END IF;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_snapshot_inventario IS
'Genera un snapshot completo del inventario para una organizacion en una fecha especifica.
Incluye productos, variantes, stock actual, reservas y valoracion.';

-- ============================================================================
-- FUNCION: generar_snapshots_todas_organizaciones
-- Descripcion: Genera snapshots para todas las organizaciones (job nocturno)
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_snapshots_todas_organizaciones()
RETURNS TABLE (
    organizacion_id INTEGER,
    organizacion_nombre VARCHAR,
    snapshot_id INTEGER,
    total_productos INTEGER,
    tiempo_ms INTEGER,
    estado VARCHAR
) AS $$
DECLARE
    org RECORD;
    v_snapshot_id INTEGER;
BEGIN
    -- Bypass RLS para operacion de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    FOR org IN
        SELECT o.id, o.nombre_comercial
        FROM organizaciones o
        WHERE o.activo = true
        ORDER BY o.id
    LOOP
        BEGIN
            v_snapshot_id := generar_snapshot_inventario(org.id, CURRENT_DATE, 'automatico');

            RETURN QUERY
            SELECT
                org.id,
                org.nombre_comercial::VARCHAR,
                v_snapshot_id,
                (SELECT s.total_productos FROM inventario_snapshots s WHERE s.id = v_snapshot_id),
                (SELECT s.tiempo_generacion_ms FROM inventario_snapshots s WHERE s.id = v_snapshot_id),
                'completo'::VARCHAR;

        EXCEPTION
            WHEN OTHERS THEN
                RETURN QUERY
                SELECT
                    org.id,
                    org.nombre_comercial::VARCHAR,
                    NULL::INTEGER,
                    0,
                    0,
                    ('error: ' || SQLERRM)::VARCHAR;
        END;
    END LOOP;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_snapshots_todas_organizaciones IS
'Genera snapshots de inventario para todas las organizaciones activas. Usado por pg_cron.';

-- ============================================================================
-- FUNCION: obtener_stock_en_fecha
-- Descripcion: Consulta el stock de productos en una fecha especifica
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_stock_en_fecha(
    p_organizacion_id INTEGER,
    p_fecha DATE,
    p_producto_id INTEGER DEFAULT NULL,
    p_categoria_id INTEGER DEFAULT NULL,
    p_solo_con_stock BOOLEAN DEFAULT FALSE,
    p_limite INTEGER DEFAULT 1000,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    producto_id INTEGER,
    producto_nombre VARCHAR,
    producto_sku VARCHAR,
    categoria_id INTEGER,
    categoria_nombre VARCHAR,
    variante_id INTEGER,
    variante_nombre VARCHAR,
    stock_snapshot INTEGER,
    stock_disponible INTEGER,
    reservas_activas INTEGER,
    costo_unitario DECIMAL,
    valor_total DECIMAL,
    stock_actual_hoy INTEGER,
    diferencia INTEGER
) AS $$
DECLARE
    v_snapshot_id INTEGER;
BEGIN
    -- Buscar snapshot de la fecha
    SELECT id INTO v_snapshot_id
    FROM inventario_snapshots
    WHERE organizacion_id = p_organizacion_id
      AND fecha_snapshot = p_fecha
      AND estado = 'completo';

    IF v_snapshot_id IS NULL THEN
        RAISE EXCEPTION 'No existe snapshot para la fecha % en esta organizacion', p_fecha;
    END IF;

    RETURN QUERY
    SELECT
        sl.producto_id,
        sl.producto_nombre,
        sl.producto_sku,
        sl.categoria_id,
        sl.categoria_nombre,
        sl.variante_id,
        sl.variante_nombre,
        sl.stock_actual,
        (sl.stock_actual - sl.reservas_activas)::INTEGER,
        sl.reservas_activas,
        sl.costo_unitario,
        (sl.costo_unitario * sl.stock_actual),
        -- Stock actual (hoy)
        COALESCE(
            CASE
                WHEN sl.variante_id IS NOT NULL THEN (SELECT v.stock_actual FROM variantes_producto v WHERE v.id = sl.variante_id)
                ELSE (SELECT p.stock_actual FROM productos p WHERE p.id = sl.producto_id)
            END,
            0
        )::INTEGER,
        -- Diferencia
        COALESCE(
            CASE
                WHEN sl.variante_id IS NOT NULL THEN (SELECT v.stock_actual FROM variantes_producto v WHERE v.id = sl.variante_id)
                ELSE (SELECT p.stock_actual FROM productos p WHERE p.id = sl.producto_id)
            END,
            0
        )::INTEGER - sl.stock_actual
    FROM inventario_snapshot_lineas sl
    WHERE sl.snapshot_id = v_snapshot_id
      AND (p_producto_id IS NULL OR sl.producto_id = p_producto_id)
      AND (p_categoria_id IS NULL OR sl.categoria_id = p_categoria_id)
      AND (NOT p_solo_con_stock OR sl.stock_actual > 0)
    ORDER BY sl.producto_nombre, sl.variante_nombre NULLS FIRST
    LIMIT p_limite
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_stock_en_fecha IS
'Consulta el stock de productos en una fecha historica. Compara con stock actual.';

-- ============================================================================
-- FUNCION: comparar_inventario_fechas
-- Descripcion: Compara inventario entre dos fechas
-- ============================================================================
CREATE OR REPLACE FUNCTION comparar_inventario_fechas(
    p_organizacion_id INTEGER,
    p_fecha_desde DATE,
    p_fecha_hasta DATE,
    p_solo_cambios BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    producto_id INTEGER,
    producto_nombre VARCHAR,
    producto_sku VARCHAR,
    variante_id INTEGER,
    variante_nombre VARCHAR,
    stock_fecha_desde INTEGER,
    stock_fecha_hasta INTEGER,
    diferencia INTEGER,
    porcentaje_cambio DECIMAL,
    valor_fecha_desde DECIMAL,
    valor_fecha_hasta DECIMAL,
    diferencia_valor DECIMAL
) AS $$
DECLARE
    v_snapshot_desde INTEGER;
    v_snapshot_hasta INTEGER;
BEGIN
    -- Buscar snapshots
    SELECT id INTO v_snapshot_desde
    FROM inventario_snapshots
    WHERE organizacion_id = p_organizacion_id AND fecha_snapshot = p_fecha_desde AND estado = 'completo';

    SELECT id INTO v_snapshot_hasta
    FROM inventario_snapshots
    WHERE organizacion_id = p_organizacion_id AND fecha_snapshot = p_fecha_hasta AND estado = 'completo';

    IF v_snapshot_desde IS NULL THEN
        RAISE EXCEPTION 'No existe snapshot para la fecha %', p_fecha_desde;
    END IF;

    IF v_snapshot_hasta IS NULL THEN
        RAISE EXCEPTION 'No existe snapshot para la fecha %', p_fecha_hasta;
    END IF;

    RETURN QUERY
    SELECT
        COALESCE(d.producto_id, h.producto_id),
        COALESCE(d.producto_nombre, h.producto_nombre),
        COALESCE(d.producto_sku, h.producto_sku),
        COALESCE(d.variante_id, h.variante_id),
        COALESCE(d.variante_nombre, h.variante_nombre),
        COALESCE(d.stock_actual, 0)::INTEGER,
        COALESCE(h.stock_actual, 0)::INTEGER,
        (COALESCE(h.stock_actual, 0) - COALESCE(d.stock_actual, 0))::INTEGER,
        CASE
            WHEN COALESCE(d.stock_actual, 0) = 0 THEN
                CASE WHEN COALESCE(h.stock_actual, 0) > 0 THEN 100.00 ELSE 0.00 END
            ELSE
                ROUND(((COALESCE(h.stock_actual, 0) - COALESCE(d.stock_actual, 0))::DECIMAL / d.stock_actual) * 100, 2)
        END,
        COALESCE(d.stock_actual * d.costo_unitario, 0),
        COALESCE(h.stock_actual * h.costo_unitario, 0),
        COALESCE(h.stock_actual * h.costo_unitario, 0) - COALESCE(d.stock_actual * d.costo_unitario, 0)
    FROM inventario_snapshot_lineas d
    FULL OUTER JOIN inventario_snapshot_lineas h
        ON d.producto_id = h.producto_id
        AND COALESCE(d.variante_id, 0) = COALESCE(h.variante_id, 0)
        AND h.snapshot_id = v_snapshot_hasta
    WHERE (d.snapshot_id = v_snapshot_desde OR d.snapshot_id IS NULL)
      AND (h.snapshot_id = v_snapshot_hasta OR h.snapshot_id IS NULL)
      AND (d.snapshot_id IS NOT NULL OR h.snapshot_id IS NOT NULL)
      AND (
          NOT p_solo_cambios
          OR COALESCE(d.stock_actual, 0) != COALESCE(h.stock_actual, 0)
      )
    ORDER BY
        ABS(COALESCE(h.stock_actual, 0) - COALESCE(d.stock_actual, 0)) DESC,
        COALESCE(d.producto_nombre, h.producto_nombre);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION comparar_inventario_fechas IS
'Compara el inventario entre dos fechas. Retorna diferencias de stock y valor.';

-- ============================================================================
-- FUNCION: limpiar_snapshots_antiguos
-- Descripcion: Elimina snapshots mayores a N dias (retencion configurable)
-- ============================================================================
CREATE OR REPLACE FUNCTION limpiar_snapshots_antiguos(
    p_dias_retencion INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
    v_eliminados INTEGER;
BEGIN
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Mantener snapshots de fin de mes indefinidamente
    DELETE FROM inventario_snapshots
    WHERE fecha_snapshot < CURRENT_DATE - p_dias_retencion
      AND tipo != 'cierre_mes'
      AND EXTRACT(DAY FROM fecha_snapshot + INTERVAL '1 day') != 1;

    GET DIAGNOSTICS v_eliminados = ROW_COUNT;

    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN v_eliminados;

EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION limpiar_snapshots_antiguos IS
'Elimina snapshots antiguos excepto los de cierre de mes. Default: 365 dias.';

-- ============================================================================
-- JOB PG_CRON: Generar snapshots diarios
-- Frecuencia: Todos los dias a las 00:05 AM
-- ============================================================================
SELECT cron.schedule(
    'generar-snapshots-inventario-diarios',
    '5 0 * * *',
    $$SELECT * FROM generar_snapshots_todas_organizaciones()$$
);

-- ============================================================================
-- JOB PG_CRON: Limpiar snapshots antiguos
-- Frecuencia: Primer domingo de cada mes a las 03:00 AM
-- ============================================================================
SELECT cron.schedule(
    'limpiar-snapshots-antiguos',
    '0 3 1-7 * 0',
    $$SELECT limpiar_snapshots_antiguos(365)$$
);

-- ============================================================================
-- VISTA: Snapshots disponibles
-- ============================================================================
CREATE OR REPLACE VIEW v_snapshots_disponibles AS
SELECT
    s.id,
    s.organizacion_id,
    o.nombre_comercial AS organizacion_nombre,
    s.fecha_snapshot,
    s.tipo,
    s.total_productos,
    s.total_unidades,
    s.valor_total,
    s.estado,
    s.creado_en
FROM inventario_snapshots s
JOIN organizaciones o ON o.id = s.organizacion_id
WHERE s.estado = 'completo'
ORDER BY s.fecha_snapshot DESC;

COMMENT ON VIEW v_snapshots_disponibles IS 'Lista de snapshots disponibles para consulta';

-- ============================================================================
-- VALIDACION
-- ============================================================================
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count
    FROM cron.job
    WHERE jobname IN ('generar-snapshots-inventario-diarios', 'limpiar-snapshots-antiguos');

    IF job_count < 2 THEN
        RAISE WARNING 'Algunos jobs de pg_cron no se crearon correctamente. Verifique manualmente.';
    ELSE
        RAISE NOTICE '  Jobs de Inventory at Date configurados correctamente';
        RAISE NOTICE '  Snapshot diario: 00:05 AM';
        RAISE NOTICE '  Limpieza mensual: Primer domingo del mes 03:00 AM';
    END IF;
END $$;

-- ============================================================================
-- FIN: INVENTORY AT DATE
-- ============================================================================

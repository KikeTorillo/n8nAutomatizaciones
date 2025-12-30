-- ============================================================================
-- MODULO: INVENTARIO - REORDEN AUTOMATICO
-- Descripcion: Sistema de evaluacion automatica de reglas de reabastecimiento
-- y generacion de ordenes de compra mediante pg_cron
-- Version: 1.0
-- Fecha: 29 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: reorden_logs
-- Descripcion: Auditoria de ejecuciones del job de reorden automatico
-- ============================================================================
CREATE TABLE IF NOT EXISTS reorden_logs (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Tipo de ejecucion
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN ('job_cron', 'manual')),

    -- Resultados
    reglas_evaluadas INTEGER DEFAULT 0,
    ordenes_generadas INTEGER DEFAULT 0,
    transferencias_generadas INTEGER DEFAULT 0,
    errores INTEGER DEFAULT 0,

    -- Detalles en JSONB para flexibilidad
    detalles JSONB DEFAULT '[]',
    errores_detalle JSONB DEFAULT '[]',

    -- Tiempos
    inicio_en TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fin_en TIMESTAMPTZ,
    duracion_ms INTEGER,

    -- Usuario (NULL si es job automatico)
    ejecutado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE reorden_logs IS 'Auditoria de ejecuciones del sistema de reorden automatico';
COMMENT ON COLUMN reorden_logs.tipo IS 'job_cron=ejecucion automatica, manual=ejecutado por usuario';
COMMENT ON COLUMN reorden_logs.detalles IS 'Array de OCs generadas con info del producto';
COMMENT ON COLUMN reorden_logs.errores_detalle IS 'Array de errores encontrados durante la ejecucion';

-- RLS
ALTER TABLE reorden_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY reorden_logs_select ON reorden_logs FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY reorden_logs_insert ON reorden_logs FOR INSERT WITH CHECK (true);

CREATE POLICY reorden_logs_update ON reorden_logs FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY reorden_logs_delete ON reorden_logs FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_reorden_logs_org ON reorden_logs(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_reorden_logs_fecha ON reorden_logs(inicio_en DESC);
CREATE INDEX IF NOT EXISTS idx_reorden_logs_tipo ON reorden_logs(tipo);

-- ============================================================================
-- FUNCION: generar_oc_desde_regla
-- Descripcion: Genera una OC en estado borrador para un producto especifico
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_oc_desde_regla(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER,
    p_cantidad INTEGER,
    p_proveedor_id INTEGER,
    p_regla_id INTEGER,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_orden_id INTEGER;
    v_producto RECORD;
BEGIN
    -- Obtener datos del producto
    SELECT id, nombre, sku, unidad_medida, precio_compra
    INTO v_producto
    FROM productos
    WHERE id = p_producto_id AND organizacion_id = p_organizacion_id;

    IF v_producto.id IS NULL THEN
        RAISE EXCEPTION 'Producto % no encontrado en organizacion %', p_producto_id, p_organizacion_id;
    END IF;

    -- Crear orden de compra (el folio se genera automaticamente por trigger)
    INSERT INTO ordenes_compra (
        organizacion_id,
        proveedor_id,
        estado,
        fecha_orden,
        usuario_id,
        notas
    ) VALUES (
        p_organizacion_id,
        p_proveedor_id,
        'borrador',
        CURRENT_DATE,
        p_usuario_id,
        'Generada automaticamente por regla de reabastecimiento #' || p_regla_id ||
        ' - Stock bajo detectado para: ' || v_producto.nombre
    ) RETURNING id INTO v_orden_id;

    -- Agregar item a la orden
    INSERT INTO ordenes_compra_items (
        orden_compra_id,
        producto_id,
        nombre_producto,
        sku,
        unidad_medida,
        cantidad_ordenada,
        precio_unitario
    ) VALUES (
        v_orden_id,
        p_producto_id,
        v_producto.nombre,
        v_producto.sku,
        COALESCE(v_producto.unidad_medida, 'unidad'),
        p_cantidad,
        COALESCE(v_producto.precio_compra, 0)
    );

    RETURN v_orden_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_oc_desde_regla IS 'Genera OC en borrador para un producto desde regla de reabastecimiento';

-- ============================================================================
-- FUNCION: evaluar_reglas_reorden
-- Descripcion: Evalua todas las reglas de reabastecimiento y genera OCs
-- Se ejecuta automaticamente via pg_cron o manualmente
-- ============================================================================
CREATE OR REPLACE FUNCTION evaluar_reglas_reorden(
    p_usuario_id INTEGER DEFAULT NULL,
    p_tipo VARCHAR(30) DEFAULT 'job_cron'
)
RETURNS TABLE (
    org_id INTEGER,
    org_nombre VARCHAR,
    reglas_evaluadas INTEGER,
    ordenes_generadas INTEGER,
    errores INTEGER
) AS $$
DECLARE
    org RECORD;
    regla RECORD;
    producto RECORD;
    v_reglas_evaluadas INTEGER;
    v_ordenes_generadas INTEGER;
    v_errores INTEGER;
    v_cantidad_ordenar INTEGER;
    v_proveedor_id INTEGER;
    v_orden_id INTEGER;
    v_inicio TIMESTAMPTZ;
    v_log_id INTEGER;
    v_detalles JSONB;
    v_errores_detalle JSONB;
    v_dia_actual INTEGER;
    v_stock_info RECORD;
BEGIN
    v_inicio := clock_timestamp();
    v_dia_actual := EXTRACT(ISODOW FROM NOW())::INTEGER; -- 1=Lun, 7=Dom

    -- Bypass RLS para operacion de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Para cada organizacion activa
    FOR org IN
        SELECT o.id, o.nombre_comercial
        FROM organizaciones o
        WHERE o.activo = true
    LOOP
        v_reglas_evaluadas := 0;
        v_ordenes_generadas := 0;
        v_errores := 0;
        v_detalles := '[]'::jsonb;
        v_errores_detalle := '[]'::jsonb;

        -- Evaluar reglas activas de esta organizacion
        FOR regla IN
            SELECT
                rr.*,
                ro.tipo as ruta_tipo,
                COALESCE(ro.proveedor_default_id, NULL) as ruta_proveedor_id
            FROM reglas_reabastecimiento rr
            JOIN rutas_operacion ro ON ro.id = rr.ruta_id
            WHERE rr.organizacion_id = org.id
              AND rr.activo = true
              AND ro.activo = true
              -- Verificar que es el dia correcto
              AND v_dia_actual = ANY(rr.dias_semana)
              -- Verificar frecuencia (no ejecutar si se ejecuto recientemente)
              AND (
                  rr.ultima_ejecucion IS NULL
                  OR rr.ultima_ejecucion < NOW() - (rr.frecuencia_horas || ' hours')::interval
              )
        LOOP
            v_reglas_evaluadas := v_reglas_evaluadas + 1;

            BEGIN
                -- Obtener productos que aplican a esta regla
                FOR producto IN
                    SELECT
                        p.id,
                        p.nombre,
                        p.sku,
                        p.stock_actual,
                        p.stock_minimo,
                        p.stock_maximo,
                        p.proveedor_id,
                        p.precio_compra,
                        p.cantidad_oc_sugerida
                    FROM productos p
                    WHERE p.organizacion_id = org.id
                      AND p.activo = true
                      -- Aplicar filtro segun tipo de regla
                      AND (
                          -- Regla para producto especifico
                          (regla.producto_id IS NOT NULL AND p.id = regla.producto_id)
                          -- Regla para categoria
                          OR (regla.categoria_id IS NOT NULL AND p.categoria_id = regla.categoria_id)
                          -- Regla global (aplica a todos)
                          OR (regla.producto_id IS NULL AND regla.categoria_id IS NULL)
                      )
                      -- Filtrar por sucursal si aplica
                      AND (regla.sucursal_id IS NULL OR p.sucursal_id = regla.sucursal_id)
                LOOP
                    -- Calcular stock proyectado
                    SELECT * INTO v_stock_info
                    FROM calcular_stock_proyectado(producto.id, org.id, regla.sucursal_id);

                    -- Verificar condicion de stock
                    IF (regla.usar_stock_proyectado AND v_stock_info.stock_proyectado <= regla.stock_minimo_trigger)
                       OR (NOT regla.usar_stock_proyectado AND producto.stock_actual <= regla.stock_minimo_trigger) THEN

                        -- Verificar que no tiene OC pendiente
                        IF v_stock_info.tiene_oc_pendiente THEN
                            CONTINUE; -- Ya tiene OC, saltar
                        END IF;

                        -- Calcular cantidad a ordenar
                        IF regla.cantidad_fija IS NOT NULL THEN
                            v_cantidad_ordenar := regla.cantidad_fija;
                        ELSIF regla.cantidad_hasta_maximo THEN
                            v_cantidad_ordenar := GREATEST(1, producto.stock_maximo - producto.stock_actual);
                        ELSE
                            v_cantidad_ordenar := COALESCE(
                                producto.cantidad_oc_sugerida,
                                GREATEST(1, producto.stock_maximo - producto.stock_actual),
                                50 -- Default
                            );
                        END IF;

                        -- Aplicar restricciones de cantidad
                        v_cantidad_ordenar := GREATEST(v_cantidad_ordenar, COALESCE(regla.cantidad_minima, 1));
                        IF regla.cantidad_maxima IS NOT NULL THEN
                            v_cantidad_ordenar := LEAST(v_cantidad_ordenar, regla.cantidad_maxima);
                        END IF;

                        -- Aplicar multiplo
                        IF regla.multiplo_de > 1 THEN
                            v_cantidad_ordenar := CEIL(v_cantidad_ordenar::NUMERIC / regla.multiplo_de) * regla.multiplo_de;
                        END IF;

                        -- Determinar proveedor (ruta > producto)
                        v_proveedor_id := COALESCE(regla.ruta_proveedor_id, producto.proveedor_id);

                        IF v_proveedor_id IS NULL THEN
                            v_errores := v_errores + 1;
                            v_errores_detalle := v_errores_detalle || jsonb_build_object(
                                'producto_id', producto.id,
                                'producto_nombre', producto.nombre,
                                'error', 'Sin proveedor asignado'
                            );
                            CONTINUE;
                        END IF;

                        -- Solo procesar rutas de compra (no transferencias por ahora)
                        IF regla.ruta_tipo = 'compra' THEN
                            -- Generar OC
                            v_orden_id := generar_oc_desde_regla(
                                org.id,
                                producto.id,
                                v_cantidad_ordenar,
                                v_proveedor_id,
                                regla.id,
                                p_usuario_id
                            );

                            v_ordenes_generadas := v_ordenes_generadas + 1;

                            v_detalles := v_detalles || jsonb_build_object(
                                'orden_id', v_orden_id,
                                'producto_id', producto.id,
                                'producto_nombre', producto.nombre,
                                'producto_sku', producto.sku,
                                'cantidad', v_cantidad_ordenar,
                                'proveedor_id', v_proveedor_id,
                                'stock_actual', producto.stock_actual,
                                'stock_proyectado', v_stock_info.stock_proyectado,
                                'regla_id', regla.id,
                                'regla_nombre', regla.nombre
                            );
                        END IF;

                    END IF;

                END LOOP; -- productos

            EXCEPTION WHEN OTHERS THEN
                v_errores := v_errores + 1;
                v_errores_detalle := v_errores_detalle || jsonb_build_object(
                    'regla_id', regla.id,
                    'regla_nombre', regla.nombre,
                    'error', SQLERRM
                );
            END;

            -- Actualizar ultima ejecucion de la regla
            UPDATE reglas_reabastecimiento
            SET ultima_ejecucion = NOW(),
                total_ejecuciones = total_ejecuciones + 1,
                total_ordenes_generadas = total_ordenes_generadas + v_ordenes_generadas,
                actualizado_en = NOW()
            WHERE id = regla.id;

        END LOOP; -- reglas

        -- Insertar log si hubo actividad
        IF v_reglas_evaluadas > 0 OR v_ordenes_generadas > 0 OR v_errores > 0 THEN
            INSERT INTO reorden_logs (
                organizacion_id, tipo, reglas_evaluadas, ordenes_generadas,
                transferencias_generadas, errores, detalles, errores_detalle,
                inicio_en, fin_en, duracion_ms, ejecutado_por
            ) VALUES (
                org.id, p_tipo, v_reglas_evaluadas, v_ordenes_generadas,
                0, v_errores, v_detalles, v_errores_detalle,
                v_inicio, NOW(),
                EXTRACT(EPOCH FROM (clock_timestamp() - v_inicio)) * 1000,
                p_usuario_id
            ) RETURNING id INTO v_log_id;

            -- Crear notificacion si se generaron ordenes
            IF v_ordenes_generadas > 0 THEN
                -- Notificar a admins de la organizacion
                INSERT INTO notificaciones (
                    organizacion_id,
                    usuario_id,
                    tipo,
                    categoria,
                    titulo,
                    mensaje,
                    nivel,
                    icono,
                    url_accion,
                    datos
                )
                SELECT
                    org.id,
                    u.id,
                    'sistema',
                    'inventario',
                    'Reorden Automatico Ejecutado',
                    'Se generaron ' || v_ordenes_generadas || ' orden(es) de compra automaticamente por stock bajo.',
                    'info',
                    'refresh-cw',
                    '/inventario/ordenes-compra',
                    jsonb_build_object(
                        'log_id', v_log_id,
                        'ordenes_generadas', v_ordenes_generadas,
                        'detalles', v_detalles
                    )
                FROM usuarios u
                WHERE u.organizacion_id = org.id
                  AND u.rol IN ('admin', 'propietario', 'super_admin')
                  AND u.activo = true;
            END IF;
        END IF;

        -- Retornar resultado de esta organizacion
        org_id := org.id;
        org_nombre := org.nombre_comercial;
        reglas_evaluadas := v_reglas_evaluadas;
        ordenes_generadas := v_ordenes_generadas;
        errores := v_errores;
        RETURN NEXT;

    END LOOP; -- organizaciones

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION evaluar_reglas_reorden IS 'Evalua reglas de reabastecimiento y genera OCs automaticamente. Ejecutar via pg_cron o manualmente.';

-- ============================================================================
-- FUNCION: ejecutar_reorden_manual
-- Descripcion: Wrapper para ejecucion manual con mejor formato de retorno
-- ============================================================================
CREATE OR REPLACE FUNCTION ejecutar_reorden_manual(
    p_organizacion_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS TABLE (
    exito BOOLEAN,
    reglas_evaluadas INTEGER,
    ordenes_generadas INTEGER,
    errores INTEGER,
    mensaje TEXT,
    detalles JSONB
) AS $$
DECLARE
    v_resultado RECORD;
    v_reglas INTEGER := 0;
    v_ordenes INTEGER := 0;
    v_errores INTEGER := 0;
BEGIN
    -- Bypass RLS
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Ejecutar evaluacion solo para esta organizacion
    FOR v_resultado IN
        SELECT * FROM evaluar_reglas_reorden(p_usuario_id, 'manual')
        WHERE evaluar_reglas_reorden.org_id = p_organizacion_id
    LOOP
        v_reglas := v_resultado.reglas_evaluadas;
        v_ordenes := v_resultado.ordenes_generadas;
        v_errores := v_resultado.errores;
    END LOOP;

    -- Limpiar bypass
    PERFORM set_config('app.bypass_rls', 'false', true);

    -- Obtener detalles del ultimo log
    RETURN QUERY
    SELECT
        true,
        v_reglas,
        v_ordenes,
        v_errores,
        CASE
            WHEN v_ordenes > 0 THEN 'Se generaron ' || v_ordenes || ' orden(es) de compra'
            WHEN v_reglas = 0 THEN 'No hay reglas activas para evaluar'
            ELSE 'No se generaron ordenes (productos con stock suficiente o ya tienen OC pendiente)'
        END,
        COALESCE(
            (SELECT rl.detalles FROM reorden_logs rl
             WHERE rl.organizacion_id = p_organizacion_id
             ORDER BY rl.creado_en DESC LIMIT 1),
            '[]'::jsonb
        );

EXCEPTION
    WHEN OTHERS THEN
        PERFORM set_config('app.bypass_rls', 'false', true);
        RETURN QUERY SELECT false, 0, 0, 1, SQLERRM, '[]'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION ejecutar_reorden_manual IS 'Ejecuta evaluacion de reorden para una organizacion especifica';

-- ============================================================================
-- FUNCION: obtener_productos_bajo_minimo
-- Descripcion: Obtiene productos que necesitan reabastecimiento
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_productos_bajo_minimo(
    p_organizacion_id INTEGER,
    p_solo_sin_oc BOOLEAN DEFAULT true
)
RETURNS TABLE (
    producto_id INTEGER,
    producto_nombre VARCHAR,
    producto_sku VARCHAR,
    categoria_nombre VARCHAR,
    proveedor_nombre VARCHAR,
    proveedor_id INTEGER,
    stock_actual INTEGER,
    stock_minimo INTEGER,
    stock_maximo INTEGER,
    stock_proyectado INTEGER,
    cantidad_sugerida INTEGER,
    tiene_oc_pendiente BOOLEAN,
    oc_pendiente_folio TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.nombre,
        p.sku,
        c.nombre as categoria_nombre,
        prov.nombre as proveedor_nombre,
        p.proveedor_id,
        p.stock_actual,
        p.stock_minimo,
        p.stock_maximo,
        csp.stock_proyectado,
        COALESCE(p.cantidad_oc_sugerida, GREATEST(1, p.stock_maximo - p.stock_actual))::INTEGER as cantidad_sugerida,
        csp.tiene_oc_pendiente,
        csp.oc_pendiente_folio
    FROM productos p
    LEFT JOIN categorias_productos c ON c.id = p.categoria_id
    LEFT JOIN proveedores prov ON prov.id = p.proveedor_id
    CROSS JOIN LATERAL calcular_stock_proyectado(p.id, p_organizacion_id, NULL) csp
    WHERE p.organizacion_id = p_organizacion_id
      AND p.activo = true
      AND (
          p.stock_actual <= p.stock_minimo
          OR csp.stock_proyectado <= p.stock_minimo
      )
      AND (NOT p_solo_sin_oc OR NOT csp.tiene_oc_pendiente)
    ORDER BY
        (p.stock_actual::FLOAT / NULLIF(p.stock_minimo, 0)) ASC NULLS FIRST,
        p.nombre ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_productos_bajo_minimo IS 'Lista productos con stock bajo para dashboard de reorden';

-- ============================================================================
-- FUNCION: obtener_dashboard_reorden
-- Descripcion: Metricas consolidadas para dashboard de reorden
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_dashboard_reorden(p_organizacion_id INTEGER)
RETURNS TABLE (
    total_reglas_activas INTEGER,
    total_productos_bajo_minimo INTEGER,
    total_productos_sin_oc INTEGER,
    ordenes_generadas_hoy INTEGER,
    ordenes_generadas_semana INTEGER,
    ordenes_generadas_mes INTEGER,
    ultima_ejecucion TIMESTAMPTZ,
    proxima_ejecucion_estimada TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        -- Reglas activas
        (SELECT COUNT(*)::INTEGER FROM reglas_reabastecimiento
         WHERE organizacion_id = p_organizacion_id AND activo = true),

        -- Productos bajo minimo (total)
        (SELECT COUNT(*)::INTEGER FROM productos p
         WHERE p.organizacion_id = p_organizacion_id
           AND p.activo = true
           AND p.stock_actual <= p.stock_minimo),

        -- Productos bajo minimo sin OC pendiente
        (SELECT COUNT(*)::INTEGER FROM obtener_productos_bajo_minimo(p_organizacion_id, true)),

        -- OCs generadas hoy
        (SELECT COALESCE(SUM(ordenes_generadas), 0)::INTEGER FROM reorden_logs
         WHERE organizacion_id = p_organizacion_id
           AND inicio_en >= CURRENT_DATE),

        -- OCs generadas esta semana
        (SELECT COALESCE(SUM(ordenes_generadas), 0)::INTEGER FROM reorden_logs
         WHERE organizacion_id = p_organizacion_id
           AND inicio_en >= date_trunc('week', CURRENT_DATE)),

        -- OCs generadas este mes
        (SELECT COALESCE(SUM(ordenes_generadas), 0)::INTEGER FROM reorden_logs
         WHERE organizacion_id = p_organizacion_id
           AND inicio_en >= date_trunc('month', CURRENT_DATE)),

        -- Ultima ejecucion
        (SELECT MAX(inicio_en) FROM reorden_logs
         WHERE organizacion_id = p_organizacion_id),

        -- Proxima ejecucion (estimada: proximo dia a las 6:00 AM)
        (CURRENT_DATE + 1 + INTERVAL '6 hours')::TIMESTAMPTZ;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_dashboard_reorden IS 'Metricas consolidadas para dashboard de reorden automatico';

-- ============================================================================
-- JOB PG_CRON: Evaluacion automatica diaria
-- ============================================================================
-- Primero eliminar si existe
SELECT cron.unschedule('evaluar-reglas-reorden')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'evaluar-reglas-reorden');

-- Crear job: 6:00 AM todos los dias
SELECT cron.schedule(
    'evaluar-reglas-reorden',
    '0 6 * * *',
    $$SELECT * FROM evaluar_reglas_reorden(NULL, 'job_cron')$$
);

-- ============================================================================
-- VISTA: Estado del job de reorden
-- ============================================================================
CREATE OR REPLACE VIEW v_estado_job_reorden AS
SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.active,
    j.database,
    (SELECT MAX(inicio_en) FROM reorden_logs) as ultima_ejecucion_global,
    (SELECT SUM(ordenes_generadas) FROM reorden_logs WHERE inicio_en > NOW() - INTERVAL '24 hours') as ordenes_ultimas_24h,
    (SELECT SUM(errores) FROM reorden_logs WHERE inicio_en > NOW() - INTERVAL '24 hours') as errores_ultimas_24h
FROM cron.job j
WHERE j.jobname = 'evaluar-reglas-reorden';

COMMENT ON VIEW v_estado_job_reorden IS 'Estado del job de reorden automatico con metricas';

-- ============================================================================
-- VALIDACION: Verificar que el job se creo correctamente
-- ============================================================================
DO $$
DECLARE
    v_job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_job_count
    FROM cron.job WHERE jobname = 'evaluar-reglas-reorden';

    IF v_job_count = 0 THEN
        RAISE WARNING 'Job evaluar-reglas-reorden NO se creo. Verificar extension pg_cron.';
    ELSE
        RAISE NOTICE 'Job evaluar-reglas-reorden creado correctamente (6:00 AM diario)';
    END IF;
END $$;

-- ============================================================================
-- FIN: REORDEN AUTOMATICO
-- ============================================================================

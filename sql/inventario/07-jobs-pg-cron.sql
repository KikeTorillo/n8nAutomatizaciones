-- ============================================================================
-- MÓDULO: INVENTARIO - JOBS PG_CRON
-- Descripción: Jobs automáticos para alertas de productos sin movimiento
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- FUNCIÓN: Generar alertas de productos sin movimiento
-- Descripción: Itera sobre todas las organizaciones y genera alertas para productos sin movimientos en 90+ días
-- ============================================================================

CREATE OR REPLACE FUNCTION generar_alertas_productos_sin_movimiento()
RETURNS VOID AS $$
DECLARE
    org RECORD;
    producto RECORD;
BEGIN
    -- Bypass RLS para operación de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Para cada organización activa
    FOR org IN
        SELECT id FROM organizaciones WHERE activo = true
    LOOP
        -- Para cada producto sin movimiento
        FOR producto IN
            SELECT
                p.id,
                p.nombre,
                p.stock_actual,
                (p.stock_actual * p.precio_compra) as valor_inventario,
                COALESCE(DATE_PART('day', NOW() - MAX(m.creado_en)), 999999) as dias_sin_movimiento
            FROM productos p
            LEFT JOIN movimientos_inventario m ON m.producto_id = p.id
            WHERE p.organizacion_id = org.id
              AND p.activo = true
            GROUP BY p.id, p.nombre, p.stock_actual, p.precio_compra
            HAVING COALESCE(DATE_PART('day', NOW() - MAX(m.creado_en)), 999999) >= 90
            ORDER BY dias_sin_movimiento DESC
        LOOP
            -- Insertar alerta (ON CONFLICT evita duplicados)
            INSERT INTO alertas_inventario (
                organizacion_id,
                producto_id,
                tipo_alerta,
                mensaje,
                nivel
            )
            VALUES (
                org.id,
                producto.id,
                'sin_movimiento',
                'Producto "' || producto.nombre || '" sin movimientos en ' ||
                ROUND(producto.dias_sin_movimiento) || ' días (stock: ' ||
                producto.stock_actual || ', valor: $' || ROUND(producto.valor_inventario, 2) || ')',
                'info'
            )
            ON CONFLICT (producto_id, tipo_alerta, (extraer_fecha_immutable(creado_en)))
            DO NOTHING;
        END LOOP;
    END LOOP;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

EXCEPTION
    WHEN OTHERS THEN
        -- Garantizar limpieza de RLS en caso de error
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION generar_alertas_productos_sin_movimiento IS 'Función que genera alertas semanales de productos sin movimiento en 90+ días';

-- ============================================================================
-- JOB: Generar alertas de productos sin movimiento
-- Frecuencia: Cada domingo a las 02:00 AM
-- Descripción: Genera alertas para productos sin movimientos en 90+ días
-- ============================================================================

SELECT cron.schedule(
    'generar-alertas-sin-movimiento',
    '0 2 * * 0', -- Domingos a las 02:00 AM
    $$SELECT generar_alertas_productos_sin_movimiento()$$
);

-- ============================================================================
-- VISTA: Monitoreo del job de alertas sin movimiento
-- ============================================================================

CREATE OR REPLACE VIEW ver_estado_job_alertas_sin_movimiento AS
SELECT
    jobid,
    jobname,
    schedule,
    active,
    database,
    username,
    nodename,
    nodeport
FROM cron.job
WHERE jobname = 'generar-alertas-sin-movimiento';

COMMENT ON VIEW ver_estado_job_alertas_sin_movimiento IS 'Vista para monitorear el job de alertas de productos sin movimiento';

-- ============================================================================
-- VALIDACIÓN: Verificar que el job se creó correctamente
-- ============================================================================

DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count
    FROM cron.job
    WHERE jobname = 'generar-alertas-sin-movimiento';

    IF job_count = 0 THEN
        RAISE EXCEPTION '❌ Error: Job generar-alertas-sin-movimiento no se creó correctamente';
    ELSE
        RAISE NOTICE '✅ Job generar-alertas-sin-movimiento creado correctamente';
        RAISE NOTICE 'ℹ️  Frecuencia: Domingos a las 02:00 AM';
        RAISE NOTICE 'ℹ️  Umbral: 90 días sin movimientos';
        RAISE NOTICE 'ℹ️  Monitoreo: SELECT * FROM ver_estado_job_alertas_sin_movimiento;';
    END IF;
END $$;

-- ============================================================================
-- FIN: JOBS PG_CRON DE INVENTARIO
-- ============================================================================

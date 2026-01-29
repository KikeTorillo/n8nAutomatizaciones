-- ============================================================================
-- MODULO: INVENTARIO - JOB VALIDACION SINCRONIZACION STOCK
-- Descripcion: Job pg_cron para detectar y corregir desincronizacion de stock
-- Version: 1.0
-- Fecha: 29 Enero 2026
-- ============================================================================
-- PROPOSITO:
--   Detectar discrepancias entre productos.stock_actual y SUM(stock_ubicaciones)
--   Auto-corregir llamando a sincronizar_stock_producto()
--   Registrar historial para auditoria
-- ============================================================================

-- ============================================================================
-- TABLA: auditoria_sincronizacion_stock
-- Descripcion: Historial de correcciones automaticas de stock
-- ============================================================================
CREATE TABLE IF NOT EXISTS auditoria_sincronizacion_stock (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    nombre_producto VARCHAR(255),
    stock_actual_antes INTEGER NOT NULL,
    stock_ubicaciones BIGINT NOT NULL,
    diferencia BIGINT NOT NULL,
    corregido BOOLEAN DEFAULT false,
    stock_actual_despues INTEGER,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_sync_stock_org
ON auditoria_sincronizacion_stock(organizacion_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_sync_stock_producto
ON auditoria_sincronizacion_stock(producto_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_sync_stock_fecha
ON auditoria_sincronizacion_stock(creado_en DESC);

-- RLS para la tabla de auditoria
ALTER TABLE auditoria_sincronizacion_stock ENABLE ROW LEVEL SECURITY;

CREATE POLICY auditoria_sync_stock_org_policy ON auditoria_sincronizacion_stock
    FOR ALL
    USING (
        organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_organization_id', true), '')::INTEGER,
            0
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

COMMENT ON TABLE auditoria_sincronizacion_stock IS 'Historial de correcciones automaticas de sincronizacion de stock';

-- ============================================================================
-- FUNCION: validar_sincronizacion_stock
-- Descripcion: Detecta productos con stock desincronizado
-- Retorna: Tabla con productos que tienen discrepancias
-- ============================================================================
CREATE OR REPLACE FUNCTION validar_sincronizacion_stock()
RETURNS TABLE(
    organizacion_id INTEGER,
    producto_id INTEGER,
    nombre TEXT,
    stock_actual INTEGER,
    stock_ubicaciones BIGINT,
    diferencia BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.organizacion_id,
        p.id,
        p.nombre::TEXT,
        p.stock_actual,
        COALESCE(SUM(su.cantidad), 0)::BIGINT as stock_ubicaciones,
        (p.stock_actual - COALESCE(SUM(su.cantidad), 0))::BIGINT as diferencia
    FROM productos p
    LEFT JOIN stock_ubicaciones su ON su.producto_id = p.id
    WHERE p.activo = true
    GROUP BY p.organizacion_id, p.id, p.nombre, p.stock_actual
    HAVING p.stock_actual != COALESCE(SUM(su.cantidad), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_sincronizacion_stock IS 'Detecta productos con stock_actual desincronizado de stock_ubicaciones';

-- ============================================================================
-- FUNCION: ejecutar_validacion_stock_diaria
-- Descripcion: Ejecuta validacion, registra discrepancias y auto-corrige
-- Retorna: Numero de productos corregidos
-- ============================================================================
CREATE OR REPLACE FUNCTION ejecutar_validacion_stock_diaria()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
    v_stock_nuevo INTEGER;
BEGIN
    -- Bypass RLS para operacion de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    FOR r IN SELECT * FROM validar_sincronizacion_stock() LOOP
        -- Registrar discrepancia en auditoria
        INSERT INTO auditoria_sincronizacion_stock (
            organizacion_id,
            producto_id,
            nombre_producto,
            stock_actual_antes,
            stock_ubicaciones,
            diferencia
        ) VALUES (
            r.organizacion_id,
            r.producto_id,
            r.nombre,
            r.stock_actual,
            r.stock_ubicaciones,
            r.diferencia
        );

        -- Auto-corregir llamando a sincronizar_stock_producto
        v_stock_nuevo := sincronizar_stock_producto(r.producto_id);

        -- Actualizar registro con resultado de correccion
        UPDATE auditoria_sincronizacion_stock
        SET corregido = true,
            stock_actual_despues = v_stock_nuevo
        WHERE producto_id = r.producto_id
          AND creado_en > NOW() - INTERVAL '1 minute'
          AND corregido = false;

        v_count := v_count + 1;

        -- Log para debugging (visible en cron.job_run_details)
        RAISE NOTICE 'Corregido producto ID % (%): % -> %',
            r.producto_id, r.nombre, r.stock_actual, v_stock_nuevo;
    END LOOP;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    -- Log resumen
    IF v_count > 0 THEN
        RAISE NOTICE 'Validacion stock completada: % productos corregidos', v_count;
    ELSE
        RAISE NOTICE 'Validacion stock completada: Sin discrepancias';
    END IF;

    RETURN v_count;

EXCEPTION
    WHEN OTHERS THEN
        -- Garantizar limpieza de RLS en caso de error
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION ejecutar_validacion_stock_diaria IS 'Ejecuta validacion diaria de stock, registra y corrige discrepancias';

-- ============================================================================
-- JOB: Validacion diaria de sincronizacion de stock
-- Frecuencia: Diario a las 04:00 AM
-- Descripcion: Detecta y corrige desincronizacion entre productos.stock_actual
--              y SUM(stock_ubicaciones.cantidad)
-- ============================================================================

-- Eliminar job existente si existe (para recrear con config actualizada)
SELECT cron.unschedule('validar-sincronizacion-stock')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'validar-sincronizacion-stock');

SELECT cron.schedule(
    'validar-sincronizacion-stock',
    '0 4 * * *', -- Diario a las 04:00 AM
    $$SELECT ejecutar_validacion_stock_diaria()$$
);

-- ============================================================================
-- VISTA: Monitoreo del job de validacion de stock
-- ============================================================================
CREATE OR REPLACE VIEW ver_estado_job_validacion_stock AS
SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.active,
    j.database,
    j.username,
    (SELECT MAX(start_time) FROM cron.job_run_details WHERE jobid = j.jobid) as ultima_ejecucion,
    (SELECT status FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as ultimo_estado
FROM cron.job j
WHERE j.jobname = 'validar-sincronizacion-stock';

COMMENT ON VIEW ver_estado_job_validacion_stock IS 'Vista para monitorear el job de validacion de sincronizacion de stock';

-- ============================================================================
-- VISTA: Resumen de correcciones de stock
-- ============================================================================
CREATE OR REPLACE VIEW ver_resumen_correcciones_stock AS
SELECT
    DATE(creado_en) as fecha,
    COUNT(*) as total_correcciones,
    COUNT(*) FILTER (WHERE corregido = true) as exitosas,
    COUNT(*) FILTER (WHERE corregido = false) as fallidas,
    SUM(ABS(diferencia)) as unidades_ajustadas
FROM auditoria_sincronizacion_stock
GROUP BY DATE(creado_en)
ORDER BY fecha DESC
LIMIT 30;

COMMENT ON VIEW ver_resumen_correcciones_stock IS 'Resumen de correcciones de stock de los ultimos 30 dias';

-- ============================================================================
-- VALIDACION: Verificar que el job se creo correctamente
-- ============================================================================
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count
    FROM cron.job
    WHERE jobname = 'validar-sincronizacion-stock';

    IF job_count = 0 THEN
        RAISE EXCEPTION 'Error: Job validar-sincronizacion-stock no se creo correctamente';
    ELSE
        RAISE NOTICE 'Job validar-sincronizacion-stock creado correctamente';
        RAISE NOTICE 'Frecuencia: Diario a las 04:00 AM';
        RAISE NOTICE 'Tabla auditoria: auditoria_sincronizacion_stock';
        RAISE NOTICE 'Monitoreo: SELECT * FROM ver_estado_job_validacion_stock;';
        RAISE NOTICE 'Historial: SELECT * FROM ver_resumen_correcciones_stock;';
    END IF;
END $$;

-- ============================================================================
-- FIN: JOB VALIDACION SINCRONIZACION STOCK
-- ============================================================================

-- ============================================================================
-- MODULO: INVENTARIO - JOB EXPIRACION DE RESERVAS DE STOCK
-- Descripcion: Job pg_cron para expirar reservas vencidas y liberar stock
-- Version: 1.0
-- Fecha: 30 Enero 2026
-- ============================================================================
-- PROPOSITO:
--   Liberar automaticamente reservas de stock cuyo tiempo ha expirado
--   Se ejecuta cada 5 minutos para mantener el stock disponible actualizado
--   Registrar historial para auditoria
-- ============================================================================

-- ============================================================================
-- TABLA: auditoria_expiracion_reservas
-- Descripcion: Historial de reservas expiradas automaticamente
-- ============================================================================
CREATE TABLE IF NOT EXISTS auditoria_expiracion_reservas (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id),
    reserva_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL,
    tipo_origen VARCHAR(50) NOT NULL,
    origen_id INTEGER,
    origen_referencia VARCHAR(100),
    expiraba_en TIMESTAMPTZ NOT NULL,
    tiempo_vencida_minutos INTEGER,
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para consultas de auditoria
CREATE INDEX IF NOT EXISTS idx_auditoria_exp_reservas_org
ON auditoria_expiracion_reservas(organizacion_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_exp_reservas_fecha
ON auditoria_expiracion_reservas(creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_auditoria_exp_reservas_tipo
ON auditoria_expiracion_reservas(tipo_origen, creado_en DESC);

-- RLS para la tabla de auditoria
ALTER TABLE auditoria_expiracion_reservas ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS auditoria_exp_reservas_org_policy ON auditoria_expiracion_reservas;
CREATE POLICY auditoria_exp_reservas_org_policy ON auditoria_expiracion_reservas
    FOR ALL
    USING (
        organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_organization_id', true), '')::INTEGER,
            0
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

COMMENT ON TABLE auditoria_expiracion_reservas IS 'Historial de reservas expiradas automaticamente por el job de expiracion';

-- ============================================================================
-- FUNCION: expirar_reservas_pendientes
-- Descripcion: Marca como expiradas las reservas vencidas
-- Retorna: Numero de reservas expiradas
-- ============================================================================
CREATE OR REPLACE FUNCTION expirar_reservas_pendientes()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
    r RECORD;
    v_tiempo_vencida INTEGER;
BEGIN
    -- Bypass RLS para operacion de sistema
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- Procesar reservas vencidas
    FOR r IN
        SELECT
            id,
            organizacion_id,
            producto_id,
            variante_id,
            cantidad,
            tipo_origen,
            origen_id,
            origen_referencia,
            expira_en
        FROM reservas_stock
        WHERE estado = 'activa'
          AND expira_en < NOW()
        ORDER BY expira_en ASC -- Procesar las mas antiguas primero
        FOR UPDATE SKIP LOCKED  -- Evitar bloqueos con otras operaciones
    LOOP
        -- Calcular tiempo vencida en minutos
        v_tiempo_vencida := EXTRACT(EPOCH FROM (NOW() - r.expira_en)) / 60;

        -- Registrar en auditoria antes de modificar
        INSERT INTO auditoria_expiracion_reservas (
            organizacion_id,
            reserva_id,
            producto_id,
            variante_id,
            cantidad,
            tipo_origen,
            origen_id,
            origen_referencia,
            expiraba_en,
            tiempo_vencida_minutos
        ) VALUES (
            r.organizacion_id,
            r.id,
            r.producto_id,
            r.variante_id,
            r.cantidad,
            r.tipo_origen,
            r.origen_id,
            r.origen_referencia,
            r.expira_en,
            v_tiempo_vencida
        );

        -- Marcar reserva como expirada
        UPDATE reservas_stock
        SET estado = 'expirada',
            liberada_en = NOW(),
            motivo_liberacion = 'Expiracion automatica por job pg_cron'
        WHERE id = r.id;

        v_count := v_count + 1;

        -- Log para debugging
        RAISE NOTICE 'Reserva ID % expirada: producto=%, cantidad=%, vencida hace % min',
            r.id, r.producto_id, r.cantidad, v_tiempo_vencida;
    END LOOP;

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    -- Log resumen
    IF v_count > 0 THEN
        RAISE NOTICE 'Expiracion reservas completada: % reservas expiradas', v_count;
    END IF;

    RETURN v_count;

EXCEPTION
    WHEN OTHERS THEN
        -- Garantizar limpieza de RLS en caso de error
        PERFORM set_config('app.bypass_rls', 'false', true);
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION expirar_reservas_pendientes IS 'Expira reservas vencidas y registra en auditoria. Usa SKIP LOCKED para evitar bloqueos.';

-- ============================================================================
-- JOB: Expiracion de reservas cada 5 minutos
-- Frecuencia: Cada 5 minutos
-- Descripcion: Libera reservas de stock vencidas para que el stock
--              quede disponible nuevamente
-- ============================================================================

-- Eliminar job existente si existe (para recrear con config actualizada)
SELECT cron.unschedule('expirar-reservas-stock')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'expirar-reservas-stock');

SELECT cron.schedule(
    'expirar-reservas-stock',
    '*/5 * * * *', -- Cada 5 minutos
    $$SELECT expirar_reservas_pendientes()$$
);

-- ============================================================================
-- VISTA: Monitoreo del job de expiracion de reservas
-- ============================================================================
CREATE OR REPLACE VIEW ver_estado_job_expirar_reservas AS
SELECT
    j.jobid,
    j.jobname,
    j.schedule,
    j.active,
    j.database,
    j.username,
    (SELECT MAX(start_time) FROM cron.job_run_details WHERE jobid = j.jobid) as ultima_ejecucion,
    (SELECT status FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as ultimo_estado,
    (SELECT return_message FROM cron.job_run_details WHERE jobid = j.jobid ORDER BY start_time DESC LIMIT 1) as ultimo_resultado
FROM cron.job j
WHERE j.jobname = 'expirar-reservas-stock';

COMMENT ON VIEW ver_estado_job_expirar_reservas IS 'Vista para monitorear el job de expiracion de reservas';

-- ============================================================================
-- VISTA: Resumen de reservas expiradas
-- ============================================================================
CREATE OR REPLACE VIEW ver_resumen_reservas_expiradas AS
SELECT
    DATE(creado_en) as fecha,
    tipo_origen,
    COUNT(*) as total_expiradas,
    SUM(cantidad) as unidades_liberadas,
    AVG(tiempo_vencida_minutos)::INTEGER as promedio_minutos_vencidas
FROM auditoria_expiracion_reservas
WHERE creado_en >= NOW() - INTERVAL '7 days'
GROUP BY DATE(creado_en), tipo_origen
ORDER BY fecha DESC, total_expiradas DESC;

COMMENT ON VIEW ver_resumen_reservas_expiradas IS 'Resumen de reservas expiradas de los ultimos 7 dias por tipo de origen';

-- ============================================================================
-- VISTA: Reservas proximas a expirar (alerta)
-- ============================================================================
CREATE OR REPLACE VIEW ver_reservas_proximas_expirar AS
SELECT
    r.id,
    r.organizacion_id,
    r.producto_id,
    p.nombre as producto_nombre,
    r.variante_id,
    v.nombre_variante,
    r.cantidad,
    r.tipo_origen,
    r.origen_referencia,
    r.expira_en,
    EXTRACT(EPOCH FROM (r.expira_en - NOW())) / 60 as minutos_restantes
FROM reservas_stock r
JOIN productos p ON p.id = r.producto_id
LEFT JOIN variantes_producto v ON v.id = r.variante_id
WHERE r.estado = 'activa'
  AND r.expira_en <= NOW() + INTERVAL '15 minutes'
ORDER BY r.expira_en ASC;

COMMENT ON VIEW ver_reservas_proximas_expirar IS 'Reservas activas que expiraran en los proximos 15 minutos';

-- ============================================================================
-- VALIDACION: Verificar que el job se creo correctamente
-- ============================================================================
DO $$
DECLARE
    job_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO job_count
    FROM cron.job
    WHERE jobname = 'expirar-reservas-stock';

    IF job_count = 0 THEN
        RAISE EXCEPTION 'Error: Job expirar-reservas-stock no se creo correctamente';
    ELSE
        RAISE NOTICE 'Job expirar-reservas-stock creado correctamente';
        RAISE NOTICE 'Frecuencia: Cada 5 minutos';
        RAISE NOTICE 'Tabla auditoria: auditoria_expiracion_reservas';
        RAISE NOTICE 'Monitoreo: SELECT * FROM ver_estado_job_expirar_reservas;';
        RAISE NOTICE 'Historial: SELECT * FROM ver_resumen_reservas_expiradas;';
        RAISE NOTICE 'Alertas: SELECT * FROM ver_reservas_proximas_expirar;';
    END IF;
END $$;

-- ============================================================================
-- FIN: JOB EXPIRACION DE RESERVAS DE STOCK
-- ============================================================================

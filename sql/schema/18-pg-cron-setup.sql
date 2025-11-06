-- ====================================================================
-- ⏰ CONFIGURACIÓN DE PG_CRON PARA MANTENIMIENTO AUTOMÁTICO
-- ====================================================================
-- Archivo: schema/18-pg-cron-setup.sql
-- Descripción: Instala y configura pg_cron para ejecutar mantenimiento
--              automático de particiones mensualmente
-- Orden de Ejecución: #18 (Después de maintenance-functions)
--
-- REQUISITOS PREVIOS:
-- 1. Instalar pg_cron en el sistema:
--    - Debian/Ubuntu: apt-get install postgresql-17-cron
--    - Docker: agregar al Dockerfile o usar imagen con pg_cron
--
-- 2. Configurar postgresql.conf:
--    shared_preload_libraries = 'pg_cron'
--
-- 3. La configuración de cron.database_name se hace en Dockerfile.postgres
--    apuntando a 'postgres' que es la base de datos principal ($POSTGRES_DB)
--    donde se instala toda la aplicación SaaS.
-- ====================================================================

-- ====================================================================
-- 📦 INSTALACIÓN DE LA EXTENSIÓN PG_CRON
-- ====================================================================
-- Crear la extensión si no existe
-- NOTA: Debe ejecutarse como superusuario (postgres)
-- ====================================================================

CREATE EXTENSION IF NOT EXISTS pg_cron;

-- NOTA: cron.database_name se configura en Dockerfile.postgres como 'postgres'
-- La extensión pg_cron se instala en la base de datos principal 'postgres' ($POSTGRES_DB)
-- donde reside todo el schema del SaaS multi-tenant

COMMENT ON EXTENSION pg_cron IS
'Extensión para programar jobs cron dentro de PostgreSQL.
Permite ejecutar funciones SQL de forma programada sin depender del cron del sistema.';

-- ====================================================================
-- 🔐 PERMISOS PARA EL USUARIO DE APLICACIÓN
-- ====================================================================
-- Permitir que saas_app pueda ver y gestionar jobs (solo lectura)
-- Los jobs se crean como superusuario pero saas_app puede consultarlos
-- ====================================================================

GRANT USAGE ON SCHEMA cron TO saas_app;
GRANT SELECT ON cron.job TO saas_app;

COMMENT ON SCHEMA cron IS
'Schema de pg_cron para gestión de jobs programados.
Usuario saas_app tiene permisos de solo lectura para monitoreo.';

-- ====================================================================
-- ⏰ CONFIGURACIÓN DE JOBS DE MANTENIMIENTO
-- ====================================================================
-- Jobs programados para mantenimiento automático de particiones
-- Ejecutados como usuario postgres (superusuario)
-- ====================================================================

-- ────────────────────────────────────────────────────────────────────
-- JOB 1: MANTENIMIENTO MENSUAL DE PARTICIONES
-- ────────────────────────────────────────────────────────────────────
-- Ejecuta el día 1 de cada mes a las 00:30 (30 minutos después de medianoche)
-- Crea particiones para los próximos 6 meses y elimina particiones >24 meses
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'mantenimiento-particiones-mensual',     -- Nombre del job
    '30 0 1 * *',                             -- Cron expression: minuto 30, hora 0, día 1, todos los meses
    $$DO $BODY$
    DECLARE
        v_resultado RECORD;
        v_total_acciones INTEGER := 0;
    BEGIN
        -- Ejecutar mantenimiento de particiones
        FOR v_resultado IN
            SELECT * FROM mantener_particiones(6, 24)
        LOOP
            v_total_acciones := v_total_acciones + 1;
            RAISE NOTICE 'Particiones: % - %', v_resultado.accion, v_resultado.detalle;
        END LOOP;

        RAISE NOTICE '✅ Mantenimiento de particiones completado: % acciones ejecutadas', v_total_acciones;
    END $BODY$;$$
);

COMMENT ON FUNCTION cron.schedule(text, text, text) IS
'Job de mantenimiento mensual de particiones.
Cron: 30 0 1 * * (día 1 de cada mes a las 00:30)
Ejecuta: mantener_particiones(6, 24)
  - Crea particiones para próximos 6 meses
  - Elimina particiones >24 meses (después de archivar)';

-- ────────────────────────────────────────────────────────────────────
-- JOB 2: ARCHIVADO MENSUAL DE EVENTOS ANTIGUOS
-- ────────────────────────────────────────────────────────────────────
-- Ejecuta el día 2 de cada mes a las 01:00
-- Archiva eventos >12 meses a tabla de archivo
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'archivado-eventos-mensual',
    '0 1 2 * *',                              -- Día 2 a las 01:00 (después de crear particiones)
    $$DO $BODY$
    DECLARE
        v_resultado RECORD;
    BEGIN
        -- Archivar eventos antiguos
        SELECT * INTO v_resultado FROM archivar_eventos_antiguos(12);

        RAISE NOTICE '✅ Archivado de eventos completado: % archivados, % eliminados',
                     v_resultado.eventos_archivados, v_resultado.eventos_eliminados;
    END $BODY$;$$
);

-- ────────────────────────────────────────────────────────────────────
-- JOB 3: ARCHIVADO TRIMESTRAL DE CITAS ANTIGUAS
-- ────────────────────────────────────────────────────────────────────
-- Ejecuta el día 1 de enero, abril, julio y octubre a las 02:00
-- Marca citas >24 meses como archivadas (soft delete)
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'archivado-citas-trimestral',
    '0 2 1 1,4,7,10 *',                       -- Día 1 de ene/abr/jul/oct a las 02:00
    $$DO $BODY$
    DECLARE
        v_resultado RECORD;
    BEGIN
        -- Archivar citas antiguas
        SELECT * INTO v_resultado FROM archivar_citas_antiguas(24);

        RAISE NOTICE '✅ Archivado de citas completado: % citas archivadas',
                     v_resultado.citas_archivadas;
    END $BODY$;$$
);

-- ────────────────────────────────────────────────────────────────────
-- JOB 4: VACUUM Y ANALYZE DE PARTICIONES
-- ────────────────────────────────────────────────────────────────────
-- Ejecuta cada domingo a las 03:00
-- Optimiza el almacenamiento y actualiza estadísticas de las tablas particionadas
-- ────────────────────────────────────────────────────────────────────

SELECT cron.schedule(
    'vacuum-particiones-semanal',
    '0 3 * * 0',                              -- Domingos a las 03:00
    $$
    VACUUM ANALYZE citas;
    VACUUM ANALYZE eventos_sistema;
    $$
);

-- ====================================================================
-- 📊 VISTAS PARA MONITOREO DE JOBS
-- ====================================================================
-- Vistas para facilitar el monitoreo del estado de los jobs
-- ====================================================================

-- Vista de jobs activos con información útil
CREATE OR REPLACE VIEW v_cron_jobs_activos AS
SELECT
    jobid,
    schedule,
    command,
    nodename,
    nodeport,
    database,
    username,
    active,
    jobname
FROM cron.job
ORDER BY jobid;

COMMENT ON VIEW v_cron_jobs_activos IS
'Vista de todos los jobs de pg_cron configurados en el sistema.
Uso: SELECT * FROM v_cron_jobs_activos;';

-- Vista de historial de ejecuciones recientes
CREATE OR REPLACE VIEW v_cron_job_run_details AS
SELECT
    runid,
    jobid,
    job_pid,
    database,
    username,
    command,
    status,
    return_message,
    start_time,
    end_time,
    end_time - start_time as duration
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 100;

COMMENT ON VIEW v_cron_job_run_details IS
'Vista del historial de ejecuciones de jobs (últimas 100).
Uso: SELECT * FROM v_cron_job_run_details;';

-- ====================================================================
-- 🔍 FUNCIONES DE MONITOREO
-- ====================================================================

-- Función para ver estado de jobs de mantenimiento
CREATE OR REPLACE FUNCTION ver_estado_jobs_mantenimiento()
RETURNS TABLE(
    job_name VARCHAR,
    schedule VARCHAR,
    activo BOOLEAN,
    ultima_ejecucion TIMESTAMPTZ,
    duracion INTERVAL,
    estado VARCHAR,
    mensaje TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        j.jobname::VARCHAR,
        j.schedule::VARCHAR,
        j.active,
        r.start_time,
        r.end_time - r.start_time as duracion,
        r.status::VARCHAR,
        r.return_message::TEXT
    FROM cron.job j
    LEFT JOIN LATERAL (
        SELECT *
        FROM cron.job_run_details
        WHERE jobid = j.jobid
        ORDER BY start_time DESC
        LIMIT 1
    ) r ON TRUE
    WHERE j.jobname LIKE 'mantenimiento-%' OR j.jobname LIKE 'archivado-%' OR j.jobname LIKE 'vacuum-%'
    ORDER BY j.jobname;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ver_estado_jobs_mantenimiento() IS
'Muestra el estado actual de los jobs de mantenimiento.

Uso:
  SELECT * FROM ver_estado_jobs_mantenimiento();

Retorna información de:
- Jobs de mantenimiento de particiones
- Jobs de archivado
- Jobs de vacuum
- Última ejecución y duración';

-- ====================================================================
-- 📝 EJEMPLOS DE USO Y GESTIÓN
-- ====================================================================

/*
-- ═══════════════════════════════════════════════════════════════════
-- CONSULTAS DE MONITOREO
-- ═══════════════════════════════════════════════════════════════════

-- Ver todos los jobs configurados
SELECT * FROM v_cron_jobs_activos;

-- Ver historial de ejecuciones recientes
SELECT * FROM v_cron_job_run_details;

-- Ver estado de jobs de mantenimiento
SELECT * FROM ver_estado_jobs_mantenimiento();

-- Ver solo jobs activos de mantenimiento
SELECT jobname, schedule, active
FROM cron.job
WHERE jobname LIKE '%mantenimiento%' OR jobname LIKE '%archivado%';


-- ═══════════════════════════════════════════════════════════════════
-- GESTIÓN DE JOBS (SOLO SUPERUSUARIO)
-- ═══════════════════════════════════════════════════════════════════

-- Desactivar un job temporalmente
SELECT cron.unschedule('mantenimiento-particiones-mensual');

-- Reactivar un job
SELECT cron.schedule(
    'mantenimiento-particiones-mensual',
    '30 0 1 * *',
    $$SELECT * FROM mantener_particiones(6, 24)$$
);

-- Ver logs de una ejecución específica
SELECT *
FROM cron.job_run_details
WHERE jobid = 1
ORDER BY start_time DESC
LIMIT 10;

-- Ejecutar un job manualmente (testing)
SELECT * FROM mantener_particiones(6, 24);


-- ═══════════════════════════════════════════════════════════════════
-- TROUBLESHOOTING
-- ═══════════════════════════════════════════════════════════════════

-- Verificar que pg_cron está instalado
SELECT * FROM pg_extension WHERE extname = 'pg_cron';

-- Ver configuración actual
SHOW shared_preload_libraries;  -- Debe incluir 'pg_cron'
SHOW cron.database_name;         -- Debe ser 'postgres'

-- Ver errores recientes en jobs
SELECT
    jobname,
    start_time,
    status,
    return_message
FROM cron.job j
JOIN cron.job_run_details r ON j.jobid = r.jobid
WHERE status = 'failed'
ORDER BY start_time DESC
LIMIT 20;

*/

-- ====================================================================
-- ✅ VALIDACIÓN DE INSTALACIÓN
-- ====================================================================

DO $$
DECLARE
    v_extension_exists BOOLEAN;
    v_jobs_count INTEGER;
BEGIN
    -- Verificar extensión instalada
    SELECT EXISTS(
        SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
    ) INTO v_extension_exists;

    IF NOT v_extension_exists THEN
        RAISE EXCEPTION 'pg_cron no está instalado. Ejecutar: CREATE EXTENSION pg_cron;';
    END IF;

    -- Contar jobs creados
    SELECT COUNT(*) INTO v_jobs_count
    FROM cron.job
    WHERE jobname LIKE '%mantenimiento%' OR jobname LIKE '%archivado%' OR jobname LIKE '%vacuum%';

    IF v_jobs_count < 4 THEN
        RAISE WARNING 'Solo % jobs encontrados. Deberían ser 4 (mantenimiento, 2 archivados, vacuum)', v_jobs_count;
    ELSE
        RAISE NOTICE '✅ pg_cron configurado correctamente: % jobs activos', v_jobs_count;
    END IF;

    -- Mostrar resumen
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📅 JOBS PROGRAMADOS:';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '1. Mantenimiento Particiones: Día 1 de cada mes a las 00:30';
    RAISE NOTICE '2. Archivado Eventos: Día 2 de cada mes a las 01:00';
    RAISE NOTICE '3. Archivado Citas: Día 1 trimestral a las 02:00';
    RAISE NOTICE '4. Vacuum Particiones: Domingos a las 03:00';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE 'Monitoreo: SELECT * FROM ver_estado_jobs_mantenimiento();';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

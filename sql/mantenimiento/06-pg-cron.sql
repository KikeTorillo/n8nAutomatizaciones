-- ====================================================================
-- ⏰ MÓDULO MANTENIMIENTO - CONFIGURACIÓN PG_CRON
-- ====================================================================
--
-- PROPÓSITO:
-- Configuración de pg_cron para mantenimiento automático del sistema.
--
-- COMPONENTES:
-- • Instalación extensión pg_cron
-- • 4 jobs programados (particiones, archivado, vacuum)
-- • 2 vistas de monitoreo
-- • 1 función de estado de jobs
--
-- REQUISITOS PREVIOS:
-- 1. Instalar pg_cron en el sistema:
--    - Debian/Ubuntu: apt-get install postgresql-17-cron
--    - Docker: agregar al Dockerfile o usar imagen con pg_cron
--
-- 2. Configurar postgresql.conf:
--    shared_preload_libraries = 'pg_cron'
--
-- 3. Configurar cron.database_name en Dockerfile.postgres apuntando
--    a la base de datos principal donde se instala todo el schema.
--
-- ORDEN DE CARGA: #12 (después de triggers)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 📦 INSTALACIÓN DE LA EXTENSIÓN PG_CRON
-- ====================================================================
-- Crear la extensión si no existe
-- NOTA: Debe ejecutarse como superusuario (postgres)
-- ────────────────────────────────────────────────────────────────────

CREATE EXTENSION IF NOT EXISTS pg_cron;

COMMENT ON EXTENSION pg_cron IS
'Extensión para programar jobs cron dentro de PostgreSQL.
Permite ejecutar funciones SQL de forma programada sin depender del cron del sistema.';

-- ====================================================================
-- ⏰ CONFIGURACIÓN DE ZONA HORARIA PARA PG_CRON
-- ====================================================================
-- Configurar cron.timezone para que coincida con la zona horaria del servidor
-- (heredada de la variable TZ del .env a través de docker-compose)
-- IMPORTANTE: Esta configuración requiere superusuario y reload de configuración
-- ────────────────────────────────────────────────────────────────────

DO $$
DECLARE
    v_timezone TEXT;
BEGIN
    -- Obtener la zona horaria actual de PostgreSQL (configurada por variable TZ)
    SELECT current_setting('TIMEZONE') INTO v_timezone;

    -- Configurar cron.timezone para que pg_cron use la misma zona horaria
    EXECUTE format('ALTER SYSTEM SET cron.timezone = %L', v_timezone);

    -- Recargar configuración para aplicar cambios
    PERFORM pg_reload_conf();

    RAISE NOTICE '✅ cron.timezone configurado como: %', v_timezone;

EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '⚠️  No se pudo configurar cron.timezone automáticamente: %', SQLERRM;
        RAISE NOTICE 'ℹ️  Por favor configurar manualmente: ALTER SYSTEM SET cron.timezone = ''%'';', v_timezone;
END $$;

-- ====================================================================
-- 🔐 PERMISOS PARA EL USUARIO DE APLICACIÓN
-- ====================================================================
-- Permitir que saas_app pueda ver y gestionar jobs (solo lectura)
-- Los jobs se crean como superusuario pero saas_app puede consultarlos
-- ────────────────────────────────────────────────────────────────────

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
-- ────────────────────────────────────────────────────────────────────

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
-- ────────────────────────────────────────────────────────────────────

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
-- 🔍 FUNCIÓN DE MONITOREO
-- ====================================================================
-- Función para ver estado de jobs de mantenimiento
-- ────────────────────────────────────────────────────────────────────

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

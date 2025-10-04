-- ====================================================================
-- 🧹 FUNCIONES DE MANTENIMIENTO Y ARCHIVADO AUTOMÁTICO
-- ====================================================================
-- Archivo: schema/15-maintenance-functions.sql
-- Descripción: Funciones para mantenimiento, limpieza y archivado
--              automático de datos antiguos
-- Orden de Ejecución: #15 (Último archivo de schema)
-- ====================================================================

-- ====================================================================
-- 📦 TABLA DE ARCHIVO: EVENTOS_SISTEMA_ARCHIVO
-- ====================================================================
-- Almacena eventos antiguos (>12 meses) para compliance y consultas
-- históricas sin impactar performance de tabla principal
-- ────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eventos_sistema_archivo (
    LIKE eventos_sistema INCLUDING ALL
);

COMMENT ON TABLE eventos_sistema_archivo IS
'Tabla de archivo para eventos_sistema antiguos (>12 meses).
Estructura idéntica a eventos_sistema pero sin RLS ni triggers.
Solo para consulta histórica y compliance.
Ejecutar archivado: SELECT * FROM archivar_eventos_antiguos(12);';

-- ====================================================================
-- 🔄 FUNCIÓN 1: ARCHIVAR_EVENTOS_ANTIGUOS
-- ====================================================================
-- Mueve eventos antiguos de eventos_sistema a eventos_sistema_archivo
-- Ejecutar mensualmente via cron
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION archivar_eventos_antiguos(
    p_meses_antiguedad INTEGER DEFAULT 12
)
RETURNS TABLE(
    eventos_archivados BIGINT,
    eventos_eliminados BIGINT,
    fecha_corte TIMESTAMPTZ
) AS $$
DECLARE
    v_fecha_corte TIMESTAMPTZ;
    v_archivados BIGINT;
    v_eliminados BIGINT;
BEGIN
    -- Calcular fecha de corte
    v_fecha_corte := NOW() - (p_meses_antiguedad || ' months')::INTERVAL;

    RAISE NOTICE 'Archivando eventos anteriores a: %', v_fecha_corte;

    -- Insertar en tabla de archivo (con bypass RLS)
    PERFORM set_config('app.bypass_rls', 'true', true);

    INSERT INTO eventos_sistema_archivo
    SELECT * FROM eventos_sistema
    WHERE creado_en < v_fecha_corte
    ON CONFLICT (id) DO NOTHING;  -- Por si ya existen

    GET DIAGNOSTICS v_archivados = ROW_COUNT;

    -- Eliminar de tabla principal
    DELETE FROM eventos_sistema
    WHERE creado_en < v_fecha_corte;

    GET DIAGNOSTICS v_eliminados = ROW_COUNT;

    PERFORM set_config('app.bypass_rls', 'false', true);

    -- Retornar estadísticas
    RETURN QUERY SELECT v_archivados, v_eliminados, v_fecha_corte;

    RAISE NOTICE '✅ Archivados: % eventos | Eliminados: % eventos',
                 v_archivados, v_eliminados;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archivar_eventos_antiguos(INTEGER) IS
'Archiva eventos antiguos de eventos_sistema a eventos_sistema_archivo.
Por defecto archiva eventos >12 meses. Ejecutar mensualmente via cron.

Uso:
  SELECT * FROM archivar_eventos_antiguos();        -- 12 meses (default)
  SELECT * FROM archivar_eventos_antiguos(6);       -- 6 meses
  SELECT * FROM archivar_eventos_antiguos(24);      -- 24 meses

Retorna: (eventos_archivados, eventos_eliminados, fecha_corte)';

-- ====================================================================
-- 🗓️ FUNCIÓN 2: ARCHIVAR_CITAS_ANTIGUAS
-- ====================================================================
-- Marca citas antiguas completadas/canceladas como archivadas
-- Ejecutar trimestralmente
-- ────────────────────────────────────────────────────────────────────

-- Primero agregar columna archivada a citas si no existe
ALTER TABLE citas ADD COLUMN IF NOT EXISTS archivada BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_citas_archivada
    ON citas(archivada)
    WHERE archivada = TRUE;

COMMENT ON COLUMN citas.archivada IS
'Marca si la cita ha sido archivada (soft delete).
Citas completadas/canceladas >24 meses se marcan automáticamente.
Usar WHERE archivada = FALSE en queries activas para mejor performance.';

CREATE OR REPLACE FUNCTION archivar_citas_antiguas(
    p_meses_antiguedad INTEGER DEFAULT 24
)
RETURNS TABLE(
    citas_archivadas BIGINT,
    fecha_corte DATE
) AS $$
DECLARE
    v_fecha_corte DATE;
    v_archivadas BIGINT;
BEGIN
    v_fecha_corte := CURRENT_DATE - (p_meses_antiguedad || ' months')::INTERVAL;

    RAISE NOTICE 'Marcando como archivadas citas anteriores a: %', v_fecha_corte;

    -- Marcar como archivadas (soft delete)
    UPDATE citas
    SET archivada = TRUE,
        actualizado_en = NOW()
    WHERE fecha_cita < v_fecha_corte
      AND estado IN ('completada', 'cancelada', 'no_asistio')
      AND archivada = FALSE;

    GET DIAGNOSTICS v_archivadas = ROW_COUNT;

    RETURN QUERY SELECT v_archivadas, v_fecha_corte;

    RAISE NOTICE '✅ Citas archivadas: %', v_archivadas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION archivar_citas_antiguas(INTEGER) IS
'Marca citas antiguas completadas/canceladas como archivadas (soft delete).
Por defecto archiva citas >24 meses. Ejecutar trimestralmente.

Uso:
  SELECT * FROM archivar_citas_antiguas();          -- 24 meses (default)
  SELECT * FROM archivar_citas_antiguas(12);        -- 12 meses
  SELECT * FROM archivar_citas_antiguas(36);        -- 36 meses

Retorna: (citas_archivadas, fecha_corte)

Las citas archivadas permanecen en BD pero pueden excluirse:
  SELECT * FROM citas WHERE archivada = FALSE;      -- Solo activas';

-- ====================================================================
-- 📊 FUNCIÓN 3: ESTADISTICAS_ARCHIVADO
-- ====================================================================
-- Muestra estadísticas de datos archivados y sugerencias de limpieza
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION estadisticas_archivado()
RETURNS TABLE(
    tabla VARCHAR,
    registros_totales BIGINT,
    registros_archivados BIGINT,
    porcentaje_archivado NUMERIC,
    sugerencia TEXT
) AS $$
BEGIN
    -- Eventos sistema
    RETURN QUERY
    SELECT
        'eventos_sistema'::VARCHAR,
        (SELECT COUNT(*) FROM eventos_sistema)::BIGINT,
        (SELECT COUNT(*) FROM eventos_sistema WHERE creado_en < NOW() - INTERVAL '12 months')::BIGINT,
        ROUND(
            (SELECT COUNT(*)::NUMERIC FROM eventos_sistema WHERE creado_en < NOW() - INTERVAL '12 months') /
            NULLIF((SELECT COUNT(*) FROM eventos_sistema), 0) * 100, 2
        ),
        CASE
            WHEN (SELECT COUNT(*) FROM eventos_sistema WHERE creado_en < NOW() - INTERVAL '12 months') > 10000
            THEN 'Ejecutar: SELECT * FROM archivar_eventos_antiguos();'
            ELSE 'No requiere archivado aún'
        END;

    -- Citas
    RETURN QUERY
    SELECT
        'citas'::VARCHAR,
        (SELECT COUNT(*) FROM citas)::BIGINT,
        (SELECT COUNT(*) FROM citas WHERE archivada = TRUE)::BIGINT,
        ROUND(
            (SELECT COUNT(*)::NUMERIC FROM citas WHERE archivada = TRUE) /
            NULLIF((SELECT COUNT(*) FROM citas), 0) * 100, 2
        ),
        CASE
            WHEN (SELECT COUNT(*) FROM citas
                  WHERE fecha_cita < CURRENT_DATE - INTERVAL '24 months'
                  AND estado IN ('completada', 'cancelada', 'no_asistio')
                  AND archivada = FALSE) > 1000
            THEN 'Ejecutar: SELECT * FROM archivar_citas_antiguas();'
            ELSE 'No requiere archivado aún'
        END;

    -- Eventos archivo
    RETURN QUERY
    SELECT
        'eventos_sistema_archivo'::VARCHAR,
        (SELECT COUNT(*) FROM eventos_sistema_archivo)::BIGINT,
        (SELECT COUNT(*) FROM eventos_sistema_archivo)::BIGINT,
        100.00::NUMERIC,
        'Tabla de solo lectura para histórico'::TEXT;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION estadisticas_archivado() IS
'Muestra estadísticas de archivado y sugerencias de mantenimiento.

Uso:
  SELECT * FROM estadisticas_archivado();

Retorna información de:
- eventos_sistema: Eventos activos y candidatos a archivo
- citas: Citas totales y archivadas
- eventos_sistema_archivo: Eventos históricos archivados

Incluye sugerencias automáticas de cuándo ejecutar archivado.';

-- ====================================================================
-- 🎯 ÍNDICES PARA FUNCIONES DE MANTENIMIENTO
-- ====================================================================

-- NOTA: Índice para eventos_sistema movido a 12-eventos-sistema.sql
-- (la tabla eventos_sistema se crea en ese archivo, no aquí)

-- Índice para búsqueda de citas antiguas (usado por archivar_citas_antiguas)
CREATE INDEX IF NOT EXISTS idx_citas_fecha_estado_archivado
    ON citas(fecha_cita, estado, archivada)
    WHERE estado IN ('completada', 'cancelada', 'no_asistio')
    AND archivada = FALSE;

-- ====================================================================
-- 📝 EJEMPLOS DE USO
-- ====================================================================

/*
-- ═══════════════════════════════════════════════════════════════════
-- MANTENIMIENTO MENSUAL (Ejecutar vía cron el día 1 de cada mes)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ver estadísticas actuales
SELECT * FROM estadisticas_archivado();

-- 2. Archivar eventos >12 meses
SELECT * FROM archivar_eventos_antiguos(12);

-- 3. Verificar resultado
SELECT COUNT(*) as eventos_actuales FROM eventos_sistema;
SELECT COUNT(*) as eventos_archivados FROM eventos_sistema_archivo;


-- ═══════════════════════════════════════════════════════════════════
-- MANTENIMIENTO TRIMESTRAL (Ejecutar cada 3 meses)
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ver citas candidatas a archivo
SELECT COUNT(*) FROM citas
WHERE fecha_cita < CURRENT_DATE - INTERVAL '24 months'
  AND estado IN ('completada', 'cancelada', 'no_asistio')
  AND archivada = FALSE;

-- 2. Archivar citas >24 meses
SELECT * FROM archivar_citas_antiguas(24);

-- 3. Verificar resultado
SELECT
    COUNT(*) FILTER (WHERE archivada = FALSE) as citas_activas,
    COUNT(*) FILTER (WHERE archivada = TRUE) as citas_archivadas,
    COUNT(*) as total
FROM citas;


-- ═══════════════════════════════════════════════════════════════════
-- CONSULTAS ADMINISTRATIVAS
-- ═══════════════════════════════════════════════════════════════════

-- Ver distribución temporal de eventos
SELECT
    DATE_TRUNC('month', creado_en) as mes,
    COUNT(*) as eventos,
    COUNT(*) FILTER (WHERE gravedad = 'error') as errores
FROM eventos_sistema
GROUP BY 1 ORDER BY 1 DESC LIMIT 12;

-- Ver citas por antigüedad
SELECT
    CASE
        WHEN fecha_cita >= CURRENT_DATE - INTERVAL '3 months' THEN '0-3 meses'
        WHEN fecha_cita >= CURRENT_DATE - INTERVAL '12 months' THEN '3-12 meses'
        WHEN fecha_cita >= CURRENT_DATE - INTERVAL '24 months' THEN '12-24 meses'
        ELSE '>24 meses'
    END as antiguedad,
    COUNT(*) as cantidad,
    COUNT(*) FILTER (WHERE archivada = TRUE) as archivadas
FROM citas
GROUP BY 1 ORDER BY 1;

*/

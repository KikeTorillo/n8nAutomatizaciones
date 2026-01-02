-- ====================================================================
-- ⚡ MÓDULO MANTENIMIENTO - FUNCIONES DE ARCHIVADO Y PARTICIONES
-- ====================================================================
--
-- PROPÓSITO:
-- Funciones para mantenimiento automático, archivado de datos antiguos
-- y gestión de particiones mensuales.
--
-- COMPONENTES:
-- • 3 funciones de archivado (eventos, citas, estadísticas)
-- • 5 funciones de gestión de particiones
--
-- CARACTERÍSTICAS:
-- ✅ Archivado automático de eventos >12 meses
-- ✅ Soft delete de citas >24 meses
-- ✅ Creación automática de particiones futuras
-- ✅ Eliminación de particiones muy antiguas
-- ✅ Estadísticas y monitoreo de archivado
--
-- ORDEN DE CARGA: #12 (después de RLS)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1: ARCHIVAR_EVENTOS_ANTIGUOS
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
-- FUNCIÓN 2: ARCHIVAR_CITAS_ANTIGUAS
-- ====================================================================
-- Marca citas antiguas completadas/canceladas como archivadas
-- Ejecutar trimestralmente
-- ────────────────────────────────────────────────────────────────────

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
-- FUNCIÓN 3: ESTADISTICAS_ARCHIVADO
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
-- FUNCIÓN 4: CREAR_PARTICIONES_FUTURAS_CITAS
-- ====================================================================
-- Crea particiones mensuales de citas para los próximos N meses
-- Ejecutar mensualmente para mantener siempre 6 meses adelante
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION crear_particiones_futuras_citas(
    p_meses_adelante INTEGER DEFAULT 6
)
RETURNS TABLE(
    particion_nombre VARCHAR,
    fecha_inicio DATE,
    fecha_fin DATE,
    creada BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_inicio DATE;
    v_fin DATE;
    v_nombre VARCHAR;
    v_ya_existe BOOLEAN;
    v_mes INTEGER;
BEGIN
    -- Crear particiones para los próximos N meses
    FOR v_mes IN 0..p_meses_adelante LOOP
        -- Calcular inicio del mes
        v_inicio := DATE_TRUNC('month', CURRENT_DATE + (v_mes || ' months')::INTERVAL)::DATE;
        v_fin := DATE_TRUNC('month', CURRENT_DATE + ((v_mes + 1) || ' months')::INTERVAL)::DATE;

        -- Generar nombre de partición: citas_2025_01
        v_nombre := 'citas_' || TO_CHAR(v_inicio, 'YYYY_MM');

        -- Verificar si ya existe
        SELECT EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = v_nombre AND n.nspname = 'public'
        ) INTO v_ya_existe;

        IF NOT v_ya_existe THEN
            -- Crear partición
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF citas FOR VALUES FROM (%L) TO (%L)',
                v_nombre,
                v_inicio,
                v_fin
            );

            RETURN QUERY SELECT
                v_nombre,
                v_inicio,
                v_fin,
                TRUE,
                ('Partición creada: ' || v_nombre || ' [' || v_inicio || ' - ' || v_fin || ')')::TEXT;
        ELSE
            RETURN QUERY SELECT
                v_nombre,
                v_inicio,
                v_fin,
                FALSE,
                ('Ya existe: ' || v_nombre)::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_particiones_futuras_citas(INTEGER) IS
'Crea particiones mensuales de citas para los próximos N meses.
Por defecto crea 6 meses adelante. Ejecutar mensualmente via cron.

Uso:
  SELECT * FROM crear_particiones_futuras_citas();       -- 6 meses (default)
  SELECT * FROM crear_particiones_futuras_citas(12);     -- 12 meses

Retorna: (particion_nombre, fecha_inicio, fecha_fin, creada, mensaje)';

-- ====================================================================
-- FUNCIÓN 5: CREAR_PARTICIONES_FUTURAS_EVENTOS
-- ====================================================================
-- Crea particiones mensuales de eventos_sistema para los próximos N meses
-- Ejecutar mensualmente para mantener siempre 6 meses adelante
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION crear_particiones_futuras_eventos(
    p_meses_adelante INTEGER DEFAULT 6
)
RETURNS TABLE(
    particion_nombre VARCHAR,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    creada BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_inicio TIMESTAMPTZ;
    v_fin TIMESTAMPTZ;
    v_nombre VARCHAR;
    v_ya_existe BOOLEAN;
    v_mes INTEGER;
BEGIN
    -- Crear particiones para los próximos N meses
    FOR v_mes IN 0..p_meses_adelante LOOP
        -- Calcular inicio del mes (mantiene zona horaria del servidor)
        v_inicio := DATE_TRUNC('month', NOW() + (v_mes || ' months')::INTERVAL);
        v_fin := DATE_TRUNC('month', NOW() + ((v_mes + 1) || ' months')::INTERVAL);

        -- Generar nombre de partición: eventos_sistema_2025_01
        v_nombre := 'eventos_sistema_' || TO_CHAR(v_inicio, 'YYYY_MM');

        -- Verificar si ya existe
        SELECT EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = v_nombre AND n.nspname = 'public'
        ) INTO v_ya_existe;

        IF NOT v_ya_existe THEN
            -- Crear partición
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF eventos_sistema FOR VALUES FROM (%L) TO (%L)',
                v_nombre,
                v_inicio,
                v_fin
            );

            RETURN QUERY SELECT
                v_nombre,
                v_inicio,
                v_fin,
                TRUE,
                ('Partición creada: ' || v_nombre || ' [' || v_inicio || ' - ' || v_fin || ')')::TEXT;
        ELSE
            RETURN QUERY SELECT
                v_nombre,
                v_inicio,
                v_fin,
                FALSE,
                ('Ya existe: ' || v_nombre)::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_particiones_futuras_eventos(INTEGER) IS
'Crea particiones mensuales de eventos_sistema para los próximos N meses.
Por defecto crea 6 meses adelante. Ejecutar mensualmente via cron.

Uso:
  SELECT * FROM crear_particiones_futuras_eventos();     -- 6 meses (default)
  SELECT * FROM crear_particiones_futuras_eventos(12);   -- 12 meses

Retorna: (particion_nombre, fecha_inicio, fecha_fin, creada, mensaje)';

-- ====================================================================
-- FUNCIÓN 6: ELIMINAR_PARTICIONES_ANTIGUAS
-- ====================================================================
-- Elimina particiones muy antiguas (>24 meses) de citas y eventos
-- CUIDADO: Esto elimina datos permanentemente. Solo ejecutar si se
-- archivaron previamente los datos necesarios.
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION eliminar_particiones_antiguas(
    p_meses_antiguedad INTEGER DEFAULT 24
)
RETURNS TABLE(
    tabla VARCHAR,
    particion_eliminada VARCHAR,
    registros_eliminados BIGINT,
    mensaje TEXT
) AS $$
DECLARE
    v_particion RECORD;
    v_fecha_corte DATE;
    v_registros BIGINT;
BEGIN
    v_fecha_corte := CURRENT_DATE - (p_meses_antiguedad || ' months')::INTERVAL;

    RAISE NOTICE 'Eliminando particiones anteriores a: %', v_fecha_corte;

    -- Buscar particiones de citas antiguas
    FOR v_particion IN
        SELECT
            c.relname as nombre_particion,
            pg_get_expr(c.relpartbound, c.oid) as definicion
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON p.oid = i.inhparent
        WHERE p.relname = 'citas'
          AND c.relname ~ '^citas_\d{4}_\d{2}$'
    LOOP
        -- Extraer año y mes del nombre (citas_2023_01 -> 2023-01-01)
        DECLARE
            v_anio INTEGER;
            v_mes INTEGER;
            v_fecha_particion DATE;
        BEGIN
            v_anio := SUBSTRING(v_particion.nombre_particion FROM 7 FOR 4)::INTEGER;
            v_mes := SUBSTRING(v_particion.nombre_particion FROM 12 FOR 2)::INTEGER;
            v_fecha_particion := make_date(v_anio, v_mes, 1);

            IF v_fecha_particion < v_fecha_corte THEN
                -- Contar registros antes de eliminar
                EXECUTE format('SELECT COUNT(*) FROM %I', v_particion.nombre_particion)
                INTO v_registros;

                -- Eliminar partición
                EXECUTE format('DROP TABLE IF EXISTS %I', v_particion.nombre_particion);

                RETURN QUERY SELECT
                    'citas'::VARCHAR,
                    v_particion.nombre_particion::VARCHAR,
                    v_registros,
                    ('Eliminada partición: ' || v_particion.nombre_particion || ' (' || v_registros || ' registros)')::TEXT;
            END IF;
        END;
    END LOOP;

    -- Buscar particiones de eventos_sistema antiguas
    FOR v_particion IN
        SELECT
            c.relname as nombre_particion,
            pg_get_expr(c.relpartbound, c.oid) as definicion
        FROM pg_class c
        JOIN pg_inherits i ON c.oid = i.inhrelid
        JOIN pg_class p ON p.oid = i.inhparent
        WHERE p.relname = 'eventos_sistema'
          AND c.relname ~ '^eventos_sistema_\d{4}_\d{2}$'
    LOOP
        -- Extraer año y mes del nombre
        DECLARE
            v_anio INTEGER;
            v_mes INTEGER;
            v_fecha_particion DATE;
        BEGIN
            v_anio := SUBSTRING(v_particion.nombre_particion FROM 17 FOR 4)::INTEGER;
            v_mes := SUBSTRING(v_particion.nombre_particion FROM 22 FOR 2)::INTEGER;
            v_fecha_particion := make_date(v_anio, v_mes, 1);

            IF v_fecha_particion < v_fecha_corte THEN
                -- Contar registros antes de eliminar
                EXECUTE format('SELECT COUNT(*) FROM %I', v_particion.nombre_particion)
                INTO v_registros;

                -- Eliminar partición
                EXECUTE format('DROP TABLE IF EXISTS %I', v_particion.nombre_particion);

                RETURN QUERY SELECT
                    'eventos_sistema'::VARCHAR,
                    v_particion.nombre_particion::VARCHAR,
                    v_registros,
                    ('Eliminada partición: ' || v_particion.nombre_particion || ' (' || v_registros || ' registros)')::TEXT;
            END IF;
        END;
    END LOOP;

    RAISE NOTICE '✅ Particiones antiguas eliminadas';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION eliminar_particiones_antiguas(INTEGER) IS
'Elimina particiones muy antiguas de citas y eventos_sistema.
⚠️ CUIDADO: Elimina datos permanentemente. Archivar antes si es necesario.

Por defecto elimina particiones >24 meses. Ejecutar trimestralmente.

Uso:
  SELECT * FROM eliminar_particiones_antiguas();        -- 24 meses (default)
  SELECT * FROM eliminar_particiones_antiguas(36);      -- 36 meses

Retorna: (tabla, particion_eliminada, registros_eliminados, mensaje)

IMPORTANTE: Ejecutar archivar_eventos_antiguos() ANTES de eliminar.';

-- ====================================================================
-- FUNCIÓN 7: LISTAR_PARTICIONES
-- ====================================================================
-- Lista todas las particiones con su tamaño, registros y rango de fechas
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION listar_particiones()
RETURNS TABLE(
    tabla_padre VARCHAR,
    particion VARCHAR,
    registros BIGINT,
    tamano_mb NUMERIC,
    rango_fechas TEXT,
    estado VARCHAR
) AS $$
BEGIN
    -- Listar particiones de citas
    RETURN QUERY
    SELECT
        'citas'::VARCHAR as tabla_padre,
        c.relname::VARCHAR as particion,
        COALESCE(s.n_live_tup, 0)::BIGINT as registros,
        ROUND((pg_relation_size(c.oid) / 1024.0 / 1024.0)::NUMERIC, 2) as tamano_mb,
        pg_get_expr(c.relpartbound, c.oid)::TEXT as rango_fechas,
        CASE
            WHEN c.relname ~ TO_CHAR(CURRENT_DATE, 'YYYY_MM') THEN 'actual'
            WHEN c.relname > 'citas_' || TO_CHAR(CURRENT_DATE, 'YYYY_MM') THEN 'futura'
            ELSE 'historica'
        END::VARCHAR as estado
    FROM pg_class c
    JOIN pg_inherits i ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE p.relname = 'citas'
    ORDER BY c.relname;

    -- Listar particiones de eventos_sistema
    RETURN QUERY
    SELECT
        'eventos_sistema'::VARCHAR as tabla_padre,
        c.relname::VARCHAR as particion,
        COALESCE(s.n_live_tup, 0)::BIGINT as registros,
        ROUND((pg_relation_size(c.oid) / 1024.0 / 1024.0)::NUMERIC, 2) as tamano_mb,
        pg_get_expr(c.relpartbound, c.oid)::TEXT as rango_fechas,
        CASE
            WHEN c.relname ~ TO_CHAR(CURRENT_DATE, 'YYYY_MM') THEN 'actual'
            WHEN c.relname > 'eventos_sistema_' || TO_CHAR(CURRENT_DATE, 'YYYY_MM') THEN 'futura'
            ELSE 'historica'
        END::VARCHAR as estado
    FROM pg_class c
    JOIN pg_inherits i ON c.oid = i.inhrelid
    JOIN pg_class p ON p.oid = i.inhparent
    LEFT JOIN pg_stat_user_tables s ON s.relid = c.oid
    WHERE p.relname = 'eventos_sistema'
    ORDER BY c.relname;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION listar_particiones() IS
'Lista todas las particiones de citas y eventos_sistema con métricas.

Uso:
  SELECT * FROM listar_particiones();

Retorna:
- tabla_padre: Tabla principal (citas o eventos_sistema)
- particion: Nombre de la partición
- registros: Número de registros en la partición
- tamano_mb: Tamaño en MB
- rango_fechas: Rango de fechas de la partición
- estado: actual, futura o historica';

-- ====================================================================
-- FUNCIÓN 8: MANTENER_PARTICIONES
-- ====================================================================
-- Función combinada que crea particiones futuras y elimina antiguas
-- Ejecutar mensualmente via cron para mantenimiento automático
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION mantener_particiones(
    p_meses_adelante INTEGER DEFAULT 6,
    p_meses_antiguedad INTEGER DEFAULT 24
)
RETURNS TABLE(
    accion VARCHAR,
    detalle TEXT
) AS $$
BEGIN
    RAISE NOTICE '🔄 Iniciando mantenimiento de particiones...';

    -- 1. Crear particiones futuras de citas
    RETURN QUERY
    SELECT
        'CREAR_CITAS'::VARCHAR,
        mensaje::TEXT
    FROM crear_particiones_futuras_citas(p_meses_adelante)
    WHERE creada = TRUE;

    -- 2. Crear particiones futuras de eventos
    RETURN QUERY
    SELECT
        'CREAR_EVENTOS'::VARCHAR,
        mensaje::TEXT
    FROM crear_particiones_futuras_eventos(p_meses_adelante)
    WHERE creada = TRUE;

    -- 3. Crear particiones futuras de movimientos_inventario
    RETURN QUERY
    SELECT
        'CREAR_INVENTARIO'::VARCHAR,
        mensaje::TEXT
    FROM crear_particiones_futuras_inventario(p_meses_adelante)
    WHERE creada = TRUE;

    -- 4. Crear particiones futuras de asientos_contables
    RETURN QUERY
    SELECT
        'CREAR_CONTABILIDAD'::VARCHAR,
        mensaje::TEXT
    FROM crear_particiones_futuras_contabilidad(p_meses_adelante)
    WHERE creada = TRUE;

    -- 5. Eliminar particiones antiguas (>24 meses)
    RETURN QUERY
    SELECT
        'ELIMINAR_ANTIGUA'::VARCHAR,
        mensaje::TEXT
    FROM eliminar_particiones_antiguas(p_meses_antiguedad);

    RAISE NOTICE '✅ Mantenimiento de particiones completado';

    -- 6. Retornar resumen
    RETURN QUERY
    SELECT
        'RESUMEN'::VARCHAR,
        ('Total particiones: ' || COUNT(*)::TEXT)::TEXT
    FROM listar_particiones();
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mantener_particiones(INTEGER, INTEGER) IS
'Mantenimiento completo de particiones: crea futuras y elimina antiguas.
Ejecutar mensualmente el día 1 via cron para mantenimiento automático.

Uso:
  SELECT * FROM mantener_particiones();                  -- Defaults: 6 meses adelante, 24 antiguos
  SELECT * FROM mantener_particiones(12, 36);            -- 12 meses adelante, 36 antiguos

Tablas particionadas gestionadas:
- citas (fecha_cita)
- eventos_sistema (creado_en)
- movimientos_inventario (creado_en)
- asientos_contables (fecha)

Acciones:
1. Crea particiones para los próximos 6 meses (todas las tablas)
2. Elimina particiones >24 meses (después de archivar)
3. Muestra resumen de particiones

Retorna: (accion, detalle)';

-- ====================================================================
-- FUNCIÓN 9: CREAR_PARTICIONES_FUTURAS_INVENTARIO
-- ====================================================================
-- Crea particiones mensuales de movimientos_inventario para los próximos N meses
-- Columna de partición: creado_en (TIMESTAMPTZ)
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION crear_particiones_futuras_inventario(
    p_meses_adelante INTEGER DEFAULT 6
)
RETURNS TABLE(
    particion_nombre VARCHAR,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    creada BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_inicio TIMESTAMPTZ;
    v_fin TIMESTAMPTZ;
    v_nombre VARCHAR;
    v_ya_existe BOOLEAN;
    v_mes INTEGER;
BEGIN
    FOR v_mes IN 0..p_meses_adelante LOOP
        v_inicio := DATE_TRUNC('month', NOW() + (v_mes || ' months')::INTERVAL);
        v_fin := DATE_TRUNC('month', NOW() + ((v_mes + 1) || ' months')::INTERVAL);
        v_nombre := 'movimientos_inventario_' || TO_CHAR(v_inicio, 'YYYY_MM');

        SELECT EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = v_nombre AND n.nspname = 'public'
        ) INTO v_ya_existe;

        IF NOT v_ya_existe THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF movimientos_inventario FOR VALUES FROM (%L) TO (%L)',
                v_nombre, v_inicio, v_fin
            );

            RETURN QUERY SELECT v_nombre, v_inicio, v_fin, TRUE,
                ('Partición creada: ' || v_nombre)::TEXT;
        ELSE
            RETURN QUERY SELECT v_nombre, v_inicio, v_fin, FALSE,
                ('Ya existe: ' || v_nombre)::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_particiones_futuras_inventario(INTEGER) IS
'Crea particiones mensuales de movimientos_inventario para los próximos N meses.
Columna de partición: creado_en (TIMESTAMPTZ).
Ejecutar mensualmente via pg_cron.';

-- ====================================================================
-- FUNCIÓN 10: CREAR_PARTICIONES_FUTURAS_CONTABILIDAD
-- ====================================================================
-- Crea particiones mensuales de asientos_contables para los próximos N meses
-- Columna de partición: fecha (DATE)
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION crear_particiones_futuras_contabilidad(
    p_meses_adelante INTEGER DEFAULT 6
)
RETURNS TABLE(
    particion_nombre VARCHAR,
    fecha_inicio DATE,
    fecha_fin DATE,
    creada BOOLEAN,
    mensaje TEXT
) AS $$
DECLARE
    v_inicio DATE;
    v_fin DATE;
    v_nombre VARCHAR;
    v_ya_existe BOOLEAN;
    v_mes INTEGER;
BEGIN
    FOR v_mes IN 0..p_meses_adelante LOOP
        v_inicio := DATE_TRUNC('month', CURRENT_DATE + (v_mes || ' months')::INTERVAL)::DATE;
        v_fin := DATE_TRUNC('month', CURRENT_DATE + ((v_mes + 1) || ' months')::INTERVAL)::DATE;
        v_nombre := 'asientos_contables_' || TO_CHAR(v_inicio, 'YYYY_MM');

        SELECT EXISTS(
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = v_nombre AND n.nspname = 'public'
        ) INTO v_ya_existe;

        IF NOT v_ya_existe THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF asientos_contables FOR VALUES FROM (%L) TO (%L)',
                v_nombre, v_inicio, v_fin
            );

            RETURN QUERY SELECT v_nombre, v_inicio, v_fin, TRUE,
                ('Partición creada: ' || v_nombre)::TEXT;
        ELSE
            RETURN QUERY SELECT v_nombre, v_inicio, v_fin, FALSE,
                ('Ya existe: ' || v_nombre)::TEXT;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_particiones_futuras_contabilidad(INTEGER) IS
'Crea particiones mensuales de asientos_contables para los próximos N meses.
Columna de partición: fecha (DATE).
Ejecutar mensualmente via pg_cron.';

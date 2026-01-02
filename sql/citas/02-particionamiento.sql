-- ====================================================================
-- 📅 MÓDULO CITAS - PARTICIONAMIENTO DINÁMICO
-- ====================================================================
--
-- Versión: 2.0.0
-- Fecha: Enero 2026
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Crea particiones dinámicamente basadas en la fecha actual.
-- NO usa fechas hardcodeadas para evitar obsolescencia.
--
-- ESTRATEGIA:
-- • Crea particiones para mes actual + 6 meses adelante
-- • pg_cron mantiene las particiones automáticamente (día 1 cada mes)
-- • Función mantener_particiones() gestiona creación y limpieza
--
-- BENEFICIOS:
-- • 10x+ más rápido en queries históricas
-- • Facilita archivado de datos antiguos
-- • Mantenimiento automático
-- • Sin fechas hardcodeadas = sin obsolescencia
--
-- ====================================================================

-- ====================================================================
-- 📅 CREAR PARTICIONES DINÁMICAS DE CITAS
-- ====================================================================
-- Crea particiones para el mes actual y los próximos 6 meses

DO $$
DECLARE
    v_inicio DATE;
    v_fin DATE;
    v_nombre VARCHAR;
    v_mes INTEGER;
BEGIN
    -- Crear particiones para los próximos 7 meses (actual + 6)
    FOR v_mes IN 0..6 LOOP
        v_inicio := DATE_TRUNC('month', CURRENT_DATE + (v_mes || ' months')::INTERVAL)::DATE;
        v_fin := DATE_TRUNC('month', CURRENT_DATE + ((v_mes + 1) || ' months')::INTERVAL)::DATE;
        v_nombre := 'citas_' || TO_CHAR(v_inicio, 'YYYY_MM');

        -- Solo crear si no existe
        IF NOT EXISTS (
            SELECT 1 FROM pg_class c
            JOIN pg_namespace n ON n.oid = c.relnamespace
            WHERE c.relname = v_nombre AND n.nspname = 'public'
        ) THEN
            EXECUTE format(
                'CREATE TABLE %I PARTITION OF citas FOR VALUES FROM (%L) TO (%L)',
                v_nombre, v_inicio, v_fin
            );
            RAISE NOTICE '✅ Partición creada: % [% - %)', v_nombre, v_inicio, v_fin;
        ELSE
            RAISE NOTICE 'ℹ️  Partición ya existe: %', v_nombre;
        END IF;
    END LOOP;

    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
    RAISE NOTICE '📅 Particiones de citas configuradas dinámicamente';
    RAISE NOTICE '⏰ pg_cron mantiene particiones futuras automáticamente';
    RAISE NOTICE '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━';
END $$;

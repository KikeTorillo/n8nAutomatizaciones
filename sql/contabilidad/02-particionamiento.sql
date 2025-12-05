-- ====================================================================
-- 📅 MÓDULO CONTABILIDAD - PARTICIONAMIENTO
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Define las particiones iniciales para la tabla asientos_contables.
-- Estrategia minimalista: solo 2 particiones iniciales.
-- pg_cron crea el resto automáticamente cada mes.
--
-- ESTRATEGIA:
-- • Mes actual + próximo mes (buffer mínimo)
-- • Automatización vía pg_cron (día 1 de cada mes a las 00:30)
-- • Función mantener_particiones() crea particiones futuras
--
-- BENEFICIOS:
-- • 10x+ más rápido en queries históricas
-- • Facilita archivado de ejercicios anteriores
-- • Mantenimiento automático
--
-- ====================================================================

-- ====================================================================
-- 📅 PARTICIONES INICIALES DE ASIENTOS_CONTABLES
-- ====================================================================

-- Mes actual (Diciembre 2025)
CREATE TABLE asientos_contables_2025_12 PARTITION OF asientos_contables
    FOR VALUES FROM ('2025-12-01') TO ('2026-01-01');

-- Próximo mes (Enero 2026 - buffer de seguridad)
CREATE TABLE asientos_contables_2026_01 PARTITION OF asientos_contables
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TABLE asientos_contables_2025_12 IS
'Partición de asientos contables para diciembre 2025.
Las particiones futuras se crean automáticamente vía pg_cron.';

COMMENT ON TABLE asientos_contables_2026_01 IS
'Partición de asientos contables para enero 2026.
Buffer de seguridad antes de automatización completa.';

-- ====================================================================
-- 🔧 FUNCIÓN: Crear partición de asientos contables
-- ====================================================================
-- Crea una partición para un mes específico si no existe.
-- Llamada por pg_cron mensualmente.
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_particion_asientos_contables(
    p_anio INTEGER,
    p_mes INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
    v_nombre_particion TEXT;
    v_fecha_inicio DATE;
    v_fecha_fin DATE;
BEGIN
    -- Calcular nombre y fechas
    v_nombre_particion := 'asientos_contables_' || p_anio || '_' || LPAD(p_mes::TEXT, 2, '0');
    v_fecha_inicio := make_date(p_anio, p_mes, 1);
    v_fecha_fin := v_fecha_inicio + INTERVAL '1 month';

    -- Verificar si ya existe
    IF EXISTS (
        SELECT 1 FROM pg_class
        WHERE relname = v_nombre_particion
        AND relkind = 'r'
    ) THEN
        RETURN 'Partición ' || v_nombre_particion || ' ya existe';
    END IF;

    -- Crear partición
    EXECUTE format(
        'CREATE TABLE %I PARTITION OF asientos_contables FOR VALUES FROM (%L) TO (%L)',
        v_nombre_particion,
        v_fecha_inicio,
        v_fecha_fin
    );

    RETURN 'Partición ' || v_nombre_particion || ' creada exitosamente';
END;
$$;

COMMENT ON FUNCTION crear_particion_asientos_contables IS
'Crea una partición de asientos_contables para un mes específico.
Uso: SELECT crear_particion_asientos_contables(2026, 2);
Llamada automáticamente por pg_cron cada mes.';

-- ====================================================================
-- 🔧 FUNCIÓN: Mantener particiones de asientos contables
-- ====================================================================
-- Crea particiones para los próximos N meses si no existen.
-- ====================================================================

CREATE OR REPLACE FUNCTION mantener_particiones_asientos_contables(
    p_meses_adelante INTEGER DEFAULT 6
)
RETURNS TABLE (resultado TEXT)
LANGUAGE plpgsql
AS $$
DECLARE
    v_fecha DATE;
    v_anio INTEGER;
    v_mes INTEGER;
BEGIN
    v_fecha := date_trunc('month', CURRENT_DATE);

    FOR i IN 0..p_meses_adelante LOOP
        v_anio := EXTRACT(YEAR FROM v_fecha);
        v_mes := EXTRACT(MONTH FROM v_fecha);

        resultado := crear_particion_asientos_contables(v_anio, v_mes);
        RETURN NEXT;

        v_fecha := v_fecha + INTERVAL '1 month';
    END LOOP;
END;
$$;

COMMENT ON FUNCTION mantener_particiones_asientos_contables IS
'Mantiene particiones de asientos_contables para los próximos N meses.
Uso: SELECT * FROM mantener_particiones_asientos_contables(6);
Ejecutar manualmente si pg_cron falla.';

-- ====================================================================
-- ⚠️ NOTA IMPORTANTE
-- ====================================================================
-- ✅ TOTAL: 2 particiones iniciales
-- ⏰ El cron job mantener_particiones_asientos_contables() creará el resto
-- 🔧 Agregar a pg_cron en: sql/mantenimiento/06-pg-cron.sql
-- ====================================================================

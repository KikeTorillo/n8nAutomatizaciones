-- =====================================================
-- MÓDULO INCAPACIDADES - Funciones
-- Enero 2026
-- =====================================================

-- =====================================================
-- FUNCIÓN: Generar código de incapacidad
-- Formato: INC-YYYY-NNNN (ej: INC-2026-0001)
-- =====================================================
CREATE OR REPLACE FUNCTION generar_codigo_incapacidad(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_anio INTEGER;
    v_secuencia INTEGER;
BEGIN
    v_anio := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Obtener siguiente secuencia del año actual
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(codigo FROM 'INC-\d{4}-(\d+)') AS INTEGER)
    ), 0) + 1 INTO v_secuencia
    FROM incapacidades
    WHERE organizacion_id = p_organizacion_id
      AND codigo LIKE 'INC-' || v_anio || '-%';

    RETURN 'INC-' || v_anio || '-' || LPAD(v_secuencia::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_codigo_incapacidad IS
'Genera código único de incapacidad en formato INC-YYYY-NNNN para la organización.';

-- =====================================================
-- TRIGGER: Generar código automáticamente
-- =====================================================
CREATE OR REPLACE FUNCTION trigger_generar_codigo_incapacidad()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generar_codigo_incapacidad(NEW.organizacion_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_generar_codigo_incapacidad ON incapacidades;
CREATE TRIGGER trg_generar_codigo_incapacidad
    BEFORE INSERT ON incapacidades
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_codigo_incapacidad();

-- =====================================================
-- FUNCIÓN: Verificar solapamiento de incapacidades
-- =====================================================
CREATE OR REPLACE FUNCTION verificar_solapamiento_incapacidad(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_excluir_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_solapamiento BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1
        FROM incapacidades
        WHERE organizacion_id = p_organizacion_id
          AND profesional_id = p_profesional_id
          AND estado = 'activa'
          AND (p_excluir_id IS NULL OR id != p_excluir_id)
          AND (
              -- Solapamiento: fecha_inicio o fecha_fin cae dentro del período
              (fecha_inicio <= p_fecha_fin AND fecha_fin >= p_fecha_inicio)
          )
    ) INTO v_solapamiento;

    RETURN v_solapamiento;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_solapamiento_incapacidad IS
'Verifica si existe solapamiento con otra incapacidad activa del mismo profesional.
Retorna TRUE si hay solapamiento, FALSE si el período está libre.';

-- =====================================================
-- FUNCIÓN: Obtener configuración de tipo IMSS
-- =====================================================
CREATE OR REPLACE FUNCTION obtener_config_tipo_incapacidad(p_tipo VARCHAR(30))
RETURNS TABLE (
    tipo VARCHAR(30),
    label VARCHAR(50),
    max_semanas INTEGER,
    porcentaje_pago INTEGER,
    dia_inicio_pago INTEGER,
    descripcion TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tipo,
        t.label,
        t.max_semanas,
        t.porcentaje_pago,
        t.dia_inicio_pago,
        t.descripcion
    FROM (
        VALUES
            ('enfermedad_general'::VARCHAR(30), 'Enfermedad General'::VARCHAR(50), 52, 60, 4,
             'Enfermedades no relacionadas al trabajo. Pago del 60% a partir del día 4.'::TEXT),
            ('maternidad'::VARCHAR(30), 'Maternidad'::VARCHAR(50), NULL::INTEGER, 100, 1,
             '84 días: 42 antes y 42 después del parto. Pago del 100%.'::TEXT),
            ('riesgo_trabajo'::VARCHAR(30), 'Riesgo de Trabajo'::VARCHAR(50), NULL::INTEGER, 100, 1,
             'Accidentes o enfermedades laborales. Pago del 100% hasta recuperación.'::TEXT)
    ) AS t(tipo, label, max_semanas, porcentaje_pago, dia_inicio_pago, descripcion)
    WHERE t.tipo = p_tipo OR p_tipo IS NULL;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION obtener_config_tipo_incapacidad IS
'Retorna la configuración IMSS para un tipo de incapacidad.
Si p_tipo es NULL, retorna todos los tipos disponibles.';

-- =====================================================
-- FUNCIÓN: Contar incapacidades activas de un profesional
-- =====================================================
CREATE OR REPLACE FUNCTION contar_incapacidades_activas(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*)::INTEGER INTO v_count
    FROM incapacidades
    WHERE organizacion_id = p_organizacion_id
      AND profesional_id = p_profesional_id
      AND estado = 'activa';

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION contar_incapacidades_activas IS
'Cuenta el número de incapacidades activas de un profesional.
Usado para determinar si restaurar estado_laboral al finalizar.';

-- =====================================================
-- FUNCIÓN: Calcular días de incapacidad en un período
-- =====================================================
CREATE OR REPLACE FUNCTION calcular_dias_incapacidad_periodo(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_dias INTEGER;
BEGIN
    SELECT COALESCE(SUM(
        -- Calcular días dentro del período solicitado
        GREATEST(0,
            LEAST(fecha_fin, p_fecha_fin) - GREATEST(fecha_inicio, p_fecha_inicio) + 1
        )
    ), 0)::INTEGER INTO v_dias
    FROM incapacidades
    WHERE organizacion_id = p_organizacion_id
      AND profesional_id = p_profesional_id
      AND estado IN ('activa', 'finalizada')
      AND fecha_inicio <= p_fecha_fin
      AND fecha_fin >= p_fecha_inicio;

    RETURN v_dias;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION calcular_dias_incapacidad_periodo IS
'Calcula el total de días de incapacidad de un profesional en un período dado.
Útil para reportes y estadísticas.';

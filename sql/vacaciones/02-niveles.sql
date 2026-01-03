-- =====================================================
-- MÓDULO VACACIONES - Niveles por Antigüedad
-- Plan de Empleados Competitivo - Fase 3
-- Enero 2026
--
-- Ventaja competitiva vs Odoo:
-- - Escalas configurables por organización
-- - Datos pre-cargados según LFT México (Reforma 2022)
-- - Fórmula automática para calcular días
-- =====================================================

-- =====================================================
-- TABLA: niveles_vacaciones
-- Descripción: Escalas de días por antigüedad
-- =====================================================
CREATE TABLE IF NOT EXISTS niveles_vacaciones (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Configuración del nivel
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Rango de antigüedad (en años)
    anios_minimos DECIMAL(4,1) NOT NULL,        -- Desde X años (inclusive)
    anios_maximos DECIMAL(4,1),                  -- Hasta Y años (exclusive, NULL = sin límite)

    -- Días de vacaciones
    dias_anuales INTEGER NOT NULL,               -- Días base del nivel
    dias_extra_por_anio DECIMAL(3,1) DEFAULT 0,  -- Días adicionales por cada año extra en el nivel

    -- Metadata
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT niveles_vac_nombre_unico UNIQUE(organizacion_id, nombre),
    CONSTRAINT chk_anios_minimos CHECK (anios_minimos >= 0),
    CONSTRAINT chk_anios_maximos CHECK (anios_maximos IS NULL OR anios_maximos > anios_minimos),
    CONSTRAINT chk_dias_anuales CHECK (dias_anuales > 0)
);

-- =====================================================
-- ÍNDICES
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_niveles_vac_org ON niveles_vacaciones(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_niveles_vac_org_activo ON niveles_vacaciones(organizacion_id)
    WHERE activo = true;
CREATE INDEX IF NOT EXISTS idx_niveles_vac_anios ON niveles_vacaciones(organizacion_id, anios_minimos, anios_maximos);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

ALTER TABLE niveles_vacaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY niveles_vac_tenant_policy ON niveles_vacaciones
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================
-- FUNCIÓN: Calcular días por antigüedad
-- =====================================================

CREATE OR REPLACE FUNCTION calcular_dias_por_antiguedad(
    p_organizacion_id INTEGER,
    p_fecha_ingreso DATE
)
RETURNS INTEGER AS $$
DECLARE
    v_anios DECIMAL(4,1);
    v_nivel RECORD;
    v_dias INTEGER;
    v_politica RECORD;
BEGIN
    -- Calcular años de servicio
    v_anios := EXTRACT(YEAR FROM AGE(CURRENT_DATE, p_fecha_ingreso))
             + EXTRACT(MONTH FROM AGE(CURRENT_DATE, p_fecha_ingreso)) / 12.0;

    -- Verificar si la organización usa niveles
    SELECT usar_niveles_antiguedad, dias_por_anio INTO v_politica
    FROM politicas_vacaciones
    WHERE organizacion_id = p_organizacion_id
      AND activo = true
    LIMIT 1;

    -- Si no usa niveles o no existe política, retornar días por defecto
    IF v_politica IS NULL OR NOT v_politica.usar_niveles_antiguedad THEN
        RETURN COALESCE(v_politica.dias_por_anio, 15);
    END IF;

    -- Buscar nivel correspondiente
    SELECT * INTO v_nivel
    FROM niveles_vacaciones
    WHERE organizacion_id = p_organizacion_id
      AND activo = true
      AND v_anios >= anios_minimos
      AND (anios_maximos IS NULL OR v_anios < anios_maximos)
    ORDER BY anios_minimos DESC
    LIMIT 1;

    -- Si no hay nivel configurado, usar días por defecto de política
    IF v_nivel IS NULL THEN
        RETURN COALESCE(v_politica.dias_por_anio, 15);
    END IF;

    -- Calcular días: base + extra por años adicionales en el nivel
    v_dias := v_nivel.dias_anuales +
              FLOOR((v_anios - v_nivel.anios_minimos) * v_nivel.dias_extra_por_anio);

    RETURN v_dias;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Obtener nivel actual del profesional
-- =====================================================

CREATE OR REPLACE FUNCTION obtener_nivel_vacaciones(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER
)
RETURNS TABLE (
    nivel_id INTEGER,
    nivel_nombre VARCHAR(100),
    anios_antiguedad DECIMAL(4,1),
    dias_correspondientes INTEGER,
    anios_para_siguiente DECIMAL(4,1),
    dias_siguiente_nivel INTEGER
) AS $$
DECLARE
    v_fecha_ingreso DATE;
    v_anios DECIMAL(4,1);
    v_nivel_actual RECORD;
    v_dias_siguiente INTEGER := NULL;
    v_anios_para_siguiente DECIMAL(4,1) := NULL;
BEGIN
    -- Obtener fecha de ingreso del profesional
    SELECT p.fecha_ingreso INTO v_fecha_ingreso
    FROM profesionales p
    WHERE p.id = p_profesional_id
      AND p.organizacion_id = p_organizacion_id;

    IF v_fecha_ingreso IS NULL THEN
        RETURN;
    END IF;

    -- Calcular años de servicio
    v_anios := EXTRACT(YEAR FROM AGE(CURRENT_DATE, v_fecha_ingreso))
             + EXTRACT(MONTH FROM AGE(CURRENT_DATE, v_fecha_ingreso)) / 12.0;

    -- Buscar nivel actual
    SELECT * INTO v_nivel_actual
    FROM niveles_vacaciones
    WHERE organizacion_id = p_organizacion_id
      AND activo = true
      AND v_anios >= anios_minimos
      AND (anios_maximos IS NULL OR v_anios < anios_maximos)
    ORDER BY anios_minimos DESC
    LIMIT 1;

    -- Si hay nivel actual y tiene máximo, buscar siguiente nivel
    IF v_nivel_actual IS NOT NULL AND v_nivel_actual.anios_maximos IS NOT NULL THEN
        v_anios_para_siguiente := v_nivel_actual.anios_maximos - v_anios;

        SELECT nv.dias_anuales INTO v_dias_siguiente
        FROM niveles_vacaciones nv
        WHERE nv.organizacion_id = p_organizacion_id
          AND nv.activo = true
          AND nv.anios_minimos = v_nivel_actual.anios_maximos
        LIMIT 1;
    END IF;

    -- Retornar resultado
    RETURN QUERY SELECT
        v_nivel_actual.id,
        v_nivel_actual.nombre,
        v_anios,
        calcular_dias_por_antiguedad(p_organizacion_id, v_fecha_ingreso),
        v_anios_para_siguiente,
        v_dias_siguiente;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Crear niveles LFT México por defecto
-- =====================================================

CREATE OR REPLACE FUNCTION crear_niveles_lft_mexico(p_organizacion_id INTEGER)
RETURNS void AS $$
BEGIN
    -- Verificar que no existan niveles para esta organización
    IF EXISTS (SELECT 1 FROM niveles_vacaciones WHERE organizacion_id = p_organizacion_id) THEN
        RAISE NOTICE 'La organización ya tiene niveles configurados';
        RETURN;
    END IF;

    -- Insertar niveles según LFT México (Reforma 2022)
    -- https://www.gob.mx/stps/articulos/dias-de-vacaciones-segun-la-ley-federal-del-trabajo
    INSERT INTO niveles_vacaciones (organizacion_id, nombre, anios_minimos, anios_maximos, dias_anuales, orden) VALUES
        (p_organizacion_id, '1er año de servicio', 0, 1, 12, 1),
        (p_organizacion_id, '2do año de servicio', 1, 2, 14, 2),
        (p_organizacion_id, '3er año de servicio', 2, 3, 16, 3),
        (p_organizacion_id, '4to año de servicio', 3, 4, 18, 4),
        (p_organizacion_id, '5to año de servicio', 4, 5, 20, 5),
        (p_organizacion_id, '6 a 10 años de servicio', 5, 10, 22, 6),
        (p_organizacion_id, '11 a 15 años de servicio', 10, 15, 24, 7),
        (p_organizacion_id, '16 a 20 años de servicio', 15, 20, 26, 8),
        (p_organizacion_id, '21 a 25 años de servicio', 20, 25, 28, 9),
        (p_organizacion_id, '26 a 30 años de servicio', 25, 30, 30, 10),
        (p_organizacion_id, '31 a 35 años de servicio', 30, 35, 32, 11),
        (p_organizacion_id, '36+ años de servicio', 35, NULL, 34, 12);

    RAISE NOTICE 'Niveles LFT México 2022 creados para organización %', p_organizacion_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- FUNCIÓN: Crear niveles Colombia por defecto
-- =====================================================

CREATE OR REPLACE FUNCTION crear_niveles_colombia(p_organizacion_id INTEGER)
RETURNS void AS $$
BEGIN
    -- Verificar que no existan niveles para esta organización
    IF EXISTS (SELECT 1 FROM niveles_vacaciones WHERE organizacion_id = p_organizacion_id) THEN
        RAISE NOTICE 'La organización ya tiene niveles configurados';
        RETURN;
    END IF;

    -- Colombia: 15 días hábiles desde el primer año (Código Sustantivo del Trabajo Art. 186)
    -- +1 día por cada año después del quinto año hasta máximo 15 días adicionales
    INSERT INTO niveles_vacaciones (organizacion_id, nombre, anios_minimos, anios_maximos, dias_anuales, dias_extra_por_anio, orden) VALUES
        (p_organizacion_id, '1-5 años de servicio', 0, 5, 15, 0, 1),
        (p_organizacion_id, '6-20 años de servicio', 5, 20, 15, 1, 2),  -- +1 día por año
        (p_organizacion_id, '21+ años de servicio', 20, NULL, 30, 0, 3); -- Tope máximo

    RAISE NOTICE 'Niveles Colombia creados para organización %', p_organizacion_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGER: Actualizar timestamp
-- =====================================================

DROP TRIGGER IF EXISTS trg_actualizar_niveles_vac ON niveles_vacaciones;
CREATE TRIGGER trg_actualizar_niveles_vac
    BEFORE UPDATE ON niveles_vacaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_vacaciones();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE niveles_vacaciones IS 'Escalas de días de vacaciones por antigüedad, configurables por organización';
COMMENT ON COLUMN niveles_vacaciones.anios_minimos IS 'Años mínimos de servicio para este nivel (inclusive)';
COMMENT ON COLUMN niveles_vacaciones.anios_maximos IS 'Años máximos de servicio para este nivel (exclusive), NULL = sin límite';
COMMENT ON COLUMN niveles_vacaciones.dias_extra_por_anio IS 'Días adicionales por cada año extra dentro del rango del nivel';
COMMENT ON FUNCTION calcular_dias_por_antiguedad(INTEGER, DATE) IS 'Calcula días de vacaciones según antigüedad y niveles configurados';
COMMENT ON FUNCTION obtener_nivel_vacaciones(INTEGER, INTEGER) IS 'Obtiene el nivel actual de un profesional con info del siguiente nivel';
COMMENT ON FUNCTION crear_niveles_lft_mexico(INTEGER) IS 'Crea niveles según Ley Federal del Trabajo México (Reforma 2022)';
COMMENT ON FUNCTION crear_niveles_colombia(INTEGER) IS 'Crea niveles según Código Sustantivo del Trabajo Colombia';

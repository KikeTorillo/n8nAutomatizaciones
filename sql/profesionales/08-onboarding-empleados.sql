-- =====================================================
-- FASE 5: ONBOARDING DE EMPLEADOS
-- Sistema de plantillas de integración para nuevos empleados
-- Fecha: 2 Enero 2026
-- =====================================================

-- =====================================================
-- 1. TIPO ENUM PARA RESPONSABLES
-- =====================================================

DO $$ BEGIN
    CREATE TYPE responsable_tarea_onboarding AS ENUM ('empleado', 'supervisor', 'rrhh');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- =====================================================
-- 2. TABLA: PLANTILLAS DE ONBOARDING
-- =====================================================

CREATE TABLE IF NOT EXISTS plantillas_onboarding (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    departamento_id INTEGER REFERENCES departamentos(id) ON DELETE SET NULL,
    puesto_id INTEGER REFERENCES puestos(id) ON DELETE SET NULL,
    duracion_dias INTEGER DEFAULT 30,
    activo BOOLEAN DEFAULT true,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    eliminado_en TIMESTAMPTZ,
    eliminado_por INTEGER REFERENCES usuarios(id),

    CONSTRAINT uk_plantilla_nombre UNIQUE(organizacion_id, nombre)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_plantillas_onb_org
    ON plantillas_onboarding(organizacion_id) WHERE eliminado_en IS NULL;
CREATE INDEX IF NOT EXISTS idx_plantillas_onb_dept
    ON plantillas_onboarding(departamento_id) WHERE eliminado_en IS NULL AND activo = true;
CREATE INDEX IF NOT EXISTS idx_plantillas_onb_puesto
    ON plantillas_onboarding(puesto_id) WHERE eliminado_en IS NULL AND activo = true;

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION trigger_plantillas_onboarding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plantillas_onboarding_updated_at ON plantillas_onboarding;
CREATE TRIGGER plantillas_onboarding_updated_at
    BEFORE UPDATE ON plantillas_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION trigger_plantillas_onboarding_updated_at();

-- RLS
ALTER TABLE plantillas_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS plantillas_onboarding_tenant_policy ON plantillas_onboarding;
CREATE POLICY plantillas_onboarding_tenant_policy ON plantillas_onboarding
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================
-- 3. TABLA: TAREAS DE ONBOARDING
-- =====================================================

CREATE TABLE IF NOT EXISTS tareas_onboarding (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plantilla_id INTEGER NOT NULL REFERENCES plantillas_onboarding(id) ON DELETE CASCADE,

    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT,
    responsable_tipo responsable_tarea_onboarding DEFAULT 'empleado',
    dias_limite INTEGER,
    orden INTEGER DEFAULT 0,
    es_obligatoria BOOLEAN DEFAULT true,

    -- Recursos opcionales
    url_recurso VARCHAR(500),

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    eliminado_en TIMESTAMPTZ,
    eliminado_por INTEGER REFERENCES usuarios(id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_tareas_onb_plantilla
    ON tareas_onboarding(plantilla_id, orden) WHERE eliminado_en IS NULL;
CREATE INDEX IF NOT EXISTS idx_tareas_onb_org
    ON tareas_onboarding(organizacion_id) WHERE eliminado_en IS NULL;

-- Trigger para updated_at
DROP TRIGGER IF EXISTS tareas_onboarding_updated_at ON tareas_onboarding;
CREATE TRIGGER tareas_onboarding_updated_at
    BEFORE UPDATE ON tareas_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION trigger_plantillas_onboarding_updated_at();

-- RLS
ALTER TABLE tareas_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tareas_onboarding_tenant_policy ON tareas_onboarding;
CREATE POLICY tareas_onboarding_tenant_policy ON tareas_onboarding
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================
-- 4. TABLA: PROGRESO DE ONBOARDING
-- =====================================================

CREATE TABLE IF NOT EXISTS progreso_onboarding (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    tarea_id INTEGER NOT NULL REFERENCES tareas_onboarding(id) ON DELETE CASCADE,
    plantilla_id INTEGER NOT NULL REFERENCES plantillas_onboarding(id) ON DELETE CASCADE,

    -- Estado
    completado BOOLEAN DEFAULT false,
    completado_en TIMESTAMPTZ,
    completado_por INTEGER REFERENCES usuarios(id),

    -- Fecha límite calculada
    fecha_limite DATE,

    -- Notas/Comentarios
    notas TEXT,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT uk_progreso_tarea UNIQUE(profesional_id, tarea_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_progreso_onb_prof
    ON progreso_onboarding(profesional_id) WHERE completado = false;
CREATE INDEX IF NOT EXISTS idx_progreso_onb_pendientes
    ON progreso_onboarding(organizacion_id, completado, fecha_limite) WHERE completado = false;
CREATE INDEX IF NOT EXISTS idx_progreso_onb_plantilla
    ON progreso_onboarding(plantilla_id);
CREATE INDEX IF NOT EXISTS idx_progreso_onb_org
    ON progreso_onboarding(organizacion_id);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS progreso_onboarding_updated_at ON progreso_onboarding;
CREATE TRIGGER progreso_onboarding_updated_at
    BEFORE UPDATE ON progreso_onboarding
    FOR EACH ROW
    EXECUTE FUNCTION trigger_plantillas_onboarding_updated_at();

-- RLS
ALTER TABLE progreso_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS progreso_onboarding_tenant_policy ON progreso_onboarding;
CREATE POLICY progreso_onboarding_tenant_policy ON progreso_onboarding
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- =====================================================
-- 5. FUNCIÓN: GENERAR PROGRESO AUTOMÁTICO
-- =====================================================

CREATE OR REPLACE FUNCTION generar_progreso_onboarding(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER,
    p_plantilla_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_fecha_ingreso DATE;
    v_tareas_creadas INTEGER := 0;
BEGIN
    -- Obtener fecha de ingreso del profesional
    SELECT fecha_ingreso INTO v_fecha_ingreso
    FROM profesionales
    WHERE id = p_profesional_id AND organizacion_id = p_organizacion_id;

    IF v_fecha_ingreso IS NULL THEN
        v_fecha_ingreso := CURRENT_DATE;
    END IF;

    -- Insertar progreso para cada tarea de la plantilla
    INSERT INTO progreso_onboarding (
        organizacion_id, profesional_id, tarea_id, plantilla_id, fecha_limite
    )
    SELECT
        p_organizacion_id,
        p_profesional_id,
        t.id,
        p_plantilla_id,
        CASE WHEN t.dias_limite IS NOT NULL
             THEN v_fecha_ingreso + t.dias_limite
             ELSE NULL
        END
    FROM tareas_onboarding t
    WHERE t.plantilla_id = p_plantilla_id
      AND t.eliminado_en IS NULL
    ON CONFLICT (profesional_id, tarea_id) DO NOTHING;

    GET DIAGNOSTICS v_tareas_creadas = ROW_COUNT;
    RETURN v_tareas_creadas;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. FUNCIÓN: BUSCAR PLANTILLA APLICABLE
-- =====================================================

CREATE OR REPLACE FUNCTION buscar_plantilla_onboarding_aplicable(
    p_organizacion_id INTEGER,
    p_departamento_id INTEGER,
    p_puesto_id INTEGER
) RETURNS INTEGER AS $$
DECLARE
    v_plantilla_id INTEGER;
BEGIN
    -- Prioridad 1: Plantilla específica para departamento Y puesto
    SELECT id INTO v_plantilla_id
    FROM plantillas_onboarding
    WHERE organizacion_id = p_organizacion_id
      AND departamento_id = p_departamento_id
      AND puesto_id = p_puesto_id
      AND activo = true
      AND eliminado_en IS NULL
    LIMIT 1;

    IF v_plantilla_id IS NOT NULL THEN
        RETURN v_plantilla_id;
    END IF;

    -- Prioridad 2: Plantilla para puesto (cualquier departamento)
    SELECT id INTO v_plantilla_id
    FROM plantillas_onboarding
    WHERE organizacion_id = p_organizacion_id
      AND departamento_id IS NULL
      AND puesto_id = p_puesto_id
      AND activo = true
      AND eliminado_en IS NULL
    LIMIT 1;

    IF v_plantilla_id IS NOT NULL THEN
        RETURN v_plantilla_id;
    END IF;

    -- Prioridad 3: Plantilla para departamento (cualquier puesto)
    SELECT id INTO v_plantilla_id
    FROM plantillas_onboarding
    WHERE organizacion_id = p_organizacion_id
      AND departamento_id = p_departamento_id
      AND puesto_id IS NULL
      AND activo = true
      AND eliminado_en IS NULL
    LIMIT 1;

    IF v_plantilla_id IS NOT NULL THEN
        RETURN v_plantilla_id;
    END IF;

    -- Prioridad 4: Plantilla general (sin restricciones)
    SELECT id INTO v_plantilla_id
    FROM plantillas_onboarding
    WHERE organizacion_id = p_organizacion_id
      AND departamento_id IS NULL
      AND puesto_id IS NULL
      AND activo = true
      AND eliminado_en IS NULL
    LIMIT 1;

    RETURN v_plantilla_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. VISTA: DASHBOARD DE PROGRESO
-- =====================================================

CREATE OR REPLACE VIEW v_progreso_onboarding_resumen AS
SELECT
    p.organizacion_id,
    p.profesional_id,
    prof.nombre_completo,
    prof.email,
    prof.fecha_ingreso,
    prof.estado,
    pl.id as plantilla_id,
    pl.nombre as plantilla_nombre,
    COUNT(*) as total_tareas,
    COUNT(*) FILTER (WHERE p.completado = true) as tareas_completadas,
    COUNT(*) FILTER (WHERE p.completado = false) as tareas_pendientes,
    COUNT(*) FILTER (WHERE p.completado = false AND p.fecha_limite < CURRENT_DATE) as tareas_vencidas,
    COUNT(*) FILTER (WHERE t.es_obligatoria = true) as tareas_obligatorias,
    COUNT(*) FILTER (WHERE t.es_obligatoria = true AND p.completado = true) as obligatorias_completadas,
    ROUND(
        (COUNT(*) FILTER (WHERE p.completado = true)::NUMERIC / NULLIF(COUNT(*), 0)) * 100,
        1
    ) as porcentaje_completado,
    MIN(p.fecha_limite) FILTER (WHERE p.completado = false) as proxima_fecha_limite
FROM progreso_onboarding p
JOIN profesionales prof ON prof.id = p.profesional_id
JOIN plantillas_onboarding pl ON pl.id = p.plantilla_id
LEFT JOIN tareas_onboarding t ON t.id = p.tarea_id
WHERE prof.eliminado_en IS NULL
  AND pl.eliminado_en IS NULL
GROUP BY
    p.organizacion_id,
    p.profesional_id,
    prof.nombre_completo,
    prof.email,
    prof.fecha_ingreso,
    prof.estado,
    pl.id,
    pl.nombre;

-- =====================================================
-- 8. VISTA: TAREAS VENCIDAS
-- =====================================================

CREATE OR REPLACE VIEW v_tareas_onboarding_vencidas AS
SELECT
    p.organizacion_id,
    p.id as progreso_id,
    p.profesional_id,
    prof.nombre_completo as profesional_nombre,
    prof.email as profesional_email,
    t.id as tarea_id,
    t.titulo as tarea_titulo,
    t.responsable_tipo,
    t.es_obligatoria,
    p.fecha_limite,
    CURRENT_DATE - p.fecha_limite as dias_vencido,
    pl.nombre as plantilla_nombre
FROM progreso_onboarding p
JOIN profesionales prof ON prof.id = p.profesional_id
JOIN tareas_onboarding t ON t.id = p.tarea_id
JOIN plantillas_onboarding pl ON pl.id = p.plantilla_id
WHERE p.completado = false
  AND p.fecha_limite < CURRENT_DATE
  AND prof.eliminado_en IS NULL
  AND t.eliminado_en IS NULL
ORDER BY p.fecha_limite ASC;

-- =====================================================
-- 9. COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE plantillas_onboarding IS 'Plantillas de onboarding configurables por organización, departamento y/o puesto';
COMMENT ON TABLE tareas_onboarding IS 'Tareas individuales dentro de cada plantilla de onboarding';
COMMENT ON TABLE progreso_onboarding IS 'Progreso de onboarding por profesional - generado al aplicar plantilla';

COMMENT ON COLUMN plantillas_onboarding.duracion_dias IS 'Duración total esperada del onboarding en días';
COMMENT ON COLUMN tareas_onboarding.responsable_tipo IS 'Quién es responsable de completar: empleado, supervisor o rrhh';
COMMENT ON COLUMN tareas_onboarding.dias_limite IS 'Días desde fecha_ingreso para completar (NULL = sin límite)';
COMMENT ON COLUMN tareas_onboarding.url_recurso IS 'Link opcional a documento, video o recurso de capacitación';
COMMENT ON COLUMN progreso_onboarding.fecha_limite IS 'Fecha calculada: fecha_ingreso + dias_limite de la tarea';

COMMENT ON FUNCTION generar_progreso_onboarding IS 'Genera registros de progreso para un profesional basado en una plantilla';
COMMENT ON FUNCTION buscar_plantilla_onboarding_aplicable IS 'Busca la plantilla más específica aplicable a un profesional según su dept/puesto';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================

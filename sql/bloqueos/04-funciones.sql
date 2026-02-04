-- ====================================================================
-- ⚡ MÓDULO BLOQUEOS - FUNCIONES PL/pgSQL
-- ====================================================================
--
-- PROPÓSITO:
-- Funciones para validación, consulta y mantenimiento de bloqueos
-- de horarios. Incluye validaciones de coherencia organizacional,
-- detección de solapamientos y funciones de utilidad.
--
-- COMPONENTES:
-- • 5 funciones PL/pgSQL
--
-- CARACTERÍSTICAS:
-- ✅ Validación de coherencia organizacional
-- ✅ Detección de solapamientos de horarios
-- ✅ Consulta de bloqueos por período
-- ✅ Verificación de horarios bloqueados
-- ✅ Actualización de métricas de uso
--
-- INTEGRACIÓN:
-- • Triggers de validación (BEFORE INSERT/UPDATE)
-- • Triggers de métricas (AFTER INSERT/UPDATE/DELETE)
-- • Consultas de disponibilidad (API backend)
--
-- ORDEN DE CARGA: #8 (después de RLS)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1: ACTUALIZAR TIMESTAMP AUTOMÁTICAMENTE
-- ====================================================================
-- Actualiza el campo actualizado_en antes de UPDATE
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION actualizar_timestamp_bloqueos()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_timestamp_bloqueos() IS
'Trigger function: Actualiza actualizado_en automáticamente en cada UPDATE.';

-- ====================================================================
-- FUNCIÓN 2: VALIDAR BLOQUEOS (COHERENCIA Y SOLAPAMIENTOS)
-- ====================================================================
-- Valida:
-- 1. Coherencia organizacional (profesional/servicio pertenecen a la org)
-- 2. Solapamientos con otros bloqueos del mismo profesional
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validar_bloqueos_horarios()
RETURNS TRIGGER AS $$
DECLARE
    count_solapamientos INTEGER;
    profesional_org_id INTEGER;
    servicio_org_id INTEGER;
BEGIN
    -- 1. VALIDAR COHERENCIA ORGANIZACIONAL

    -- 1.A. Validar profesional_id
    IF NEW.profesional_id IS NOT NULL THEN
        SELECT organizacion_id INTO profesional_org_id
        FROM profesionales
        WHERE id = NEW.profesional_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El profesional especificado no existe';
        END IF;

        IF profesional_org_id != NEW.organizacion_id THEN
            RAISE EXCEPTION 'El profesional no pertenece a la organización especificada';
        END IF;
    END IF;

    -- 1.B. Validar servicio_id
    IF NEW.servicio_id IS NOT NULL THEN
        SELECT organizacion_id INTO servicio_org_id
        FROM servicios
        WHERE id = NEW.servicio_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'El servicio especificado no existe';
        END IF;

        IF servicio_org_id != NEW.organizacion_id THEN
            RAISE EXCEPTION 'El servicio no pertenece a la organización especificada';
        END IF;
    END IF;

    -- 2. VALIDAR SOLAPAMIENTOS
    IF NEW.profesional_id IS NOT NULL THEN
        -- Validar solapamientos para el mismo profesional
        SELECT COUNT(*) INTO count_solapamientos
        FROM bloqueos_horarios b
        WHERE b.id != COALESCE(NEW.id, -1)
          AND b.organizacion_id = NEW.organizacion_id
          AND b.profesional_id = NEW.profesional_id
          AND b.activo = true
          AND (
              -- Solapamiento de fechas
              (NEW.fecha_inicio <= b.fecha_fin AND NEW.fecha_fin >= b.fecha_inicio)
              AND (
                  -- Si ambos son todo el día, hay solapamiento
                  (NEW.hora_inicio IS NULL AND b.hora_inicio IS NULL) OR
                  -- Si uno es todo el día y el otro no, hay solapamiento
                  (NEW.hora_inicio IS NULL OR b.hora_inicio IS NULL) OR
                  -- Si ambos tienen horarios específicos, verificar solapamiento
                  (NEW.hora_inicio < b.hora_fin AND NEW.hora_fin > b.hora_inicio)
              )
          );

        IF count_solapamientos > 0 THEN
            RAISE EXCEPTION 'El bloqueo se solapa con otro bloqueo existente del mismo profesional';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_bloqueos_horarios() IS
'Trigger function: Valida coherencia organizacional y detecta solapamientos de horarios. Se ejecuta BEFORE INSERT/UPDATE.';

-- ====================================================================
-- FUNCIÓN 3: VERIFICAR SI UN HORARIO ESTÁ BLOQUEADO
-- ====================================================================
-- Verifica si una fecha/hora específica está bloqueada para un profesional
-- Retorna: BOOLEAN
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION esta_bloqueado_horario(
    p_organizacion_id INTEGER,
    p_profesional_id INTEGER,
    p_fecha DATE,
    p_hora_inicio TIME DEFAULT NULL,
    p_hora_fin TIME DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    bloqueo_encontrado BOOLEAN := false;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM bloqueos_horarios b
        WHERE b.organizacion_id = p_organizacion_id
          AND b.activo = true
          AND p_fecha BETWEEN b.fecha_inicio AND b.fecha_fin
          AND (
              -- Bloqueo organizacional (afecta a todos)
              b.profesional_id IS NULL OR
              -- Bloqueo específico del profesional
              b.profesional_id = p_profesional_id
          )
          AND (
              -- Bloqueo de todo el día
              (b.hora_inicio IS NULL AND b.hora_fin IS NULL) OR
              -- Si se especifica horario, verificar solapamiento
              (p_hora_inicio IS NOT NULL AND p_hora_fin IS NOT NULL AND
               b.hora_inicio IS NOT NULL AND b.hora_fin IS NOT NULL AND
               p_hora_inicio < b.hora_fin AND p_hora_fin > b.hora_inicio)
          )
    ) INTO bloqueo_encontrado;

    RETURN bloqueo_encontrado;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION esta_bloqueado_horario(INTEGER, INTEGER, DATE, TIME, TIME) IS
'Función de utilidad: Verifica si una fecha/hora específica está bloqueada para un profesional. Considera bloqueos organizacionales y específicos del profesional.';

-- ====================================================================
-- FUNCIÓN 4: OBTENER BLOQUEOS DE UN PERÍODO
-- ====================================================================
-- Retorna todos los bloqueos que afectan un período específico
-- Retorna: TABLE con detalles de cada bloqueo
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION obtener_bloqueos_periodo(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE,
    p_profesional_id INTEGER DEFAULT NULL
)
RETURNS TABLE(
    bloqueo_id INTEGER,
    tipo_bloqueo_id INTEGER,
    tipo_bloqueo_codigo VARCHAR(50),
    tipo_bloqueo_nombre VARCHAR(100),
    titulo VARCHAR(200),
    fecha_inicio DATE,
    fecha_fin DATE,
    hora_inicio TIME,
    hora_fin TIME,
    es_todo_el_dia BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        b.id,
        b.tipo_bloqueo_id,
        tb.codigo,
        tb.nombre,
        b.titulo,
        b.fecha_inicio,
        b.fecha_fin,
        b.hora_inicio,
        b.hora_fin,
        (b.hora_inicio IS NULL AND b.hora_fin IS NULL) as es_todo_el_dia
    FROM bloqueos_horarios b
    JOIN tipos_bloqueo tb ON b.tipo_bloqueo_id = tb.id
    WHERE b.organizacion_id = p_organizacion_id
      AND b.activo = true
      AND (b.fecha_inicio <= p_fecha_fin AND b.fecha_fin >= p_fecha_inicio)
      AND (
          p_profesional_id IS NULL OR
          b.profesional_id IS NULL OR
          b.profesional_id = p_profesional_id
      )
    ORDER BY b.fecha_inicio, b.hora_inicio NULLS FIRST;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_bloqueos_periodo(INTEGER, DATE, DATE, INTEGER) IS
'Función de consulta: Retorna todos los bloqueos que afectan un período específico. Incluye información del tipo de bloqueo.';

-- ====================================================================
-- 📊 RESUMEN DE FUNCIONES
-- ====================================================================
-- Total: 4 funciones PL/pgSQL
--
-- Por tipo:
-- • 2 Trigger functions (timestamps, validación)
-- • 2 Utility functions (consultas y verificación)
--
-- Uso:
-- • actualizar_timestamp_bloqueos(): BEFORE UPDATE
-- • validar_bloqueos_horarios(): BEFORE INSERT/UPDATE
-- • esta_bloqueado_horario(): SELECT desde backend/API
-- • obtener_bloqueos_periodo(): SELECT desde backend/API
--
-- Dependencias:
-- • profesionales, servicios (validación coherencia)
-- • tipos_bloqueo (información de catálogo)
-- ====================================================================

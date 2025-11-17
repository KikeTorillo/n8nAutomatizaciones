-- ====================================================================
-- 📅 MÓDULO AGENDAMIENTO - ÍNDICES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: agendamiento
--
-- DESCRIPCIÓN:
-- Índices especializados para optimizar consultas de horarios y disponibilidad.
-- Performance crítica para verificación de slots disponibles y generación de calendario.
--
-- ÍNDICES:
-- • idx_horarios_profesionales_profesional: Búsqueda por profesional (query principal)
-- • idx_horarios_profesionales_dia_activo: Filtrado por día de semana
-- • idx_horarios_profesionales_vigencia: Horarios con vigencia temporal
-- • idx_horarios_profesionales_premium: Horarios con recargo premium
-- • idx_horarios_profesionales_generacion: Optimización para generación de disponibilidad
--
-- ====================================================================

-- ====================================================================
-- 📊 ÍNDICES PARA TABLA HORARIOS_PROFESIONALES
-- ====================================================================

-- Índice principal para búsquedas por profesional
-- Uso: WHERE profesional_id = ? AND activo = TRUE
-- Performance: O(log n) para horarios de un profesional
CREATE INDEX idx_horarios_profesionales_profesional
    ON horarios_profesionales(profesional_id, activo) WHERE activo = TRUE;

-- Índice para búsquedas por día de semana
-- Uso: WHERE dia_semana = ? AND activo = TRUE AND permite_citas = TRUE
-- Caso: Mostrar profesionales disponibles los lunes
CREATE INDEX idx_horarios_profesionales_dia_activo
    ON horarios_profesionales(dia_semana, activo, permite_citas)
    WHERE activo = TRUE;

-- Índice para horarios con vigencia temporal
-- Uso: WHERE fecha_inicio <= ? AND (fecha_fin IS NULL OR fecha_fin >= ?)
-- Caso: Filtrar horarios vigentes en una fecha específica
CREATE INDEX idx_horarios_profesionales_vigencia
    ON horarios_profesionales(fecha_inicio, fecha_fin, activo)
    WHERE activo = TRUE;

-- Índice para horarios premium
-- Uso: WHERE profesional_id = ? AND precio_premium > 0
-- Caso: Identificar slots con recargo adicional
CREATE INDEX idx_horarios_profesionales_premium
    ON horarios_profesionales(profesional_id, precio_premium)
    WHERE activo = TRUE AND precio_premium > 0;

-- Índice compuesto para generación de disponibilidad
-- Uso: WHERE profesional_id = ? AND dia_semana = ? AND permite_citas = TRUE AND activo = TRUE
-- Caso: Generar calendario semanal de un profesional
-- Performance crítica: Query más frecuente del módulo
CREATE INDEX idx_horarios_profesionales_generacion
    ON horarios_profesionales(profesional_id, dia_semana, permite_citas, activo)
    WHERE activo = TRUE AND permite_citas = TRUE;

-- ====================================================================
-- 📝 COMENTARIOS DE ÍNDICES
-- ====================================================================

COMMENT ON INDEX idx_horarios_profesionales_profesional IS
'Índice principal para búsquedas por profesional. Query más frecuente del módulo.';

COMMENT ON INDEX idx_horarios_profesionales_dia_activo IS
'Índice para filtrar horarios por día de semana. Usado en vista de calendario semanal.';

COMMENT ON INDEX idx_horarios_profesionales_vigencia IS
'Índice para horarios con vigencia temporal. Soporta cambios estacionales y horarios temporales.';

COMMENT ON INDEX idx_horarios_profesionales_premium IS
'Índice para identificar horarios con recargo premium. Optimiza cálculo de precios.';

COMMENT ON INDEX idx_horarios_profesionales_generacion IS
'Índice compuesto para generación de disponibilidad. Performance crítica para calendario.';

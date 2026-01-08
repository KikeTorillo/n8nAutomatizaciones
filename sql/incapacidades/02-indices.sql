-- =====================================================
-- MÓDULO INCAPACIDADES - Índices
-- Enero 2026
-- =====================================================

-- =====================================================
-- ÍNDICES DE RENDIMIENTO
-- =====================================================

-- Índice principal: organización + profesional (consultas frecuentes)
CREATE INDEX IF NOT EXISTS idx_incapacidades_org_prof
    ON incapacidades(organizacion_id, profesional_id);

-- Índice por estado (filtros de lista)
CREATE INDEX IF NOT EXISTS idx_incapacidades_estado
    ON incapacidades(organizacion_id, estado);

-- Índice por fechas (búsqueda de períodos)
CREATE INDEX IF NOT EXISTS idx_incapacidades_fechas
    ON incapacidades(organizacion_id, fecha_inicio, fecha_fin);

-- Índice parcial: incapacidades activas (consulta más común)
CREATE INDEX IF NOT EXISTS idx_incapacidades_activas
    ON incapacidades(organizacion_id, profesional_id)
    WHERE estado = 'activa';

-- Índice por bloqueo_id (para JOINs con bloqueos_horarios)
CREATE INDEX IF NOT EXISTS idx_incapacidades_bloqueo
    ON incapacidades(bloqueo_id)
    WHERE bloqueo_id IS NOT NULL;

-- Índice por tipo de incapacidad (reportes)
CREATE INDEX IF NOT EXISTS idx_incapacidades_tipo
    ON incapacidades(organizacion_id, tipo_incapacidad);

-- Índice para prórrogas (cadena de incapacidades)
CREATE INDEX IF NOT EXISTS idx_incapacidades_prorroga
    ON incapacidades(incapacidad_origen_id)
    WHERE incapacidad_origen_id IS NOT NULL;

-- Índice por fecha de creación (ordenamiento por defecto)
CREATE INDEX IF NOT EXISTS idx_incapacidades_creado
    ON incapacidades(organizacion_id, creado_en DESC);

-- =====================================================
-- COMENTARIOS
-- =====================================================
COMMENT ON INDEX idx_incapacidades_activas IS
'Índice parcial para consultas de incapacidades vigentes. Optimiza dashboard y validaciones.';

COMMENT ON INDEX idx_incapacidades_fechas IS
'Índice compuesto para búsqueda de solapamientos y filtros por período.';

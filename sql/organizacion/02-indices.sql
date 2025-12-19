-- ====================================================================
-- MÓDULO ORGANIZACIÓN: ÍNDICES
-- ====================================================================
-- Índices para optimizar consultas de estructura organizacional.
-- NOTA: Índices base de profesionales están en sql/profesionales/02-indices.sql
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 📊 ÍNDICES ADICIONALES PARA PROFESIONALES (campos de organización)
-- ====================================================================
-- Estos índices complementan los del módulo profesionales con campos
-- específicos del módulo organización (tipo, estado, código)
-- ────────────────────────────────────────────────────────────────────

-- Índice por tipo de empleado
CREATE INDEX idx_profesionales_org_tipo ON profesionales(organizacion_id, tipo);

-- Índice por estado laboral
CREATE INDEX idx_profesionales_org_estado ON profesionales(organizacion_id, estado);

-- Índice por código de empleado
CREATE INDEX idx_profesionales_codigo ON profesionales(organizacion_id, codigo)
    WHERE codigo IS NOT NULL;

-- Empleados con acceso a agendamiento (para booking)
CREATE INDEX idx_profesionales_agendamiento ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND (modulos_acceso->>'agendamiento')::boolean = true;

-- Empleados con acceso a POS
CREATE INDEX idx_profesionales_pos ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND (modulos_acceso->>'pos')::boolean = true;

-- Empleados con acceso a inventario
CREATE INDEX idx_profesionales_inventario ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND (modulos_acceso->>'inventario')::boolean = true;

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================
COMMENT ON INDEX idx_profesionales_agendamiento IS
'Empleados activos con modulos_acceso.agendamiento=true. Para queries de disponibilidad.';

COMMENT ON INDEX idx_profesionales_codigo IS
'Búsqueda rápida por código de empleado dentro de organización.';

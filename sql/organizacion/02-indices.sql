-- ====================================================================
-- MÓDULO ORGANIZACIÓN: ÍNDICES
-- ====================================================================
-- Índices para optimizar consultas de estructura organizacional.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 📊 ÍNDICES PARA PROFESIONALES (nuevos campos)
-- ====================================================================

-- Índice por tipo de empleado
CREATE INDEX idx_profesionales_org_tipo ON profesionales(organizacion_id, tipo);

-- Índice por estado laboral
CREATE INDEX idx_profesionales_org_estado ON profesionales(organizacion_id, estado);

-- Índice por supervisor (para queries de jerarquía)
CREATE INDEX idx_profesionales_supervisor ON profesionales(supervisor_id)
    WHERE supervisor_id IS NOT NULL;

-- Índice por departamento
CREATE INDEX idx_profesionales_departamento ON profesionales(departamento_id)
    WHERE departamento_id IS NOT NULL;

-- Índice por puesto
CREATE INDEX idx_profesionales_puesto ON profesionales(puesto_id)
    WHERE puesto_id IS NOT NULL;

-- Empleados con acceso a agendamiento (para booking)
CREATE INDEX idx_profesionales_agendamiento ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND (modulos_acceso->>'agendamiento')::boolean = true;

-- Empleados disponibles online para booking público
CREATE INDEX idx_profesionales_online ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND disponible_online = true;

-- Empleados con acceso a POS
CREATE INDEX idx_profesionales_pos ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND (modulos_acceso->>'pos')::boolean = true;

-- Empleados con acceso a inventario
CREATE INDEX idx_profesionales_inventario ON profesionales(organizacion_id)
    WHERE estado = 'activo' AND (modulos_acceso->>'inventario')::boolean = true;

-- Índice por código de empleado
CREATE INDEX idx_profesionales_codigo ON profesionales(organizacion_id, codigo)
    WHERE codigo IS NOT NULL;

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================
COMMENT ON INDEX idx_profesionales_agendamiento IS
'Empleados activos con modulos_acceso.agendamiento=true. Para queries de disponibilidad.';

COMMENT ON INDEX idx_profesionales_online IS
'Empleados disponibles para booking público online.';

COMMENT ON INDEX idx_profesionales_supervisor IS
'Para queries de jerarquía: obtener subordinados de un supervisor.';

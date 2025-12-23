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

-- ====================================================================
-- 🔐 ÍNDICES DE ACCESO A MÓDULOS (ELIMINADOS - Dic 2025)
-- ====================================================================
-- Los índices idx_profesionales_agendamiento, idx_profesionales_pos,
-- idx_profesionales_inventario fueron eliminados.
--
-- El control de acceso a módulos ahora se hace mediante el sistema
-- de permisos normalizados. Ver: sql/nucleo/11-tablas-permisos.sql
--
-- Para verificar si un usuario tiene acceso a un módulo:
--   SELECT tiene_permiso(usuario_id, sucursal_id, 'agendamiento.acceso');
--   SELECT tiene_permiso(usuario_id, sucursal_id, 'pos.acceso');
--   SELECT tiene_permiso(usuario_id, sucursal_id, 'inventario.acceso');
-- ====================================================================

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================
COMMENT ON INDEX idx_profesionales_codigo IS
'Búsqueda rápida por código de empleado dentro de organización.';

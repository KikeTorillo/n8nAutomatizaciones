-- ====================================================================
-- MÓDULO CATÁLOGOS: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para:
-- • Búsquedas por organización
-- • Búsquedas por código (únicos)
-- • Búsquedas por categoría
-- • Búsquedas en arrays (GIN)
--
-- Migrado de: sql/schema/04-catalog-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES PARA TIPOS_BLOQUEO (3 índices)
-- ====================================================================

-- Índice único: código por organización (tipos personalizados)
CREATE UNIQUE INDEX idx_tipos_bloqueo_codigo_org_unique
ON tipos_bloqueo (organizacion_id, LOWER(codigo))
WHERE organizacion_id IS NOT NULL AND activo = true;

-- Índice único: tipos del sistema (código global)
CREATE UNIQUE INDEX idx_tipos_bloqueo_sistema_codigo_unique
ON tipos_bloqueo (LOWER(codigo))
WHERE organizacion_id IS NULL AND activo = true;

-- Índice para búsquedas por organización
CREATE INDEX idx_tipos_bloqueo_organizacion
ON tipos_bloqueo (organizacion_id, activo, orden_display)
WHERE activo = true;

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON INDEX idx_tipos_bloqueo_codigo_org_unique IS
'Garantiza unicidad de código por organización para tipos personalizados';

COMMENT ON INDEX idx_tipos_bloqueo_sistema_codigo_unique IS
'Garantiza unicidad de código para tipos del sistema globales';

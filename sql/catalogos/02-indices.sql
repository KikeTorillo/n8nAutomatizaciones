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
-- ÍNDICES PARA TIPOS_PROFESIONAL (6 índices)
-- ====================================================================

-- Índice único: código por organización (tipos personalizados)
CREATE UNIQUE INDEX idx_tipos_profesional_codigo_org_unique
ON tipos_profesional (organizacion_id, LOWER(codigo))
WHERE organizacion_id IS NOT NULL AND activo = true;

-- Índice único: tipos del sistema (código global)
CREATE UNIQUE INDEX idx_tipos_profesional_sistema_codigo_unique
ON tipos_profesional (LOWER(codigo))
WHERE organizacion_id IS NULL AND activo = true;

-- Índice para búsquedas por organización
CREATE INDEX idx_tipos_profesional_organizacion
ON tipos_profesional (organizacion_id, activo, categoria)
WHERE activo = true;

-- Índice para tipos del sistema
CREATE INDEX idx_tipos_profesional_sistema
ON tipos_profesional (es_sistema, activo)
WHERE es_sistema = true;

-- Índice para búsquedas por categoría
CREATE INDEX idx_tipos_profesional_categoria
ON tipos_profesional (categoria, activo)
WHERE activo = true;

-- Índice GIN para búsquedas en array de industrias
CREATE INDEX idx_tipos_profesional_industrias
ON tipos_profesional USING GIN (industrias_compatibles);

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON INDEX idx_tipos_bloqueo_codigo_org_unique IS
'Garantiza unicidad de código por organización para tipos personalizados';

COMMENT ON INDEX idx_tipos_bloqueo_sistema_codigo_unique IS
'Garantiza unicidad de código para tipos del sistema globales';

COMMENT ON INDEX idx_tipos_profesional_industrias IS
'Índice GIN para búsquedas rápidas en array de industrias compatibles';

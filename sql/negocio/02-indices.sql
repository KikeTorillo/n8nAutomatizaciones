-- ====================================================================
-- MÓDULO NEGOCIO: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para las tablas de servicios.
-- Refactorizado Dic 2025: índices de profesionales y clientes movidos a sus módulos.
--
-- 🗑️ PATRÓN SOFT DELETE (Dic 2025):
-- Todos los índices parciales usan `eliminado_en IS NULL` como filtro
-- para excluir registros eliminados lógicamente.
--
-- CARACTERÍSTICAS:
-- • Índices multi-tenant para aislamiento por organización
-- • Índices GIN para búsqueda full-text en español
-- • Índices covering para máxima performance
-- ====================================================================

-- ====================================================================
-- 🎯 ÍNDICES PARA TABLA SERVICIOS (7 índices especializados)
-- ====================================================================
-- Optimización para catálogo de servicios personalizado por organización
-- ────────────────────────────────────────────────────────────────────

-- 🏢 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Consultas principales filtradas por organización
-- Uso: WHERE organizacion_id = ? AND eliminado_en IS NULL
CREATE INDEX idx_servicios_organizacion_activo
    ON servicios (organizacion_id, activo) WHERE eliminado_en IS NULL;

-- 🔍 ÍNDICE 2: BÚSQUEDA FULL-TEXT COMBINADA
-- Propósito: Búsqueda inteligente en nombre, descripción y categoría
-- Uso: Autocompletar y búsqueda de servicios en español
DROP INDEX IF EXISTS idx_servicios_busqueda_gin;  -- Reemplazar índice anterior
DROP INDEX IF EXISTS idx_servicios_nombre_gin;     -- Por si existe versión antigua

CREATE INDEX idx_servicios_search_combined
    ON servicios USING gin(
        to_tsvector('spanish',
            COALESCE(nombre, '') || ' ' ||
            COALESCE(descripcion, '') || ' ' ||
            COALESCE(categoria, '')
        )
    ) WHERE eliminado_en IS NULL;

COMMENT ON INDEX idx_servicios_search_combined IS
'Índice GIN compuesto para búsqueda en catálogo de servicios.
Busca en: nombre, descripción, categoría.
Optimizado para: Buscador de servicios en frontend público.
Performance: <10ms para millones de registros.';

-- 📂 ÍNDICE 3: FILTRO POR CATEGORÍA
-- Propósito: Navegación jerárquica por categorías
-- Uso: WHERE organizacion_id = ? AND categoria = ? AND eliminado_en IS NULL
CREATE INDEX idx_servicios_categoria
    ON servicios (organizacion_id, categoria, activo)
    WHERE eliminado_en IS NULL AND categoria IS NOT NULL;

-- 💰 ÍNDICE 4: ORDENAMIENTO POR PRECIO
-- Propósito: Listados ordenados por precio (low-to-high, high-to-low)
-- Uso: ORDER BY precio ASC/DESC dentro de organización
CREATE INDEX idx_servicios_precio
    ON servicios (organizacion_id, precio, activo) WHERE eliminado_en IS NULL;

-- 🏷️ ÍNDICE 5: BÚSQUEDA POR TAGS
-- Propósito: Filtrado avanzado por etiquetas
-- Uso: WHERE tags && ARRAY['popular', 'promocion']
CREATE INDEX idx_servicios_tags_gin
    ON servicios USING gin(tags) WHERE eliminado_en IS NULL AND array_length(tags, 1) > 0;

-- 📊 ÍNDICE 6: COVERING INDEX PARA SERVICIOS POR CATEGORÍA
-- Propósito: Menú de servicios agrupados por categoría
-- Uso: SELECT nombre, precio, duracion FROM servicios WHERE organizacion_id = ? AND categoria = ?
CREATE INDEX IF NOT EXISTS idx_servicios_categoria_covering
    ON servicios (organizacion_id, categoria, activo, creado_en)
    INCLUDE (nombre, descripcion, duracion_minutos, precio, subcategoria)
    WHERE eliminado_en IS NULL;

COMMENT ON INDEX idx_servicios_categoria_covering IS
'Índice covering para menú de servicios agrupados por categoría.
Optimiza queries para mostrar catálogo público de servicios.
INCLUDE evita acceso al heap para mejor performance.';

-- ====================================================================
-- 🔗 ÍNDICES PARA TABLA SERVICIOS_PROFESIONALES (2 índices)
-- ====================================================================
-- Optimización para relación M:N entre servicios y profesionales
-- ────────────────────────────────────────────────────────────────────

-- 🎯 ÍNDICE 1: BÚSQUEDA POR SERVICIO
-- Propósito: Listar profesionales que brindan un servicio
-- Uso: WHERE servicio_id = ? AND activo = TRUE
CREATE INDEX idx_servicios_profesionales_servicio
    ON servicios_profesionales (servicio_id, activo) WHERE activo = TRUE;

-- 👨‍💼 ÍNDICE 2: BÚSQUEDA POR PROFESIONAL
-- Propósito: Listar servicios que brinda un profesional
-- Uso: WHERE profesional_id = ? AND activo = TRUE
CREATE INDEX idx_servicios_profesionales_profesional
    ON servicios_profesionales (profesional_id, activo) WHERE activo = TRUE;

-- NOTA: servicios_profesionales es tabla intermedia M:N
-- No usa eliminado_en directamente, hereda estado del servicio/profesional padre

-- 🏢 ÍNDICE 3: MULTI-TENANT PARA SERVICIOS_PROFESIONALES
-- Propósito: Consultas filtradas por organización
-- Uso: WHERE organizacion_id = ?
CREATE INDEX idx_servicios_profesionales_org
    ON servicios_profesionales (organizacion_id);

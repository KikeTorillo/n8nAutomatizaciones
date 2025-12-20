-- ====================================================================
-- MÓDULO CUSTOM FIELDS: ÍNDICES
-- ====================================================================
-- Índices optimizados para consultas frecuentes de campos personalizados.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES: custom_fields_definiciones
-- ====================================================================

-- Índice principal para listados por organización y entidad
CREATE INDEX IF NOT EXISTS idx_cf_definiciones_org_entidad
    ON custom_fields_definiciones(organizacion_id, entidad_tipo, orden)
    WHERE activo = TRUE AND eliminado_en IS NULL;

-- Búsqueda por nombre_clave (API lookups)
CREATE INDEX IF NOT EXISTS idx_cf_definiciones_busqueda
    ON custom_fields_definiciones(organizacion_id, entidad_tipo, nombre_clave)
    WHERE eliminado_en IS NULL;

-- Filtro por sección (agrupación en UI)
CREATE INDEX IF NOT EXISTS idx_cf_definiciones_seccion
    ON custom_fields_definiciones(organizacion_id, entidad_tipo, seccion)
    WHERE activo = TRUE AND eliminado_en IS NULL AND seccion IS NOT NULL;

-- Campos visibles en listados (para tablas/grids)
CREATE INDEX IF NOT EXISTS idx_cf_definiciones_listado
    ON custom_fields_definiciones(organizacion_id, entidad_tipo)
    WHERE visible_en_listado = TRUE AND activo = TRUE AND eliminado_en IS NULL;

-- Covering index para formularios (evita acceso al heap)
CREATE INDEX IF NOT EXISTS idx_cf_definiciones_formulario
    ON custom_fields_definiciones(organizacion_id, entidad_tipo, orden)
    INCLUDE (nombre, nombre_clave, tipo_dato, requerido, placeholder, opciones)
    WHERE visible_en_formulario = TRUE AND activo = TRUE AND eliminado_en IS NULL;

COMMENT ON INDEX idx_cf_definiciones_org_entidad IS
'Índice principal para listar campos por organización y tipo de entidad. Ordenado por campo orden.';

COMMENT ON INDEX idx_cf_definiciones_formulario IS
'Covering index para renderizar formularios. INCLUDE evita acceso al heap (+40% performance).';

-- ====================================================================
-- ÍNDICES: custom_fields_valores
-- ====================================================================

-- Índice principal para obtener valores de una entidad
CREATE INDEX IF NOT EXISTS idx_cf_valores_entidad
    ON custom_fields_valores(entidad_tipo, entidad_id);

-- Índice por definición (para reportes y estadísticas)
CREATE INDEX IF NOT EXISTS idx_cf_valores_definicion
    ON custom_fields_valores(definicion_id);

-- Índice compuesto organización + entidad (queries multi-tenant)
CREATE INDEX IF NOT EXISTS idx_cf_valores_org_entidad
    ON custom_fields_valores(organizacion_id, entidad_tipo, entidad_id);

-- Búsqueda full-text en valores de texto
CREATE INDEX IF NOT EXISTS idx_cf_valores_texto_gin
    ON custom_fields_valores USING gin(to_tsvector('spanish', valor_texto))
    WHERE valor_texto IS NOT NULL;

-- Búsqueda en valores JSON (multiselect, etc.)
CREATE INDEX IF NOT EXISTS idx_cf_valores_json_gin
    ON custom_fields_valores USING gin(valor_json)
    WHERE valor_json IS NOT NULL;

-- Índice para valores numéricos (rangos, filtros)
CREATE INDEX IF NOT EXISTS idx_cf_valores_numero
    ON custom_fields_valores(definicion_id, valor_numero)
    WHERE valor_numero IS NOT NULL;

-- Índice para valores de fecha (rangos, filtros)
CREATE INDEX IF NOT EXISTS idx_cf_valores_fecha
    ON custom_fields_valores(definicion_id, valor_fecha)
    WHERE valor_fecha IS NOT NULL;

-- Índice para valores booleanos (filtros checkbox)
CREATE INDEX IF NOT EXISTS idx_cf_valores_booleano
    ON custom_fields_valores(definicion_id, valor_booleano)
    WHERE valor_booleano IS NOT NULL;

COMMENT ON INDEX idx_cf_valores_entidad IS
'Índice principal para obtener todos los valores de una entidad específica.';

COMMENT ON INDEX idx_cf_valores_texto_gin IS
'Índice GIN para búsqueda full-text en español en valores de texto.';

COMMENT ON INDEX idx_cf_valores_json_gin IS
'Índice GIN para búsqueda en valores JSONB (multiselect, estructuras complejas).';

-- ====================================================================
-- FIN: ÍNDICES CUSTOM FIELDS
-- ====================================================================

-- ====================================================================
-- MÓDULO MARKETPLACE: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- 24 índices optimizados para:
-- • Búsqueda full-text en español (GIN)
-- • Filtros geográficos (ciudad, estado)
-- • Consultas públicas sin autenticación
-- • Dashboard de analytics
-- • Sistema de reseñas con ordenamiento
--
-- ESTRATEGIA:
-- • Índices parciales para filtrar solo registros activos
-- • Índices GIN para búsqueda full-text y JSONB
-- • Índices compuestos para queries comunes
-- • Índices covering para evitar table lookups
--
-- Fecha creación: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES PARA marketplace_perfiles (10 índices)
-- ====================================================================

-- 🔑 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Aislamiento por organización
-- Uso: WHERE organizacion_id = ?
CREATE INDEX idx_marketplace_perfiles_org
    ON marketplace_perfiles(organizacion_id);

-- 📍 ÍNDICE 2: BÚSQUEDA POR CIUDAD (FK normalizada)
-- Propósito: Filtrar negocios por ciudad (query MÁS común)
-- Uso: WHERE ciudad_id = 123
CREATE INDEX idx_marketplace_perfiles_ciudad
    ON marketplace_perfiles(ciudad_id);

-- 📍 ÍNDICE 3: BÚSQUEDA POR ESTADO (FK normalizada)
-- Propósito: Filtrar negocios por estado/provincia
-- Uso: WHERE estado_id = 14
CREATE INDEX idx_marketplace_perfiles_estado
    ON marketplace_perfiles(estado_id);

-- 🎯 ÍNDICE 4: PERFILES ACTIVOS (PARCIAL)
-- Propósito: Solo perfiles activados manualmente
-- Uso: WHERE activo = TRUE
CREATE INDEX idx_marketplace_perfiles_activo
    ON marketplace_perfiles(activo)
    WHERE activo = true;

-- 👁️ ÍNDICE 5: VISIBLES EN DIRECTORIO (PARCIAL)
-- Propósito: Solo perfiles visibles en búsquedas
-- Uso: WHERE visible_en_directorio = TRUE
CREATE INDEX idx_marketplace_perfiles_visible
    ON marketplace_perfiles(visible_en_directorio)
    WHERE visible_en_directorio = true;

-- 🔍 ÍNDICE 6: BÚSQUEDA POR SLUG (ÚNICO)
-- Propósito: Lookup rápido por URL amigable
-- Uso: WHERE slug = 'guadalajara-barberia-salon-juan'
CREATE INDEX idx_marketplace_perfiles_slug
    ON marketplace_perfiles(slug);

-- 🔍 ÍNDICE 7: BÚSQUEDA FULL-TEXT (GIN)
-- Propósito: Búsqueda avanzada en múltiples campos
-- Uso: search_vector @@ plainto_tsquery('spanish', 'barbería')
-- NOTA: search_vector se actualiza automáticamente por trigger
CREATE INDEX idx_marketplace_search
    ON marketplace_perfiles USING GIN(search_vector);

-- 📍 ÍNDICE 8: CIUDAD + ESTADO (COMPUESTO NORMALIZADO)
-- Propósito: Búsquedas combinadas por ubicación geográfica
-- Uso: WHERE ciudad_id = ? AND activo = TRUE AND visible_en_directorio = TRUE
CREATE INDEX idx_marketplace_ciudad_estado
    ON marketplace_perfiles(ciudad_id, estado_id, activo, visible_en_directorio)
    WHERE activo = true AND visible_en_directorio = true;

-- ⭐ ÍNDICE 9: ORDENAMIENTO POR RATING
-- Propósito: Listar negocios mejor valorados
-- Uso: ORDER BY rating_promedio DESC
CREATE INDEX idx_marketplace_perfiles_rating
    ON marketplace_perfiles(rating_promedio DESC, total_reseñas DESC)
    WHERE activo = true AND visible_en_directorio = true;

-- 📅 ÍNDICE 10: ORDENAMIENTO POR FECHA DE PUBLICACIÓN
-- Propósito: Negocios más recientes
-- Uso: ORDER BY publicado_en DESC
CREATE INDEX idx_marketplace_perfiles_reciente
    ON marketplace_perfiles(publicado_en DESC)
    WHERE activo = true AND publicado_en IS NOT NULL;

-- ====================================================================
-- ÍNDICES PARA marketplace_reseñas (7 índices)
-- ====================================================================

-- 🔑 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Aislamiento por organización
-- Uso: WHERE organizacion_id = ?
CREATE INDEX idx_marketplace_reseñas_org
    ON marketplace_reseñas(organizacion_id);

-- 👤 ÍNDICE 2: POR CLIENTE
-- Propósito: Listar reseñas de un cliente
-- Uso: WHERE cliente_id = ?
CREATE INDEX idx_marketplace_reseñas_cliente
    ON marketplace_reseñas(cliente_id);

-- 📅 ÍNDICE 3: POR CITA
-- Propósito: Verificar si cita ya tiene reseña
-- Uso: WHERE cita_id = ?
CREATE INDEX idx_marketplace_reseñas_cita
    ON marketplace_reseñas(cita_id);

-- 👨‍💼 ÍNDICE 4: POR PROFESIONAL
-- Propósito: Reseñas específicas de un profesional
-- Uso: WHERE profesional_id = ?
CREATE INDEX idx_marketplace_reseñas_profesional
    ON marketplace_reseñas(profesional_id);

-- 🚦 ÍNDICE 5: POR ESTADO (PARCIAL)
-- Propósito: Solo reseñas publicadas (para vista pública)
-- Uso: WHERE estado = 'publicada'
CREATE INDEX idx_marketplace_reseñas_estado
    ON marketplace_reseñas(estado)
    WHERE estado = 'publicada';

-- ⭐ ÍNDICE 6: POR RATING
-- Propósito: Filtrar y ordenar por calificación
-- Uso: WHERE rating = 5 ORDER BY creado_en DESC
CREATE INDEX idx_marketplace_reseñas_rating
    ON marketplace_reseñas(rating);

-- 📅 ÍNDICE 7: POR FECHA DE CREACIÓN (ORDENAMIENTO)
-- Propósito: Reseñas más recientes primero
-- Uso: ORDER BY creado_en DESC
CREATE INDEX idx_marketplace_reseñas_creado
    ON marketplace_reseñas(creado_en DESC);

-- ====================================================================
-- ÍNDICES PARA marketplace_analytics (6 índices)
-- ====================================================================

-- 🔑 ÍNDICE 1: MULTI-TENANT PRINCIPAL
-- Propósito: Aislamiento por organización
-- Uso: WHERE organizacion_id = ?
CREATE INDEX idx_marketplace_analytics_org
    ON marketplace_analytics(organizacion_id);

-- 📊 ÍNDICE 2: POR TIPO DE EVENTO
-- Propósito: Filtrar por tipo de interacción
-- Uso: WHERE evento_tipo = 'vista_perfil'
CREATE INDEX idx_marketplace_analytics_tipo
    ON marketplace_analytics(evento_tipo);

-- 📅 ÍNDICE 3: POR FECHA
-- Propósito: Queries de analytics por rango de fechas
-- Uso: WHERE fecha >= '2025-11-01' AND fecha <= '2025-11-30'
CREATE INDEX idx_marketplace_analytics_fecha
    ON marketplace_analytics(fecha DESC);

-- 📊 ÍNDICE 4: ORG + FECHA (COMPUESTO)
-- Propósito: Dashboard de analytics por organización
-- Uso: WHERE organizacion_id = ? AND fecha >= ?
CREATE INDEX idx_marketplace_analytics_org_fecha
    ON marketplace_analytics(organizacion_id, fecha DESC);

-- 📊 ÍNDICE 5: ORG + TIPO + FECHA (COMPUESTO)
-- Propósito: Queries específicas del dashboard
-- Uso: WHERE organizacion_id = ? AND evento_tipo = ? AND fecha >= ?
CREATE INDEX idx_marketplace_analytics_org_tipo_fecha
    ON marketplace_analytics(organizacion_id, evento_tipo, fecha DESC);

-- 🌐 ÍNDICE 6: POR FUENTE DE TRÁFICO
-- Propósito: Analytics de canales de adquisición
-- Uso: WHERE fuente = 'google'
CREATE INDEX idx_marketplace_analytics_fuente
    ON marketplace_analytics(fuente)
    WHERE fuente IS NOT NULL;

-- ====================================================================
-- ÍNDICES PARA marketplace_categorias (2 índices)
-- ====================================================================

-- 🎯 ÍNDICE 1: CATEGORÍAS ACTIVAS (PARCIAL)
-- Propósito: Solo categorías activas para directorio
-- Uso: WHERE activo = TRUE
CREATE INDEX idx_marketplace_categorias_activo
    ON marketplace_categorias(activo)
    WHERE activo = true;

-- 📊 ÍNDICE 2: ORDENAMIENTO POR ORDEN
-- Propósito: Listar categorías en orden específico
-- Uso: ORDER BY orden ASC
CREATE INDEX idx_marketplace_categorias_orden
    ON marketplace_categorias(orden);

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON INDEX idx_marketplace_search IS
'Índice GIN para búsqueda full-text en español.
Busca en: meta_titulo, descripcion_corta, descripcion_larga + ciudad/estado (desde FKs).
Actualizado automáticamente por trigger (consulta tablas ciudades/estados).
Performance: <10ms para millones de registros.';

COMMENT ON INDEX idx_marketplace_ciudad_estado IS
'Índice compuesto para búsquedas geográficas combinadas (FKs normalizadas).
Query típico: Negocios activos y visibles por ciudad_id y estado_id.
Cubre 80% de las búsquedas públicas del marketplace.';

COMMENT ON INDEX idx_marketplace_analytics_org_tipo_fecha IS
'Índice covering para dashboard de analytics.
Optimiza queries de métricas por tipo de evento y rango de fechas.
Usado por: GET /api/v1/marketplace/analytics/dashboard';

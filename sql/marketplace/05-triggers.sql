-- ====================================================================
-- MÓDULO MARKETPLACE: TRIGGERS AUTOMÁTICOS
-- ====================================================================
-- Triggers para mantenimiento automático de datos:
--
-- TRIGGERS (4):
-- 1. trigger_marketplace_search_vector - Actualiza search_vector
-- 2. trigger_marketplace_updated_at - Actualiza timestamps
-- 3. trigger_marketplace_actualizar_stats_insert - Stats tras INSERT reseña
-- 4. trigger_marketplace_actualizar_stats_update - Stats tras UPDATE reseña
--
-- CARACTERÍSTICAS:
-- • Ejecución automática sin intervención manual
-- • Mantiene integridad de datos
-- • Optimiza búsqueda full-text
-- • Actualiza estadísticas en tiempo real
--
-- Fecha creación: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER 1/4: search_vector
-- ====================================================================
-- Actualiza automáticamente el campo search_vector para búsqueda full-text
-- cada vez que se inserta o modifica un perfil.
--
-- TABLA: marketplace_perfiles
-- MOMENTO: BEFORE INSERT OR UPDATE
-- FUNCIÓN: actualizar_search_vector_marketplace()
-- USO: Búsqueda full-text en español
-- ====================================================================

CREATE TRIGGER trigger_marketplace_search_vector
    BEFORE INSERT OR UPDATE ON marketplace_perfiles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_search_vector_marketplace();

-- ====================================================================
-- TRIGGER 2/4: timestamps
-- ====================================================================
-- Actualiza automáticamente el campo actualizado_en cuando se modifica
-- un perfil.
--
-- TABLA: marketplace_perfiles
-- MOMENTO: BEFORE UPDATE
-- FUNCIÓN: actualizar_timestamp() [fundamentos]
-- USO: Mantener timestamps actualizados
-- ====================================================================

CREATE TRIGGER trigger_marketplace_updated_at
    BEFORE UPDATE ON marketplace_perfiles
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- TRIGGER 3/4: estadísticas tras INSERT de reseña
-- ====================================================================
-- Actualiza total_reseñas y rating_promedio del perfil cuando se
-- inserta una nueva reseña.
--
-- TABLA: marketplace_reseñas
-- MOMENTO: AFTER INSERT
-- FUNCIÓN: actualizar_stats_perfil_marketplace()
-- USO: Mantener estadísticas en tiempo real
-- ====================================================================

CREATE TRIGGER trigger_marketplace_actualizar_stats_insert
    AFTER INSERT ON marketplace_reseñas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stats_perfil_marketplace();

-- ====================================================================
-- TRIGGER 4/4: estadísticas tras UPDATE de reseña
-- ====================================================================
-- Actualiza estadísticas cuando se modifica el rating o estado de
-- una reseña (ej: cambiar de pendiente a publicada).
--
-- TABLA: marketplace_reseñas
-- MOMENTO: AFTER UPDATE OF rating, estado
-- FUNCIÓN: actualizar_stats_perfil_marketplace()
-- USO: Recalcular stats cuando cambia rating o se modera
-- ====================================================================

CREATE TRIGGER trigger_marketplace_actualizar_stats_update
    AFTER UPDATE OF rating, estado ON marketplace_reseñas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stats_perfil_marketplace();

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON TRIGGER trigger_marketplace_search_vector ON marketplace_perfiles IS
'Actualiza search_vector automáticamente para búsqueda full-text.
Función: actualizar_search_vector_marketplace().
Momento: BEFORE INSERT/UPDATE.
Indexa: meta_titulo, ciudad, descripcion_corta, estado, descripcion_larga.';

COMMENT ON TRIGGER trigger_marketplace_updated_at ON marketplace_perfiles IS
'Actualiza actualizado_en automáticamente cuando se modifica un perfil.
Función: actualizar_timestamp() [módulo fundamentos].
Momento: BEFORE UPDATE.';

COMMENT ON TRIGGER trigger_marketplace_actualizar_stats_insert ON marketplace_reseñas IS
'Actualiza estadísticas del perfil tras INSERT de reseña.
Función: actualizar_stats_perfil_marketplace().
Momento: AFTER INSERT.
Actualiza: total_reseñas, rating_promedio.';

COMMENT ON TRIGGER trigger_marketplace_actualizar_stats_update ON marketplace_reseñas IS
'Actualiza estadísticas del perfil tras UPDATE de rating o estado.
Función: actualizar_stats_perfil_marketplace().
Momento: AFTER UPDATE OF rating, estado.
Casos: Cambiar rating, publicar reseña, ocultar reseña.';

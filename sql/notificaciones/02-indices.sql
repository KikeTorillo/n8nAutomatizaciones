-- ====================================================================
-- MODULO NOTIFICACIONES: INDICES
-- ====================================================================
-- Indices optimizados para consultas frecuentes de notificaciones.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- INDICES: notificaciones
-- ====================================================================

-- Indice principal: notificaciones no leidas del usuario (mas frecuente)
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_no_leidas
    ON notificaciones(usuario_id, creado_en DESC)
    WHERE leida = FALSE AND archivada = FALSE;

COMMENT ON INDEX idx_notificaciones_usuario_no_leidas IS
'Indice para el badge de notificaciones no leidas. Query mas frecuente.';

-- Indice para el feed completo del usuario
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_feed
    ON notificaciones(usuario_id, creado_en DESC)
    WHERE archivada = FALSE;

COMMENT ON INDEX idx_notificaciones_usuario_feed IS
'Indice para listar todas las notificaciones del usuario (feed).';

-- Indice para busqueda por tipo y categoria
CREATE INDEX IF NOT EXISTS idx_notificaciones_org_tipo
    ON notificaciones(organizacion_id, tipo, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_notificaciones_org_categoria
    ON notificaciones(organizacion_id, categoria, creado_en DESC);

-- Indice para relacionar con entidades
CREATE INDEX IF NOT EXISTS idx_notificaciones_entidad
    ON notificaciones(entidad_tipo, entidad_id)
    WHERE entidad_id IS NOT NULL;

COMMENT ON INDEX idx_notificaciones_entidad IS
'Indice para buscar notificaciones relacionadas a una entidad especifica.';

-- Indice para limpieza automatica por expiracion
CREATE INDEX IF NOT EXISTS idx_notificaciones_expiracion
    ON notificaciones(expira_en)
    WHERE expira_en IS NOT NULL AND archivada = FALSE;

COMMENT ON INDEX idx_notificaciones_expiracion IS
'Indice para job de limpieza automatica de notificaciones expiradas.';

-- Indice para archivadas (consulta menos frecuente)
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_archivadas
    ON notificaciones(usuario_id, archivada_en DESC)
    WHERE archivada = TRUE;

-- Covering index para contador rapido de no leidas
CREATE INDEX IF NOT EXISTS idx_notificaciones_contador
    ON notificaciones(usuario_id)
    INCLUDE (id)
    WHERE leida = FALSE AND archivada = FALSE;

COMMENT ON INDEX idx_notificaciones_contador IS
'Covering index para COUNT(*) de no leidas. Evita acceso al heap.';

-- ====================================================================
-- INDICES: notificaciones_preferencias
-- ====================================================================

-- Indice por usuario (para obtener todas sus preferencias)
CREATE INDEX IF NOT EXISTS idx_notif_prefs_usuario
    ON notificaciones_preferencias(usuario_id);

-- Indice por tipo (para saber quien recibe cada tipo)
CREATE INDEX IF NOT EXISTS idx_notif_prefs_tipo
    ON notificaciones_preferencias(tipo_notificacion)
    WHERE in_app = TRUE OR email = TRUE OR push = TRUE OR whatsapp = TRUE;

-- ====================================================================
-- INDICES: notificaciones_plantillas
-- ====================================================================

-- Indice por organizacion y tipo
CREATE INDEX IF NOT EXISTS idx_notif_plantillas_org_tipo
    ON notificaciones_plantillas(organizacion_id, tipo_notificacion)
    WHERE activo = TRUE;

-- ====================================================================
-- FIN: INDICES NOTIFICACIONES
-- ====================================================================

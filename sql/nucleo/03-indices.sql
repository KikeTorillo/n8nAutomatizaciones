-- ====================================================================
-- MÓDULO NÚCLEO: ÍNDICES ESPECIALIZADOS
-- ====================================================================
-- Índices optimizados para tablas core y subscripciones.
-- Estrategia: Covering indexes + índices parciales + GIN compuestos
--
-- 🗑️ PATRÓN SOFT DELETE (Dic 2025):
-- Todos los índices parciales usan `eliminado_en IS NULL` como filtro
-- para excluir registros eliminados lógicamente.
--
-- Migrado de: sql/schema/07-indexes.sql
-- Fecha migración: 16 Noviembre 2025
-- Actualizado: Diciembre 2025 - Soft delete consistente
-- ====================================================================

-- ====================================================================
-- ÍNDICES PARA USUARIOS
-- ====================================================================

-- Propósito: Login de usuarios (consulta MÁS frecuente del sistema)
-- Índice parcial que solo indexa usuarios NO eliminados
CREATE UNIQUE INDEX idx_usuarios_email_unique
    ON usuarios (email) WHERE eliminado_en IS NULL;

-- Propósito: Listar usuarios por organización y filtrar por rol
-- Covering index para evitar table lookups
-- FASE 7: Cambiado de rol (ENUM) a rol_id (FK)
CREATE INDEX idx_usuarios_org_rol_activo
    ON usuarios (organizacion_id, rol_id, activo) WHERE eliminado_en IS NULL;

-- Propósito: Vincular usuarios con sus perfiles profesionales
-- Índice parcial solo para usuarios que SÍ tienen profesional_id
CREATE INDEX idx_usuarios_profesional_id
    ON usuarios (profesional_id) WHERE profesional_id IS NOT NULL;

-- Propósito: Identificar usuarios bloqueados o con intentos fallidos
-- Para funcionalidad de seguridad (rate limiting, bloqueos)
CREATE INDEX idx_usuarios_seguridad
    ON usuarios (intentos_fallidos, bloqueado_hasta)
    WHERE intentos_fallidos > 0 OR bloqueado_hasta IS NOT NULL;

-- Propósito: Recuperación de contraseña (lookup por token)
-- Índice parcial solo para tokens válidos no expirados
CREATE INDEX idx_usuarios_reset_token
    ON usuarios (token_reset_password, token_reset_expira)
    WHERE token_reset_password IS NOT NULL AND token_reset_usado_en IS NULL;

-- Propósito: Verificación de email (lookup por token)
-- Índice parcial solo para tokens válidos no usados
CREATE INDEX idx_usuarios_verificacion_email_token
    ON usuarios (token_verificacion_email, token_verificacion_expira)
    WHERE token_verificacion_email IS NOT NULL AND token_verificacion_usado_en IS NULL;

-- Propósito: Métricas y listados de usuarios para admins
-- Dashboard de actividad de usuarios
CREATE INDEX idx_usuarios_dashboard
    ON usuarios (organizacion_id, ultimo_login, activo)
    WHERE eliminado_en IS NULL;

-- Propósito: Búsqueda fuzzy de usuarios por nombre
-- Índice GIN para búsquedas full-text en español
CREATE INDEX idx_usuarios_nombre_gin
    ON usuarios USING gin(to_tsvector('spanish', nombre || ' ' || COALESCE(apellidos, '')))
    WHERE eliminado_en IS NULL;

-- Propósito: Listar usuarios activos vinculados a organizaciones
-- Para queries que filtran por organización
CREATE INDEX IF NOT EXISTS idx_usuarios_organizacion_activos
    ON usuarios(organizacion_id)
    WHERE eliminado_en IS NULL;

-- Propósito: Búsqueda eficiente de usuarios por rol
-- FASE 7: Cambiado de rol (ENUM) a rol_id (FK)
-- El filtro específico para 'bot' se hace vía JOIN con tabla roles
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_org
    ON usuarios(rol_id, organizacion_id)
    WHERE eliminado_en IS NULL;

-- ====================================================================
-- ÍNDICES PARA ORGANIZACIONES
-- ====================================================================

-- Propósito: Login y lookups por código de tenant
-- Índice parcial solo para organizaciones NO eliminadas
CREATE UNIQUE INDEX idx_organizaciones_codigo_tenant
    ON organizaciones (codigo_tenant) WHERE eliminado_en IS NULL;

-- Propósito: URLs personalizadas para organizaciones
-- Índice parcial solo para slugs activos no nulos
CREATE UNIQUE INDEX idx_organizaciones_slug
    ON organizaciones (slug) WHERE eliminado_en IS NULL AND slug IS NOT NULL;

-- Propósito: Reportes y estadísticas por categoría de organización (Nov 2025: migrado a tabla dinámica)
-- Agrupaciones y filtros por categoría
CREATE INDEX idx_organizaciones_categoria
    ON organizaciones (categoria_id, activo) WHERE eliminado_en IS NULL;

-- Propósito: Filtrar organizaciones con perfil de marketplace activo
-- Para reportes y estadísticas de marketplace (Nov 2025)
CREATE INDEX idx_organizaciones_marketplace
    ON organizaciones(tiene_perfil_marketplace)
    WHERE tiene_perfil_marketplace = TRUE AND eliminado_en IS NULL;

-- ====================================================================
-- 🎯 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================
COMMENT ON INDEX idx_usuarios_email_unique IS
'Índice único para login. CRÍTICO para performance de autenticación.
Solo indexa usuarios activos para reducir tamaño.';

COMMENT ON INDEX idx_usuarios_reset_token IS
'Índice parcial para recuperación de contraseña.
Solo indexa tokens válidos (no usados, no expirados).';

COMMENT ON INDEX idx_usuarios_rol_org IS
'Índice para búsqueda eficiente de usuarios por rol_id.
FASE 7: Cambiado de rol ENUM a rol_id FK.
Usado por: MCP server, chatbot authentication.';

COMMENT ON INDEX idx_organizaciones_codigo_tenant IS
'Índice único para lookup de tenant por código.
CRÍTICO para performance de RLS (set app.current_tenant_id).';

-- ====================================================================
-- 🔗 ÍNDICES PARA FOREIGN KEYS DE AUDITORÍA
-- ====================================================================
-- Optimización para JOINs con columnas de auditoría (eliminado_por, actualizado_por)
-- Agregados: Auditoría Dic 2025
-- ====================================================================

-- 🗑️ ÍNDICE: USUARIOS ELIMINADOS POR
-- Propósito: JOINs eficientes para auditoría de eliminaciones
CREATE INDEX idx_usuarios_eliminado_por
    ON usuarios(eliminado_por) WHERE eliminado_por IS NOT NULL;


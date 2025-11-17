-- ====================================================================
-- 📊 MÓDULO CHATBOTS - ÍNDICES ESPECIALIZADOS
-- ====================================================================
--
-- PROPÓSITO:
-- Optimización de consultas para el sistema de chatbots multi-plataforma.
--
-- COMPONENTES:
-- • 6 índices en tabla chatbot_config
-- • 2 índices en tabla chatbot_credentials
--
-- PERFORMANCE:
-- ✅ Búsqueda por organización optimizada
-- ✅ Filtrado por plataforma y estado
-- ✅ Búsquedas inversas desde n8n workflow
-- ✅ Lookup de credentials MCP compartidas
--
-- ORDEN DE CARGA: #11 (después de tablas)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- ÍNDICES: TABLA CHATBOT_CONFIG
-- ====================================================================

-- 1. Índice principal por organización
-- Propósito: Listar todos los chatbots de una organización
-- Uso: WHERE organizacion_id = ?
CREATE INDEX idx_chatbot_organizacion
    ON chatbot_config(organizacion_id);

COMMENT ON INDEX idx_chatbot_organizacion IS
'Índice principal para búsqueda de chatbots por organización.
Usado en listados y filtros de chatbots de una organización específica.';

-- 2. Búsqueda por workflow ID de n8n
-- Propósito: Búsquedas inversas desde n8n workflow hacia chatbot
-- Uso: WHERE n8n_workflow_id = ?
CREATE INDEX idx_chatbot_workflow
    ON chatbot_config(n8n_workflow_id)
    WHERE n8n_workflow_id IS NOT NULL;

COMMENT ON INDEX idx_chatbot_workflow IS
'Índice parcial para búsqueda de chatbot por workflow de n8n.
Solo indexa registros con workflow_id presente (chatbots completamente configurados).
Usado para webhooks de n8n que reportan errores o métricas.';

-- 3. Búsqueda por MCP credential ID
-- Propósito: Búsqueda de chatbots que comparten la misma credential MCP
-- Uso: WHERE mcp_credential_id = ?
-- Estrategia: 1 credential por organización (compartida entre chatbots)
CREATE INDEX idx_chatbot_mcp_credential
    ON chatbot_config(mcp_credential_id)
    WHERE mcp_credential_id IS NOT NULL;

COMMENT ON INDEX idx_chatbot_mcp_credential IS
'Índice parcial para búsqueda de chatbots por credential MCP compartida.
Útil para identificar todos los chatbots de una org que usan la misma credential
al renovar tokens o debugging de autenticación con MCP Server.';

-- 4. Filtrado por soft delete y estado activo
-- Propósito: Listar solo chatbots activos (no eliminados)
-- Uso: WHERE deleted_at IS NULL AND activo = true
CREATE INDEX idx_chatbot_deleted_activo
    ON chatbot_config(organizacion_id, activo)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_chatbot_deleted_activo IS
'Índice compuesto parcial para filtrar chatbots activos y no eliminados.
Excluye soft deletes para performance en queries de producción.';

-- 5. Ordenamiento por última actividad
-- Propósito: Dashboards y métricas de uso
-- Uso: ORDER BY ultimo_mensaje_recibido DESC
CREATE INDEX idx_chatbot_ultimo_mensaje
    ON chatbot_config(ultimo_mensaje_recibido DESC NULLS LAST)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_chatbot_ultimo_mensaje IS
'Índice para ordenar chatbots por actividad reciente.
Útil en dashboards de monitoreo y detección de chatbots inactivos.';

-- 6. Búsqueda por plataforma
-- Propósito: Filtrar chatbots por tipo de plataforma
-- Uso: WHERE plataforma = 'telegram'
CREATE INDEX idx_chatbot_plataforma
    ON chatbot_config(plataforma)
    WHERE deleted_at IS NULL;

COMMENT ON INDEX idx_chatbot_plataforma IS
'Índice parcial para filtrar chatbots por plataforma específica.
Útil para estadísticas y análisis de uso por canal.';

-- ====================================================================
-- ÍNDICES: TABLA CHATBOT_CREDENTIALS
-- ====================================================================

-- 1. Índice principal por chatbot
-- Propósito: Listar credentials de un chatbot
-- Uso: WHERE chatbot_config_id = ?
CREATE INDEX idx_chatbot_cred_config
    ON chatbot_credentials(chatbot_config_id);

COMMENT ON INDEX idx_chatbot_cred_config IS
'Índice principal para buscar credentials asociadas a un chatbot específico.';

-- 2. Búsqueda por tipo de credential
-- Propósito: Filtrar credentials por tipo
-- Uso: WHERE credential_type = 'telegramApi'
CREATE INDEX idx_chatbot_cred_type
    ON chatbot_credentials(credential_type);

COMMENT ON INDEX idx_chatbot_cred_type IS
'Índice para filtrar credentials por tipo (telegramApi, httpHeaderAuth, etc).
Útil para auditoría y gestión de credentials por plataforma.';

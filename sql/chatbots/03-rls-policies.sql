-- ====================================================================
-- 🛡️ MÓDULO CHATBOTS - ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- PROPÓSITO:
-- Aislamiento multi-tenant para sistema de chatbots IA.
-- Garantiza que cada organización solo vea sus propios chatbots.
--
-- COMPONENTES:
-- • 2 políticas para tabla chatbot_config
-- • 2 políticas para tabla chatbot_credentials
--
-- SEGURIDAD:
-- ✅ Aislamiento total por organización
-- ✅ Super admin acceso global para soporte
-- ✅ Bypass controlado para funciones de sistema
-- ✅ Aislamiento indirecto vía FK en credentials
--
-- ORDEN DE CARGA: #11 (después de índices)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN AMBAS TABLAS
-- ====================================================================

ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE chatbot_credentials ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS RLS: TABLA CHATBOT_CONFIG
-- ====================================================================

-- POLÍTICA 1: AISLAMIENTO MULTI-TENANT ESTÁNDAR
-- Permite acceso solo a chatbots de la organización del usuario
CREATE POLICY chatbot_config_tenant_isolation ON chatbot_config
    USING (
        CASE
            -- 🔓 BYPASS: Funciones de sistema pueden ver todo
            WHEN current_setting('app.bypass_rls', TRUE) = 'true' THEN
                TRUE

            -- 👑 SUPER ADMIN: Acceso global para soporte
            WHEN EXISTS (
                SELECT 1 FROM usuarios
                WHERE id = NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER
                AND rol = 'super_admin'
            ) THEN
                TRUE

            -- 🏢 TENANT ISOLATION: Solo org del usuario
            ELSE
                organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
        END
    );

-- POLÍTICA 2: BYPASS EXPLÍCITO PARA FUNCIONES DE SISTEMA
-- Permite acceso completo cuando bypass_rls está activado
CREATE POLICY chatbot_config_system_bypass ON chatbot_config
    FOR ALL
    USING (current_setting('app.bypass_rls', TRUE) = 'true');

-- ====================================================================
-- POLÍTICAS RLS: TABLA CHATBOT_CREDENTIALS
-- ====================================================================

-- POLÍTICA 1: AISLAMIENTO INDIRECTO VÍA CHATBOT_CONFIG
-- Verifica que el chatbot asociado pertenezca a la organización del usuario
CREATE POLICY chatbot_credentials_tenant_isolation ON chatbot_credentials
    USING (
        CASE
            -- 🔓 BYPASS: Funciones de sistema
            WHEN current_setting('app.bypass_rls', TRUE) = 'true' THEN
                TRUE

            -- 👑 SUPER ADMIN: Acceso global
            WHEN EXISTS (
                SELECT 1 FROM usuarios
                WHERE id = NULLIF(current_setting('app.current_user_id', TRUE), '')::INTEGER
                AND rol = 'super_admin'
            ) THEN
                TRUE

            -- 🔗 TENANT ISOLATION INDIRECTO: Via JOIN con chatbot_config
            ELSE
                EXISTS (
                    SELECT 1
                    FROM chatbot_config cc
                    WHERE cc.id = chatbot_credentials.chatbot_config_id
                      AND cc.organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
                )
        END
    );

-- POLÍTICA 2: BYPASS EXPLÍCITO
CREATE POLICY chatbot_credentials_system_bypass ON chatbot_credentials
    FOR ALL
    USING (current_setting('app.bypass_rls', TRUE) = 'true');

-- ====================================================================
-- COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON POLICY chatbot_config_tenant_isolation ON chatbot_config IS
'Aislamiento multi-tenant para configuración de chatbots:
- Usuario accede solo a chatbots de su organización
- Super admin tiene acceso global para soporte
- Bypass disponible para funciones de sistema
Usado en todos los endpoints de chatbots para seguridad automática.';

COMMENT ON POLICY chatbot_credentials_tenant_isolation ON chatbot_credentials IS
'Aislamiento indirecto vía JOIN con chatbot_config:
- Verifica que el chatbot asociado pertenezca a la organización
- Super admin tiene acceso global
- Bypass disponible para funciones de sistema
Previene acceso a credentials de chatbots de otras organizaciones.';

-- ====================================================================
-- MODULO NOTIFICACIONES: POLITICAS RLS
-- ====================================================================
-- Row Level Security para aislamiento por usuario.
-- Cada usuario solo ve sus propias notificaciones.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS
-- ====================================================================
ALTER TABLE notificaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_preferencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE notificaciones_plantillas ENABLE ROW LEVEL SECURITY;
-- notificaciones_tipos es catalogo global, no necesita RLS

-- ====================================================================
-- POLITICAS: notificaciones
-- ====================================================================

-- Politica unificada: usuario ve solo sus notificaciones
DROP POLICY IF EXISTS notificaciones_usuario_policy ON notificaciones;
CREATE POLICY notificaciones_usuario_policy ON notificaciones
    FOR ALL
    USING (
        -- Bypass para super_admin o operaciones de sistema
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        -- Usuario ve sus propias notificaciones
        usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
    )
    WITH CHECK (
        -- Bypass para sistema (crear notificaciones para otros)
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        -- Usuario solo puede modificar sus propias notificaciones
        usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
    );

COMMENT ON POLICY notificaciones_usuario_policy ON notificaciones IS
'Politica RLS por usuario. Cada usuario solo ve y modifica sus propias notificaciones.';

-- ====================================================================
-- POLITICAS: notificaciones_preferencias
-- ====================================================================

DROP POLICY IF EXISTS notif_prefs_usuario_policy ON notificaciones_preferencias;
CREATE POLICY notif_prefs_usuario_policy ON notificaciones_preferencias
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
    )
    WITH CHECK (
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        usuario_id = NULLIF(current_setting('app.current_user_id', true), '')::INTEGER
    );

COMMENT ON POLICY notif_prefs_usuario_policy ON notificaciones_preferencias IS
'Politica RLS por usuario. Cada usuario gestiona sus propias preferencias.';

-- ====================================================================
-- POLITICAS: notificaciones_plantillas
-- ====================================================================

DROP POLICY IF EXISTS notif_plantillas_tenant_policy ON notificaciones_plantillas;
CREATE POLICY notif_plantillas_tenant_policy ON notificaciones_plantillas
    FOR ALL
    USING (
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    )
    WITH CHECK (
        current_setting('app.bypass_rls', true)::boolean = true
        OR
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
    );

COMMENT ON POLICY notif_plantillas_tenant_policy ON notificaciones_plantillas IS
'Politica RLS por organizacion. Las plantillas son configuradas por admins de cada org.';

-- ====================================================================
-- GRANTS
-- ====================================================================
-- Permisos para el usuario de la aplicacion

GRANT SELECT, INSERT, UPDATE, DELETE ON notificaciones TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON notificaciones_preferencias TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON notificaciones_plantillas TO saas_app;
GRANT SELECT ON notificaciones_tipos TO saas_app;

GRANT USAGE, SELECT ON SEQUENCE notificaciones_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE notificaciones_preferencias_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE notificaciones_plantillas_id_seq TO saas_app;

-- Permisos de solo lectura para usuario readonly
GRANT SELECT ON notificaciones TO readonly_user;
GRANT SELECT ON notificaciones_preferencias TO readonly_user;
GRANT SELECT ON notificaciones_plantillas TO readonly_user;
GRANT SELECT ON notificaciones_tipos TO readonly_user;

-- ====================================================================
-- FIN: POLITICAS RLS NOTIFICACIONES
-- ====================================================================

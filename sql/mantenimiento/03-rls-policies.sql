-- ====================================================================
-- 🛡️ MÓDULO MANTENIMIENTO - ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- PROPÓSITO:
-- Seguridad extrema para configuración crítica del sistema.
--
-- COMPONENTES:
-- • 1 política para tabla configuracion_sistema (solo super_admin)
--
-- SEGURIDAD:
-- ✅ Solo super_admin puede leer/modificar configuración
-- ✅ Bypass controlado para funciones de sistema
-- ✅ Protección de N8N_API_KEY y credenciales SMTP
--
-- ORDEN DE CARGA: #12 (después de índices)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN CONFIGURACION_SISTEMA
-- ====================================================================

ALTER TABLE configuracion_sistema ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICA RLS: CONFIGURACION_SISTEMA
-- ====================================================================

-- Solo super_admin puede leer/modificar
CREATE POLICY configuracion_sistema_access ON configuracion_sistema
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
    );

COMMENT ON POLICY configuracion_sistema_access ON configuracion_sistema IS
'Solo super_admin o bypass_rls pueden acceder a configuración del sistema.
Crítico para seguridad: N8N_API_KEY, SMTP credentials, etc.';

-- ====================================================================
-- POLÍTICAS: eventos_sistema_archivo (Auditoría Ene 2026)
-- ====================================================================

ALTER TABLE eventos_sistema_archivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE eventos_sistema_archivo FORCE ROW LEVEL SECURITY;

CREATE POLICY eventos_sistema_archivo_tenant_access ON eventos_sistema_archivo
    FOR ALL
    TO saas_app
    USING (
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        OR organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
    );

COMMENT ON POLICY eventos_sistema_archivo_tenant_access ON eventos_sistema_archivo IS
'Acceso multi-tenant a eventos archivados. super_admin o tenant propio.
Agregado en auditoría Ene 2026.';

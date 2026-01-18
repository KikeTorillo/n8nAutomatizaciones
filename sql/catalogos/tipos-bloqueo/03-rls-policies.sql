-- ====================================================================
-- MÓDULO CATÁLOGOS: POLÍTICAS RLS
-- ====================================================================
-- Seguridad multi-tenant para catálogos dinámicos.
--
-- REGLAS:
-- • Super admin: acceso total
-- • Tipos del sistema (organizacion_id IS NULL): visibles para todos
-- • Tipos personalizados: solo visible para la organización dueña
-- • Bypass RLS: permitido para operaciones del sistema
--
-- Migrado de: sql/schema/04-catalog-tables.sql
-- Fecha migración: 16 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- RLS PARA TIPOS_BLOQUEO
-- ====================================================================

ALTER TABLE tipos_bloqueo ENABLE ROW LEVEL SECURITY;

CREATE POLICY tipos_bloqueo_tenant_isolation ON tipos_bloqueo
USING (
    -- Super admin ve todo
    (current_setting('app.current_user_role', true) = 'super_admin') OR
    -- Tipos del sistema visibles para todos
    (organizacion_id IS NULL) OR
    -- Usuarios ven solo tipos de su organización
    (organizacion_id = COALESCE(
        (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
    )) OR
    -- Bypass para funciones del sistema
    (current_setting('app.bypass_rls', true) = 'true')
)
WITH CHECK (
    -- Super admin puede crear sin restricciones
    (current_setting('app.current_user_role', true) = 'super_admin') OR
    -- Usuarios normales solo pueden crear en su organización
    (organizacion_id = COALESCE(
        (NULLIF(current_setting('app.current_tenant_id', true), ''))::integer, 0
    )) OR
    -- Bypass para funciones del sistema
    (current_setting('app.bypass_rls', true) = 'true')
);

-- ====================================================================
-- 📝 COMENTARIOS PARA DOCUMENTACIÓN
-- ====================================================================

COMMENT ON POLICY tipos_bloqueo_tenant_isolation ON tipos_bloqueo IS
'Aislamiento multi-tenant: tipos del sistema (NULL) visibles para todos, tipos personalizados solo para su organización';

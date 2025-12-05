-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - POLÍTICAS RLS
-- ====================================================================
-- Row Level Security para aislamiento multi-tenant
--
-- Patrón usado:
-- - app.bypass_rls = 'true' para operaciones administrativas/públicas
-- - app.current_tenant_id para aislamiento por organización
--
-- Fecha creación: 4 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS (excepto plantillas)
-- ====================================================================
-- Nota: plantillas_evento NO tiene RLS porque son datos del sistema

ALTER TABLE eventos_digitales ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitados_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE mesa_regalos_evento ENABLE ROW LEVEL SECURITY;
ALTER TABLE felicitaciones_evento ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 1. EVENTOS DIGITALES - Tenant isolation directo
-- ====================================================================
DROP POLICY IF EXISTS eventos_digitales_tenant_policy ON eventos_digitales;
CREATE POLICY eventos_digitales_tenant_policy ON eventos_digitales
    FOR ALL
    USING (
        -- Bypass para operaciones admin/públicas
        current_setting('app.bypass_rls', TRUE) = 'true'
        OR
        -- Aislamiento por tenant
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
    );

COMMENT ON POLICY eventos_digitales_tenant_policy ON eventos_digitales IS
    'Aislamiento multi-tenant: solo accede a eventos de su organización o con bypass';

-- ====================================================================
-- 2. INVITADOS - Tenant isolation directo (tiene organizacion_id)
-- ====================================================================
DROP POLICY IF EXISTS invitados_evento_tenant_policy ON invitados_evento;
CREATE POLICY invitados_evento_tenant_policy ON invitados_evento
    FOR ALL
    USING (
        current_setting('app.bypass_rls', TRUE) = 'true'
        OR
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
    );

COMMENT ON POLICY invitados_evento_tenant_policy ON invitados_evento IS
    'Aislamiento multi-tenant: invitados tienen organizacion_id directo para mejor performance';

-- ====================================================================
-- 3. UBICACIONES - Hereda del evento (subquery)
-- ====================================================================
DROP POLICY IF EXISTS ubicaciones_evento_tenant_policy ON ubicaciones_evento;
CREATE POLICY ubicaciones_evento_tenant_policy ON ubicaciones_evento
    FOR ALL
    USING (
        current_setting('app.bypass_rls', TRUE) = 'true'
        OR
        evento_id IN (
            SELECT id FROM eventos_digitales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
        )
    );

COMMENT ON POLICY ubicaciones_evento_tenant_policy ON ubicaciones_evento IS
    'Hereda permisos del evento padre mediante subquery';

-- ====================================================================
-- 4. MESA DE REGALOS - Hereda del evento
-- ====================================================================
DROP POLICY IF EXISTS mesa_regalos_evento_tenant_policy ON mesa_regalos_evento;
CREATE POLICY mesa_regalos_evento_tenant_policy ON mesa_regalos_evento
    FOR ALL
    USING (
        current_setting('app.bypass_rls', TRUE) = 'true'
        OR
        evento_id IN (
            SELECT id FROM eventos_digitales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
        )
    );

COMMENT ON POLICY mesa_regalos_evento_tenant_policy ON mesa_regalos_evento IS
    'Hereda permisos del evento padre mediante subquery';

-- ====================================================================
-- 5. FELICITACIONES - Hereda del evento
-- ====================================================================
DROP POLICY IF EXISTS felicitaciones_evento_tenant_policy ON felicitaciones_evento;
CREATE POLICY felicitaciones_evento_tenant_policy ON felicitaciones_evento
    FOR ALL
    USING (
        current_setting('app.bypass_rls', TRUE) = 'true'
        OR
        evento_id IN (
            SELECT id FROM eventos_digitales
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', TRUE), '')::INTEGER
        )
    );

COMMENT ON POLICY felicitaciones_evento_tenant_policy ON felicitaciones_evento IS
    'Hereda permisos del evento padre mediante subquery';

-- ====================================================================
-- VERIFICACIÓN DE POLÍTICAS
-- ====================================================================
-- Ejecutar para verificar que las políticas se crearon correctamente:
/*
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename IN (
    'eventos_digitales',
    'ubicaciones_evento',
    'invitados_evento',
    'mesa_regalos_evento',
    'felicitaciones_evento'
)
ORDER BY tablename;
*/

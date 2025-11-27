-- ====================================================================
-- 🔔 MÓDULO RECORDATORIOS - ROW LEVEL SECURITY (RLS)
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 25 Noviembre 2025
-- Módulo: recordatorios
--
-- DESCRIPCIÓN:
-- Políticas de seguridad a nivel de fila para aislamiento multi-tenant.
-- Solo admin/propietario puede ver y modificar configuración.
-- Historial visible para todos los roles de la organización.
--
-- ROLES:
-- • super_admin: Acceso total (bypass)
-- • admin/propietario: CRUD completo en su organización
-- • empleado: Solo lectura del historial
-- • bot: Lectura config + escritura historial (para procesar)
--
-- ====================================================================

-- ====================================================================
-- HABILITAR RLS
-- ====================================================================

ALTER TABLE configuracion_recordatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_recordatorios ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- POLÍTICAS: configuracion_recordatorios
-- ====================================================================

-- Aislamiento por tenant (política base)
CREATE POLICY configuracion_recordatorios_tenant_isolation
ON configuracion_recordatorios
FOR ALL
USING (
    organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
)
WITH CHECK (
    organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
);

-- Bypass para funciones de sistema (jobs, triggers)
CREATE POLICY configuracion_recordatorios_system_bypass
ON configuracion_recordatorios
FOR ALL
USING (
    current_setting('app.bypass_rls', true) = 'true'
)
WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
);

-- ====================================================================
-- POLÍTICAS: historial_recordatorios
-- ====================================================================

-- Aislamiento por tenant (política base)
CREATE POLICY historial_recordatorios_tenant_isolation
ON historial_recordatorios
FOR ALL
USING (
    organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
)
WITH CHECK (
    organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
);

-- Bypass para funciones de sistema (jobs, triggers)
CREATE POLICY historial_recordatorios_system_bypass
ON historial_recordatorios
FOR ALL
USING (
    current_setting('app.bypass_rls', true) = 'true'
)
WITH CHECK (
    current_setting('app.bypass_rls', true) = 'true'
);

-- ====================================================================
-- GRANTS: Permisos de tablas
-- ====================================================================

-- Permisos para el rol de aplicación (saas_app)
GRANT SELECT, INSERT, UPDATE ON configuracion_recordatorios TO saas_app;
GRANT SELECT, INSERT, UPDATE ON historial_recordatorios TO saas_app;

-- Permisos en secuencias
GRANT USAGE, SELECT ON SEQUENCE configuracion_recordatorios_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE historial_recordatorios_id_seq TO saas_app;

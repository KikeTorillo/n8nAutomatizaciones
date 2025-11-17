-- ====================================================================
-- 💵 MÓDULO COMISIONES - POLÍTICAS RLS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 17 Noviembre 2025
-- Módulo: comisiones
--
-- DESCRIPCIÓN:
-- Políticas de Row Level Security para aislamiento multi-tenant y
-- control de acceso basado en roles en el sistema de comisiones.
--
-- POLÍTICAS (4 total):
-- • configuracion_comisiones: 1 política (tenant_isolation)
-- • comisiones_profesionales: 1 política (tenant_isolation)
-- • historial_configuracion_comisiones: 2 políticas (SELECT + INSERT)
--
-- ESTRATEGIA RLS:
-- • Aislamiento multi-tenant: Solo miembros de la organización acceden a sus datos
-- • Bypass para operaciones de sistema: Triggers usan set_config('app.bypass_rls', 'true')
-- • Historial de auditoría: Política especial para INSERT desde triggers
--
-- ====================================================================

-- ====================================================================
-- RLS PARA TABLA: configuracion_comisiones
-- ====================================================================

ALTER TABLE configuracion_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion_comisiones FORCE ROW LEVEL SECURITY;

-- Política: Aislamiento multi-tenant
-- Permite acceso solo a miembros de la misma organización
CREATE POLICY configuracion_comisiones_tenant_isolation
ON configuracion_comisiones
FOR ALL
TO saas_app
USING (
    organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
);

COMMENT ON POLICY configuracion_comisiones_tenant_isolation ON configuracion_comisiones IS
'Aislamiento multi-tenant: solo miembros de la organización pueden acceder a su configuración.
Consistente con otras tablas del sistema (clientes, citas, profesionales).
Fix: 2025-11-15 - Simplificado para consistencia (solo requiere current_tenant_id).';

-- ====================================================================
-- RLS PARA TABLA: comisiones_profesionales
-- ====================================================================

ALTER TABLE comisiones_profesionales ENABLE ROW LEVEL SECURITY;
ALTER TABLE comisiones_profesionales FORCE ROW LEVEL SECURITY;

-- Política: Aislamiento multi-tenant (consistente con clientes, citas, etc.)
CREATE POLICY comisiones_profesionales_tenant_isolation
ON comisiones_profesionales
FOR ALL
TO saas_app
USING (
    organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
);

COMMENT ON POLICY comisiones_profesionales_tenant_isolation ON comisiones_profesionales IS
'Aislamiento multi-tenant: solo miembros de la organización pueden acceder a sus comisiones.
Admin/propietario: Ve todas las comisiones de su organización.
Empleado: Ve solo sus propias comisiones (filtrado adicional en backend).
Consistente con otras tablas del sistema.
Fix: 2025-11-15 - Simplificado para consistencia con otras tablas (solo requiere current_tenant_id).';

-- ====================================================================
-- RLS PARA TABLA: historial_configuracion_comisiones
-- ====================================================================

ALTER TABLE historial_configuracion_comisiones ENABLE ROW LEVEL SECURITY;
ALTER TABLE historial_configuracion_comisiones FORCE ROW LEVEL SECURITY;

-- Política 1: SELECT - Aislamiento multi-tenant
CREATE POLICY historial_config_comisiones_tenant_isolation
ON historial_configuracion_comisiones
FOR SELECT
TO saas_app
USING (
    organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
);

-- Política 2: INSERT - Permite INSERT desde trigger de auditoría
-- IMPORTANTE: Esta política permite tanto INSERT normal como desde trigger con bypass_rls
CREATE POLICY historial_config_comisiones_trigger_insert
ON historial_configuracion_comisiones
FOR INSERT
TO saas_app
WITH CHECK (
    -- Bypass RLS para triggers de auditoría (SECURITY DEFINER)
    current_setting('app.bypass_rls', true) = 'true'
    OR
    -- Validación multi-tenant normal para INSERT manual
    organizacion_id = COALESCE(
        NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
        0
    )
);

COMMENT ON POLICY historial_config_comisiones_tenant_isolation ON historial_configuracion_comisiones IS
'Aislamiento multi-tenant para historial de configuración de comisiones.
Permite SELECT solo a miembros de la misma organización.
Usado en dashboard admin para ver historial de cambios.
Fix: 2025-11-15 - Simplificado para consistencia (solo requiere current_tenant_id).';

COMMENT ON POLICY historial_config_comisiones_trigger_insert ON historial_configuracion_comisiones IS
'Permite INSERT desde trigger de auditoría (bypass_rls) y desde usuarios de la organización.
Bypass RLS: Trigger auditoria_configuracion_comisiones() usa set_config(''app.bypass_rls'', ''true'')
Inserción manual: Validación multi-tenant normal (organizacion_id = current_tenant_id)
Fix: 2025-11-15 - Simplificado para consistencia (solo requiere current_tenant_id).';

-- ====================================================================
-- 📊 RESUMEN DE POLÍTICAS RLS
-- ====================================================================
-- TOTAL: 4 políticas RLS
--
-- configuracion_comisiones (1):
-- └── configuracion_comisiones_tenant_isolation  → FOR ALL (USING)
--
-- comisiones_profesionales (1):
-- └── comisiones_profesionales_tenant_isolation  → FOR ALL (USING)
--
-- historial_configuracion_comisiones (2):
-- ├── historial_config_comisiones_tenant_isolation  → FOR SELECT (USING)
-- └── historial_config_comisiones_trigger_insert    → FOR INSERT (WITH CHECK)
--
-- NOTAS:
-- • Todas las políticas usan current_tenant_id (consistencia con el resto del sistema)
-- • Historial permite INSERT con bypass_rls para triggers de auditoría
-- • Triggers usan set_config('app.bypass_rls', 'true') para operaciones de sistema
-- • Backend aplica filtrado adicional por rol (empleado solo ve sus comisiones)
--
-- ====================================================================

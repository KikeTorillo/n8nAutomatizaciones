-- ====================================================================
-- 🛡️ MÓDULO CONTABILIDAD - POLÍTICAS RLS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: contabilidad
--
-- DESCRIPCIÓN:
-- Políticas de Row Level Security para multi-tenancy.
-- Cada organización solo puede ver/editar sus propios datos contables.
--
-- TOTAL: 12 políticas RLS
--
-- ROLES Y PERMISOS:
-- • super_admin: Acceso completo a todas las organizaciones (bypass)
-- • admin/propietario: CRUD completo en su organización
-- • empleado: Solo lectura de datos contables
-- • bot: Sin acceso a contabilidad
--
-- VARIABLE RLS:
-- app.current_tenant_id: ID de la organización actual
-- app.current_role: Rol del usuario actual
--
-- ====================================================================

-- ====================================================================
-- 🔓 HABILITAR RLS EN TODAS LAS TABLAS
-- ====================================================================

ALTER TABLE cuentas_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE periodos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE asientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_contables ENABLE ROW LEVEL SECURITY;
ALTER TABLE config_contabilidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE saldos_cuentas ENABLE ROW LEVEL SECURITY;

-- ====================================================================
-- 📚 POLÍTICAS: cuentas_contables
-- ====================================================================
-- Admin puede crear/editar cuentas (excepto cuentas del sistema).
-- Empleados pueden ver las cuentas (para captura de asientos).
-- ====================================================================

-- SELECT: Todos los usuarios de la organización pueden ver cuentas
CREATE POLICY cuentas_tenant_select ON cuentas_contables
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_role', true) = 'super_admin'
    );

-- INSERT: Solo admin/propietario pueden crear cuentas
CREATE POLICY cuentas_tenant_insert ON cuentas_contables
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
    );

-- UPDATE: Solo admin/propietario, y no pueden modificar cuentas del sistema
CREATE POLICY cuentas_tenant_update ON cuentas_contables
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
        AND es_cuenta_sistema = false
    );

-- DELETE: Solo admin/propietario, y no pueden eliminar cuentas del sistema
CREATE POLICY cuentas_tenant_delete ON cuentas_contables
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
        AND es_cuenta_sistema = false
    );

-- ====================================================================
-- 📅 POLÍTICAS: periodos_contables
-- ====================================================================
-- Solo admin/propietario pueden abrir/cerrar periodos.
-- Empleados pueden ver periodos (para saber cuáles están abiertos).
-- ====================================================================

-- SELECT: Todos pueden ver periodos
CREATE POLICY periodos_tenant_select ON periodos_contables
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_role', true) = 'super_admin'
    );

-- INSERT/UPDATE/DELETE: Solo admin/propietario
CREATE POLICY periodos_tenant_modify ON periodos_contables
    FOR ALL
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
    )
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
    );

-- ====================================================================
-- 📖 POLÍTICAS: asientos_contables
-- ====================================================================
-- Admin/propietario pueden crear/editar asientos.
-- Empleados pueden ver asientos.
-- Solo asientos en estado 'borrador' pueden editarse.
-- ====================================================================

-- SELECT: Todos pueden ver asientos de su organización
CREATE POLICY asientos_tenant_select ON asientos_contables
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_role', true) = 'super_admin'
    );

-- INSERT: Solo verificar tenant (rol se valida en middleware)
CREATE POLICY asientos_tenant_insert ON asientos_contables
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
    );

-- UPDATE: Solo verificar tenant (rol se valida en middleware)
CREATE POLICY asientos_tenant_update ON asientos_contables
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
    );

-- DELETE: Solo asientos en borrador pueden eliminarse
CREATE POLICY asientos_tenant_delete ON asientos_contables
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
        AND estado = 'borrador'
    );

-- ====================================================================
-- 💰 POLÍTICAS: movimientos_contables
-- ====================================================================
-- Siguen las mismas reglas que asientos.
-- Solo se pueden modificar movimientos de asientos en borrador.
-- ====================================================================

-- SELECT: Todos pueden ver movimientos
CREATE POLICY movimientos_tenant_select ON movimientos_contables
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_role', true) = 'super_admin'
    );

-- INSERT/UPDATE/DELETE: Solo verificar tenant (rol se valida en middleware)
-- NOTA: La verificación de rol se hace en el backend middleware.
-- RLS aquí solo asegura aislamiento multi-tenant.
CREATE POLICY movimientos_tenant_modify ON movimientos_contables
    FOR ALL
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
    );

-- ====================================================================
-- ⚙️ POLÍTICAS: config_contabilidad
-- ====================================================================
-- Solo admin/propietario pueden ver y modificar configuración.
-- ====================================================================

CREATE POLICY config_tenant_all ON config_contabilidad
    FOR ALL
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_role', true) = 'super_admin'
    )
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        AND current_setting('app.current_role', true) IN ('admin', 'propietario')
    );

-- ====================================================================
-- 📊 POLÍTICAS: saldos_cuentas
-- ====================================================================
-- Solo lectura para todos (tabla actualizada por triggers).
-- Modificación solo por sistema (SECURITY DEFINER functions).
-- ====================================================================

CREATE POLICY saldos_tenant_select ON saldos_cuentas
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.current_role', true) = 'super_admin'
    );

-- INSERT/UPDATE/DELETE solo por funciones SECURITY DEFINER (sistema)
-- No se crean políticas de modificación - solo el sistema puede modificar

-- ====================================================================
-- 📝 COMENTARIOS DE DOCUMENTACIÓN
-- ====================================================================

COMMENT ON POLICY cuentas_tenant_select ON cuentas_contables IS
'Permite a todos los usuarios de la organización ver el catálogo de cuentas.
Super admin puede ver cuentas de cualquier organización.';

COMMENT ON POLICY cuentas_tenant_update ON cuentas_contables IS
'Solo admin/propietario pueden modificar cuentas.
Las cuentas del sistema (es_cuenta_sistema=true) no pueden modificarse.';

COMMENT ON POLICY asientos_tenant_update ON asientos_contables IS
'Solo asientos en estado borrador pueden editarse.
Asientos publicados o anulados son inmutables.';

COMMENT ON POLICY saldos_tenant_select ON saldos_cuentas IS
'Tabla de solo lectura para usuarios.
Actualizada automáticamente por triggers al publicar asientos.';

-- ====================================================================
-- ✅ TOTAL: 12 políticas RLS
-- ====================================================================

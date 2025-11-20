-- ============================================================================
-- MÓDULO: INVENTARIO - POLÍTICAS RLS (Row Level Security)
-- Descripción: Aislamiento multi-tenant con políticas de seguridad a nivel de fila
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE categorias_productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE alertas_inventario ENABLE ROW LEVEL SECURITY;

-- Force RLS incluso para propietarios de tablas (excepto superusuario)
ALTER TABLE categorias_productos FORCE ROW LEVEL SECURITY;
ALTER TABLE proveedores FORCE ROW LEVEL SECURITY;
ALTER TABLE productos FORCE ROW LEVEL SECURITY;
ALTER TABLE movimientos_inventario FORCE ROW LEVEL SECURITY;
ALTER TABLE alertas_inventario FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: categorias_productos
-- ============================================================================

-- Política SELECT: Ver solo categorías de su organización
CREATE POLICY categorias_productos_select_policy ON categorias_productos
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política INSERT: Crear solo en su organización
CREATE POLICY categorias_productos_insert_policy ON categorias_productos
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política UPDATE: Actualizar solo categorías de su organización
CREATE POLICY categorias_productos_update_policy ON categorias_productos
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política DELETE: Eliminar solo categorías de su organización
CREATE POLICY categorias_productos_delete_policy ON categorias_productos
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: proveedores
-- ============================================================================

CREATE POLICY proveedores_select_policy ON proveedores
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY proveedores_insert_policy ON proveedores
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY proveedores_update_policy ON proveedores
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY proveedores_delete_policy ON proveedores
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: productos
-- ============================================================================

CREATE POLICY productos_select_policy ON productos
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY productos_insert_policy ON productos
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY productos_update_policy ON productos
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY productos_delete_policy ON productos
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: movimientos_inventario
-- ============================================================================

CREATE POLICY movimientos_inventario_select_policy ON movimientos_inventario
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY movimientos_inventario_insert_policy ON movimientos_inventario
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY movimientos_inventario_update_policy ON movimientos_inventario
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY movimientos_inventario_delete_policy ON movimientos_inventario
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: alertas_inventario
-- ============================================================================

CREATE POLICY alertas_inventario_select_policy ON alertas_inventario
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY alertas_inventario_insert_policy ON alertas_inventario
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY alertas_inventario_update_policy ON alertas_inventario
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY alertas_inventario_delete_policy ON alertas_inventario
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- VALIDACIÓN DE POLÍTICAS
-- ============================================================================

-- Verificar que todas las tablas tienen RLS habilitado
DO $$
DECLARE
    tabla TEXT;
    tiene_rls BOOLEAN;
BEGIN
    FOR tabla IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename IN (
            'categorias_productos',
            'proveedores',
            'productos',
            'movimientos_inventario',
            'alertas_inventario'
        )
    LOOP
        SELECT relrowsecurity INTO tiene_rls
        FROM pg_class
        WHERE relname = tabla;

        IF NOT tiene_rls THEN
            RAISE WARNING 'La tabla % NO tiene RLS habilitado', tabla;
        END IF;
    END LOOP;

    RAISE NOTICE 'Validación de RLS completada para módulo inventario';
END $$;

-- ============================================================================
-- FIN: POLÍTICAS RLS DE INVENTARIO
-- ============================================================================

-- Nota sobre seguridad:
-- - Todas las políticas incluyen bypass_rls para operaciones de sistema (triggers)
-- - RLS se habilita con FORCE para proteger incluso a propietarios de tablas
-- - current_tenant_id se establece en middleware tenant.setTenantContext()
-- - bypass_rls se establece solo en triggers de sistema con SECURITY DEFINER

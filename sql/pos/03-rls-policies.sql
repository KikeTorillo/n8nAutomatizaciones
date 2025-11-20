-- ============================================================================
-- MÓDULO: PUNTO DE VENTA (POS) - POLÍTICAS RLS (Row Level Security)
-- Descripción: Aislamiento multi-tenant con políticas de seguridad a nivel de fila
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TODAS LAS TABLAS
-- ============================================================================

ALTER TABLE ventas_pos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_pos_items ENABLE ROW LEVEL SECURITY;

-- Force RLS incluso para propietarios de tablas (excepto superusuario)
ALTER TABLE ventas_pos FORCE ROW LEVEL SECURITY;
ALTER TABLE ventas_pos_items FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: ventas_pos
-- ============================================================================

-- Política SELECT: Ver solo ventas de su organización
CREATE POLICY ventas_pos_select_policy ON ventas_pos
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política INSERT: Crear solo ventas en su organización
CREATE POLICY ventas_pos_insert_policy ON ventas_pos
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política UPDATE: Actualizar solo ventas de su organización
CREATE POLICY ventas_pos_update_policy ON ventas_pos
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política DELETE: Eliminar solo ventas de su organización
CREATE POLICY ventas_pos_delete_policy ON ventas_pos
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: ventas_pos_items
-- NOTA: Requiere JOIN con ventas_pos para validar organizacion_id
-- ============================================================================

-- Política SELECT: Ver items solo de ventas de su organización
CREATE POLICY ventas_pos_items_select_policy ON ventas_pos_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1
            FROM ventas_pos
            WHERE ventas_pos.id = ventas_pos_items.venta_pos_id
            AND ventas_pos.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política INSERT: Crear items solo en ventas de su organización
CREATE POLICY ventas_pos_items_insert_policy ON ventas_pos_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM ventas_pos
            WHERE ventas_pos.id = ventas_pos_items.venta_pos_id
            AND ventas_pos.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política UPDATE: Actualizar items solo de ventas de su organización
CREATE POLICY ventas_pos_items_update_policy ON ventas_pos_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1
            FROM ventas_pos
            WHERE ventas_pos.id = ventas_pos_items.venta_pos_id
            AND ventas_pos.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política DELETE: Eliminar items solo de ventas de su organización
CREATE POLICY ventas_pos_items_delete_policy ON ventas_pos_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1
            FROM ventas_pos
            WHERE ventas_pos.id = ventas_pos_items.venta_pos_id
            AND ventas_pos.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
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
            'ventas_pos',
            'ventas_pos_items'
        )
    LOOP
        SELECT relrowsecurity INTO tiene_rls
        FROM pg_class
        WHERE relname = tabla;

        IF NOT tiene_rls THEN
            RAISE WARNING 'La tabla % NO tiene RLS habilitado', tabla;
        END IF;
    END LOOP;

    RAISE NOTICE 'Validación de RLS completada para módulo POS';
END $$;

-- ============================================================================
-- FIN: POLÍTICAS RLS DE PUNTO DE VENTA
-- ============================================================================

-- Nota sobre seguridad:
-- - ventas_pos_items usa EXISTS con JOIN para validar organizacion_id
-- - Esto es necesario porque ventas_pos_items no tiene organizacion_id directo
-- - El patrón es idéntico al usado en citas_servicios del sistema existente
-- - Todas las políticas incluyen bypass_rls para operaciones de sistema (triggers)
-- - current_tenant_id se establece en middleware tenant.setTenantContext()
-- - bypass_rls se establece solo en triggers de sistema con SECURITY DEFINER

-- ============================================================================
-- MÓDULO: INVENTARIO - ÓRDENES DE COMPRA (POLÍTICAS RLS)
-- Descripción: Aislamiento multi-tenant para órdenes de compra
-- Versión: 1.0
-- Fecha: 27 Noviembre 2025
-- ============================================================================

-- ============================================================================
-- HABILITAR RLS EN TABLAS DE ÓRDENES DE COMPRA
-- ============================================================================

ALTER TABLE ordenes_compra ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_recepciones ENABLE ROW LEVEL SECURITY;

-- Force RLS incluso para propietarios de tablas
ALTER TABLE ordenes_compra FORCE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_items FORCE ROW LEVEL SECURITY;
ALTER TABLE ordenes_compra_recepciones FORCE ROW LEVEL SECURITY;

-- ============================================================================
-- POLÍTICAS: ordenes_compra
-- ============================================================================

-- SELECT: Ver solo órdenes de su organización
CREATE POLICY ordenes_compra_select_policy ON ordenes_compra
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- INSERT: Crear solo en su organización
CREATE POLICY ordenes_compra_insert_policy ON ordenes_compra
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- UPDATE: Actualizar solo órdenes de su organización
CREATE POLICY ordenes_compra_update_policy ON ordenes_compra
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- DELETE: Eliminar solo órdenes de su organización (solo borradores)
CREATE POLICY ordenes_compra_delete_policy ON ordenes_compra
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- POLÍTICAS: ordenes_compra_items
-- Nota: Heredan seguridad de la orden padre vía JOIN
-- ============================================================================

-- SELECT: Ver items de órdenes de su organización
CREATE POLICY oc_items_select_policy ON ordenes_compra_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- INSERT: Crear items en órdenes de su organización
CREATE POLICY oc_items_insert_policy ON ordenes_compra_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- UPDATE: Actualizar items de órdenes de su organización
CREATE POLICY oc_items_update_policy ON ordenes_compra_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- DELETE: Eliminar items de órdenes de su organización
CREATE POLICY oc_items_delete_policy ON ordenes_compra_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- ============================================================================
-- POLÍTICAS: ordenes_compra_recepciones
-- Nota: Heredan seguridad de la orden padre vía JOIN
-- ============================================================================

-- SELECT: Ver recepciones de órdenes de su organización
CREATE POLICY oc_recepciones_select_policy ON ordenes_compra_recepciones
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- INSERT: Registrar recepciones en órdenes de su organización
CREATE POLICY oc_recepciones_insert_policy ON ordenes_compra_recepciones
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- UPDATE: Actualizar recepciones (raramente necesario)
CREATE POLICY oc_recepciones_update_policy ON ordenes_compra_recepciones
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM ordenes_compra oc
            WHERE oc.id = orden_compra_id
            AND (
                oc.organizacion_id::text = current_setting('app.current_tenant_id', true)
                OR current_setting('app.bypass_rls', true) = 'true'
            )
        )
    );

-- DELETE: No se permite eliminar recepciones (auditoría)
-- Si se necesita, solo con bypass_rls

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON POLICY ordenes_compra_select_policy ON ordenes_compra IS 'Aislamiento multi-tenant: solo ver órdenes de su organización';
COMMENT ON POLICY oc_items_select_policy ON ordenes_compra_items IS 'Seguridad heredada de la orden padre';
COMMENT ON POLICY oc_recepciones_select_policy ON ordenes_compra_recepciones IS 'Historial de recepciones protegido por organización';

-- ============================================================================
-- FIN: POLÍTICAS RLS DE ÓRDENES DE COMPRA
-- ============================================================================

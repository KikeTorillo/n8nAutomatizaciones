-- ====================================================================
-- MÓDULO ORGANIZACIÓN: RLS POLICIES
-- ====================================================================
-- Políticas de seguridad Row Level Security para aislamiento multi-tenant.
--
-- PATRÓN:
-- - Admin/Propietario: CRUD completo en su organización
-- - Empleado: Solo lectura en su organización
-- - Super Admin: Bypass (manejado en aplicación)
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 🔒 RLS PARA DEPARTAMENTOS
-- ====================================================================
ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;

-- Política: Ver departamentos de mi organización
CREATE POLICY departamentos_select_policy ON departamentos
    FOR SELECT
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Insertar en mi organización
CREATE POLICY departamentos_insert_policy ON departamentos
    FOR INSERT
    WITH CHECK (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Actualizar en mi organización
CREATE POLICY departamentos_update_policy ON departamentos
    FOR UPDATE
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    )
    WITH CHECK (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Eliminar en mi organización
CREATE POLICY departamentos_delete_policy ON departamentos
    FOR DELETE
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- ====================================================================
-- 🔒 RLS PARA PUESTOS
-- ====================================================================
ALTER TABLE puestos ENABLE ROW LEVEL SECURITY;

-- Política: Ver puestos de mi organización
CREATE POLICY puestos_select_policy ON puestos
    FOR SELECT
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Insertar en mi organización
CREATE POLICY puestos_insert_policy ON puestos
    FOR INSERT
    WITH CHECK (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Actualizar en mi organización
CREATE POLICY puestos_update_policy ON puestos
    FOR UPDATE
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    )
    WITH CHECK (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Eliminar en mi organización
CREATE POLICY puestos_delete_policy ON puestos
    FOR DELETE
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- ====================================================================
-- 🔒 RLS PARA CATEGORIAS_PROFESIONAL
-- ====================================================================
ALTER TABLE categorias_profesional ENABLE ROW LEVEL SECURITY;

-- Política: Ver categorías de mi organización
CREATE POLICY categorias_profesional_select_policy ON categorias_profesional
    FOR SELECT
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Insertar en mi organización
CREATE POLICY categorias_profesional_insert_policy ON categorias_profesional
    FOR INSERT
    WITH CHECK (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Actualizar en mi organización
CREATE POLICY categorias_profesional_update_policy ON categorias_profesional
    FOR UPDATE
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    )
    WITH CHECK (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- Política: Eliminar en mi organización
CREATE POLICY categorias_profesional_delete_policy ON categorias_profesional
    FOR DELETE
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
    );

-- ====================================================================
-- 🔒 RLS PARA PROFESIONALES_CATEGORIAS
-- ====================================================================
-- Esta tabla no tiene organizacion_id directamente, pero se valida
-- a través del profesional_id relacionado.
-- ====================================================================
ALTER TABLE profesionales_categorias ENABLE ROW LEVEL SECURITY;

-- Política: Ver asignaciones de profesionales de mi organización
CREATE POLICY prof_categorias_select_policy ON profesionales_categorias
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profesionales p
            WHERE p.id = profesional_id
              AND p.organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- Política: Insertar asignaciones para profesionales de mi organización
CREATE POLICY prof_categorias_insert_policy ON profesionales_categorias
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profesionales p
            WHERE p.id = profesional_id
              AND p.organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- Política: Eliminar asignaciones de profesionales de mi organización
CREATE POLICY prof_categorias_delete_policy ON profesionales_categorias
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM profesionales p
            WHERE p.id = profesional_id
              AND p.organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER, 0)
        )
    );

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================
COMMENT ON POLICY departamentos_select_policy ON departamentos IS
'Permite ver solo departamentos de la organización del usuario.';

COMMENT ON POLICY puestos_select_policy ON puestos IS
'Permite ver solo puestos de la organización del usuario.';

COMMENT ON POLICY categorias_profesional_select_policy ON categorias_profesional IS
'Permite ver solo categorías de la organización del usuario.';

COMMENT ON POLICY prof_categorias_select_policy ON profesionales_categorias IS
'Permite ver asignaciones de categorías solo para profesionales de la organización.';

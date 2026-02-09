-- ============================================================================
-- MÓDULO: POS - TERMINALES POINT (MercadoPago)
-- Descripción: Tracking de terminales MP Point asignadas por organización
-- Versión: 1.0
-- Fecha: Febrero 2026
-- ============================================================================

-- ============================================================================
-- TABLA: terminales_point
-- Descripción: Registro de terminales Point de MercadoPago por organización
-- ============================================================================
CREATE TABLE IF NOT EXISTS terminales_point (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    terminal_id VARCHAR(100) NOT NULL,       -- ID del terminal en MercadoPago
    nombre VARCHAR(100),                      -- Nombre descriptivo
    modelo VARCHAR(50),                       -- NEWLAND_N950, etc.
    serial_number VARCHAR(100),
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMP DEFAULT NOW(),
    actualizado_en TIMESTAMP DEFAULT NOW(),
    UNIQUE (organizacion_id, terminal_id)
);

COMMENT ON TABLE terminales_point IS 'Terminales Point de MercadoPago asignadas a organizaciones para cobros presenciales';

-- ============================================================================
-- ÍNDICES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_terminales_point_org ON terminales_point(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_terminales_point_activas ON terminales_point(organizacion_id, activo) WHERE activo = true;

-- ============================================================================
-- RLS POLICIES
-- ============================================================================
ALTER TABLE terminales_point ENABLE ROW LEVEL SECURITY;

CREATE POLICY terminales_point_select_policy ON terminales_point
    FOR SELECT
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY terminales_point_insert_policy ON terminales_point
    FOR INSERT
    WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY terminales_point_update_policy ON terminales_point
    FOR UPDATE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

CREATE POLICY terminales_point_delete_policy ON terminales_point
    FOR DELETE
    USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.bypass_rls', true)::BOOLEAN = true
    );

-- ============================================================================
-- FIN: TERMINALES POINT
-- ============================================================================

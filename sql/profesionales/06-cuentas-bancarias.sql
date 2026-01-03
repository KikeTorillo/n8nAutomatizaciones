-- ====================================================================
-- MÓDULO PROFESIONALES: CUENTAS BANCARIAS DE EMPLEADOS
-- ====================================================================
-- Fase 1 del Plan de Empleados Competitivo - Enero 2026
-- Almacena información bancaria para nómina y reembolsos
--
-- Dependencias: profesionales (01-tablas.sql)
-- ====================================================================

-- ====================================================================
-- 🏦 TABLA CUENTAS_BANCARIAS_EMPLEADO
-- ====================================================================
CREATE TABLE cuentas_bancarias_empleado (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 🏦 DATOS BANCARIOS
    banco VARCHAR(100) NOT NULL,               -- Nombre del banco
    numero_cuenta VARCHAR(50) NOT NULL,        -- Número de cuenta
    clabe VARCHAR(18),                         -- CLABE interbancaria (México)
    tipo_cuenta VARCHAR(20) DEFAULT 'debito',  -- debito, ahorro, nomina
    moneda VARCHAR(3) DEFAULT 'MXN',           -- Moneda de la cuenta

    -- 📋 TITULAR
    titular_nombre VARCHAR(150),               -- Nombre del titular (si difiere)
    titular_documento VARCHAR(30),             -- Documento del titular

    -- ⚙️ CONFIGURACIÓN
    es_principal BOOLEAN DEFAULT false,        -- Cuenta principal para nómina
    uso VARCHAR(50) DEFAULT 'nomina',          -- nomina, reembolsos, comisiones, todos

    -- 🗑️ SOFT DELETE Y AUDITORÍA
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT chk_cuenta_tipo CHECK (tipo_cuenta IN ('debito', 'ahorro', 'nomina', 'credito')),
    CONSTRAINT chk_cuenta_uso CHECK (uso IN ('nomina', 'reembolsos', 'comisiones', 'todos')),
    CONSTRAINT chk_cuenta_clabe CHECK (clabe IS NULL OR length(clabe) = 18),
    CONSTRAINT chk_cuenta_banco CHECK (length(banco) >= 2)
);

-- ====================================================================
-- 📇 ÍNDICES ESPECIALIZADOS
-- ====================================================================
CREATE INDEX idx_cuentas_bancarias_org_prof
    ON cuentas_bancarias_empleado(organizacion_id, profesional_id)
    WHERE eliminado_en IS NULL;

CREATE INDEX idx_cuentas_bancarias_principal
    ON cuentas_bancarias_empleado(organizacion_id, profesional_id, es_principal)
    WHERE eliminado_en IS NULL AND es_principal = true;

-- ====================================================================
-- 🔒 ROW LEVEL SECURITY
-- ====================================================================
ALTER TABLE cuentas_bancarias_empleado ENABLE ROW LEVEL SECURITY;

-- Política multi-tenant
CREATE POLICY cuentas_bancarias_tenant_policy ON cuentas_bancarias_empleado
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ====================================================================
-- 🔄 TRIGGER: Solo una cuenta principal por empleado
-- ====================================================================
CREATE OR REPLACE FUNCTION fn_cuenta_bancaria_principal_unica()
RETURNS TRIGGER AS $$
BEGIN
    -- Si se está marcando como principal, desmarcar las demás
    IF NEW.es_principal = true AND NEW.eliminado_en IS NULL THEN
        UPDATE cuentas_bancarias_empleado
        SET es_principal = false, actualizado_en = NOW()
        WHERE profesional_id = NEW.profesional_id
            AND organizacion_id = NEW.organizacion_id
            AND id != NEW.id
            AND es_principal = true
            AND eliminado_en IS NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_cuenta_bancaria_principal_unica
    BEFORE INSERT OR UPDATE ON cuentas_bancarias_empleado
    FOR EACH ROW
    EXECUTE FUNCTION fn_cuenta_bancaria_principal_unica();

-- ====================================================================
-- 🔄 TRIGGER: Actualizar timestamp
-- ====================================================================
CREATE TRIGGER trg_cuentas_bancarias_actualizado
    BEFORE UPDATE ON cuentas_bancarias_empleado
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 📝 COMENTARIOS
-- ====================================================================
COMMENT ON TABLE cuentas_bancarias_empleado IS
'Cuentas bancarias de empleados para nómina, reembolsos y comisiones.
Fase 1 del Plan de Empleados Competitivo (Enero 2026).
Solo una cuenta puede ser principal por empleado (trigger automático).';

COMMENT ON COLUMN cuentas_bancarias_empleado.clabe IS
'CLABE interbancaria de 18 dígitos (México). Requerida para transferencias SPEI.';

COMMENT ON COLUMN cuentas_bancarias_empleado.es_principal IS
'Indica la cuenta principal para depósito de nómina. Solo una por empleado.';

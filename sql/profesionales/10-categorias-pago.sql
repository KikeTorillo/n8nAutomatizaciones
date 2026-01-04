-- ====================================================================
-- MÓDULO PROFESIONALES: CATEGORÍAS DE PAGO
-- ====================================================================
-- Clasificación de empleados para propósitos de nómina/compensación
-- GAP-004 vs Odoo 19 - Enero 2026
-- Define permisos de comisiones, bonos, viáticos según nivel jerárquico
-- ====================================================================

-- ============================================================
-- TABLA: categorias_pago
-- ============================================================
-- Categorías para clasificar empleados en términos de compensación
-- Ejemplos: Operativo, Administrativo, Supervisión, Gerencial, Ejecutivo

CREATE TABLE IF NOT EXISTS categorias_pago (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 🏢 MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN BÁSICA
    codigo VARCHAR(20),                       -- Código interno único
    nombre VARCHAR(100) NOT NULL,             -- "Operativo", "Administrativo", "Gerencial"
    descripcion TEXT,

    -- 📊 NIVEL JERÁRQUICO
    nivel_salarial INTEGER DEFAULT 1,         -- 1-10 para ordenar jerárquicamente (1=base, 10=ejecutivo)

    -- 💰 CONFIGURACIÓN DE COMPENSACIÓN
    permite_comisiones BOOLEAN DEFAULT true,  -- ¿Puede recibir comisiones?
    permite_bonos BOOLEAN DEFAULT false,      -- ¿Puede recibir bonos?
    permite_viaticos BOOLEAN DEFAULT false,   -- ¿Puede solicitar viáticos?
    permite_horas_extra BOOLEAN DEFAULT true, -- ¿Puede facturar horas extra?
    exento_impuestos BOOLEAN DEFAULT false,   -- ¿Categoría exenta de ISR?

    -- 💵 RANGOS SALARIALES (opcional, para referencia)
    salario_minimo DECIMAL(12, 2),            -- Salario mínimo de la categoría
    salario_maximo DECIMAL(12, 2),            -- Salario máximo de la categoría
    moneda VARCHAR(3) DEFAULT 'MXN',          -- Moneda de los rangos

    -- 📋 BENEFICIOS
    dias_vacaciones_extra INTEGER DEFAULT 0,  -- Días extra de vacaciones
    porcentaje_aguinaldo DECIMAL(5, 2) DEFAULT 15.0, -- % de aguinaldo (México: 15 días mínimo)
    fondo_ahorro DECIMAL(5, 2) DEFAULT 0,     -- % de aportación a fondo de ahorro

    -- 🎨 UI
    color VARCHAR(7) DEFAULT '#753572',       -- Color para UI
    icono VARCHAR(50) DEFAULT 'wallet',       -- Icono Lucide
    orden INTEGER DEFAULT 0,                  -- Orden de visualización

    -- ⚙️ ESTADO
    activo BOOLEAN DEFAULT true,

    -- 📝 METADATOS
    metadata JSONB DEFAULT '{}',              -- Campos adicionales flexibles

    -- 🕐 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id),
    actualizado_por INTEGER REFERENCES usuarios(id),

    -- ✅ CONSTRAINTS
    CONSTRAINT uk_categorias_pago_org_nombre UNIQUE (organizacion_id, nombre),
    CONSTRAINT uk_categorias_pago_org_codigo UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_categorias_pago_nivel CHECK (nivel_salarial >= 1 AND nivel_salarial <= 10),
    CONSTRAINT chk_categorias_pago_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT chk_categorias_pago_salarios CHECK (
        salario_minimo IS NULL OR salario_maximo IS NULL OR salario_minimo <= salario_maximo
    ),
    CONSTRAINT chk_categorias_pago_porcentajes CHECK (
        porcentaje_aguinaldo >= 0 AND porcentaje_aguinaldo <= 100
        AND fondo_ahorro >= 0 AND fondo_ahorro <= 100
    )
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice para búsqueda por organización (activos)
CREATE INDEX IF NOT EXISTS idx_categorias_pago_org
    ON categorias_pago(organizacion_id)
    WHERE activo = true;

-- Índice para ordenamiento por nivel
CREATE INDEX IF NOT EXISTS idx_categorias_pago_nivel
    ON categorias_pago(organizacion_id, nivel_salarial);

-- Índice para ordenamiento en UI
CREATE INDEX IF NOT EXISTS idx_categorias_pago_orden
    ON categorias_pago(organizacion_id, orden);

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE categorias_pago ENABLE ROW LEVEL SECURITY;

-- Política: Ver categorías de mi organización
CREATE POLICY categorias_pago_select_policy ON categorias_pago
    FOR SELECT
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política: Modificar categorías de mi organización
CREATE POLICY categorias_pago_modify_policy ON categorias_pago
    FOR ALL
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_categorias_pago_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_categorias_pago_updated ON categorias_pago;
CREATE TRIGGER trigger_categorias_pago_updated
    BEFORE UPDATE ON categorias_pago
    FOR EACH ROW
    EXECUTE FUNCTION trigger_categorias_pago_updated_at();

-- ============================================================
-- DATOS INICIALES SUGERIDOS
-- ============================================================
-- Estos se crearán por organización cuando se configure el módulo
-- No son datos del sistema, cada organización define los suyos

-- Ejemplo de creación (ejecutar manualmente o en setup de organización):
-- INSERT INTO categorias_pago (organizacion_id, codigo, nombre, nivel_salarial, permite_comisiones, permite_bonos, permite_viaticos, color)
-- VALUES
--     (1, 'OPE', 'Operativo', 1, true, false, false, '#6B7280'),
--     (1, 'ADM', 'Administrativo', 3, true, false, true, '#3B82F6'),
--     (1, 'SUP', 'Supervisión', 5, true, true, true, '#10B981'),
--     (1, 'GER', 'Gerencial', 7, true, true, true, '#8B5CF6'),
--     (1, 'DIR', 'Directivo', 9, false, true, true, '#F59E0B'),
--     (1, 'EJE', 'Ejecutivo', 10, false, true, true, '#EF4444');

-- ============================================================
-- COMENTARIOS
-- ============================================================

COMMENT ON TABLE categorias_pago IS
'Categoría de pago para clasificación de empleados en nómina/compensación.
Define permisos de comisiones, bonos, viáticos según nivel jerárquico.
GAP-004 vs Odoo 19 - Enero 2026';

COMMENT ON COLUMN categorias_pago.nivel_salarial IS
'Nivel jerárquico (1-10) para ordenar categorías. 1=base/operativo, 10=ejecutivo/dirección';

COMMENT ON COLUMN categorias_pago.permite_comisiones IS
'true = Los empleados de esta categoría pueden recibir comisiones por ventas/servicios';

COMMENT ON COLUMN categorias_pago.permite_bonos IS
'true = Los empleados de esta categoría pueden recibir bonos de desempeño';

COMMENT ON COLUMN categorias_pago.permite_viaticos IS
'true = Los empleados de esta categoría pueden solicitar reembolso de viáticos';

COMMENT ON COLUMN categorias_pago.porcentaje_aguinaldo IS
'Porcentaje de aguinaldo para esta categoría (en México mínimo 15 días = 15%)';

COMMENT ON COLUMN categorias_pago.dias_vacaciones_extra IS
'Días adicionales de vacaciones sobre la política base de la organización';

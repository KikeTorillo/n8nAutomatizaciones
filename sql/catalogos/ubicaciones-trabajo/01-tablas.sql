-- ====================================================================
-- MÓDULO CATÁLOGOS: UBICACIONES DE TRABAJO
-- ====================================================================
-- Catálogo de oficinas/locaciones para trabajo híbrido
-- GAP-003 vs Odoo 19 - Enero 2026
-- Permite asignar ubicación diferente por día de la semana a empleados
-- ====================================================================

-- ============================================================
-- TABLA: ubicaciones_trabajo
-- ============================================================
-- Catálogo de ubicaciones donde los empleados pueden trabajar
-- Soporta oficinas, home office, ubicaciones de clientes, etc.

CREATE TABLE IF NOT EXISTS ubicaciones_trabajo (
    -- 🔑 IDENTIFICADOR
    id SERIAL PRIMARY KEY,

    -- 🏢 MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACIÓN BÁSICA
    codigo VARCHAR(20),                       -- Código interno único
    nombre VARCHAR(100) NOT NULL,             -- "Oficina Central", "Home Office", "Cliente ABC"
    descripcion TEXT,

    -- 📍 UBICACIÓN FÍSICA
    direccion TEXT,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    codigo_postal VARCHAR(10),
    pais VARCHAR(100) DEFAULT 'México',

    -- 🌐 COORDENADAS (opcional, para geolocalización)
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),

    -- ⚙️ TIPO DE UBICACIÓN
    es_remoto BOOLEAN DEFAULT false,          -- true = Home Office/Trabajo Remoto
    es_cliente BOOLEAN DEFAULT false,         -- true = Ubicación del cliente
    es_oficina_principal BOOLEAN DEFAULT false, -- true = Oficina matriz
    es_sucursal BOOLEAN DEFAULT false,        -- true = Sucursal de la organización

    -- 🔗 RELACIONES
    sucursal_id INTEGER, -- Link a sucursal si aplica (FK diferida abajo)

    -- 📱 CONTACTO
    telefono VARCHAR(20),
    email VARCHAR(150),
    responsable VARCHAR(100),                 -- Nombre del responsable de la ubicación

    -- ⏰ HORARIO (opcional)
    horario_apertura TIME,
    horario_cierre TIME,
    dias_operacion TEXT[],                    -- {'lunes', 'martes', ...}

    -- 🎨 UI
    color VARCHAR(7) DEFAULT '#753572',       -- Color para UI
    icono VARCHAR(50) DEFAULT 'building-2',   -- Icono Lucide
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
    CONSTRAINT uk_ubicaciones_trabajo_org_nombre UNIQUE (organizacion_id, nombre),
    CONSTRAINT uk_ubicaciones_trabajo_org_codigo UNIQUE (organizacion_id, codigo),
    CONSTRAINT chk_ubicaciones_color CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT chk_ubicaciones_latitud CHECK (latitud IS NULL OR (latitud >= -90 AND latitud <= 90)),
    CONSTRAINT chk_ubicaciones_longitud CHECK (longitud IS NULL OR (longitud >= -180 AND longitud <= 180))
);

-- ============================================================
-- ÍNDICES
-- ============================================================

-- Índice para búsqueda por organización (activos)
CREATE INDEX IF NOT EXISTS idx_ubicaciones_trabajo_org
    ON ubicaciones_trabajo(organizacion_id)
    WHERE activo = true;

-- Índice para ubicaciones remotas
CREATE INDEX IF NOT EXISTS idx_ubicaciones_trabajo_remoto
    ON ubicaciones_trabajo(organizacion_id, es_remoto)
    WHERE activo = true;

-- Índice para oficinas principales
CREATE INDEX IF NOT EXISTS idx_ubicaciones_trabajo_principal
    ON ubicaciones_trabajo(organizacion_id)
    WHERE es_oficina_principal = true AND activo = true;

-- Índice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_ubicaciones_trabajo_orden
    ON ubicaciones_trabajo(organizacion_id, orden);

-- Índice para link con sucursales
CREATE INDEX IF NOT EXISTS idx_ubicaciones_trabajo_sucursal
    ON ubicaciones_trabajo(sucursal_id)
    WHERE sucursal_id IS NOT NULL;

-- ============================================================
-- RLS (Row Level Security)
-- ============================================================

ALTER TABLE ubicaciones_trabajo ENABLE ROW LEVEL SECURITY;

-- Política: Ver ubicaciones de mi organización
CREATE POLICY ubicaciones_trabajo_select_policy ON ubicaciones_trabajo
    FOR SELECT
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política: Modificar ubicaciones de mi organización
CREATE POLICY ubicaciones_trabajo_modify_policy ON ubicaciones_trabajo
    FOR ALL
    USING (
        organizacion_id = COALESCE(NULLIF(current_setting('app.current_tenant_id', true), '')::integer, 0)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================
-- TRIGGER: Actualizar timestamp
-- ============================================================

CREATE OR REPLACE FUNCTION trigger_ubicaciones_trabajo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_ubicaciones_trabajo_updated ON ubicaciones_trabajo;
CREATE TRIGGER trigger_ubicaciones_trabajo_updated
    BEFORE UPDATE ON ubicaciones_trabajo
    FOR EACH ROW
    EXECUTE FUNCTION trigger_ubicaciones_trabajo_updated_at();

-- ============================================================
-- COMENTARIOS
-- ============================================================

COMMENT ON TABLE ubicaciones_trabajo IS
'Catálogo de ubicaciones de trabajo para soporte de trabajo híbrido.
Cada profesional puede tener una ubicación diferente para cada día de la semana.
GAP-003 vs Odoo 19 - Enero 2026';

COMMENT ON COLUMN ubicaciones_trabajo.codigo IS
'Código único de la ubicación dentro de la organización. Ej: OFC-CDMX, HO, CLI-ABC';

COMMENT ON COLUMN ubicaciones_trabajo.es_remoto IS
'true = Ubicación remota (Home Office, trabajo desde casa)';

COMMENT ON COLUMN ubicaciones_trabajo.es_cliente IS
'true = Ubicación en instalaciones del cliente';

COMMENT ON COLUMN ubicaciones_trabajo.es_oficina_principal IS
'true = Oficina matriz/principal de la organización';

COMMENT ON COLUMN ubicaciones_trabajo.sucursal_id IS
'Referencia a sucursal si esta ubicación corresponde a una sucursal existente';

COMMENT ON COLUMN ubicaciones_trabajo.dias_operacion IS
'Días de la semana en que opera esta ubicación. Ej: {lunes, martes, miercoles}';

-- ============================================================
-- FK DIFERIDA: Link a sucursales
-- ============================================================
-- Se ejecuta después de crear tabla sucursales

ALTER TABLE ubicaciones_trabajo
ADD CONSTRAINT fk_ubicaciones_trabajo_sucursal
FOREIGN KEY (sucursal_id) REFERENCES sucursales(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

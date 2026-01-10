-- ====================================================================
-- SISTEMA DE DOCUMENTOS PARA CLIENTES
-- ====================================================================
--
-- Fase 4B - Documentos de Cliente (Enero 2026)
-- Tabla para gestión de documentos asociados a clientes
--
-- Características:
-- • Catálogo extenso de tipos de documento (15+ tipos)
-- • Integración con storage (MinIO)
-- • Fechas de emisión y vencimiento
-- • Sistema de verificación
-- • RLS multi-tenant por organizacion_id
--
-- ====================================================================

-- ====================================================================
-- TABLA: cliente_documentos
-- Almacena documentos asociados a clientes
-- ====================================================================

CREATE TABLE IF NOT EXISTS cliente_documentos (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

    -- Referencia al archivo en storage
    archivo_storage_id INTEGER REFERENCES archivos_storage(id) ON DELETE SET NULL,

    -- Tipo y descripción
    tipo_documento VARCHAR(50) NOT NULL,    -- 'ine', 'contrato', 'receta', etc.
    nombre VARCHAR(150) NOT NULL,           -- Nombre descriptivo del documento
    descripcion TEXT,                       -- Notas adicionales

    -- Metadatos del archivo
    nombre_archivo VARCHAR(255),            -- Nombre original del archivo
    mime_type VARCHAR(100),                 -- Tipo MIME
    tamano_bytes BIGINT,                    -- Tamaño en bytes

    -- Fechas relevantes
    fecha_emision DATE,                     -- Fecha de emisión del documento
    fecha_vencimiento DATE,                 -- Fecha de vencimiento (si aplica)

    -- Verificación
    verificado BOOLEAN DEFAULT false,
    verificado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    verificado_en TIMESTAMPTZ,

    -- Estado
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_tipo_documento CHECK (tipo_documento IN (
        'ine',                    -- INE / Identificación oficial
        'pasaporte',              -- Pasaporte
        'curp',                   -- CURP
        'rfc',                    -- Constancia RFC
        'comprobante_domicilio',  -- Comprobante de domicilio
        'contrato',               -- Contrato de servicios
        'consentimiento',         -- Consentimiento informado
        'historia_clinica',       -- Historia clínica
        'receta_medica',          -- Receta médica
        'estudios_laboratorio',   -- Estudios de laboratorio
        'radiografia',            -- Radiografía / Imagen médica
        'poliza_seguro',          -- Póliza de seguro
        'factura',                -- Factura
        'comprobante_pago',       -- Comprobante de pago
        'foto',                   -- Fotografía del cliente
        'otro'                    -- Otro documento
    ))
);

COMMENT ON TABLE cliente_documentos IS 'Documentos asociados a clientes (identificaciones, contratos, etc.)';
COMMENT ON COLUMN cliente_documentos.tipo_documento IS 'Tipo de documento: ine, pasaporte, contrato, etc.';
COMMENT ON COLUMN cliente_documentos.verificado IS 'Indica si el documento ha sido verificado por un usuario';


-- ====================================================================
-- ÍNDICES OPTIMIZADOS
-- ====================================================================

-- Índice principal: documentos por cliente
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_cliente
    ON cliente_documentos(cliente_id, activo);

-- Índice por organización
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_org
    ON cliente_documentos(organizacion_id);

-- Índice por tipo de documento
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_tipo
    ON cliente_documentos(cliente_id, tipo_documento);

-- Índice para documentos por vencer
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_vencimiento
    ON cliente_documentos(organizacion_id, fecha_vencimiento)
    WHERE activo = true AND fecha_vencimiento IS NOT NULL;

-- Índice para documentos no verificados
CREATE INDEX IF NOT EXISTS idx_cliente_documentos_no_verificados
    ON cliente_documentos(organizacion_id, verificado)
    WHERE activo = true AND verificado = false;


-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE cliente_documentos ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento por tenant
DROP POLICY IF EXISTS cliente_documentos_tenant_policy ON cliente_documentos;
CREATE POLICY cliente_documentos_tenant_policy ON cliente_documentos
    FOR ALL
    USING (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );


-- ====================================================================
-- TRIGGER: Actualizar timestamp
-- ====================================================================

CREATE OR REPLACE FUNCTION update_cliente_documento_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cliente_documentos_updated ON cliente_documentos;
CREATE TRIGGER trigger_cliente_documentos_updated
    BEFORE UPDATE ON cliente_documentos
    FOR EACH ROW
    EXECUTE FUNCTION update_cliente_documento_timestamp();


-- ====================================================================
-- FUNCIÓN: Obtener documentos por vencer
-- Retorna documentos que vencen en los próximos N días
-- ====================================================================

CREATE OR REPLACE FUNCTION get_documentos_por_vencer(
    p_organizacion_id INTEGER,
    p_dias INTEGER DEFAULT 30
)
RETURNS TABLE (
    id INTEGER,
    cliente_id INTEGER,
    cliente_nombre VARCHAR,
    tipo_documento VARCHAR,
    nombre VARCHAR,
    fecha_vencimiento DATE,
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        d.id,
        d.cliente_id,
        c.nombre::VARCHAR as cliente_nombre,
        d.tipo_documento::VARCHAR,
        d.nombre::VARCHAR,
        d.fecha_vencimiento,
        (d.fecha_vencimiento - CURRENT_DATE)::INTEGER as dias_restantes
    FROM cliente_documentos d
    JOIN clientes c ON c.id = d.cliente_id
    WHERE d.organizacion_id = p_organizacion_id
      AND d.activo = true
      AND d.fecha_vencimiento IS NOT NULL
      AND d.fecha_vencimiento <= CURRENT_DATE + p_dias
      AND d.fecha_vencimiento >= CURRENT_DATE
    ORDER BY d.fecha_vencimiento ASC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_documentos_por_vencer IS 'Retorna documentos que vencen en los próximos N días';


-- ====================================================================
-- FUNCIÓN: Contar documentos por cliente
-- ====================================================================

CREATE OR REPLACE FUNCTION contar_documentos_cliente(p_cliente_id INTEGER)
RETURNS TABLE (
    total INTEGER,
    verificados INTEGER,
    pendientes INTEGER,
    por_vencer INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total,
        COUNT(*) FILTER (WHERE verificado = true)::INTEGER as verificados,
        COUNT(*) FILTER (WHERE verificado = false)::INTEGER as pendientes,
        COUNT(*) FILTER (WHERE fecha_vencimiento IS NOT NULL AND fecha_vencimiento <= CURRENT_DATE + 30 AND fecha_vencimiento >= CURRENT_DATE)::INTEGER as por_vencer
    FROM cliente_documentos
    WHERE cliente_id = p_cliente_id AND activo = true;
END;
$$ LANGUAGE plpgsql STABLE;


-- ====================================================================
-- VISTA: Catálogo de tipos de documento
-- Para uso en el frontend
-- ====================================================================

CREATE OR REPLACE VIEW v_tipos_documento_cliente AS
SELECT * FROM (VALUES
    ('ine', 'INE / Identificación oficial', 'identificacion'),
    ('pasaporte', 'Pasaporte', 'identificacion'),
    ('curp', 'CURP', 'identificacion'),
    ('rfc', 'Constancia RFC', 'fiscal'),
    ('comprobante_domicilio', 'Comprobante de domicilio', 'identificacion'),
    ('contrato', 'Contrato de servicios', 'legal'),
    ('consentimiento', 'Consentimiento informado', 'legal'),
    ('historia_clinica', 'Historia clínica', 'medico'),
    ('receta_medica', 'Receta médica', 'medico'),
    ('estudios_laboratorio', 'Estudios de laboratorio', 'medico'),
    ('radiografia', 'Radiografía / Imagen', 'medico'),
    ('poliza_seguro', 'Póliza de seguro', 'financiero'),
    ('factura', 'Factura', 'financiero'),
    ('comprobante_pago', 'Comprobante de pago', 'financiero'),
    ('foto', 'Fotografía', 'otro'),
    ('otro', 'Otro documento', 'otro')
) AS t(codigo, nombre, categoria);

COMMENT ON VIEW v_tipos_documento_cliente IS 'Catálogo de tipos de documento disponibles para clientes';


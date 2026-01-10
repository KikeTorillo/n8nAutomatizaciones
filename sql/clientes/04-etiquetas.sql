/**
 * ====================================================================
 * SISTEMA DE ETIQUETAS PARA CLIENTES
 * ====================================================================
 *
 * Fase 2 - Segmentación de Clientes (Ene 2026)
 * Tablas para gestión de etiquetas con colores y relación M:M
 *
 * ====================================================================
 */

-- ====================================================================
-- TABLA: etiquetas_clientes
-- Catálogo de etiquetas por organización
-- ====================================================================

CREATE TABLE IF NOT EXISTS etiquetas_clientes (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    descripcion VARCHAR(200),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Nombre único por organización
    UNIQUE(organizacion_id, nombre),

    -- Validar formato de color hexadecimal
    CONSTRAINT etiquetas_clientes_color_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE etiquetas_clientes IS 'Catálogo de etiquetas para segmentación de clientes';
COMMENT ON COLUMN etiquetas_clientes.color IS 'Color hexadecimal para visualización (ej: #EF4444)';
COMMENT ON COLUMN etiquetas_clientes.orden IS 'Orden de visualización en selectores';


-- ====================================================================
-- TABLA: cliente_etiquetas
-- Relación M:M entre clientes y etiquetas
-- ====================================================================

CREATE TABLE IF NOT EXISTS cliente_etiquetas (
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    etiqueta_id INTEGER NOT NULL REFERENCES etiquetas_clientes(id) ON DELETE CASCADE,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (cliente_id, etiqueta_id)
);

COMMENT ON TABLE cliente_etiquetas IS 'Relación M:M entre clientes y etiquetas';


-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Índice para búsqueda de etiquetas activas por organización
CREATE INDEX IF NOT EXISTS idx_etiquetas_clientes_org_activo
    ON etiquetas_clientes(organizacion_id)
    WHERE activo = true;

-- Índice para ordenamiento
CREATE INDEX IF NOT EXISTS idx_etiquetas_clientes_orden
    ON etiquetas_clientes(organizacion_id, orden);

-- Índices para la tabla intermedia
CREATE INDEX IF NOT EXISTS idx_cliente_etiquetas_cliente
    ON cliente_etiquetas(cliente_id);

CREATE INDEX IF NOT EXISTS idx_cliente_etiquetas_etiqueta
    ON cliente_etiquetas(etiqueta_id);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

-- Habilitar RLS
ALTER TABLE etiquetas_clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cliente_etiquetas ENABLE ROW LEVEL SECURITY;

-- Política para etiquetas_clientes (acceso por tenant)
DROP POLICY IF EXISTS etiquetas_clientes_tenant_policy ON etiquetas_clientes;
CREATE POLICY etiquetas_clientes_tenant_policy ON etiquetas_clientes
    FOR ALL
    USING (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política para cliente_etiquetas (acceso via cliente)
DROP POLICY IF EXISTS cliente_etiquetas_tenant_policy ON cliente_etiquetas;
CREATE POLICY cliente_etiquetas_tenant_policy ON cliente_etiquetas
    FOR ALL
    USING (
        cliente_id IN (
            SELECT id FROM clientes
            WHERE organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );


-- ====================================================================
-- TRIGGER: Actualizar timestamp
-- ====================================================================

-- Reutilizar función existente si existe, sino crearla
CREATE OR REPLACE FUNCTION update_etiqueta_cliente_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_etiquetas_clientes_updated ON etiquetas_clientes;
CREATE TRIGGER trigger_etiquetas_clientes_updated
    BEFORE UPDATE ON etiquetas_clientes
    FOR EACH ROW
    EXECUTE FUNCTION update_etiqueta_cliente_timestamp();


-- ====================================================================
-- DATOS INICIALES (Etiquetas de ejemplo)
-- Solo se insertan si no existen para la organización demo
-- ====================================================================

-- Insertar etiquetas de ejemplo para la organización 1 (demo)
INSERT INTO etiquetas_clientes (organizacion_id, nombre, color, descripcion, orden)
SELECT 1, nombre, color, descripcion, orden
FROM (VALUES
    ('VIP', '#EF4444', 'Clientes VIP con beneficios especiales', 1),
    ('Frecuente', '#10B981', 'Clientes con visitas regulares', 2),
    ('Nuevo', '#F59E0B', 'Clientes nuevos (menos de 3 meses)', 3),
    ('Corporativo', '#3B82F6', 'Clientes empresariales', 4),
    ('Referido', '#14B8A6', 'Clientes que llegaron por referencia', 5)
) AS v(nombre, color, descripcion, orden)
WHERE EXISTS (SELECT 1 FROM organizaciones WHERE id = 1)
AND NOT EXISTS (
    SELECT 1 FROM etiquetas_clientes
    WHERE organizacion_id = 1 AND nombre = v.nombre
);


-- ====================================================================
-- FUNCIONES ÚTILES
-- ====================================================================

-- Función para obtener etiquetas de un cliente como JSON array
CREATE OR REPLACE FUNCTION get_cliente_etiquetas(p_cliente_id INTEGER)
RETURNS JSONB AS $$
    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', e.id,
                'nombre', e.nombre,
                'color', e.color
            )
            ORDER BY e.orden, e.nombre
        ),
        '[]'::jsonb
    )
    FROM cliente_etiquetas ce
    JOIN etiquetas_clientes e ON e.id = ce.etiqueta_id
    WHERE ce.cliente_id = p_cliente_id
    AND e.activo = true;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_cliente_etiquetas IS 'Retorna las etiquetas de un cliente como JSON array';


-- Función para asignar múltiples etiquetas a un cliente (reemplaza existentes)
CREATE OR REPLACE FUNCTION set_cliente_etiquetas(
    p_cliente_id INTEGER,
    p_etiqueta_ids INTEGER[]
)
RETURNS VOID AS $$
BEGIN
    -- Eliminar etiquetas existentes
    DELETE FROM cliente_etiquetas WHERE cliente_id = p_cliente_id;

    -- Insertar nuevas etiquetas
    IF p_etiqueta_ids IS NOT NULL AND array_length(p_etiqueta_ids, 1) > 0 THEN
        INSERT INTO cliente_etiquetas (cliente_id, etiqueta_id)
        SELECT p_cliente_id, unnest(p_etiqueta_ids);
    END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION set_cliente_etiquetas IS 'Asigna etiquetas a un cliente (reemplaza las existentes)';

-- ============================================================================
-- MODULO: INVENTARIO - VARIANTES DE PRODUCTO
-- Descripcion: Sistema de variantes con atributos dinamicos (Color, Talla, etc.)
-- Version: 1.0
-- Fecha: Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: atributos_producto
-- Descripcion: Tipos de atributos para variantes (Color, Talla, Material)
-- ============================================================================
CREATE TABLE IF NOT EXISTS atributos_producto (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- INFORMACION
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    tipo_visualizacion VARCHAR(20) DEFAULT 'dropdown' CHECK (tipo_visualizacion IN ('dropdown', 'buttons', 'color_swatches')),
    orden INTEGER DEFAULT 0,

    -- ESTADO
    activo BOOLEAN DEFAULT true,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, codigo),
    CHECK (orden >= 0)
);

COMMENT ON TABLE atributos_producto IS 'Tipos de atributos para variantes de producto (Color, Talla, Material, etc.)';
COMMENT ON COLUMN atributos_producto.tipo_visualizacion IS 'dropdown: lista desplegable, buttons: botones, color_swatches: muestras de color';
COMMENT ON COLUMN atributos_producto.codigo IS 'Codigo unico para referencia en SKU (ej: COLOR, TALLA)';

-- ============================================================================
-- TABLA: valores_atributo
-- Descripcion: Valores posibles para cada atributo (Rojo, Azul, S, M, L)
-- ============================================================================
CREATE TABLE IF NOT EXISTS valores_atributo (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    atributo_id INTEGER NOT NULL REFERENCES atributos_producto(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- INFORMACION
    valor VARCHAR(50) NOT NULL,
    codigo VARCHAR(30) NOT NULL,
    color_hex VARCHAR(7), -- #FF0000 para swatches
    orden INTEGER DEFAULT 0,

    -- ESTADO
    activo BOOLEAN DEFAULT true,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(atributo_id, codigo),
    CHECK (orden >= 0),
    CHECK (color_hex IS NULL OR color_hex ~ '^#[0-9A-Fa-f]{6}$')
);

COMMENT ON TABLE valores_atributo IS 'Valores posibles para cada atributo (Rojo, Azul, S, M, L, etc.)';
COMMENT ON COLUMN valores_atributo.codigo IS 'Codigo corto para SKU (ej: RJ para Rojo, AZ para Azul)';
COMMENT ON COLUMN valores_atributo.color_hex IS 'Color hexadecimal para visualizacion tipo color_swatches';

-- ============================================================================
-- TABLA: variantes_producto
-- Descripcion: Combinaciones de producto con stock y precios independientes
-- ============================================================================
CREATE TABLE IF NOT EXISTS variantes_producto (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- INFORMACION
    sku VARCHAR(50),
    codigo_barras VARCHAR(50),
    nombre_variante VARCHAR(200), -- "Camiseta - Rojo / M"

    -- PRECIOS (NULL = heredar del padre)
    precio_compra DECIMAL(10,2),
    precio_venta DECIMAL(10,2),

    -- STOCK
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    stock_maximo INTEGER DEFAULT 100,

    -- IMAGEN
    imagen_url TEXT,

    -- ESTADO
    activo BOOLEAN DEFAULT true,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, sku),
    CHECK (precio_compra IS NULL OR precio_compra >= 0),
    CHECK (precio_venta IS NULL OR precio_venta > 0),
    CHECK (stock_actual >= 0),
    CHECK (stock_minimo >= 0),
    CHECK (stock_maximo >= stock_minimo)
);

COMMENT ON TABLE variantes_producto IS 'Variantes de producto con stock y precios independientes';
COMMENT ON COLUMN variantes_producto.nombre_variante IS 'Nombre descriptivo: "Producto - Valor1 / Valor2"';
COMMENT ON COLUMN variantes_producto.precio_venta IS 'NULL para heredar precio del producto padre';

-- ============================================================================
-- TABLA: variantes_atributos
-- Descripcion: Relacion M:M entre variantes y valores de atributo
-- ============================================================================
CREATE TABLE IF NOT EXISTS variantes_atributos (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    variante_id INTEGER NOT NULL REFERENCES variantes_producto(id) ON DELETE CASCADE,
    atributo_id INTEGER NOT NULL REFERENCES atributos_producto(id) ON DELETE CASCADE,
    valor_id INTEGER NOT NULL REFERENCES valores_atributo(id) ON DELETE CASCADE,

    -- CONSTRAINTS
    UNIQUE(variante_id, atributo_id) -- Una variante solo tiene un valor por atributo
);

COMMENT ON TABLE variantes_atributos IS 'Relacion entre variantes y los valores de atributo que la componen';

-- ============================================================================
-- INDICES
-- ============================================================================

-- atributos_producto
CREATE INDEX IF NOT EXISTS idx_atributos_producto_org ON atributos_producto(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_atributos_producto_activo ON atributos_producto(organizacion_id, activo);

-- valores_atributo
CREATE INDEX IF NOT EXISTS idx_valores_atributo_atributo ON valores_atributo(atributo_id);
CREATE INDEX IF NOT EXISTS idx_valores_atributo_org ON valores_atributo(organizacion_id);

-- variantes_producto
CREATE INDEX IF NOT EXISTS idx_variantes_producto_org ON variantes_producto(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_producto ON variantes_producto(producto_id);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_sku ON variantes_producto(organizacion_id, sku);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_barcode ON variantes_producto(organizacion_id, codigo_barras);
CREATE INDEX IF NOT EXISTS idx_variantes_producto_activo ON variantes_producto(organizacion_id, activo);

-- variantes_atributos
CREATE INDEX IF NOT EXISTS idx_variantes_atributos_variante ON variantes_atributos(variante_id);
CREATE INDEX IF NOT EXISTS idx_variantes_atributos_valor ON variantes_atributos(valor_id);

-- ============================================================================
-- RLS: ATRIBUTOS_PRODUCTO
-- ============================================================================
ALTER TABLE atributos_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE atributos_producto FORCE ROW LEVEL SECURITY;

CREATE POLICY atributos_producto_select ON atributos_producto
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY atributos_producto_insert ON atributos_producto
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY atributos_producto_update ON atributos_producto
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY atributos_producto_delete ON atributos_producto
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

-- ============================================================================
-- RLS: VALORES_ATRIBUTO
-- ============================================================================
ALTER TABLE valores_atributo ENABLE ROW LEVEL SECURITY;
ALTER TABLE valores_atributo FORCE ROW LEVEL SECURITY;

CREATE POLICY valores_atributo_select ON valores_atributo
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY valores_atributo_insert ON valores_atributo
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY valores_atributo_update ON valores_atributo
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY valores_atributo_delete ON valores_atributo
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

-- ============================================================================
-- RLS: VARIANTES_PRODUCTO
-- ============================================================================
ALTER TABLE variantes_producto ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes_producto FORCE ROW LEVEL SECURITY;

CREATE POLICY variantes_producto_select ON variantes_producto
    FOR SELECT USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY variantes_producto_insert ON variantes_producto
    FOR INSERT WITH CHECK (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY variantes_producto_update ON variantes_producto
    FOR UPDATE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

CREATE POLICY variantes_producto_delete ON variantes_producto
    FOR DELETE USING (
        organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
        OR current_setting('app.current_user_role', true) = 'super_admin'
    );

-- ============================================================================
-- RLS: VARIANTES_ATRIBUTOS (via JOIN con variantes_producto)
-- ============================================================================
ALTER TABLE variantes_atributos ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes_atributos FORCE ROW LEVEL SECURITY;

CREATE POLICY variantes_atributos_select ON variantes_atributos
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM variantes_producto vp
            WHERE vp.id = variantes_atributos.variante_id
            AND (
                vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
                OR current_setting('app.current_user_role', true) = 'super_admin'
            )
        )
    );

CREATE POLICY variantes_atributos_insert ON variantes_atributos
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM variantes_producto vp
            WHERE vp.id = variantes_atributos.variante_id
            AND (
                vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
                OR current_setting('app.current_user_role', true) = 'super_admin'
            )
        )
    );

CREATE POLICY variantes_atributos_update ON variantes_atributos
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM variantes_producto vp
            WHERE vp.id = variantes_atributos.variante_id
            AND (
                vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
                OR current_setting('app.current_user_role', true) = 'super_admin'
            )
        )
    );

CREATE POLICY variantes_atributos_delete ON variantes_atributos
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM variantes_producto vp
            WHERE vp.id = variantes_atributos.variante_id
            AND (
                vp.organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER
                OR current_setting('app.current_user_role', true) = 'super_admin'
            )
        )
    );

-- ============================================================================
-- TRIGGER: actualizar_timestamp
-- ============================================================================
CREATE TRIGGER trg_atributos_producto_updated_at
    BEFORE UPDATE ON atributos_producto
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_valores_atributo_updated_at
    BEFORE UPDATE ON valores_atributo
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

CREATE TRIGGER trg_variantes_producto_updated_at
    BEFORE UPDATE ON variantes_producto
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ============================================================================
-- DATOS INICIALES: Atributos comunes
-- Nota: Solo se insertan si no existen. Se crean por organizacion.
-- ============================================================================

-- Funcion para crear atributos por defecto en una organizacion
CREATE OR REPLACE FUNCTION crear_atributos_defecto(p_organizacion_id INTEGER)
RETURNS void AS $$
DECLARE
    v_color_id INTEGER;
    v_talla_id INTEGER;
BEGIN
    -- Crear atributo COLOR si no existe
    INSERT INTO atributos_producto (organizacion_id, nombre, codigo, tipo_visualizacion, orden)
    VALUES (p_organizacion_id, 'Color', 'COLOR', 'color_swatches', 1)
    ON CONFLICT (organizacion_id, codigo) DO NOTHING
    RETURNING id INTO v_color_id;

    -- Si se creo el atributo, agregar valores
    IF v_color_id IS NOT NULL THEN
        INSERT INTO valores_atributo (atributo_id, organizacion_id, valor, codigo, color_hex, orden) VALUES
            (v_color_id, p_organizacion_id, 'Negro', 'NGR', '#000000', 1),
            (v_color_id, p_organizacion_id, 'Blanco', 'BLC', '#FFFFFF', 2),
            (v_color_id, p_organizacion_id, 'Rojo', 'RJO', '#FF0000', 3),
            (v_color_id, p_organizacion_id, 'Azul', 'AZL', '#0000FF', 4),
            (v_color_id, p_organizacion_id, 'Verde', 'VRD', '#00FF00', 5),
            (v_color_id, p_organizacion_id, 'Amarillo', 'AMA', '#FFFF00', 6),
            (v_color_id, p_organizacion_id, 'Gris', 'GRS', '#808080', 7),
            (v_color_id, p_organizacion_id, 'Rosa', 'RSA', '#FFC0CB', 8)
        ON CONFLICT (atributo_id, codigo) DO NOTHING;
    END IF;

    -- Crear atributo TALLA si no existe
    INSERT INTO atributos_producto (organizacion_id, nombre, codigo, tipo_visualizacion, orden)
    VALUES (p_organizacion_id, 'Talla', 'TALLA', 'buttons', 2)
    ON CONFLICT (organizacion_id, codigo) DO NOTHING
    RETURNING id INTO v_talla_id;

    -- Si se creo el atributo, agregar valores
    IF v_talla_id IS NOT NULL THEN
        INSERT INTO valores_atributo (atributo_id, organizacion_id, valor, codigo, orden) VALUES
            (v_talla_id, p_organizacion_id, 'XS', 'XS', 1),
            (v_talla_id, p_organizacion_id, 'S', 'S', 2),
            (v_talla_id, p_organizacion_id, 'M', 'M', 3),
            (v_talla_id, p_organizacion_id, 'L', 'L', 4),
            (v_talla_id, p_organizacion_id, 'XL', 'XL', 5),
            (v_talla_id, p_organizacion_id, 'XXL', 'XXL', 6)
        ON CONFLICT (atributo_id, codigo) DO NOTHING;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_atributos_defecto IS 'Crea atributos Color y Talla con valores por defecto para una organizacion';

-- ============================================================================
-- FIN: VARIANTES DE PRODUCTO
-- ============================================================================

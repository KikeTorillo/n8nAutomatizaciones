-- ============================================================================
-- COMBOS Y MODIFICADORES DE PRODUCTOS - POS
-- ============================================================================
--
-- Script para crear tablas y funciones de:
-- 1. Combos/Paquetes: Productos compuestos de varios items
-- 2. Modificadores: Extras, opciones de personalización
--
-- Ene 2026 - Fase 3 POS
-- ============================================================================

-- ============================================================================
-- PARTE 1: COMBOS / PAQUETES
-- ============================================================================

-- Configuración de combos para productos
-- Se asocia al producto padre que representa el combo
CREATE TABLE IF NOT EXISTS productos_combo (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Tipo de cálculo de precio
    -- 'fijo': El precio del combo es el precio del producto padre
    -- 'suma_componentes': Suma de precios de componentes
    -- 'descuento_porcentaje': Suma de componentes con descuento %
    tipo_precio VARCHAR(30) NOT NULL DEFAULT 'fijo' CHECK (tipo_precio IN ('fijo', 'suma_componentes', 'descuento_porcentaje')),

    -- Solo aplica si tipo_precio = 'descuento_porcentaje'
    descuento_porcentaje DECIMAL(5,2) DEFAULT 0 CHECK (descuento_porcentaje >= 0 AND descuento_porcentaje <= 100),

    -- Control de stock
    -- 'descontar_componentes': Descuenta stock de cada componente
    -- 'descontar_combo': Descuenta stock del producto combo (requiere stock propio)
    manejo_stock VARCHAR(30) NOT NULL DEFAULT 'descontar_componentes' CHECK (manejo_stock IN ('descontar_componentes', 'descontar_combo')),

    -- Visibilidad
    activo BOOLEAN DEFAULT TRUE,

    -- Auditoría
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Un producto solo puede tener una configuración de combo
    CONSTRAINT uq_producto_combo UNIQUE (producto_id)
);

-- Componentes del combo
CREATE TABLE IF NOT EXISTS productos_combo_items (
    id SERIAL PRIMARY KEY,
    combo_id INTEGER NOT NULL REFERENCES productos_combo(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Cantidad del componente en el combo
    cantidad INTEGER NOT NULL DEFAULT 1 CHECK (cantidad > 0),

    -- Si permite elegir variante (para combos personalizables)
    permite_variante BOOLEAN DEFAULT FALSE,

    -- Precio unitario (opcional, si se quiere sobrescribir)
    precio_unitario DECIMAL(12,2) DEFAULT NULL,

    -- Orden de visualización
    orden INTEGER DEFAULT 0,

    -- Auditoría
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Un producto no puede estar duplicado en el mismo combo
    CONSTRAINT uq_combo_producto UNIQUE (combo_id, producto_id)
);

-- ============================================================================
-- PARTE 2: MODIFICADORES DE PRODUCTO
-- ============================================================================

-- Grupos de modificadores (ej: "Tamaño", "Extras", "Quitar ingredientes")
CREATE TABLE IF NOT EXISTS grupos_modificadores (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50),
    descripcion TEXT,

    -- Tipo de selección
    -- 'unico': Radio buttons, solo una opción (ej: Tamaño)
    -- 'multiple': Checkboxes, varias opciones (ej: Extras)
    tipo_seleccion VARCHAR(20) NOT NULL DEFAULT 'unico' CHECK (tipo_seleccion IN ('unico', 'multiple')),

    -- Configuración
    requerido BOOLEAN DEFAULT FALSE,  -- ¿Debe elegir al menos uno?
    minimo_seleccion INTEGER DEFAULT 0 CHECK (minimo_seleccion >= 0),
    maximo_seleccion INTEGER DEFAULT NULL,  -- NULL = sin límite

    -- Visibilidad
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,

    -- Auditoría
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT uq_grupo_modificador_codigo UNIQUE (organizacion_id, codigo)
);

-- Opciones de modificadores
CREATE TABLE IF NOT EXISTS modificadores (
    id SERIAL PRIMARY KEY,
    grupo_id INTEGER NOT NULL REFERENCES grupos_modificadores(id) ON DELETE CASCADE,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificación
    nombre VARCHAR(100) NOT NULL,
    codigo VARCHAR(50),
    descripcion TEXT,

    -- Prefijo para tickets (ej: "Add", "No", "Extra", "Side")
    prefijo VARCHAR(20) DEFAULT NULL,

    -- Precio adicional (puede ser 0 o negativo para descuentos)
    precio_adicional DECIMAL(12,2) DEFAULT 0,

    -- Si tiene producto asociado (para control de stock de extras)
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,

    -- Visibilidad
    activo BOOLEAN DEFAULT TRUE,
    es_default BOOLEAN DEFAULT FALSE,  -- Preseleccionado por defecto
    orden INTEGER DEFAULT 0,

    -- Auditoría
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Asignación de grupos de modificadores a productos/categorías
CREATE TABLE IF NOT EXISTS productos_grupos_modificadores (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Puede aplicar a producto específico o a toda una categoría
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias(id) ON DELETE CASCADE,

    grupo_id INTEGER NOT NULL REFERENCES grupos_modificadores(id) ON DELETE CASCADE,

    -- Configuración específica para esta asignación
    requerido BOOLEAN DEFAULT NULL,  -- NULL = usar valor del grupo
    orden INTEGER DEFAULT 0,

    -- Auditoría
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    -- Al menos uno debe estar definido
    CONSTRAINT chk_producto_o_categoria CHECK (
        (producto_id IS NOT NULL AND categoria_id IS NULL) OR
        (producto_id IS NULL AND categoria_id IS NOT NULL)
    ),

    -- Un grupo solo puede asignarse una vez por producto o categoría
    CONSTRAINT uq_producto_grupo UNIQUE (producto_id, grupo_id),
    CONSTRAINT uq_categoria_grupo UNIQUE (categoria_id, grupo_id)
);

-- Modificadores aplicados a items de venta
CREATE TABLE IF NOT EXISTS ventas_pos_items_modificadores (
    id SERIAL PRIMARY KEY,
    venta_item_id INTEGER NOT NULL REFERENCES ventas_pos_items(id) ON DELETE CASCADE,
    modificador_id INTEGER NOT NULL REFERENCES modificadores(id) ON DELETE RESTRICT,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Cantidad (para modificadores tipo "Extra" que se pueden repetir)
    cantidad INTEGER DEFAULT 1 CHECK (cantidad > 0),

    -- Precio al momento de la venta (snapshot)
    precio_unitario DECIMAL(12,2) NOT NULL,

    -- Subtotal (cantidad * precio_unitario)
    subtotal DECIMAL(12,2) NOT NULL,

    -- Nombre para el ticket (snapshot)
    nombre_display VARCHAR(150) NOT NULL,

    -- Auditoría
    creado_en TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Combos
CREATE INDEX IF NOT EXISTS idx_productos_combo_org ON productos_combo(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_productos_combo_items_combo ON productos_combo_items(combo_id);
CREATE INDEX IF NOT EXISTS idx_productos_combo_items_producto ON productos_combo_items(producto_id);

-- Modificadores
CREATE INDEX IF NOT EXISTS idx_grupos_modificadores_org ON grupos_modificadores(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_modificadores_grupo ON modificadores(grupo_id);
CREATE INDEX IF NOT EXISTS idx_modificadores_producto ON modificadores(producto_id) WHERE producto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_grupos_mod_producto ON productos_grupos_modificadores(producto_id) WHERE producto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_productos_grupos_mod_categoria ON productos_grupos_modificadores(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_ventas_items_mod_item ON ventas_pos_items_modificadores(venta_item_id);

-- ============================================================================
-- RLS (Row Level Security)
-- ============================================================================

ALTER TABLE productos_combo ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_combo_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE grupos_modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos_grupos_modificadores ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas_pos_items_modificadores ENABLE ROW LEVEL SECURITY;

-- Políticas para productos_combo
DROP POLICY IF EXISTS productos_combo_tenant_isolation ON productos_combo;
CREATE POLICY productos_combo_tenant_isolation ON productos_combo
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS productos_combo_tenant_insert ON productos_combo;
CREATE POLICY productos_combo_tenant_insert ON productos_combo
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Políticas para productos_combo_items
DROP POLICY IF EXISTS productos_combo_items_tenant_isolation ON productos_combo_items;
CREATE POLICY productos_combo_items_tenant_isolation ON productos_combo_items
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS productos_combo_items_tenant_insert ON productos_combo_items;
CREATE POLICY productos_combo_items_tenant_insert ON productos_combo_items
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Políticas para grupos_modificadores
DROP POLICY IF EXISTS grupos_modificadores_tenant_isolation ON grupos_modificadores;
CREATE POLICY grupos_modificadores_tenant_isolation ON grupos_modificadores
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS grupos_modificadores_tenant_insert ON grupos_modificadores;
CREATE POLICY grupos_modificadores_tenant_insert ON grupos_modificadores
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Políticas para modificadores
DROP POLICY IF EXISTS modificadores_tenant_isolation ON modificadores;
CREATE POLICY modificadores_tenant_isolation ON modificadores
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS modificadores_tenant_insert ON modificadores;
CREATE POLICY modificadores_tenant_insert ON modificadores
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Políticas para productos_grupos_modificadores
DROP POLICY IF EXISTS productos_grupos_mod_tenant_isolation ON productos_grupos_modificadores;
CREATE POLICY productos_grupos_mod_tenant_isolation ON productos_grupos_modificadores
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS productos_grupos_mod_tenant_insert ON productos_grupos_modificadores;
CREATE POLICY productos_grupos_mod_tenant_insert ON productos_grupos_modificadores
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- Políticas para ventas_pos_items_modificadores
DROP POLICY IF EXISTS ventas_items_mod_tenant_isolation ON ventas_pos_items_modificadores;
CREATE POLICY ventas_items_mod_tenant_isolation ON ventas_pos_items_modificadores
    USING (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

DROP POLICY IF EXISTS ventas_items_mod_tenant_insert ON ventas_pos_items_modificadores;
CREATE POLICY ventas_items_mod_tenant_insert ON ventas_pos_items_modificadores
    FOR INSERT
    WITH CHECK (organizacion_id = current_setting('app.current_tenant_id', true)::INTEGER);

-- ============================================================================
-- FUNCIONES PARA COMBOS
-- ============================================================================

/**
 * Obtener componentes de un combo
 * @param p_producto_id ID del producto combo
 * @returns Tabla con componentes y sus precios
 */
CREATE OR REPLACE FUNCTION obtener_componentes_combo(
    p_producto_id INTEGER
)
RETURNS TABLE (
    item_id INTEGER,
    producto_id INTEGER,
    nombre VARCHAR,
    sku VARCHAR,
    cantidad INTEGER,
    precio_unitario DECIMAL,
    subtotal DECIMAL,
    stock_disponible INTEGER,
    imagen_url TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo_id INTEGER;
BEGIN
    -- Obtener ID del combo
    SELECT pc.id INTO v_combo_id
    FROM productos_combo pc
    WHERE pc.producto_id = p_producto_id
      AND pc.activo = TRUE;

    IF v_combo_id IS NULL THEN
        RETURN;
    END IF;

    -- Retornar componentes
    RETURN QUERY
    SELECT
        pci.id AS item_id,
        pci.producto_id,
        p.nombre,
        p.sku,
        pci.cantidad,
        COALESCE(pci.precio_unitario, p.precio_venta) AS precio_unitario,
        (pci.cantidad * COALESCE(pci.precio_unitario, p.precio_venta)) AS subtotal,
        COALESCE(p.stock_actual, 0) AS stock_disponible,
        p.imagen_url
    FROM productos_combo_items pci
    JOIN productos p ON p.id = pci.producto_id
    WHERE pci.combo_id = v_combo_id
    ORDER BY pci.orden, pci.id;
END;
$$;

/**
 * Calcular precio de un combo según su tipo
 * @param p_producto_id ID del producto combo
 * @returns Precio calculado del combo
 */
CREATE OR REPLACE FUNCTION calcular_precio_combo(
    p_producto_id INTEGER
)
RETURNS DECIMAL
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo RECORD;
    v_suma_componentes DECIMAL := 0;
    v_precio_final DECIMAL;
BEGIN
    -- Obtener configuración del combo
    SELECT pc.*, p.precio_venta AS precio_padre
    INTO v_combo
    FROM productos_combo pc
    JOIN productos p ON p.id = pc.producto_id
    WHERE pc.producto_id = p_producto_id
      AND pc.activo = TRUE;

    IF v_combo IS NULL THEN
        -- No es combo, retornar precio normal
        SELECT precio_venta INTO v_precio_final
        FROM productos WHERE id = p_producto_id;
        RETURN COALESCE(v_precio_final, 0);
    END IF;

    -- Calcular según tipo
    CASE v_combo.tipo_precio
        WHEN 'fijo' THEN
            v_precio_final := v_combo.precio_padre;

        WHEN 'suma_componentes' THEN
            SELECT COALESCE(SUM(subtotal), 0)
            INTO v_suma_componentes
            FROM obtener_componentes_combo(p_producto_id);
            v_precio_final := v_suma_componentes;

        WHEN 'descuento_porcentaje' THEN
            SELECT COALESCE(SUM(subtotal), 0)
            INTO v_suma_componentes
            FROM obtener_componentes_combo(p_producto_id);
            v_precio_final := v_suma_componentes * (1 - v_combo.descuento_porcentaje / 100);

        ELSE
            v_precio_final := v_combo.precio_padre;
    END CASE;

    RETURN ROUND(v_precio_final, 2);
END;
$$;

/**
 * Verificar stock de componentes de un combo
 * @param p_producto_id ID del producto combo
 * @param p_cantidad Cantidad de combos a verificar
 * @returns Tabla con validación por componente
 */
CREATE OR REPLACE FUNCTION verificar_stock_combo(
    p_producto_id INTEGER,
    p_cantidad INTEGER DEFAULT 1
)
RETURNS TABLE (
    producto_id INTEGER,
    nombre VARCHAR,
    cantidad_requerida INTEGER,
    stock_disponible INTEGER,
    tiene_stock BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        comp.producto_id,
        comp.nombre,
        (comp.cantidad * p_cantidad) AS cantidad_requerida,
        comp.stock_disponible,
        (comp.stock_disponible >= comp.cantidad * p_cantidad) AS tiene_stock
    FROM obtener_componentes_combo(p_producto_id) comp;
END;
$$;

/**
 * Descontar stock de componentes al vender un combo
 * @param p_producto_id ID del producto combo
 * @param p_cantidad Cantidad vendida
 * @param p_sucursal_id Sucursal donde descontar
 * @param p_venta_id ID de la venta para referencia
 */
CREATE OR REPLACE FUNCTION descontar_stock_combo(
    p_producto_id INTEGER,
    p_cantidad INTEGER,
    p_sucursal_id INTEGER,
    p_venta_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_combo RECORD;
    v_componente RECORD;
    v_org_id INTEGER;
BEGIN
    -- Obtener configuración del combo
    SELECT pc.*, p.organizacion_id
    INTO v_combo
    FROM productos_combo pc
    JOIN productos p ON p.id = pc.producto_id
    WHERE pc.producto_id = p_producto_id
      AND pc.activo = TRUE;

    IF v_combo IS NULL THEN
        RETURN FALSE;
    END IF;

    v_org_id := v_combo.organizacion_id;

    -- Solo descontar si el manejo es por componentes
    IF v_combo.manejo_stock = 'descontar_componentes' THEN
        -- Iterar componentes y descontar usando función consolidada
        FOR v_componente IN
            SELECT oc.*, p.precio_compra AS costo_unitario
            FROM obtener_componentes_combo(p_producto_id) oc
            JOIN productos p ON p.id = oc.producto_id
        LOOP
            -- Usar función consolidada para descontar stock de componente
            PERFORM registrar_movimiento_con_ubicacion(
                v_org_id,
                v_componente.producto_id,
                'salida_venta',
                -(v_componente.cantidad * p_cantidad),  -- Negativo = salida
                p_sucursal_id,
                NULL,  -- ubicacion_id
                NULL,  -- lote
                NULL,  -- fecha_vencimiento
                NULL,  -- referencia
                format('Componente de combo (venta POS %s)', COALESCE(p_venta_id::TEXT, 'N/A')),
                NULL,  -- usuario_id (no disponible en función SQL)
                COALESCE(v_componente.costo_unitario, 0),
                NULL,  -- proveedor_id
                p_venta_id,
                NULL,  -- cita_id
                NULL   -- variante_id
            );
        END LOOP;
    END IF;

    RETURN TRUE;
END;
$$;

-- ============================================================================
-- FUNCIONES PARA MODIFICADORES
-- ============================================================================

/**
 * Obtener grupos de modificadores para un producto
 * Considera asignación directa y por categoría
 * @param p_producto_id ID del producto
 * @returns Grupos de modificadores aplicables
 */
CREATE OR REPLACE FUNCTION obtener_modificadores_producto(
    p_producto_id INTEGER
)
RETURNS TABLE (
    grupo_id INTEGER,
    grupo_nombre VARCHAR,
    grupo_codigo VARCHAR,
    tipo_seleccion VARCHAR,
    requerido BOOLEAN,
    minimo_seleccion INTEGER,
    maximo_seleccion INTEGER,
    modificadores JSON
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_categoria_id INTEGER;
BEGIN
    -- Obtener categoría del producto
    SELECT categoria_id INTO v_categoria_id
    FROM productos WHERE id = p_producto_id;

    RETURN QUERY
    WITH grupos_aplicables AS (
        -- Grupos asignados directamente al producto
        SELECT
            pgm.grupo_id,
            pgm.requerido AS asignacion_requerido,
            pgm.orden,
            'producto' AS origen
        FROM productos_grupos_modificadores pgm
        WHERE pgm.producto_id = p_producto_id

        UNION

        -- Grupos asignados a la categoría del producto
        SELECT
            pgm.grupo_id,
            pgm.requerido AS asignacion_requerido,
            pgm.orden,
            'categoria' AS origen
        FROM productos_grupos_modificadores pgm
        WHERE pgm.categoria_id = v_categoria_id
          AND NOT EXISTS (
              -- Excluir si ya tiene asignación directa
              SELECT 1 FROM productos_grupos_modificadores p2
              WHERE p2.producto_id = p_producto_id
                AND p2.grupo_id = pgm.grupo_id
          )
    )
    SELECT
        gm.id AS grupo_id,
        gm.nombre AS grupo_nombre,
        gm.codigo AS grupo_codigo,
        gm.tipo_seleccion,
        COALESCE(ga.asignacion_requerido, gm.requerido) AS requerido,
        gm.minimo_seleccion,
        gm.maximo_seleccion,
        (
            SELECT JSON_AGG(
                JSON_BUILD_OBJECT(
                    'id', m.id,
                    'nombre', m.nombre,
                    'codigo', m.codigo,
                    'prefijo', m.prefijo,
                    'precio_adicional', m.precio_adicional,
                    'es_default', m.es_default
                )
                ORDER BY m.orden, m.id
            )
            FROM modificadores m
            WHERE m.grupo_id = gm.id
              AND m.activo = TRUE
        ) AS modificadores
    FROM grupos_aplicables ga
    JOIN grupos_modificadores gm ON gm.id = ga.grupo_id
    WHERE gm.activo = TRUE
    ORDER BY ga.orden, gm.orden, gm.id;
END;
$$;

/**
 * Verificar si un producto tiene modificadores
 * @param p_producto_id ID del producto
 * @returns TRUE si tiene modificadores configurados
 */
CREATE OR REPLACE FUNCTION producto_tiene_modificadores(
    p_producto_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_tiene BOOLEAN := FALSE;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM obtener_modificadores_producto(p_producto_id)
        LIMIT 1
    ) INTO v_tiene;

    RETURN v_tiene;
END;
$$;

/**
 * Verificar si un producto es combo
 * @param p_producto_id ID del producto
 * @returns TRUE si es combo activo
 */
CREATE OR REPLACE FUNCTION producto_es_combo(
    p_producto_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM productos_combo
        WHERE producto_id = p_producto_id
          AND activo = TRUE
    );
END;
$$;

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_combo_modificadores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_productos_combo_updated ON productos_combo;
CREATE TRIGGER trg_productos_combo_updated
    BEFORE UPDATE ON productos_combo
    FOR EACH ROW
    EXECUTE FUNCTION update_combo_modificadores_timestamp();

DROP TRIGGER IF EXISTS trg_grupos_modificadores_updated ON grupos_modificadores;
CREATE TRIGGER trg_grupos_modificadores_updated
    BEFORE UPDATE ON grupos_modificadores
    FOR EACH ROW
    EXECUTE FUNCTION update_combo_modificadores_timestamp();

DROP TRIGGER IF EXISTS trg_modificadores_updated ON modificadores;
CREATE TRIGGER trg_modificadores_updated
    BEFORE UPDATE ON modificadores
    FOR EACH ROW
    EXECUTE FUNCTION update_combo_modificadores_timestamp();

-- ============================================================================
-- PERMISOS A ROLES
-- ============================================================================

-- Permisos para saas_app
GRANT SELECT, INSERT, UPDATE, DELETE ON productos_combo TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON productos_combo_items TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON grupos_modificadores TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON modificadores TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON productos_grupos_modificadores TO saas_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON ventas_pos_items_modificadores TO saas_app;

GRANT USAGE, SELECT ON SEQUENCE productos_combo_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE productos_combo_items_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE grupos_modificadores_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE modificadores_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE productos_grupos_modificadores_id_seq TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE ventas_pos_items_modificadores_id_seq TO saas_app;

-- Permisos para funciones
GRANT EXECUTE ON FUNCTION obtener_componentes_combo(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION calcular_precio_combo(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION verificar_stock_combo(INTEGER, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION descontar_stock_combo(INTEGER, INTEGER, INTEGER, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_modificadores_producto(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION producto_tiene_modificadores(INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION producto_es_combo(INTEGER) TO saas_app;

-- ============================================================================
-- COMENTARIOS
-- ============================================================================

COMMENT ON TABLE productos_combo IS 'Configuración de productos tipo combo/paquete';
COMMENT ON TABLE productos_combo_items IS 'Componentes de cada combo';
COMMENT ON TABLE grupos_modificadores IS 'Grupos de modificadores (Tamaño, Extras, etc.)';
COMMENT ON TABLE modificadores IS 'Opciones de modificadores con precio adicional';
COMMENT ON TABLE productos_grupos_modificadores IS 'Asignación de grupos a productos/categorías';
COMMENT ON TABLE ventas_pos_items_modificadores IS 'Modificadores aplicados en ventas';

COMMENT ON FUNCTION obtener_componentes_combo IS 'Obtiene los componentes de un combo con precios';
COMMENT ON FUNCTION calcular_precio_combo IS 'Calcula el precio de un combo según su configuración';
COMMENT ON FUNCTION verificar_stock_combo IS 'Verifica disponibilidad de stock para vender un combo';
COMMENT ON FUNCTION descontar_stock_combo IS 'Descuenta stock de componentes al vender combo';
COMMENT ON FUNCTION obtener_modificadores_producto IS 'Obtiene grupos de modificadores aplicables a un producto';
COMMENT ON FUNCTION producto_tiene_modificadores IS 'Verifica si un producto tiene modificadores configurados';
COMMENT ON FUNCTION producto_es_combo IS 'Verifica si un producto es un combo';

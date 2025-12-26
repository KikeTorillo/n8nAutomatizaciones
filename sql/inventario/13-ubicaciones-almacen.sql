-- ============================================================================
-- MÓDULO: INVENTARIO - UBICACIONES DE ALMACÉN (WMS)
-- Descripción: Sistema de ubicaciones jerárquicas para gestión de almacén
-- Versión: 1.0
-- Fecha: 26 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: ubicaciones_almacen
-- Descripción: Ubicaciones jerárquicas: zona → pasillo → estante → bin
-- ============================================================================
CREATE TABLE IF NOT EXISTS ubicaciones_almacen (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- INFORMACIÓN BÁSICA
    codigo VARCHAR(30) NOT NULL,           -- Código único: "A-01-03-02" (Zona-Pasillo-Estante-Bin)
    nombre VARCHAR(100),                   -- Nombre descriptivo opcional
    descripcion TEXT,

    -- TIPO DE UBICACIÓN
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN (
        'zona',      -- Área grande del almacén (A, B, C...)
        'pasillo',   -- Pasillo dentro de zona
        'estante',   -- Estante/rack dentro de pasillo
        'bin'        -- Posición específica dentro de estante
    )),

    -- JERARQUÍA
    parent_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE CASCADE,
    nivel INTEGER NOT NULL DEFAULT 1,      -- 1=zona, 2=pasillo, 3=estante, 4=bin
    path_completo TEXT,                    -- Cache del path: "1/5/12/45"

    -- CAPACIDAD Y RESTRICCIONES
    capacidad_maxima INTEGER,              -- Unidades máximas que puede contener
    capacidad_ocupada INTEGER DEFAULT 0,   -- Unidades actualmente almacenadas
    peso_maximo_kg DECIMAL(10,2),          -- Peso máximo soportado
    volumen_m3 DECIMAL(10,4),              -- Volumen disponible

    -- PROPÓSITOS ESPECIALES
    es_picking BOOLEAN DEFAULT false,      -- Zona de picking (alta rotación)
    es_recepcion BOOLEAN DEFAULT false,    -- Zona de recepción de mercancía
    es_despacho BOOLEAN DEFAULT false,     -- Zona de despacho/envío
    es_cuarentena BOOLEAN DEFAULT false,   -- Zona de productos en cuarentena
    es_devolucion BOOLEAN DEFAULT false,   -- Zona de devoluciones

    -- CONDICIONES DE ALMACENAMIENTO
    temperatura_min DECIMAL(5,2),          -- Temperatura mínima requerida
    temperatura_max DECIMAL(5,2),          -- Temperatura máxima permitida
    humedad_controlada BOOLEAN DEFAULT false,

    -- ORDENAMIENTO Y PRESENTACIÓN
    orden INTEGER DEFAULT 0,               -- Para ordenar en UI
    color VARCHAR(7),                      -- Color hex para mapa visual
    icono VARCHAR(50),                     -- Icono para representar

    -- ESTADO
    activo BOOLEAN DEFAULT true,
    bloqueada BOOLEAN DEFAULT false,       -- Ubicación temporalmente bloqueada
    motivo_bloqueo TEXT,

    -- AUDITORÍA
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(sucursal_id, codigo),
    CHECK (nivel >= 1 AND nivel <= 4),
    CHECK (capacidad_ocupada >= 0),
    CHECK (capacidad_maxima IS NULL OR capacidad_ocupada <= capacidad_maxima),
    CHECK (temperatura_min IS NULL OR temperatura_max IS NULL OR temperatura_min <= temperatura_max),
    CHECK (color IS NULL OR color ~ '^#[0-9A-Fa-f]{6}$'),
    CHECK (parent_id IS NULL OR parent_id != id)
);

COMMENT ON TABLE ubicaciones_almacen IS 'Sistema de ubicaciones jerárquicas para gestión de almacén (WMS)';
COMMENT ON COLUMN ubicaciones_almacen.codigo IS 'Código único de ubicación, formato: ZONA-PASILLO-ESTANTE-BIN';
COMMENT ON COLUMN ubicaciones_almacen.tipo IS 'Nivel jerárquico: zona, pasillo, estante, bin';
COMMENT ON COLUMN ubicaciones_almacen.path_completo IS 'Cache del path de IDs para queries eficientes';
COMMENT ON COLUMN ubicaciones_almacen.es_picking IS 'Zona de alta rotación para picking rápido';
COMMENT ON COLUMN ubicaciones_almacen.es_cuarentena IS 'Zona para productos pendientes de inspección';

-- ============================================================================
-- ÍNDICES
-- ============================================================================

-- Índice principal para búsqueda por sucursal
CREATE INDEX IF NOT EXISTS idx_ubicaciones_sucursal
    ON ubicaciones_almacen(sucursal_id, activo);

-- Índice para jerarquía
CREATE INDEX IF NOT EXISTS idx_ubicaciones_parent
    ON ubicaciones_almacen(parent_id);

-- Índice para búsqueda por tipo
CREATE INDEX IF NOT EXISTS idx_ubicaciones_tipo
    ON ubicaciones_almacen(sucursal_id, tipo)
    WHERE activo = true;

-- Índice para ubicaciones especiales
CREATE INDEX IF NOT EXISTS idx_ubicaciones_especiales
    ON ubicaciones_almacen(sucursal_id)
    WHERE es_picking = true OR es_recepcion = true OR es_despacho = true;

-- Índice para path (búsqueda de descendientes)
CREATE INDEX IF NOT EXISTS idx_ubicaciones_path
    ON ubicaciones_almacen(path_completo text_pattern_ops);

-- Índice para organización (RLS)
CREATE INDEX IF NOT EXISTS idx_ubicaciones_org
    ON ubicaciones_almacen(organizacion_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE ubicaciones_almacen ENABLE ROW LEVEL SECURITY;
ALTER TABLE ubicaciones_almacen FORCE ROW LEVEL SECURITY;

-- Política SELECT
CREATE POLICY ubicaciones_almacen_select ON ubicaciones_almacen
    FOR SELECT
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política INSERT
CREATE POLICY ubicaciones_almacen_insert ON ubicaciones_almacen
    FOR INSERT
    WITH CHECK (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política UPDATE
CREATE POLICY ubicaciones_almacen_update ON ubicaciones_almacen
    FOR UPDATE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política DELETE
CREATE POLICY ubicaciones_almacen_delete ON ubicaciones_almacen
    FOR DELETE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCIÓN: actualizar_path_ubicacion
-- Descripción: Actualiza el path_completo al insertar/actualizar
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_path_ubicacion()
RETURNS TRIGGER AS $$
DECLARE
    v_parent_path TEXT;
BEGIN
    IF NEW.parent_id IS NULL THEN
        NEW.path_completo := NEW.id::TEXT;
        NEW.nivel := 1;
    ELSE
        SELECT path_completo, nivel INTO v_parent_path, NEW.nivel
        FROM ubicaciones_almacen
        WHERE id = NEW.parent_id;

        NEW.path_completo := v_parent_path || '/' || NEW.id::TEXT;
        NEW.nivel := NEW.nivel + 1;
    END IF;

    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar path
DROP TRIGGER IF EXISTS trg_ubicacion_path ON ubicaciones_almacen;
CREATE TRIGGER trg_ubicacion_path
    BEFORE INSERT OR UPDATE OF parent_id ON ubicaciones_almacen
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_path_ubicacion();

-- ============================================================================
-- FUNCIÓN: obtener_arbol_ubicaciones
-- Descripción: Obtiene el árbol completo de ubicaciones de una sucursal
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_arbol_ubicaciones(
    p_sucursal_id INTEGER
)
RETURNS TABLE (
    id INTEGER,
    codigo VARCHAR(30),
    nombre VARCHAR(100),
    tipo VARCHAR(20),
    parent_id INTEGER,
    nivel INTEGER,
    capacidad_maxima INTEGER,
    capacidad_ocupada INTEGER,
    es_picking BOOLEAN,
    es_recepcion BOOLEAN,
    es_despacho BOOLEAN,
    activo BOOLEAN,
    bloqueada BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    WITH RECURSIVE arbol AS (
        -- Nodos raíz (zonas)
        SELECT
            u.id, u.codigo, u.nombre, u.tipo, u.parent_id, u.nivel,
            u.capacidad_maxima, u.capacidad_ocupada,
            u.es_picking, u.es_recepcion, u.es_despacho,
            u.activo, u.bloqueada,
            u.orden
        FROM ubicaciones_almacen u
        WHERE u.sucursal_id = p_sucursal_id
        AND u.parent_id IS NULL

        UNION ALL

        -- Nodos hijos
        SELECT
            u.id, u.codigo, u.nombre, u.tipo, u.parent_id, u.nivel,
            u.capacidad_maxima, u.capacidad_ocupada,
            u.es_picking, u.es_recepcion, u.es_despacho,
            u.activo, u.bloqueada,
            u.orden
        FROM ubicaciones_almacen u
        INNER JOIN arbol a ON u.parent_id = a.id
    )
    SELECT
        arbol.id, arbol.codigo, arbol.nombre, arbol.tipo,
        arbol.parent_id, arbol.nivel,
        arbol.capacidad_maxima, arbol.capacidad_ocupada,
        arbol.es_picking, arbol.es_recepcion, arbol.es_despacho,
        arbol.activo, arbol.bloqueada
    FROM arbol
    ORDER BY arbol.nivel, arbol.orden, arbol.codigo;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_arbol_ubicaciones IS 'Obtiene árbol completo de ubicaciones de una sucursal usando CTE recursivo';

-- ============================================================================
-- FUNCIÓN: obtener_ubicaciones_disponibles
-- Descripción: Obtiene ubicaciones con capacidad disponible para un producto
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_ubicaciones_disponibles(
    p_sucursal_id INTEGER,
    p_cantidad_requerida INTEGER DEFAULT 1
)
RETURNS TABLE (
    id INTEGER,
    codigo VARCHAR(30),
    nombre VARCHAR(100),
    tipo VARCHAR(20),
    capacidad_disponible INTEGER,
    es_picking BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        u.id,
        u.codigo,
        u.nombre,
        u.tipo,
        (COALESCE(u.capacidad_maxima, 999999) - u.capacidad_ocupada) AS capacidad_disponible,
        u.es_picking
    FROM ubicaciones_almacen u
    WHERE u.sucursal_id = p_sucursal_id
    AND u.activo = true
    AND u.bloqueada = false
    AND u.tipo = 'bin'  -- Solo bins pueden almacenar productos
    AND (u.capacidad_maxima IS NULL OR u.capacidad_maxima - u.capacidad_ocupada >= p_cantidad_requerida)
    ORDER BY u.es_picking DESC, u.capacidad_ocupada ASC, u.codigo;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_ubicaciones_disponibles IS 'Lista ubicaciones con capacidad para almacenar productos';

-- ============================================================================
-- TABLA: stock_ubicaciones
-- Descripción: Stock de productos por ubicación específica
-- ============================================================================
CREATE TABLE IF NOT EXISTS stock_ubicaciones (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    ubicacion_id INTEGER NOT NULL REFERENCES ubicaciones_almacen(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- STOCK
    cantidad INTEGER NOT NULL DEFAULT 0 CHECK (cantidad >= 0),

    -- METADATA
    lote VARCHAR(50),                      -- Número de lote
    fecha_vencimiento DATE,                -- Fecha de vencimiento del lote
    fecha_entrada TIMESTAMPTZ DEFAULT NOW(), -- Cuándo entró a esta ubicación

    -- AUDITORÍA
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(ubicacion_id, producto_id, lote)
);

COMMENT ON TABLE stock_ubicaciones IS 'Stock de productos desglosado por ubicación física';
COMMENT ON COLUMN stock_ubicaciones.lote IS 'Permite tracking por lote en la misma ubicación';

-- Índices para stock_ubicaciones
CREATE INDEX IF NOT EXISTS idx_stock_ubicaciones_ubicacion
    ON stock_ubicaciones(ubicacion_id);

CREATE INDEX IF NOT EXISTS idx_stock_ubicaciones_producto
    ON stock_ubicaciones(producto_id);

CREATE INDEX IF NOT EXISTS idx_stock_ubicaciones_vencimiento
    ON stock_ubicaciones(fecha_vencimiento)
    WHERE fecha_vencimiento IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_stock_ubicaciones_org
    ON stock_ubicaciones(organizacion_id);

-- RLS para stock_ubicaciones
ALTER TABLE stock_ubicaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_ubicaciones FORCE ROW LEVEL SECURITY;

CREATE POLICY stock_ubicaciones_select ON stock_ubicaciones
    FOR SELECT
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY stock_ubicaciones_insert ON stock_ubicaciones
    FOR INSERT
    WITH CHECK (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY stock_ubicaciones_update ON stock_ubicaciones
    FOR UPDATE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY stock_ubicaciones_delete ON stock_ubicaciones
    FOR DELETE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCIÓN: mover_stock_ubicacion
-- Descripción: Mueve stock de una ubicación a otra
-- ============================================================================
CREATE OR REPLACE FUNCTION mover_stock_ubicacion(
    p_producto_id INTEGER,
    p_ubicacion_origen_id INTEGER,
    p_ubicacion_destino_id INTEGER,
    p_cantidad INTEGER,
    p_lote VARCHAR(50) DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_stock_origen INTEGER;
    v_organizacion_id INTEGER;
BEGIN
    -- Obtener organización
    SELECT organizacion_id INTO v_organizacion_id
    FROM ubicaciones_almacen WHERE id = p_ubicacion_origen_id;

    -- Verificar stock en origen
    SELECT cantidad INTO v_stock_origen
    FROM stock_ubicaciones
    WHERE ubicacion_id = p_ubicacion_origen_id
    AND producto_id = p_producto_id
    AND (lote = p_lote OR (lote IS NULL AND p_lote IS NULL));

    IF v_stock_origen IS NULL OR v_stock_origen < p_cantidad THEN
        RAISE EXCEPTION 'Stock insuficiente en ubicación origen. Disponible: %, Solicitado: %',
            COALESCE(v_stock_origen, 0), p_cantidad;
    END IF;

    -- Descontar de origen
    UPDATE stock_ubicaciones
    SET cantidad = cantidad - p_cantidad,
        actualizado_en = NOW()
    WHERE ubicacion_id = p_ubicacion_origen_id
    AND producto_id = p_producto_id
    AND (lote = p_lote OR (lote IS NULL AND p_lote IS NULL));

    -- Actualizar capacidad ocupada de origen
    UPDATE ubicaciones_almacen
    SET capacidad_ocupada = capacidad_ocupada - p_cantidad,
        actualizado_en = NOW()
    WHERE id = p_ubicacion_origen_id;

    -- Agregar a destino (INSERT o UPDATE)
    INSERT INTO stock_ubicaciones (
        organizacion_id, ubicacion_id, producto_id, cantidad, lote
    ) VALUES (
        v_organizacion_id, p_ubicacion_destino_id, p_producto_id, p_cantidad, p_lote
    )
    ON CONFLICT (ubicacion_id, producto_id, lote)
    DO UPDATE SET
        cantidad = stock_ubicaciones.cantidad + p_cantidad,
        actualizado_en = NOW();

    -- Actualizar capacidad ocupada de destino
    UPDATE ubicaciones_almacen
    SET capacidad_ocupada = capacidad_ocupada + p_cantidad,
        actualizado_en = NOW()
    WHERE id = p_ubicacion_destino_id;

    -- Limpiar registros con cantidad 0
    DELETE FROM stock_ubicaciones
    WHERE ubicacion_id = p_ubicacion_origen_id
    AND producto_id = p_producto_id
    AND cantidad = 0;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mover_stock_ubicacion IS 'Transfiere stock de un producto entre ubicaciones';

-- ============================================================================
-- FIN: UBICACIONES DE ALMACÉN
-- ============================================================================

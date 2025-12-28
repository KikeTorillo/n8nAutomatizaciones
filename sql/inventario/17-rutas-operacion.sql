-- ============================================================================
-- MODULO: INVENTARIO - RUTAS DE OPERACION
-- Descripcion: Configurar flujos de movimiento de productos
-- (compra, transferencia, dropship)
-- Version: 1.0
-- Fecha: 27 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: rutas_operacion
-- Descripcion: Catalogo de rutas disponibles en el sistema
-- ============================================================================
CREATE TABLE IF NOT EXISTS rutas_operacion (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Identificacion
    codigo VARCHAR(50) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Tipo de ruta
    tipo VARCHAR(30) NOT NULL CHECK (tipo IN (
        'compra',           -- Generar OC a proveedor
        'transferencia',    -- Transferir desde otra sucursal/almacen
        'dropship',         -- Proveedor envia directo al cliente
        'fabricacion'       -- Orden de produccion (futuro)
    )),

    -- Configuracion
    activo BOOLEAN DEFAULT true,
    es_default BOOLEAN DEFAULT false,  -- Ruta por defecto para su tipo
    prioridad INTEGER DEFAULT 0,        -- Menor = mayor prioridad

    -- Para tipo 'transferencia'
    sucursal_origen_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,

    -- Para tipo 'compra' o 'dropship'
    proveedor_default_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,

    -- Reglas de aplicacion (JSONB para flexibilidad)
    condiciones JSONB DEFAULT '{}',
    -- Ejemplo: {"min_cantidad": 10, "solo_sucursales": [1,2], "dias_semana": [1,2,3,4,5]}

    -- Tiempos estimados
    lead_time_dias INTEGER DEFAULT 1,   -- Tiempo estimado de la operacion

    -- Auditoria
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(organizacion_id, codigo)
);

COMMENT ON TABLE rutas_operacion IS 'Catalogo de rutas de operacion para movimientos de inventario';
COMMENT ON COLUMN rutas_operacion.tipo IS 'compra=OC, transferencia=entre sucursales, dropship=directo a cliente';
COMMENT ON COLUMN rutas_operacion.prioridad IS 'Menor numero = mayor prioridad al elegir ruta';

-- RLS
ALTER TABLE rutas_operacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY rutas_operacion_select ON rutas_operacion FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY rutas_operacion_insert ON rutas_operacion FOR INSERT WITH CHECK (true);

CREATE POLICY rutas_operacion_update ON rutas_operacion FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY rutas_operacion_delete ON rutas_operacion FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_rutas_operacion_org ON rutas_operacion(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_rutas_operacion_tipo ON rutas_operacion(tipo);
CREATE INDEX IF NOT EXISTS idx_rutas_operacion_activo ON rutas_operacion(activo) WHERE activo = true;

-- ============================================================================
-- TABLA: productos_rutas
-- Descripcion: Rutas habilitadas por producto
-- ============================================================================
CREATE TABLE IF NOT EXISTS productos_rutas (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    ruta_id INTEGER NOT NULL REFERENCES rutas_operacion(id) ON DELETE CASCADE,

    -- Configuracion especifica para este producto
    activo BOOLEAN DEFAULT true,
    prioridad INTEGER DEFAULT 0,  -- Override de prioridad para este producto
    es_preferida BOOLEAN DEFAULT false,  -- Ruta preferida para este producto

    -- Override de configuracion
    lead_time_override INTEGER,  -- Override del lead time de la ruta
    proveedor_override_id INTEGER REFERENCES proveedores(id) ON DELETE SET NULL,
    sucursal_origen_override_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,

    -- Auditoria
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(producto_id, ruta_id)
);

COMMENT ON TABLE productos_rutas IS 'Rutas habilitadas por producto con configuracion especifica';

-- RLS
ALTER TABLE productos_rutas ENABLE ROW LEVEL SECURITY;

CREATE POLICY productos_rutas_select ON productos_rutas FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY productos_rutas_insert ON productos_rutas FOR INSERT WITH CHECK (true);

CREATE POLICY productos_rutas_update ON productos_rutas FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY productos_rutas_delete ON productos_rutas FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_productos_rutas_producto ON productos_rutas(producto_id);
CREATE INDEX IF NOT EXISTS idx_productos_rutas_ruta ON productos_rutas(ruta_id);

-- ============================================================================
-- TABLA: reglas_reabastecimiento
-- Descripcion: Reglas avanzadas de cuando y como reabastecer
-- ============================================================================
CREATE TABLE IF NOT EXISTS reglas_reabastecimiento (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Aplicacion (producto, categoria o global)
    producto_id INTEGER REFERENCES productos(id) ON DELETE CASCADE,
    categoria_id INTEGER REFERENCES categorias_productos(id) ON DELETE CASCADE,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,
    -- Si todos son NULL, aplica globalmente

    -- Nombre descriptivo
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Ruta a usar
    ruta_id INTEGER NOT NULL REFERENCES rutas_operacion(id) ON DELETE CASCADE,

    -- Condiciones de activacion
    stock_minimo_trigger INTEGER NOT NULL DEFAULT 5,  -- Cuando stock <= este valor
    usar_stock_proyectado BOOLEAN DEFAULT true,        -- Usar stock proyectado vs actual

    -- Cantidad a ordenar
    cantidad_fija INTEGER,                    -- Cantidad fija a ordenar
    cantidad_hasta_maximo BOOLEAN DEFAULT false,  -- Ordenar hasta stock_maximo
    cantidad_formula VARCHAR(100),            -- Formula: 'stock_maximo - stock_actual' o 'demanda_30d * 1.5'

    -- Restricciones
    cantidad_minima INTEGER DEFAULT 1,
    cantidad_maxima INTEGER,
    multiplo_de INTEGER DEFAULT 1,            -- Ordenar en multiplos de X

    -- Programacion
    dias_semana INTEGER[] DEFAULT ARRAY[1,2,3,4,5],  -- 1=Lun, 7=Dom
    hora_ejecucion TIME DEFAULT '08:00:00',
    frecuencia_horas INTEGER DEFAULT 24,      -- Cada cuantas horas evaluar

    -- Estado
    activo BOOLEAN DEFAULT true,
    prioridad INTEGER DEFAULT 0,  -- Menor = mayor prioridad

    -- Estadisticas
    ultima_ejecucion TIMESTAMPTZ,
    total_ejecuciones INTEGER DEFAULT 0,
    total_ordenes_generadas INTEGER DEFAULT 0,

    -- Auditoria
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint: al menos uno debe ser NULL (no puede ser producto Y categoria)
    CHECK (
        (producto_id IS NULL AND categoria_id IS NULL) OR
        (producto_id IS NOT NULL AND categoria_id IS NULL) OR
        (producto_id IS NULL AND categoria_id IS NOT NULL)
    )
);

COMMENT ON TABLE reglas_reabastecimiento IS 'Reglas avanzadas para automatizar reabastecimiento de inventario';
COMMENT ON COLUMN reglas_reabastecimiento.dias_semana IS 'Array de dias: 1=Lunes, 7=Domingo';

-- RLS
ALTER TABLE reglas_reabastecimiento ENABLE ROW LEVEL SECURITY;

CREATE POLICY reglas_reabastecimiento_select ON reglas_reabastecimiento FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY reglas_reabastecimiento_insert ON reglas_reabastecimiento FOR INSERT WITH CHECK (true);

CREATE POLICY reglas_reabastecimiento_update ON reglas_reabastecimiento FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY reglas_reabastecimiento_delete ON reglas_reabastecimiento FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_reglas_reab_org ON reglas_reabastecimiento(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_reglas_reab_producto ON reglas_reabastecimiento(producto_id) WHERE producto_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reglas_reab_categoria ON reglas_reabastecimiento(categoria_id) WHERE categoria_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_reglas_reab_activo ON reglas_reabastecimiento(activo) WHERE activo = true;

-- ============================================================================
-- TABLA: solicitudes_transferencia
-- Descripcion: Solicitudes de transferencia entre sucursales
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitudes_transferencia (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Folio
    folio VARCHAR(50) NOT NULL,

    -- Sucursales
    sucursal_origen_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    sucursal_destino_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,

    -- Estado
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (estado IN (
        'borrador',           -- Creada pero no enviada
        'pendiente',          -- Enviada, esperando aprobacion
        'aprobada',           -- Aprobada por origen
        'en_transito',        -- Productos en camino
        'recibida_parcial',   -- Algunos productos recibidos
        'completada',         -- Todos los productos recibidos
        'rechazada',          -- Rechazada por origen
        'cancelada'           -- Cancelada
    )),

    -- Generada por regla?
    regla_reabastecimiento_id INTEGER REFERENCES reglas_reabastecimiento(id) ON DELETE SET NULL,
    generada_automaticamente BOOLEAN DEFAULT false,

    -- Fechas
    fecha_solicitud TIMESTAMPTZ DEFAULT NOW(),
    fecha_aprobacion TIMESTAMPTZ,
    fecha_envio TIMESTAMPTZ,
    fecha_recepcion TIMESTAMPTZ,
    fecha_estimada_llegada DATE,

    -- Usuarios
    solicitado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    aprobado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    enviado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    recibido_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- Notas
    notas TEXT,
    motivo_rechazo TEXT,

    -- Auditoria
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(organizacion_id, folio),
    CHECK (sucursal_origen_id != sucursal_destino_id)
);

COMMENT ON TABLE solicitudes_transferencia IS 'Solicitudes de transferencia de inventario entre sucursales';

-- RLS
ALTER TABLE solicitudes_transferencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY solicitudes_transferencia_select ON solicitudes_transferencia FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY solicitudes_transferencia_insert ON solicitudes_transferencia FOR INSERT WITH CHECK (true);

CREATE POLICY solicitudes_transferencia_update ON solicitudes_transferencia FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_sol_transf_org ON solicitudes_transferencia(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_sol_transf_estado ON solicitudes_transferencia(estado);
CREATE INDEX IF NOT EXISTS idx_sol_transf_origen ON solicitudes_transferencia(sucursal_origen_id);
CREATE INDEX IF NOT EXISTS idx_sol_transf_destino ON solicitudes_transferencia(sucursal_destino_id);

-- ============================================================================
-- TABLA: solicitudes_transferencia_items
-- Descripcion: Items de cada solicitud de transferencia
-- ============================================================================
CREATE TABLE IF NOT EXISTS solicitudes_transferencia_items (
    id SERIAL PRIMARY KEY,
    solicitud_id INTEGER NOT NULL REFERENCES solicitudes_transferencia(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,

    -- Cantidades
    cantidad_solicitada INTEGER NOT NULL CHECK (cantidad_solicitada > 0),
    cantidad_aprobada INTEGER DEFAULT 0,
    cantidad_enviada INTEGER DEFAULT 0,
    cantidad_recibida INTEGER DEFAULT 0,

    -- Estado del item
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',
        'aprobado',
        'parcial',
        'completado',
        'rechazado'
    )),

    -- Notas
    notas TEXT,
    motivo_rechazo TEXT,

    -- Auditoria
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    UNIQUE(solicitud_id, producto_id)
);

COMMENT ON TABLE solicitudes_transferencia_items IS 'Productos incluidos en cada solicitud de transferencia';

-- RLS via join con solicitud
ALTER TABLE solicitudes_transferencia_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY sol_transf_items_select ON solicitudes_transferencia_items FOR SELECT USING (
    solicitud_id IN (
        SELECT id FROM solicitudes_transferencia
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY sol_transf_items_insert ON solicitudes_transferencia_items FOR INSERT WITH CHECK (true);

CREATE POLICY sol_transf_items_update ON solicitudes_transferencia_items FOR UPDATE USING (
    solicitud_id IN (
        SELECT id FROM solicitudes_transferencia
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_sol_transf_items_solicitud ON solicitudes_transferencia_items(solicitud_id);
CREATE INDEX IF NOT EXISTS idx_sol_transf_items_producto ON solicitudes_transferencia_items(producto_id);

-- ============================================================================
-- FUNCION: determinar_ruta_reabastecimiento
-- Descripcion: Determina la mejor ruta para reabastecer un producto
-- ============================================================================
CREATE OR REPLACE FUNCTION determinar_ruta_reabastecimiento(
    p_producto_id INTEGER,
    p_sucursal_id INTEGER,
    p_organizacion_id INTEGER
)
RETURNS TABLE (
    ruta_id INTEGER,
    ruta_codigo VARCHAR(50),
    ruta_tipo VARCHAR(30),
    prioridad INTEGER,
    proveedor_id INTEGER,
    sucursal_origen_id INTEGER,
    lead_time_dias INTEGER,
    razon TEXT
) AS $$
BEGIN
    RETURN QUERY
    WITH rutas_disponibles AS (
        -- Rutas asignadas al producto
        SELECT
            r.id,
            r.codigo,
            r.tipo,
            COALESCE(pr.prioridad, r.prioridad) as prioridad_efectiva,
            COALESCE(pr.proveedor_override_id, r.proveedor_default_id) as proveedor_efectivo,
            COALESCE(pr.sucursal_origen_override_id, r.sucursal_origen_id) as sucursal_origen_efectiva,
            COALESCE(pr.lead_time_override, r.lead_time_dias) as lead_time_efectivo,
            CASE
                WHEN pr.es_preferida THEN 'Ruta preferida del producto'
                WHEN r.es_default THEN 'Ruta por defecto'
                ELSE 'Ruta disponible'
            END as razon
        FROM rutas_operacion r
        JOIN productos_rutas pr ON pr.ruta_id = r.id AND pr.producto_id = p_producto_id
        WHERE r.organizacion_id = p_organizacion_id
          AND r.activo = true
          AND pr.activo = true

        UNION ALL

        -- Rutas por defecto si el producto no tiene rutas especificas
        SELECT
            r.id,
            r.codigo,
            r.tipo,
            r.prioridad,
            r.proveedor_default_id,
            r.sucursal_origen_id,
            r.lead_time_dias,
            'Ruta por defecto del sistema'
        FROM rutas_operacion r
        WHERE r.organizacion_id = p_organizacion_id
          AND r.activo = true
          AND r.es_default = true
          AND NOT EXISTS (
              SELECT 1 FROM productos_rutas pr
              WHERE pr.producto_id = p_producto_id AND pr.activo = true
          )
    ),
    rutas_validas AS (
        SELECT rd.*
        FROM rutas_disponibles rd
        WHERE
            -- Validar que transferencia tiene stock en origen
            (rd.tipo != 'transferencia' OR EXISTS (
                SELECT 1 FROM productos p
                WHERE p.id = p_producto_id
                  AND p.stock_actual > 0
                  -- Aqui se podria agregar validacion de stock por sucursal
            ))
            -- Validar que compra tiene proveedor
            AND (rd.tipo NOT IN ('compra', 'dropship') OR rd.proveedor_efectivo IS NOT NULL)
    )
    SELECT
        rv.id,
        rv.codigo,
        rv.tipo,
        rv.prioridad_efectiva,
        rv.proveedor_efectivo,
        rv.sucursal_origen_efectiva,
        rv.lead_time_efectivo,
        rv.razon
    FROM rutas_validas rv
    ORDER BY rv.prioridad_efectiva ASC
    LIMIT 5;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION determinar_ruta_reabastecimiento IS 'Determina las mejores rutas para reabastecer un producto, ordenadas por prioridad';

-- ============================================================================
-- FUNCION: generar_folio_transferencia
-- Descripcion: Genera folio unico para solicitud de transferencia
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_transferencia(p_organizacion_id INTEGER)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_año VARCHAR(4);
    v_secuencia INTEGER;
    v_folio VARCHAR(50);
BEGIN
    v_año := TO_CHAR(NOW(), 'YYYY');

    SELECT COALESCE(MAX(
        CAST(SUBSTRING(folio FROM 'TR-' || v_año || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO v_secuencia
    FROM solicitudes_transferencia
    WHERE organizacion_id = p_organizacion_id
      AND folio LIKE 'TR-' || v_año || '-%';

    v_folio := 'TR-' || v_año || '-' || LPAD(v_secuencia::TEXT, 4, '0');

    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_folio_transferencia IS 'Genera folio secuencial para transferencias: TR-YYYY-0001';

-- ============================================================================
-- DATOS INICIALES: Rutas por defecto
-- ============================================================================
-- Se crean al crear organizacion, no aqui

-- ============================================================================
-- FIN: RUTAS DE OPERACION
-- ============================================================================

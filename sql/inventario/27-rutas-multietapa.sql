-- ============================================================================
-- MODULO: INVENTARIO - RUTAS MULTIETAPA
-- Descripcion: Sistema de operaciones multi-paso para almacen
-- (Pick -> Pack -> Ship, Recepcion -> QC -> Almacenamiento)
-- Version: 1.0
-- Fecha: 31 Diciembre 2025
-- ============================================================================

-- ============================================================================
-- TABLA: configuracion_almacen_sucursal
-- Descripcion: Configuracion de pasos de recepcion/envio por sucursal
-- ============================================================================
CREATE TABLE IF NOT EXISTS configuracion_almacen_sucursal (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- PASOS DE RECEPCION (1, 2 o 3)
    -- 1: Directo a stock
    -- 2: Recepcion -> Almacenamiento
    -- 3: Recepcion -> Control Calidad -> Almacenamiento
    pasos_recepcion INTEGER NOT NULL DEFAULT 1 CHECK (pasos_recepcion BETWEEN 1 AND 3),

    -- PASOS DE ENVIO (1, 2 o 3)
    -- 1: Directo desde stock
    -- 2: Picking -> Envio
    -- 3: Picking -> Empaque -> Envio
    pasos_envio INTEGER NOT NULL DEFAULT 1 CHECK (pasos_envio BETWEEN 1 AND 3),

    -- UBICACIONES POR DEFECTO
    ubicacion_recepcion_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_qc_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_stock_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_picking_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_empaque_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_envio_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,

    -- CONFIGURACION ADICIONAL
    generar_picking_automatico BOOLEAN DEFAULT true,  -- Generar picking al confirmar venta
    permitir_picking_parcial BOOLEAN DEFAULT true,    -- Permitir enviar cantidades parciales
    requiere_validacion_qc BOOLEAN DEFAULT false,     -- QC obligatorio aunque pasos_recepcion < 3

    -- ESTADO
    activo BOOLEAN DEFAULT true,

    -- AUDITORIA
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, sucursal_id)
);

COMMENT ON TABLE configuracion_almacen_sucursal IS 'Configuracion de rutas multi-paso por sucursal: pasos de recepcion y envio';
COMMENT ON COLUMN configuracion_almacen_sucursal.pasos_recepcion IS '1=Directo, 2=Recepcion+Almacenamiento, 3=Recepcion+QC+Almacenamiento';
COMMENT ON COLUMN configuracion_almacen_sucursal.pasos_envio IS '1=Directo, 2=Picking+Envio, 3=Picking+Empaque+Envio';

-- RLS
ALTER TABLE configuracion_almacen_sucursal ENABLE ROW LEVEL SECURITY;

CREATE POLICY config_almacen_select ON configuracion_almacen_sucursal FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY config_almacen_insert ON configuracion_almacen_sucursal FOR INSERT WITH CHECK (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY config_almacen_update ON configuracion_almacen_sucursal FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY config_almacen_delete ON configuracion_almacen_sucursal FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_config_almacen_org ON configuracion_almacen_sucursal(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_config_almacen_sucursal ON configuracion_almacen_sucursal(sucursal_id);

-- ============================================================================
-- TABLA: operaciones_almacen
-- Descripcion: Operaciones de almacen (recepciones, pickings, empaques, envios)
-- ============================================================================
CREATE TABLE IF NOT EXISTS operaciones_almacen (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- IDENTIFICACION
    folio VARCHAR(50) NOT NULL,
    nombre VARCHAR(100),

    -- TIPO DE OPERACION
    tipo_operacion VARCHAR(30) NOT NULL CHECK (tipo_operacion IN (
        'recepcion',          -- Recibir de proveedor/externa
        'control_calidad',    -- Inspeccion QC
        'almacenamiento',     -- Guardar en ubicacion final
        'picking',            -- Recoger para envio
        'empaque',            -- Empaquetar
        'envio',              -- Despachar al cliente
        'transferencia_interna'  -- Movimiento interno
    )),

    -- ESTADO
    estado VARCHAR(30) NOT NULL DEFAULT 'borrador' CHECK (estado IN (
        'borrador',       -- Creada pero no iniciada
        'asignada',       -- Asignada a operador
        'en_proceso',     -- En ejecucion
        'parcial',        -- Parcialmente completada
        'completada',     -- Totalmente completada
        'cancelada'       -- Cancelada
    )),

    -- ORIGEN (documento que genero esta operacion)
    origen_tipo VARCHAR(30) CHECK (origen_tipo IN (
        'orden_compra',
        'venta_pos',
        'solicitud_transferencia',
        'operacion',      -- Encadenamiento multi-step
        'manual'
    )),
    origen_id INTEGER,
    origen_folio VARCHAR(50),

    -- ENCADENAMIENTO MULTI-STEP
    operacion_padre_id INTEGER REFERENCES operaciones_almacen(id) ON DELETE SET NULL,
    operacion_siguiente_id INTEGER REFERENCES operaciones_almacen(id) ON DELETE SET NULL,
    secuencia_paso INTEGER DEFAULT 1,  -- Numero de paso en la cadena (1, 2, 3)
    total_pasos INTEGER DEFAULT 1,     -- Total de pasos en la cadena

    -- UBICACIONES
    ubicacion_origen_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_destino_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,

    -- ASIGNACION
    asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    prioridad INTEGER DEFAULT 5 CHECK (prioridad BETWEEN 1 AND 10),  -- 1=urgente, 5=normal, 10=baja

    -- FECHAS
    fecha_programada DATE,
    fecha_limite DATE,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,

    -- TOTALES (calculados, para performance)
    total_items INTEGER DEFAULT 0,
    total_procesados INTEGER DEFAULT 0,
    porcentaje_completado DECIMAL(5,2) DEFAULT 0,

    -- NOTAS
    notas TEXT,
    notas_internas TEXT,

    -- AUDITORIA
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE operaciones_almacen IS 'Operaciones de almacen: recepciones, pickings, empaques, envios. Soporta encadenamiento multi-step.';
COMMENT ON COLUMN operaciones_almacen.tipo_operacion IS 'Tipo de operacion: recepcion, qc, almacenamiento, picking, empaque, envio';
COMMENT ON COLUMN operaciones_almacen.operacion_padre_id IS 'Operacion anterior en cadena multi-step';
COMMENT ON COLUMN operaciones_almacen.operacion_siguiente_id IS 'Operacion siguiente en cadena multi-step';
COMMENT ON COLUMN operaciones_almacen.prioridad IS '1=Urgente, 5=Normal, 10=Baja';

-- RLS
ALTER TABLE operaciones_almacen ENABLE ROW LEVEL SECURITY;

CREATE POLICY operaciones_almacen_select ON operaciones_almacen FOR SELECT USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY operaciones_almacen_insert ON operaciones_almacen FOR INSERT WITH CHECK (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY operaciones_almacen_update ON operaciones_almacen FOR UPDATE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY operaciones_almacen_delete ON operaciones_almacen FOR DELETE USING (
    organizacion_id::text = current_setting('app.current_tenant_id', true)
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_operaciones_org ON operaciones_almacen(organizacion_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_sucursal ON operaciones_almacen(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_tipo ON operaciones_almacen(tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_operaciones_estado ON operaciones_almacen(estado);
CREATE INDEX IF NOT EXISTS idx_operaciones_asignado ON operaciones_almacen(asignado_a) WHERE asignado_a IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operaciones_origen ON operaciones_almacen(origen_tipo, origen_id);
CREATE INDEX IF NOT EXISTS idx_operaciones_padre ON operaciones_almacen(operacion_padre_id) WHERE operacion_padre_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_operaciones_fecha ON operaciones_almacen(fecha_programada) WHERE estado NOT IN ('completada', 'cancelada');
CREATE INDEX IF NOT EXISTS idx_operaciones_pendientes ON operaciones_almacen(sucursal_id, tipo_operacion, estado)
    WHERE estado IN ('borrador', 'asignada', 'en_proceso', 'parcial');

-- ============================================================================
-- TABLA: operaciones_almacen_items
-- Descripcion: Items de cada operacion de almacen
-- ============================================================================
CREATE TABLE IF NOT EXISTS operaciones_almacen_items (
    id SERIAL PRIMARY KEY,
    operacion_id INTEGER NOT NULL REFERENCES operaciones_almacen(id) ON DELETE CASCADE,

    -- PRODUCTO
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,
    variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,
    numero_serie_id INTEGER REFERENCES numeros_serie(id) ON DELETE SET NULL,

    -- CANTIDADES
    cantidad_demandada INTEGER NOT NULL CHECK (cantidad_demandada > 0),
    cantidad_procesada INTEGER NOT NULL DEFAULT 0 CHECK (cantidad_procesada >= 0),
    cantidad_pendiente INTEGER GENERATED ALWAYS AS (cantidad_demandada - cantidad_procesada) STORED,

    -- UBICACIONES ESPECIFICAS (override de la operacion)
    ubicacion_origen_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,
    ubicacion_destino_id INTEGER REFERENCES ubicaciones_almacen(id) ON DELETE SET NULL,

    -- LOTE/SERIE (para tracking)
    lote VARCHAR(50),
    fecha_vencimiento DATE,

    -- ESTADO DEL ITEM
    estado VARCHAR(20) NOT NULL DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',      -- No iniciado
        'en_proceso',     -- Parcialmente procesado
        'completado',     -- Totalmente procesado
        'cancelado'       -- Cancelado
    )),

    -- RESERVA ASOCIADA (para picking)
    reserva_stock_id INTEGER REFERENCES reservas_stock(id) ON DELETE SET NULL,

    -- ORIGEN (linea del documento origen)
    origen_item_id INTEGER,  -- ID del item en el documento origen (ej: orden_compra_items.id)

    -- NOTAS
    notas TEXT,

    -- AUDITORIA
    procesado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    procesado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    CHECK (cantidad_procesada <= cantidad_demandada)
);

COMMENT ON TABLE operaciones_almacen_items IS 'Lineas de detalle de cada operacion de almacen';
COMMENT ON COLUMN operaciones_almacen_items.cantidad_demandada IS 'Cantidad total a procesar';
COMMENT ON COLUMN operaciones_almacen_items.cantidad_procesada IS 'Cantidad ya procesada';
COMMENT ON COLUMN operaciones_almacen_items.cantidad_pendiente IS 'Cantidad restante (calculada)';

-- RLS via join con operacion
ALTER TABLE operaciones_almacen_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY op_items_select ON operaciones_almacen_items FOR SELECT USING (
    operacion_id IN (
        SELECT id FROM operaciones_almacen
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY op_items_insert ON operaciones_almacen_items FOR INSERT WITH CHECK (true);

CREATE POLICY op_items_update ON operaciones_almacen_items FOR UPDATE USING (
    operacion_id IN (
        SELECT id FROM operaciones_almacen
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

CREATE POLICY op_items_delete ON operaciones_almacen_items FOR DELETE USING (
    operacion_id IN (
        SELECT id FROM operaciones_almacen
        WHERE organizacion_id::text = current_setting('app.current_tenant_id', true)
    )
    OR current_setting('app.bypass_rls', true) = 'true'
);

-- Indices
CREATE INDEX IF NOT EXISTS idx_op_items_operacion ON operaciones_almacen_items(operacion_id);
CREATE INDEX IF NOT EXISTS idx_op_items_producto ON operaciones_almacen_items(producto_id);
CREATE INDEX IF NOT EXISTS idx_op_items_estado ON operaciones_almacen_items(estado);
CREATE INDEX IF NOT EXISTS idx_op_items_ns ON operaciones_almacen_items(numero_serie_id) WHERE numero_serie_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_op_items_pendientes ON operaciones_almacen_items(operacion_id)
    WHERE estado IN ('pendiente', 'en_proceso');

-- ============================================================================
-- FUNCION: generar_folio_operacion
-- Descripcion: Genera folio unico para operacion de almacen
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_operacion(
    p_organizacion_id INTEGER,
    p_tipo_operacion VARCHAR(30)
)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_prefijo VARCHAR(10);
    v_año VARCHAR(4);
    v_secuencia INTEGER;
    v_folio VARCHAR(50);
BEGIN
    -- Determinar prefijo segun tipo
    v_prefijo := CASE p_tipo_operacion
        WHEN 'recepcion' THEN 'REC'
        WHEN 'control_calidad' THEN 'QC'
        WHEN 'almacenamiento' THEN 'ALM'
        WHEN 'picking' THEN 'PICK'
        WHEN 'empaque' THEN 'PACK'
        WHEN 'envio' THEN 'ENV'
        WHEN 'transferencia_interna' THEN 'TI'
        ELSE 'OP'
    END;

    v_año := TO_CHAR(NOW(), 'YYYY');

    -- Obtener siguiente secuencia
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(folio FROM v_prefijo || '-' || v_año || '-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO v_secuencia
    FROM operaciones_almacen
    WHERE organizacion_id = p_organizacion_id
      AND folio LIKE v_prefijo || '-' || v_año || '-%';

    v_folio := v_prefijo || '-' || v_año || '-' || LPAD(v_secuencia::TEXT, 4, '0');

    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_folio_operacion IS 'Genera folio secuencial para operaciones: PICK-2025-0001, REC-2025-0001, etc.';

-- ============================================================================
-- FUNCION: actualizar_totales_operacion
-- Descripcion: Actualiza contadores de la operacion
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_totales_operacion()
RETURNS TRIGGER AS $$
DECLARE
    v_total_items INTEGER;
    v_total_procesados INTEGER;
    v_porcentaje DECIMAL(5,2);
BEGIN
    -- Calcular totales
    SELECT
        COUNT(*),
        COALESCE(SUM(CASE WHEN estado = 'completado' THEN 1 ELSE 0 END), 0)
    INTO v_total_items, v_total_procesados
    FROM operaciones_almacen_items
    WHERE operacion_id = COALESCE(NEW.operacion_id, OLD.operacion_id);

    -- Calcular porcentaje
    IF v_total_items > 0 THEN
        v_porcentaje := (v_total_procesados::DECIMAL / v_total_items) * 100;
    ELSE
        v_porcentaje := 0;
    END IF;

    -- Actualizar operacion
    UPDATE operaciones_almacen
    SET total_items = v_total_items,
        total_procesados = v_total_procesados,
        porcentaje_completado = v_porcentaje,
        actualizado_en = NOW()
    WHERE id = COALESCE(NEW.operacion_id, OLD.operacion_id);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar totales
DROP TRIGGER IF EXISTS trg_actualizar_totales_operacion ON operaciones_almacen_items;
CREATE TRIGGER trg_actualizar_totales_operacion
    AFTER INSERT OR UPDATE OR DELETE ON operaciones_almacen_items
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_operacion();

-- ============================================================================
-- FUNCION: obtener_configuracion_almacen
-- Descripcion: Obtiene configuracion de almacen para una sucursal (o crea default)
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_configuracion_almacen(
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER
)
RETURNS configuracion_almacen_sucursal AS $$
DECLARE
    v_config configuracion_almacen_sucursal;
BEGIN
    -- Buscar configuracion existente
    SELECT * INTO v_config
    FROM configuracion_almacen_sucursal
    WHERE organizacion_id = p_organizacion_id
      AND sucursal_id = p_sucursal_id;

    -- Si no existe, crear con valores por defecto
    IF v_config.id IS NULL THEN
        INSERT INTO configuracion_almacen_sucursal (
            organizacion_id,
            sucursal_id,
            pasos_recepcion,
            pasos_envio
        ) VALUES (
            p_organizacion_id,
            p_sucursal_id,
            1,  -- Directo
            1   -- Directo
        )
        RETURNING * INTO v_config;
    END IF;

    RETURN v_config;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION obtener_configuracion_almacen IS 'Obtiene o crea configuracion de almacen para una sucursal';

-- ============================================================================
-- FUNCION: crear_operaciones_recepcion
-- Descripcion: Crea cadena de operaciones para recibir mercancia de OC
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_operaciones_recepcion(
    p_orden_compra_id INTEGER,
    p_sucursal_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_config configuracion_almacen_sucursal;
    v_organizacion_id INTEGER;
    v_oc_folio VARCHAR(50);
    v_op_recepcion_id INTEGER;
    v_op_qc_id INTEGER;
    v_op_almacenamiento_id INTEGER;
    v_folio VARCHAR(50);
    v_item RECORD;
BEGIN
    -- Obtener datos de la OC
    SELECT organizacion_id, folio
    INTO v_organizacion_id, v_oc_folio
    FROM ordenes_compra
    WHERE id = p_orden_compra_id;

    IF v_organizacion_id IS NULL THEN
        RAISE EXCEPTION 'Orden de compra no encontrada: %', p_orden_compra_id;
    END IF;

    -- Obtener configuracion de almacen
    v_config := obtener_configuracion_almacen(v_organizacion_id, p_sucursal_id);

    -- Crear operacion de RECEPCION (siempre es la primera)
    v_folio := generar_folio_operacion(v_organizacion_id, 'recepcion');

    INSERT INTO operaciones_almacen (
        organizacion_id,
        sucursal_id,
        folio,
        nombre,
        tipo_operacion,
        estado,
        origen_tipo,
        origen_id,
        origen_folio,
        ubicacion_destino_id,
        secuencia_paso,
        total_pasos,
        creado_por
    ) VALUES (
        v_organizacion_id,
        p_sucursal_id,
        v_folio,
        'Recepcion ' || v_oc_folio,
        'recepcion',
        'borrador',
        'orden_compra',
        p_orden_compra_id,
        v_oc_folio,
        CASE
            WHEN v_config.pasos_recepcion = 1 THEN v_config.ubicacion_stock_id
            ELSE v_config.ubicacion_recepcion_id
        END,
        1,
        v_config.pasos_recepcion,
        p_usuario_id
    ) RETURNING id INTO v_op_recepcion_id;

    -- Insertar items desde OC
    FOR v_item IN
        SELECT oci.producto_id, oci.cantidad_ordenada, oci.id as item_id
        FROM ordenes_compra_items oci
        WHERE oci.orden_compra_id = p_orden_compra_id
    LOOP
        INSERT INTO operaciones_almacen_items (
            operacion_id,
            producto_id,
            cantidad_demandada,
            origen_item_id
        ) VALUES (
            v_op_recepcion_id,
            v_item.producto_id,
            v_item.cantidad_ordenada,
            v_item.item_id
        );
    END LOOP;

    -- Si pasos_recepcion >= 2, crear operacion de ALMACENAMIENTO
    IF v_config.pasos_recepcion >= 2 THEN
        v_folio := generar_folio_operacion(v_organizacion_id, 'almacenamiento');

        INSERT INTO operaciones_almacen (
            organizacion_id,
            sucursal_id,
            folio,
            nombre,
            tipo_operacion,
            estado,
            origen_tipo,
            origen_id,
            origen_folio,
            operacion_padre_id,
            ubicacion_origen_id,
            ubicacion_destino_id,
            secuencia_paso,
            total_pasos,
            creado_por
        ) VALUES (
            v_organizacion_id,
            p_sucursal_id,
            v_folio,
            'Almacenamiento ' || v_oc_folio,
            'almacenamiento',
            'borrador',
            'operacion',
            v_op_recepcion_id,
            (SELECT folio FROM operaciones_almacen WHERE id = v_op_recepcion_id),
            v_op_recepcion_id,
            v_config.ubicacion_recepcion_id,
            v_config.ubicacion_stock_id,
            CASE WHEN v_config.pasos_recepcion = 2 THEN 2 ELSE 3 END,
            v_config.pasos_recepcion,
            p_usuario_id
        ) RETURNING id INTO v_op_almacenamiento_id;

        -- Vincular operacion siguiente
        UPDATE operaciones_almacen
        SET operacion_siguiente_id = v_op_almacenamiento_id
        WHERE id = v_op_recepcion_id;
    END IF;

    -- Si pasos_recepcion = 3, crear operacion de CONTROL CALIDAD (entre recepcion y almacenamiento)
    IF v_config.pasos_recepcion = 3 THEN
        v_folio := generar_folio_operacion(v_organizacion_id, 'control_calidad');

        INSERT INTO operaciones_almacen (
            organizacion_id,
            sucursal_id,
            folio,
            nombre,
            tipo_operacion,
            estado,
            origen_tipo,
            origen_id,
            origen_folio,
            operacion_padre_id,
            operacion_siguiente_id,
            ubicacion_origen_id,
            ubicacion_destino_id,
            secuencia_paso,
            total_pasos,
            creado_por
        ) VALUES (
            v_organizacion_id,
            p_sucursal_id,
            v_folio,
            'Control Calidad ' || v_oc_folio,
            'control_calidad',
            'borrador',
            'operacion',
            v_op_recepcion_id,
            (SELECT folio FROM operaciones_almacen WHERE id = v_op_recepcion_id),
            v_op_recepcion_id,
            v_op_almacenamiento_id,
            v_config.ubicacion_recepcion_id,
            v_config.ubicacion_qc_id,
            2,
            v_config.pasos_recepcion,
            p_usuario_id
        ) RETURNING id INTO v_op_qc_id;

        -- Actualizar encadenamiento
        UPDATE operaciones_almacen
        SET operacion_siguiente_id = v_op_qc_id
        WHERE id = v_op_recepcion_id;

        UPDATE operaciones_almacen
        SET operacion_padre_id = v_op_qc_id,
            ubicacion_origen_id = v_config.ubicacion_qc_id
        WHERE id = v_op_almacenamiento_id;
    END IF;

    RETURN v_op_recepcion_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_operaciones_recepcion IS 'Crea cadena de operaciones para recibir mercancia segun config de almacen';

-- ============================================================================
-- FUNCION: crear_operaciones_envio
-- Descripcion: Crea cadena de operaciones para enviar (desde venta POS)
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_operaciones_envio(
    p_venta_pos_id INTEGER,
    p_sucursal_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_config configuracion_almacen_sucursal;
    v_organizacion_id INTEGER;
    v_venta_folio VARCHAR(50);
    v_op_picking_id INTEGER;
    v_op_empaque_id INTEGER;
    v_op_envio_id INTEGER;
    v_folio VARCHAR(50);
    v_item RECORD;
BEGIN
    -- Obtener datos de la venta
    SELECT organizacion_id, folio
    INTO v_organizacion_id, v_venta_folio
    FROM ventas_pos
    WHERE id = p_venta_pos_id;

    IF v_organizacion_id IS NULL THEN
        RAISE EXCEPTION 'Venta POS no encontrada: %', p_venta_pos_id;
    END IF;

    -- Obtener configuracion de almacen
    v_config := obtener_configuracion_almacen(v_organizacion_id, p_sucursal_id);

    -- Si pasos_envio = 1, no crear operaciones (envio directo)
    IF v_config.pasos_envio = 1 THEN
        RETURN NULL;
    END IF;

    -- Crear operacion de PICKING (siempre es la primera en envio multi-paso)
    v_folio := generar_folio_operacion(v_organizacion_id, 'picking');

    INSERT INTO operaciones_almacen (
        organizacion_id,
        sucursal_id,
        folio,
        nombre,
        tipo_operacion,
        estado,
        origen_tipo,
        origen_id,
        origen_folio,
        ubicacion_origen_id,
        ubicacion_destino_id,
        secuencia_paso,
        total_pasos,
        creado_por
    ) VALUES (
        v_organizacion_id,
        p_sucursal_id,
        v_folio,
        'Picking ' || v_venta_folio,
        'picking',
        'borrador',
        'venta_pos',
        p_venta_pos_id,
        v_venta_folio,
        v_config.ubicacion_stock_id,
        CASE
            WHEN v_config.pasos_envio = 2 THEN v_config.ubicacion_envio_id
            ELSE v_config.ubicacion_picking_id
        END,
        1,
        v_config.pasos_envio,
        p_usuario_id
    ) RETURNING id INTO v_op_picking_id;

    -- Insertar items desde venta
    FOR v_item IN
        SELECT vpi.producto_id, vpi.cantidad, vpi.variante_id, vpi.numero_serie_id, vpi.id as item_id
        FROM ventas_pos_items vpi
        WHERE vpi.venta_pos_id = p_venta_pos_id
    LOOP
        INSERT INTO operaciones_almacen_items (
            operacion_id,
            producto_id,
            variante_id,
            numero_serie_id,
            cantidad_demandada,
            origen_item_id
        ) VALUES (
            v_op_picking_id,
            v_item.producto_id,
            v_item.variante_id,
            v_item.numero_serie_id,
            v_item.cantidad,
            v_item.item_id
        );
    END LOOP;

    -- Si pasos_envio >= 2, crear operacion de ENVIO
    v_folio := generar_folio_operacion(v_organizacion_id, 'envio');

    INSERT INTO operaciones_almacen (
        organizacion_id,
        sucursal_id,
        folio,
        nombre,
        tipo_operacion,
        estado,
        origen_tipo,
        origen_id,
        origen_folio,
        operacion_padre_id,
        ubicacion_origen_id,
        secuencia_paso,
        total_pasos,
        creado_por
    ) VALUES (
        v_organizacion_id,
        p_sucursal_id,
        v_folio,
        'Envio ' || v_venta_folio,
        'envio',
        'borrador',
        'operacion',
        v_op_picking_id,
        (SELECT folio FROM operaciones_almacen WHERE id = v_op_picking_id),
        v_op_picking_id,
        CASE
            WHEN v_config.pasos_envio = 2 THEN v_config.ubicacion_envio_id
            ELSE v_config.ubicacion_empaque_id
        END,
        v_config.pasos_envio,
        v_config.pasos_envio,
        p_usuario_id
    ) RETURNING id INTO v_op_envio_id;

    -- Vincular operacion siguiente al picking
    UPDATE operaciones_almacen
    SET operacion_siguiente_id = v_op_envio_id
    WHERE id = v_op_picking_id;

    -- Si pasos_envio = 3, crear operacion de EMPAQUE (entre picking y envio)
    IF v_config.pasos_envio = 3 THEN
        v_folio := generar_folio_operacion(v_organizacion_id, 'empaque');

        INSERT INTO operaciones_almacen (
            organizacion_id,
            sucursal_id,
            folio,
            nombre,
            tipo_operacion,
            estado,
            origen_tipo,
            origen_id,
            origen_folio,
            operacion_padre_id,
            operacion_siguiente_id,
            ubicacion_origen_id,
            ubicacion_destino_id,
            secuencia_paso,
            total_pasos,
            creado_por
        ) VALUES (
            v_organizacion_id,
            p_sucursal_id,
            v_folio,
            'Empaque ' || v_venta_folio,
            'empaque',
            'borrador',
            'operacion',
            v_op_picking_id,
            (SELECT folio FROM operaciones_almacen WHERE id = v_op_picking_id),
            v_op_picking_id,
            v_op_envio_id,
            v_config.ubicacion_picking_id,
            v_config.ubicacion_empaque_id,
            2,
            v_config.pasos_envio,
            p_usuario_id
        ) RETURNING id INTO v_op_empaque_id;

        -- Actualizar encadenamiento
        UPDATE operaciones_almacen
        SET operacion_siguiente_id = v_op_empaque_id
        WHERE id = v_op_picking_id;

        UPDATE operaciones_almacen
        SET operacion_padre_id = v_op_empaque_id,
            ubicacion_origen_id = v_config.ubicacion_empaque_id
        WHERE id = v_op_envio_id;
    END IF;

    RETURN v_op_picking_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_operaciones_envio IS 'Crea cadena de operaciones para envio segun config de almacen';

-- ============================================================================
-- FUNCION: completar_operacion
-- Descripcion: Completa una operacion y prepara/activa la siguiente
-- ============================================================================
CREATE OR REPLACE FUNCTION completar_operacion(
    p_operacion_id INTEGER,
    p_items JSONB,  -- [{item_id, cantidad_procesada, ubicacion_destino_id}]
    p_usuario_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_operacion operaciones_almacen;
    v_item JSONB;
    v_item_id INTEGER;
    v_cantidad INTEGER;
    v_ubicacion_destino INTEGER;
    v_todos_completados BOOLEAN := true;
    v_siguiente_id INTEGER;
    v_resultado JSONB;
BEGIN
    -- Obtener operacion
    SELECT * INTO v_operacion
    FROM operaciones_almacen
    WHERE id = p_operacion_id;

    IF v_operacion.id IS NULL THEN
        RETURN jsonb_build_object('exito', false, 'error', 'Operacion no encontrada');
    END IF;

    IF v_operacion.estado IN ('completada', 'cancelada') THEN
        RETURN jsonb_build_object('exito', false, 'error', 'Operacion ya esta ' || v_operacion.estado);
    END IF;

    -- Procesar cada item
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_item_id := (v_item->>'item_id')::INTEGER;
        v_cantidad := (v_item->>'cantidad_procesada')::INTEGER;
        v_ubicacion_destino := (v_item->>'ubicacion_destino_id')::INTEGER;

        -- Actualizar item
        UPDATE operaciones_almacen_items
        SET cantidad_procesada = cantidad_procesada + v_cantidad,
            ubicacion_destino_id = COALESCE(v_ubicacion_destino, ubicacion_destino_id),
            estado = CASE
                WHEN cantidad_procesada + v_cantidad >= cantidad_demandada THEN 'completado'
                ELSE 'en_proceso'
            END,
            procesado_por = p_usuario_id,
            procesado_en = NOW(),
            actualizado_en = NOW()
        WHERE id = v_item_id;
    END LOOP;

    -- Verificar si todos los items estan completados
    SELECT NOT EXISTS (
        SELECT 1 FROM operaciones_almacen_items
        WHERE operacion_id = p_operacion_id
          AND estado != 'completado'
    ) INTO v_todos_completados;

    -- Actualizar estado de la operacion
    IF v_todos_completados THEN
        UPDATE operaciones_almacen
        SET estado = 'completada',
            fecha_fin = NOW(),
            actualizado_en = NOW()
        WHERE id = p_operacion_id;

        -- Si hay operacion siguiente, copiar items y activarla
        v_siguiente_id := v_operacion.operacion_siguiente_id;

        IF v_siguiente_id IS NOT NULL THEN
            -- Copiar items a la operacion siguiente
            INSERT INTO operaciones_almacen_items (
                operacion_id,
                producto_id,
                variante_id,
                numero_serie_id,
                cantidad_demandada,
                ubicacion_origen_id,
                lote,
                fecha_vencimiento,
                origen_item_id
            )
            SELECT
                v_siguiente_id,
                producto_id,
                variante_id,
                numero_serie_id,
                cantidad_procesada,  -- Solo la cantidad que se proceso
                ubicacion_destino_id,  -- El destino del anterior es el origen del siguiente
                lote,
                fecha_vencimiento,
                id  -- Referencia al item anterior
            FROM operaciones_almacen_items
            WHERE operacion_id = p_operacion_id
              AND cantidad_procesada > 0;

            -- Activar operacion siguiente
            UPDATE operaciones_almacen
            SET estado = 'borrador',
                actualizado_en = NOW()
            WHERE id = v_siguiente_id;
        END IF;
    ELSE
        UPDATE operaciones_almacen
        SET estado = 'parcial',
            actualizado_en = NOW()
        WHERE id = p_operacion_id;
    END IF;

    RETURN jsonb_build_object(
        'exito', true,
        'operacion_completada', v_todos_completados,
        'operacion_siguiente_id', v_operacion.operacion_siguiente_id,
        'mensaje', CASE
            WHEN v_todos_completados AND v_operacion.operacion_siguiente_id IS NOT NULL
                THEN 'Operacion completada. Siguiente paso disponible.'
            WHEN v_todos_completados
                THEN 'Operacion completada. Flujo finalizado.'
            ELSE 'Items procesados. Operacion parcialmente completada.'
        END
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION completar_operacion IS 'Procesa items de operacion y activa el siguiente paso si corresponde';

-- ============================================================================
-- FUNCION: obtener_cadena_operaciones
-- Descripcion: Obtiene la cadena completa de operaciones de un flujo
-- ============================================================================
CREATE OR REPLACE FUNCTION obtener_cadena_operaciones(p_operacion_id INTEGER)
RETURNS TABLE (
    id INTEGER,
    folio VARCHAR(50),
    tipo_operacion VARCHAR(30),
    estado VARCHAR(30),
    secuencia_paso INTEGER,
    total_items INTEGER,
    total_procesados INTEGER,
    porcentaje_completado DECIMAL(5,2),
    es_actual BOOLEAN
) AS $$
DECLARE
    v_raiz_id INTEGER;
BEGIN
    -- Encontrar la raiz de la cadena
    WITH RECURSIVE buscar_raiz AS (
        SELECT o.id, o.operacion_padre_id
        FROM operaciones_almacen o
        WHERE o.id = p_operacion_id

        UNION ALL

        SELECT o.id, o.operacion_padre_id
        FROM operaciones_almacen o
        JOIN buscar_raiz br ON o.id = br.operacion_padre_id
    )
    SELECT br.id INTO v_raiz_id
    FROM buscar_raiz br
    WHERE br.operacion_padre_id IS NULL;

    -- Obtener toda la cadena desde la raiz
    RETURN QUERY
    WITH RECURSIVE cadena AS (
        SELECT o.id, o.folio, o.tipo_operacion, o.estado,
               o.secuencia_paso, o.total_items, o.total_procesados,
               o.porcentaje_completado, o.operacion_siguiente_id
        FROM operaciones_almacen o
        WHERE o.id = v_raiz_id

        UNION ALL

        SELECT o.id, o.folio, o.tipo_operacion, o.estado,
               o.secuencia_paso, o.total_items, o.total_procesados,
               o.porcentaje_completado, o.operacion_siguiente_id
        FROM operaciones_almacen o
        JOIN cadena c ON o.id = c.operacion_siguiente_id
    )
    SELECT c.id, c.folio, c.tipo_operacion, c.estado,
           c.secuencia_paso, c.total_items, c.total_procesados,
           c.porcentaje_completado,
           (c.id = p_operacion_id) as es_actual
    FROM cadena c
    ORDER BY c.secuencia_paso;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_cadena_operaciones IS 'Obtiene la cadena completa de operaciones (multi-step) de un flujo';

-- ============================================================================
-- FUNCION: crear_ubicaciones_default_almacen
-- Descripcion: Crea ubicaciones por defecto para rutas multietapa
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_ubicaciones_default_almacen(
    p_organizacion_id INTEGER,
    p_sucursal_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS JSONB AS $$
DECLARE
    v_zona_id INTEGER;
    v_recepcion_id INTEGER;
    v_qc_id INTEGER;
    v_stock_id INTEGER;
    v_picking_id INTEGER;
    v_empaque_id INTEGER;
    v_envio_id INTEGER;
BEGIN
    -- Crear zona WMS si no existe
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS', 'Zona WMS', 'zona', p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET actualizado_en = NOW()
    RETURNING id INTO v_zona_id;

    -- Crear ubicacion de Recepcion
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, parent_id, es_recepcion, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS/REC', 'Recepcion', 'pasillo', v_zona_id, true, p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET es_recepcion = true, actualizado_en = NOW()
    RETURNING id INTO v_recepcion_id;

    -- Crear ubicacion de Control Calidad
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, parent_id, es_cuarentena, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS/QC', 'Control Calidad', 'pasillo', v_zona_id, true, p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET es_cuarentena = true, actualizado_en = NOW()
    RETURNING id INTO v_qc_id;

    -- Crear ubicacion de Stock
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, parent_id, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS/STK', 'Stock Principal', 'pasillo', v_zona_id, p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET actualizado_en = NOW()
    RETURNING id INTO v_stock_id;

    -- Crear ubicacion de Picking
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, parent_id, es_picking, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS/PICK', 'Picking', 'pasillo', v_zona_id, true, p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET es_picking = true, actualizado_en = NOW()
    RETURNING id INTO v_picking_id;

    -- Crear ubicacion de Empaque
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, parent_id, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS/PACK', 'Empaque', 'pasillo', v_zona_id, p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET actualizado_en = NOW()
    RETURNING id INTO v_empaque_id;

    -- Crear ubicacion de Envio/Despacho
    INSERT INTO ubicaciones_almacen (
        organizacion_id, sucursal_id, codigo, nombre, tipo, parent_id, es_despacho, creado_por
    ) VALUES (
        p_organizacion_id, p_sucursal_id, 'WMS/ENV', 'Envio/Despacho', 'pasillo', v_zona_id, true, p_usuario_id
    )
    ON CONFLICT (sucursal_id, codigo) DO UPDATE SET es_despacho = true, actualizado_en = NOW()
    RETURNING id INTO v_envio_id;

    -- Actualizar configuracion de almacen con las ubicaciones
    INSERT INTO configuracion_almacen_sucursal (
        organizacion_id,
        sucursal_id,
        ubicacion_recepcion_id,
        ubicacion_qc_id,
        ubicacion_stock_id,
        ubicacion_picking_id,
        ubicacion_empaque_id,
        ubicacion_envio_id,
        creado_por
    ) VALUES (
        p_organizacion_id,
        p_sucursal_id,
        v_recepcion_id,
        v_qc_id,
        v_stock_id,
        v_picking_id,
        v_empaque_id,
        v_envio_id,
        p_usuario_id
    )
    ON CONFLICT (organizacion_id, sucursal_id) DO UPDATE SET
        ubicacion_recepcion_id = v_recepcion_id,
        ubicacion_qc_id = v_qc_id,
        ubicacion_stock_id = v_stock_id,
        ubicacion_picking_id = v_picking_id,
        ubicacion_empaque_id = v_empaque_id,
        ubicacion_envio_id = v_envio_id,
        actualizado_en = NOW();

    RETURN jsonb_build_object(
        'exito', true,
        'ubicaciones', jsonb_build_object(
            'recepcion', v_recepcion_id,
            'qc', v_qc_id,
            'stock', v_stock_id,
            'picking', v_picking_id,
            'empaque', v_empaque_id,
            'envio', v_envio_id
        ),
        'mensaje', 'Ubicaciones WMS creadas correctamente'
    );
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_ubicaciones_default_almacen IS 'Crea ubicaciones por defecto para rutas multietapa (Recepcion, QC, Stock, Picking, Pack, Envio)';

-- ============================================================================
-- FIN: RUTAS MULTIETAPA
-- ============================================================================

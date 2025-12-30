-- ============================================================================
-- NEXO ERP: SISTEMA DE AJUSTES MASIVOS DE INVENTARIO
-- ============================================================================
-- Version: 1.0
-- Fecha: 29 Diciembre 2025
--
-- FUNCIONALIDADES:
-- 1. Importación de ajustes desde CSV parseado en frontend
-- 2. Validación de items (SKU/código barras → producto_id)
-- 3. Aplicación masiva de movimientos de inventario
-- 4. Flujo: pendiente → validado → aplicado | con_errores
-- ============================================================================

-- ============================================================================
-- TABLA: ajustes_masivos (cabecera)
-- Descripción: Registro de importaciones masivas de ajustes
-- ============================================================================
CREATE TABLE IF NOT EXISTS ajustes_masivos (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,

    -- FOLIO AUTOMATICO: AJM-YYYY-####
    folio VARCHAR(20) NOT NULL,

    -- ARCHIVO ORIGEN
    archivo_nombre VARCHAR(255) NOT NULL,

    -- ESTADO DEL AJUSTE
    estado VARCHAR(30) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',     -- Creado, items parseados
        'validado',      -- Items validados, listo para aplicar
        'aplicado',      -- Todos los ajustes aplicados
        'con_errores'    -- Aplicación parcial (algunos fallaron)
    )),

    -- CONTADORES (actualizados por trigger)
    total_filas INTEGER DEFAULT 0,
    filas_validas INTEGER DEFAULT 0,
    filas_error INTEGER DEFAULT 0,
    filas_aplicadas INTEGER DEFAULT 0,

    -- VALORES
    valor_total_ajuste DECIMAL(14,2) DEFAULT 0,

    -- RESPONSABLE
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- TIMESTAMPS
    validado_en TIMESTAMPTZ,
    aplicado_en TIMESTAMPTZ,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE ajustes_masivos IS 'Cabecera de importaciones masivas de ajustes de inventario';
COMMENT ON COLUMN ajustes_masivos.estado IS 'pendiente=parseado, validado=verificado, aplicado=completado, con_errores=parcial';
COMMENT ON COLUMN ajustes_masivos.valor_total_ajuste IS 'Suma de valor_ajuste de todos los items (puede ser negativo)';

-- ============================================================================
-- TABLA: ajustes_masivos_items (detalle)
-- Descripción: Items individuales del CSV con estado de procesamiento
-- ============================================================================
CREATE TABLE IF NOT EXISTS ajustes_masivos_items (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    ajuste_masivo_id INTEGER NOT NULL REFERENCES ajustes_masivos(id) ON DELETE CASCADE,
    fila_numero INTEGER NOT NULL,

    -- DATOS DEL CSV (raw, como llegaron)
    sku_csv VARCHAR(100),
    codigo_barras_csv VARCHAR(100),
    cantidad_csv VARCHAR(50),
    motivo_csv VARCHAR(500),

    -- DATOS RESUELTOS (después de validación)
    producto_id INTEGER REFERENCES productos(id) ON DELETE SET NULL,
    variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE SET NULL,
    producto_nombre VARCHAR(200),
    cantidad_ajuste INTEGER,

    -- SNAPSHOT DEL STOCK (al momento de validar)
    stock_antes INTEGER,
    stock_despues INTEGER,
    costo_unitario DECIMAL(10,2),
    valor_ajuste DECIMAL(12,2),

    -- ESTADO DEL ITEM
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',   -- Sin validar
        'valido',      -- Validado correctamente
        'error',       -- Error en validación
        'aplicado'     -- Movimiento creado
    )),

    -- ERRORES
    error_tipo VARCHAR(50),    -- producto_no_encontrado, cantidad_invalida, stock_insuficiente
    error_mensaje TEXT,

    -- REFERENCIA AL MOVIMIENTO CREADO
    movimiento_id INTEGER,
    aplicado_en TIMESTAMPTZ,

    -- TIMESTAMP
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE ajustes_masivos_items IS 'Detalle de items CSV con datos raw y resueltos';
COMMENT ON COLUMN ajustes_masivos_items.sku_csv IS 'SKU como llegó del CSV (puede ser producto o variante)';
COMMENT ON COLUMN ajustes_masivos_items.cantidad_ajuste IS 'Cantidad parseada (positivo=entrada, negativo=salida)';
COMMENT ON COLUMN ajustes_masivos_items.movimiento_id IS 'FK a movimientos_inventario cuando se aplica';

-- ============================================================================
-- INDICES
-- ============================================================================

-- Ajustes: búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_ajustes_masivos_org_estado
    ON ajustes_masivos(organizacion_id, estado);

CREATE INDEX IF NOT EXISTS idx_ajustes_masivos_org_fecha
    ON ajustes_masivos(organizacion_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_ajustes_masivos_folio
    ON ajustes_masivos(organizacion_id, folio);

CREATE INDEX IF NOT EXISTS idx_ajustes_masivos_pendientes
    ON ajustes_masivos(organizacion_id, creado_en DESC)
    WHERE estado IN ('pendiente', 'validado');

-- Items: búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_ajustes_items_ajuste
    ON ajustes_masivos_items(ajuste_masivo_id);

CREATE INDEX IF NOT EXISTS idx_ajustes_items_estado
    ON ajustes_masivos_items(ajuste_masivo_id, estado);

CREATE INDEX IF NOT EXISTS idx_ajustes_items_producto
    ON ajustes_masivos_items(producto_id)
    WHERE producto_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_ajustes_items_errores
    ON ajustes_masivos_items(ajuste_masivo_id)
    WHERE estado = 'error';

-- ============================================================================
-- RLS POLICIES - ajustes_masivos
-- ============================================================================

ALTER TABLE ajustes_masivos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_masivos FORCE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY ajustes_masivos_select_policy ON ajustes_masivos
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- INSERT
CREATE POLICY ajustes_masivos_insert_policy ON ajustes_masivos
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- UPDATE
CREATE POLICY ajustes_masivos_update_policy ON ajustes_masivos
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- DELETE
CREATE POLICY ajustes_masivos_delete_policy ON ajustes_masivos
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- RLS POLICIES - ajustes_masivos_items (via JOIN con cabecera)
-- ============================================================================

ALTER TABLE ajustes_masivos_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE ajustes_masivos_items FORCE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY ajustes_items_select_policy ON ajustes_masivos_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM ajustes_masivos a
            WHERE a.id = ajustes_masivos_items.ajuste_masivo_id
            AND a.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- INSERT
CREATE POLICY ajustes_items_insert_policy ON ajustes_masivos_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM ajustes_masivos a
            WHERE a.id = ajustes_masivos_items.ajuste_masivo_id
            AND a.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- UPDATE
CREATE POLICY ajustes_items_update_policy ON ajustes_masivos_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM ajustes_masivos a
            WHERE a.id = ajustes_masivos_items.ajuste_masivo_id
            AND a.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- DELETE
CREATE POLICY ajustes_items_delete_policy ON ajustes_masivos_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM ajustes_masivos a
            WHERE a.id = ajustes_masivos_items.ajuste_masivo_id
            AND a.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCION: Generar folio automático
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_ajuste_masivo(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_year VARCHAR(4);
    v_siguiente INTEGER;
    v_folio VARCHAR(20);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    -- Obtener siguiente número secuencial
    SELECT COALESCE(
        MAX(
            CAST(SUBSTRING(folio FROM 10 FOR 4) AS INTEGER)
        ), 0
    ) + 1 INTO v_siguiente
    FROM ajustes_masivos
    WHERE organizacion_id = p_organizacion_id
    AND folio LIKE 'AJM-' || v_year || '-%';

    -- Generar folio: AJM-2025-0001
    v_folio := 'AJM-' || v_year || '-' || LPAD(v_siguiente::TEXT, 4, '0');

    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_folio_ajuste_masivo IS 'Genera folio secuencial por organización y año: AJM-YYYY-####';

-- ============================================================================
-- TRIGGER: Generar folio automáticamente al insertar
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_generar_folio_ajuste_masivo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.folio IS NULL OR NEW.folio = '' THEN
        NEW.folio := generar_folio_ajuste_masivo(NEW.organizacion_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ajuste_masivo_generar_folio ON ajustes_masivos;
CREATE TRIGGER trg_ajuste_masivo_generar_folio
    BEFORE INSERT ON ajustes_masivos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_folio_ajuste_masivo();

-- ============================================================================
-- TRIGGER: Recalcular contadores del ajuste cuando cambian items
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_recalcular_totales_ajuste_masivo()
RETURNS TRIGGER AS $$
DECLARE
    v_ajuste_id INTEGER;
BEGIN
    -- Determinar ajuste_id según operación
    IF TG_OP = 'DELETE' THEN
        v_ajuste_id := OLD.ajuste_masivo_id;
    ELSE
        v_ajuste_id := NEW.ajuste_masivo_id;
    END IF;

    -- Recalcular totales
    UPDATE ajustes_masivos SET
        total_filas = (
            SELECT COUNT(*)
            FROM ajustes_masivos_items
            WHERE ajuste_masivo_id = v_ajuste_id
        ),
        filas_validas = (
            SELECT COUNT(*)
            FROM ajustes_masivos_items
            WHERE ajuste_masivo_id = v_ajuste_id
            AND estado IN ('valido', 'aplicado')
        ),
        filas_error = (
            SELECT COUNT(*)
            FROM ajustes_masivos_items
            WHERE ajuste_masivo_id = v_ajuste_id
            AND estado = 'error'
        ),
        filas_aplicadas = (
            SELECT COUNT(*)
            FROM ajustes_masivos_items
            WHERE ajuste_masivo_id = v_ajuste_id
            AND estado = 'aplicado'
        ),
        valor_total_ajuste = (
            SELECT COALESCE(SUM(valor_ajuste), 0)
            FROM ajustes_masivos_items
            WHERE ajuste_masivo_id = v_ajuste_id
            AND estado IN ('valido', 'aplicado')
        ),
        actualizado_en = NOW()
    WHERE id = v_ajuste_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ajuste_masivo_recalcular_totales ON ajustes_masivos_items;
CREATE TRIGGER trg_ajuste_masivo_recalcular_totales
    AFTER INSERT OR UPDATE OR DELETE ON ajustes_masivos_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_totales_ajuste_masivo();

-- ============================================================================
-- TRIGGER: Actualizar timestamp al modificar ajuste
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_ajuste_masivo_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ajuste_masivo_updated_at ON ajustes_masivos;
CREATE TRIGGER trg_ajuste_masivo_updated_at
    BEFORE UPDATE ON ajustes_masivos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_ajuste_masivo_actualizado_en();

-- ============================================================================
-- FUNCION: Buscar producto por SKU o código de barras
-- Busca primero en variantes, luego en productos
-- ============================================================================
CREATE OR REPLACE FUNCTION buscar_producto_por_codigo(
    p_organizacion_id INTEGER,
    p_sku VARCHAR(100),
    p_codigo_barras VARCHAR(100)
)
RETURNS TABLE (
    producto_id INTEGER,
    variante_id INTEGER,
    producto_nombre VARCHAR(200),
    stock_actual INTEGER,
    costo_unitario DECIMAL(10,2)
) AS $$
BEGIN
    -- Primero buscar en variantes por SKU
    IF p_sku IS NOT NULL AND p_sku != '' THEN
        RETURN QUERY
        SELECT
            v.producto_id::INTEGER,
            v.id::INTEGER AS variante_id,
            (p.nombre || ' - ' || COALESCE(v.nombre_variante, v.sku))::VARCHAR(200) AS producto_nombre,
            v.stock_actual::INTEGER,
            COALESCE(v.precio_compra, p.precio_compra)::DECIMAL(10,2) AS costo_unitario
        FROM variantes_producto v
        JOIN productos p ON p.id = v.producto_id
        WHERE p.organizacion_id = p_organizacion_id
          AND v.sku = p_sku
          AND v.activo = true
          AND p.activo = true
          AND p.eliminado_en IS NULL
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;

        -- Buscar en productos por SKU
        RETURN QUERY
        SELECT
            p.id::INTEGER AS producto_id,
            NULL::INTEGER AS variante_id,
            p.nombre::VARCHAR(200) AS producto_nombre,
            p.stock_actual::INTEGER,
            p.precio_compra::DECIMAL(10,2) AS costo_unitario
        FROM productos p
        WHERE p.organizacion_id = p_organizacion_id
          AND p.sku = p_sku
          AND p.activo = true
          AND p.eliminado_en IS NULL
          AND p.tiene_variantes = false
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;
    END IF;

    -- Buscar por código de barras en variantes
    IF p_codigo_barras IS NOT NULL AND p_codigo_barras != '' THEN
        RETURN QUERY
        SELECT
            v.producto_id::INTEGER,
            v.id::INTEGER AS variante_id,
            (p.nombre || ' - ' || COALESCE(v.nombre_variante, v.sku))::VARCHAR(200) AS producto_nombre,
            v.stock_actual::INTEGER,
            COALESCE(v.precio_compra, p.precio_compra)::DECIMAL(10,2) AS costo_unitario
        FROM variantes_producto v
        JOIN productos p ON p.id = v.producto_id
        WHERE p.organizacion_id = p_organizacion_id
          AND v.codigo_barras = p_codigo_barras
          AND v.activo = true
          AND p.activo = true
          AND p.eliminado_en IS NULL
        LIMIT 1;

        IF FOUND THEN RETURN; END IF;

        -- Buscar en productos por código de barras
        RETURN QUERY
        SELECT
            p.id::INTEGER AS producto_id,
            NULL::INTEGER AS variante_id,
            p.nombre::VARCHAR(200) AS producto_nombre,
            p.stock_actual::INTEGER,
            p.precio_compra::DECIMAL(10,2) AS costo_unitario
        FROM productos p
        WHERE p.organizacion_id = p_organizacion_id
          AND p.codigo_barras = p_codigo_barras
          AND p.activo = true
          AND p.eliminado_en IS NULL
          AND p.tiene_variantes = false
        LIMIT 1;
    END IF;

    -- No encontrado
    RETURN;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION buscar_producto_por_codigo IS 'Busca producto/variante por SKU o código de barras. Prioriza variantes.';

-- ============================================================================
-- VALIDACION
-- ============================================================================
DO $$
BEGIN
    -- Verificar tablas creadas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ajustes_masivos') THEN
        RAISE NOTICE '  Tabla ajustes_masivos creada correctamente';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'ajustes_masivos_items') THEN
        RAISE NOTICE '  Tabla ajustes_masivos_items creada correctamente';
    END IF;

    -- Verificar triggers
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ajuste_masivo_generar_folio') THEN
        RAISE NOTICE '  Trigger trg_ajuste_masivo_generar_folio configurado';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_ajuste_masivo_recalcular_totales') THEN
        RAISE NOTICE '  Trigger trg_ajuste_masivo_recalcular_totales configurado';
    END IF;

    -- Verificar función de búsqueda
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'buscar_producto_por_codigo') THEN
        RAISE NOTICE '  Funcion buscar_producto_por_codigo creada';
    END IF;

    RAISE NOTICE '  Sistema de Ajustes Masivos instalado correctamente';
END $$;

-- ============================================================================
-- FIN: SISTEMA DE AJUSTES MASIVOS
-- ============================================================================

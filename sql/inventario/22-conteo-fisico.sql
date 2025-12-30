-- ============================================================================
-- NEXO ERP: SISTEMA DE CONTEO FISICO / INVENTARIO CICLICO
-- ============================================================================
-- Version: 1.0
-- Fecha: 28 Diciembre 2025
--
-- FUNCIONALIDADES:
-- 1. Conteo total, por categoria, por ubicacion, ciclico, aleatorio
-- 2. Flujo: borrador -> en_proceso -> completado -> ajustado
-- 3. Soporte para variantes de producto
-- 4. Ajustes automaticos con movimientos de inventario
-- ============================================================================

-- ============================================================================
-- TABLA: conteos_inventario (cabecera)
-- Descripcion: Registro de conteos de inventario
-- ============================================================================
CREATE TABLE IF NOT EXISTS conteos_inventario (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE SET NULL,

    -- FOLIO AUTOMATICO: CON-YYYY-####
    folio VARCHAR(20) NOT NULL,

    -- TIPO DE CONTEO
    tipo_conteo VARCHAR(30) NOT NULL CHECK (tipo_conteo IN (
        'total',           -- Todos los productos
        'por_categoria',   -- Solo productos de una categoria
        'por_ubicacion',   -- Solo productos de una ubicacion (WMS)
        'ciclico',         -- Productos seleccionados (ABC)
        'aleatorio'        -- Muestra aleatoria
    )),

    -- FILTROS APLICADOS (JSON para flexibilidad)
    filtros JSONB DEFAULT '{}',
    -- Ejemplos:
    -- { "categoria_id": 5 }
    -- { "ubicacion_id": 12 }
    -- { "producto_ids": [1, 2, 3] }
    -- { "porcentaje_muestra": 20 }

    -- ESTADO DEL CONTEO
    estado VARCHAR(30) DEFAULT 'borrador' CHECK (estado IN (
        'borrador',       -- Creado, sin iniciar
        'en_proceso',     -- Conteo en curso
        'completado',     -- Conteo terminado, pendiente revision
        'ajustado',       -- Ajustes aplicados al inventario
        'cancelado'       -- Conteo cancelado
    )),

    -- RESPONSABLES
    usuario_creador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_contador_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_supervisor_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- FECHAS
    fecha_programada DATE,
    fecha_inicio TIMESTAMPTZ,
    fecha_fin TIMESTAMPTZ,
    fecha_ajuste TIMESTAMPTZ,

    -- TOTALES (calculados por trigger)
    total_productos INTEGER DEFAULT 0,
    total_contados INTEGER DEFAULT 0,
    total_con_diferencia INTEGER DEFAULT 0,
    valor_diferencia DECIMAL(12,2) DEFAULT 0,

    -- NOTAS
    notas TEXT,
    motivo_cancelacion TEXT,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- CONSTRAINTS
    UNIQUE(organizacion_id, folio)
);

COMMENT ON TABLE conteos_inventario IS 'Cabecera de conteos de inventario fisico con soporte multi-tipo';
COMMENT ON COLUMN conteos_inventario.tipo_conteo IS 'total=todos, por_categoria=filtrado, ciclico=ABC, aleatorio=muestra';
COMMENT ON COLUMN conteos_inventario.filtros IS 'Filtros aplicados en formato JSON segun tipo_conteo';
COMMENT ON COLUMN conteos_inventario.valor_diferencia IS 'Suma de diferencias valoradas (puede ser negativa)';

-- ============================================================================
-- TABLA: conteos_inventario_items (detalle)
-- Descripcion: Items individuales del conteo
-- ============================================================================
CREATE TABLE IF NOT EXISTS conteos_inventario_items (
    -- IDENTIFICACION
    id SERIAL PRIMARY KEY,
    conteo_id INTEGER NOT NULL REFERENCES conteos_inventario(id) ON DELETE CASCADE,

    -- PRODUCTO
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE CASCADE,
    ubicacion_id INTEGER REFERENCES stock_ubicaciones(id) ON DELETE SET NULL,

    -- CANTIDADES
    cantidad_sistema INTEGER NOT NULL,           -- Stock al momento de crear conteo
    cantidad_contada INTEGER,                     -- NULL = no contado aun

    -- DIFERENCIA (columna generada)
    diferencia INTEGER GENERATED ALWAYS AS (
        COALESCE(cantidad_contada, 0) - cantidad_sistema
    ) STORED,

    -- VALORACION
    costo_unitario DECIMAL(10,2),                -- Costo al momento del conteo

    -- VALOR DIFERENCIA (columna generada)
    valor_diferencia DECIMAL(12,2) GENERATED ALWAYS AS (
        (COALESCE(cantidad_contada, 0) - cantidad_sistema) * COALESCE(costo_unitario, 0)
    ) STORED,

    -- ESTADO DEL ITEM
    estado VARCHAR(20) DEFAULT 'pendiente' CHECK (estado IN (
        'pendiente',   -- Sin contar
        'contado',     -- Contado, con o sin diferencia
        'ajustado',    -- Ajuste aplicado
        'omitido'      -- Excluido del conteo
    )),

    -- METADATA CONTEO
    contado_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    contado_en TIMESTAMPTZ,

    -- PARA RECONTEOS
    cantidad_reconteo INTEGER,
    reconteo_por_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    reconteo_en TIMESTAMPTZ,

    -- NOTAS
    notas TEXT,

    -- AJUSTE GENERADO (sin FK formal por tabla particionada)
    movimiento_id INTEGER,

    -- TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE conteos_inventario_items IS 'Detalle de productos a contar con stock sistema vs contado';
COMMENT ON COLUMN conteos_inventario_items.cantidad_sistema IS 'Snapshot del stock al crear el conteo';
COMMENT ON COLUMN conteos_inventario_items.cantidad_contada IS 'Cantidad fisica encontrada (NULL=pendiente)';
COMMENT ON COLUMN conteos_inventario_items.diferencia IS 'Calculado: contada - sistema (positivo=sobrante, negativo=faltante)';
COMMENT ON COLUMN conteos_inventario_items.movimiento_id IS 'FK a movimientos_inventario cuando se aplica ajuste';

-- ============================================================================
-- INDICES
-- ============================================================================

-- Conteos: busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_conteos_org_estado
    ON conteos_inventario(organizacion_id, estado);

CREATE INDEX IF NOT EXISTS idx_conteos_org_fecha
    ON conteos_inventario(organizacion_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_conteos_sucursal
    ON conteos_inventario(sucursal_id)
    WHERE sucursal_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_conteos_folio
    ON conteos_inventario(organizacion_id, folio);

CREATE INDEX IF NOT EXISTS idx_conteos_pendientes
    ON conteos_inventario(organizacion_id, creado_en DESC)
    WHERE estado IN ('borrador', 'en_proceso', 'completado');

-- Items: busquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_conteos_items_conteo
    ON conteos_inventario_items(conteo_id);

CREATE INDEX IF NOT EXISTS idx_conteos_items_producto
    ON conteos_inventario_items(producto_id);

CREATE INDEX IF NOT EXISTS idx_conteos_items_estado
    ON conteos_inventario_items(conteo_id, estado);

CREATE INDEX IF NOT EXISTS idx_conteos_items_diferencia
    ON conteos_inventario_items(conteo_id)
    WHERE diferencia != 0;

CREATE INDEX IF NOT EXISTS idx_conteos_items_pendientes
    ON conteos_inventario_items(conteo_id)
    WHERE estado = 'pendiente';

-- Unique constraint via index (COALESCE not allowed in UNIQUE constraint)
CREATE UNIQUE INDEX IF NOT EXISTS idx_conteos_items_unique
    ON conteos_inventario_items(conteo_id, producto_id, COALESCE(variante_id, 0), COALESCE(ubicacion_id, 0));

-- ============================================================================
-- RLS POLICIES - conteos_inventario
-- ============================================================================

ALTER TABLE conteos_inventario ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteos_inventario FORCE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY conteos_inventario_select_policy ON conteos_inventario
    FOR SELECT
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- INSERT
CREATE POLICY conteos_inventario_insert_policy ON conteos_inventario
    FOR INSERT
    WITH CHECK (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- UPDATE
CREATE POLICY conteos_inventario_update_policy ON conteos_inventario
    FOR UPDATE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- DELETE
CREATE POLICY conteos_inventario_delete_policy ON conteos_inventario
    FOR DELETE
    USING (
        organizacion_id::text = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- RLS POLICIES - conteos_inventario_items (via JOIN con cabecera)
-- ============================================================================

ALTER TABLE conteos_inventario_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteos_inventario_items FORCE ROW LEVEL SECURITY;

-- SELECT
CREATE POLICY conteos_items_select_policy ON conteos_inventario_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM conteos_inventario c
            WHERE c.id = conteos_inventario_items.conteo_id
            AND c.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- INSERT
CREATE POLICY conteos_items_insert_policy ON conteos_inventario_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM conteos_inventario c
            WHERE c.id = conteos_inventario_items.conteo_id
            AND c.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- UPDATE
CREATE POLICY conteos_items_update_policy ON conteos_inventario_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM conteos_inventario c
            WHERE c.id = conteos_inventario_items.conteo_id
            AND c.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- DELETE
CREATE POLICY conteos_items_delete_policy ON conteos_inventario_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM conteos_inventario c
            WHERE c.id = conteos_inventario_items.conteo_id
            AND c.organizacion_id::text = current_setting('app.current_tenant_id', true)
        )
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCION: Generar folio automatico
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_folio_conteo(p_organizacion_id INTEGER)
RETURNS VARCHAR(20) AS $$
DECLARE
    v_year VARCHAR(4);
    v_siguiente INTEGER;
    v_folio VARCHAR(20);
BEGIN
    v_year := TO_CHAR(NOW(), 'YYYY');

    -- Obtener siguiente numero secuencial
    SELECT COALESCE(
        MAX(
            CAST(SUBSTRING(folio FROM 10 FOR 4) AS INTEGER)
        ), 0
    ) + 1 INTO v_siguiente
    FROM conteos_inventario
    WHERE organizacion_id = p_organizacion_id
    AND folio LIKE 'CON-' || v_year || '-%';

    -- Generar folio: CON-2025-0001
    v_folio := 'CON-' || v_year || '-' || LPAD(v_siguiente::TEXT, 4, '0');

    RETURN v_folio;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_folio_conteo IS 'Genera folio secuencial por organizacion y año: CON-YYYY-####';

-- ============================================================================
-- TRIGGER: Generar folio automaticamente al insertar
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_generar_folio_conteo()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.folio IS NULL OR NEW.folio = '' THEN
        NEW.folio := generar_folio_conteo(NEW.organizacion_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conteo_generar_folio ON conteos_inventario;
CREATE TRIGGER trg_conteo_generar_folio
    BEFORE INSERT ON conteos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_folio_conteo();

-- ============================================================================
-- TRIGGER: Recalcular totales del conteo cuando cambian items
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_recalcular_totales_conteo()
RETURNS TRIGGER AS $$
DECLARE
    v_conteo_id INTEGER;
BEGIN
    -- Determinar conteo_id segun operacion
    IF TG_OP = 'DELETE' THEN
        v_conteo_id := OLD.conteo_id;
    ELSE
        v_conteo_id := NEW.conteo_id;
    END IF;

    -- Recalcular totales
    UPDATE conteos_inventario SET
        total_productos = (
            SELECT COUNT(*)
            FROM conteos_inventario_items
            WHERE conteo_id = v_conteo_id
            AND estado != 'omitido'
        ),
        total_contados = (
            SELECT COUNT(*)
            FROM conteos_inventario_items
            WHERE conteo_id = v_conteo_id
            AND cantidad_contada IS NOT NULL
            AND estado != 'omitido'
        ),
        total_con_diferencia = (
            SELECT COUNT(*)
            FROM conteos_inventario_items
            WHERE conteo_id = v_conteo_id
            AND diferencia != 0
            AND estado != 'omitido'
        ),
        valor_diferencia = (
            SELECT COALESCE(SUM(valor_diferencia), 0)
            FROM conteos_inventario_items
            WHERE conteo_id = v_conteo_id
            AND estado != 'omitido'
        ),
        actualizado_en = NOW()
    WHERE id = v_conteo_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conteo_recalcular_totales ON conteos_inventario_items;
CREATE TRIGGER trg_conteo_recalcular_totales
    AFTER INSERT OR UPDATE OR DELETE ON conteos_inventario_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_recalcular_totales_conteo();

-- ============================================================================
-- TRIGGER: Actualizar timestamp al modificar conteo
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_conteo_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conteo_updated_at ON conteos_inventario;
CREATE TRIGGER trg_conteo_updated_at
    BEFORE UPDATE ON conteos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_conteo_actualizado_en();

-- ============================================================================
-- TRIGGER: Validar eliminacion solo en borrador
-- ============================================================================
CREATE OR REPLACE FUNCTION trigger_validar_eliminacion_conteo()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado != 'borrador' THEN
        RAISE EXCEPTION 'Solo se pueden eliminar conteos en estado borrador. Estado actual: %', OLD.estado;
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_conteo_validar_eliminacion ON conteos_inventario;
CREATE TRIGGER trg_conteo_validar_eliminacion
    BEFORE DELETE ON conteos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION trigger_validar_eliminacion_conteo();

-- ============================================================================
-- FUNCION: Generar items de conteo segun tipo y filtros
-- ============================================================================
CREATE OR REPLACE FUNCTION generar_items_conteo(
    p_conteo_id INTEGER,
    p_organizacion_id INTEGER,
    p_tipo_conteo VARCHAR(30),
    p_filtros JSONB DEFAULT '{}',
    p_sucursal_id INTEGER DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Insertar productos segun tipo de conteo
    INSERT INTO conteos_inventario_items (
        conteo_id,
        producto_id,
        variante_id,
        cantidad_sistema,
        costo_unitario
    )
    -- Productos SIN variantes
    SELECT
        p_conteo_id,
        p.id,
        NULL,
        p.stock_actual,
        COALESCE(p.precio_compra, 0)
    FROM productos p
    WHERE p.organizacion_id = p_organizacion_id
      AND p.activo = true
      AND p.eliminado_en IS NULL
      AND p.tiene_variantes = false
      -- Filtro por categoria
      AND (
          p_tipo_conteo != 'por_categoria'
          OR p.categoria_id = (p_filtros->>'categoria_id')::INTEGER
      )
      -- Filtro por productos especificos (ciclico)
      AND (
          p_tipo_conteo != 'ciclico'
          OR p.id = ANY(
              SELECT jsonb_array_elements_text(p_filtros->'producto_ids')::INTEGER
          )
      )
      -- Filtro por sucursal
      AND (
          p_sucursal_id IS NULL
          OR p.sucursal_id = p_sucursal_id
          OR p.sucursal_id IS NULL
      )

    UNION ALL

    -- Variantes de productos
    SELECT
        p_conteo_id,
        p.id,
        v.id,
        v.stock_actual,
        COALESCE(v.precio_compra, p.precio_compra, 0)
    FROM variantes_producto v
    JOIN productos p ON p.id = v.producto_id
    WHERE p.organizacion_id = p_organizacion_id
      AND p.activo = true
      AND p.eliminado_en IS NULL
      AND v.activo = true
      -- Filtro por categoria
      AND (
          p_tipo_conteo != 'por_categoria'
          OR p.categoria_id = (p_filtros->>'categoria_id')::INTEGER
      )
      -- Filtro por productos especificos (ciclico)
      AND (
          p_tipo_conteo != 'ciclico'
          OR p.id = ANY(
              SELECT jsonb_array_elements_text(p_filtros->'producto_ids')::INTEGER
          )
      )
      -- Filtro por sucursal
      AND (
          p_sucursal_id IS NULL
          OR p.sucursal_id = p_sucursal_id
          OR p.sucursal_id IS NULL
      );

    GET DIAGNOSTICS v_count = ROW_COUNT;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_items_conteo IS 'Genera items del conteo segun tipo y filtros. Retorna cantidad de items creados.';

-- ============================================================================
-- FUNCION: Obtener resumen de conteos por estado
-- ============================================================================
CREATE OR REPLACE FUNCTION resumen_conteos_inventario(p_organizacion_id INTEGER)
RETURNS TABLE (
    estado VARCHAR(30),
    cantidad BIGINT,
    valor_total DECIMAL(14,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.estado,
        COUNT(*)::BIGINT as cantidad,
        COALESCE(SUM(c.valor_diferencia), 0)::DECIMAL(14,2) as valor_total
    FROM conteos_inventario c
    WHERE c.organizacion_id = p_organizacion_id
    GROUP BY c.estado
    ORDER BY
        CASE c.estado
            WHEN 'en_proceso' THEN 1
            WHEN 'completado' THEN 2
            WHEN 'borrador' THEN 3
            WHEN 'ajustado' THEN 4
            WHEN 'cancelado' THEN 5
        END;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION resumen_conteos_inventario IS 'Retorna resumen de conteos agrupados por estado para dashboard';

-- ============================================================================
-- FUNCION: Actualizar totales de conteo manualmente
-- ============================================================================
CREATE OR REPLACE FUNCTION actualizar_totales_conteo(p_conteo_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- Recalcular totales del conteo
    UPDATE conteos_inventario SET
        total_productos = (
            SELECT COUNT(*)
            FROM conteos_inventario_items
            WHERE conteo_id = p_conteo_id
            AND estado != 'omitido'
        ),
        total_contados = (
            SELECT COUNT(*)
            FROM conteos_inventario_items
            WHERE conteo_id = p_conteo_id
            AND cantidad_contada IS NOT NULL
            AND estado != 'omitido'
        ),
        total_con_diferencia = (
            SELECT COUNT(*)
            FROM conteos_inventario_items
            WHERE conteo_id = p_conteo_id
            AND diferencia != 0
            AND estado != 'omitido'
        ),
        valor_diferencia = (
            SELECT COALESCE(SUM(valor_diferencia), 0)
            FROM conteos_inventario_items
            WHERE conteo_id = p_conteo_id
            AND estado != 'omitido'
        ),
        actualizado_en = NOW()
    WHERE id = p_conteo_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION actualizar_totales_conteo IS 'Recalcula manualmente los totales de un conteo especifico';

-- ============================================================================
-- FIX: Politicas RLS de variantes_producto para soportar bypass
-- Necesario para que los LEFT JOINs en conteos funcionen con withBypass()
-- ============================================================================
DROP POLICY IF EXISTS variantes_producto_select ON variantes_producto;
CREATE POLICY variantes_producto_select ON variantes_producto FOR SELECT
USING (
    (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::integer)
    OR (current_setting('app.current_user_role', true) = 'super_admin')
    OR (current_setting('app.bypass_rls', true) = 'true')
);

DROP POLICY IF EXISTS variantes_producto_insert ON variantes_producto;
CREATE POLICY variantes_producto_insert ON variantes_producto FOR INSERT
WITH CHECK (
    (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::integer)
    OR (current_setting('app.current_user_role', true) = 'super_admin')
    OR (current_setting('app.bypass_rls', true) = 'true')
);

DROP POLICY IF EXISTS variantes_producto_update ON variantes_producto;
CREATE POLICY variantes_producto_update ON variantes_producto FOR UPDATE
USING (
    (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::integer)
    OR (current_setting('app.current_user_role', true) = 'super_admin')
    OR (current_setting('app.bypass_rls', true) = 'true')
);

DROP POLICY IF EXISTS variantes_producto_delete ON variantes_producto;
CREATE POLICY variantes_producto_delete ON variantes_producto FOR DELETE
USING (
    (organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::integer)
    OR (current_setting('app.current_user_role', true) = 'super_admin')
    OR (current_setting('app.bypass_rls', true) = 'true')
);

-- ============================================================================
-- VALIDACION
-- ============================================================================
DO $$
BEGIN
    -- Verificar tablas creadas
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conteos_inventario') THEN
        RAISE NOTICE '  Tabla conteos_inventario creada correctamente';
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'conteos_inventario_items') THEN
        RAISE NOTICE '  Tabla conteos_inventario_items creada correctamente';
    END IF;

    -- Verificar triggers
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conteo_generar_folio') THEN
        RAISE NOTICE '  Trigger trg_conteo_generar_folio configurado';
    END IF;

    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_conteo_recalcular_totales') THEN
        RAISE NOTICE '  Trigger trg_conteo_recalcular_totales configurado';
    END IF;

    RAISE NOTICE '  Sistema de Conteo Fisico instalado correctamente';
END $$;

-- ============================================================================
-- FIN: SISTEMA DE CONTEO FISICO
-- ============================================================================

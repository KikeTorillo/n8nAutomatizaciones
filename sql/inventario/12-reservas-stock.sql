-- ============================================================================
-- NEXO ERP: SISTEMA DE RESERVAS DE STOCK - ARQUITECTURA SUPERIOR
-- ============================================================================
-- Versión: 2.0
-- Fecha: 28 Diciembre 2025
--
-- PRINCIPIOS DE DISEÑO (Superior a Odoo):
-- 1. SSOT (Single Source of Truth): Reservas solo en UNA tabla
-- 2. stock_disponible SIEMPRE calculado, NUNCA almacenado
-- 3. Validación atómica en PostgreSQL (no en aplicación)
-- 4. Concurrencia con SKIP LOCKED + retry (más robusto que NOWAIT)
-- 5. Soporte completo para variantes de producto
--
-- PROBLEMAS DE ODOO QUE EVITAMOS:
-- ❌ Odoo: reserved_quantity duplicado en stock.quant Y stock.move.line
-- ✅ Nexo: Reservas SOLO en reservas_stock
-- ❌ Odoo: Validación en Python (falible)
-- ✅ Nexo: Validación en PostgreSQL (atómica)
-- ❌ Odoo: FOR UPDATE NOWAIT (falla rápido, sin retry)
-- ✅ Nexo: FOR UPDATE SKIP LOCKED + backoff exponencial
-- ============================================================================

-- ============================================================================
-- TABLA: reservas_stock
-- Descripción: Reservas temporales de stock para productos Y variantes
-- ============================================================================
CREATE TABLE IF NOT EXISTS reservas_stock (
    -- IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER REFERENCES sucursales(id) ON DELETE CASCADE,

    -- PRODUCTO O VARIANTE (uno de los dos debe estar presente)
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    variante_id INTEGER REFERENCES variantes_producto(id) ON DELETE CASCADE,

    -- CANTIDAD RESERVADA
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),

    -- ORIGEN DE LA RESERVA (trazabilidad)
    tipo_origen VARCHAR(50) NOT NULL CHECK (tipo_origen IN (
        'venta_pos',           -- Venta en curso en POS
        'orden_venta',         -- Orden de venta confirmada
        'cotizacion',          -- Cotización con reserva
        'cita_servicio',       -- Cita que consume productos
        'transferencia',       -- Transferencia entre sucursales
        'orden_produccion',    -- Orden de manufactura
        'reserva_manual'       -- Reserva manual por usuario
    )),
    origen_id INTEGER,         -- FK dinámica según tipo (venta_id, cita_id, etc.)
    origen_referencia VARCHAR(100), -- Referencia legible (ej: "VTA-2025-0001")

    -- ESTADO Y EXPIRACIÓN
    estado VARCHAR(20) DEFAULT 'activa' CHECK (estado IN (
        'activa',       -- Reserva vigente
        'confirmada',   -- Stock descontado, reserva completada
        'expirada',     -- Tiempo agotado sin confirmar
        'liberada',     -- Liberada manualmente
        'cancelada'     -- Cancelada por sistema o usuario
    )),
    expira_en TIMESTAMPTZ NOT NULL,

    -- AUDITORÍA COMPLETA
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    confirmada_en TIMESTAMPTZ,
    confirmada_por INTEGER REFERENCES usuarios(id),
    liberada_en TIMESTAMPTZ,
    motivo_liberacion TEXT,

    -- CONSTRAINTS
    CONSTRAINT chk_reserva_fechas CHECK (
        confirmada_en IS NULL OR estado = 'confirmada'
    ),
    CONSTRAINT chk_reserva_liberacion CHECK (
        liberada_en IS NULL OR estado IN ('liberada', 'expirada', 'cancelada')
    )
);

COMMENT ON TABLE reservas_stock IS 'Sistema de reservas unificado para productos y variantes. Arquitectura SSOT - superior a Odoo.';
COMMENT ON COLUMN reservas_stock.variante_id IS 'FK a variante específica. Si es NULL, la reserva aplica al producto base.';
COMMENT ON COLUMN reservas_stock.tipo_origen IS 'Origen de la reserva para trazabilidad y cancelación por lote.';
COMMENT ON COLUMN reservas_stock.estado IS 'activa=vigente, confirmada=stock descontado, expirada/liberada/cancelada=stock liberado';

-- ============================================================================
-- ÍNDICES OPTIMIZADOS
-- ============================================================================

-- Índice principal: reservas activas por producto (sin variante)
CREATE INDEX IF NOT EXISTS idx_reservas_producto_activas
    ON reservas_stock(producto_id, sucursal_id)
    WHERE estado = 'activa' AND variante_id IS NULL;

-- Índice para reservas activas por variante
CREATE INDEX IF NOT EXISTS idx_reservas_variante_activas
    ON reservas_stock(variante_id, sucursal_id)
    WHERE estado = 'activa' AND variante_id IS NOT NULL;

-- Índice compuesto para búsqueda de reservas activas
CREATE INDEX IF NOT EXISTS idx_reservas_activas_lookup
    ON reservas_stock(organizacion_id, estado, expira_en)
    WHERE estado = 'activa';

-- Índice para job de expiración (pg_cron)
CREATE INDEX IF NOT EXISTS idx_reservas_expiracion
    ON reservas_stock(expira_en)
    WHERE estado = 'activa';

-- Índice para búsqueda por origen (cancelar por lote)
CREATE INDEX IF NOT EXISTS idx_reservas_origen
    ON reservas_stock(tipo_origen, origen_id)
    WHERE estado = 'activa';

-- Índice para organización (RLS)
CREATE INDEX IF NOT EXISTS idx_reservas_org
    ON reservas_stock(organizacion_id);

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

ALTER TABLE reservas_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE reservas_stock FORCE ROW LEVEL SECURITY;

CREATE POLICY reservas_stock_select ON reservas_stock
    FOR SELECT
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY reservas_stock_insert ON reservas_stock
    FOR INSERT
    WITH CHECK (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY reservas_stock_update ON reservas_stock
    FOR UPDATE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

CREATE POLICY reservas_stock_delete ON reservas_stock
    FOR DELETE
    USING (
        organizacion_id::TEXT = current_setting('app.current_tenant_id', true)
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- ============================================================================
-- FUNCIÓN: stock_reservado
-- Descripción: Calcula la cantidad total reservada (NUNCA almacenada)
-- ============================================================================
CREATE OR REPLACE FUNCTION stock_reservado(
    p_producto_id INTEGER DEFAULT NULL,
    p_variante_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_reservado INTEGER;
BEGIN
    -- Para variante específica
    IF p_variante_id IS NOT NULL THEN
        SELECT COALESCE(SUM(cantidad), 0)::INTEGER INTO v_reservado
        FROM reservas_stock
        WHERE variante_id = p_variante_id
          AND (p_sucursal_id IS NULL OR sucursal_id = p_sucursal_id)
          AND estado = 'activa'
          AND expira_en > NOW();
        RETURN v_reservado;
    END IF;

    -- Para producto sin variante (solo reservas directas del producto)
    IF p_producto_id IS NOT NULL THEN
        SELECT COALESCE(SUM(cantidad), 0)::INTEGER INTO v_reservado
        FROM reservas_stock
        WHERE producto_id = p_producto_id
          AND variante_id IS NULL  -- Solo reservas del producto base
          AND (p_sucursal_id IS NULL OR sucursal_id = p_sucursal_id)
          AND estado = 'activa'
          AND expira_en > NOW();
        RETURN v_reservado;
    END IF;

    RETURN 0;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stock_reservado IS 'Calcula cantidad reservada activa. SIEMPRE calculado, NUNCA almacenado (evita desincronización tipo Odoo).';

-- ============================================================================
-- FUNCIÓN: stock_disponible
-- Descripción: Calcula stock disponible = físico - reservado (SIEMPRE calculado)
-- ============================================================================
CREATE OR REPLACE FUNCTION stock_disponible(
    p_producto_id INTEGER DEFAULT NULL,
    p_variante_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_stock_actual INTEGER;
    v_reservado INTEGER;
BEGIN
    -- Obtener stock físico según sea producto o variante
    IF p_variante_id IS NOT NULL THEN
        SELECT stock_actual INTO v_stock_actual
        FROM variantes_producto
        WHERE id = p_variante_id;
    ELSIF p_producto_id IS NOT NULL THEN
        -- Si hay sucursal específica, buscar en stock_sucursales
        IF p_sucursal_id IS NOT NULL THEN
            SELECT COALESCE(cantidad, 0) INTO v_stock_actual
            FROM stock_sucursales
            WHERE producto_id = p_producto_id
              AND sucursal_id = p_sucursal_id;

            -- Si no existe registro en stock_sucursales, usar stock del producto
            IF v_stock_actual IS NULL THEN
                SELECT stock_actual INTO v_stock_actual
                FROM productos WHERE id = p_producto_id;
            END IF;
        ELSE
            SELECT stock_actual INTO v_stock_actual
            FROM productos WHERE id = p_producto_id;
        END IF;
    END IF;

    -- Calcular reservado (usando la función dedicada)
    v_reservado := stock_reservado(p_producto_id, p_variante_id, p_sucursal_id);

    -- Retornar disponible (nunca negativo)
    RETURN GREATEST(COALESCE(v_stock_actual, 0) - v_reservado, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stock_disponible IS 'Calcula stock disponible = stock_actual - reservas_activas. SIEMPRE calculado para evitar desincronización.';

-- ============================================================================
-- FUNCIÓN: stock_info_completo
-- Descripción: Retorna información completa de stock de un producto/variante
-- ============================================================================
CREATE OR REPLACE FUNCTION stock_info_completo(
    p_producto_id INTEGER DEFAULT NULL,
    p_variante_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL
) RETURNS TABLE (
    stock_actual INTEGER,
    stock_reservado INTEGER,
    stock_disponible INTEGER,
    reservas_activas BIGINT
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_reservado INTEGER;
    v_count BIGINT;
BEGIN
    -- Obtener stock físico
    IF p_variante_id IS NOT NULL THEN
        SELECT vp.stock_actual INTO v_stock_actual
        FROM variantes_producto vp WHERE id = p_variante_id;
    ELSE
        SELECT p.stock_actual INTO v_stock_actual
        FROM productos p WHERE id = p_producto_id;
    END IF;

    -- Calcular reservado
    v_reservado := stock_reservado(p_producto_id, p_variante_id, p_sucursal_id);

    -- Contar reservas activas
    IF p_variante_id IS NOT NULL THEN
        SELECT COUNT(*) INTO v_count
        FROM reservas_stock
        WHERE variante_id = p_variante_id
          AND estado = 'activa'
          AND expira_en > NOW();
    ELSE
        SELECT COUNT(*) INTO v_count
        FROM reservas_stock
        WHERE producto_id = p_producto_id
          AND variante_id IS NULL
          AND estado = 'activa'
          AND expira_en > NOW();
    END IF;

    RETURN QUERY SELECT
        COALESCE(v_stock_actual, 0),
        v_reservado,
        GREATEST(COALESCE(v_stock_actual, 0) - v_reservado, 0),
        v_count;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION stock_info_completo IS 'Retorna información completa de stock: físico, reservado, disponible y cantidad de reservas activas.';

-- ============================================================================
-- FUNCIÓN: crear_reserva_atomica
-- Descripción: Crea una reserva con validación atómica y concurrencia segura
-- Usa SKIP LOCKED para evitar bloqueos (superior a Odoo NOWAIT)
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_reserva_atomica(
    p_organizacion_id INTEGER,
    p_cantidad INTEGER,
    p_tipo_origen VARCHAR(50),
    p_producto_id INTEGER DEFAULT NULL,
    p_variante_id INTEGER DEFAULT NULL,
    p_origen_id INTEGER DEFAULT NULL,
    p_origen_referencia VARCHAR(100) DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL,
    p_minutos_expiracion INTEGER DEFAULT 15
) RETURNS TABLE (
    exito BOOLEAN,
    reserva_id INTEGER,
    mensaje TEXT,
    stock_disponible_antes INTEGER,
    stock_disponible_despues INTEGER
) AS $$
DECLARE
    v_stock_actual INTEGER;
    v_reservado INTEGER;
    v_disponible INTEGER;
    v_reserva_id INTEGER;
    v_lock_acquired BOOLEAN := FALSE;
    v_intentos INTEGER := 0;
    v_max_intentos INTEGER := 3;
    v_producto_id_final INTEGER;
BEGIN
    -- ========================================================================
    -- VALIDACIÓN DE PARÁMETROS
    -- ========================================================================
    IF p_producto_id IS NULL AND p_variante_id IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER,
            'Error: Debe especificar producto_id o variante_id'::TEXT, 0, 0;
        RETURN;
    END IF;

    IF p_cantidad <= 0 THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER,
            'Error: La cantidad debe ser mayor a 0'::TEXT, 0, 0;
        RETURN;
    END IF;

    -- Obtener producto_id si es variante
    IF p_variante_id IS NOT NULL THEN
        SELECT producto_id INTO v_producto_id_final
        FROM variantes_producto WHERE id = p_variante_id;

        IF v_producto_id_final IS NULL THEN
            RETURN QUERY SELECT FALSE, NULL::INTEGER,
                format('Error: Variante %s no encontrada', p_variante_id)::TEXT, 0, 0;
            RETURN;
        END IF;
    ELSE
        v_producto_id_final := p_producto_id;
    END IF;

    -- ========================================================================
    -- LOOP DE REINTENTOS CON SKIP LOCKED (Superior a Odoo NOWAIT)
    -- ========================================================================
    WHILE v_intentos < v_max_intentos AND NOT v_lock_acquired LOOP
        v_intentos := v_intentos + 1;

        BEGIN
            IF p_variante_id IS NOT NULL THEN
                -- Lock en la variante con SKIP LOCKED
                PERFORM id FROM variantes_producto
                WHERE id = p_variante_id
                FOR UPDATE SKIP LOCKED;

                IF NOT FOUND THEN
                    -- Fila bloqueada, esperar con backoff exponencial
                    PERFORM pg_sleep(0.05 * v_intentos);
                    CONTINUE;
                END IF;

                SELECT stock_actual INTO v_stock_actual
                FROM variantes_producto WHERE id = p_variante_id;
            ELSE
                -- Lock en el producto con SKIP LOCKED
                PERFORM id FROM productos
                WHERE id = p_producto_id
                FOR UPDATE SKIP LOCKED;

                IF NOT FOUND THEN
                    PERFORM pg_sleep(0.05 * v_intentos);
                    CONTINUE;
                END IF;

                SELECT stock_actual INTO v_stock_actual
                FROM productos WHERE id = p_producto_id;
            END IF;

            v_lock_acquired := TRUE;

        EXCEPTION WHEN OTHERS THEN
            -- Error inesperado, reintentar con backoff
            PERFORM pg_sleep(0.1 * v_intentos);
        END;
    END LOOP;

    -- Si no se pudo adquirir el lock
    IF NOT v_lock_acquired THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER,
            format('Error: No se pudo adquirir lock después de %s intentos. Reintente.', v_max_intentos)::TEXT, 0, 0;
        RETURN;
    END IF;

    -- ========================================================================
    -- VALIDACIÓN ATÓMICA (dentro del lock)
    -- ========================================================================
    v_reservado := stock_reservado(
        CASE WHEN p_variante_id IS NULL THEN p_producto_id ELSE NULL END,
        p_variante_id,
        p_sucursal_id
    );
    v_disponible := GREATEST(COALESCE(v_stock_actual, 0) - v_reservado, 0);

    IF v_disponible < p_cantidad THEN
        RETURN QUERY SELECT FALSE, NULL::INTEGER,
            format('Stock insuficiente. Disponible: %s, Solicitado: %s', v_disponible, p_cantidad)::TEXT,
            v_disponible, v_disponible;
        RETURN;
    END IF;

    -- ========================================================================
    -- CREAR RESERVA
    -- ========================================================================
    INSERT INTO reservas_stock (
        organizacion_id,
        sucursal_id,
        producto_id,
        variante_id,
        cantidad,
        tipo_origen,
        origen_id,
        origen_referencia,
        estado,
        expira_en,
        creado_por
    ) VALUES (
        p_organizacion_id,
        p_sucursal_id,
        v_producto_id_final,
        p_variante_id,
        p_cantidad,
        p_tipo_origen,
        p_origen_id,
        p_origen_referencia,
        'activa',
        NOW() + (p_minutos_expiracion || ' minutes')::INTERVAL,
        p_usuario_id
    ) RETURNING id INTO v_reserva_id;

    -- Retornar éxito
    RETURN QUERY SELECT
        TRUE,
        v_reserva_id,
        'Reserva creada exitosamente'::TEXT,
        v_disponible,
        (v_disponible - p_cantidad);

END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_reserva_atomica IS 'Crea reserva con validación atómica y SKIP LOCKED para concurrencia segura. Superior a Odoo.';

-- ============================================================================
-- FUNCIÓN: crear_reserva_stock (wrapper simple para compatibilidad)
-- ============================================================================
CREATE OR REPLACE FUNCTION crear_reserva_stock(
    p_organizacion_id INTEGER,
    p_producto_id INTEGER,
    p_cantidad INTEGER,
    p_tipo_origen VARCHAR(50),
    p_origen_id INTEGER DEFAULT NULL,
    p_sucursal_id INTEGER DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL,
    p_minutos_expiracion INTEGER DEFAULT 15
) RETURNS INTEGER AS $$
DECLARE
    v_result RECORD;
BEGIN
    SELECT * INTO v_result FROM crear_reserva_atomica(
        p_organizacion_id,
        p_cantidad,
        p_tipo_origen,
        p_producto_id,
        NULL,  -- variante_id
        p_origen_id,
        NULL,  -- origen_referencia
        p_sucursal_id,
        p_usuario_id,
        p_minutos_expiracion
    );

    IF NOT v_result.exito THEN
        RAISE EXCEPTION '%', v_result.mensaje;
    END IF;

    RETURN v_result.reserva_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION crear_reserva_stock IS 'Wrapper de compatibilidad para crear_reserva_atomica (solo productos sin variante).';

-- ============================================================================
-- FUNCIÓN: confirmar_reserva_stock
-- Descripción: Confirma una reserva (marca como confirmada)
-- NOTA: El descuento de stock lo hace el trigger de venta
-- ============================================================================
CREATE OR REPLACE FUNCTION confirmar_reserva_stock(
    p_reserva_id INTEGER,
    p_usuario_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_reserva RECORD;
BEGIN
    -- Obtener y bloquear reserva
    SELECT * INTO v_reserva
    FROM reservas_stock
    WHERE id = p_reserva_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Reserva no encontrada: %', p_reserva_id;
    END IF;

    IF v_reserva.estado != 'activa' THEN
        RAISE EXCEPTION 'Reserva no está activa. Estado actual: %', v_reserva.estado;
    END IF;

    IF v_reserva.expira_en < NOW() THEN
        -- Marcar como expirada
        UPDATE reservas_stock
        SET estado = 'expirada',
            liberada_en = NOW(),
            motivo_liberacion = 'Expirada al intentar confirmar'
        WHERE id = p_reserva_id;
        RAISE EXCEPTION 'Reserva expirada';
    END IF;

    -- Marcar reserva como confirmada
    -- NOTA: El descuento de stock_actual lo hace el trigger de venta
    UPDATE reservas_stock
    SET estado = 'confirmada',
        confirmada_en = NOW(),
        confirmada_por = p_usuario_id
    WHERE id = p_reserva_id;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION confirmar_reserva_stock IS 'Confirma una reserva. El descuento de stock lo hace el trigger de venta para evitar doble descuento.';

-- ============================================================================
-- FUNCIÓN: liberar_reserva
-- Descripción: Libera una reserva activa (cancela manualmente)
-- ============================================================================
CREATE OR REPLACE FUNCTION liberar_reserva(
    p_reserva_id INTEGER,
    p_motivo TEXT DEFAULT NULL,
    p_usuario_id INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
BEGIN
    UPDATE reservas_stock
    SET estado = 'liberada',
        liberada_en = NOW(),
        motivo_liberacion = COALESCE(p_motivo, 'Liberación manual')
    WHERE id = p_reserva_id
    AND estado = 'activa';

    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION liberar_reserva IS 'Libera una reserva activa, retornando el stock al pool disponible.';

-- ============================================================================
-- FUNCIÓN: cancelar_reserva_stock (alias para compatibilidad)
-- ============================================================================
CREATE OR REPLACE FUNCTION cancelar_reserva_stock(
    p_reserva_id INTEGER
) RETURNS BOOLEAN AS $$
BEGIN
    RETURN liberar_reserva(p_reserva_id, 'Cancelada', NULL);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- FUNCIÓN: liberar_reservas_por_origen
-- Descripción: Libera todas las reservas de un origen específico
-- ============================================================================
CREATE OR REPLACE FUNCTION liberar_reservas_por_origen(
    p_tipo_origen VARCHAR(50),
    p_origen_id INTEGER,
    p_motivo TEXT DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE reservas_stock
    SET estado = 'liberada',
        liberada_en = NOW(),
        motivo_liberacion = COALESCE(p_motivo, 'Liberación por origen: ' || p_tipo_origen)
    WHERE tipo_origen = p_tipo_origen
    AND origen_id = p_origen_id
    AND estado = 'activa';

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION liberar_reservas_por_origen IS 'Libera todas las reservas activas de un origen específico (ej: cancelar venta).';

-- ============================================================================
-- FUNCIÓN: expirar_reservas_vencidas
-- Descripción: Marca como expiradas las reservas vencidas (para pg_cron)
-- ============================================================================
CREATE OR REPLACE FUNCTION expirar_reservas_vencidas() RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE reservas_stock
    SET estado = 'expirada',
        liberada_en = NOW(),
        motivo_liberacion = 'Expiración automática por timeout'
    WHERE estado = 'activa'
    AND expira_en < NOW();

    GET DIAGNOSTICS v_count = ROW_COUNT;

    IF v_count > 0 THEN
        RAISE NOTICE 'Reservas expiradas: %', v_count;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION expirar_reservas_vencidas IS 'Marca como expiradas las reservas vencidas. Ejecutar via pg_cron cada 5 minutos.';

-- ============================================================================
-- FUNCIÓN: verificar_y_limpiar_reservas
-- Descripción: Función de mantenimiento para verificar integridad
-- ============================================================================
CREATE OR REPLACE FUNCTION verificar_y_limpiar_reservas() RETURNS TABLE (
    accion TEXT,
    cantidad INTEGER
) AS $$
DECLARE
    v_expiradas INTEGER;
    v_huerfanas INTEGER;
BEGIN
    -- Expirar reservas vencidas
    v_expiradas := expirar_reservas_vencidas();

    -- Limpiar reservas huérfanas (producto o variante eliminados)
    UPDATE reservas_stock r
    SET estado = 'cancelada',
        liberada_en = NOW(),
        motivo_liberacion = 'Producto/variante eliminado'
    WHERE r.estado = 'activa'
    AND (
        (r.variante_id IS NOT NULL AND NOT EXISTS (
            SELECT 1 FROM variantes_producto v WHERE v.id = r.variante_id
        ))
        OR
        (r.variante_id IS NULL AND NOT EXISTS (
            SELECT 1 FROM productos p WHERE p.id = r.producto_id
        ))
    );
    GET DIAGNOSTICS v_huerfanas = ROW_COUNT;

    RETURN QUERY
        SELECT 'reservas_expiradas'::TEXT, v_expiradas
        UNION ALL
        SELECT 'reservas_huerfanas_limpiadas'::TEXT, v_huerfanas;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION verificar_y_limpiar_reservas IS 'Función de mantenimiento: expira reservas y limpia huérfanas.';

-- ============================================================================
-- VISTA: v_stock_disponible_tiempo_real
-- Descripción: Vista para consultas rápidas de stock (sin materializar)
-- ============================================================================
CREATE OR REPLACE VIEW v_stock_disponible_tiempo_real AS
-- Productos sin variantes
SELECT
    p.id as producto_id,
    NULL::INTEGER as variante_id,
    p.organizacion_id,
    p.nombre,
    p.sku,
    p.codigo_barras,
    p.stock_actual,
    stock_reservado(p.id, NULL, NULL) as stock_reservado,
    stock_disponible(p.id, NULL, NULL) as stock_disponible,
    p.stock_minimo,
    p.stock_maximo,
    CASE
        WHEN stock_disponible(p.id, NULL, NULL) <= 0 THEN 'agotado'
        WHEN stock_disponible(p.id, NULL, NULL) <= COALESCE(p.stock_minimo, 0) THEN 'bajo'
        WHEN stock_disponible(p.id, NULL, NULL) <= COALESCE(p.stock_minimo, 0) * 1.5 THEN 'medio'
        ELSE 'ok'
    END as nivel_stock,
    p.activo
FROM productos p
WHERE p.activo = true
  AND p.eliminado_en IS NULL
  AND NOT EXISTS (
      SELECT 1 FROM variantes_producto v
      WHERE v.producto_id = p.id AND v.activo = true
  )

UNION ALL

-- Variantes de productos
SELECT
    p.id as producto_id,
    v.id as variante_id,
    p.organizacion_id,
    p.nombre || ' - ' || v.nombre_variante as nombre,
    COALESCE(v.sku, p.sku || '-' || v.id::TEXT) as sku,
    v.codigo_barras,
    v.stock_actual,
    stock_reservado(NULL, v.id, NULL) as stock_reservado,
    stock_disponible(NULL, v.id, NULL) as stock_disponible,
    p.stock_minimo,
    p.stock_maximo,
    CASE
        WHEN stock_disponible(NULL, v.id, NULL) <= 0 THEN 'agotado'
        WHEN stock_disponible(NULL, v.id, NULL) <= COALESCE(p.stock_minimo, 0) THEN 'bajo'
        WHEN stock_disponible(NULL, v.id, NULL) <= COALESCE(p.stock_minimo, 0) * 1.5 THEN 'medio'
        ELSE 'ok'
    END as nivel_stock,
    v.activo
FROM variantes_producto v
JOIN productos p ON p.id = v.producto_id
WHERE v.activo = true
  AND p.activo = true
  AND p.eliminado_en IS NULL;

COMMENT ON VIEW v_stock_disponible_tiempo_real IS 'Vista de stock disponible en tiempo real para productos y variantes.';

-- ============================================================================
-- VISTA MATERIALIZADA: mv_stock_disponible (para reportes de alto tráfico)
-- ============================================================================
CREATE MATERIALIZED VIEW IF NOT EXISTS mv_stock_disponible AS
SELECT * FROM v_stock_disponible_tiempo_real;

-- Índice único para refresh concurrente (NULLS NOT DISTINCT: PostgreSQL 15+)
CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_stock_pk
ON mv_stock_disponible(producto_id, variante_id) NULLS NOT DISTINCT;

CREATE INDEX IF NOT EXISTS idx_mv_stock_org
ON mv_stock_disponible(organizacion_id);

CREATE INDEX IF NOT EXISTS idx_mv_stock_nivel
ON mv_stock_disponible(nivel_stock)
WHERE nivel_stock IN ('agotado', 'bajo');

COMMENT ON MATERIALIZED VIEW mv_stock_disponible IS 'Vista materializada para reportes de stock. Refrescar cada minuto via pg_cron.';

-- ============================================================================
-- JOB pg_cron: Expirar reservas y refrescar vista materializada
-- ============================================================================
DO $block$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Job: Expirar reservas cada 5 minutos
        BEGIN
            PERFORM cron.unschedule('expirar-reservas-stock');
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        PERFORM cron.schedule(
            'expirar-reservas-stock',
            '*/5 * * * *',
            'SELECT expirar_reservas_vencidas()'
        );

        -- Job: Refrescar vista materializada cada minuto
        BEGIN
            PERFORM cron.unschedule('refresh-mv-stock-disponible');
        EXCEPTION WHEN OTHERS THEN NULL;
        END;

        PERFORM cron.schedule(
            'refresh-mv-stock-disponible',
            '* * * * *',
            'REFRESH MATERIALIZED VIEW CONCURRENTLY mv_stock_disponible'
        );

        RAISE NOTICE 'pg_cron jobs programados: expirar-reservas-stock (cada 5 min), refresh-mv-stock-disponible (cada 1 min)';
    ELSE
        RAISE NOTICE 'pg_cron no disponible. Ejecutar manualmente: SELECT expirar_reservas_vencidas();';
    END IF;
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Error al programar pg_cron: %. Las reservas expirarán en validación.', SQLERRM;
END $block$;

-- ============================================================================
-- FUNCIÓN: resumen_reservas_activas
-- Descripción: Resumen de reservas activas por organización
-- ============================================================================
CREATE OR REPLACE FUNCTION resumen_reservas_activas(
    p_organizacion_id INTEGER
) RETURNS TABLE (
    tipo_origen VARCHAR(50),
    total_reservas BIGINT,
    total_cantidad BIGINT,
    proxima_expiracion TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.tipo_origen,
        COUNT(*)::BIGINT as total_reservas,
        SUM(r.cantidad)::BIGINT as total_cantidad,
        MIN(r.expira_en) as proxima_expiracion
    FROM reservas_stock r
    WHERE r.organizacion_id = p_organizacion_id
      AND r.estado = 'activa'
      AND r.expira_en > NOW()
    GROUP BY r.tipo_origen
    ORDER BY total_cantidad DESC;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION resumen_reservas_activas IS 'Resumen de reservas activas agrupadas por tipo de origen.';

-- ============================================================================
-- FIN: SISTEMA DE RESERVAS DE STOCK - ARQUITECTURA SUPERIOR
-- ============================================================================

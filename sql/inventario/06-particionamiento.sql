-- ============================================================================
-- MÓDULO: INVENTARIO - PARTICIONAMIENTO
-- Descripción: Particionamiento por rango de fecha en movimientos_inventario
-- Versión: 1.0
-- Fecha: 20 Noviembre 2025
-- ============================================================================

-- ⚠️ IMPORTANTE: Este archivo debe ejecutarse ANTES de insertar datos
-- Si ya existen datos, primero hay que migrarlos a una tabla temporal

-- ============================================================================
-- PASO 1: Convertir tabla existente a particionada
-- ============================================================================

-- Si la tabla ya existe con datos, primero hacer backup
DO $$
BEGIN
    -- Verificar si la tabla existe y NO es particionada
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'movimientos_inventario'
    ) AND NOT EXISTS (
        SELECT 1 FROM pg_partitioned_table
        WHERE partrelid = 'movimientos_inventario'::regclass
    ) THEN
        RAISE NOTICE 'La tabla movimientos_inventario existe pero NO está particionada';
        RAISE NOTICE 'Ejecutando conversión a tabla particionada...';

        -- Renombrar tabla existente
        ALTER TABLE IF EXISTS movimientos_inventario RENAME TO movimientos_inventario_old;

        -- Renombrar constraints e índices
        ALTER INDEX IF EXISTS movimientos_inventario_pkey RENAME TO movimientos_inventario_old_pkey;
    ELSE
        RAISE NOTICE 'La tabla no existe o ya está particionada';
    END IF;
END $$;

-- ============================================================================
-- PASO 2: Crear tabla particionada
-- ============================================================================

CREATE TABLE IF NOT EXISTS movimientos_inventario (
    -- 🔑 IDENTIFICACIÓN
    id BIGSERIAL NOT NULL,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- Sucursal donde ocurre el movimiento (NULL = sin asignar)
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE CASCADE,

    -- 📋 TIPO DE MOVIMIENTO
    tipo_movimiento VARCHAR(30) NOT NULL CHECK (tipo_movimiento IN (
        'entrada_compra', 'entrada_devolucion', 'entrada_ajuste',
        'salida_venta', 'salida_uso_servicio', 'salida_merma',
        'salida_robo', 'salida_devolucion', 'salida_ajuste'
    )),

    -- 📊 CANTIDAD
    cantidad INTEGER NOT NULL CHECK (cantidad != 0),
    stock_antes INTEGER NOT NULL,
    stock_despues INTEGER NOT NULL,

    -- 💰 VALOR
    costo_unitario DECIMAL(10, 2),
    valor_total DECIMAL(10, 2),

    -- 🔗 RELACIONES
    proveedor_id INTEGER REFERENCES proveedores(id),
    venta_pos_id INTEGER,
    cita_id INTEGER,
    usuario_id INTEGER REFERENCES usuarios(id),

    -- 📝 METADATA
    referencia VARCHAR(100),
    motivo TEXT,
    fecha_vencimiento DATE,
    lote VARCHAR(50),

    -- 📅 TIMESTAMPS (columna de particionamiento)
    creado_en TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- 🔑 Primary Key incluye la columna de particionamiento
    PRIMARY KEY (id, creado_en),

    -- ✅ CONSTRAINTS
    CHECK (
        (tipo_movimiento LIKE 'entrada%' AND cantidad > 0) OR
        (tipo_movimiento LIKE 'salida%' AND cantidad < 0)
    ),
    CHECK (stock_despues = stock_antes + cantidad),
    CHECK (stock_despues >= 0),
    CHECK (costo_unitario IS NULL OR costo_unitario >= 0),
    CHECK (valor_total IS NULL OR valor_total >= 0)
) PARTITION BY RANGE (creado_en);

COMMENT ON TABLE movimientos_inventario IS 'Tabla particionada por rango de fecha (mensual) para optimizar consultas históricas';

-- ============================================================================
-- PASO 3: Crear particiones iniciales (últimos 3 meses + próximos 3 meses)
-- ============================================================================

-- Crear función para generar particiones
CREATE OR REPLACE FUNCTION crear_particion_movimientos_mes(fecha DATE)
RETURNS VOID AS $$
DECLARE
    nombre_particion TEXT;
    fecha_inicio DATE;
    fecha_fin DATE;
BEGIN
    -- Calcular primer y último día del mes
    fecha_inicio := DATE_TRUNC('month', fecha)::DATE;
    fecha_fin := (DATE_TRUNC('month', fecha) + INTERVAL '1 month')::DATE;

    -- Nombre de partición: movimientos_inventario_YYYY_MM
    nombre_particion := 'movimientos_inventario_' ||
                       TO_CHAR(fecha, 'YYYY_MM');

    -- Verificar si ya existe
    IF NOT EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = nombre_particion
    ) THEN
        EXECUTE format(
            'CREATE TABLE %I PARTITION OF movimientos_inventario FOR VALUES FROM (%L) TO (%L)',
            nombre_particion,
            fecha_inicio,
            fecha_fin
        );

        RAISE NOTICE 'Partición % creada: % a %', nombre_particion, fecha_inicio, fecha_fin;
    ELSE
        RAISE NOTICE 'Partición % ya existe', nombre_particion;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Crear particiones para los últimos 3 meses
SELECT crear_particion_movimientos_mes((CURRENT_DATE - INTERVAL '3 months')::DATE);
SELECT crear_particion_movimientos_mes((CURRENT_DATE - INTERVAL '2 months')::DATE);
SELECT crear_particion_movimientos_mes((CURRENT_DATE - INTERVAL '1 month')::DATE);

-- Crear partición del mes actual
SELECT crear_particion_movimientos_mes(CURRENT_DATE);

-- Crear particiones para los próximos 3 meses
SELECT crear_particion_movimientos_mes((CURRENT_DATE + INTERVAL '1 month')::DATE);
SELECT crear_particion_movimientos_mes((CURRENT_DATE + INTERVAL '2 months')::DATE);
SELECT crear_particion_movimientos_mes((CURRENT_DATE + INTERVAL '3 months')::DATE);

-- ============================================================================
-- PASO 4: Función para crear próxima partición (automatizada con pg_cron)
-- ============================================================================

CREATE OR REPLACE FUNCTION crear_particion_movimientos_mes_siguiente()
RETURNS VOID AS $$
BEGIN
    -- Crear partición para el mes siguiente
    PERFORM crear_particion_movimientos_mes(
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '2 months')::DATE
    );

    -- Crear partición para dentro de 3 meses (redundancia)
    PERFORM crear_particion_movimientos_mes(
        (DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '3 months')::DATE
    );

    RAISE NOTICE 'Particiones futuras creadas/verificadas exitosamente';
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- PASO 5: Job pg_cron para creación automática de particiones
-- ============================================================================

-- Ejecutar el primer día de cada mes a medianoche
SELECT cron.schedule(
    'crear-particiones-movimientos',
    '0 0 1 * *', -- Minuto Hora DíaMes Mes DíaSemana
    $$SELECT crear_particion_movimientos_mes_siguiente()$$
);

COMMENT ON FUNCTION crear_particion_movimientos_mes_siguiente IS 'Job mensual (pg_cron) que crea particiones futuras automáticamente';

-- ============================================================================
-- PASO 6: Migrar datos desde tabla antigua (si existe)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_tables
        WHERE schemaname = 'public' AND tablename = 'movimientos_inventario_old'
    ) THEN
        RAISE NOTICE 'Migrando datos desde movimientos_inventario_old...';

        -- Usar columnas explícitas para evitar problemas si las tablas tienen columnas diferentes
        INSERT INTO movimientos_inventario (
            id, organizacion_id, sucursal_id, producto_id, tipo_movimiento,
            cantidad, stock_antes, stock_despues, costo_unitario, valor_total,
            proveedor_id, venta_pos_id, cita_id, usuario_id,
            referencia, motivo, fecha_vencimiento, lote, creado_en
        )
        SELECT
            id, organizacion_id, sucursal_id, producto_id, tipo_movimiento,
            cantidad, stock_antes, stock_despues, costo_unitario, valor_total,
            proveedor_id, venta_pos_id, cita_id, usuario_id,
            referencia, motivo, fecha_vencimiento, lote, creado_en
        FROM movimientos_inventario_old;

        RAISE NOTICE 'Migración completada. Revisar y eliminar movimientos_inventario_old manualmente.';
    ELSE
        RAISE NOTICE 'No hay tabla antigua para migrar';
    END IF;
END $$;

-- ============================================================================
-- PASO 7: Recrear índices en la tabla particionada
-- ============================================================================

-- Los índices se heredan automáticamente en cada partición
-- Pero es buena práctica crearlos explícitamente

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_org
    ON movimientos_inventario(organizacion_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_producto
    ON movimientos_inventario(producto_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_org_producto
    ON movimientos_inventario(organizacion_id, producto_id, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_tipo
    ON movimientos_inventario(organizacion_id, tipo_movimiento, creado_en DESC);

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_fecha
    ON movimientos_inventario(organizacion_id, creado_en DESC);

-- Índices parciales (solo para columnas con valores opcionales)
CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_proveedor
    ON movimientos_inventario(proveedor_id, creado_en DESC)
    WHERE proveedor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_venta
    ON movimientos_inventario(venta_pos_id)
    WHERE venta_pos_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_cita
    ON movimientos_inventario(cita_id)
    WHERE cita_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_movimientos_inventario_usuario
    ON movimientos_inventario(usuario_id, creado_en DESC)
    WHERE usuario_id IS NOT NULL;

-- ============================================================================
-- PASO 8: Mantenimiento y limpieza de particiones antiguas
-- ============================================================================

-- Función para eliminar particiones antiguas (mantener solo 12 meses)
CREATE OR REPLACE FUNCTION limpiar_particiones_movimientos_antiguas()
RETURNS VOID AS $$
DECLARE
    particion RECORD;
    fecha_limite DATE;
BEGIN
    -- Mantener solo los últimos 12 meses
    fecha_limite := (DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '12 months')::DATE;

    FOR particion IN
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename ~ '^movimientos_inventario_\d{4}_\d{2}$'
    LOOP
        -- Extraer fecha de la partición
        DECLARE
            fecha_particion DATE;
        BEGIN
            fecha_particion := TO_DATE(
                SUBSTRING(particion.tablename FROM '\d{4}_\d{2}$'),
                'YYYY_MM'
            );

            -- Si es más antigua que 12 meses, eliminar
            IF fecha_particion < fecha_limite THEN
                EXECUTE format('DROP TABLE IF EXISTS %I', particion.tablename);
                RAISE NOTICE 'Partición antigua eliminada: %', particion.tablename;
            END IF;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Job pg_cron para limpieza mensual (ejecutar después de crear nuevas particiones)
SELECT cron.schedule(
    'limpiar-particiones-movimientos',
    '30 0 1 * *', -- 00:30 del primer día de cada mes
    $$SELECT limpiar_particiones_movimientos_antiguas()$$
);

COMMENT ON FUNCTION limpiar_particiones_movimientos_antiguas IS 'Job mensual (pg_cron) que elimina particiones > 12 meses';

-- ============================================================================
-- PASO 9: Función de utilidad para ver información de particiones
-- ============================================================================

CREATE OR REPLACE FUNCTION ver_particiones_movimientos()
RETURNS TABLE (
    particion TEXT,
    rango_inicio TEXT,
    rango_fin TEXT,
    num_filas BIGINT,
    tamaño TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pt.tablename::TEXT AS particion,
        pg_get_expr(c.relpartbound, c.oid, true)::TEXT AS rango_inicio,
        ''::TEXT AS rango_fin,
        (SELECT COUNT(*) FROM pg_class WHERE relname = pt.tablename)::BIGINT AS num_filas,
        pg_size_pretty(pg_total_relation_size(('public.' || pt.tablename)::regclass)) AS tamaño
    FROM pg_tables pt
    JOIN pg_class c ON c.relname = pt.tablename
    WHERE pt.schemaname = 'public'
    AND pt.tablename ~ '^movimientos_inventario_\d{4}_\d{2}$'
    ORDER BY pt.tablename DESC;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION ver_particiones_movimientos IS 'Muestra información de todas las particiones de movimientos_inventario';

-- ============================================================================
-- FIN: PARTICIONAMIENTO DE MOVIMIENTOS INVENTARIO
-- ============================================================================

-- Para ver las particiones creadas:
-- SELECT * FROM ver_particiones_movimientos();

-- Para forzar creación de particiones futuras:
-- SELECT crear_particion_movimientos_mes_siguiente();

-- Para limpiar particiones antiguas manualmente:
-- SELECT limpiar_particiones_movimientos_antiguas();

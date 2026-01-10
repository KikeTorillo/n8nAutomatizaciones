/**
 * ====================================================================
 * SISTEMA DE OPORTUNIDADES B2B
 * ====================================================================
 *
 * Fase 5 - Pipeline de Oportunidades (Ene 2026)
 * Tablas para gestión de oportunidades comerciales B2B
 *
 * ====================================================================
 */

-- ====================================================================
-- TABLA: etapas_oportunidad
-- Pipeline stages configurables por organización
-- ====================================================================

CREATE TABLE IF NOT EXISTS etapas_oportunidad (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    descripcion VARCHAR(200),
    probabilidad_default INTEGER DEFAULT 10 CHECK (probabilidad_default >= 0 AND probabilidad_default <= 100),
    color VARCHAR(7) NOT NULL DEFAULT '#6366F1',
    orden INTEGER DEFAULT 0,
    es_ganada BOOLEAN DEFAULT false,
    es_perdida BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Nombre único por organización
    UNIQUE(organizacion_id, nombre),

    -- Validar formato de color hexadecimal
    CONSTRAINT etapas_oportunidad_color_check CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),

    -- No puede ser ganada y perdida al mismo tiempo
    CONSTRAINT etapas_oportunidad_resultado_check CHECK (NOT (es_ganada AND es_perdida))
);

COMMENT ON TABLE etapas_oportunidad IS 'Etapas del pipeline de oportunidades';
COMMENT ON COLUMN etapas_oportunidad.probabilidad_default IS 'Probabilidad de cierre por defecto al entrar a esta etapa (0-100)';
COMMENT ON COLUMN etapas_oportunidad.es_ganada IS 'Indica que esta etapa representa una oportunidad cerrada/ganada';
COMMENT ON COLUMN etapas_oportunidad.es_perdida IS 'Indica que esta etapa representa una oportunidad perdida';


-- ====================================================================
-- TABLA: oportunidades
-- Oportunidades comerciales B2B vinculadas a clientes
-- ====================================================================

CREATE TABLE IF NOT EXISTS oportunidades (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
    etapa_id INTEGER REFERENCES etapas_oportunidad(id),

    -- Información básica
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- Pipeline
    probabilidad INTEGER DEFAULT 10 CHECK (probabilidad >= 0 AND probabilidad <= 100),
    fecha_cierre_esperada DATE,

    -- Valor
    ingreso_esperado DECIMAL(12,2) DEFAULT 0,
    moneda VARCHAR(3) DEFAULT 'MXN',

    -- Asignación
    vendedor_id INTEGER REFERENCES usuarios(id),

    -- Estado y resultado
    estado VARCHAR(20) DEFAULT 'abierta' CHECK (estado IN ('abierta', 'ganada', 'perdida')),
    motivo_perdida VARCHAR(200),
    fecha_cierre TIMESTAMPTZ,

    -- Prioridad
    prioridad VARCHAR(10) DEFAULT 'normal' CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),

    -- Fuente/origen
    fuente VARCHAR(50),  -- 'web', 'referido', 'llamada', 'evento', 'otro'

    -- Auditoría
    creado_por INTEGER REFERENCES usuarios(id),
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE oportunidades IS 'Oportunidades comerciales B2B vinculadas a clientes';
COMMENT ON COLUMN oportunidades.probabilidad IS 'Probabilidad de cierre (0-100%)';
COMMENT ON COLUMN oportunidades.ingreso_esperado IS 'Valor esperado de la oportunidad';
COMMENT ON COLUMN oportunidades.motivo_perdida IS 'Razón de pérdida si estado=perdida';


-- ====================================================================
-- ÍNDICES
-- ====================================================================

-- Etapas: búsqueda por organización y orden
CREATE INDEX IF NOT EXISTS idx_etapas_oportunidad_org_orden
    ON etapas_oportunidad(organizacion_id, orden)
    WHERE activo = true;

-- Oportunidades: por cliente
CREATE INDEX IF NOT EXISTS idx_oportunidades_cliente
    ON oportunidades(cliente_id, creado_en DESC);

-- Oportunidades: por etapa (para Kanban)
CREATE INDEX IF NOT EXISTS idx_oportunidades_etapa
    ON oportunidades(etapa_id, fecha_cierre_esperada)
    WHERE estado = 'abierta';

-- Oportunidades: por vendedor
CREATE INDEX IF NOT EXISTS idx_oportunidades_vendedor
    ON oportunidades(vendedor_id, estado, fecha_cierre_esperada)
    WHERE estado = 'abierta';

-- Oportunidades: por organización y estado
CREATE INDEX IF NOT EXISTS idx_oportunidades_org_estado
    ON oportunidades(organizacion_id, estado, fecha_cierre_esperada);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE etapas_oportunidad ENABLE ROW LEVEL SECURITY;
ALTER TABLE oportunidades ENABLE ROW LEVEL SECURITY;

-- Política para etapas_oportunidad
DROP POLICY IF EXISTS etapas_oportunidad_tenant_policy ON etapas_oportunidad;
CREATE POLICY etapas_oportunidad_tenant_policy ON etapas_oportunidad
    FOR ALL
    USING (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );

-- Política para oportunidades
DROP POLICY IF EXISTS oportunidades_tenant_policy ON oportunidades;
CREATE POLICY oportunidades_tenant_policy ON oportunidades
    FOR ALL
    USING (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );


-- ====================================================================
-- TRIGGERS
-- ====================================================================

-- Trigger para actualizar timestamp
CREATE OR REPLACE FUNCTION update_oportunidad_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_etapas_oportunidad_updated ON etapas_oportunidad;
CREATE TRIGGER trigger_etapas_oportunidad_updated
    BEFORE UPDATE ON etapas_oportunidad
    FOR EACH ROW
    EXECUTE FUNCTION update_oportunidad_timestamp();

DROP TRIGGER IF EXISTS trigger_oportunidades_updated ON oportunidades;
CREATE TRIGGER trigger_oportunidades_updated
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION update_oportunidad_timestamp();

-- Trigger para actualizar estado y probabilidad al cambiar de etapa
CREATE OR REPLACE FUNCTION sync_oportunidad_etapa()
RETURNS TRIGGER AS $$
DECLARE
    v_etapa RECORD;
BEGIN
    -- Solo procesar si cambió la etapa
    IF NEW.etapa_id IS DISTINCT FROM OLD.etapa_id AND NEW.etapa_id IS NOT NULL THEN
        SELECT * INTO v_etapa FROM etapas_oportunidad WHERE id = NEW.etapa_id;

        IF FOUND THEN
            -- Actualizar probabilidad si no fue modificada manualmente
            IF NEW.probabilidad = OLD.probabilidad THEN
                NEW.probabilidad = v_etapa.probabilidad_default;
            END IF;

            -- Actualizar estado según tipo de etapa
            IF v_etapa.es_ganada THEN
                NEW.estado = 'ganada';
                NEW.fecha_cierre = NOW();
                NEW.probabilidad = 100;
            ELSIF v_etapa.es_perdida THEN
                NEW.estado = 'perdida';
                NEW.fecha_cierre = NOW();
                NEW.probabilidad = 0;
            ELSE
                -- Si viene de una etapa cerrada, reabrir
                IF OLD.estado IN ('ganada', 'perdida') THEN
                    NEW.estado = 'abierta';
                    NEW.fecha_cierre = NULL;
                END IF;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_oportunidad_etapa_sync ON oportunidades;
CREATE TRIGGER trigger_oportunidad_etapa_sync
    BEFORE UPDATE ON oportunidades
    FOR EACH ROW
    EXECUTE FUNCTION sync_oportunidad_etapa();


-- ====================================================================
-- DATOS INICIALES (Etapas de ejemplo)
-- ====================================================================

INSERT INTO etapas_oportunidad (organizacion_id, nombre, descripcion, probabilidad_default, color, orden, es_ganada, es_perdida)
SELECT 1, nombre, descripcion, probabilidad_default, color, orden, es_ganada, es_perdida
FROM (VALUES
    ('Nuevo', 'Oportunidad recién identificada', 10, '#6366F1', 1, false, false),
    ('Contactado', 'Primer contacto realizado', 20, '#8B5CF6', 2, false, false),
    ('Propuesta', 'Propuesta enviada al cliente', 50, '#F59E0B', 3, false, false),
    ('Negociación', 'En negociación de términos', 75, '#3B82F6', 4, false, false),
    ('Ganada', 'Oportunidad cerrada exitosamente', 100, '#10B981', 5, true, false),
    ('Perdida', 'Oportunidad perdida', 0, '#EF4444', 6, false, true)
) AS v(nombre, descripcion, probabilidad_default, color, orden, es_ganada, es_perdida)
WHERE EXISTS (SELECT 1 FROM organizaciones WHERE id = 1)
AND NOT EXISTS (
    SELECT 1 FROM etapas_oportunidad
    WHERE organizacion_id = 1 AND nombre = v.nombre
);


-- ====================================================================
-- FUNCIONES ÚTILES
-- ====================================================================

-- Función para obtener métricas de oportunidades por cliente
CREATE OR REPLACE FUNCTION get_cliente_oportunidades_stats(p_cliente_id INTEGER)
RETURNS JSONB AS $$
    SELECT jsonb_build_object(
        'total', COUNT(*),
        'abiertas', COUNT(*) FILTER (WHERE estado = 'abierta'),
        'ganadas', COUNT(*) FILTER (WHERE estado = 'ganada'),
        'perdidas', COUNT(*) FILTER (WHERE estado = 'perdida'),
        'valor_abierto', COALESCE(SUM(ingreso_esperado) FILTER (WHERE estado = 'abierta'), 0),
        'valor_ganado', COALESCE(SUM(ingreso_esperado) FILTER (WHERE estado = 'ganada'), 0),
        'tasa_conversion', CASE
            WHEN COUNT(*) FILTER (WHERE estado IN ('ganada', 'perdida')) > 0
            THEN ROUND(
                COUNT(*) FILTER (WHERE estado = 'ganada')::numeric /
                COUNT(*) FILTER (WHERE estado IN ('ganada', 'perdida'))::numeric * 100,
                1
            )
            ELSE 0
        END
    )
    FROM oportunidades
    WHERE cliente_id = p_cliente_id;
$$ LANGUAGE sql STABLE;

COMMENT ON FUNCTION get_cliente_oportunidades_stats IS 'Retorna estadísticas de oportunidades de un cliente';


-- Función para obtener el pipeline completo (Kanban)
CREATE OR REPLACE FUNCTION get_pipeline_oportunidades(
    p_organizacion_id INTEGER,
    p_vendedor_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
    etapa_id INTEGER,
    etapa_nombre VARCHAR(50),
    etapa_color VARCHAR(7),
    etapa_orden INTEGER,
    oportunidades JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        e.id AS etapa_id,
        e.nombre AS etapa_nombre,
        e.color AS etapa_color,
        e.orden AS etapa_orden,
        COALESCE(
            jsonb_agg(
                jsonb_build_object(
                    'id', o.id,
                    'nombre', o.nombre,
                    'cliente_id', o.cliente_id,
                    'cliente_nombre', c.nombre,
                    'ingreso_esperado', o.ingreso_esperado,
                    'probabilidad', o.probabilidad,
                    'fecha_cierre_esperada', o.fecha_cierre_esperada,
                    'prioridad', o.prioridad,
                    'vendedor_id', o.vendedor_id
                )
                ORDER BY o.fecha_cierre_esperada, o.creado_en
            ) FILTER (WHERE o.id IS NOT NULL),
            '[]'::jsonb
        ) AS oportunidades
    FROM etapas_oportunidad e
    LEFT JOIN oportunidades o ON o.etapa_id = e.id
        AND o.estado = 'abierta'
        AND (p_vendedor_id IS NULL OR o.vendedor_id = p_vendedor_id)
    LEFT JOIN clientes c ON c.id = o.cliente_id
    WHERE e.organizacion_id = p_organizacion_id
        AND e.activo = true
        AND NOT e.es_perdida  -- Excluir etapa "Perdida" del Kanban
    GROUP BY e.id, e.nombre, e.color, e.orden
    ORDER BY e.orden;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_pipeline_oportunidades IS 'Retorna el pipeline Kanban con oportunidades agrupadas por etapa';


-- Función para mover oportunidad de etapa (Drag & Drop)
CREATE OR REPLACE FUNCTION mover_oportunidad_etapa(
    p_oportunidad_id INTEGER,
    p_nueva_etapa_id INTEGER
)
RETURNS oportunidades AS $$
DECLARE
    v_oportunidad oportunidades;
BEGIN
    UPDATE oportunidades
    SET etapa_id = p_nueva_etapa_id
    WHERE id = p_oportunidad_id
    RETURNING * INTO v_oportunidad;

    RETURN v_oportunidad;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION mover_oportunidad_etapa IS 'Mueve una oportunidad a una nueva etapa (para drag & drop)';


-- Función para obtener pronóstico de ventas
CREATE OR REPLACE FUNCTION get_pronostico_ventas(
    p_organizacion_id INTEGER,
    p_fecha_inicio DATE DEFAULT CURRENT_DATE,
    p_fecha_fin DATE DEFAULT (CURRENT_DATE + INTERVAL '3 months')::DATE
)
RETURNS TABLE (
    mes DATE,
    total_esperado DECIMAL(12,2),
    total_ponderado DECIMAL(12,2),
    cantidad_oportunidades BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        DATE_TRUNC('month', o.fecha_cierre_esperada)::DATE AS mes,
        SUM(o.ingreso_esperado) AS total_esperado,
        SUM(o.ingreso_esperado * o.probabilidad / 100.0) AS total_ponderado,
        COUNT(*) AS cantidad_oportunidades
    FROM oportunidades o
    WHERE o.organizacion_id = p_organizacion_id
        AND o.estado = 'abierta'
        AND o.fecha_cierre_esperada BETWEEN p_fecha_inicio AND p_fecha_fin
    GROUP BY DATE_TRUNC('month', o.fecha_cierre_esperada)
    ORDER BY mes;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_pronostico_ventas IS 'Retorna pronóstico de ventas agrupado por mes';

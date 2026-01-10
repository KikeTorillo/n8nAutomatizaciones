-- ====================================================================
-- SISTEMA DE ACTIVIDADES Y TIMELINE PARA CLIENTES
-- ====================================================================
--
-- Fase 4A - Timeline de Actividad (Enero 2026)
-- Tabla para gestión de notas, llamadas, tareas y eventos del cliente
--
-- Características:
-- • Timeline unificado (actividades manuales + citas + ventas)
-- • Sistema de tareas asignables con prioridad y vencimiento
-- • RLS multi-tenant por organizacion_id
-- • Función SQL para timeline combinado
--
-- ====================================================================

-- ====================================================================
-- TABLA: cliente_actividades
-- Almacena notas, llamadas, tareas y eventos del cliente
-- ====================================================================

CREATE TABLE IF NOT EXISTS cliente_actividades (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    cliente_id INTEGER NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,

    -- Tipo y origen de la actividad
    tipo VARCHAR(30) NOT NULL,              -- 'nota', 'llamada', 'email', 'tarea', 'sistema'
    fuente VARCHAR(30) DEFAULT 'manual',    -- 'manual', 'cita', 'venta', 'chatbot', 'recordatorio'

    -- Referencia a entidad relacionada (opcional)
    referencia_tipo VARCHAR(30),            -- 'cita', 'venta_pos', 'oportunidad', 'recordatorio'
    referencia_id INTEGER,                  -- ID de la entidad relacionada

    -- Contenido
    titulo VARCHAR(200) NOT NULL,
    descripcion TEXT,

    -- Estado y fechas (para tareas)
    estado VARCHAR(20) DEFAULT 'completada',    -- 'pendiente', 'completada', 'cancelada'
    fecha_vencimiento TIMESTAMPTZ,              -- Cuándo vence la tarea
    completada_en TIMESTAMPTZ,                  -- Cuándo se completó

    -- Prioridad (para tareas)
    prioridad VARCHAR(10) DEFAULT 'normal',     -- 'baja', 'normal', 'alta', 'urgente'

    -- Asignación
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,      -- Quién creó
    asignado_a INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,      -- A quién está asignada

    -- Auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_tipo_actividad CHECK (tipo IN ('nota', 'llamada', 'email', 'tarea', 'sistema')),
    CONSTRAINT valid_estado_actividad CHECK (estado IN ('pendiente', 'completada', 'cancelada')),
    CONSTRAINT valid_prioridad CHECK (prioridad IN ('baja', 'normal', 'alta', 'urgente')),
    CONSTRAINT valid_fuente CHECK (fuente IN ('manual', 'cita', 'venta', 'chatbot', 'recordatorio', 'sistema'))
);

COMMENT ON TABLE cliente_actividades IS 'Actividades, notas y tareas asociadas a clientes para timeline unificado';
COMMENT ON COLUMN cliente_actividades.tipo IS 'Tipo: nota, llamada, email, tarea o sistema (automático)';
COMMENT ON COLUMN cliente_actividades.fuente IS 'Origen: manual (usuario), cita, venta, chatbot, recordatorio';
COMMENT ON COLUMN cliente_actividades.estado IS 'Estado de la actividad: pendiente, completada, cancelada';
COMMENT ON COLUMN cliente_actividades.prioridad IS 'Prioridad para tareas: baja, normal, alta, urgente';


-- ====================================================================
-- ÍNDICES OPTIMIZADOS
-- ====================================================================

-- Índice principal: timeline por cliente ordenado por fecha
CREATE INDEX IF NOT EXISTS idx_cliente_actividades_timeline
    ON cliente_actividades(cliente_id, creado_en DESC);

-- Índice para búsqueda por organización
CREATE INDEX IF NOT EXISTS idx_cliente_actividades_org
    ON cliente_actividades(organizacion_id);

-- Índice para tareas pendientes por usuario asignado
CREATE INDEX IF NOT EXISTS idx_cliente_actividades_pendientes
    ON cliente_actividades(asignado_a, fecha_vencimiento)
    WHERE estado = 'pendiente';

-- Índice para tareas por prioridad
CREATE INDEX IF NOT EXISTS idx_cliente_actividades_prioridad
    ON cliente_actividades(organizacion_id, prioridad, fecha_vencimiento)
    WHERE estado = 'pendiente';

-- Índice para filtrado por tipo
CREATE INDEX IF NOT EXISTS idx_cliente_actividades_tipo
    ON cliente_actividades(cliente_id, tipo);


-- ====================================================================
-- ROW LEVEL SECURITY (RLS)
-- ====================================================================

ALTER TABLE cliente_actividades ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento por tenant
DROP POLICY IF EXISTS cliente_actividades_tenant_policy ON cliente_actividades;
CREATE POLICY cliente_actividades_tenant_policy ON cliente_actividades
    FOR ALL
    USING (
        organizacion_id = NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER
        OR current_setting('app.bypass_rls', true) = 'true'
    );


-- ====================================================================
-- TRIGGER: Actualizar timestamp
-- ====================================================================

CREATE OR REPLACE FUNCTION update_cliente_actividad_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    -- Si se marca como completada, registrar fecha
    IF NEW.estado = 'completada' AND OLD.estado != 'completada' THEN
        NEW.completada_en = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_cliente_actividades_updated ON cliente_actividades;
CREATE TRIGGER trigger_cliente_actividades_updated
    BEFORE UPDATE ON cliente_actividades
    FOR EACH ROW
    EXECUTE FUNCTION update_cliente_actividad_timestamp();


-- ====================================================================
-- FUNCIÓN: get_cliente_timeline
-- Retorna timeline unificado (actividades + citas + ventas)
-- ====================================================================

CREATE OR REPLACE FUNCTION get_cliente_timeline(
    p_cliente_id INTEGER,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    tipo VARCHAR,
    fuente VARCHAR,
    titulo VARCHAR,
    descripcion TEXT,
    referencia_tipo VARCHAR,
    referencia_id INTEGER,
    estado VARCHAR,
    prioridad VARCHAR,
    fecha TIMESTAMPTZ,
    usuario_nombre VARCHAR,
    asignado_nombre VARCHAR,
    metadata JSONB
) AS $$
BEGIN
    RETURN QUERY

    -- Actividades manuales (notas, llamadas, tareas)
    SELECT
        a.id,
        a.tipo::VARCHAR,
        a.fuente::VARCHAR,
        a.titulo::VARCHAR,
        a.descripcion,
        a.referencia_tipo::VARCHAR,
        a.referencia_id,
        a.estado::VARCHAR,
        a.prioridad::VARCHAR,
        a.creado_en as fecha,
        u.nombre::VARCHAR as usuario_nombre,
        ua.nombre::VARCHAR as asignado_nombre,
        CASE
            WHEN a.tipo = 'tarea' THEN
                jsonb_build_object(
                    'fecha_vencimiento', a.fecha_vencimiento,
                    'completada_en', a.completada_en
                )
            ELSE NULL
        END as metadata
    FROM cliente_actividades a
    LEFT JOIN usuarios u ON u.id = a.usuario_id
    LEFT JOIN usuarios ua ON ua.id = a.asignado_a
    WHERE a.cliente_id = p_cliente_id

    UNION ALL

    -- Citas (eventos del sistema)
    SELECT
        c.id,
        'cita'::VARCHAR as tipo,
        'sistema'::VARCHAR as fuente,
        CASE c.estado
            WHEN 'completada' THEN 'Cita completada'
            WHEN 'confirmada' THEN 'Cita confirmada'
            WHEN 'cancelada' THEN 'Cita cancelada'
            WHEN 'no_asistio' THEN 'No asistió a la cita'
            ELSE 'Cita agendada'
        END::VARCHAR as titulo,
        NULL::TEXT as descripcion,
        'cita'::VARCHAR as referencia_tipo,
        c.id as referencia_id,
        c.estado::VARCHAR,
        NULL::VARCHAR as prioridad,
        COALESCE(c.fecha_cita::TIMESTAMPTZ, c.creado_en) as fecha,
        p.nombre_completo::VARCHAR as usuario_nombre,
        NULL::VARCHAR as asignado_nombre,
        jsonb_build_object(
            'servicio', (
                SELECT string_agg(s.nombre, ', ')
                FROM citas_servicios cs
                JOIN servicios s ON s.id = cs.servicio_id
                WHERE cs.cita_id = c.id
            ),
            'precio', c.precio_total,
            'hora_inicio', c.hora_inicio,
            'hora_fin', c.hora_fin,
            'profesional', p.nombre_completo
        ) as metadata
    FROM citas c
    LEFT JOIN profesionales p ON p.id = c.profesional_id
    WHERE c.cliente_id = p_cliente_id

    UNION ALL

    -- Ventas POS (eventos del sistema)
    SELECT
        v.id,
        'venta'::VARCHAR as tipo,
        'sistema'::VARCHAR as fuente,
        CONCAT('Venta POS #', v.id)::VARCHAR as titulo,
        NULL::TEXT as descripcion,
        'venta_pos'::VARCHAR as referencia_tipo,
        v.id as referencia_id,
        v.estado::VARCHAR,
        NULL::VARCHAR as prioridad,
        v.fecha_venta as fecha,
        u.nombre::VARCHAR as usuario_nombre,
        NULL::VARCHAR as asignado_nombre,
        jsonb_build_object(
            'total', v.total,
            'metodo_pago', v.metodo_pago,
            'items', (SELECT COUNT(*) FROM ventas_pos_items WHERE venta_pos_id = v.id)
        ) as metadata
    FROM ventas_pos v
    LEFT JOIN usuarios u ON u.id = v.usuario_id
    WHERE v.cliente_id = p_cliente_id

    ORDER BY fecha DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_cliente_timeline IS 'Retorna timeline unificado de cliente: actividades + citas + ventas';


-- ====================================================================
-- FUNCIÓN: get_tareas_pendientes_usuario
-- Retorna tareas pendientes asignadas a un usuario
-- ====================================================================

CREATE OR REPLACE FUNCTION get_tareas_pendientes_usuario(
    p_usuario_id INTEGER,
    p_organizacion_id INTEGER,
    p_limit INTEGER DEFAULT 50
)
RETURNS TABLE (
    id INTEGER,
    cliente_id INTEGER,
    cliente_nombre VARCHAR,
    titulo VARCHAR,
    descripcion TEXT,
    prioridad VARCHAR,
    fecha_vencimiento TIMESTAMPTZ,
    creado_en TIMESTAMPTZ,
    dias_restantes INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        a.id,
        a.cliente_id,
        c.nombre::VARCHAR as cliente_nombre,
        a.titulo::VARCHAR,
        a.descripcion,
        a.prioridad::VARCHAR,
        a.fecha_vencimiento,
        a.creado_en,
        CASE
            WHEN a.fecha_vencimiento IS NULL THEN NULL
            ELSE EXTRACT(DAY FROM (a.fecha_vencimiento - NOW()))::INTEGER
        END as dias_restantes
    FROM cliente_actividades a
    JOIN clientes c ON c.id = a.cliente_id
    WHERE a.organizacion_id = p_organizacion_id
      AND a.asignado_a = p_usuario_id
      AND a.tipo = 'tarea'
      AND a.estado = 'pendiente'
    ORDER BY
        CASE a.prioridad
            WHEN 'urgente' THEN 1
            WHEN 'alta' THEN 2
            WHEN 'normal' THEN 3
            WHEN 'baja' THEN 4
        END,
        a.fecha_vencimiento NULLS LAST,
        a.creado_en DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION get_tareas_pendientes_usuario IS 'Retorna tareas pendientes asignadas a un usuario ordenadas por prioridad';


-- ====================================================================
-- FUNCIÓN: contar_actividades_cliente
-- Estadísticas de actividades por cliente
-- ====================================================================

CREATE OR REPLACE FUNCTION contar_actividades_cliente(p_cliente_id INTEGER)
RETURNS TABLE (
    total INTEGER,
    notas INTEGER,
    llamadas INTEGER,
    tareas_pendientes INTEGER,
    tareas_completadas INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::INTEGER as total,
        COUNT(*) FILTER (WHERE tipo = 'nota')::INTEGER as notas,
        COUNT(*) FILTER (WHERE tipo = 'llamada')::INTEGER as llamadas,
        COUNT(*) FILTER (WHERE tipo = 'tarea' AND estado = 'pendiente')::INTEGER as tareas_pendientes,
        COUNT(*) FILTER (WHERE tipo = 'tarea' AND estado = 'completada')::INTEGER as tareas_completadas
    FROM cliente_actividades
    WHERE cliente_id = p_cliente_id;
END;
$$ LANGUAGE plpgsql STABLE;


-- ====================================================================
-- DATOS DE EJEMPLO (Solo si existe organización demo)
-- ====================================================================

-- Insertar actividades de ejemplo para organización 1
INSERT INTO cliente_actividades (organizacion_id, cliente_id, tipo, titulo, descripcion, usuario_id)
SELECT 1, c.id, 'nota', 'Cliente registrado', 'Cliente creado en el sistema', 1
FROM clientes c
WHERE c.organizacion_id = 1
AND NOT EXISTS (
    SELECT 1 FROM cliente_actividades ca
    WHERE ca.cliente_id = c.id AND ca.tipo = 'sistema' AND ca.titulo = 'Cliente registrado'
)
LIMIT 5;

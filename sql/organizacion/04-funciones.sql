-- ====================================================================
-- MÓDULO ORGANIZACIÓN: FUNCIONES
-- ====================================================================
-- Funciones para gestión de jerarquía organizacional.
--
-- FUNCIONES:
-- • get_subordinados - Obtener todos los subordinados de un profesional
-- • es_supervisor_de - Verificar si X es supervisor de Y
-- • get_cadena_supervisores - Obtener la cadena de mando hacia arriba
-- • get_arbol_departamentos - Obtener jerarquía de departamentos
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 👥 FUNCIÓN: get_subordinados
-- ====================================================================
-- Obtiene todos los subordinados directos e indirectos de un profesional.
-- Usa CTE recursivo para recorrer la jerarquía hacia abajo.
--
-- PARÁMETROS:
-- - p_profesional_id: ID del profesional supervisor
-- - p_max_nivel: Nivel máximo de profundidad (default: 10)
--
-- RETORNA: TABLE(profesional_id, nivel)
-- ====================================================================
CREATE OR REPLACE FUNCTION get_subordinados(
    p_profesional_id INTEGER,
    p_max_nivel INTEGER DEFAULT 10
)
RETURNS TABLE(profesional_id INTEGER, nivel INTEGER)
LANGUAGE SQL
STABLE
AS $$
    WITH RECURSIVE subordinados AS (
        -- Caso base: subordinados directos
        SELECT id, 1 as nivel
        FROM profesionales
        WHERE supervisor_id = p_profesional_id
          AND estado = 'activo'

        UNION ALL

        -- Caso recursivo: subordinados de subordinados
        SELECT p.id, s.nivel + 1
        FROM profesionales p
        JOIN subordinados s ON p.supervisor_id = s.id
        WHERE p.estado = 'activo'
          AND s.nivel < p_max_nivel
    )
    SELECT id as profesional_id, nivel FROM subordinados;
$$;

COMMENT ON FUNCTION get_subordinados(INTEGER, INTEGER) IS
'Obtiene todos los subordinados (directos e indirectos) de un profesional.
Ejemplo: SELECT * FROM get_subordinados(5) -- Subordinados del profesional 5';

-- ====================================================================
-- ✅ FUNCIÓN: es_supervisor_de
-- ====================================================================
-- Verifica si un profesional es supervisor (directo o indirecto) de otro.
-- Útil para validar permisos jerárquicos.
--
-- PARÁMETROS:
-- - p_supervisor_id: ID del posible supervisor
-- - p_profesional_id: ID del profesional a verificar
--
-- RETORNA: BOOLEAN
-- ====================================================================
CREATE OR REPLACE FUNCTION es_supervisor_de(
    p_supervisor_id INTEGER,
    p_profesional_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM get_subordinados(p_supervisor_id)
        WHERE profesional_id = p_profesional_id
    );
$$;

COMMENT ON FUNCTION es_supervisor_de(INTEGER, INTEGER) IS
'Verifica si p_supervisor_id es supervisor de p_profesional_id.
Ejemplo: SELECT es_supervisor_de(5, 12) -- ¿El 5 es jefe del 12?';

-- ====================================================================
-- 🔝 FUNCIÓN: get_cadena_supervisores
-- ====================================================================
-- Obtiene la cadena de supervisores hacia arriba (jefe, jefe del jefe, etc).
-- Útil para mostrar la línea de mando.
--
-- PARÁMETROS:
-- - p_profesional_id: ID del profesional
--
-- RETORNA: TABLE(profesional_id, nivel)
-- ====================================================================
CREATE OR REPLACE FUNCTION get_cadena_supervisores(p_profesional_id INTEGER)
RETURNS TABLE(profesional_id INTEGER, nivel INTEGER)
LANGUAGE SQL
STABLE
AS $$
    WITH RECURSIVE cadena AS (
        -- Caso base: supervisor directo
        SELECT supervisor_id as id, 1 as nivel
        FROM profesionales
        WHERE id = p_profesional_id
          AND supervisor_id IS NOT NULL

        UNION ALL

        -- Caso recursivo: supervisor del supervisor
        SELECT p.supervisor_id, c.nivel + 1
        FROM profesionales p
        JOIN cadena c ON p.id = c.id
        WHERE p.supervisor_id IS NOT NULL
          AND c.nivel < 10
    )
    SELECT id as profesional_id, nivel FROM cadena WHERE id IS NOT NULL;
$$;

COMMENT ON FUNCTION get_cadena_supervisores(INTEGER) IS
'Obtiene la cadena de supervisores hacia arriba.
Ejemplo: SELECT * FROM get_cadena_supervisores(12) -- Jefes del profesional 12';

-- ====================================================================
-- 🌳 FUNCIÓN: get_arbol_departamentos
-- ====================================================================
-- Obtiene la jerarquía de departamentos para una organización.
-- Retorna departamentos con su nivel en la jerarquía.
--
-- PARÁMETROS:
-- - p_organizacion_id: ID de la organización
--
-- RETORNA: TABLE(id, nombre, codigo, descripcion, activo, parent_id, nivel, path)
--
-- NOTA: Incluye todos los departamentos (activos e inactivos) para que
-- el frontend pueda mostrar el badge "Inactivo" cuando corresponda.
-- ====================================================================
CREATE OR REPLACE FUNCTION get_arbol_departamentos(p_organizacion_id INTEGER)
RETURNS TABLE(
    id INTEGER,
    nombre VARCHAR(100),
    codigo VARCHAR(50),
    descripcion TEXT,
    activo BOOLEAN,
    parent_id INTEGER,
    nivel INTEGER,
    path TEXT
)
LANGUAGE SQL
STABLE
AS $$
    WITH RECURSIVE arbol AS (
        -- Caso base: departamentos raíz
        SELECT
            d.id,
            d.nombre,
            d.codigo,
            d.descripcion,
            d.activo,
            d.parent_id,
            1 as nivel,
            d.nombre::TEXT as path
        FROM departamentos d
        WHERE d.organizacion_id = p_organizacion_id
          AND d.parent_id IS NULL

        UNION ALL

        -- Caso recursivo: subdepartamentos
        SELECT
            d.id,
            d.nombre,
            d.codigo,
            d.descripcion,
            d.activo,
            d.parent_id,
            a.nivel + 1,
            a.path || ' > ' || d.nombre
        FROM departamentos d
        JOIN arbol a ON d.parent_id = a.id
        WHERE a.nivel < 10
    )
    SELECT * FROM arbol ORDER BY path;
$$;

COMMENT ON FUNCTION get_arbol_departamentos(INTEGER) IS
'Obtiene la jerarquía de departamentos con nivel y path.
Ejemplo: SELECT * FROM get_arbol_departamentos(1)';

-- ====================================================================
-- 🔄 FUNCIÓN: validar_supervisor_sin_ciclo
-- ====================================================================
-- Valida que asignar un supervisor no cree un ciclo en la jerarquía.
-- Usado en trigger o validación de backend.
--
-- PARÁMETROS:
-- - p_profesional_id: ID del profesional a modificar
-- - p_nuevo_supervisor_id: ID del nuevo supervisor propuesto
--
-- RETORNA: BOOLEAN (true si es válido, false si crea ciclo)
-- ====================================================================
CREATE OR REPLACE FUNCTION validar_supervisor_sin_ciclo(
    p_profesional_id INTEGER,
    p_nuevo_supervisor_id INTEGER
)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
AS $$
    SELECT NOT EXISTS (
        -- Verificar que el nuevo supervisor no sea subordinado del profesional
        SELECT 1
        FROM get_subordinados(p_profesional_id)
        WHERE profesional_id = p_nuevo_supervisor_id
    )
    AND p_profesional_id != p_nuevo_supervisor_id; -- No puede ser su propio supervisor
$$;

COMMENT ON FUNCTION validar_supervisor_sin_ciclo(INTEGER, INTEGER) IS
'Valida que asignar un supervisor no cree ciclo en la jerarquía.
Retorna TRUE si es válido, FALSE si crearía un ciclo.
Ejemplo: SELECT validar_supervisor_sin_ciclo(5, 12)';

-- ====================================================================
-- 📊 FUNCIÓN: contar_subordinados
-- ====================================================================
-- Cuenta el total de subordinados de un profesional.
-- Útil para dashboards y métricas.
--
-- PARÁMETROS:
-- - p_profesional_id: ID del profesional
-- - p_solo_directos: Si true, solo cuenta directos (default: false)
--
-- RETORNA: INTEGER
-- ====================================================================
CREATE OR REPLACE FUNCTION contar_subordinados(
    p_profesional_id INTEGER,
    p_solo_directos BOOLEAN DEFAULT false
)
RETURNS INTEGER
LANGUAGE SQL
STABLE
AS $$
    SELECT CASE
        WHEN p_solo_directos THEN
            (SELECT COUNT(*)::INTEGER FROM profesionales
             WHERE supervisor_id = p_profesional_id AND estado = 'activo')
        ELSE
            (SELECT COUNT(*)::INTEGER FROM get_subordinados(p_profesional_id))
    END;
$$;

COMMENT ON FUNCTION contar_subordinados(INTEGER, BOOLEAN) IS
'Cuenta subordinados de un profesional.
Ejemplo: SELECT contar_subordinados(5, true) -- Solo directos';

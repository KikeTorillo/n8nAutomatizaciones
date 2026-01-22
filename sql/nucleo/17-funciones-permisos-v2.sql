-- ====================================================================
-- SISTEMA DE PERMISOS V2 - FUNCIONES CON ROLES DINÁMICOS
-- ====================================================================
--
-- Versión: 2.0.0
-- Fecha: Enero 2026
-- Módulo: nucleo/permisos
--
-- DESCRIPCIÓN:
-- Funciones de permisos actualizadas para usar la tabla roles en lugar
-- del ENUM rol_usuario. Mantiene retrocompatibilidad durante la transición.
--
-- CAMBIOS PRINCIPALES:
-- • obtener_permiso_v2() usa rol_id en lugar de ENUM
-- • Soporte para bypass_permisos desde tabla roles
-- • Cache-friendly: menos JOINs, más eficiente
--
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: obtener_permiso_v2
-- ====================================================================
-- Nueva versión que usa rol_id en lugar del ENUM
-- Jerarquía: usuario/sucursal → rol (por rol_id) → default catálogo
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_permiso_v2(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS JSONB AS $$
DECLARE
    v_valor JSONB;
    v_rol_id INTEGER;
    v_permiso_id INTEGER;
    v_bypass BOOLEAN;
BEGIN
    -- Obtener ID del permiso
    SELECT id INTO v_permiso_id
    FROM permisos_catalogo
    WHERE codigo = p_codigo_permiso AND activo = TRUE;

    IF v_permiso_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obtener rol_id y bypass_permisos del usuario
    SELECT u.rol_id, COALESCE(r.bypass_permisos, FALSE)
    INTO v_rol_id, v_bypass
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    -- Si el rol tiene bypass, retornar TRUE para permisos booleanos
    IF v_bypass THEN
        RETURN 'true'::JSONB;
    END IF;

    -- 1. Buscar override específico usuario/sucursal (vigente)
    SELECT pus.valor INTO v_valor
    FROM permisos_usuario_sucursal pus
    WHERE pus.usuario_id = p_usuario_id
      AND pus.sucursal_id = p_sucursal_id
      AND pus.permiso_id = v_permiso_id
      AND (pus.fecha_inicio IS NULL OR pus.fecha_inicio <= CURRENT_DATE)
      AND (pus.fecha_fin IS NULL OR pus.fecha_fin >= CURRENT_DATE);

    IF FOUND THEN
        RETURN v_valor;
    END IF;

    -- 2. Buscar permiso del rol (usando rol_id)
    IF v_rol_id IS NOT NULL THEN
        SELECT pr.valor INTO v_valor
        FROM permisos_rol pr
        WHERE pr.rol_id = v_rol_id
          AND pr.permiso_id = v_permiso_id;

        IF FOUND THEN
            RETURN v_valor;
        END IF;
    END IF;

    -- 3. Retornar valor default del catálogo
    SELECT pc.valor_default INTO v_valor
    FROM permisos_catalogo pc
    WHERE pc.id = v_permiso_id;

    RETURN COALESCE(v_valor, 'false'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION obtener_permiso_v2(INTEGER, INTEGER, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obtener_permiso_v2(INTEGER, INTEGER, VARCHAR) TO saas_app;

COMMENT ON FUNCTION obtener_permiso_v2(INTEGER, INTEGER, VARCHAR) IS
'Versión 2 de obtener_permiso usando rol_id en lugar de ENUM.
Soporta bypass_permisos de la tabla roles.';


-- ====================================================================
-- FUNCIÓN: obtener_permiso (ACTUALIZADA)
-- ====================================================================
-- Actualizar la función original para usar rol_id si está disponible
-- Mantiene retrocompatibilidad con sistema anterior
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_permiso(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS JSONB AS $$
DECLARE
    v_valor JSONB;
    v_rol rol_usuario;
    v_rol_id INTEGER;
    v_permiso_id INTEGER;
    v_bypass BOOLEAN;
BEGIN
    -- Obtener ID del permiso
    SELECT id INTO v_permiso_id
    FROM permisos_catalogo
    WHERE codigo = p_codigo_permiso AND activo = TRUE;

    IF v_permiso_id IS NULL THEN
        RETURN NULL;
    END IF;

    -- Obtener rol_id, rol ENUM y bypass del usuario
    SELECT u.rol_id, u.rol, COALESCE(r.bypass_permisos, FALSE)
    INTO v_rol_id, v_rol, v_bypass
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    -- Si el rol tiene bypass, retornar TRUE
    IF v_bypass THEN
        RETURN 'true'::JSONB;
    END IF;

    -- 1. Buscar override específico usuario/sucursal
    SELECT pus.valor INTO v_valor
    FROM permisos_usuario_sucursal pus
    WHERE pus.usuario_id = p_usuario_id
      AND pus.sucursal_id = p_sucursal_id
      AND pus.permiso_id = v_permiso_id
      AND (pus.fecha_inicio IS NULL OR pus.fecha_inicio <= CURRENT_DATE)
      AND (pus.fecha_fin IS NULL OR pus.fecha_fin >= CURRENT_DATE);

    IF FOUND THEN
        RETURN v_valor;
    END IF;

    -- 2. Buscar permiso del rol
    -- PRIORIDAD: rol_id (nuevo) > rol ENUM (legacy)
    IF v_rol_id IS NOT NULL THEN
        SELECT pr.valor INTO v_valor
        FROM permisos_rol pr
        WHERE pr.rol_id = v_rol_id
          AND pr.permiso_id = v_permiso_id;

        IF FOUND THEN
            RETURN v_valor;
        END IF;
    END IF;

    -- Fallback al sistema ENUM (legacy - para transición)
    IF v_rol IS NOT NULL THEN
        SELECT pr.valor INTO v_valor
        FROM permisos_rol pr
        WHERE pr.rol = v_rol
          AND pr.permiso_id = v_permiso_id
          AND pr.rol_id IS NULL;  -- Solo permisos legacy

        IF FOUND THEN
            RETURN v_valor;
        END IF;
    END IF;

    -- 3. Retornar valor default
    SELECT pc.valor_default INTO v_valor
    FROM permisos_catalogo pc
    WHERE pc.id = v_permiso_id;

    RETURN COALESCE(v_valor, 'false'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ====================================================================
-- FUNCIÓN: tiene_permiso (ACTUALIZADA)
-- ====================================================================
-- Ahora considera bypass_permisos de la tabla roles
-- ====================================================================

CREATE OR REPLACE FUNCTION tiene_permiso(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_valor JSONB;
    v_bypass BOOLEAN;
BEGIN
    -- Verificar bypass rápido
    SELECT COALESCE(r.bypass_permisos, FALSE)
    INTO v_bypass
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    IF v_bypass THEN
        RETURN TRUE;
    END IF;

    -- Obtener valor del permiso
    v_valor := obtener_permiso(p_usuario_id, p_sucursal_id, p_codigo_permiso);

    -- Interpretar el valor JSONB como booleano
    IF v_valor IS NULL THEN
        RETURN FALSE;
    ELSIF jsonb_typeof(v_valor) = 'boolean' THEN
        RETURN v_valor::TEXT::BOOLEAN;
    ELSIF jsonb_typeof(v_valor) = 'number' THEN
        RETURN (v_valor::TEXT::NUMERIC > 0);
    ELSIF jsonb_typeof(v_valor) = 'string' THEN
        RETURN LOWER(v_valor::TEXT) IN ('"true"', '"1"', '"yes"', '"si"');
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;


-- ====================================================================
-- FUNCIÓN: obtener_permisos_usuario (ACTUALIZADA)
-- ====================================================================
-- Ahora usa rol_id con fallback a ENUM
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_permisos_usuario(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER
) RETURNS TABLE (
    codigo VARCHAR(50),
    modulo VARCHAR(50),
    nombre VARCHAR(100),
    tipo_valor VARCHAR(20),
    valor JSONB,
    origen VARCHAR(20)
) AS $$
DECLARE
    v_rol_id INTEGER;
    v_bypass BOOLEAN;
BEGIN
    -- Obtener información del rol
    SELECT u.rol_id, COALESCE(r.bypass_permisos, FALSE)
    INTO v_rol_id, v_bypass
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    -- Si tiene bypass, retornar todos los permisos como TRUE
    IF v_bypass THEN
        RETURN QUERY
        SELECT
            pc.codigo,
            pc.modulo,
            pc.nombre,
            pc.tipo_valor,
            'true'::JSONB AS valor_efectivo,
            'bypass'::VARCHAR(20) AS origen_valor
        FROM permisos_catalogo pc
        WHERE pc.activo = TRUE
        ORDER BY pc.modulo, pc.codigo;
        RETURN;
    END IF;

    RETURN QUERY
    WITH permisos_efectivos AS (
        SELECT
            pc.codigo,
            pc.modulo,
            pc.nombre,
            pc.tipo_valor,
            -- Resolver valor con jerarquía
            COALESCE(
                -- 1. Override usuario/sucursal
                (
                    SELECT pus.valor
                    FROM permisos_usuario_sucursal pus
                    WHERE pus.usuario_id = p_usuario_id
                      AND pus.sucursal_id = p_sucursal_id
                      AND pus.permiso_id = pc.id
                      AND (pus.fecha_inicio IS NULL OR pus.fecha_inicio <= CURRENT_DATE)
                      AND (pus.fecha_fin IS NULL OR pus.fecha_fin >= CURRENT_DATE)
                ),
                -- 2. Permiso del rol (nuevo sistema con rol_id)
                (
                    SELECT pr.valor
                    FROM permisos_rol pr
                    WHERE pr.rol_id = v_rol_id
                      AND pr.permiso_id = pc.id
                ),
                -- 3. Permiso del rol (legacy con ENUM) - fallback
                (
                    SELECT pr.valor
                    FROM permisos_rol pr
                    JOIN usuarios u ON u.rol = pr.rol AND pr.rol_id IS NULL
                    WHERE u.id = p_usuario_id
                      AND pr.permiso_id = pc.id
                ),
                -- 4. Default del catálogo
                pc.valor_default
            ) AS valor_efectivo,
            -- Determinar origen
            CASE
                WHEN EXISTS (
                    SELECT 1 FROM permisos_usuario_sucursal pus
                    WHERE pus.usuario_id = p_usuario_id
                      AND pus.sucursal_id = p_sucursal_id
                      AND pus.permiso_id = pc.id
                      AND (pus.fecha_inicio IS NULL OR pus.fecha_inicio <= CURRENT_DATE)
                      AND (pus.fecha_fin IS NULL OR pus.fecha_fin >= CURRENT_DATE)
                ) THEN 'usuario'::VARCHAR(20)
                WHEN EXISTS (
                    SELECT 1 FROM permisos_rol pr
                    WHERE pr.rol_id = v_rol_id
                      AND pr.permiso_id = pc.id
                ) THEN 'rol'::VARCHAR(20)
                WHEN EXISTS (
                    SELECT 1 FROM permisos_rol pr
                    JOIN usuarios u ON u.rol = pr.rol AND pr.rol_id IS NULL
                    WHERE u.id = p_usuario_id
                      AND pr.permiso_id = pc.id
                ) THEN 'rol_legacy'::VARCHAR(20)
                ELSE 'default'::VARCHAR(20)
            END AS origen_valor
        FROM permisos_catalogo pc
        WHERE pc.activo = TRUE
    )
    SELECT
        pe.codigo,
        pe.modulo,
        pe.nombre,
        pe.tipo_valor,
        pe.valor_efectivo,
        pe.origen_valor
    FROM permisos_efectivos pe
    ORDER BY pe.modulo, pe.codigo;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;


-- ====================================================================
-- FUNCIÓN: usuario_tiene_bypass
-- ====================================================================
-- Helper para verificar si un usuario tiene bypass de permisos
-- ====================================================================

CREATE OR REPLACE FUNCTION usuario_tiene_bypass(p_usuario_id INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
    v_bypass BOOLEAN;
BEGIN
    SELECT COALESCE(r.bypass_permisos, FALSE)
    INTO v_bypass
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    RETURN COALESCE(v_bypass, FALSE);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION usuario_tiene_bypass(INTEGER) IS
'Verifica si un usuario tiene bypass de permisos (admin/propietario/super_admin).';

GRANT EXECUTE ON FUNCTION usuario_tiene_bypass(INTEGER) TO saas_app;


-- ====================================================================
-- FUNCIÓN: obtener_nivel_jerarquia_usuario
-- ====================================================================
-- Obtiene el nivel jerárquico del rol del usuario
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_nivel_jerarquia_usuario(p_usuario_id INTEGER)
RETURNS INTEGER AS $$
DECLARE
    v_nivel INTEGER;
BEGIN
    SELECT COALESCE(r.nivel_jerarquia, 0)
    INTO v_nivel
    FROM usuarios u
    LEFT JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;

    RETURN COALESCE(v_nivel, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_nivel_jerarquia_usuario(INTEGER) IS
'Obtiene el nivel jerárquico del rol del usuario (1-100).';

GRANT EXECUTE ON FUNCTION obtener_nivel_jerarquia_usuario(INTEGER) TO saas_app;


-- ====================================================================
-- FUNCIÓN: obtener_info_rol_usuario
-- ====================================================================
-- Obtiene información completa del rol de un usuario
-- Útil para cargar en req.user en el middleware de auth
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_info_rol_usuario(p_usuario_id INTEGER)
RETURNS TABLE (
    rol_id INTEGER,
    rol_codigo VARCHAR(50),
    rol_nombre VARCHAR(100),
    nivel_jerarquia INTEGER,
    bypass_permisos BOOLEAN,
    es_rol_sistema BOOLEAN,
    puede_crear_usuarios BOOLEAN,
    puede_modificar_permisos BOOLEAN,
    color VARCHAR(7),
    icono VARCHAR(50)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        r.id,
        r.codigo,
        r.nombre,
        r.nivel_jerarquia,
        r.bypass_permisos,
        r.es_rol_sistema,
        r.puede_crear_usuarios,
        r.puede_modificar_permisos,
        r.color,
        r.icono
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE u.id = p_usuario_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

REVOKE ALL ON FUNCTION obtener_info_rol_usuario(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obtener_info_rol_usuario(INTEGER) TO saas_app;

COMMENT ON FUNCTION obtener_info_rol_usuario(INTEGER) IS
'Obtiene información completa del rol de un usuario para cargar en sesión.';


-- ====================================================================
-- FUNCIÓN: puede_usuario_gestionar_a
-- ====================================================================
-- Verifica si un usuario puede gestionar a otro basado en jerarquía
-- ====================================================================

CREATE OR REPLACE FUNCTION puede_usuario_gestionar_a(
    p_gestor_id INTEGER,
    p_objetivo_id INTEGER
) RETURNS BOOLEAN AS $$
DECLARE
    v_nivel_gestor INTEGER;
    v_nivel_objetivo INTEGER;
BEGIN
    -- Obtener niveles de ambos usuarios
    SELECT nivel_jerarquia INTO v_nivel_gestor
    FROM v_usuarios_con_rol
    WHERE id = p_gestor_id;

    SELECT nivel_jerarquia INTO v_nivel_objetivo
    FROM v_usuarios_con_rol
    WHERE id = p_objetivo_id;

    -- Gestor debe tener nivel mayor que objetivo
    -- (usuarios del mismo nivel no pueden gestionarse mutuamente)
    RETURN COALESCE(v_nivel_gestor, 0) > COALESCE(v_nivel_objetivo, 0);
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION puede_usuario_gestionar_a(INTEGER, INTEGER) IS
'Verifica si un usuario puede gestionar a otro basado en nivel jerárquico del rol.';

GRANT EXECUTE ON FUNCTION puede_usuario_gestionar_a(INTEGER, INTEGER) TO saas_app;


-- ====================================================================
-- FIN: FUNCIONES V2 DE PERMISOS
-- ====================================================================

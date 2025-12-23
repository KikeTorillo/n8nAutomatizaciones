-- ====================================================================
-- SISTEMA DE PERMISOS NORMALIZADOS - FUNCIONES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: nucleo/permisos
--
-- DESCRIPCIÓN:
-- Funciones para consultar y gestionar permisos de forma eficiente.
-- La función principal obtener_permiso() resuelve la jerarquía:
-- usuario/sucursal → rol → catálogo (default)
--
-- FUNCIONES:
-- • obtener_permiso(): Obtiene el valor efectivo de un permiso
-- • tiene_permiso(): Shorthand booleano para verificar acceso
-- • obtener_permisos_usuario(): Todos los permisos de un usuario
-- • obtener_permisos_modulo(): Permisos de un módulo específico
--
-- ====================================================================

-- ====================================================================
-- FUNCIÓN: obtener_permiso
-- ====================================================================
-- Obtiene el valor efectivo de un permiso para un usuario en una sucursal.
-- Jerarquía de resolución:
-- 1. Override usuario/sucursal (si existe y está vigente)
-- 2. Permiso del rol del usuario
-- 3. Valor default del catálogo
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_permiso(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS JSONB AS $$
DECLARE
    v_valor JSONB;
    v_rol rol_usuario;
    v_permiso_id INTEGER;
BEGIN
    -- Obtener ID del permiso (cache en variable para evitar múltiples lookups)
    SELECT id INTO v_permiso_id
    FROM permisos_catalogo
    WHERE codigo = p_codigo_permiso AND activo = TRUE;

    IF v_permiso_id IS NULL THEN
        -- Permiso no existe en catálogo
        RETURN NULL;
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

    -- 2. Buscar permiso del rol del usuario
    SELECT u.rol INTO v_rol
    FROM usuarios u
    WHERE u.id = p_usuario_id;

    IF v_rol IS NOT NULL THEN
        SELECT pr.valor INTO v_valor
        FROM permisos_rol pr
        WHERE pr.rol = v_rol
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

-- Revocar ejecución pública y otorgar solo a saas_app
REVOKE ALL ON FUNCTION obtener_permiso(INTEGER, INTEGER, VARCHAR) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obtener_permiso(INTEGER, INTEGER, VARCHAR) TO saas_app;

COMMENT ON FUNCTION obtener_permiso(INTEGER, INTEGER, VARCHAR) IS
'Obtiene el valor efectivo de un permiso para un usuario en una sucursal.
Jerarquía: override usuario/sucursal → rol → default catálogo.
Ejemplo: SELECT obtener_permiso(1, 1, ''pos.acceso'')';


-- ====================================================================
-- FUNCIÓN: tiene_permiso (booleano)
-- ====================================================================
-- Shorthand para verificar si un usuario tiene un permiso booleano.
-- Equivalente a: obtener_permiso(...) = 'true'::JSONB
-- ====================================================================

CREATE OR REPLACE FUNCTION tiene_permiso(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS BOOLEAN AS $$
DECLARE
    v_valor JSONB;
BEGIN
    v_valor := obtener_permiso(p_usuario_id, p_sucursal_id, p_codigo_permiso);

    -- Interpretar el valor JSONB como booleano
    IF v_valor IS NULL THEN
        RETURN FALSE;
    ELSIF jsonb_typeof(v_valor) = 'boolean' THEN
        RETURN v_valor::TEXT::BOOLEAN;
    ELSIF jsonb_typeof(v_valor) = 'number' THEN
        -- Numérico > 0 = true
        RETURN (v_valor::TEXT::NUMERIC > 0);
    ELSIF jsonb_typeof(v_valor) = 'string' THEN
        -- String 'true', '1', 'yes' = true
        RETURN LOWER(v_valor::TEXT) IN ('"true"', '"1"', '"yes"', '"si"');
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION tiene_permiso(INTEGER, INTEGER, VARCHAR) IS
'Verifica si un usuario tiene un permiso booleano. Shorthand para obtener_permiso().
Ejemplo: SELECT tiene_permiso(1, 1, ''pos.acceso'')';


-- ====================================================================
-- FUNCIÓN: obtener_valor_permiso_numerico
-- ====================================================================
-- Obtiene un permiso numérico (ej: max_descuento, limite_aprobacion).
-- Retorna 0 si el permiso no existe o no es numérico.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_valor_permiso_numerico(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS NUMERIC AS $$
DECLARE
    v_valor JSONB;
BEGIN
    v_valor := obtener_permiso(p_usuario_id, p_sucursal_id, p_codigo_permiso);

    IF v_valor IS NULL THEN
        RETURN 0;
    ELSIF jsonb_typeof(v_valor) = 'number' THEN
        RETURN v_valor::TEXT::NUMERIC;
    ELSIF jsonb_typeof(v_valor) = 'string' THEN
        -- Intentar parsear string como número
        BEGIN
            RETURN TRIM(BOTH '"' FROM v_valor::TEXT)::NUMERIC;
        EXCEPTION WHEN OTHERS THEN
            RETURN 0;
        END;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_valor_permiso_numerico(INTEGER, INTEGER, VARCHAR) IS
'Obtiene el valor numérico de un permiso. Útil para límites (max_descuento, limite_aprobacion).
Ejemplo: SELECT obtener_valor_permiso_numerico(1, 1, ''pos.max_descuento'')';


-- ====================================================================
-- FUNCIÓN: obtener_permisos_usuario
-- ====================================================================
-- Obtiene todos los permisos efectivos de un usuario en una sucursal.
-- Útil para cargar permisos en frontend de una sola vez.
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
    origen VARCHAR(20)  -- 'usuario', 'rol', 'default'
) AS $$
BEGIN
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
                -- 2. Permiso del rol
                (
                    SELECT pr.valor
                    FROM permisos_rol pr
                    JOIN usuarios u ON u.rol = pr.rol
                    WHERE u.id = p_usuario_id
                      AND pr.permiso_id = pc.id
                ),
                -- 3. Default del catálogo
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
                    JOIN usuarios u ON u.rol = pr.rol
                    WHERE u.id = p_usuario_id
                      AND pr.permiso_id = pc.id
                ) THEN 'rol'::VARCHAR(20)
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

-- Revocar ejecución pública y otorgar solo a saas_app
REVOKE ALL ON FUNCTION obtener_permisos_usuario(INTEGER, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION obtener_permisos_usuario(INTEGER, INTEGER) TO saas_app;

COMMENT ON FUNCTION obtener_permisos_usuario(INTEGER, INTEGER) IS
'Obtiene todos los permisos efectivos de un usuario en una sucursal.
Incluye el origen del valor (usuario, rol, default).
Útil para cargar permisos en frontend.';


-- ====================================================================
-- FUNCIÓN: obtener_permisos_modulo
-- ====================================================================
-- Obtiene permisos de un módulo específico para un usuario/sucursal.
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_permisos_modulo(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_modulo VARCHAR(50)
) RETURNS TABLE (
    codigo VARCHAR(50),
    nombre VARCHAR(100),
    valor JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pu.codigo,
        pu.nombre,
        pu.valor
    FROM obtener_permisos_usuario(p_usuario_id, p_sucursal_id) pu
    WHERE pu.modulo = p_modulo;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_permisos_modulo(INTEGER, INTEGER, VARCHAR) IS
'Obtiene permisos de un módulo específico.
Ejemplo: SELECT * FROM obtener_permisos_modulo(1, 1, ''pos'')';


-- ====================================================================
-- FUNCIÓN: verificar_permiso_middleware
-- ====================================================================
-- Función optimizada para uso en middleware de backend.
-- Lanza excepción si el usuario no tiene el permiso.
-- ====================================================================

CREATE OR REPLACE FUNCTION verificar_permiso_middleware(
    p_usuario_id INTEGER,
    p_sucursal_id INTEGER,
    p_codigo_permiso VARCHAR(50)
) RETURNS BOOLEAN AS $$
BEGIN
    IF NOT tiene_permiso(p_usuario_id, p_sucursal_id, p_codigo_permiso) THEN
        RAISE EXCEPTION 'Acceso denegado: permiso % requerido', p_codigo_permiso
            USING ERRCODE = 'insufficient_privilege';
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION verificar_permiso_middleware(INTEGER, INTEGER, VARCHAR) IS
'Verifica permiso y lanza excepción si no tiene acceso.
Uso en middleware: SELECT verificar_permiso_middleware(user_id, sucursal_id, ''pos.acceso'')';


-- ====================================================================
-- TRIGGER: Actualizar timestamp en permisos
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_permisos_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_permisos_catalogo_updated
    BEFORE UPDATE ON permisos_catalogo
    FOR EACH ROW EXECUTE FUNCTION trigger_permisos_actualizado_en();

CREATE TRIGGER trg_permisos_rol_updated
    BEFORE UPDATE ON permisos_rol
    FOR EACH ROW EXECUTE FUNCTION trigger_permisos_actualizado_en();

CREATE TRIGGER trg_permisos_us_updated
    BEFORE UPDATE ON permisos_usuario_sucursal
    FOR EACH ROW EXECUTE FUNCTION trigger_permisos_actualizado_en();


-- ====================================================================
-- FIN: FUNCIONES DE PERMISOS
-- ====================================================================

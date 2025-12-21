-- ====================================================================
-- MODULO NOTIFICACIONES: FUNCIONES
-- ====================================================================
-- Funciones helper para operaciones con notificaciones.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCION: crear_notificacion
-- ====================================================================
-- Crea una notificacion para un usuario.
-- Verifica preferencias antes de crear.
-- ====================================================================
CREATE OR REPLACE FUNCTION crear_notificacion(
    p_organizacion_id INTEGER,
    p_usuario_id INTEGER,
    p_tipo VARCHAR(50),
    p_categoria VARCHAR(30),
    p_titulo VARCHAR(200),
    p_mensaje TEXT,
    p_nivel VARCHAR(20) DEFAULT 'info',
    p_icono VARCHAR(50) DEFAULT NULL,
    p_accion_url TEXT DEFAULT NULL,
    p_accion_texto VARCHAR(50) DEFAULT NULL,
    p_entidad_tipo VARCHAR(50) DEFAULT NULL,
    p_entidad_id INTEGER DEFAULT NULL,
    p_expira_en TIMESTAMPTZ DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_preferencia RECORD;
    v_notificacion_id INTEGER;
    v_in_app_enabled BOOLEAN := TRUE;
BEGIN
    -- Verificar preferencias del usuario para este tipo
    SELECT * INTO v_preferencia
    FROM notificaciones_preferencias
    WHERE usuario_id = p_usuario_id
      AND tipo_notificacion = p_tipo;

    -- Si tiene preferencia configurada, verificar si in_app esta habilitado
    IF FOUND THEN
        v_in_app_enabled := v_preferencia.in_app;
    END IF;

    -- Solo crear si in_app esta habilitado
    IF v_in_app_enabled THEN
        INSERT INTO notificaciones (
            organizacion_id,
            usuario_id,
            tipo,
            categoria,
            titulo,
            mensaje,
            nivel,
            icono,
            accion_url,
            accion_texto,
            entidad_tipo,
            entidad_id,
            expira_en
        ) VALUES (
            p_organizacion_id,
            p_usuario_id,
            p_tipo,
            p_categoria,
            p_titulo,
            p_mensaje,
            p_nivel,
            p_icono,
            p_accion_url,
            p_accion_texto,
            p_entidad_tipo,
            p_entidad_id,
            p_expira_en
        )
        RETURNING id INTO v_notificacion_id;

        RETURN v_notificacion_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_notificacion IS
'Crea una notificacion respetando las preferencias del usuario.';

-- ====================================================================
-- FUNCION: crear_notificacion_masiva
-- ====================================================================
-- Crea notificaciones para multiples usuarios (ej: todos los admins).
-- ====================================================================
CREATE OR REPLACE FUNCTION crear_notificacion_masiva(
    p_organizacion_id INTEGER,
    p_usuario_ids INTEGER[],
    p_tipo VARCHAR(50),
    p_categoria VARCHAR(30),
    p_titulo VARCHAR(200),
    p_mensaje TEXT,
    p_nivel VARCHAR(20) DEFAULT 'info',
    p_icono VARCHAR(50) DEFAULT NULL,
    p_accion_url TEXT DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_usuario_id INTEGER;
    v_total INTEGER := 0;
BEGIN
    FOREACH v_usuario_id IN ARRAY p_usuario_ids
    LOOP
        PERFORM crear_notificacion(
            p_organizacion_id,
            v_usuario_id,
            p_tipo,
            p_categoria,
            p_titulo,
            p_mensaje,
            p_nivel,
            p_icono,
            p_accion_url
        );
        v_total := v_total + 1;
    END LOOP;

    RETURN v_total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_notificacion_masiva IS
'Crea notificaciones para multiples usuarios de una organizacion.';

-- ====================================================================
-- FUNCION: contar_no_leidas
-- ====================================================================
-- Cuenta notificaciones no leidas de un usuario.
-- Optimizada para uso frecuente (badge de notificaciones).
-- ====================================================================
CREATE OR REPLACE FUNCTION contar_notificaciones_no_leidas(
    p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM notificaciones
        WHERE usuario_id = p_usuario_id
          AND leida = FALSE
          AND archivada = FALSE
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION contar_notificaciones_no_leidas IS
'Cuenta notificaciones no leidas. Usado para el badge en el header.';

-- ====================================================================
-- FUNCION: marcar_como_leida
-- ====================================================================
-- Marca una notificacion como leida.
-- ====================================================================
CREATE OR REPLACE FUNCTION marcar_notificacion_leida(
    p_notificacion_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE notificaciones
    SET leida = TRUE,
        leida_en = NOW()
    WHERE id = p_notificacion_id
      AND usuario_id = p_usuario_id
      AND leida = FALSE;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION marcar_notificacion_leida IS
'Marca una notificacion especifica como leida.';

-- ====================================================================
-- FUNCION: marcar_todas_leidas
-- ====================================================================
-- Marca todas las notificaciones de un usuario como leidas.
-- ====================================================================
CREATE OR REPLACE FUNCTION marcar_todas_notificaciones_leidas(
    p_usuario_id INTEGER
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notificaciones
    SET leida = TRUE,
        leida_en = NOW()
    WHERE usuario_id = p_usuario_id
      AND leida = FALSE
      AND archivada = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION marcar_todas_notificaciones_leidas IS
'Marca todas las notificaciones no leidas del usuario como leidas.';

-- ====================================================================
-- FUNCION: archivar_notificacion
-- ====================================================================
-- Archiva una notificacion (ocultar del feed principal).
-- ====================================================================
CREATE OR REPLACE FUNCTION archivar_notificacion(
    p_notificacion_id INTEGER,
    p_usuario_id INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_updated BOOLEAN;
BEGIN
    UPDATE notificaciones
    SET archivada = TRUE,
        archivada_en = NOW()
    WHERE id = p_notificacion_id
      AND usuario_id = p_usuario_id
      AND archivada = FALSE;

    GET DIAGNOSTICS v_updated = ROW_COUNT;
    RETURN v_updated > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION archivar_notificacion IS
'Archiva una notificacion. Las archivadas no aparecen en el feed principal.';

-- ====================================================================
-- FUNCION: obtener_feed_notificaciones
-- ====================================================================
-- Obtiene el feed de notificaciones de un usuario.
-- Soporta paginacion y filtros.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_feed_notificaciones(
    p_usuario_id INTEGER,
    p_solo_no_leidas BOOLEAN DEFAULT FALSE,
    p_categoria VARCHAR(30) DEFAULT NULL,
    p_limite INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id INTEGER,
    tipo VARCHAR(50),
    categoria VARCHAR(30),
    titulo VARCHAR(200),
    mensaje TEXT,
    icono VARCHAR(50),
    nivel VARCHAR(20),
    imagen_url TEXT,
    leida BOOLEAN,
    leida_en TIMESTAMPTZ,
    accion_url TEXT,
    accion_texto VARCHAR(50),
    entidad_tipo VARCHAR(50),
    entidad_id INTEGER,
    creado_en TIMESTAMPTZ,
    tiempo_relativo TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id,
        n.tipo,
        n.categoria,
        n.titulo,
        n.mensaje,
        n.icono,
        n.nivel,
        n.imagen_url,
        n.leida,
        n.leida_en,
        n.accion_url,
        n.accion_texto,
        n.entidad_tipo,
        n.entidad_id,
        n.creado_en,
        CASE
            WHEN n.creado_en > NOW() - INTERVAL '1 minute' THEN 'Ahora'
            WHEN n.creado_en > NOW() - INTERVAL '1 hour' THEN
                EXTRACT(MINUTE FROM NOW() - n.creado_en)::INTEGER || ' min'
            WHEN n.creado_en > NOW() - INTERVAL '24 hours' THEN
                EXTRACT(HOUR FROM NOW() - n.creado_en)::INTEGER || ' h'
            WHEN n.creado_en > NOW() - INTERVAL '7 days' THEN
                EXTRACT(DAY FROM NOW() - n.creado_en)::INTEGER || ' d'
            ELSE TO_CHAR(n.creado_en, 'DD Mon')
        END AS tiempo_relativo
    FROM notificaciones n
    WHERE n.usuario_id = p_usuario_id
      AND n.archivada = FALSE
      AND (NOT p_solo_no_leidas OR n.leida = FALSE)
      AND (p_categoria IS NULL OR n.categoria = p_categoria)
    ORDER BY n.creado_en DESC
    LIMIT p_limite
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION obtener_feed_notificaciones IS
'Obtiene el feed de notificaciones con tiempo relativo calculado.';

-- ====================================================================
-- FUNCION: limpiar_notificaciones_expiradas
-- ====================================================================
-- Archiva notificaciones que han expirado.
-- Diseñada para ejecutarse con pg_cron.
-- ====================================================================
CREATE OR REPLACE FUNCTION limpiar_notificaciones_expiradas()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    UPDATE notificaciones
    SET archivada = TRUE,
        archivada_en = NOW()
    WHERE expira_en IS NOT NULL
      AND expira_en < NOW()
      AND archivada = FALSE;

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log de ejecucion
    IF v_count > 0 THEN
        RAISE NOTICE 'Notificaciones expiradas archivadas: %', v_count;
    END IF;

    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION limpiar_notificaciones_expiradas IS
'Archiva notificaciones expiradas. Ejecutar con pg_cron cada hora.';

-- ====================================================================
-- FUNCION: obtener_preferencias_usuario
-- ====================================================================
-- Obtiene preferencias de notificacion de un usuario.
-- Combina preferencias personalizadas con defaults del sistema.
-- ====================================================================
CREATE OR REPLACE FUNCTION obtener_preferencias_notificaciones(
    p_usuario_id INTEGER
)
RETURNS TABLE (
    tipo VARCHAR(50),
    categoria VARCHAR(30),
    nombre VARCHAR(100),
    in_app BOOLEAN,
    email BOOLEAN,
    push BOOLEAN,
    whatsapp BOOLEAN,
    personalizado BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        t.tipo,
        t.categoria,
        t.nombre,
        COALESCE(p.in_app, t.default_in_app) AS in_app,
        COALESCE(p.email, t.default_email) AS email,
        COALESCE(p.push, t.default_push) AS push,
        COALESCE(p.whatsapp, FALSE) AS whatsapp,
        (p.id IS NOT NULL) AS personalizado
    FROM notificaciones_tipos t
    LEFT JOIN notificaciones_preferencias p
        ON p.tipo_notificacion = t.tipo AND p.usuario_id = p_usuario_id
    WHERE t.activo = TRUE
    ORDER BY t.categoria, t.orden;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

COMMENT ON FUNCTION obtener_preferencias_notificaciones IS
'Obtiene preferencias de notificacion combinando personalizadas con defaults.';

-- ====================================================================
-- FUNCION: actualizar_preferencia
-- ====================================================================
-- Actualiza o crea una preferencia de notificacion.
-- ====================================================================
CREATE OR REPLACE FUNCTION actualizar_preferencia_notificacion(
    p_organizacion_id INTEGER,
    p_usuario_id INTEGER,
    p_tipo VARCHAR(50),
    p_in_app BOOLEAN,
    p_email BOOLEAN,
    p_push BOOLEAN DEFAULT FALSE,
    p_whatsapp BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO notificaciones_preferencias (
        organizacion_id,
        usuario_id,
        tipo_notificacion,
        in_app,
        email,
        push,
        whatsapp
    ) VALUES (
        p_organizacion_id,
        p_usuario_id,
        p_tipo,
        p_in_app,
        p_email,
        p_push,
        p_whatsapp
    )
    ON CONFLICT (usuario_id, tipo_notificacion)
    DO UPDATE SET
        in_app = EXCLUDED.in_app,
        email = EXCLUDED.email,
        push = EXCLUDED.push,
        whatsapp = EXCLUDED.whatsapp,
        actualizado_en = NOW();

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION actualizar_preferencia_notificacion IS
'Actualiza o crea una preferencia de notificacion para un usuario.';

-- ====================================================================
-- FIN: FUNCIONES NOTIFICACIONES
-- ====================================================================

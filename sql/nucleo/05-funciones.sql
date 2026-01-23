-- ====================================================================
-- MÓDULO NÚCLEO: FUNCIONES PL/pgSQL
-- ====================================================================
-- ACTUALIZADO: 21 Enero 2026
-- Eliminadas funciones del sistema de suscripciones v1:
-- • verificar_limite_plan()
-- • tiene_caracteristica_habilitada()
-- • actualizar_metricas_uso()
-- • registrar_cambio_subscripcion()
--
-- Razón: Migración a sistema de suscripciones v2 (cobro por usuario)
-- ====================================================================

-- ====================================================================
-- 🔐 FUNCIONES DE AUTENTICACIÓN Y USUARIOS (Migrado de schema/)
-- ====================================================================
-- Fecha de migración: 17 Noviembre 2025
-- Origen: sql/schema/02-functions.sql
-- ────────────────────────────────────────────────────────────────────

-- ====================================================================
-- 🔐 FUNCIÓN: REGISTRAR_INTENTO_LOGIN
-- ====================================================================
-- Función CRÍTICA para el sistema de autenticación.
-- Maneja tanto logins exitosos como fallidos con lógica de bloqueo.
--
-- 📋 PARÁMETROS:
-- • p_email: Email del usuario que intenta autenticarse
-- • p_exitoso: TRUE = login correcto, FALSE = login fallido
-- • p_ip_address: IP del cliente (para auditoría futura)
--
-- 🛡️ LÓGICA DE SEGURIDAD:
-- • Login exitoso: Resetea contadores y actualiza último acceso
-- • Login fallido: Incrementa contador e implementa bloqueo progresivo
-- • Bloqueo automático: 30 minutos tras 5 intentos fallidos
--
-- ⚡ PERFORMANCE: Usa bypass RLS para evitar overhead de políticas
-- ────────────────────────────────────────────────────────────────────
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION registrar_intento_login(
    p_email VARCHAR(150),                    -- Email del usuario (identificador único)
    p_exitoso BOOLEAN DEFAULT FALSE,         -- TRUE = éxito, FALSE = fallo
    p_ip_address INET DEFAULT NULL           -- IP del cliente (auditoría futura)
) RETURNS VOID AS $$
DECLARE
    usuario_id INTEGER;                      -- ID del usuario encontrado
    org_id INTEGER;                          -- ID de organización (para logs futuros)
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 1: CONFIGURAR BYPASS RLS
    -- ═══════════════════════════════════════════════════════════════════
    -- Necesario para que la función pueda actualizar usuarios sin
    -- restricciones de tenant (función de sistema crítica)
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 2: OBTENER INFORMACIÓN DEL USUARIO
    -- ═══════════════════════════════════════════════════════════════════
    SELECT u.id, u.organizacion_id INTO usuario_id, org_id
    FROM usuarios u
    WHERE u.email = p_email AND u.activo = TRUE;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 3: PROCESAR RESULTADO DEL LOGIN
    -- ═══════════════════════════════════════════════════════════════════
    IF usuario_id IS NOT NULL THEN
        IF p_exitoso THEN
            -- ┌─────────────────────────────────────────────────────────┐
            -- │ LOGIN EXITOSO: Resetear seguridad y actualizar acceso  │
            -- └─────────────────────────────────────────────────────────┘
            UPDATE usuarios
            SET ultimo_login = NOW(),             -- Timestamp del acceso
                intentos_fallidos = 0,            -- Resetear contador
                bloqueado_hasta = NULL,           -- Quitar bloqueo si existía
                actualizado_en = NOW()            -- Actualizar timestamp
            WHERE id = usuario_id;
        ELSE
            -- ┌─────────────────────────────────────────────────────────┐
            -- │ LOGIN FALLIDO: Incrementar contador y evaluar bloqueo  │
            -- └─────────────────────────────────────────────────────────┘
            UPDATE usuarios
            SET intentos_fallidos = intentos_fallidos + 1,
                -- LÓGICA DE BLOQUEO: 30 min tras 5 intentos (índice 4)
                bloqueado_hasta = CASE
                    WHEN intentos_fallidos >= 4 THEN NOW() + INTERVAL '30 minutes'
                    ELSE bloqueado_hasta
                END,
                actualizado_en = NOW()
            WHERE id = usuario_id;
        END IF;

        -- ═══════════════════════════════════════════════════════════════════
        -- FASE 4: LOGGING Y AUDITORÍA EN EVENTOS_SISTEMA
        -- ═══════════════════════════════════════════════════════════════════
        -- Registrar evento de intento de login en la tabla de auditoría
        -- Solo para usuarios con organización (no super_admin)
        -- TRY/CATCH para evitar que errores en logging bloqueen autenticación
        IF org_id IS NOT NULL THEN
            BEGIN
                INSERT INTO eventos_sistema (
                    organizacion_id, tipo_evento, descripcion, metadata,
                    usuario_id, ip_address, gravedad
                ) VALUES (
                    org_id,
                    CASE WHEN p_exitoso THEN 'login_success'::tipo_evento_sistema
                         ELSE 'login_failed'::tipo_evento_sistema END,
                    CASE WHEN p_exitoso THEN 'Login exitoso registrado'
                         ELSE 'Intento de login fallido registrado' END,
                    jsonb_build_object(
                        'exitoso', p_exitoso,
                        'email', p_email,
                        'intentos_previos', CASE WHEN NOT p_exitoso THEN
                            (SELECT intentos_fallidos FROM usuarios WHERE id = usuario_id) + 1
                            ELSE 0 END,
                        'bloqueado', CASE WHEN NOT p_exitoso THEN
                            (SELECT intentos_fallidos FROM usuarios WHERE id = usuario_id) >= 4
                            ELSE false END
                    ),
                    usuario_id,
                    p_ip_address,
                    CASE WHEN p_exitoso THEN 'info' ELSE 'warning' END
                );
            EXCEPTION
                WHEN OTHERS THEN
                    -- Logging falló, pero no interrumpir autenticación (crítica)
                    RAISE WARNING 'Error al registrar evento de login: %', SQLERRM;
            END;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 5: LIMPIAR CONFIGURACIÓN RLS
    -- ═══════════════════════════════════════════════════════════════════
    PERFORM set_config('app.bypass_rls', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION registrar_intento_login(VARCHAR, BOOLEAN, INET) IS 'Registra intentos de login exitosos o fallidos. Gestiona bloqueo automático tras 5 intentos fallidos';

-- ====================================================================
-- 🧹 FUNCIÓN 2: LIMPIAR_TOKENS_RESET_EXPIRADOS
-- ====================================================================
-- Función de MANTENIMIENTO automático para limpiar tokens expirados.
-- Debe ejecutarse periódicamente (cron job o scheduled task).
--
-- 🎯 PROPÓSITO:
-- • Eliminar tokens de reset de contraseña que ya expiraron
-- • Liberar espacio y mejorar seguridad
-- • Mantener la tabla limpia de datos obsoletos
--
-- 📊 RETORNA: Cantidad de tokens limpiados (para logging)
--
-- ⏰ EJECUCIÓN RECOMENDADA: Cada hora o cada 6 horas
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION limpiar_tokens_reset_expirados()
RETURNS INTEGER AS $$
DECLARE
    tokens_limpiados INTEGER;                -- Contador de registros afectados
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 1: CONFIGURAR BYPASS RLS
    -- ═══════════════════════════════════════════════════════════════════
    -- Función de mantenimiento necesita acceso global a todos los usuarios
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 2: LIMPIAR TOKENS EXPIRADOS
    -- ═══════════════════════════════════════════════════════════════════
    UPDATE usuarios
    SET token_reset_password = NULL,          -- Limpiar token
        token_reset_expira = NULL,            -- Limpiar fecha expiración
        actualizado_en = NOW()                -- Actualizar timestamp
    WHERE token_reset_expira < NOW()          -- Solo tokens ya expirados
    AND token_reset_password IS NOT NULL;    -- Solo usuarios con token activo

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 3: OBTENER CANTIDAD DE REGISTROS AFECTADOS
    -- ═══════════════════════════════════════════════════════════════════
    GET DIAGNOSTICS tokens_limpiados = ROW_COUNT;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 4: LOGGING DE MANTENIMIENTO EN EVENTOS_SISTEMA
    -- ═══════════════════════════════════════════════════════════════════
    -- Registrar evento de limpieza automática (solo si se limpiaron tokens)
    -- Evento de sistema (organizacion_id = NULL)
    IF tokens_limpiados > 0 THEN
        INSERT INTO eventos_sistema (
            organizacion_id, tipo_evento, descripcion, metadata, gravedad
        ) VALUES (
            NULL, -- Evento de sistema (no pertenece a organización específica)
            'tokens_limpiados'::tipo_evento_sistema,
            'Limpieza automática de tokens de reset expirados ejecutada',
            jsonb_build_object(
                'tokens_limpiados', tokens_limpiados,
                'ejecutado_automaticamente', true,
                'funcion', 'limpiar_tokens_reset_expirados'
            ),
            'info'
        );
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 5: LIMPIAR CONFIGURACIÓN RLS
    -- ═══════════════════════════════════════════════════════════════════
    PERFORM set_config('app.bypass_rls', 'false', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 6: RETORNAR RESULTADO
    -- ═══════════════════════════════════════════════════════════════════
    RETURN tokens_limpiados;
END;
$$ LANGUAGE plpgsql;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION limpiar_tokens_reset_expirados() IS
'Función de mantenimiento. Limpia tokens de reset de contraseña expirados. Debe ejecutarse periódicamente via cron job';
-- 🔓 FUNCIÓN 3: DESBLOQUEAR_USUARIOS_AUTOMATICO
-- ====================================================================
-- Función para desbloquear usuarios automáticamente
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION desbloquear_usuarios_automatico()
RETURNS INTEGER AS $$
DECLARE
    usuarios_desbloqueados INTEGER;
BEGIN
    -- Configurar bypass RLS para función de mantenimiento
    PERFORM set_config('app.bypass_rls', 'true', true);

    UPDATE usuarios
    SET bloqueado_hasta = NULL,
        intentos_fallidos = 0,
        actualizado_en = NOW()
    WHERE bloqueado_hasta < NOW()
    AND bloqueado_hasta IS NOT NULL;

    GET DIAGNOSTICS usuarios_desbloqueados = ROW_COUNT;

    -- Log del mantenimiento (se agregará eventos_sistema en fase posterior)
    -- TODO: Implementar log de mantenimiento cuando eventos_sistema esté disponible

    -- Limpiar bypass RLS
    PERFORM set_config('app.bypass_rls', 'false', true);

    RETURN usuarios_desbloqueados;
END;
$$ LANGUAGE plpgsql;
-- 📧 FUNCIÓN 4: VALIDAR_EMAIL_USUARIO
-- ====================================================================
-- Función para validar email único globalmente
-- Complementa el CONSTRAINT usuarios_email_key con mensajes más claros
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_email_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Email debe ser único globalmente (complementa el CONSTRAINT usuarios_email_key)
    -- Esta función provee mensajes de error más claros que el constraint
    IF EXISTS (
        SELECT 1 FROM usuarios
        WHERE email = NEW.email
        AND id != COALESCE(NEW.id, 0)
        AND activo = TRUE
    ) THEN
        RAISE EXCEPTION 'El email % ya está registrado en el sistema', NEW.email;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- 🔒 SEGURIDAD: Password aleatorio de 32 bytes (bcrypt)
-- 📧 EMAIL: bot@org{id}.internal (único por organización)
-- ⚡ TRIGGER: AFTER INSERT en tabla organizaciones
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_usuario_bot_organizacion()
RETURNS TRIGGER AS $$
DECLARE
    bot_email VARCHAR(150);
    bot_nombre VARCHAR(255);
    random_password TEXT;
    v_rol_bot_id INTEGER;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 1: GENERAR EMAIL Y NOMBRE DEL BOT
    -- ═══════════════════════════════════════════════════════════════════
    -- Email único: bot@org1.internal, bot@org2.internal, etc.
    bot_email := 'bot@org' || NEW.id || '.internal';

    -- Nombre descriptivo: "Bot IA - Mi Barbería"
    bot_nombre := 'Bot IA - ' || NEW.nombre_comercial;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 2: GENERAR PASSWORD ALEATORIO
    -- ═══════════════════════════════════════════════════════════════════
    -- Password de 32 bytes aleatorios (256 bits)
    -- Nota: Este password NO se usa (autenticación vía JWT automático)
    -- pero debe existir por constraint NOT NULL en tabla usuarios
    random_password := encode(gen_random_bytes(32), 'hex');

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 2.5: OBTENER ROL_ID DEL BOT (FASE 7)
    -- ═══════════════════════════════════════════════════════════════════
    SELECT id INTO v_rol_bot_id FROM roles WHERE codigo = 'bot' AND es_rol_sistema = TRUE;

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 3: CREAR USUARIO BOT
    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 7: Solo usar rol_id, sin columna rol ENUM
    INSERT INTO usuarios (
        email,
        password_hash,
        nombre,
        rol_id,
        organizacion_id,
        activo,
        email_verificado,
        creado_en,
        actualizado_en
    ) VALUES (
        bot_email,
        crypt(random_password, gen_salt('bf')),  -- bcrypt hash
        bot_nombre,
        v_rol_bot_id,
        NEW.id,
        true,   -- Auto-activado (listo para usar)
        true,   -- Email pre-verificado (usuario de sistema)
        NOW(),
        NOW()
    );

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 4: LOG INFORMATIVO (OPCIONAL)
    -- ═══════════════════════════════════════════════════════════════════
    RAISE NOTICE 'Usuario bot creado automáticamente: % para organización %',
        bot_email, NEW.nombre_comercial;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION crear_usuario_bot_organizacion() IS
'Crea automáticamente un usuario con rol bot al insertar una organización.
Este usuario es usado por chatbots de IA para autenticación vía MCP Server.
Email formato: bot@org{id}.internal
Password: 32 bytes aleatorios (bcrypt)
Trigger: AFTER INSERT en tabla organizaciones
Creado: 2025-10-22 - Sistema de chatbots multi-plataforma';
-- 🔍 FUNCIÓN: OBTENER_USUARIO_BOT
-- ====================================================================
-- Función auxiliar para obtener el usuario bot de una organización.
-- Retorna el ID y email del usuario bot activo.
--
-- 🎯 USO: Backend al generar JWT para MCP Server
-- ⚡ PERFORMANCE: Optimizado con índice idx_usuarios_rol_org
-- 🔒 SEGURIDAD: Usa bypass RLS para búsqueda de sistema
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_usuario_bot(p_organizacion_id INTEGER)
RETURNS TABLE (
    usuario_id INTEGER,
    email VARCHAR(150),
    nombre VARCHAR(255)
) AS $$
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- CONFIGURAR BYPASS RLS
    -- ═══════════════════════════════════════════════════════════════════
    -- Necesario para que la función pueda buscar usuarios sin
    -- restricciones de tenant (función de sistema)
    PERFORM set_config('app.bypass_rls', 'true', true);

    -- ═══════════════════════════════════════════════════════════════════
    -- BUSCAR USUARIO BOT
    -- ═══════════════════════════════════════════════════════════════════
    -- Performance: Usa índice idx_usuarios_rol_org (parcial)
    -- Expectativa: Exactamente 1 registro por organización
    -- FASE 7: Cambiado de u.rol ENUM a JOIN con tabla roles
    RETURN QUERY
    SELECT
        u.id,
        u.email,
        u.nombre
    FROM usuarios u
    JOIN roles r ON r.id = u.rol_id
    WHERE r.codigo = 'bot'
      AND u.organizacion_id = p_organizacion_id
      AND u.activo = true
    LIMIT 1;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDACIÓN (OPCIONAL)
    -- ═══════════════════════════════════════════════════════════════════
    -- Si no se encuentra usuario bot, podría indicar problema de datos
    IF NOT FOUND THEN
        RAISE WARNING 'No se encontró usuario bot para organización %', p_organizacion_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION obtener_usuario_bot(INTEGER) IS
'Obtiene el usuario bot activo de una organización.
Usado por backend al generar JWT para autenticación de MCP Server.
Performance: O(1) gracias a índice idx_usuarios_rol_org.
Security: SECURITY DEFINER permite bypass RLS controlado.
Retorna: (usuario_id, email, nombre) o NULL si no existe.
Creado: 2025-10-22 - Sistema de chatbots multi-plataforma';

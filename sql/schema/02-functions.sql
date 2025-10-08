-- ====================================================================
-- ⚡ FUNCIONES PL/pgSQL DEL SISTEMA SAAS
-- ====================================================================
--
-- Este archivo contiene todas las funciones PL/pgSQL especializadas
-- del sistema, organizadas por funcionalidad.
--
-- 📊 CONTENIDO:
-- • Funciones de autenticación y seguridad
-- • Funciones de mantenimiento automático  
-- • Funciones de validación y coherencia
-- • Funciones de timestamp automático
-- • Funciones operacionales (horarios, limpieza)
--
-- 🔄 ORDEN DE EJECUCIÓN: #2 (Después de types-and-enums)
-- ⚡ CARACTERÍSTICAS: 13 funciones con bypass RLS controlado
-- ====================================================================

-- ====================================================================
-- 🔍 EXTENSIONES PARA BÚSQUEDA AVANZADA
-- ====================================================================
-- Extensiones necesarias para las funciones de búsqueda fuzzy en modelos
-- ────────────────────────────────────────────────────────────────────

-- Extensión para búsqueda fuzzy (funciones similarity() y trigrama)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extensión para normalización de texto sin acentos
CREATE EXTENSION IF NOT EXISTS unaccent;

-- ====================================================================
-- 🔐 FUNCIÓN 1: REGISTRAR_INTENTO_LOGIN
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
        -- TRY/CATCH para evitar que errores en logging bloqueen autenticación
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

    -- ═══════════════════════════════════════════════════════════════════
    -- FASE 5: LIMPIAR CONFIGURACIÓN RLS
    -- ═══════════════════════════════════════════════════════════════════
    PERFORM set_config('app.bypass_rls', 'false', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION registrar_intento_login(VARCHAR, BOOLEAN, INET) IS
'Función crítica de autenticación. Registra intentos de login y aplica políticas de bloqueo automático de seguridad';

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

-- ====================================================================
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

-- ====================================================================
-- 📧 FUNCIÓN 4: VALIDAR_EMAIL_USUARIO
-- ====================================================================
-- Función para validar email único por organización
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_email_usuario()
RETURNS TRIGGER AS $$
BEGIN
    -- Para super_admin, email debe ser único globalmente
    IF NEW.rol = 'super_admin' THEN
        IF EXISTS (
            SELECT 1 FROM usuarios
            WHERE email = NEW.email
            AND id != COALESCE(NEW.id, 0)
            AND activo = TRUE
        ) THEN
            RAISE EXCEPTION 'Email ya existe en el sistema';
        END IF;
    ELSE
        -- Para otros roles, email único por organización
        IF EXISTS (
            SELECT 1 FROM usuarios
            WHERE email = NEW.email
            AND organizacion_id = NEW.organizacion_id
            AND id != COALESCE(NEW.id, 0)
            AND activo = TRUE
        ) THEN
            RAISE EXCEPTION 'Email ya existe en esta organización';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- ⏰ FUNCIÓN 5: ACTUALIZAR_TIMESTAMP
-- ====================================================================
-- Función para actualizar timestamp automáticamente
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🏭 FUNCIÓN 6: VALIDAR_PROFESIONAL_INDUSTRIA
-- ====================================================================
-- Función para validar compatibilidad tipo profesional con industria
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_profesional_industria()
RETURNS TRIGGER AS $$
DECLARE
    industria_org industria_tipo;
BEGIN
    -- Obtener la industria de la organización
    SELECT tipo_industria INTO industria_org
    FROM organizaciones
    WHERE id = NEW.organizacion_id;

    -- Validar compatibilidad según industria
    CASE industria_org
        WHEN 'barberia' THEN
            IF NEW.tipo_profesional NOT IN ('barbero', 'estilista_masculino', 'estilista') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria barberia', NEW.tipo_profesional;
            END IF;

        WHEN 'salon_belleza' THEN
            IF NEW.tipo_profesional NOT IN ('estilista', 'colorista', 'manicurista', 'peinados_eventos') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria salon_belleza', NEW.tipo_profesional;
            END IF;

        WHEN 'estetica' THEN
            IF NEW.tipo_profesional NOT IN ('esteticista', 'cosmetologo', 'depilacion_laser') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria estetica', NEW.tipo_profesional;
            END IF;

        WHEN 'spa' THEN
            IF NEW.tipo_profesional NOT IN ('masajista', 'terapeuta_spa', 'aromaterapeuta', 'reflexologo') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria spa', NEW.tipo_profesional;
            END IF;

        WHEN 'podologia' THEN
            IF NEW.tipo_profesional NOT IN ('podologo', 'asistente_podologia') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria podologia', NEW.tipo_profesional;
            END IF;

        WHEN 'consultorio_medico' THEN
            IF NEW.tipo_profesional NOT IN ('doctor_general', 'enfermero', 'recepcionista_medica') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria consultorio_medico', NEW.tipo_profesional;
            END IF;

        WHEN 'academia' THEN
            IF NEW.tipo_profesional NOT IN ('instructor', 'profesor', 'tutor') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria academia', NEW.tipo_profesional;
            END IF;

        WHEN 'taller_tecnico' THEN
            IF NEW.tipo_profesional NOT IN ('tecnico_auto', 'tecnico_electronico', 'mecanico', 'soldador') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria taller_tecnico', NEW.tipo_profesional;
            END IF;

        WHEN 'centro_fitness' THEN
            IF NEW.tipo_profesional NOT IN ('entrenador_personal', 'instructor_yoga', 'instructor_pilates', 'nutricionista') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria centro_fitness', NEW.tipo_profesional;
            END IF;

        WHEN 'veterinaria' THEN
            IF NEW.tipo_profesional NOT IN ('veterinario', 'asistente_veterinario', 'groomer') THEN
                RAISE EXCEPTION 'Tipo profesional % no compatible con industria veterinaria', NEW.tipo_profesional;
            END IF;

        WHEN 'otro' THEN
            -- Para industria "otro", permitir cualquier tipo profesional incluido "otro"
            NULL;

        ELSE
            RAISE EXCEPTION 'Industria % no reconocida', industria_org;
    END CASE;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentario de la función
COMMENT ON FUNCTION validar_profesional_industria() IS
'Valida automáticamente que el tipo_profesional sea compatible con la industria de la organización. Previene asignaciones incorrectas';

-- ====================================================================
-- 🛍️ FUNCIÓN 7: ACTUALIZAR_TIMESTAMP_SERVICIOS
-- ====================================================================
-- Función para actualizar timestamp en servicios
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp_servicios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en funciones
COMMENT ON FUNCTION actualizar_timestamp_servicios() IS
'Actualiza automáticamente el campo actualizado_en cuando se modifica un servicio o relación servicio-profesional';

-- ====================================================================
-- 📅 FUNCIÓN 8: ACTUALIZAR_TIMESTAMP_CITAS
-- ====================================================================
-- Función para actualizar timestamp y versión en citas
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp_citas()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🛡️ FUNCIÓN 9: VALIDAR_COHERENCIA_CITA
-- ====================================================================
-- Función para validar coherencia organizacional en citas
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_coherencia_cita()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypasea RLS para poder validar coherencia entre organizaciones
SET search_path = public
AS $$
DECLARE
    cliente_org INTEGER;
    profesional_org INTEGER;
    servicio_org INTEGER;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL CLIENTE
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO cliente_org
    FROM clientes
    WHERE id = NEW.cliente_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Cliente con ID % no existe', NEW.cliente_id
            USING HINT = 'Verificar que el cliente esté registrado en la base de datos',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF cliente_org != NEW.organizacion_id THEN
        RAISE EXCEPTION 'Incoherencia organizacional: cliente % (org:%) no pertenece a organización %',
            NEW.cliente_id, cliente_org, NEW.organizacion_id
            USING HINT = 'El cliente debe pertenecer a la misma organización que la cita';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL PROFESIONAL
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO profesional_org
    FROM profesionales
    WHERE id = NEW.profesional_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profesional con ID % no existe', NEW.profesional_id
            USING HINT = 'Verificar que el profesional esté registrado en la base de datos',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF profesional_org != NEW.organizacion_id THEN
        RAISE EXCEPTION 'Incoherencia organizacional: profesional % (org:%) no pertenece a organización %',
            NEW.profesional_id, profesional_org, NEW.organizacion_id
            USING HINT = 'El profesional debe pertenecer a la misma organización que la cita';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL SERVICIO
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO servicio_org
    FROM servicios
    WHERE id = NEW.servicio_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Servicio con ID % no existe', NEW.servicio_id
            USING HINT = 'Verificar que el servicio esté registrado en la base de datos',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF servicio_org != NEW.organizacion_id THEN
        RAISE EXCEPTION 'Incoherencia organizacional: servicio % (org:%) no pertenece a organización %',
            NEW.servicio_id, servicio_org, NEW.organizacion_id
            USING HINT = 'El servicio debe pertenecer a la misma organización que la cita';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en funciones
COMMENT ON FUNCTION actualizar_timestamp_citas() IS 'Actualiza automáticamente timestamp y versión al modificar una cita';
COMMENT ON FUNCTION validar_coherencia_cita() IS 'Versión mejorada con validación de existencia de registros. Valida que cliente, profesional y servicio existan y pertenezcan a la misma organización. Incluye mensajes de error descriptivos con HINT y ERRCODE apropiados';

-- ====================================================================
-- 🗓️ FUNCIÓN 10: ACTUALIZAR_TIMESTAMP_HORARIOS
-- ====================================================================
-- Función para actualizar timestamp y versión en horarios
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION actualizar_timestamp_horarios()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en = NOW();
    NEW.version = OLD.version + 1;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🛡️ FUNCIÓN 11: VALIDAR_COHERENCIA_HORARIO
-- ====================================================================
-- Función para validar coherencia organizacional en horarios
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_coherencia_horario()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypasea RLS para poder validar coherencia entre organizaciones
SET search_path = public
AS $$
DECLARE
    profesional_org INTEGER;
    servicio_org INTEGER;
    cita_org INTEGER;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR EXISTENCIA Y COHERENCIA DEL PROFESIONAL
    -- ═══════════════════════════════════════════════════════════════════
    SELECT organizacion_id INTO profesional_org
    FROM profesionales
    WHERE id = NEW.profesional_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Profesional con ID % no existe', NEW.profesional_id
            USING HINT = 'Verificar que el profesional esté registrado',
                  ERRCODE = 'foreign_key_violation';
    END IF;

    IF NEW.organizacion_id != profesional_org THEN
        RAISE EXCEPTION 'Incoherencia organizacional: profesional % (org:%) debe pertenecer a organización %',
            NEW.profesional_id, profesional_org, NEW.organizacion_id
            USING HINT = 'El profesional debe pertenecer a la organización del horario';
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR SERVICIO SI ESTÁ ESPECIFICADO
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.servicio_id IS NOT NULL THEN
        SELECT organizacion_id INTO servicio_org
        FROM servicios
        WHERE id = NEW.servicio_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Servicio con ID % no existe', NEW.servicio_id
                USING HINT = 'Verificar que el servicio esté registrado',
                      ERRCODE = 'foreign_key_violation';
        END IF;

        IF NEW.organizacion_id != servicio_org THEN
            RAISE EXCEPTION 'Incoherencia organizacional: servicio % (org:%) debe pertenecer a organización %',
                NEW.servicio_id, servicio_org, NEW.organizacion_id
                USING HINT = 'El servicio debe pertenecer a la organización del horario';
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR CITA SI ESTÁ ESPECIFICADA
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.cita_id IS NOT NULL THEN
        SELECT organizacion_id INTO cita_org
        FROM citas
        WHERE id = NEW.cita_id;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Cita con ID % no existe', NEW.cita_id
                USING HINT = 'Verificar que la cita esté registrada',
                      ERRCODE = 'foreign_key_violation';
        END IF;

        IF NEW.organizacion_id != cita_org THEN
            RAISE EXCEPTION 'Incoherencia organizacional: cita % (org:%) debe pertenecer a organización %',
                NEW.cita_id, cita_org, NEW.organizacion_id
                USING HINT = 'La cita debe pertenecer a la organización del horario';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_coherencia_horario() IS 'Versión mejorada con validación de existencia de registros. Valida que profesional, servicio y cita existan y pertenezcan a la misma organización. Incluye mensajes de error descriptivos con HINT y ERRCODE apropiados';

-- ====================================================================
-- 🔒 FUNCIÓN 11B: VALIDAR_RESERVA_FUTURA_INSERT
-- ====================================================================
-- Valida que reservado_hasta sea futura SOLO en INSERT
-- Permite UPDATE para tests de expiración
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_reserva_futura_insert()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    -- Solo validar en INSERT (no en UPDATE)
    IF TG_OP = 'INSERT' AND NEW.reservado_hasta IS NOT NULL THEN
        IF NEW.reservado_hasta < NOW() THEN
            RAISE EXCEPTION 'reservado_hasta debe ser una fecha futura'
                USING HINT = 'La fecha de reserva ya expiró',
                      ERRCODE = '23514'; -- check_violation
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION validar_reserva_futura_insert() IS 'Valida que reservado_hasta sea futura SOLO en INSERT. Permite UPDATE para simular expiración en tests. Reemplaza constraint CHECK valid_reserva_futura';

-- ====================================================================
-- 🧹 FUNCIÓN 12: LIMPIAR_RESERVAS_EXPIRADAS
-- ====================================================================
-- Función de limpieza automática de reservas expiradas
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION limpiar_reservas_expiradas()
RETURNS INTEGER AS $$
DECLARE
    reservas_limpiadas INTEGER;
BEGIN
    UPDATE horarios_disponibilidad
    SET estado = 'disponible',
        reservado_hasta = NULL,
        reservado_por = NULL,
        session_id = NULL,
        token_reserva = NULL,
        capacidad_ocupada = 0
    WHERE estado = 'reservado_temporal'
    AND reservado_hasta < NOW();

    GET DIAGNOSTICS reservas_limpiadas = ROW_COUNT;
    RETURN reservas_limpiadas;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 🔄 FUNCIÓN 13: GENERAR_HORARIOS_RECURRENTES
-- ====================================================================
-- Función para generar horarios recurrentes
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generar_horarios_recurrentes(
    p_profesional_id INTEGER,
    p_fecha_inicio DATE,
    p_fecha_fin DATE
) RETURNS INTEGER AS $$
DECLARE
    horario_base RECORD;
    fecha_actual DATE;
    horarios_creados INTEGER := 0;
BEGIN
    -- Obtener horarios base recurrentes
    FOR horario_base IN
        SELECT * FROM horarios_disponibilidad
        WHERE profesional_id = p_profesional_id
        AND es_recurrente = TRUE
        AND tipo_horario = 'regular'
        AND (fecha_fin_recurrencia IS NULL OR fecha_fin_recurrencia >= p_fecha_inicio)
    LOOP
        fecha_actual := p_fecha_inicio;

        WHILE fecha_actual <= p_fecha_fin LOOP
            -- Verificar si corresponde al día de la semana
            IF EXTRACT(DOW FROM fecha_actual) = horario_base.dia_semana THEN
                -- Insertar horario si no existe
                INSERT INTO horarios_disponibilidad (
                    organizacion_id, profesional_id, servicio_id,
                    tipo_horario, fecha, hora_inicio, hora_fin, zona_horaria,
                    estado, duracion_slot, capacidad_maxima,
                    precio_base, es_horario_premium,
                    creado_automaticamente, algoritmo_creacion,
                    creado_por
                ) VALUES (
                    horario_base.organizacion_id, horario_base.profesional_id, horario_base.servicio_id,
                    'franja_especifica', fecha_actual, horario_base.hora_inicio, horario_base.hora_fin, horario_base.zona_horaria,
                    'disponible', horario_base.duracion_slot, horario_base.capacidad_maxima,
                    horario_base.precio_base, horario_base.es_horario_premium,
                    TRUE, 'sistema_recurrencia',
                    horario_base.creado_por
                )
                ON CONFLICT (profesional_id, fecha, hora_inicio) DO NOTHING;

                horarios_creados := horarios_creados + 1;
            END IF;

            fecha_actual := fecha_actual + INTERVAL '1 day';
        END LOOP;
    END LOOP;

    RETURN horarios_creados;
END;
$$ LANGUAGE plpgsql;

-- Comentarios en funciones de horarios
COMMENT ON FUNCTION actualizar_timestamp_horarios() IS 'Actualiza automáticamente timestamp y versión al modificar un horario';
COMMENT ON FUNCTION validar_coherencia_horario() IS 'Valida que profesional, servicio y cita pertenezcan a la misma organización';
COMMENT ON FUNCTION limpiar_reservas_expiradas() IS 'Limpia automáticamente reservas temporales expiradas y libera capacidad';
COMMENT ON FUNCTION generar_horarios_recurrentes(INTEGER, DATE, DATE) IS 'Genera automáticamente horarios específicos basados en patrones recurrentes';

-- ====================================================================
-- 📞 FUNCIÓN 14: NORMALIZAR_TELEFONO
-- ====================================================================
-- Función auxiliar para normalización consistente de números telefónicos.
-- CRÍTICA para las funciones de búsqueda fuzzy del modelo cliente.
--
-- 🎯 PROPÓSITO:
-- • Remover caracteres no numéricos (espacios, guiones, paréntesis)
-- • Remover códigos de país comunes (52 México, 1 USA)
-- • Garantizar consistencia en búsquedas por teléfono
--
-- 📋 PARÁMETROS:
-- • telefono_input: Teléfono en cualquier formato
--
-- 📊 RETORNA: Teléfono normalizado (solo números)
--
-- 🔧 EJEMPLOS DE USO:
-- • normalizar_telefono('+52 55 1234-5678') → '525512345678'
-- • normalizar_telefono('+1 (555) 123-4567') → '15551234567'
-- • normalizar_telefono('55-1234-5678') → '5512345678'
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION normalizar_telefono(telefono_input TEXT)
RETURNS TEXT AS $$
BEGIN
    -- Validar entrada nula
    IF telefono_input IS NULL THEN
        RETURN NULL;
    END IF;

    -- Normalización en dos pasos:
    -- 1. Remover códigos de país comunes (52 México, 1 USA)
    -- 2. Remover todos los caracteres no numéricos
    RETURN regexp_replace(
        regexp_replace(telefono_input, '^(52|1)', ''),
        '[^0-9]', '', 'g'
    );
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION normalizar_telefono(TEXT) IS
'Normaliza números telefónicos removiendo caracteres especiales y códigos de país. Optimizada para búsquedas fuzzy en modelos de cliente';

-- ====================================================================
-- 🔢 FUNCIÓN 15: GENERAR_CODIGO_CITA
-- ====================================================================
-- Función para generar códigos únicos de cita de forma automática.
-- CRÍTICA para integridad de datos y trazabilidad de citas.
--
-- 🎯 PROPÓSITO:
-- • Auto-generar codigo_cita si no se proporciona
-- • Garantizar unicidad con formato estandarizado
-- • Prevenir errores de duplicate key constraint
--
-- 📋 FORMATO:
-- • ORG{id_3digitos}-{YYYYMMDD}-{secuencia_3digitos}
-- • Ejemplo: ORG001-20251003-001
--
-- 🛡️ SEGURIDAD:
-- • Loop de validación previene duplicados
-- • Timestamp fallback si hay colisión
-- • No requiere bypass RLS (usa NEW row)
--
-- 🔧 COMPORTAMIENTO:
-- • Solo genera si codigo_cita es NULL o vacío
-- • Respeta códigos manuales si se proporcionan
-- • Trigger BEFORE INSERT
--
-- ⚡ PERFORMANCE: O(1) en caso normal, O(n) solo si hay colisión
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION generar_codigo_cita()
RETURNS TRIGGER AS $$
DECLARE
    codigo_generado VARCHAR(50);
    contador INTEGER;
    fecha_str VARCHAR(8);
    org_str VARCHAR(10);
BEGIN
    -- Solo generar si el código no viene del cliente
    IF NEW.codigo_cita IS NULL OR NEW.codigo_cita = '' THEN

        -- Formatear organización con padding (ORG001, ORG002, etc)
        org_str := 'ORG' || LPAD(NEW.organizacion_id::TEXT, 3, '0');

        -- Formatear fecha (YYYYMMDD)
        fecha_str := TO_CHAR(NEW.fecha_cita, 'YYYYMMDD');

        -- Obtener contador del día para esta organización
        SELECT COALESCE(COUNT(*), 0) + 1
        INTO contador
        FROM citas
        WHERE organizacion_id = NEW.organizacion_id
        AND fecha_cita = NEW.fecha_cita;

        -- Generar código: ORG001-20251003-001
        codigo_generado := org_str || '-' ||
                          fecha_str || '-' ||
                          LPAD(contador::TEXT, 3, '0');

        -- Si por alguna razón el código ya existe, agregar timestamp
        WHILE EXISTS (SELECT 1 FROM citas WHERE codigo_cita = codigo_generado) LOOP
            codigo_generado := org_str || '-' ||
                              fecha_str || '-' ||
                              LPAD(contador::TEXT, 3, '0') || '-' ||
                              TO_CHAR(NOW(), 'SSSSS'); -- Segundos del día
            contador := contador + 1;
        END LOOP;

        NEW.codigo_cita := codigo_generado;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 📝 COMENTARIO DE FUNCIÓN EN BD
COMMENT ON FUNCTION generar_codigo_cita() IS
'Genera código único para cada cita (formato: ORG001-20251003-001).
Previene duplicados con validación de loop.
Trigger: BEFORE INSERT en tabla citas.
Creado: 2025-10-03 - Corrección crítica para integridad de datos';

-- ====================================================================
-- MODULO NOTIFICACIONES: TRIGGERS
-- ====================================================================
-- Triggers para automatizacion de notificaciones.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER: actualizar_timestamp en preferencias
-- ====================================================================
CREATE TRIGGER trg_notif_prefs_updated_at
    BEFORE UPDATE ON notificaciones_preferencias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trg_notif_prefs_updated_at ON notificaciones_preferencias IS
'Actualiza automaticamente actualizado_en en cada UPDATE.';

-- ====================================================================
-- TRIGGER: actualizar_timestamp en plantillas
-- ====================================================================
CREATE TRIGGER trg_notif_plantillas_updated_at
    BEFORE UPDATE ON notificaciones_plantillas
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

COMMENT ON TRIGGER trg_notif_plantillas_updated_at ON notificaciones_plantillas IS
'Actualiza automaticamente actualizado_en en cada UPDATE.';

-- ====================================================================
-- FUNCION TRIGGER: notificar_cita_nueva
-- ====================================================================
-- Crea notificacion automatica cuando se crea una cita.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_notificar_cita_nueva()
RETURNS TRIGGER AS $$
DECLARE
    v_profesional RECORD;
    v_cliente RECORD;
    v_servicio_nombre TEXT;
BEGIN
    -- Solo para citas nuevas confirmadas o pendientes
    IF NEW.estado NOT IN ('pendiente', 'confirmada') THEN
        RETURN NEW;
    END IF;

    -- Obtener datos del profesional (FIX: usar nombre_completo, no nombre)
    SELECT p.id, p.nombre_completo, p.usuario_id, p.organizacion_id
    INTO v_profesional
    FROM profesionales p
    WHERE p.id = NEW.profesional_id;

    -- Obtener datos del cliente
    SELECT c.nombre
    INTO v_cliente
    FROM clientes c
    WHERE c.id = NEW.cliente_id;

    -- Obtener nombre del servicio principal
    SELECT s.nombre
    INTO v_servicio_nombre
    FROM citas_servicios cs
    JOIN servicios s ON s.id = cs.servicio_id
    WHERE cs.cita_id = NEW.id
    LIMIT 1;

    -- Crear notificacion para el profesional (si tiene usuario)
    IF v_profesional.usuario_id IS NOT NULL THEN
        PERFORM crear_notificacion(
            v_profesional.organizacion_id,
            v_profesional.usuario_id,
            'cita_nueva',
            'citas',
            'Nueva cita agendada',
            COALESCE(v_cliente.nombre, 'Cliente') || ' agendo ' ||
                COALESCE(v_servicio_nombre, 'servicio') || ' para el ' ||
                TO_CHAR(NEW.fecha_cita, 'DD/MM') || ' a las ' ||
                TO_CHAR(NEW.hora_inicio, 'HH24:MI'),
            'info',
            'calendar-plus',
            '/citas',
            'Ver citas',
            'cita',
            NEW.id
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger solo si la tabla citas existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citas') THEN
        DROP TRIGGER IF EXISTS trg_notificar_cita_nueva ON citas;
        CREATE TRIGGER trg_notificar_cita_nueva
            AFTER INSERT ON citas
            FOR EACH ROW
            EXECUTE FUNCTION trigger_notificar_cita_nueva();
    END IF;
END $$;

-- ====================================================================
-- FUNCION TRIGGER: notificar_cita_cancelada
-- ====================================================================
-- Crea notificacion automatica cuando se cancela una cita.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_notificar_cita_cancelada()
RETURNS TRIGGER AS $$
DECLARE
    v_profesional RECORD;
    v_cliente RECORD;
BEGIN
    -- Solo cuando cambia a cancelada
    IF OLD.estado != 'cancelada' AND NEW.estado = 'cancelada' THEN
        -- Obtener datos (FIX: usar nombre_completo, no nombre)
        SELECT p.id, p.nombre_completo, p.usuario_id, p.organizacion_id
        INTO v_profesional
        FROM profesionales p
        WHERE p.id = NEW.profesional_id;

        SELECT c.nombre INTO v_cliente
        FROM clientes c
        WHERE c.id = NEW.cliente_id;

        -- Notificar al profesional
        IF v_profesional.usuario_id IS NOT NULL THEN
            PERFORM crear_notificacion(
                v_profesional.organizacion_id,
                v_profesional.usuario_id,
                'cita_cancelada',
                'citas',
                'Cita cancelada',
                COALESCE(v_cliente.nombre, 'Cliente') || ' cancelo su cita del ' ||
                    TO_CHAR(NEW.fecha_cita, 'DD/MM') || ' a las ' ||
                    TO_CHAR(NEW.hora_inicio, 'HH24:MI'),
                'warning',
                'calendar-x',
                '/citas',
                'Ver citas',
                'cita',
                NEW.id
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger solo si la tabla citas existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'citas') THEN
        DROP TRIGGER IF EXISTS trg_notificar_cita_cancelada ON citas;
        CREATE TRIGGER trg_notificar_cita_cancelada
            AFTER UPDATE ON citas
            FOR EACH ROW
            WHEN (OLD.estado IS DISTINCT FROM NEW.estado)
            EXECUTE FUNCTION trigger_notificar_cita_cancelada();
    END IF;
END $$;

-- ====================================================================
-- FUNCION TRIGGER: notificar_stock_bajo
-- ====================================================================
-- Crea notificacion cuando un producto baja del stock minimo.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_notificar_stock_bajo()
RETURNS TRIGGER AS $$
DECLARE
    v_usuarios RECORD;
    v_producto RECORD;
BEGIN
    -- Solo si el stock bajo del minimo
    IF NEW.stock_actual <= NEW.stock_minimo AND
       (OLD.stock_actual IS NULL OR OLD.stock_actual > OLD.stock_minimo) THEN

        -- Obtener datos del producto
        SELECT p.nombre, p.organizacion_id
        INTO v_producto
        FROM productos p
        WHERE p.id = NEW.id;

        -- Notificar a admins y propietarios de la organizacion
        FOR v_usuarios IN
            SELECT u.id
            FROM usuarios u
            WHERE u.organizacion_id = v_producto.organizacion_id
              AND u.rol IN ('admin', 'propietario')
              AND u.activo = TRUE
        LOOP
            PERFORM crear_notificacion(
                v_producto.organizacion_id,
                v_usuarios.id,
                CASE WHEN NEW.stock_actual <= 0 THEN 'stock_agotado' ELSE 'stock_bajo' END,
                'inventario',
                CASE WHEN NEW.stock_actual <= 0 THEN 'Stock agotado' ELSE 'Stock bajo' END,
                v_producto.nombre || ': ' || NEW.stock_actual || ' unidades' ||
                    CASE WHEN NEW.stock_actual <= 0 THEN '' ELSE ' (minimo: ' || NEW.stock_minimo || ')' END,
                CASE WHEN NEW.stock_actual <= 0 THEN 'error' ELSE 'warning' END,
                CASE WHEN NEW.stock_actual <= 0 THEN 'package-x' ELSE 'package-minus' END,
                '/inventario/productos',
                'Ver productos',
                'producto',
                NEW.id
            );
        END LOOP;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger solo si la tabla productos existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'productos') THEN
        DROP TRIGGER IF EXISTS trg_notificar_stock_bajo ON productos;
        CREATE TRIGGER trg_notificar_stock_bajo
            AFTER UPDATE OF stock_actual ON productos
            FOR EACH ROW
            EXECUTE FUNCTION trigger_notificar_stock_bajo();
    END IF;
END $$;

-- ====================================================================
-- FUNCION TRIGGER: notificar_resena_nueva
-- ====================================================================
-- Crea notificacion cuando se recibe una nueva resena.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_notificar_resena_nueva()
RETURNS TRIGGER AS $$
DECLARE
    v_usuarios RECORD;
    v_nivel VARCHAR(20);
    v_tipo VARCHAR(50);
BEGIN
    -- Determinar tipo y nivel segun calificacion
    IF NEW.calificacion <= 2 THEN
        v_tipo := 'resena_negativa';
        v_nivel := 'warning';
    ELSE
        v_tipo := 'resena_nueva';
        v_nivel := 'info';
    END IF;

    -- Notificar a admins y propietarios
    FOR v_usuarios IN
        SELECT u.id
        FROM usuarios u
        WHERE u.organizacion_id = NEW.organizacion_id
          AND u.rol IN ('admin', 'propietario')
          AND u.activo = TRUE
    LOOP
        PERFORM crear_notificacion(
            NEW.organizacion_id,
            v_usuarios.id,
            v_tipo,
            'marketplace',
            'Nueva resena de ' || NEW.calificacion || ' estrellas',
            COALESCE(NEW.nombre_autor, 'Cliente') || ' dejo una resena' ||
                CASE WHEN NEW.comentario IS NOT NULL
                     THEN ': "' || LEFT(NEW.comentario, 50) || CASE WHEN LENGTH(NEW.comentario) > 50 THEN '..."' ELSE '"' END
                     ELSE ''
                END,
            v_nivel,
            'star',
            '/marketplace/resenas',
            'Ver resenas',
            'resena',
            NEW.id
        );
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear trigger solo si la tabla resenas existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'resenas') THEN
        DROP TRIGGER IF EXISTS trg_notificar_resena_nueva ON resenas;
        CREATE TRIGGER trg_notificar_resena_nueva
            AFTER INSERT ON resenas
            FOR EACH ROW
            WHEN (NEW.estado = 'aprobada' OR NEW.estado = 'pendiente')
            EXECUTE FUNCTION trigger_notificar_resena_nueva();
    END IF;
END $$;

-- ====================================================================
-- JOB PG_CRON: Limpiar notificaciones expiradas
-- ====================================================================
-- Ejecutar cada hora para archivar notificaciones expiradas.
-- ====================================================================
DO $$
BEGIN
    -- Solo crear el job si pg_cron esta disponible
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Eliminar job existente si hay
        PERFORM cron.unschedule('limpiar_notificaciones_expiradas');

        -- Crear nuevo job: cada hora
        PERFORM cron.schedule(
            'limpiar_notificaciones_expiradas',
            '0 * * * *',  -- Cada hora en punto
            'SELECT limpiar_notificaciones_expiradas()'
        );
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'pg_cron no disponible, job de limpieza no creado';
END $$;

-- ====================================================================
-- FIN: TRIGGERS NOTIFICACIONES
-- ====================================================================

-- ====================================================================
-- MODULO SUCURSALES: TRIGGERS
-- ====================================================================
-- Triggers para automatizar operaciones del módulo sucursales.
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TRIGGER: auto_codigo_sucursal
-- ====================================================================
-- Genera código automático si no se proporciona.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_auto_codigo_sucursal()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no tiene código, generar uno
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generar_codigo_sucursal(NEW.organizacion_id);
    END IF;

    -- Actualizar timestamp
    NEW.actualizado_en := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sucursales_before_insert
    BEFORE INSERT ON sucursales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_codigo_sucursal();

CREATE TRIGGER trg_sucursales_before_update
    BEFORE UPDATE ON sucursales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_codigo_sucursal();

-- ====================================================================
-- TRIGGER: auto_codigo_transferencia
-- ====================================================================
-- Genera código automático para transferencias.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_auto_codigo_transferencia()
RETURNS TRIGGER AS $$
BEGIN
    -- Si no tiene código, generar uno
    IF NEW.codigo IS NULL OR NEW.codigo = '' THEN
        NEW.codigo := generar_codigo_transferencia(NEW.organizacion_id);
    END IF;

    -- Actualizar timestamp
    NEW.actualizado_en := NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transferencias_before_insert
    BEFORE INSERT ON transferencias_stock
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_codigo_transferencia();

CREATE TRIGGER trg_transferencias_before_update
    BEFORE UPDATE ON transferencias_stock
    FOR EACH ROW
    EXECUTE FUNCTION trigger_auto_codigo_transferencia();

-- ====================================================================
-- TRIGGER: procesar_cambio_estado_transferencia
-- ====================================================================
-- Procesa cambios de estado en transferencias.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_estado_transferencia()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo procesar si cambió el estado
    IF OLD.estado = NEW.estado THEN
        RETURN NEW;
    END IF;

    -- Transición: borrador -> enviado
    IF OLD.estado = 'borrador' AND NEW.estado = 'enviado' THEN
        -- Registrar fecha de envío
        NEW.fecha_envio := NOW();

        -- Restar stock de origen
        PERFORM procesar_envio_transferencia(NEW.id);
    END IF;

    -- Transición: enviado -> recibido
    IF OLD.estado = 'enviado' AND NEW.estado = 'recibido' THEN
        -- Registrar fecha de recepción
        NEW.fecha_recepcion := NOW();

        -- Sumar stock a destino
        PERFORM procesar_recepcion_transferencia(NEW.id);
    END IF;

    -- Transición: enviado -> cancelado
    IF OLD.estado = 'enviado' AND NEW.estado = 'cancelado' THEN
        -- Devolver stock a origen (proceso inverso)
        -- Nota: Se implementa en backend para mayor control
        NULL;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_transferencias_estado
    BEFORE UPDATE ON transferencias_stock
    FOR EACH ROW
    EXECUTE FUNCTION trigger_estado_transferencia();

-- ====================================================================
-- TRIGGER: crear_sucursal_matriz_automatica
-- ====================================================================
-- Crea sucursal matriz automáticamente al crear organización.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_crear_sucursal_matriz()
RETURNS TRIGGER AS $$
BEGIN
    -- Crear sucursal matriz automáticamente
    INSERT INTO sucursales (
        organizacion_id,
        codigo,
        nombre,
        es_matriz,
        direccion,
        estado_id,
        ciudad_id,
        telefono,
        email,
        zona_horaria
    ) VALUES (
        NEW.id,
        'MATRIZ',
        'Principal',
        TRUE,
        NULL,
        NEW.estado_id,
        NEW.ciudad_id,
        NEW.telefono,
        NEW.email_admin,
        NEW.zona_horaria
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizaciones_crear_sucursal_matriz
    AFTER INSERT ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_crear_sucursal_matriz();

-- ====================================================================
-- TRIGGER: asignar_usuario_sucursal_matriz
-- ====================================================================
-- Asigna usuarios nuevos a la sucursal matriz automáticamente.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_asignar_usuario_sucursal()
RETURNS TRIGGER AS $$
DECLARE
    v_sucursal_matriz_id INTEGER;
BEGIN
    -- Solo para usuarios con organización
    IF NEW.organizacion_id IS NULL THEN
        RETURN NEW;
    END IF;

    -- Obtener sucursal matriz
    v_sucursal_matriz_id := obtener_sucursal_matriz(NEW.organizacion_id);

    -- Si existe sucursal matriz, asignar usuario
    -- FASE 7: Cambiado de NEW.rol ENUM a lookup en tabla roles
    IF v_sucursal_matriz_id IS NOT NULL THEN
        INSERT INTO usuarios_sucursales (
            usuario_id,
            sucursal_id,
            es_gerente
        ) VALUES (
            NEW.id,
            v_sucursal_matriz_id,
            EXISTS (SELECT 1 FROM roles r WHERE r.id = NEW.rol_id AND r.codigo IN ('admin', 'propietario'))
        )
        ON CONFLICT (usuario_id, sucursal_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_usuarios_asignar_sucursal
    AFTER INSERT ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION trigger_asignar_usuario_sucursal();

-- Trigger para UPDATE: cuando un usuario recibe organizacion_id por primera vez
-- Caso: flujo de onboarding donde usuario se crea sin org y después se asigna
CREATE TRIGGER trg_usuarios_asignar_sucursal_update
    AFTER UPDATE OF organizacion_id ON usuarios
    FOR EACH ROW
    WHEN (OLD.organizacion_id IS NULL AND NEW.organizacion_id IS NOT NULL)
    EXECUTE FUNCTION trigger_asignar_usuario_sucursal();

-- ====================================================================
-- TRIGGER: asignar_profesional_sucursal_matriz
-- ====================================================================
-- Asigna profesionales nuevos a la sucursal matriz automáticamente.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_asignar_profesional_sucursal()
RETURNS TRIGGER AS $$
DECLARE
    v_sucursal_matriz_id INTEGER;
BEGIN
    -- Obtener sucursal matriz
    v_sucursal_matriz_id := obtener_sucursal_matriz(NEW.organizacion_id);

    -- Si existe sucursal matriz, asignar profesional
    IF v_sucursal_matriz_id IS NOT NULL THEN
        INSERT INTO profesionales_sucursales (
            profesional_id,
            sucursal_id
        ) VALUES (
            NEW.id,
            v_sucursal_matriz_id
        )
        ON CONFLICT (profesional_id, sucursal_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profesionales_asignar_sucursal
    AFTER INSERT ON profesionales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_asignar_profesional_sucursal();

-- ====================================================================
-- TRIGGER: inicializar_stock_sucursal
-- ====================================================================
-- Al crear un producto, inicializa stock en la sucursal matriz.
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_inicializar_stock_sucursal()
RETURNS TRIGGER AS $$
DECLARE
    v_sucursal_matriz_id INTEGER;
BEGIN
    -- Obtener sucursal matriz
    v_sucursal_matriz_id := obtener_sucursal_matriz(NEW.organizacion_id);

    -- Si existe sucursal matriz, crear registro de stock
    IF v_sucursal_matriz_id IS NOT NULL THEN
        INSERT INTO stock_sucursales (
            producto_id,
            sucursal_id,
            cantidad,
            stock_minimo,
            stock_maximo
        ) VALUES (
            NEW.id,
            v_sucursal_matriz_id,
            NEW.stock_actual,
            NEW.stock_minimo,
            NEW.stock_maximo
        )
        ON CONFLICT (producto_id, sucursal_id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_productos_inicializar_stock
    AFTER INSERT ON productos
    FOR EACH ROW
    EXECUTE FUNCTION trigger_inicializar_stock_sucursal();

-- ====================================================================
-- TRIGGER: actualizar_timestamp_stock
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp_stock()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_stock_sucursales_updated
    BEFORE UPDATE ON stock_sucursales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_stock();

CREATE TRIGGER trg_servicios_sucursales_updated
    BEFORE UPDATE ON servicios_sucursales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_stock();

-- ====================================================================
-- FIN: TRIGGERS DE SUCURSALES
-- ====================================================================

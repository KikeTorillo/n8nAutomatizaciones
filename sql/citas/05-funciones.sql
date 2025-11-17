-- ====================================================================
-- 📅 MÓDULO CITAS - FUNCIONES
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: 16 Noviembre 2025
-- Módulo: citas
--
-- DESCRIPCIÓN:
-- Funciones especializadas para gestión de citas y validaciones automáticas.
-- Automatizan validaciones de integridad y actualizaciones de timestamps.
--
-- FUNCIONES:
-- • generar_codigo_cita(): Auto-generación de código único (ORG001-20251116-001)
-- • actualizar_timestamp_citas(): Actualiza timestamp y versión automáticamente
-- • validar_coherencia_cita(): Valida que cliente y profesional pertenezcan a la misma org
--
-- ====================================================================

-- ====================================================================
-- 🔑 FUNCIÓN: GENERAR_CODIGO_CITA
-- ====================================================================
-- Genera código único automáticamente para cada cita si no se proporciona
-- Formato: ORG001-20251116-001 (org-fecha-contador)
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

-- ====================================================================
-- 🔄 FUNCIÓN: ACTUALIZAR_TIMESTAMP_CITAS
-- ====================================================================
-- Actualiza automáticamente timestamp y versión al modificar una cita
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
-- 🛡️ FUNCIÓN: VALIDAR_COHERENCIA_CITA
-- ====================================================================
-- Valida que cliente y profesional pertenezcan a la misma organización
-- ────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION validar_coherencia_cita()
RETURNS TRIGGER
SECURITY DEFINER  -- Bypasea RLS para validar coherencia entre organizaciones
SET search_path = public
AS $$
DECLARE
    cliente_org INTEGER;
    profesional_org INTEGER;
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

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- 📝 COMENTARIOS DE FUNCIONES
-- ====================================================================

COMMENT ON FUNCTION generar_codigo_cita() IS
'Genera código único para cada cita (formato: ORG001-20251116-001).
Previene duplicados con validación de loop.
Trigger: BEFORE INSERT en tabla citas.
Creado: 2025-10-03 - Corrección crítica para integridad de datos';

COMMENT ON FUNCTION actualizar_timestamp_citas() IS
'Actualiza automáticamente timestamp y versión al modificar una cita.
Usado por: trigger_actualizar_timestamp_citas
Ejecución: BEFORE UPDATE en tabla citas';

COMMENT ON FUNCTION validar_coherencia_cita() IS
'Versión mejorada con validación de existencia de registros.
Valida que cliente y profesional existan y pertenezcan a la misma organización.
Incluye mensajes de error descriptivos con HINT y ERRCODE apropiados.
NOTA: Servicios se validan en tabla citas_servicios (M:N).
Usado por: trigger_validar_coherencia_cita';

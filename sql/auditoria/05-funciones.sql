-- ====================================================================
-- ⚡ MÓDULO AUDITORÍA - FUNCIONES PL/pgSQL
-- ====================================================================
--
-- PROPÓSITO:
-- Funciones para validación, enriquecimiento y utilidades del sistema
-- de auditoría y eventos.
--
-- COMPONENTES:
-- • 3 funciones helper inmutables (extract_date, extract_year, extract_month)
-- • 2 funciones trigger (validar_evento_coherencia, generar_codigo_evento)
--
-- CARACTERÍSTICAS:
-- ✅ Validación de coherencia organizacional
-- ✅ Enriquecimiento automático de metadata
-- ✅ Generación de códigos únicos para eventos críticos
-- ✅ Funciones inmutables para índices funcionales
-- ✅ SECURITY DEFINER para bypass RLS cuando necesario
--
-- ORDEN DE CARGA: #9 (después de RLS)
-- VERSIÓN: 1.0.0
-- FECHA: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- FUNCIÓN 1: EXTRAER FECHA INMUTABLE
-- ====================================================================
-- Función helper inmutable para extraer fecha de timestamp
-- Permite crear índices funcionales si es necesario
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION extract_date_immutable(timestamp_val TIMESTAMPTZ)
RETURNS DATE
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT timestamp_val::DATE;
$$;

COMMENT ON FUNCTION extract_date_immutable(TIMESTAMPTZ) IS
'Función helper inmutable para extraer fecha de timestamp - usar solo si se requieren índices funcionales específicos';

-- ====================================================================
-- FUNCIÓN 2: EXTRAER AÑO INMUTABLE
-- ====================================================================
-- Función helper inmutable para extraer año de timestamp
-- Optimizada para índices funcionales de análisis temporal
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION extract_year_immutable(timestamp_val TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT EXTRACT(YEAR FROM timestamp_val)::INTEGER;
$$;

COMMENT ON FUNCTION extract_year_immutable(TIMESTAMPTZ) IS
'Función helper inmutable para extraer año de timestamp - optimizada para índices';

-- ====================================================================
-- FUNCIÓN 3: EXTRAER MES INMUTABLE
-- ====================================================================
-- Función helper inmutable para extraer mes de timestamp
-- Optimizada para índices funcionales de análisis temporal
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION extract_month_immutable(timestamp_val TIMESTAMPTZ)
RETURNS INTEGER
LANGUAGE SQL
IMMUTABLE
STRICT
AS $$
    SELECT EXTRACT(MONTH FROM timestamp_val)::INTEGER;
$$;

COMMENT ON FUNCTION extract_month_immutable(TIMESTAMPTZ) IS
'Función helper inmutable para extraer mes de timestamp - optimizada para índices';

-- ====================================================================
-- FUNCIÓN 4: VALIDAR COHERENCIA ORGANIZACIONAL
-- ====================================================================
-- Valida que todas las referencias (cita, cliente, profesional, usuario)
-- pertenezcan a la misma organización del evento.
-- También enriquece metadata automáticamente.
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION validar_evento_coherencia()
RETURNS TRIGGER AS $$
DECLARE
    cita_org INTEGER;
    cliente_org INTEGER;
    profesional_org INTEGER;
    usuario_org INTEGER;
    evento_descripcion TEXT;
BEGIN
    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE CITA
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.cita_id IS NOT NULL THEN
        SELECT organizacion_id INTO cita_org
        FROM citas
        WHERE id = NEW.cita_id;

        IF cita_org IS NULL THEN
            RAISE EXCEPTION 'Cita con ID % no existe', NEW.cita_id;
        END IF;

        IF cita_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Cita % (org:%) no pertenece a organización %',
                NEW.cita_id, cita_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE CLIENTE
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.cliente_id IS NOT NULL THEN
        SELECT organizacion_id INTO cliente_org
        FROM clientes
        WHERE id = NEW.cliente_id;

        IF cliente_org IS NULL THEN
            RAISE EXCEPTION 'Cliente con ID % no existe', NEW.cliente_id;
        END IF;

        IF cliente_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Cliente % (org:%) no pertenece a organización %',
                NEW.cliente_id, cliente_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE PROFESIONAL
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.profesional_id IS NOT NULL THEN
        SELECT organizacion_id INTO profesional_org
        FROM profesionales
        WHERE id = NEW.profesional_id;

        IF profesional_org IS NULL THEN
            RAISE EXCEPTION 'Profesional con ID % no existe', NEW.profesional_id;
        END IF;

        IF profesional_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Profesional % (org:%) no pertenece a organización %',
                NEW.profesional_id, profesional_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- VALIDAR COHERENCIA DE USUARIO (EXCEPTO EVENTOS DE LOGIN)
    -- ═══════════════════════════════════════════════════════════════════
    IF NEW.usuario_id IS NOT NULL AND NEW.tipo_evento NOT IN ('login_attempt', 'login_success', 'login_failed') THEN
        SELECT organizacion_id INTO usuario_org
        FROM usuarios
        WHERE id = NEW.usuario_id;

        IF usuario_org IS NULL THEN
            RAISE EXCEPTION 'Usuario con ID % no existe', NEW.usuario_id;
        END IF;

        -- Permitir que super_admin tenga eventos en cualquier organización
        SELECT rol INTO evento_descripcion FROM usuarios WHERE id = NEW.usuario_id;

        IF evento_descripcion != 'super_admin' AND usuario_org != NEW.organizacion_id THEN
            RAISE EXCEPTION 'Evento: Usuario % (org:%) no pertenece a organización %',
                NEW.usuario_id, usuario_org, NEW.organizacion_id;
        END IF;
    END IF;

    -- ═══════════════════════════════════════════════════════════════════
    -- ENRIQUECER METADATA AUTOMÁTICAMENTE
    -- ═══════════════════════════════════════════════════════════════════
    -- Agregar información contextual útil al metadata
    NEW.metadata = NEW.metadata || jsonb_build_object(
        'timestamp_unix', EXTRACT(EPOCH FROM NEW.creado_en),
        'dia_semana', EXTRACT(DOW FROM NEW.creado_en),
        'es_fin_semana', EXTRACT(DOW FROM NEW.creado_en) IN (0, 6),
        'validado_coherencia', true
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION validar_evento_coherencia() IS
'Trigger function: Valida coherencia organizacional de eventos y enriquece metadata automáticamente.
Validaciones:
  1. Cita pertenece a la organización
  2. Cliente pertenece a la organización
  3. Profesional pertenece a la organización
  4. Usuario pertenece a la organización (excepto logins y super_admin)
Enriquecimiento:
  - timestamp_unix, dia_semana, es_fin_semana, validado_coherencia
Se ejecuta BEFORE INSERT/UPDATE.';

-- ====================================================================
-- FUNCIÓN 5: GENERAR CÓDIGO DE EVENTO ÚNICO
-- ====================================================================
-- Genera códigos únicos para eventos importantes que requieren tracking
-- Formato: EVT_[ORG]_[TIPO]_[TIMESTAMP]_[RANDOM]
-- ────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION generar_codigo_evento()
RETURNS TRIGGER AS $$
DECLARE
    codigo_generado VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Solo generar código para eventos críticos
    IF NEW.gravedad IN ('error', 'critical') OR
       NEW.tipo_evento IN ('pago_exitoso', 'pago_fallido', 'cita_creada', 'organizacion_creada') THEN

        -- Generar código único: EVT_ORG_TIPO_TIMESTAMP_RANDOM
        codigo_generado := 'EVT_' ||
                          NEW.organizacion_id || '_' ||
                          UPPER(LEFT(NEW.tipo_evento::TEXT, 8)) || '_' ||
                          TO_CHAR(NOW(), 'YYYYMMDDHH24MISS') || '_' ||
                          LPAD((RANDOM() * 999)::INTEGER::TEXT, 3, '0');

        -- Agregar código al metadata
        NEW.metadata = NEW.metadata || jsonb_build_object('codigo_evento', codigo_generado);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_codigo_evento() IS
'Trigger function: Genera código único para eventos críticos y importantes.
Aplica a:
  - Eventos con gravedad error/critical
  - Eventos: pago_exitoso, pago_fallido, cita_creada, organizacion_creada
Formato: EVT_[ORG]_[TIPO]_[TIMESTAMP]_[RANDOM]
El código se agrega al campo metadata.codigo_evento
Se ejecuta BEFORE INSERT.';

-- ====================================================================
-- 📊 RESUMEN DE FUNCIONES
-- ====================================================================
-- Total: 5 funciones PL/pgSQL
--
-- Por tipo:
-- • 3 Helper functions (inmutables para índices)
-- • 2 Trigger functions (validación + generación)
--
-- Funciones helper (inmutables):
-- • extract_date_immutable() - Extraer fecha
-- • extract_year_immutable() - Extraer año
-- • extract_month_immutable() - Extraer mes
--
-- Trigger functions:
-- • validar_evento_coherencia() - BEFORE INSERT/UPDATE
--   - Valida coherencia organizacional
--   - Enriquece metadata automáticamente
--   - SECURITY DEFINER para acceso completo
--
-- • generar_codigo_evento() - BEFORE INSERT
--   - Genera código único para eventos críticos
--   - Formato: EVT_[ORG]_[TIPO]_[TIMESTAMP]_[RANDOM]
--   - Almacena en metadata.codigo_evento
--
-- Dependencias:
-- • organizaciones, usuarios (validación coherencia)
-- • citas, clientes, profesionales (referencias)
-- ====================================================================

-- ====================================================================
-- MÓDULO EVENTOS DIGITALES - TABLAS
-- ====================================================================
-- Sistema de invitaciones digitales para eventos sociales
-- (bodas, XV años, bautizos, cumpleaños, corporativos)
--
-- Tablas:
-- 1. plantillas_evento - Plantillas de diseño (sin RLS)
-- 2. eventos_digitales - Eventos con invitaciones
-- 3. ubicaciones_evento - Ubicaciones del evento
-- 4. invitados_evento - Invitados con RSVP embebido
-- 5. mesa_regalos_evento - Mesa de regalos
-- 6. felicitaciones_evento - Libro de visitas
--
-- Fecha creación: 4 Diciembre 2025
-- ====================================================================

-- ====================================================================
-- 1. PLANTILLAS DE EVENTO (datos del sistema, sin RLS)
-- ====================================================================
-- Solo super_admin puede crear/editar vía API
CREATE TABLE IF NOT EXISTS plantillas_evento (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    tipo_evento VARCHAR(50) NOT NULL,
    descripcion TEXT,
    preview_url TEXT,

    -- Tema visual de la plantilla
    tema JSONB DEFAULT '{
        "color_primario": "#ec4899",
        "color_secundario": "#fce7f3",
        "color_fondo": "#fdf2f8",
        "color_texto": "#1f2937",
        "color_texto_claro": "#6b7280",
        "fuente_titulo": "Playfair Display",
        "fuente_cuerpo": "Inter"
    }',

    -- HTML/CSS personalizados (opcional, para plantillas avanzadas)
    estructura_html TEXT,
    estilos_css TEXT,

    es_premium BOOLEAN DEFAULT false,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT tipo_evento_plantilla_valido CHECK (
        tipo_evento IN ('boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'universal')
    )
);

COMMENT ON TABLE plantillas_evento IS 'Plantillas de diseño para eventos. Datos del sistema, sin RLS. Solo super_admin puede modificar.';
COMMENT ON COLUMN plantillas_evento.codigo IS 'Código único para identificar la plantilla (ej: elegante-dorado, moderno-minimalista)';
COMMENT ON COLUMN plantillas_evento.tema IS 'Configuración visual: colores primario/secundario/fondo/texto, fuentes título/cuerpo';

-- ====================================================================
-- 2. EVENTOS DIGITALES
-- ====================================================================
CREATE TABLE IF NOT EXISTS eventos_digitales (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plantilla_id INTEGER REFERENCES plantillas_evento(id) ON DELETE SET NULL,

    -- Información básica
    nombre VARCHAR(200) NOT NULL,
    tipo VARCHAR(50) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    descripcion TEXT,

    -- Fechas
    fecha_evento TIMESTAMPTZ NOT NULL,
    hora_evento TIME,
    fecha_fin_evento TIMESTAMPTZ,
    fecha_limite_rsvp TIMESTAMPTZ,

    -- Protagonistas del evento
    protagonistas JSONB DEFAULT '[]',
    -- Ejemplo: [{"nombre": "Juan", "rol": "novio"}, {"nombre": "María", "rol": "novia"}]

    -- Imágenes (URLs de MinIO)
    portada_url TEXT,
    galeria_urls JSONB DEFAULT '[]',

    -- Personalización
    configuracion JSONB DEFAULT '{
        "mostrar_contador": true,
        "mostrar_mapa": true,
        "mostrar_mesa_regalos": true,
        "mostrar_felicitaciones": true,
        "permitir_acompanantes": true,
        "mensaje_confirmacion": "¡Gracias por confirmar tu asistencia!"
    }',

    -- Estado
    estado VARCHAR(20) DEFAULT 'borrador',
    activo BOOLEAN DEFAULT true,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    publicado_en TIMESTAMPTZ,

    -- Constraints
    UNIQUE(organizacion_id, slug),
    CONSTRAINT slug_formato_valido CHECK (slug ~ '^[a-z0-9-]+$'),
    CONSTRAINT estado_evento_valido CHECK (estado IN ('borrador', 'publicado', 'finalizado', 'cancelado')),
    CONSTRAINT tipo_evento_valido CHECK (tipo IN ('boda', 'xv_anos', 'bautizo', 'cumpleanos', 'corporativo', 'otro'))
);

COMMENT ON TABLE eventos_digitales IS 'Eventos con invitaciones digitales. Aislado por organizacion_id via RLS.';
COMMENT ON COLUMN eventos_digitales.slug IS 'Identificador URL-friendly único por organización. Solo minúsculas, números y guiones.';
COMMENT ON COLUMN eventos_digitales.protagonistas IS 'Personas principales del evento (novios, quinceañera, etc.)';
COMMENT ON COLUMN eventos_digitales.configuracion IS 'Opciones de personalización del evento';

-- ====================================================================
-- 3. UBICACIONES DEL EVENTO
-- ====================================================================
CREATE TABLE IF NOT EXISTS ubicaciones_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_digitales(id) ON DELETE CASCADE,

    -- Información de la ubicación
    nombre VARCHAR(100) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'ceremonia',
    descripcion TEXT,
    direccion TEXT,

    -- Coordenadas
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    google_maps_url TEXT,

    -- Horarios
    hora_inicio TIME,
    hora_fin TIME,

    -- Detalles adicionales
    codigo_vestimenta VARCHAR(100),
    notas TEXT,

    -- Control
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT tipo_ubicacion_valido CHECK (
        tipo IN ('ceremonia', 'recepcion', 'fiesta', 'civil', 'religiosa', 'after', 'otro')
    )
);

COMMENT ON TABLE ubicaciones_evento IS 'Ubicaciones del evento (ceremonia, recepción, etc). RLS hereda de eventos_digitales.';
COMMENT ON COLUMN ubicaciones_evento.tipo IS 'Tipo de ubicación: ceremonia, recepcion, fiesta, civil, religiosa, after, otro';

-- ====================================================================
-- 4. INVITADOS DEL EVENTO (con RSVP embebido)
-- ====================================================================
CREATE TABLE IF NOT EXISTS invitados_evento (
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    evento_id INTEGER NOT NULL REFERENCES eventos_digitales(id) ON DELETE CASCADE,

    -- Información del invitado
    nombre VARCHAR(200) NOT NULL,
    email VARCHAR(255),
    telefono VARCHAR(20),
    grupo_familiar VARCHAR(100),
    etiquetas JSONB DEFAULT '[]',
    -- Ejemplo: ["familia", "amigos_novia", "trabajo"]

    -- Control de invitación
    max_acompanantes INTEGER DEFAULT 0,
    token VARCHAR(64) UNIQUE NOT NULL,
    codigo_qr TEXT,

    -- RSVP embebido (evita tabla adicional)
    estado_rsvp VARCHAR(20) DEFAULT 'pendiente',
    num_asistentes INTEGER,
    nombres_acompanantes JSONB DEFAULT '[]',
    mensaje_rsvp TEXT,
    restricciones_dieteticas TEXT,

    -- Tracking de confirmación
    confirmado_en TIMESTAMPTZ,
    confirmado_via VARCHAR(20) DEFAULT 'web',
    ultima_visualizacion TIMESTAMPTZ,
    total_visualizaciones INTEGER DEFAULT 0,

    -- Check-in en evento
    checkin_at TIMESTAMPTZ,

    -- Control
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT estado_rsvp_valido CHECK (estado_rsvp IN ('pendiente', 'confirmado', 'declinado')),
    CONSTRAINT confirmado_via_valido CHECK (confirmado_via IN ('web', 'whatsapp', 'manual', 'qr'))
);

COMMENT ON TABLE invitados_evento IS 'Invitados con RSVP embebido. organizacion_id para RLS directo.';
COMMENT ON COLUMN invitados_evento.token IS 'Token único de 64 caracteres para URL personalizada del invitado';
COMMENT ON COLUMN invitados_evento.etiquetas IS 'Etiquetas para categorizar invitados (familia, amigos, trabajo, etc.)';
COMMENT ON COLUMN invitados_evento.nombres_acompanantes IS 'Nombres de los acompañantes confirmados';
COMMENT ON COLUMN invitados_evento.checkin_at IS 'Timestamp de cuando el invitado hizo check-in en el evento';

-- ====================================================================
-- 5. MESA DE REGALOS
-- ====================================================================
CREATE TABLE IF NOT EXISTS mesa_regalos_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_digitales(id) ON DELETE CASCADE,

    -- Información del regalo
    tipo VARCHAR(20) NOT NULL,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2),
    imagen_url TEXT,
    url_externa TEXT,

    -- Estado de compra
    comprado BOOLEAN DEFAULT FALSE,
    comprado_por VARCHAR(200),
    comprado_en TIMESTAMPTZ,
    mensaje_comprador TEXT,

    -- Control
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT tipo_regalo_valido CHECK (tipo IN ('producto', 'sobre_digital', 'link_externo'))
);

COMMENT ON TABLE mesa_regalos_evento IS 'Mesa de regalos del evento. RLS hereda de eventos_digitales.';
COMMENT ON COLUMN mesa_regalos_evento.tipo IS 'producto: regalo físico, sobre_digital: contribución monetaria, link_externo: enlace a tienda';

-- ====================================================================
-- 6. FELICITACIONES / LIBRO DE VISITAS
-- ====================================================================
CREATE TABLE IF NOT EXISTS felicitaciones_evento (
    id SERIAL PRIMARY KEY,
    evento_id INTEGER NOT NULL REFERENCES eventos_digitales(id) ON DELETE CASCADE,
    invitado_id INTEGER REFERENCES invitados_evento(id) ON DELETE SET NULL,

    -- Contenido
    nombre_autor VARCHAR(100) NOT NULL,
    mensaje TEXT NOT NULL,

    -- Moderación
    aprobado BOOLEAN DEFAULT true,
    reportado BOOLEAN DEFAULT false,
    motivo_reporte TEXT,

    -- Timestamps
    creado_en TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE felicitaciones_evento IS 'Libro de felicitaciones/visitas del evento. RLS hereda de eventos_digitales.';
COMMENT ON COLUMN felicitaciones_evento.aprobado IS 'Si false, no se muestra públicamente. Para moderación.';

-- ====================================================================
-- FUNCIÓN PARA GENERAR SLUG ÚNICO
-- ====================================================================
CREATE OR REPLACE FUNCTION generar_slug_evento(
    p_nombre VARCHAR,
    p_organizacion_id INTEGER
) RETURNS VARCHAR AS $$
DECLARE
    v_slug VARCHAR;
    v_base_slug VARCHAR;
    v_counter INTEGER := 0;
BEGIN
    -- Normalizar: lowercase, remover acentos, reemplazar espacios con guiones
    v_base_slug := lower(
        regexp_replace(
            regexp_replace(
                unaccent(p_nombre),
                '[^a-zA-Z0-9\s-]', '', 'g'
            ),
            '\s+', '-', 'g'
        )
    );

    -- Limitar longitud
    v_base_slug := substring(v_base_slug from 1 for 80);

    -- Remover guiones al inicio/fin
    v_base_slug := trim(both '-' from v_base_slug);

    v_slug := v_base_slug;

    -- Verificar unicidad y agregar sufijo si es necesario
    WHILE EXISTS (
        SELECT 1 FROM eventos_digitales
        WHERE organizacion_id = p_organizacion_id AND slug = v_slug
    ) LOOP
        v_counter := v_counter + 1;
        v_slug := v_base_slug || '-' || v_counter;
    END LOOP;

    RETURN v_slug;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_slug_evento IS 'Genera un slug único URL-friendly para el evento dentro de la organización';

-- ====================================================================
-- FUNCIÓN PARA GENERAR TOKEN DE INVITADO
-- ====================================================================
CREATE OR REPLACE FUNCTION generar_token_invitado() RETURNS VARCHAR AS $$
DECLARE
    v_token VARCHAR;
BEGIN
    -- Generar token de 64 caracteres hexadecimales (32 bytes)
    v_token := encode(gen_random_bytes(32), 'hex');

    -- Verificar unicidad
    WHILE EXISTS (SELECT 1 FROM invitados_evento WHERE token = v_token) LOOP
        v_token := encode(gen_random_bytes(32), 'hex');
    END LOOP;

    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION generar_token_invitado IS 'Genera un token único de 64 caracteres para la URL personalizada del invitado';

-- ====================================================================
-- TRIGGER PARA AUTO-GENERAR TOKEN EN INVITADOS
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_generar_token_invitado()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.token IS NULL OR NEW.token = '' THEN
        NEW.token := generar_token_invitado();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_auto_token_invitado ON invitados_evento;
CREATE TRIGGER trg_auto_token_invitado
    BEFORE INSERT ON invitados_evento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_generar_token_invitado();

-- ====================================================================
-- TRIGGER PARA ACTUALIZAR updated_at
-- ====================================================================
CREATE OR REPLACE FUNCTION trigger_actualizar_timestamp_evento()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_actualizar_eventos_digitales ON eventos_digitales;
CREATE TRIGGER trg_actualizar_eventos_digitales
    BEFORE UPDATE ON eventos_digitales
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_evento();

DROP TRIGGER IF EXISTS trg_actualizar_invitados_evento ON invitados_evento;
CREATE TRIGGER trg_actualizar_invitados_evento
    BEFORE UPDATE ON invitados_evento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_evento();

DROP TRIGGER IF EXISTS trg_actualizar_plantillas_evento ON plantillas_evento;
CREATE TRIGGER trg_actualizar_plantillas_evento
    BEFORE UPDATE ON plantillas_evento
    FOR EACH ROW
    EXECUTE FUNCTION trigger_actualizar_timestamp_evento();

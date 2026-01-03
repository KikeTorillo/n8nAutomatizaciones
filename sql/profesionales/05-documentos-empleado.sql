-- ====================================================================
-- MÓDULO PROFESIONALES: DOCUMENTOS DEL EMPLEADO
-- ====================================================================
-- Sistema de gestión de documentos de empleados (identificaciones,
-- contratos, certificados, etc.)
--
-- Fecha: Enero 2026
-- Fase 2 del Plan de Empleados Competitivo
--
-- CONTENIDO:
-- • Tipo ENUM para tipos de documento
-- • Tabla documentos_empleado
-- • Índices optimizados
-- • RLS (Row Level Security)
-- • Trigger de actualización
-- • Función de alertas de vencimiento
-- • Job pg_cron para notificaciones automáticas
-- ====================================================================

-- ====================================================================
-- 📋 TIPO ENUM: TIPOS DE DOCUMENTO DE EMPLEADO
-- ====================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_empleado') THEN
        CREATE TYPE tipo_documento_empleado AS ENUM (
            'identificacion',       -- INE, cédula, DNI
            'pasaporte',            -- Pasaporte
            'licencia_conducir',    -- Licencia de manejo
            'contrato',             -- Contrato laboral
            'visa',                 -- Visa de trabajo
            'certificado',          -- Certificaciones profesionales
            'seguro_social',        -- IMSS, ISSSTE, etc.
            'comprobante_domicilio', -- Recibo de luz, agua, etc.
            'carta_recomendacion',  -- Cartas de recomendación
            'acta_nacimiento',      -- Acta de nacimiento
            'curp',                 -- CURP (México)
            'rfc',                  -- RFC (México)
            'titulo_profesional',   -- Título universitario
            'cedula_profesional',   -- Cédula profesional
            'otro'                  -- Otros documentos
        );
    END IF;
END $$;

-- ====================================================================
-- 📄 TABLA: DOCUMENTOS_EMPLEADO
-- ====================================================================
CREATE TABLE IF NOT EXISTS documentos_empleado (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 👤 RELACIÓN CON PROFESIONAL
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- 📦 RELACIÓN CON STORAGE
    archivo_storage_id INTEGER REFERENCES archivos_storage(id) ON DELETE SET NULL,

    -- ====================================================================
    -- 📋 INFORMACIÓN DEL DOCUMENTO
    -- ====================================================================
    tipo_documento tipo_documento_empleado NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    descripcion TEXT,
    numero_documento VARCHAR(100),  -- Número de identificación, folio, etc.

    -- ====================================================================
    -- 📅 FECHAS DEL DOCUMENTO
    -- ====================================================================
    fecha_emision DATE,
    fecha_vencimiento DATE,

    -- ====================================================================
    -- ✅ VERIFICACIÓN
    -- ====================================================================
    verificado BOOLEAN DEFAULT false,
    verificado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    verificado_en TIMESTAMPTZ,
    notas_verificacion TEXT,

    -- ====================================================================
    -- 🗑️ SOFT DELETE Y CONTROL
    -- ====================================================================
    activo BOOLEAN DEFAULT true,
    eliminado_en TIMESTAMPTZ,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ====================================================================
    -- ⏰ TIMESTAMPS Y AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ====================================================================
    -- ✅ CONSTRAINTS
    -- ====================================================================
    CONSTRAINT chk_fechas_documento CHECK (
        fecha_emision IS NULL OR fecha_vencimiento IS NULL
        OR fecha_emision <= fecha_vencimiento
    ),
    CONSTRAINT chk_nombre_documento CHECK (char_length(nombre) >= 3)
);

-- Comentarios de documentación
COMMENT ON TABLE documentos_empleado IS
'Documentos de empleados: identificaciones, contratos, certificados, etc.
Almacenados en MinIO (nexo-private) con URLs firmadas temporales.';

COMMENT ON COLUMN documentos_empleado.archivo_storage_id IS
'FK a archivos_storage donde está el archivo en MinIO';

COMMENT ON COLUMN documentos_empleado.verificado IS
'Indica si un admin/propietario ha verificado la autenticidad del documento';

-- ====================================================================
-- 🔍 ÍNDICES OPTIMIZADOS
-- ====================================================================

-- Índice principal: búsqueda por organización y profesional
CREATE INDEX IF NOT EXISTS idx_docs_empleado_org_prof
ON documentos_empleado(organizacion_id, profesional_id)
WHERE eliminado_en IS NULL;

-- Índice para alertas de vencimiento
CREATE INDEX IF NOT EXISTS idx_docs_empleado_vencimiento
ON documentos_empleado(organizacion_id, fecha_vencimiento ASC NULLS LAST)
WHERE eliminado_en IS NULL AND activo = true AND fecha_vencimiento IS NOT NULL;

-- Índice por tipo de documento
CREATE INDEX IF NOT EXISTS idx_docs_empleado_tipo
ON documentos_empleado(organizacion_id, tipo_documento)
WHERE eliminado_en IS NULL;

-- Índice para documentos pendientes de verificación
CREATE INDEX IF NOT EXISTS idx_docs_empleado_verificacion
ON documentos_empleado(organizacion_id, verificado)
WHERE eliminado_en IS NULL AND activo = true AND verificado = false;

-- Índice para archivo storage (FK lookup)
CREATE INDEX IF NOT EXISTS idx_docs_empleado_archivo
ON documentos_empleado(archivo_storage_id)
WHERE archivo_storage_id IS NOT NULL;

-- ====================================================================
-- 🔒 ROW LEVEL SECURITY (RLS)
-- ====================================================================
ALTER TABLE documentos_empleado ENABLE ROW LEVEL SECURITY;

-- Política de aislamiento por tenant
DROP POLICY IF EXISTS docs_empleado_tenant_policy ON documentos_empleado;
CREATE POLICY docs_empleado_tenant_policy ON documentos_empleado
    FOR ALL
    TO saas_app
    USING (
        -- Super admin o bypass explícito
        current_setting('app.current_user_role', true) = 'super_admin'
        OR current_setting('app.bypass_rls', true) = 'true'
        -- Mismo tenant
        OR organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::integer,
            0
        )
    );

-- ====================================================================
-- 🔄 TRIGGER: ACTUALIZAR TIMESTAMP
-- ====================================================================
DROP TRIGGER IF EXISTS trigger_actualizar_documentos_empleado ON documentos_empleado;
CREATE TRIGGER trigger_actualizar_documentos_empleado
    BEFORE UPDATE ON documentos_empleado
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_timestamp();

-- ====================================================================
-- 🔔 FUNCIÓN: ALERTAS DE DOCUMENTOS POR VENCER
-- ====================================================================
-- Esta función crea notificaciones para documentos que vencen en los
-- próximos 30 días. Evita duplicados verificando que no exista una
-- notificación reciente (últimos 7 días) para el mismo documento.
-- ====================================================================
CREATE OR REPLACE FUNCTION crear_alertas_documentos_vencimiento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Insertar notificaciones para documentos próximos a vencer
    INSERT INTO notificaciones (
        organizacion_id,
        usuario_id,
        tipo,
        titulo,
        mensaje,
        referencia_tipo,
        referencia_id,
        creado_en
    )
    SELECT DISTINCT
        d.organizacion_id,
        p.usuario_id,
        'documento_por_vencer',
        'Documento próximo a vencer',
        format(
            'El documento "%s" de %s vence en %s días (%s)',
            d.nombre,
            p.nombre_completo,
            (d.fecha_vencimiento - CURRENT_DATE)::text,
            to_char(d.fecha_vencimiento, 'DD/MM/YYYY')
        ),
        'documento_empleado',
        d.id,
        NOW()
    FROM documentos_empleado d
    JOIN profesionales p ON p.id = d.profesional_id
    WHERE
        -- Documentos que vencen en los próximos 30 días
        d.fecha_vencimiento BETWEEN CURRENT_DATE AND CURRENT_DATE + 30
        AND d.activo = true
        AND d.eliminado_en IS NULL
        -- Solo si el profesional tiene usuario vinculado
        AND p.usuario_id IS NOT NULL
        AND p.activo = true
        AND p.eliminado_en IS NULL
        -- Evitar duplicados: no crear si ya existe notificación reciente
        AND NOT EXISTS (
            SELECT 1 FROM notificaciones n
            WHERE n.referencia_id = d.id
                AND n.tipo = 'documento_por_vencer'
                AND n.creado_en > CURRENT_DATE - INTERVAL '7 days'
        );

    GET DIAGNOSTICS v_count = ROW_COUNT;

    -- Log para debugging (opcional)
    IF v_count > 0 THEN
        RAISE NOTICE 'Alertas de documentos creadas: %', v_count;
    END IF;
END;
$$;

COMMENT ON FUNCTION crear_alertas_documentos_vencimiento() IS
'Crea notificaciones automáticas para documentos que vencen en los próximos 30 días.
Ejecutada diariamente por pg_cron a las 8:00 AM.';

-- ====================================================================
-- ⏰ JOB PG_CRON: ALERTAS DIARIAS
-- ====================================================================
-- Programar ejecución diaria a las 8:00 AM
-- NOTA: Requiere que pg_cron esté habilitado en PostgreSQL
-- ====================================================================
DO $$
BEGIN
    -- Verificar si pg_cron está disponible
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Eliminar job existente si existe
        PERFORM cron.unschedule('alertas-documentos-vencimiento');

        -- Crear nuevo job
        PERFORM cron.schedule(
            'alertas-documentos-vencimiento',  -- nombre del job
            '0 8 * * *',                       -- cron expression: 8:00 AM diario
            'SELECT crear_alertas_documentos_vencimiento()'
        );

        RAISE NOTICE 'Job pg_cron "alertas-documentos-vencimiento" programado para las 8:00 AM';
    ELSE
        RAISE NOTICE 'pg_cron no está instalado. Las alertas de vencimiento no se programaron automáticamente.';
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error al programar pg_cron: %. Las alertas pueden ejecutarse manualmente.', SQLERRM;
END $$;

-- ====================================================================
-- 📊 VISTA: DOCUMENTOS CON ESTADO DE VENCIMIENTO
-- ====================================================================
CREATE OR REPLACE VIEW v_documentos_empleado_estado AS
SELECT
    d.*,
    p.nombre_completo as profesional_nombre,
    p.email as profesional_email,
    a.url_publica as archivo_url,
    a.nombre_original as archivo_nombre,
    a.mime_type as archivo_mime,
    a.tamano_bytes as archivo_tamano,
    CASE
        WHEN d.fecha_vencimiento IS NULL THEN 'sin_vencimiento'
        WHEN d.fecha_vencimiento < CURRENT_DATE THEN 'vencido'
        WHEN d.fecha_vencimiento <= CURRENT_DATE + 30 THEN 'por_vencer'
        ELSE 'vigente'
    END as estado_vencimiento,
    CASE
        WHEN d.fecha_vencimiento IS NOT NULL
        THEN d.fecha_vencimiento - CURRENT_DATE
        ELSE NULL
    END as dias_para_vencer
FROM documentos_empleado d
JOIN profesionales p ON p.id = d.profesional_id
LEFT JOIN archivos_storage a ON a.id = d.archivo_storage_id
WHERE d.eliminado_en IS NULL AND d.activo = true;

COMMENT ON VIEW v_documentos_empleado_estado IS
'Vista de documentos con estado de vencimiento calculado';

-- ====================================================================
-- ✅ VERIFICACIÓN DE INSTALACIÓN
-- ====================================================================
DO $$
DECLARE
    v_tabla_existe BOOLEAN;
    v_indices INTEGER;
    v_politicas INTEGER;
BEGIN
    -- Verificar tabla
    SELECT EXISTS (
        SELECT 1 FROM information_schema.tables
        WHERE table_name = 'documentos_empleado'
    ) INTO v_tabla_existe;

    -- Contar índices
    SELECT COUNT(*) INTO v_indices
    FROM pg_indexes
    WHERE tablename = 'documentos_empleado';

    -- Contar políticas RLS
    SELECT COUNT(*) INTO v_politicas
    FROM pg_policies
    WHERE tablename = 'documentos_empleado';

    RAISE NOTICE '========================================';
    RAISE NOTICE 'VERIFICACIÓN DE INSTALACIÓN';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tabla documentos_empleado: %', CASE WHEN v_tabla_existe THEN '✅ CREADA' ELSE '❌ NO EXISTE' END;
    RAISE NOTICE 'Índices creados: %', v_indices;
    RAISE NOTICE 'Políticas RLS: %', v_politicas;
    RAISE NOTICE '========================================';
END $$;

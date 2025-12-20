-- ====================================================================
-- MÓDULO CUSTOM FIELDS: TABLAS
-- ====================================================================
-- Sistema de campos personalizados por organización.
-- Permite a cada tenant definir campos adicionales sin modificar el schema.
--
-- Fecha: Diciembre 2025
-- Dependencias: nucleo (organizaciones, usuarios), storage (archivos)
-- ====================================================================

-- ====================================================================
-- TABLA: custom_fields_definiciones
-- ====================================================================
-- Define los campos personalizados disponibles para cada entidad.
-- Cada organización puede crear sus propios campos.
-- ====================================================================
CREATE TABLE IF NOT EXISTS custom_fields_definiciones (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 🏷️ CONFIGURACIÓN DEL CAMPO
    entidad_tipo VARCHAR(50) NOT NULL,      -- 'cliente', 'profesional', 'servicio', etc.
    nombre VARCHAR(100) NOT NULL,            -- "Número de seguro médico"
    nombre_clave VARCHAR(50) NOT NULL,       -- "numero_seguro" (slug para API)
    descripcion TEXT,                        -- Tooltip/ayuda para el usuario

    -- 📋 TIPO Y OPCIONES
    tipo_dato VARCHAR(30) NOT NULL,          -- 'texto', 'numero', 'fecha', 'select', etc.
    opciones JSONB DEFAULT '[]',             -- Para select/multiselect: ["Opción 1", "Opción 2"]
    valor_default JSONB,                     -- Valor por defecto (tipado según tipo_dato)
    placeholder VARCHAR(200),                -- Placeholder del input

    -- ✅ VALIDACIONES
    requerido BOOLEAN DEFAULT FALSE,
    longitud_minima INTEGER,                 -- Para texto
    longitud_maxima INTEGER,                 -- Para texto
    valor_minimo NUMERIC,                    -- Para número
    valor_maximo NUMERIC,                    -- Para número
    patron_regex VARCHAR(500),               -- Validación personalizada
    mensaje_error VARCHAR(200),              -- Mensaje de error personalizado

    -- 🎨 UI/UX
    visible_en_formulario BOOLEAN DEFAULT TRUE,
    visible_en_listado BOOLEAN DEFAULT FALSE,
    orden INTEGER DEFAULT 0,
    seccion VARCHAR(100),                    -- Agrupar campos: "Datos médicos", "Preferencias"
    ancho_columnas INTEGER DEFAULT 12,       -- Grid: 6 = mitad, 12 = completo
    icono VARCHAR(50),                       -- Icono del campo (ej: 'heart', 'phone')

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 🗑️ SOFT DELETE
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uk_cf_definicion_org_entidad_clave
        UNIQUE (organizacion_id, entidad_tipo, nombre_clave),

    CONSTRAINT chk_cf_entidad_tipo CHECK (entidad_tipo IN (
        'cliente', 'profesional', 'servicio', 'producto',
        'cita', 'evento_digital', 'invitado_evento'
    )),

    CONSTRAINT chk_cf_tipo_dato CHECK (tipo_dato IN (
        'texto', 'texto_largo', 'numero', 'fecha', 'hora',
        'booleano', 'select', 'multiselect', 'email', 'telefono', 'url', 'archivo'
    )),

    CONSTRAINT chk_cf_nombre_clave CHECK (nombre_clave ~ '^[a-z][a-z0-9_]*$'),
    CONSTRAINT chk_cf_orden CHECK (orden >= 0),
    CONSTRAINT chk_cf_ancho CHECK (ancho_columnas >= 1 AND ancho_columnas <= 12),
    CONSTRAINT chk_cf_longitud CHECK (
        longitud_minima IS NULL OR longitud_maxima IS NULL OR
        longitud_minima <= longitud_maxima
    ),
    CONSTRAINT chk_cf_valor CHECK (
        valor_minimo IS NULL OR valor_maximo IS NULL OR
        valor_minimo <= valor_maximo
    )
);

-- Comentarios de documentación
COMMENT ON TABLE custom_fields_definiciones IS
'Definiciones de campos personalizados por organización. Permite extender entidades sin modificar el schema.';

COMMENT ON COLUMN custom_fields_definiciones.entidad_tipo IS
'Entidad a la que aplica el campo: cliente, profesional, servicio, producto, cita, evento_digital, invitado_evento';

COMMENT ON COLUMN custom_fields_definiciones.nombre_clave IS
'Identificador único del campo en formato slug (snake_case). Usado en API y código.';

COMMENT ON COLUMN custom_fields_definiciones.tipo_dato IS
'Tipo de dato: texto, texto_largo, numero, fecha, hora, booleano, select, multiselect, email, telefono, url, archivo';

COMMENT ON COLUMN custom_fields_definiciones.opciones IS
'Array JSON con opciones para campos select/multiselect. Ej: ["Opción 1", "Opción 2"]';

COMMENT ON COLUMN custom_fields_definiciones.seccion IS
'Agrupa campos en secciones dentro del formulario. Ej: "Datos médicos", "Preferencias"';

COMMENT ON COLUMN custom_fields_definiciones.ancho_columnas IS
'Ancho en sistema de grid de 12 columnas. 6 = mitad del formulario, 12 = ancho completo';

-- ====================================================================
-- TABLA: custom_fields_valores
-- ====================================================================
-- Almacena los valores de los campos personalizados para cada entidad.
-- Usa columnas tipadas para optimizar queries y validaciones.
-- ====================================================================
CREATE TABLE IF NOT EXISTS custom_fields_valores (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    definicion_id INTEGER NOT NULL REFERENCES custom_fields_definiciones(id) ON DELETE CASCADE,

    -- 🔗 REFERENCIA A ENTIDAD
    entidad_tipo VARCHAR(50) NOT NULL,       -- Redundante para performance en queries
    entidad_id INTEGER NOT NULL,              -- ID del cliente/profesional/etc.

    -- 📊 VALORES TIPADOS (solo uno tendrá valor según tipo_dato)
    valor_texto TEXT,
    valor_numero NUMERIC,
    valor_fecha DATE,
    valor_hora TIME,
    valor_booleano BOOLEAN,
    valor_json JSONB,                         -- Para multiselect y tipos complejos

    -- 📎 ARCHIVOS (si tipo = 'archivo')
    archivo_storage_id INTEGER REFERENCES archivos_storage(id) ON DELETE SET NULL,

    -- ⏰ TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uk_cf_valor_definicion_entidad
        UNIQUE (definicion_id, entidad_id),

    CONSTRAINT chk_cf_valor_entidad_tipo CHECK (entidad_tipo IN (
        'cliente', 'profesional', 'servicio', 'producto',
        'cita', 'evento_digital', 'invitado_evento'
    ))
);

-- Comentarios de documentación
COMMENT ON TABLE custom_fields_valores IS
'Valores de campos personalizados. Cada registro vincula un campo definido con una entidad específica.';

COMMENT ON COLUMN custom_fields_valores.entidad_tipo IS
'Tipo de entidad (redundante con definicion para optimizar queries sin JOIN)';

COMMENT ON COLUMN custom_fields_valores.entidad_id IS
'ID de la entidad (cliente, profesional, etc.) a la que pertenece este valor';

COMMENT ON COLUMN custom_fields_valores.valor_json IS
'Valor JSON para campos multiselect o estructuras complejas';

COMMENT ON COLUMN custom_fields_valores.archivo_storage_id IS
'Referencia al archivo en storage para campos de tipo archivo';

-- ====================================================================
-- FIN: TABLAS CUSTOM FIELDS
-- ====================================================================

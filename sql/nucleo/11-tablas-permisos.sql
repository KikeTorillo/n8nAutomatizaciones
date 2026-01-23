-- ====================================================================
-- SISTEMA DE PERMISOS NORMALIZADOS - TABLAS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Diciembre 2025
-- Módulo: nucleo/permisos
--
-- DESCRIPCIÓN:
-- Sistema de permisos normalizado que reemplaza los campos JSONB
-- (modulos_acceso, permisos_override) por tablas relacionales.
--
-- TABLAS (3):
-- • permisos_catalogo: Catálogo de permisos disponibles en el sistema
-- • permisos_rol: Permisos por rol (plantilla base)
-- • permisos_usuario_sucursal: Override por usuario en sucursal específica
--
-- CARACTERÍSTICAS:
-- • Queryable con SQL estándar (no JSONB)
-- • Auditoría completa (quién otorgó, cuándo)
-- • Jerarquía: catálogo → rol → usuario/sucursal
-- • Soporte para diferentes tipos de valor (booleano, numérico, texto)
--
-- DEPENDENCIAS:
-- • Módulo nucleo: usuarios, organizaciones
-- • Módulo sucursales: sucursales
-- • ENUM: rol_usuario
--
-- ====================================================================

-- ====================================================================
-- TABLA 1: permisos_catalogo
-- ====================================================================
-- Catálogo maestro de permisos disponibles en el sistema.
-- Define qué permisos existen y sus valores por defecto.
-- Esta tabla es de sistema (no por organización).
-- ====================================================================

CREATE TABLE permisos_catalogo (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,

    -- 📋 IDENTIFICADOR ÚNICO
    codigo VARCHAR(50) UNIQUE NOT NULL,          -- 'pos.acceso', 'pos.max_descuento', etc.

    -- 🏷️ CLASIFICACIÓN
    modulo VARCHAR(50) NOT NULL,                 -- 'pos', 'inventario', 'agendamiento', etc.
    categoria VARCHAR(30) NOT NULL DEFAULT 'acceso', -- 'acceso', 'operacion', 'configuracion'

    -- 📝 INFORMACIÓN
    nombre VARCHAR(100) NOT NULL,                -- Nombre para mostrar en UI
    descripcion TEXT,                            -- Descripción detallada

    -- 🎯 TIPO DE VALOR
    tipo_valor VARCHAR(20) NOT NULL DEFAULT 'booleano' CHECK (tipo_valor IN (
        'booleano',     -- true/false
        'numerico',     -- número (ej: max_descuento = 20)
        'texto',        -- string libre
        'lista'         -- array de valores permitidos
    )),

    -- 🔢 VALOR POR DEFECTO
    valor_default JSONB NOT NULL DEFAULT 'false',  -- Valor si no hay override

    -- ⚙️ CONFIGURACIÓN UI
    orden_display INTEGER DEFAULT 0,              -- Orden en la UI
    visible_en_ui BOOLEAN DEFAULT TRUE,           -- Si se muestra en UI de permisos
    requiere_plan_pro BOOLEAN DEFAULT FALSE,      -- Solo disponible en plan Pro

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_permisos_catalogo_modulo ON permisos_catalogo(modulo) WHERE activo = TRUE;
CREATE INDEX idx_permisos_catalogo_categoria ON permisos_catalogo(modulo, categoria) WHERE activo = TRUE;

-- Comentarios
COMMENT ON TABLE permisos_catalogo IS
'Catálogo maestro de permisos del sistema. Define qué permisos existen y sus valores default.';

COMMENT ON COLUMN permisos_catalogo.codigo IS
'Identificador único del permiso. Formato: modulo.accion (ej: pos.acceso, inventario.puede_ajustar)';

COMMENT ON COLUMN permisos_catalogo.tipo_valor IS
'Tipo de valor: booleano (true/false), numerico (ej: max_descuento), texto, lista';

COMMENT ON COLUMN permisos_catalogo.valor_default IS
'Valor por defecto si no hay override a nivel rol o usuario. JSONB para flexibilidad.';


-- ====================================================================
-- TABLA 2: permisos_rol
-- ====================================================================
-- Permisos asignados a cada rol del sistema.
-- Actúa como plantilla base para usuarios con ese rol.
-- ====================================================================

CREATE TABLE permisos_rol (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES (FASE 7: Solo rol_id, sin ENUM legacy)
    rol_id INTEGER NOT NULL,                     -- FK a tabla roles (se agrega después de crear tabla roles)
    permiso_id INTEGER NOT NULL REFERENCES permisos_catalogo(id) ON DELETE CASCADE,

    -- 🔢 VALOR DEL PERMISO
    valor JSONB NOT NULL,                        -- Valor asignado a este rol

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_permisos_rol_id UNIQUE(rol_id, permiso_id)
);

-- Índices
CREATE INDEX idx_permisos_rol_rol_id ON permisos_rol(rol_id);

-- Comentarios
COMMENT ON TABLE permisos_rol IS
'Permisos por rol (FASE 7: usa rol_id en lugar de ENUM). Actúa como plantilla base para usuarios con ese rol.';

COMMENT ON COLUMN permisos_rol.rol_id IS
'FK a tabla roles. Permite roles dinámicos por organización.';

COMMENT ON COLUMN permisos_rol.valor IS
'Valor del permiso para este rol. Sobreescribe el valor_default del catálogo.';


-- ====================================================================
-- TABLA 3: permisos_usuario_sucursal
-- ====================================================================
-- Override de permisos por usuario en sucursal específica.
-- Máxima granularidad: usuario + sucursal + permiso.
-- ====================================================================

CREATE TABLE permisos_usuario_sucursal (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,

    -- 🔗 RELACIONES
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,
    permiso_id INTEGER NOT NULL REFERENCES permisos_catalogo(id) ON DELETE CASCADE,

    -- 🔢 VALOR DEL PERMISO
    valor JSONB NOT NULL,                        -- Valor específico para este usuario/sucursal

    -- 📝 AUDITORÍA
    otorgado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    motivo TEXT,                                 -- Razón del override (opcional)

    -- 📅 VIGENCIA (opcional)
    fecha_inicio DATE,                           -- NULL = inmediato
    fecha_fin DATE,                              -- NULL = permanente

    -- 📅 TIMESTAMPS
    otorgado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_permisos_usuario_sucursal UNIQUE(usuario_id, sucursal_id, permiso_id),
    CONSTRAINT chk_fechas_vigencia CHECK (fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio)
);

-- Índices
CREATE INDEX idx_permisos_us_usuario ON permisos_usuario_sucursal(usuario_id);
CREATE INDEX idx_permisos_us_sucursal ON permisos_usuario_sucursal(sucursal_id);
CREATE INDEX idx_permisos_us_usuario_sucursal ON permisos_usuario_sucursal(usuario_id, sucursal_id);
-- Índice para permisos permanentes (sin fecha_fin)
CREATE INDEX idx_permisos_us_permanentes ON permisos_usuario_sucursal(usuario_id, sucursal_id)
    WHERE fecha_fin IS NULL;

-- Índice para permisos temporales (con fecha_fin) - la vigencia se valida en query
CREATE INDEX idx_permisos_us_temporales ON permisos_usuario_sucursal(usuario_id, sucursal_id, fecha_fin)
    WHERE fecha_fin IS NOT NULL;

-- Comentarios
COMMENT ON TABLE permisos_usuario_sucursal IS
'Override de permisos por usuario en sucursal específica. Máxima granularidad del sistema.';

COMMENT ON COLUMN permisos_usuario_sucursal.otorgado_por IS
'Usuario que otorgó este permiso. Permite auditoría completa.';

COMMENT ON COLUMN permisos_usuario_sucursal.fecha_inicio IS
'Fecha desde la que aplica el permiso. NULL = inmediato.';

COMMENT ON COLUMN permisos_usuario_sucursal.fecha_fin IS
'Fecha hasta la que aplica el permiso. NULL = permanente. Útil para permisos temporales.';


-- ====================================================================
-- RLS POLICIES
-- ====================================================================
-- permisos_catalogo: Sin RLS (tabla de sistema, read-only para apps)
-- permisos_rol: Sin RLS (tabla de sistema, read-only para apps)
-- permisos_usuario_sucursal: Con RLS por organización

ALTER TABLE permisos_usuario_sucursal ENABLE ROW LEVEL SECURITY;

-- Política: Solo ver permisos de usuarios de mi organización
CREATE POLICY permisos_us_isolation ON permisos_usuario_sucursal
    FOR ALL TO saas_app
    USING (
        usuario_id IN (
            SELECT id FROM usuarios
            WHERE organizacion_id = COALESCE(
                NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
                0
            )
        )
    );

-- ====================================================================
-- FIN: TABLAS DE PERMISOS
-- ====================================================================

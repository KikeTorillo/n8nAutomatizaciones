-- ====================================================================
-- MODULO SUCURSALES: TABLAS PRINCIPALES
-- ====================================================================
-- Sistema multi-sucursal para organizaciones con múltiples ubicaciones.
-- Permite gestionar inventario, citas, ventas y profesionales por sucursal.
--
-- CONTENIDO:
-- * sucursales - Ubicaciones físicas de la organización
-- * usuarios_sucursales - Asignación de usuarios a sucursales
-- * profesionales_sucursales - Asignación de profesionales a sucursales
-- * servicios_sucursales - Personalización de servicios por sucursal
-- * transferencias_stock - Transferencias entre sucursales
-- * transferencias_stock_items - Detalle de productos transferidos
--
-- NOTA (Enero 2026): stock_sucursales fue ELIMINADA.
-- La nueva arquitectura usa stock_ubicaciones (ver: inventario/33-consolidacion-stock.sql)
--
-- Fecha: Diciembre 2025
-- ====================================================================

-- ====================================================================
-- TIPO ENUM: estado_transferencia
-- ====================================================================
CREATE TYPE estado_transferencia AS ENUM (
    'borrador',     -- En preparación
    'enviado',      -- En tránsito (stock restado de origen, no sumado a destino)
    'recibido',     -- Completado (stock sumado a destino)
    'cancelado'     -- Anulado (devolver stock a origen si estaba enviado)
);

COMMENT ON TYPE estado_transferencia IS 'Estados del workflow de transferencia de stock entre sucursales';

-- ====================================================================
-- TABLA: sucursales
-- ====================================================================
-- Representa ubicaciones físicas de una organización.
-- Cada organización tiene al menos una sucursal "matriz" creada automáticamente.
-- ====================================================================
CREATE TABLE sucursales (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📋 INFORMACION BASICA
    codigo VARCHAR(20) NOT NULL,           -- SUC-001, MATRIZ, etc.
    nombre VARCHAR(150) NOT NULL,          -- "Sucursal Centro"
    es_matriz BOOLEAN DEFAULT FALSE,       -- Solo una por organización

    -- 📍 UBICACION
    direccion TEXT,
    estado_id INTEGER REFERENCES estados(id) ON DELETE SET NULL,
    ciudad_id INTEGER REFERENCES ciudades(id) ON DELETE SET NULL,
    codigo_postal VARCHAR(10),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),

    -- 📞 CONTACTO
    telefono VARCHAR(20),
    email VARCHAR(150),
    whatsapp VARCHAR(20),

    -- 💰 CONFIGURACION REGIONAL (Dic 2025 - Multi-Moneda)
    -- NULL = heredar moneda de la organización
    -- Con valor = override para sucursales en otros países
    moneda VARCHAR(3) DEFAULT NULL,

    -- ⏰ CONFIGURACION DE HORARIOS
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City',
    horario_apertura TIME DEFAULT '09:00',
    horario_cierre TIME DEFAULT '20:00',
    dias_laborales JSONB DEFAULT '["lunes","martes","miercoles","jueves","viernes","sabado"]',

    -- ⚙️ CONFIGURACION DE INVENTARIO
    inventario_compartido BOOLEAN DEFAULT TRUE,  -- TRUE = usa inventario global de org

    -- ⚙️ CONFIGURACION DE SERVICIOS
    servicios_heredados BOOLEAN DEFAULT TRUE,    -- TRUE = hereda servicios de org

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 🗑️ SOFT DELETE (Dic 2025)
    eliminado_en TIMESTAMPTZ DEFAULT NULL,
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_sucursal_codigo_org UNIQUE(organizacion_id, codigo),
    CONSTRAINT chk_sucursal_codigo_length CHECK (char_length(codigo) >= 2),
    CONSTRAINT chk_sucursal_nombre_length CHECK (char_length(nombre) >= 2),
    CONSTRAINT chk_sucursal_latitud CHECK (latitud IS NULL OR (latitud >= -90 AND latitud <= 90)),
    CONSTRAINT chk_sucursal_longitud CHECK (longitud IS NULL OR (longitud >= -180 AND longitud <= 180))
);

-- Solo una matriz por organización
CREATE UNIQUE INDEX idx_sucursal_matriz_unica
ON sucursales(organizacion_id)
WHERE es_matriz = TRUE;

COMMENT ON TABLE sucursales IS 'Ubicaciones físicas de una organización. Cada org tiene al menos una sucursal matriz.';
COMMENT ON COLUMN sucursales.codigo IS 'Código único dentro de la organización (ej: MATRIZ, SUC-001)';
COMMENT ON COLUMN sucursales.es_matriz IS 'TRUE para la sucursal principal. Solo puede haber una por organización.';
COMMENT ON COLUMN sucursales.inventario_compartido IS 'TRUE = usa stock global de la org. FALSE = stock independiente por sucursal.';
COMMENT ON COLUMN sucursales.servicios_heredados IS 'TRUE = hereda servicios de la org. FALSE = servicios propios.';
COMMENT ON COLUMN sucursales.moneda IS 'Override de moneda para sucursales en otros países. NULL = heredar de organización.';

-- ====================================================================
-- TABLA: usuarios_sucursales
-- ====================================================================
-- Asignación de usuarios a sucursales con permisos opcionales.
-- Un usuario puede estar asignado a múltiples sucursales.
-- ====================================================================
CREATE TABLE usuarios_sucursales (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- 👔 ROL EN SUCURSAL
    es_gerente BOOLEAN DEFAULT FALSE,

    -- 🔐 PERMISOS
    -- NOTA: Los permisos se gestionan via tabla permisos_usuario_sucursal (Fase 3B)
    -- Consultar con función: obtener_permiso(usuario_id, sucursal_id, codigo)

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_usuario_sucursal UNIQUE(usuario_id, sucursal_id)
);

COMMENT ON TABLE usuarios_sucursales IS 'Asignación de usuarios a sucursales. Permite multi-sucursal por usuario.';
COMMENT ON COLUMN usuarios_sucursales.es_gerente IS 'TRUE si el usuario es gerente de esta sucursal.';
-- NOTA: Permisos granulares se gestionan via permisos_usuario_sucursal (Fase 3B)

-- ====================================================================
-- TABLA: profesionales_sucursales
-- ====================================================================
-- Asignación de profesionales a sucursales con horarios personalizados.
-- Un profesional puede trabajar en múltiples sucursales.
-- ====================================================================
CREATE TABLE profesionales_sucursales (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- ⏰ HORARIOS PERSONALIZADOS (opcional)
    -- NULL = usa horarios globales del profesional
    -- Con valor = horarios específicos para esta sucursal
    horarios_personalizados JSONB DEFAULT NULL,

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_profesional_sucursal UNIQUE(profesional_id, sucursal_id)
);

COMMENT ON TABLE profesionales_sucursales IS 'Asignación de profesionales a sucursales. Permite trabajar en múltiples ubicaciones.';
COMMENT ON COLUMN profesionales_sucursales.horarios_personalizados IS 'Horarios específicos para esta sucursal. NULL = usar horarios globales del profesional.';

-- ====================================================================
-- TABLA: servicios_sucursales
-- ====================================================================
-- Personalización de servicios por sucursal (precios, duración, disponibilidad).
-- Permite que cada sucursal tenga precios o duraciones diferentes.
-- ====================================================================
CREATE TABLE servicios_sucursales (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    sucursal_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE CASCADE,

    -- 💰 OVERRIDE DE PRECIO (opcional)
    -- NULL = usar precio base del servicio
    precio_override DECIMAL(10,2) DEFAULT NULL,

    -- ⏰ OVERRIDE DE DURACION (opcional)
    -- NULL = usar duración base del servicio
    duracion_override INTEGER DEFAULT NULL,

    -- 📊 DISPONIBILIDAD
    activo BOOLEAN DEFAULT TRUE,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_servicio_sucursal UNIQUE(servicio_id, sucursal_id),
    CONSTRAINT chk_precio_override CHECK (precio_override IS NULL OR precio_override >= 0),
    CONSTRAINT chk_duracion_override CHECK (duracion_override IS NULL OR (duracion_override > 0 AND duracion_override <= 480))
);

COMMENT ON TABLE servicios_sucursales IS 'Personalización de servicios por sucursal (precios, duración).';
COMMENT ON COLUMN servicios_sucursales.precio_override IS 'Precio específico para esta sucursal. NULL = usar precio base del servicio.';
COMMENT ON COLUMN servicios_sucursales.duracion_override IS 'Duración específica para esta sucursal en minutos. NULL = usar duración base.';

-- ====================================================================
-- NOTA: La tabla stock_sucursales fue ELIMINADA (Enero 2026)
-- ====================================================================
-- La nueva arquitectura usa stock_ubicaciones como única fuente de verdad.
-- Ver: sql/inventario/33-consolidacion-stock.sql
-- ====================================================================

-- ====================================================================
-- TABLA: usuarios_ubicaciones (Enero 2026)
-- ====================================================================
-- Asignación de ubicaciones permitidas por usuario con permisos granulares.
-- Permite control de qué ubicaciones puede usar cada usuario para operaciones.
--
-- FLUJO DE RESOLUCIÓN:
-- 1. Si usuario tiene ubicación default asignada → usar esa
-- 2. Si no → usar ubicación default de sucursal (comportamiento legacy)
-- ====================================================================
CREATE TABLE usuarios_ubicaciones (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ubicacion_id INTEGER NOT NULL, -- FK diferida en 06-foreign-keys.sql (ubicaciones_almacen se crea después)

    -- ⚙️ CONFIGURACION
    es_default BOOLEAN DEFAULT false,
    puede_recibir BOOLEAN DEFAULT true,
    puede_despachar BOOLEAN DEFAULT true,

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT true,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_usuario_ubicacion UNIQUE(usuario_id, ubicacion_id)
);

COMMENT ON TABLE usuarios_ubicaciones IS 'Asignación de ubicaciones permitidas por usuario para operaciones de inventario';
COMMENT ON COLUMN usuarios_ubicaciones.es_default IS 'Ubicación preferida del usuario para operaciones. Solo una por usuario/sucursal.';
COMMENT ON COLUMN usuarios_ubicaciones.puede_recibir IS 'TRUE si el usuario puede recibir mercancía en esta ubicación';
COMMENT ON COLUMN usuarios_ubicaciones.puede_despachar IS 'TRUE si el usuario puede despachar/vender desde esta ubicación';

-- ====================================================================
-- TABLA: transferencias_stock
-- ====================================================================
-- Transferencias de inventario entre sucursales.
-- Workflow: borrador -> enviado (en tránsito) -> recibido
-- ====================================================================
CREATE TABLE transferencias_stock (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- Código único de la transferencia
    codigo VARCHAR(30) NOT NULL,

    -- 📍 SUCURSALES
    sucursal_origen_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,
    sucursal_destino_id INTEGER NOT NULL REFERENCES sucursales(id) ON DELETE RESTRICT,

    -- 🔄 ESTADO
    estado estado_transferencia DEFAULT 'borrador',

    -- 📅 FECHAS
    fecha_envio TIMESTAMPTZ,
    fecha_recepcion TIMESTAMPTZ,

    -- 👤 USUARIOS
    usuario_crea_id INTEGER REFERENCES usuarios(id),
    usuario_envia_id INTEGER REFERENCES usuarios(id),
    usuario_recibe_id INTEGER REFERENCES usuarios(id),

    -- 📝 NOTAS
    notas TEXT,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_transferencia_codigo UNIQUE(organizacion_id, codigo),
    CONSTRAINT chk_sucursales_diferentes CHECK (sucursal_origen_id != sucursal_destino_id),
    CONSTRAINT chk_fecha_envio CHECK (fecha_envio IS NULL OR estado IN ('enviado', 'recibido', 'cancelado')),
    CONSTRAINT chk_fecha_recepcion CHECK (fecha_recepcion IS NULL OR estado IN ('recibido'))
);

COMMENT ON TABLE transferencias_stock IS 'Transferencias de inventario entre sucursales con workflow de estados.';
COMMENT ON COLUMN transferencias_stock.estado IS 'borrador -> enviado (en tránsito) -> recibido | cancelado';
COMMENT ON COLUMN transferencias_stock.fecha_envio IS 'Momento en que se envió la transferencia';
COMMENT ON COLUMN transferencias_stock.fecha_recepcion IS 'Momento en que se recibió la transferencia';

-- ====================================================================
-- TABLA: transferencias_stock_items
-- ====================================================================
-- Detalle de productos en cada transferencia.
-- Registra cantidad enviada vs cantidad recibida (puede diferir por merma).
-- ====================================================================
CREATE TABLE transferencias_stock_items (
    -- 🔑 IDENTIFICACION
    id SERIAL PRIMARY KEY,
    transferencia_id INTEGER NOT NULL REFERENCES transferencias_stock(id) ON DELETE CASCADE,
    producto_id INTEGER NOT NULL REFERENCES productos(id) ON DELETE RESTRICT,

    -- 📦 CANTIDADES
    cantidad_enviada INTEGER NOT NULL,
    cantidad_recibida INTEGER,          -- Puede diferir (merma, error, faltante)

    -- 📝 NOTAS
    notas TEXT,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_transferencia_producto UNIQUE(transferencia_id, producto_id),
    CONSTRAINT chk_cantidad_enviada CHECK (cantidad_enviada > 0),
    CONSTRAINT chk_cantidad_recibida CHECK (cantidad_recibida IS NULL OR cantidad_recibida >= 0)
);

COMMENT ON TABLE transferencias_stock_items IS 'Detalle de productos en transferencias de stock.';
COMMENT ON COLUMN transferencias_stock_items.cantidad_enviada IS 'Cantidad de unidades enviadas';
COMMENT ON COLUMN transferencias_stock_items.cantidad_recibida IS 'Cantidad recibida (puede diferir por merma). NULL hasta que se reciba.';

-- ====================================================================
-- FIN: TABLAS DE SUCURSALES
-- ====================================================================

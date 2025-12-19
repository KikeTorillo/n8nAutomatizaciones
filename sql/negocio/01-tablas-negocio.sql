-- ====================================================================
-- MÓDULO NEGOCIO: TABLAS PRINCIPALES
-- ====================================================================
-- Tablas centrales del modelo de negocio: profesionales, clientes,
-- servicios y sus relaciones.
--
-- CONTENIDO:
-- • profesionales - Personal que brinda servicios
-- • clientes - Base de datos de clientes
-- • servicios - Catálogo de servicios por organización
-- • servicios_profesionales - Relación M:N con configuraciones
--
-- Migrado de: sql/schema/05-business-tables.sql
-- Fecha migración: 17 Noviembre 2025
-- ====================================================================

-- ====================================================================
-- 👷 TABLA PROFESIONALES - GESTIÓN UNIFICADA DE EMPLEADOS
-- ====================================================================
-- Tabla unificada de empleados. Soporta todos los tipos de colaboradores:
-- operativos, administrativos, gerenciales, ventas.
--
-- 🔧 MODELO DE CONTROL:
-- • tipo → Solo clasificación organizacional (reportes, organigrama)
-- • modulos_acceso → ★ CONTROL PRINCIPAL de funcionalidades ★
-- • categorias (M:N) → Especialidad, nivel, certificaciones
--
-- ⚠️ IMPORTANTE: tipo_profesional_id se mantiene como LEGACY
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE profesionales (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT (CRÍTICA)
    organizacion_id INTEGER NOT NULL,           -- FK obligatoria a organizaciones
                                               -- REFERENCES organizaciones(id) ON DELETE CASCADE

    -- ====================================================================
    -- 🆔 SECCIÓN: IDENTIFICACIÓN
    -- ====================================================================
    codigo VARCHAR(20),                        -- Código interno (EMP001, VEN003)
    nombre_completo VARCHAR(150) NOT NULL,     -- Nombre completo del profesional
    email VARCHAR(150),                        -- Email personal (único por organización)
    telefono VARCHAR(20),                      -- Teléfono de contacto
    foto_url TEXT,                             -- URL de foto de perfil

    -- ====================================================================
    -- 👤 SECCIÓN: INFORMACIÓN PERSONAL (estilo Odoo)
    -- ====================================================================
    fecha_nacimiento DATE,                     -- Para validar mayoría de edad
    documento_identidad VARCHAR(30),           -- Cédula, DNI, Pasaporte, etc.
    genero genero DEFAULT 'no_especificado',   -- Género del empleado
    direccion TEXT,                            -- Dirección de domicilio
    estado_civil VARCHAR(20),                  -- soltero, casado, divorciado, viudo, union_libre
    contacto_emergencia_nombre VARCHAR(100),   -- Nombre del contacto de emergencia
    contacto_emergencia_telefono VARCHAR(20),  -- Teléfono del contacto de emergencia

    -- ====================================================================
    -- 🏷️ SECCIÓN: CLASIFICACIÓN ORGANIZACIONAL
    -- ====================================================================
    -- ⚠️ Solo para reportes y organigrama. NO restringe funcionalidades.
    -- Las funcionalidades se controlan con modulos_acceso.
    -- ────────────────────────────────────────────────────────────────────
    tipo tipo_empleado NOT NULL DEFAULT 'operativo',  -- Clasificación organizacional
    estado estado_laboral NOT NULL DEFAULT 'activo',  -- Estado laboral actual
    tipo_contratacion tipo_contratacion DEFAULT 'tiempo_completo', -- Modalidad de contrato

    -- ====================================================================
    -- 🌳 SECCIÓN: JERARQUÍA ORGANIZACIONAL
    -- ====================================================================
    supervisor_id INTEGER,                     -- Jefe directo (FK a profesionales)
    departamento_id INTEGER,                   -- Departamento asignado (FK a departamentos)
    puesto_id INTEGER,                         -- Puesto de trabajo (FK a puestos)
    -- NOTA: Sucursales via profesionales_sucursales (M:N existente)

    -- ====================================================================
    -- 📅 SECCIÓN: FECHAS LABORALES
    -- ====================================================================
    fecha_ingreso DATE DEFAULT CURRENT_DATE,   -- Fecha de contratación
    fecha_baja DATE,                           -- Fecha de baja (si estado='baja')
    motivo_baja TEXT,                          -- Razón de baja

    -- ====================================================================
    -- 🎓 SECCIÓN: INFORMACIÓN PROFESIONAL (LEGACY + NUEVO)
    -- ====================================================================
    tipo_profesional_id INTEGER REFERENCES tipos_profesional(id), -- [LEGACY] Tipo según catálogo
    licencias_profesionales JSONB DEFAULT '{}', -- Licencias y certificaciones
    años_experiencia INTEGER DEFAULT 0,        -- Años de experiencia laboral
    idiomas TEXT[] DEFAULT ARRAY['es']::TEXT[], -- Idiomas que habla
    -- NOTA: Especialidades/categorías via profesionales_categorias (M:N)

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN DE AGENDAMIENTO
    -- ====================================================================
    -- Solo aplica si modulos_acceso.agendamiento = true
    -- ────────────────────────────────────────────────────────────────────
    disponible_online BOOLEAN DEFAULT false,   -- Visible para booking público
    color_calendario VARCHAR(7) DEFAULT '#753572', -- Color hex (marca Nexo)
    biografia TEXT,                            -- Descripción profesional para clientes
    configuracion_horarios JSONB DEFAULT '{}', -- Horarios personalizados
    configuracion_servicios JSONB DEFAULT '{}', -- Config específica de servicios

    -- ====================================================================
    -- 💰 SECCIÓN: COMPENSACIÓN
    -- ====================================================================
    salario_base DECIMAL(10,2),                -- Salario base mensual
    comision_porcentaje DECIMAL(5,2) DEFAULT 0, -- % de comisión por servicio
    forma_pago VARCHAR(20) DEFAULT 'comision', -- 'comision', 'salario', 'mixto'

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL DE ACCESO A MÓDULOS (★ CONTROL PRINCIPAL ★)
    -- ====================================================================
    -- Determina QUÉ puede hacer el empleado. NO depende del campo tipo.
    -- ────────────────────────────────────────────────────────────────────
    modulos_acceso JSONB DEFAULT '{"agendamiento": true, "pos": false, "inventario": false}',
                                               -- agendamiento: puede atender citas
                                               -- pos: puede registrar ventas
                                               -- inventario: puede gestionar stock

    -- ====================================================================
    -- 🔗 SECCIÓN: VINCULACIÓN CON USUARIO
    -- ====================================================================
    usuario_id INTEGER UNIQUE,                  -- Usuario del sistema vinculado
                                               -- FK se agrega después de CREATE TABLE usuarios

    -- ====================================================================
    -- 📊 SECCIÓN: MÉTRICAS (se actualizan automáticamente)
    -- ====================================================================
    calificacion_promedio DECIMAL(3,2) DEFAULT 5.00,
    total_citas_completadas INTEGER DEFAULT 0,
    total_clientes_atendidos INTEGER DEFAULT 0,

    -- ====================================================================
    -- 🕒 SECCIÓN: LEGACY (compatibilidad)
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- [LEGACY] Usar estado en su lugar
    fecha_salida DATE,                         -- [LEGACY] Usar fecha_baja en su lugar
    motivo_inactividad TEXT,                   -- [LEGACY] Usar motivo_baja en su lugar

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ====================================================================
    -- ✅ SECCIÓN: CONSTRAINTS
    -- ====================================================================
    CONSTRAINT uk_profesionales_codigo_org UNIQUE (organizacion_id, codigo),
    CONSTRAINT uk_profesionales_email_org UNIQUE (organizacion_id, email),

    -- Validaciones de datos
    CONSTRAINT chk_profesionales_nombre CHECK (char_length(nombre_completo) >= 3),
    CONSTRAINT chk_profesionales_experiencia CHECK (años_experiencia >= 0 AND años_experiencia <= 70),
    CONSTRAINT chk_profesionales_comision CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100),
    CONSTRAINT chk_profesionales_calificacion CHECK (calificacion_promedio >= 1.00 AND calificacion_promedio <= 5.00),
    CONSTRAINT chk_profesionales_color CHECK (color_calendario ~ '^#[0-9A-Fa-f]{6}$'),

    -- Validación de baja
    CONSTRAINT chk_profesionales_baja CHECK (
        (estado = 'baja' AND fecha_baja IS NOT NULL) OR (estado != 'baja')
    ),

    -- Validación de edad
    CONSTRAINT chk_profesionales_mayor_edad CHECK (
        fecha_nacimiento IS NULL OR
        fecha_nacimiento <= CURRENT_DATE - INTERVAL '18 years'
    ),

    -- Validación de fechas
    CONSTRAINT chk_profesionales_fechas CHECK (
        fecha_baja IS NULL OR fecha_baja >= fecha_ingreso
    )
);

-- Comentarios de documentación
COMMENT ON TABLE profesionales IS
'Tabla unificada de empleados. Usa modulos_acceso para control de funcionalidades
y categorias_profesional (M:N) para clasificación flexible.';

COMMENT ON COLUMN profesionales.tipo IS
'Clasificación organizacional (operativo, administrativo, gerencial, ventas).
Solo para reportes y organigrama. NO restringe funcionalidades.';

COMMENT ON COLUMN profesionales.estado IS
'Estado laboral actual. Impacta disponibilidad y acceso al sistema.';

COMMENT ON COLUMN profesionales.modulos_acceso IS
'★ Control principal de acceso. Determina qué módulos puede usar el empleado.';

COMMENT ON COLUMN profesionales.tipo_profesional_id IS
'[LEGACY] Tipo de profesional del catálogo. Se mantiene por compatibilidad.
Para nuevas implementaciones, usar categorias_profesional (M:N).';

-- ====================================================================
-- 🧑‍💼 TABLA CLIENTES - BASE DE DATOS DE CLIENTES
-- ====================================================================
-- Almacena información completa de clientes con validaciones inteligentes
-- y soporte para métricas calculadas dinámicamente.
--
-- 🔧 CARACTERÍSTICAS DESTACADAS:
-- • Validación de email y teléfono con regex
-- • Profesional preferido para personalización
-- • Control granular de marketing
-- • Métricas calculadas dinámicamente (via joins)
-- • RLS habilitado para aislamiento por organización
-- • Validaciones CHECK para integridad de datos
-- • Constraints únicos por organización (no globales)
-- ====================================================================

CREATE TABLE clientes (
    -- 🔑 Identificación y relación
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    sucursal_id INTEGER,  -- NULL = cliente compartido, con valor = cliente exclusivo de sucursal

    -- 👤 Información personal básica
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20),                      -- OPCIONAL: Teléfono tradicional (solo si el negocio necesita llamar)

    -- 📱 Identificadores de plataformas de mensajería
    telegram_chat_id VARCHAR(50),              -- ID de Telegram (ej: "1700200086")
                                               -- Obtenido automáticamente del webhook, NO se pide al usuario
    whatsapp_phone VARCHAR(50),                -- Número WhatsApp internacional (ej: "5215512345678")
                                               -- Obtenido automáticamente del webhook de WhatsApp Business

    fecha_nacimiento DATE,

    -- 🏥 Información médica y preferencias
    profesional_preferido_id INTEGER, -- FK se agregará después de crear tabla profesionales
    notas_especiales TEXT,
    alergias TEXT,

    -- 📍 Información adicional
    direccion TEXT,
    como_conocio VARCHAR(100), -- 'referido', 'redes_sociales', 'google', 'caminando', etc.

    -- 🖼️ FOTO (Dic 2025 - Storage MinIO)
    foto_url TEXT,                              -- URL de la foto del cliente

    -- ⚙️ Control y configuración
    activo BOOLEAN DEFAULT TRUE,
    marketing_permitido BOOLEAN DEFAULT TRUE,

    -- 🕒 Timestamps de auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ Validaciones de integridad
    CONSTRAINT valid_email
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_fecha_nacimiento
        CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '5 years'),

    -- 🔒 Constraints de unicidad por organización
    CONSTRAINT unique_email_por_org
        UNIQUE(organizacion_id, email) DEFERRABLE
    -- NOTA: unique_telefono_por_org se implementa como índice único parcial en 07-indexes.sql
    -- para permitir múltiples clientes con telefono=NULL en la misma organización
);

-- ====================================================================
-- 🎯 TABLA SERVICIOS - CATÁLOGO PERSONALIZADO
-- ====================================================================
-- Catálogo de servicios específicos de cada organización con configuración
-- avanzada, compatibilidad con profesionales y control granular.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Configuración JSONB flexible por servicio
-- • Control de tipos de profesionales autorizados
-- • Validaciones de precios y tiempos
-- • Control de activación granular
-- ====================================================================

CREATE TABLE servicios (
    -- 🔑 Identificación y relaciones
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- ====================================================================
    -- 📋 SECCIÓN: INFORMACIÓN BÁSICA DEL SERVICIO
    -- ====================================================================
    nombre VARCHAR(100) NOT NULL,              -- Nombre del servicio
    descripcion TEXT,                          -- Descripción detallada
    categoria VARCHAR(50),                     -- Categoría principal (ej: "corte", "tratamiento")
    subcategoria VARCHAR(50),                  -- Subcategoría específica (ej: "barba", "facial")

    -- ====================================================================
    -- ⏰ SECCIÓN: CONFIGURACIÓN DE TIEMPO Y PRECIO
    -- ====================================================================
    duracion_minutos INTEGER NOT NULL,         -- Duración base del servicio
    precio DECIMAL(10,2) NOT NULL,             -- Precio base del servicio
    precio_minimo DECIMAL(10,2),               -- Precio mínimo permitido
    precio_maximo DECIMAL(10,2),               -- Precio máximo permitido

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN AVANZADA
    -- ====================================================================
    requiere_preparacion_minutos INTEGER DEFAULT 0,      -- Tiempo preparación pre-servicio
    tiempo_limpieza_minutos INTEGER DEFAULT 5,           -- Tiempo limpieza post-servicio
    max_clientes_simultaneos INTEGER DEFAULT 1,          -- Máximo clientes simultáneos
    color_servicio VARCHAR(7) DEFAULT '#e74c3c',         -- Color para calendario

    -- ====================================================================
    -- 🏷️ SECCIÓN: METADATOS Y ORGANIZACIÓN
    -- ====================================================================
    configuracion_especifica JSONB DEFAULT '{}',         -- Config JSON específica
                                                         -- Ej: {"requiere_cita_previa": true, "productos_incluidos": ["shampoo"]}
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],                 -- Etiquetas para búsqueda y filtros
                                                         -- Ej: ["popular", "promocion", "nuevo"]

    -- 🖼️ IMAGEN (Dic 2025 - Storage MinIO)
    imagen_url TEXT,                                      -- URL de la imagen del servicio

    -- ====================================================================
    -- 🎯 SECCIÓN: COMPATIBILIDAD CON PROFESIONALES
    -- ====================================================================
    tipos_profesional_autorizados INTEGER[] DEFAULT NULL,  -- IDs de tipos de profesional que pueden brindar este servicio (FK a tipos_profesional.id)
                                                           -- NULL = todos los profesionales de la organización

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Estado activo/inactivo

    -- ====================================================================
    -- 🕒 SECCIÓN: TIMESTAMPS DE AUDITORÍA
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de creación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de última actualización

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES DE INTEGRIDAD
    -- ====================================================================
    CONSTRAINT valid_duracion
        CHECK (duracion_minutos > 0 AND duracion_minutos <= 480),  -- Entre 1 minuto y 8 horas
    CONSTRAINT valid_precio
        CHECK (precio >= 0),
    CONSTRAINT valid_precio_minimo
        CHECK (precio_minimo IS NULL OR precio_minimo >= 0),
    CONSTRAINT valid_precio_maximo
        CHECK (precio_maximo IS NULL OR precio_maximo >= precio),
    CONSTRAINT valid_precio_rango
        CHECK (precio_minimo IS NULL OR precio_maximo IS NULL OR precio_minimo <= precio_maximo),
    CONSTRAINT valid_preparacion
        CHECK (requiere_preparacion_minutos >= 0 AND requiere_preparacion_minutos <= 120),
    CONSTRAINT valid_limpieza
        CHECK (tiempo_limpieza_minutos >= 0 AND tiempo_limpieza_minutos <= 60),
    CONSTRAINT valid_max_clientes
        CHECK (max_clientes_simultaneos > 0 AND max_clientes_simultaneos <= 20),
    CONSTRAINT valid_color_servicio
        CHECK (color_servicio ~ '^#[0-9A-Fa-f]{6}$'),  -- Formato hexadecimal válido

    -- 🔒 Constraint de unicidad por organización
    CONSTRAINT unique_servicio_por_org
        UNIQUE(organizacion_id, nombre)
);

-- ====================================================================
-- 🔗 TABLA SERVICIOS_PROFESIONALES - RELACIÓN MANY-TO-MANY
-- ====================================================================
-- Tabla de relación que define qué profesionales pueden brindar cada servicio
-- con configuraciones personalizadas por profesional.
--
-- 🎯 CASOS DE USO:
-- • Un barbero puede tener precio especial para corte VIP
-- • Un masajista senior puede cobrar más por el mismo servicio
-- • Servicios con duraciones personalizadas por profesional
-- ====================================================================

CREATE TABLE servicios_profesionales (
    -- 🔑 Identificación
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT (CRÍTICA)
    -- Se pobla automáticamente via trigger desde servicios/profesionales
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

    servicio_id INTEGER NOT NULL REFERENCES servicios(id) ON DELETE CASCADE,
    profesional_id INTEGER NOT NULL REFERENCES profesionales(id) ON DELETE CASCADE,

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN PERSONALIZADA POR PROFESIONAL
    -- ====================================================================
    precio_personalizado DECIMAL(10,2),        -- Precio específico de este profesional (override)
    duracion_personalizada INTEGER,            -- Duración específica de este profesional (override)
    notas_especiales TEXT,                     -- Notas específicas para este profesional

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONTROL
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- El profesional puede brindar este servicio

    -- ====================================================================
    -- 🕒 SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de asignación
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Fecha de última actualización

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES
    -- ====================================================================
    CONSTRAINT valid_precio_personalizado
        CHECK (precio_personalizado IS NULL OR precio_personalizado >= 0),
    CONSTRAINT valid_duracion_personalizada
        CHECK (duracion_personalizada IS NULL OR (duracion_personalizada > 0 AND duracion_personalizada <= 480)),

    -- 🔒 Constraint de unicidad
    UNIQUE(servicio_id, profesional_id)
);

-- ====================================================================
-- 🔗 AGREGAR FOREIGN KEYS DIFERIDAS
-- ====================================================================
-- Estas FKs no pudieron agregarse antes porque profesionales aún no existía.
-- Se agregan aquí después de CREATE TABLE profesionales.
-- ====================================================================

-- FK: usuarios.profesional_id → profesionales.id
ALTER TABLE usuarios
ADD CONSTRAINT fk_usuarios_profesional
FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
    ON DELETE SET NULL    -- Si se elimina profesional, SET NULL en usuario
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

-- FK: profesionales.usuario_id → usuarios.id (Nov 2025 - Modelo Unificado)
-- Permite vincular un profesional con un usuario del sistema para:
-- - Auto-asignación en POS (vendedor)
-- - Comisiones unificadas (citas + ventas)
-- - Control de acceso por módulo
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL    -- Si se elimina usuario, SET NULL en profesional
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

-- FK: clientes.profesional_preferido_id → profesionales.id
ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_profesional_preferido
FOREIGN KEY (profesional_preferido_id) REFERENCES profesionales(id)
    ON DELETE SET NULL    -- Si se elimina profesional, SET NULL en cliente
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

-- ====================================================================
-- 📱 CONSTRAINTS ÚNICOS PARA IDENTIFICADORES DE PLATAFORMAS
-- ====================================================================
-- Garantizan que un mismo telegram_chat_id o whatsapp_phone no pueda
-- registrarse múltiples veces en la misma organización.
--
-- IMPORTANTE: Los índices únicos son parciales (WHERE ... IS NOT NULL)
-- para permitir múltiples clientes con valores NULL (walk-in sin plataforma).
-- ====================================================================

ALTER TABLE clientes
ADD CONSTRAINT unique_telegram_por_org
    UNIQUE (organizacion_id, telegram_chat_id);

ALTER TABLE clientes
ADD CONSTRAINT unique_whatsapp_por_org
    UNIQUE (organizacion_id, whatsapp_phone);

-- Índices para búsquedas rápidas (se crean en 07-indexes.sql pero los documentamos aquí)
COMMENT ON COLUMN clientes.telegram_chat_id IS
'Chat ID de Telegram del cliente (ej: "1700200086"). Obtenido automáticamente del campo sender del workflow n8n. Permite identificar y contactar al cliente sin necesidad de teléfono tradicional.';

COMMENT ON COLUMN clientes.whatsapp_phone IS
'Número de teléfono WhatsApp en formato internacional (ej: "5215512345678"). Obtenido automáticamente del campo sender del webhook de WhatsApp Business API.';

COMMENT ON COLUMN clientes.telefono IS
'Teléfono tradicional (OPCIONAL). Solo se usa si el negocio necesita llamar al cliente por línea convencional. Los clientes que agendan por Telegram/WhatsApp pueden no tener este campo.';

-- ====================================================================
-- 💼 TABLAS DE NEGOCIO PRINCIPALES
-- ====================================================================
--
-- Este archivo contiene las tablas centrales para la operación del negocio:
-- profesionales, clientes, servicios y sus relaciones.
--
-- 📊 CONTENIDO:
-- • profesionales: Personal especializado que brinda servicios
-- • clientes: Base de clientes de cada organización
-- • servicios: Catálogo de servicios personalizados por organización
-- • servicios_profesionales: Relación many-to-many con configuraciones
--
-- 🔄 ORDEN DE EJECUCIÓN: #5 (Después de catalog tables)
-- 🔒 SEGURIDAD: RLS habilitado para aislamiento multi-tenant
-- ====================================================================

-- ====================================================================
-- 👷 TABLA PROFESIONALES - PERSONAL ESPECIALIZADO
-- ====================================================================
-- Almacena toda la información de los profesionales que brindan servicios
-- en cada organización, con validaciones inteligentes según industria.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Validación automática tipo_profesional vs industria_organización
-- • Email único por organización (no global)
-- • Arrays PostgreSQL para especialidades múltiples
-- • JSONB flexible para licencias y configuraciones específicas
-- • Color personalizado para calendario visual
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE profesionales (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT (CRÍTICA)
    organizacion_id INTEGER NOT NULL,           -- FK obligatoria a organizaciones
                                               -- REFERENCES organizaciones(id) ON DELETE CASCADE

    -- ====================================================================
    -- 👨‍💼 SECCIÓN: INFORMACIÓN PERSONAL
    -- ====================================================================
    nombre_completo VARCHAR(150) NOT NULL,     -- Nombre completo del profesional
    email VARCHAR(150),                        -- Email personal (único por organización)
    telefono VARCHAR(20),                      -- Teléfono de contacto
    fecha_nacimiento DATE,                     -- Para validar mayoría de edad
    documento_identidad VARCHAR(30),           -- Cédula, DNI, Pasaporte, etc.

    -- ====================================================================
    -- 🎓 SECCIÓN: INFORMACIÓN PROFESIONAL
    -- ====================================================================
    tipo_profesional tipo_profesional NOT NULL, -- Tipo específico según industria
    especialidades TEXT[] DEFAULT ARRAY[]::TEXT[], -- Array de especialidades
                                               -- Ej: ['corte_clasico', 'barba_tradicional', 'afeitado']

    licencias_profesionales JSONB DEFAULT '{}', -- Licencias y certificaciones
                                               -- Ej: {"cedula_profesional": "12345", "certificado_barberia": "ABC123"}

    años_experiencia INTEGER DEFAULT 0,        -- Años de experiencia laboral
    idiomas TEXT[] DEFAULT ARRAY['es']::TEXT[], -- Idiomas que habla
                                               -- Ej: ['es', 'en', 'fr']

    -- ====================================================================
    -- ⚙️ SECCIÓN: CONFIGURACIÓN DE TRABAJO
    -- ====================================================================
    color_calendario VARCHAR(7) DEFAULT '#3498db', -- Color hex para calendario visual
                                                   -- Ej: '#e74c3c', '#2ecc71', '#f39c12'
    biografia TEXT,                            -- Descripción profesional para clientes
    foto_url TEXT,                             -- URL de foto de perfil

    configuracion_horarios JSONB DEFAULT '{}', -- Horarios personalizados de trabajo
                                               -- Ej: {"lunes": {"inicio": "09:00", "fin": "18:00"}}

    configuracion_servicios JSONB DEFAULT '{}', -- Configuración específica de servicios
                                                -- Ej: {"tiempo_extra_limpieza": 10, "max_citas_dia": 12}

    -- ====================================================================
    -- 💰 SECCIÓN: INFORMACIÓN COMERCIAL
    -- ====================================================================
    comision_porcentaje DECIMAL(5,2) DEFAULT 0.00, -- % de comisión por servicio
                                                    -- Ej: 15.50 para 15.5%
    salario_base DECIMAL(10,2),                -- Salario base mensual (opcional)
    forma_pago VARCHAR(20) DEFAULT 'comision',  -- 'comision', 'salario', 'mixto'

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL Y ESTADO
    -- ====================================================================
    activo BOOLEAN DEFAULT TRUE,               -- Profesional activo para agendar
    disponible_online BOOLEAN DEFAULT TRUE,    -- Visible para agendamiento online
    fecha_ingreso DATE DEFAULT CURRENT_DATE,   -- Fecha de contratación
    fecha_salida DATE,                         -- Fecha de salida (si aplica)
    motivo_inactividad TEXT,                   -- Razón de inactividad temporal

    -- ====================================================================
    -- 📊 SECCIÓN: MÉTRICAS Y CALIFICACIONES
    -- ====================================================================
    calificacion_promedio DECIMAL(3,2) DEFAULT 5.00, -- Calificación promedio (1.00-5.00)
    total_citas_completadas INTEGER DEFAULT 0,  -- Contador de citas finalizadas
    total_clientes_atendidos INTEGER DEFAULT 0, -- Contador de clientes únicos

    -- ====================================================================
    -- ⏰ SECCIÓN: TIMESTAMPS
    -- ====================================================================
    creado_en TIMESTAMPTZ DEFAULT NOW(),       -- Fecha de registro
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),  -- Última modificación

    -- ====================================================================
    -- ✅ SECCIÓN: VALIDACIONES Y CONSTRAINTS
    -- ====================================================================
    CHECK (char_length(nombre_completo) >= 3),  -- Nombre mínimo 3 caracteres
    CHECK (años_experiencia >= 0 AND años_experiencia <= 70), -- Experiencia válida
    CHECK (comision_porcentaje >= 0 AND comision_porcentaje <= 100), -- Comisión válida
    CHECK (calificacion_promedio >= 1.00 AND calificacion_promedio <= 5.00), -- Rating válido
    CHECK (color_calendario ~ '^#[0-9A-Fa-f]{6}$'), -- Color hex válido
    CHECK (
        -- Solo mayores de edad (18 años)
        fecha_nacimiento IS NULL OR
        fecha_nacimiento <= CURRENT_DATE - INTERVAL '18 years'
    ),
    CHECK (
        -- Validar fecha_salida posterior a fecha_ingreso
        fecha_salida IS NULL OR fecha_salida >= fecha_ingreso
    )
);

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

    -- 👤 Información personal básica
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(20) NOT NULL,
    fecha_nacimiento DATE,

    -- 🏥 Información médica y preferencias
    profesional_preferido_id INTEGER, -- FK se agregará después de crear tabla profesionales
    notas_especiales TEXT,
    alergias TEXT,

    -- 📍 Información adicional
    direccion TEXT,
    como_conocio VARCHAR(100), -- 'referido', 'redes_sociales', 'google', 'caminando', etc.

    -- ⚙️ Control y configuración
    activo BOOLEAN DEFAULT TRUE,
    marketing_permitido BOOLEAN DEFAULT TRUE,

    -- 🕒 Timestamps de auditoría
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),

    -- ✅ Validaciones de integridad
    CONSTRAINT valid_email
        CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_telefono
        CHECK (telefono ~ '^[+]?[0-9\s\-\(\)]{7,20}$'),
    CONSTRAINT valid_fecha_nacimiento
        CHECK (fecha_nacimiento IS NULL OR fecha_nacimiento <= CURRENT_DATE - INTERVAL '5 years'),

    -- 🔒 Constraints de unicidad por organización
    CONSTRAINT unique_email_por_org
        UNIQUE(organizacion_id, email) DEFERRABLE,
    CONSTRAINT unique_telefono_por_org
        UNIQUE(organizacion_id, telefono)
);

-- ====================================================================
-- 🎯 TABLA SERVICIOS - CATÁLOGO PERSONALIZADO
-- ====================================================================
-- Catálogo de servicios específicos de cada organización con configuración
-- avanzada, compatibilidad con profesionales y control granular.
--
-- 🔧 CARACTERÍSTICAS TÉCNICAS:
-- • Herencia opcional de plantillas globales
-- • Configuración JSONB flexible por servicio
-- • Control de tipos de profesionales autorizados
-- • Validaciones de precios y tiempos
-- • Control de activación granular
-- ====================================================================

CREATE TABLE servicios (
    -- 🔑 Identificación y relaciones
    id SERIAL PRIMARY KEY,
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,
    plantilla_servicio_id INTEGER REFERENCES plantillas_servicios(id) ON DELETE SET NULL,

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

    -- ====================================================================
    -- 🎯 SECCIÓN: COMPATIBILIDAD CON PROFESIONALES
    -- ====================================================================
    tipos_profesional_autorizados tipo_profesional[] DEFAULT NULL,  -- Tipos de profesional que pueden brindar este servicio
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

-- FK: clientes.profesional_preferido_id → profesionales.id
ALTER TABLE clientes
ADD CONSTRAINT fk_clientes_profesional_preferido
FOREIGN KEY (profesional_preferido_id) REFERENCES profesionales(id)
    ON DELETE SET NULL    -- Si se elimina profesional, SET NULL en cliente
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

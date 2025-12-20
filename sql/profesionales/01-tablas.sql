-- ====================================================================
-- MÓDULO PROFESIONALES: TABLA PRINCIPAL
-- ====================================================================
-- Tabla unificada de empleados/profesionales que brinda servicios.
-- Extraído de sql/negocio/ para modularización (Dic 2025)
--
-- CONTENIDO:
-- • profesionales - Personal que brinda servicios
--
-- Dependencias: nucleo (organizaciones), core (usuarios)
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
-- ────────────────────────────────────────────────────────────────────
CREATE TABLE profesionales (
    -- 🔑 CLAVE PRIMARIA
    id SERIAL PRIMARY KEY,

    -- 🏢 RELACIÓN MULTI-TENANT (CRÍTICA)
    organizacion_id INTEGER NOT NULL REFERENCES organizaciones(id) ON DELETE CASCADE,

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
    -- 🎓 SECCIÓN: INFORMACIÓN PROFESIONAL
    -- ====================================================================
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
    -- 🗑️ SECCIÓN: SOFT DELETE (Dic 2025)
    -- ====================================================================
    eliminado_en TIMESTAMPTZ DEFAULT NULL,     -- NULL = activo, con valor = eliminado
    eliminado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

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

-- ====================================================================
-- 🔗 FOREIGN KEYS DIFERIDAS (profesionales → usuarios)
-- ====================================================================
-- Estas FKs se agregan aquí porque usuarios ya existe en nucleo.
-- ====================================================================

-- FK: usuarios.profesional_id → profesionales.id
ALTER TABLE usuarios
ADD CONSTRAINT fk_usuarios_profesional
FOREIGN KEY (profesional_id) REFERENCES profesionales(id)
    ON DELETE SET NULL    -- Si se elimina profesional, SET NULL en usuario
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

-- FK: profesionales.usuario_id → usuarios.id
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_usuario
FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
    ON DELETE SET NULL    -- Si se elimina usuario, SET NULL en profesional
    ON UPDATE CASCADE;    -- Si se actualiza ID, actualizar cascada

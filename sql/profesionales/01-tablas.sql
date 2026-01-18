-- ====================================================================
-- MÓDULO PROFESIONALES: TABLA PRINCIPAL
-- ====================================================================
-- Tabla unificada de empleados/profesionales que brinda servicios.
-- Extraído de sql/servicios/ para modularización (Dic 2025)
--
-- CONTENIDO:
-- • profesionales - Personal que brinda servicios
--
-- Dependencias: nucleo (organizaciones), core (usuarios)
-- ====================================================================

-- ====================================================================
-- 👷 TABLA PROFESIONALES - GESTIÓN UNIFICADA DE EMPLEADOS
-- ====================================================================
-- Tabla unificada de empleados/profesionales que brindan servicios.
--
-- 🔧 MODELO DE CONTROL:
-- • ROL del usuario vinculado → Define permisos y capacidad de supervisar
-- • categorias (M:N) → Especialidad, nivel, certificaciones
-- • estado → Estado laboral (activo, vacaciones, baja, etc.)
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
    numero_pasaporte VARCHAR(50),              -- Número de pasaporte (Fase 1)
    numero_seguro_social VARCHAR(50),          -- NSS, IMSS, ISSSTE (Fase 1)
    nacionalidad VARCHAR(50),                  -- País de nacionalidad (Fase 1)
    lugar_nacimiento_ciudad VARCHAR(100),      -- Ciudad de nacimiento (Fase 1)
    lugar_nacimiento_pais VARCHAR(50),         -- País de nacimiento (Fase 1)
    genero genero DEFAULT 'no_especificado',   -- Género del empleado
    direccion TEXT,                            -- Dirección de domicilio
    estado_civil VARCHAR(20),                  -- soltero, casado, divorciado, viudo, union_libre
    email_privado VARCHAR(150),                -- Email personal (Fase 1)
    telefono_privado VARCHAR(20),              -- Teléfono personal (Fase 1)
    distancia_casa_trabajo_km DECIMAL(6,2),    -- Km casa-trabajo para viáticos (Fase 1)
    hijos_dependientes INTEGER DEFAULT 0,      -- Cantidad de hijos (Fase 1)
    contacto_emergencia_nombre VARCHAR(100),   -- Nombre del contacto de emergencia
    contacto_emergencia_telefono VARCHAR(20),  -- Teléfono del contacto de emergencia

    -- ====================================================================
    -- 🏷️ SECCIÓN: CLASIFICACIÓN LABORAL
    -- ====================================================================
    -- Estado laboral y tipo de contratación del empleado.
    -- ⚠️ NOTA: La capacidad de supervisar se determina por el ROL del usuario
    -- vinculado (admin/propietario pueden supervisar, empleado no).
    -- ────────────────────────────────────────────────────────────────────
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
    motivo_baja TEXT,                          -- Razón de baja (legacy, usar motivo_salida_id)

    -- GAP-001: Motivo de salida estructurado (catálogo)
    motivo_salida_id INTEGER,                  -- FK a motivos_salida (agregada después)

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
    -- 💰 SECCIÓN: COMPENSACIÓN (Información contractual)
    -- ====================================================================
    -- NOTA: Las comisiones operativas se configuran en módulo Comisiones
    -- (tabla configuracion_comisiones) por servicio/producto específico.
    -- Estos campos son para información contractual/HR/Nómina.
    -- ────────────────────────────────────────────────────────────────────
    salario_base DECIMAL(10,2),                -- Salario base mensual (contrato)
    forma_pago VARCHAR(20) DEFAULT 'comision', -- 'comision', 'salario', 'mixto'

    -- GAP-004: Categoría de pago para nómina
    categoria_pago_id INTEGER,                 -- FK a categorias_pago (agregada después)

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONTROL DE ACCESO A MÓDULOS
    -- ====================================================================
    -- NOTA: Los permisos se gestionan via tablas normalizadas (Fase 3B):
    -- - permisos_catalogo: Catálogo de permisos disponibles
    -- - permisos_rol: Permisos por rol (plantilla)
    -- - permisos_usuario_sucursal: Override por usuario/sucursal
    -- Consultar con función: obtener_permiso(usuario_id, sucursal_id, codigo)
    -- ────────────────────────────────────────────────────────────────────

    -- ====================================================================
    -- 🔗 SECCIÓN: VINCULACIÓN CON USUARIO
    -- ====================================================================
    usuario_id INTEGER UNIQUE,                  -- Usuario del sistema vinculado
                                               -- FK se agrega después de CREATE TABLE usuarios

    -- ====================================================================
    -- 🎛️ SECCIÓN: CONFIGURACIÓN DE SISTEMA (Fase 1)
    -- ====================================================================
    zona_horaria VARCHAR(50) DEFAULT 'America/Mexico_City', -- Timezone del empleado
    responsable_rrhh_id INTEGER,               -- Usuario de RRHH asignado (aprobador)
    codigo_nip VARCHAR(10),                    -- PIN para control de asistencia
    id_credencial VARCHAR(50),                 -- ID de tarjeta/credencial física

    -- ====================================================================
    -- 📍 SECCIÓN: UBICACIÓN POR DÍA (Trabajo Híbrido) - GAP-003
    -- ====================================================================
    -- Cada empleado puede tener una ubicación diferente por día de la semana
    -- FK a ubicaciones_trabajo (agregadas después)
    -- NULL = No trabaja ese día o usa ubicación por defecto
    -- ────────────────────────────────────────────────────────────────────
    ubicacion_lunes_id INTEGER,                -- Ubicación para lunes
    ubicacion_martes_id INTEGER,               -- Ubicación para martes
    ubicacion_miercoles_id INTEGER,            -- Ubicación para miércoles
    ubicacion_jueves_id INTEGER,               -- Ubicación para jueves
    ubicacion_viernes_id INTEGER,              -- Ubicación para viernes
    ubicacion_sabado_id INTEGER,               -- Ubicación para sábado
    ubicacion_domingo_id INTEGER,              -- Ubicación para domingo

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
'Tabla unificada de empleados. Los permisos se gestionan via sistema normalizado
(permisos_catalogo, permisos_rol, permisos_usuario_sucursal).
La capacidad de supervisar se determina por el ROL del usuario vinculado.
Clasificación flexible via categorias_profesional (M:N).';

COMMENT ON COLUMN profesionales.estado IS
'Estado laboral actual. Impacta disponibilidad y acceso al sistema.';

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

-- FK: profesionales.responsable_rrhh_id → usuarios.id (Fase 1)
ALTER TABLE profesionales
ADD CONSTRAINT fk_profesionales_responsable_rrhh
FOREIGN KEY (responsable_rrhh_id) REFERENCES usuarios(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

-- ====================================================================
-- 🔗 FOREIGN KEYS DIFERIDAS - GAPS VS ODOO 19 (Enero 2026)
-- ====================================================================
-- NOTA: Las FKs a motivos_salida, categorias_pago y ubicaciones_trabajo
-- están en el archivo 11-foreign-keys-gaps.sql que se ejecuta después
-- de crear las tablas de GAPs.
-- ====================================================================

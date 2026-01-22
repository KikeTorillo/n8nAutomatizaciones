-- ====================================================================
-- SISTEMA DE ROLES DINÁMICOS
-- ====================================================================
--
-- Versión: 1.0.0
-- Fecha: Enero 2026
-- Módulo: nucleo/roles
--
-- DESCRIPCIÓN:
-- Migración del sistema de roles de ENUM hardcodeado a tabla dinámica.
-- Permite que cada organización cree roles personalizados.
--
-- CARACTERÍSTICAS:
-- • Roles de sistema (super_admin, bot) sin organizacion_id
-- • Roles default creados automáticamente para nuevas organizaciones
-- • Nivel jerárquico para determinar permisos
-- • Soporte para bypass de permisos (admin/propietario)
--
-- MIGRACIÓN:
-- 1. Crear tabla roles
-- 2. Insertar roles de sistema
-- 3. Agregar columna rol_id a usuarios (nullable)
-- 4. Crear trigger para nuevas organizaciones
-- 5. Poblar roles para organizaciones existentes
-- 6. Migrar usuarios al nuevo sistema
--
-- FASE 7 (POSTERIOR): Eliminar columna rol ENUM y tipo rol_usuario
--
-- ====================================================================

-- ====================================================================
-- TABLA: roles
-- ====================================================================
-- Catálogo de roles del sistema.
-- organizacion_id NULL = rol de sistema (super_admin, bot)
-- ====================================================================

CREATE TABLE IF NOT EXISTS roles (
    -- 🔑 IDENTIFICACIÓN
    id SERIAL PRIMARY KEY,

    -- 🏷️ CÓDIGO Y NOMBRE
    codigo VARCHAR(50) NOT NULL,                  -- 'admin', 'recepcionista', 'gerente_ventas'
    nombre VARCHAR(100) NOT NULL,                 -- Nombre para mostrar
    descripcion TEXT,                             -- Descripción del rol

    -- 🏢 ORGANIZACIÓN
    -- NULL = rol de sistema (super_admin, bot)
    organizacion_id INTEGER REFERENCES organizaciones(id) ON DELETE CASCADE,

    -- 📊 JERARQUÍA
    -- 100 = super_admin (máximo)
    -- 90 = admin
    -- 80 = propietario
    -- 50 = empleado senior (puede supervisar)
    -- 10 = empleado (default)
    -- 5 = cliente
    -- 1 = bot
    nivel_jerarquia INTEGER NOT NULL DEFAULT 10,

    -- ⚡ PERMISOS ESPECIALES
    es_rol_sistema BOOLEAN DEFAULT FALSE,         -- TRUE para super_admin, bot
    bypass_permisos BOOLEAN DEFAULT FALSE,        -- TRUE = no verificar permisos granulares
    puede_crear_usuarios BOOLEAN DEFAULT FALSE,   -- Puede invitar usuarios
    puede_modificar_permisos BOOLEAN DEFAULT FALSE, -- Puede editar permisos de otros

    -- 🎨 UI
    color VARCHAR(7) DEFAULT '#6B7280',           -- Color para badges
    icono VARCHAR(50) DEFAULT 'user',             -- Icono Lucide

    -- 📊 ESTADO
    activo BOOLEAN DEFAULT TRUE,

    -- 📅 TIMESTAMPS
    creado_en TIMESTAMPTZ DEFAULT NOW(),
    actualizado_en TIMESTAMPTZ DEFAULT NOW(),
    creado_por INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,

    -- ✅ CONSTRAINTS
    CONSTRAINT uq_roles_codigo_org UNIQUE (codigo, organizacion_id),
    CONSTRAINT chk_roles_nivel CHECK (nivel_jerarquia >= 1 AND nivel_jerarquia <= 100),
    -- Roles de sistema DEBEN tener organizacion_id NULL
    CONSTRAINT chk_roles_sistema CHECK (
        (es_rol_sistema = TRUE AND organizacion_id IS NULL) OR
        (es_rol_sistema = FALSE)
    )
);

-- Índices
CREATE INDEX idx_roles_organizacion ON roles(organizacion_id) WHERE organizacion_id IS NOT NULL;
CREATE INDEX idx_roles_codigo ON roles(codigo);
CREATE INDEX idx_roles_nivel ON roles(nivel_jerarquia);
CREATE INDEX idx_roles_activo ON roles(activo) WHERE activo = TRUE;

-- Comentarios
COMMENT ON TABLE roles IS
'Catálogo de roles del sistema. Roles con organizacion_id NULL son roles de sistema (super_admin, bot).
Cada organización puede crear roles personalizados.';

COMMENT ON COLUMN roles.codigo IS
'Identificador único del rol dentro de la organización. Formato: snake_case (ej: gerente_ventas)';

COMMENT ON COLUMN roles.nivel_jerarquia IS
'Nivel de privilegios (1-100). Mayor = más privilegios. 100=super_admin, 90=admin, 10=empleado default';

COMMENT ON COLUMN roles.bypass_permisos IS
'Si TRUE, el usuario con este rol no pasa por verificación de permisos granulares (RBAC bypass)';

COMMENT ON COLUMN roles.es_rol_sistema IS
'TRUE para roles globales (super_admin, bot). Estos roles no pertenecen a ninguna organización';


-- ====================================================================
-- DATOS INICIALES: ROLES DE SISTEMA
-- ====================================================================
-- Roles que existen independientemente de las organizaciones
-- ====================================================================

INSERT INTO roles (codigo, nombre, descripcion, organizacion_id, nivel_jerarquia, es_rol_sistema, bypass_permisos, color, icono, puede_crear_usuarios, puede_modificar_permisos) VALUES

-- Super Admin: Acceso total al sistema
('super_admin', 'Super Administrador', 'Acceso total al sistema y todas las organizaciones. Solo para equipo de plataforma.', NULL, 100, TRUE, TRUE, '#EF4444', 'shield', TRUE, TRUE),

-- Bot: Usuario de sistema para automatizaciones
('bot', 'Bot de Sistema', 'Usuario automático para integraciones y workflows n8n.', NULL, 1, TRUE, FALSE, '#6366F1', 'bot', FALSE, FALSE)

ON CONFLICT (codigo, organizacion_id) DO UPDATE SET
    nombre = EXCLUDED.nombre,
    descripcion = EXCLUDED.descripcion,
    nivel_jerarquia = EXCLUDED.nivel_jerarquia,
    es_rol_sistema = EXCLUDED.es_rol_sistema,
    bypass_permisos = EXCLUDED.bypass_permisos,
    color = EXCLUDED.color,
    icono = EXCLUDED.icono,
    actualizado_en = NOW();


-- ====================================================================
-- AGREGAR COLUMNA rol_id A USUARIOS
-- ====================================================================
-- Nueva columna nullable durante la transición
-- Se hará NOT NULL en FASE 7 (limpieza)
-- ====================================================================

-- Agregar columna si no existe
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'usuarios' AND column_name = 'rol_id'
    ) THEN
        ALTER TABLE usuarios ADD COLUMN rol_id INTEGER REFERENCES roles(id) ON DELETE RESTRICT;
    END IF;
END $$;

-- Índice para búsquedas por rol
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_id ON usuarios(rol_id);

COMMENT ON COLUMN usuarios.rol_id IS
'Referencia al rol del usuario. Durante transición coexiste con columna "rol" (ENUM).
En FASE 7 se eliminará columna "rol" y esta será NOT NULL.';


-- ====================================================================
-- AGREGAR COLUMNA rol_id A PERMISOS_ROL
-- ====================================================================
-- Nueva columna para asociar permisos a roles dinámicos
-- ====================================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'permisos_rol' AND column_name = 'rol_id'
    ) THEN
        ALTER TABLE permisos_rol ADD COLUMN rol_id INTEGER REFERENCES roles(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Índice para búsquedas
CREATE INDEX IF NOT EXISTS idx_permisos_rol_rol_id ON permisos_rol(rol_id);

-- Constraint único para evitar duplicados
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_permisos_rol_new'
    ) THEN
        -- Temporalmente permitimos duplicados hasta migración completa
        -- ALTER TABLE permisos_rol ADD CONSTRAINT uq_permisos_rol_new UNIQUE(rol_id, permiso_id);
        NULL;
    END IF;
END $$;


-- ====================================================================
-- FUNCIÓN: crear_roles_default_organizacion
-- ====================================================================
-- Crea los roles por defecto cuando se crea una nueva organización
-- ====================================================================

CREATE OR REPLACE FUNCTION crear_roles_default_organizacion(p_organizacion_id INTEGER)
RETURNS VOID AS $$
BEGIN
    -- SECURITY DEFINER permite que el trigger inserte en la tabla roles
    -- a pesar de las políticas RLS (se ejecuta con permisos del owner)
    -- Admin de organización
    INSERT INTO roles (codigo, nombre, descripcion, organizacion_id, nivel_jerarquia, bypass_permisos, color, icono, puede_crear_usuarios, puede_modificar_permisos)
    VALUES ('admin', 'Administrador', 'Acceso completo a la organización. Puede gestionar usuarios y configuraciones.', p_organizacion_id, 90, TRUE, '#F97316', 'user-cog', TRUE, TRUE)
    ON CONFLICT (codigo, organizacion_id) DO NOTHING;

    -- Propietario
    INSERT INTO roles (codigo, nombre, descripcion, organizacion_id, nivel_jerarquia, bypass_permisos, color, icono, puede_crear_usuarios, puede_modificar_permisos)
    VALUES ('propietario', 'Propietario', 'Dueño del negocio con permisos operativos completos.', p_organizacion_id, 80, TRUE, '#EAB308', 'crown', TRUE, TRUE)
    ON CONFLICT (codigo, organizacion_id) DO NOTHING;

    -- Empleado (default)
    INSERT INTO roles (codigo, nombre, descripcion, organizacion_id, nivel_jerarquia, bypass_permisos, color, icono, puede_crear_usuarios, puede_modificar_permisos)
    VALUES ('empleado', 'Empleado', 'Acceso limitado a funciones operativas según permisos asignados.', p_organizacion_id, 10, FALSE, '#22C55E', 'user', FALSE, FALSE)
    ON CONFLICT (codigo, organizacion_id) DO NOTHING;

    -- Cliente
    INSERT INTO roles (codigo, nombre, descripcion, organizacion_id, nivel_jerarquia, bypass_permisos, color, icono, puede_crear_usuarios, puede_modificar_permisos)
    VALUES ('cliente', 'Cliente', 'Acceso de autoservicio. Puede ver sus propios datos y hacer reservaciones.', p_organizacion_id, 5, FALSE, '#3B82F6', 'user-check', FALSE, FALSE)
    ON CONFLICT (codigo, organizacion_id) DO NOTHING;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION crear_roles_default_organizacion(INTEGER) IS
'Crea los 4 roles por defecto (admin, propietario, empleado, cliente) para una nueva organización.
SECURITY DEFINER permite bypass de RLS durante la creación.';


-- ====================================================================
-- TRIGGER: Crear roles automáticamente para nuevas organizaciones
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_crear_roles_organizacion()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM crear_roles_default_organizacion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trg_crear_roles_nueva_org ON organizaciones;

CREATE TRIGGER trg_crear_roles_nueva_org
    AFTER INSERT ON organizaciones
    FOR EACH ROW
    EXECUTE FUNCTION trigger_crear_roles_organizacion();


-- ====================================================================
-- POBLAR: Roles para organizaciones existentes
-- ====================================================================
-- Crear roles default para todas las organizaciones que ya existen
-- ====================================================================

DO $$
DECLARE
    org_record RECORD;
BEGIN
    FOR org_record IN SELECT id FROM organizaciones WHERE eliminado_en IS NULL
    LOOP
        PERFORM crear_roles_default_organizacion(org_record.id);
    END LOOP;
END $$;


-- ====================================================================
-- MIGRAR: Usuarios al nuevo sistema de roles
-- ====================================================================
-- Asignar rol_id basado en la columna rol (ENUM) existente
-- ====================================================================

-- Migrar usuarios con rol de sistema (super_admin, bot)
UPDATE usuarios u
SET rol_id = r.id
FROM roles r
WHERE r.codigo = u.rol::TEXT
  AND r.es_rol_sistema = TRUE
  AND u.rol_id IS NULL
  AND u.rol IN ('super_admin', 'bot');

-- Migrar usuarios de organizaciones (admin, propietario, empleado, cliente)
UPDATE usuarios u
SET rol_id = r.id
FROM roles r
WHERE r.codigo = u.rol::TEXT
  AND r.organizacion_id = u.organizacion_id
  AND u.rol_id IS NULL
  AND u.rol NOT IN ('super_admin', 'bot')
  AND u.organizacion_id IS NOT NULL;


-- ====================================================================
-- MIGRAR: Permisos de rol al nuevo sistema
-- ====================================================================
-- ACTUALIZAR permisos existentes para agregar rol_id (NO insertar nuevos)
-- ====================================================================

-- Para roles de sistema (super_admin, bot), actualizar rol_id
UPDATE permisos_rol pr
SET rol_id = r.id
FROM roles r
WHERE r.codigo = pr.rol::TEXT
  AND r.es_rol_sistema = TRUE
  AND pr.rol IN ('super_admin', 'bot')
  AND pr.rol_id IS NULL;

-- NOTA: Para roles de organización (admin, propietario, empleado, cliente)
-- Los permisos en permisos_rol son PLANTILLAS por ENUM de rol.
-- El sistema de permisos usa obtener_permiso(rol::TEXT, permiso_codigo) que funciona
-- con el código de rol. No necesitamos duplicar permisos por organización.
--
-- Durante la transición:
-- - obtener_permiso() busca por rol (ENUM) o rol_codigo (del rol_id del usuario)
-- - Los permisos existentes siguen funcionando
-- - En FASE 7 final se puede migrar completamente a rol_id


-- ====================================================================
-- VISTA: v_usuarios_con_rol
-- ====================================================================
-- Vista de compatibilidad que incluye información del rol
-- ====================================================================

CREATE OR REPLACE VIEW v_usuarios_con_rol AS
SELECT
    u.id,
    u.email,
    u.nombre,
    u.apellidos,
    u.telefono,
    u.organizacion_id,
    u.profesional_id,
    u.activo,
    u.email_verificado,
    u.ultimo_login,
    u.creado_en,
    u.actualizado_en,
    -- Información del rol (nueva)
    u.rol_id,
    r.codigo AS rol_codigo,
    r.nombre AS rol_nombre,
    r.nivel_jerarquia,
    r.bypass_permisos,
    r.es_rol_sistema,
    r.puede_crear_usuarios,
    r.puede_modificar_permisos,
    r.color AS rol_color,
    r.icono AS rol_icono,
    -- Compatibilidad con sistema anterior
    u.rol AS rol_enum  -- DEPRECATED: usar rol_codigo
FROM usuarios u
LEFT JOIN roles r ON r.id = u.rol_id;

COMMENT ON VIEW v_usuarios_con_rol IS
'Vista de usuarios con información completa del rol. Usar rol_codigo en lugar de rol_enum (deprecated).';


-- ====================================================================
-- FUNCIÓN HELPER: obtener_rol_id_por_codigo
-- ====================================================================
-- Obtiene el ID de un rol dado su código y organización
-- ====================================================================

CREATE OR REPLACE FUNCTION obtener_rol_id_por_codigo(
    p_codigo VARCHAR(50),
    p_organizacion_id INTEGER DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
    v_rol_id INTEGER;
BEGIN
    -- Buscar rol de sistema primero (si organizacion_id es NULL)
    IF p_organizacion_id IS NULL THEN
        SELECT id INTO v_rol_id
        FROM roles
        WHERE codigo = p_codigo AND es_rol_sistema = TRUE;
    ELSE
        -- Buscar rol de la organización
        SELECT id INTO v_rol_id
        FROM roles
        WHERE codigo = p_codigo AND organizacion_id = p_organizacion_id;
    END IF;

    RETURN v_rol_id;
END;
$$ LANGUAGE plpgsql STABLE;

COMMENT ON FUNCTION obtener_rol_id_por_codigo(VARCHAR, INTEGER) IS
'Obtiene el ID de un rol dado su código. Si organizacion_id es NULL, busca roles de sistema.';


-- ====================================================================
-- GRANTS
-- ====================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON roles TO saas_app;
GRANT USAGE, SELECT ON SEQUENCE roles_id_seq TO saas_app;
GRANT SELECT ON v_usuarios_con_rol TO saas_app;
GRANT EXECUTE ON FUNCTION obtener_rol_id_por_codigo(VARCHAR, INTEGER) TO saas_app;
GRANT EXECUTE ON FUNCTION crear_roles_default_organizacion(INTEGER) TO saas_app;


-- ====================================================================
-- RLS POLICIES PARA ROLES
-- ====================================================================

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

-- Roles de sistema son visibles para todos (es_rol_sistema = TRUE)
-- Roles de organización solo visibles para su organización
CREATE POLICY roles_isolation ON roles
    FOR ALL TO saas_app
    USING (
        es_rol_sistema = TRUE
        OR organizacion_id = COALESCE(
            NULLIF(current_setting('app.current_tenant_id', true), '')::INTEGER,
            0
        )
    );


-- ====================================================================
-- TRIGGER: Actualizar timestamp
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_roles_actualizado_en()
RETURNS TRIGGER AS $$
BEGIN
    NEW.actualizado_en := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_roles_updated ON roles;

CREATE TRIGGER trg_roles_updated
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_roles_actualizado_en();


-- ====================================================================
-- FIN: TABLA ROLES
-- ====================================================================

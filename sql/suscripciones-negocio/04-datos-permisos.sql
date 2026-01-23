-- ====================================================================
-- PERMISOS: MÓDULO SUSCRIPCIONES-NEGOCIO
-- ====================================================================
-- Permisos para el módulo de gestión de suscripciones SaaS.
-- Permite que cada organización gestione planes y suscripciones de sus clientes.
--
-- @module suscripciones-negocio/permisos
-- @author Nexo Team
-- @version 1.0.0
-- @date Enero 2026
-- ====================================================================

-- ====================================================================
-- CATÁLOGO DE PERMISOS
-- ====================================================================

INSERT INTO permisos_catalogo (codigo, modulo, categoria, nombre, descripcion, tipo_valor, valor_default, orden_display) VALUES

-- ========================================
-- MÓDULO: ACCESO (acceso al módulo)
-- ========================================
('acceso.suscripciones_negocio', 'acceso', 'acceso', 'Acceso a Suscripciones', 'Permite acceder al módulo de suscripciones de negocio', 'booleano', 'false', 110),

-- ========================================
-- MÓDULO: SUSCRIPCIONES-NEGOCIO
-- ========================================
-- Planes
('suscripciones_negocio.ver_planes', 'suscripciones_negocio', 'operacion', 'Ver planes', 'Permite ver planes de suscripción', 'booleano', 'true', 1000),
('suscripciones_negocio.crear_planes', 'suscripciones_negocio', 'operacion', 'Crear planes', 'Permite crear nuevos planes de suscripción', 'booleano', 'false', 1010),
('suscripciones_negocio.editar_planes', 'suscripciones_negocio', 'operacion', 'Editar planes', 'Permite modificar planes existentes', 'booleano', 'false', 1020),
('suscripciones_negocio.eliminar_planes', 'suscripciones_negocio', 'operacion', 'Eliminar planes', 'Permite eliminar planes de suscripción', 'booleano', 'false', 1030),

-- Suscripciones
('suscripciones_negocio.ver_suscripciones', 'suscripciones_negocio', 'operacion', 'Ver suscripciones', 'Permite ver suscripciones de clientes', 'booleano', 'true', 1040),
('suscripciones_negocio.crear_suscripciones', 'suscripciones_negocio', 'operacion', 'Crear suscripciones', 'Permite crear nuevas suscripciones', 'booleano', 'false', 1050),
('suscripciones_negocio.editar_suscripciones', 'suscripciones_negocio', 'operacion', 'Editar suscripciones', 'Permite modificar suscripciones existentes', 'booleano', 'false', 1060),
('suscripciones_negocio.cancelar_suscripciones', 'suscripciones_negocio', 'operacion', 'Cancelar suscripciones', 'Permite cancelar suscripciones activas', 'booleano', 'false', 1070),
('suscripciones_negocio.renovar_suscripciones', 'suscripciones_negocio', 'operacion', 'Renovar suscripciones', 'Permite renovar suscripciones manualmente', 'booleano', 'false', 1080),

-- Métricas
('suscripciones_negocio.ver_metricas', 'suscripciones_negocio', 'operacion', 'Ver métricas SaaS', 'Permite ver métricas (MRR, Churn, LTV, etc.)', 'booleano', 'false', 1090),

-- Cupones
('suscripciones_negocio.ver_cupones', 'suscripciones_negocio', 'operacion', 'Ver cupones', 'Permite ver cupones de descuento', 'booleano', 'true', 1100),
('suscripciones_negocio.gestionar_cupones', 'suscripciones_negocio', 'operacion', 'Gestionar cupones', 'Permite crear, editar y eliminar cupones', 'booleano', 'false', 1110),

-- Pagos
('suscripciones_negocio.ver_pagos', 'suscripciones_negocio', 'operacion', 'Ver pagos', 'Permite ver historial de pagos', 'booleano', 'true', 1120),
('suscripciones_negocio.registrar_pagos', 'suscripciones_negocio', 'operacion', 'Registrar pagos', 'Permite registrar pagos manuales', 'booleano', 'false', 1130),
('suscripciones_negocio.reembolsar_pagos', 'suscripciones_negocio', 'operacion', 'Reembolsar pagos', 'Permite procesar reembolsos', 'booleano', 'false', 1140)

ON CONFLICT (codigo) DO NOTHING;

-- ====================================================================
-- ASIGNAR PERMISOS A ROLES DEFAULT
-- ====================================================================
-- Cuando se crea una organización, se crean roles default (admin, propietario, etc.)
-- Esta función asigna permisos de suscripciones a esos roles.
-- ====================================================================

CREATE OR REPLACE FUNCTION asignar_permisos_suscripciones_a_rol(
    p_rol_id INTEGER,
    p_nivel_jerarquia INTEGER
)
RETURNS VOID AS $$
DECLARE
    v_permiso RECORD;
    v_valor BOOLEAN;
BEGIN
    -- Iterar sobre los permisos del módulo suscripciones_negocio
    FOR v_permiso IN
        SELECT id, codigo, valor_default
        FROM permisos_catalogo
        WHERE modulo IN ('suscripciones_negocio')
           OR codigo = 'acceso.suscripciones_negocio'
    LOOP
        -- Determinar valor según nivel jerárquico
        -- nivel >= 80 (admin/propietario): todos los permisos
        -- nivel >= 50 (gerente): permisos de lectura + algunos de escritura
        -- nivel < 50 (empleado): solo permisos de lectura básicos

        IF p_nivel_jerarquia >= 80 THEN
            -- Admin/Propietario: todos los permisos
            v_valor := TRUE;
        ELSIF p_nivel_jerarquia >= 50 THEN
            -- Gerente: lectura + algunos de escritura
            v_valor := v_permiso.codigo IN (
                'acceso.suscripciones_negocio',
                'suscripciones_negocio.ver_planes',
                'suscripciones_negocio.ver_suscripciones',
                'suscripciones_negocio.crear_suscripciones',
                'suscripciones_negocio.editar_suscripciones',
                'suscripciones_negocio.ver_metricas',
                'suscripciones_negocio.ver_cupones',
                'suscripciones_negocio.ver_pagos'
            );
        ELSE
            -- Empleado: solo lectura básica
            v_valor := v_permiso.codigo IN (
                'acceso.suscripciones_negocio',
                'suscripciones_negocio.ver_planes',
                'suscripciones_negocio.ver_suscripciones',
                'suscripciones_negocio.ver_cupones',
                'suscripciones_negocio.ver_pagos'
            );
        END IF;

        -- Insertar permiso si no existe (valor como jsonb)
        IF NOT EXISTS (
            SELECT 1 FROM permisos_rol
            WHERE rol_id = p_rol_id AND permiso_id = v_permiso.id
        ) THEN
            INSERT INTO permisos_rol (rol_id, permiso_id, valor)
            VALUES (p_rol_id, v_permiso.id, to_jsonb(v_valor));
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================
-- ASIGNAR PERMISOS A ROLES EXISTENTES
-- ====================================================================
-- Para organizaciones que ya existen, asignar permisos a sus roles.
-- ====================================================================

DO $$
DECLARE
    v_rol RECORD;
BEGIN
    -- Iterar sobre todos los roles de organizaciones (no roles de sistema)
    FOR v_rol IN
        SELECT id, nivel_jerarquia
        FROM roles
        WHERE organizacion_id IS NOT NULL
          AND activo = TRUE
    LOOP
        PERFORM asignar_permisos_suscripciones_a_rol(v_rol.id, v_rol.nivel_jerarquia);
    END LOOP;

    RAISE NOTICE 'Permisos de suscripciones asignados a roles existentes';
END $$;

-- ====================================================================
-- TRIGGER: Asignar permisos cuando se cree un nuevo rol
-- ====================================================================
-- Modificar el trigger existente o crear uno nuevo para incluir permisos de suscripciones.
-- ====================================================================

CREATE OR REPLACE FUNCTION trigger_asignar_permisos_suscripciones_nuevo_rol()
RETURNS TRIGGER AS $$
BEGIN
    -- Solo para roles de organización (no roles de sistema)
    IF NEW.organizacion_id IS NOT NULL THEN
        PERFORM asignar_permisos_suscripciones_a_rol(NEW.id, NEW.nivel_jerarquia);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Crear trigger si no existe
DROP TRIGGER IF EXISTS trg_asignar_permisos_suscripciones ON roles;
CREATE TRIGGER trg_asignar_permisos_suscripciones
    AFTER INSERT ON roles
    FOR EACH ROW
    EXECUTE FUNCTION trigger_asignar_permisos_suscripciones_nuevo_rol();

-- ====================================================================
-- VERIFICACIÓN
-- ====================================================================
DO $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM permisos_catalogo
    WHERE modulo = 'suscripciones_negocio' OR codigo = 'acceso.suscripciones_negocio';

    RAISE NOTICE 'Permisos de suscripciones-negocio registrados: %', v_count;
END $$;
